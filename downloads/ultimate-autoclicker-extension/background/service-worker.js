const DEFAULT_SETTINGS = {
  theme: 'system', language: 'en', defaultInterval: 500, defaultButton: 'left',
  defaultClickCount: 1, defaultClickMode: 'limited', speedPreset: 'normal', floatingSide: 'right',
  floatingCompact: true, floatingHidden: false, floatingMode: 'mini', floatingOpacity: 100,
  startup: 'compact', autoHide: false, humanize: false, humanizePercent: 10, cursorMode: false,
  floatingPosition: null,
  shortcuts: { start: 'Alt+X', pause: 'Alt+Shift+P', stop: 'Alt+Shift+X', addPoint: 'Alt+Z', toggle: 'Alt+C' }
};

async function getSession() {
  const data = await chrome.storage.local.get(['uacSession', 'uacSettings', 'uacWorkflows']);
  return {
    session: data.uacSession || { targetTabId: null, status: 'stopped', clickCount: 0, runCount: 0, cycleCount: 0, workflowName: 'Quick Click' },
    settings: { ...DEFAULT_SETTINGS, ...(data.uacSettings || {}) },
    workflows: Array.isArray(data.uacWorkflows) ? data.uacWorkflows : []
  };
}

async function updateSession(patch) {
  const { session } = await getSession();
  const next = { ...session, ...patch, updatedAt: Date.now() };
  await chrome.storage.local.set({ uacSession: next });
  return next;
}

async function messageTarget(message) {
  const { session } = await getSession();
  if (!Number.isInteger(session.targetTabId)) throw new Error('Enable Ultimate Autoclicker on a tab first.');
  try {
    return await chrome.tabs.sendMessage(session.targetTabId, message);
  } catch (_) {
    await updateSession({ targetTabId: null, status: 'stopped', lastError: 'The selected page was refreshed or closed. Enable the extension on the page again.' });
    throw new Error('The selected page is not connected. Open the extension popup and enable this tab again.');
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (message?.type === 'UAC_GET_TAB_DATA') {
        const tabId = sender.tab?.id;
        if (!Number.isInteger(tabId)) throw new Error('This request must come from a webpage tab.');
        const stored = await chrome.storage.local.get(['uacPointsByTab', 'uacTabPageUrls', 'uacSettings']);
        const key = String(tabId);
        const currentUrl = sender.tab.url || '';
        const knownUrl = stored.uacTabPageUrls?.[key];
        const pointsMap = stored.uacPointsByTab || {};
        if (knownUrl && currentUrl && knownUrl !== currentUrl) delete pointsMap[key];
        const urls = { ...(stored.uacTabPageUrls || {}), [key]: currentUrl };
        await chrome.storage.local.set({ uacPointsByTab: pointsMap, uacTabPageUrls: urls });
        const points = Array.isArray(pointsMap[key]) ? pointsMap[key] : [];
        sendResponse({
          ok: true,
          points,
          clickCount: points.reduce((sum, point) => sum + (Number(point.count) || 0), 0),
          settings: { ...DEFAULT_SETTINGS, ...(stored.uacSettings || {}) }
        });
        return;
      }

      if (message?.type === 'UAC_SAVE_TAB_POINTS') {
        const tabId = sender.tab?.id;
        if (!Number.isInteger(tabId)) throw new Error('This request must come from a webpage tab.');
        const stored = await chrome.storage.local.get(['uacPointsByTab', 'uacTabPageUrls']);
        const key = String(tabId);
        const pointsMap = stored.uacPointsByTab || {};
        const list = Array.isArray(message.points) ? message.points.slice(0, 100) : [];
        pointsMap[key] = list;
        const urls = { ...(stored.uacTabPageUrls || {}), [key]: sender.tab.url || '' };
        await chrome.storage.local.set({ uacPointsByTab: pointsMap, uacTabPageUrls: urls });
        sendResponse({ ok: true });
        return;
      }

      if (message?.type === 'UAC_GET_TARGET_DATA') {
        const { session } = await getSession();
        const stored = await chrome.storage.local.get(['uacPointsByTab']);
        const points = session.targetTabId ? (stored.uacPointsByTab?.[String(session.targetTabId)] || []) : [];
        sendResponse({ ok: true, points });
        return;
      }

      if (message?.type === 'UAC_OPEN_PAGE') {
        const path = String(message.path || '');
        if (!/^((timeline|settings)\/index\.html)$/.test(path)) throw new Error('Invalid extension page.');
        await chrome.tabs.create({ url: chrome.runtime.getURL(path) });
        sendResponse({ ok: true });
        return;
      }

      if (message?.type === 'UAC_GET_SESSION') {
        sendResponse({ ok: true, ...(await getSession()) });
        return;
      }

      if (message?.type === 'UAC_RUN_WORKFLOW' || message?.type === 'UAC_CONTROL_SELECTED_TAB') {
        const extensionRoot = chrome.runtime.getURL('');
        if (!String(sender.url || '').startsWith(extensionRoot)) throw new Error('This control is available from Ultimate Autoclicker pages only.');
        const { session } = await getSession();
        if (!Number.isInteger(session.targetTabId)) throw new Error('Enable Ultimate Autoclicker on a webpage first.');
        let targetMessage;
        if (message.type === 'UAC_RUN_WORKFLOW') {
          if (!message.workflow || !Array.isArray(message.workflow.nodes) || !message.workflow.nodes.length) throw new Error('Add at least one action to this Timeline before running it.');
          targetMessage = { type: 'UAC_START_WORKFLOW', workflow: message.workflow };
        } else {
          const allowed = ['UAC_PAUSE', 'UAC_STOP'];
          if (!allowed.includes(message.action)) throw new Error('Unsupported target control.');
          targetMessage = { type: message.action };
        }
        const result = await chrome.tabs.sendMessage(session.targetTabId, targetMessage);
        if (!result?.ok) throw new Error(result?.error || 'The selected page could not run this workflow.');
        sendResponse({ ok: true, state: result.state || null });
        return;
      }

      if (message?.type === 'UAC_SET_TARGET') {
        if (!Number.isInteger(message.tabId)) throw new Error('Invalid target tab.');
        const current = (await getSession()).session;
        if (['running', 'paused'].includes(current.status) && current.targetTabId !== message.tabId) {
          throw new Error('Stop the active workflow before choosing another tab.');
        }
        if (Number.isInteger(current.targetTabId) && current.targetTabId !== message.tabId) {
          try { await chrome.tabs.sendMessage(current.targetTabId, { type: 'UAC_DEACTIVATE' }); } catch (_) {}
        }
        const tab = await chrome.tabs.get(message.tabId);
        const stored = await chrome.storage.local.get(['uacPointsByTab', 'uacTabPageUrls']);
        const key = String(message.tabId);
        const oldUrl = stored.uacTabPageUrls?.[key];
        const nextUrl = tab.url || '';
        if (oldUrl && nextUrl && oldUrl !== nextUrl) {
          const map = stored.uacPointsByTab || {};
          delete map[key];
          await chrome.storage.local.set({ uacPointsByTab: map });
        }
        await chrome.storage.local.set({ uacTabPageUrls: { ...(stored.uacTabPageUrls || {}), [key]: nextUrl } });
        const next = await updateSession({ targetTabId: message.tabId, status: 'stopped', lastError: null });
        sendResponse({ ok: true, session: next });
        return;
      }

      if (message?.type === 'UAC_CONTENT_STATE') {
        const tabId = sender.tab?.id;
        const current = (await getSession()).session;
        if (Number.isInteger(tabId) && current.targetTabId === tabId) {
          const next = await updateSession({
            status: message.status || current.status,
            clickCount: Number.isFinite(message.clickCount) ? message.clickCount : current.clickCount,
            runCount: Number.isFinite(message.runCount) ? message.runCount : current.runCount,
            cycleCount: Number.isFinite(message.cycleCount) ? message.cycleCount : current.cycleCount,
            workflowName: message.workflowName || current.workflowName,
            lastError: message.lastError || null
          });
          sendResponse({ ok: true, session: next });
        } else sendResponse({ ok: true, ignored: true });
        return;
      }

      if (message?.type === 'UAC_COMMAND') {
        const { session } = await getSession();
        if (sender.tab?.id && session.targetTabId !== sender.tab.id) {
          throw new Error('Enable this page from the extension popup before controlling it.');
        }
        const result = await messageTarget({ ...message, type: message.action });
        sendResponse(result && typeof result === 'object' ? result : { ok: true, result });
        return;
      }

      sendResponse({ ok: false, error: 'Unknown message.' });
    } catch (error) {
      sendResponse({ ok: false, error: error?.message || 'Unexpected extension error.' });
    }
  })();
  return true;
});

chrome.commands.onCommand.addListener(async command => {
  const actions = {
    'start-or-resume': 'UAC_TOGGLE_START',
    'pause-workflow': 'UAC_PAUSE',
    'stop-workflow': 'UAC_STOP',
    'toggle-floating-control': 'UAC_TOGGLE_FLOATING'
  };
  const action = actions[command];
  if (!action) return;
  try { await messageTarget({ type: action }); } catch (_) {}
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status !== 'loading' && !changeInfo.url) return;
  const { session } = await getSession();
  const stored = await chrome.storage.local.get(['uacPointsByTab', 'uacTabPageUrls']);
  const key = String(tabId);
  const oldUrl = stored.uacTabPageUrls?.[key];
  const newUrl = changeInfo.url || oldUrl || '';
  if (changeInfo.url && oldUrl && newUrl !== oldUrl) {
    const pointsMap = stored.uacPointsByTab || {};
    delete pointsMap[key];
    await chrome.storage.local.set({ uacPointsByTab: pointsMap });
  }
  if (changeInfo.url) {
    await chrome.storage.local.set({ uacTabPageUrls: { ...(stored.uacTabPageUrls || {}), [key]: newUrl } });
  }
  if (session.targetTabId === tabId && changeInfo.status === 'loading') {
    await updateSession({ targetTabId: null, status: 'stopped', lastError: 'The page reloaded or changed. Enable this tab again; points are restored when it is the same page.' });
  }
});

chrome.tabs.onRemoved.addListener(async tabId => {
  const { session } = await getSession();
  if (session.targetTabId === tabId) await updateSession({ targetTabId: null, status: 'stopped', lastError: 'The selected tab was closed.' });
  const stored = await chrome.storage.local.get(['uacPointsByTab', 'uacTabPageUrls']);
  const pointsMap = stored.uacPointsByTab || {};
  const urls = stored.uacTabPageUrls || {};
  delete pointsMap[String(tabId)]; delete urls[String(tabId)];
  await chrome.storage.local.set({ uacPointsByTab: pointsMap, uacTabPageUrls: urls });
});

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(['uacSettings', 'uacWorkflows', 'uacSession']);
  if (!data.uacSettings) await chrome.storage.local.set({ uacSettings: DEFAULT_SETTINGS });
  if (!Array.isArray(data.uacWorkflows)) {
    await chrome.storage.local.set({ uacWorkflows: [{ id: crypto.randomUUID(), name: 'Default workflow', updatedAt: Date.now(), nodes: [] }] });
  }
  if (!data.uacSession) await chrome.storage.local.set({ uacSession: { targetTabId: null, status: 'stopped', clickCount: 0, runCount: 0, cycleCount: 0, workflowName: 'Quick Click' } });
});
