window.UACIcons?.replace(document);
const $ = (s) => document.querySelector(s);
let activeTab = null, session = null, currentState = null, workflows = [], baseSettings = {};
let autoEnableAttempted = false;
const number = n => Number(n || 0).toLocaleString();

async function send(action, data = {}) {
  if (!session?.targetTabId) throw new Error('Enable the extension on a tab first.');
  return chrome.tabs.sendMessage(session.targetTabId, { type: action, ...data });
}
function notice(text, error = false) { $('#notice').textContent = text; $('#notice').classList.toggle('error', error); }
function render() {
  const enabled = Boolean(session?.targetTabId && session.targetTabId === activeTab?.id);
  const targetBadge = $('#target-badge');
  targetBadge.textContent = enabled ? 'Enabled on this tab' : session?.targetTabId ? 'Another tab selected' : 'Not enabled';
  targetBadge.classList.toggle('enabled', enabled);
  $('#connect span').textContent = enabled ? 'Show / reconnect widget' : 'Enable on this tab';
  $('#connect').disabled = false;
  const status = currentState?.status || session?.status || 'stopped';
  $('#status-text').textContent = status[0].toUpperCase() + status.slice(1);
  $('#status-dot').className = `status-dot ${status}`;
  $('#workflow-name').textContent = currentState?.workflowName || session?.workflowName || 'No workflow';
  const hasTarget = Boolean(session?.targetTabId);
  $('#start').disabled = !hasTarget || status === 'running';
  const selectedWorkflow = workflows.find(w => w.id === $('#workflow').value) || workflows[0];
  $('#run-workflow').disabled = !hasTarget || status === 'running' || !selectedWorkflow || !Array.isArray(selectedWorkflow.nodes) || selectedWorkflow.nodes.length === 0;
  $('#pause').disabled = !hasTarget || status !== 'running';
  $('#stop').disabled = !hasTarget || status === 'stopped';
  $('#points').textContent = number(currentState?.points?.length || 0);
  $('#clicks').textContent = number(currentState?.clickCount ?? session?.clickCount);
  $('#speed').textContent = `${Number(baseSettings.globalIntervalOverride ?? baseSettings.defaultInterval ?? 500)} ms`;
  $('#runs').textContent = number(currentState?.runCount ?? session?.runCount);
  if (!currentState?.workflowName && !session?.workflowName) $('#workflow-name').textContent = 'Quick Click';
}
async function enableTab(tab, silent = false) {
  if (!tab?.id || !/^https?:/.test(tab.url || '')) throw new Error('Open a regular http or https webpage before using Ultimate Autoclicker.');
  const latest = (await chrome.runtime.sendMessage({ type: 'UAC_GET_SESSION' })).session;
  if (['running', 'paused'].includes(latest?.status) && latest.targetTabId !== tab.id) {
    throw new Error('Stop the workflow on the previously selected tab before switching pages.');
  }
  const changedTarget = latest?.targetTabId !== tab.id;
  if (changedTarget) {
    const target = await chrome.runtime.sendMessage({ type: 'UAC_SET_TARGET', tabId: tab.id });
    if (!target?.ok) throw new Error(target?.error || 'Could not select this page.');
  }
  let existing = null;
  try { existing = await chrome.tabs.sendMessage(tab.id, { type: 'UAC_GET_STATE' }); } catch (_) {}
  if (existing?.ok && existing.state?.version !== '1.2.5') {
    throw new Error('This page still has an older extension script loaded. Reload this webpage once, then click the extension icon again.');
  }
  if (!existing?.ok) {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['assets/uac-icons.js', 'content/content.js', 'content/floating-control.js'] });
    const ready = await chrome.tabs.sendMessage(tab.id, { type: 'UAC_INIT' });
    if (!ready?.ok) throw new Error(ready?.error || 'The page script could not initialize. Reload the webpage and try again.');
  } else if (changedTarget) {
    const ready = await chrome.tabs.sendMessage(tab.id, { type: 'UAC_INIT' });
    if (!ready?.ok) throw new Error(ready?.error || 'The page script could not initialize.');
  } else {
    // Clicking the toolbar icon again reopens a dismissed control without
    // resetting the existing points or interrupting the current run.
    await chrome.tabs.sendMessage(tab.id, { type: 'UAC_SHOW_FLOATING' });
  }
  if (!silent) notice('Ready. The floating control is available on this page.');
}
async function refresh() {
  const [tabs, base] = await Promise.all([chrome.tabs.query({ active: true, lastFocusedWindow: true }), chrome.runtime.sendMessage({ type: 'UAC_GET_SESSION' })]);
  activeTab = tabs[0] || null; session = base.session; workflows = base.workflows || []; baseSettings = base.settings || {};
  $('#tab-title').textContent = activeTab?.title || 'No page selected';
  $('#tab-url').textContent = activeTab?.url || 'Open a normal website to use the extension.';
  $('#workflow').innerHTML = workflows.map(w => `<option value="${w.id}">${escapeHtml(w.name)}</option>`).join('') || '<option value="">No workflows</option>';
  const last = await chrome.storage.local.get(['uacSelectedWorkflow']);
  if (last.uacSelectedWorkflow && workflows.some(w => w.id === last.uacSelectedWorkflow)) $('#workflow').value = last.uacSelectedWorkflow;

  // Clicking the toolbar icon grants activeTab access. Attach the widget on this
  // page immediately, matching the reference's click-icon → widget → Add → Play flow.
  if (!autoEnableAttempted) {
    autoEnableAttempted = true;
    if (/^https?:/.test(activeTab?.url || '')) {
      if (session?.targetTabId !== activeTab.id && !['running', 'paused'].includes(session?.status)) {
        try { await enableTab(activeTab, true); return refresh(); }
        catch (error) { notice(error.message || 'Could not enable this page.', true); }
      } else if (session?.targetTabId === activeTab.id) {
        try {
          const existing = await chrome.tabs.sendMessage(activeTab.id, { type: 'UAC_GET_STATE' });
          if (!existing?.ok || existing.state?.version !== '1.2.5') {
            throw new Error('This page still has an older extension script loaded. Reload this webpage once, then click the extension icon again.');
          }
          await chrome.tabs.sendMessage(activeTab.id, { type: 'UAC_SHOW_FLOATING' });
        } catch (error) {
          if (!['running', 'paused'].includes(session?.status) && !String(error?.message || '').includes('older extension script')) {
            try { await enableTab(activeTab, true); return refresh(); }
            catch (reconnectError) { notice(reconnectError.message || 'Could not reconnect this page.', true); }
          } else notice(error.message || 'Could not reopen the floating control.', true);
        }
      }
    }
  }
  if (session.targetTabId) {
    try { const response = await chrome.tabs.sendMessage(session.targetTabId, { type: 'UAC_GET_STATE' }); currentState = response?.state || null; }
    catch (_) { currentState = null; }
  }
  if (currentState?.lastError) notice(currentState.lastError, true);
  else if (session.lastError) notice(session.lastError, true);
  else if (session.targetTabId && session.targetTabId === activeTab?.id) notice('This page is enabled. Use the floating panel or the controls below.');
  else if (session.targetTabId) notice('A different tab is selected. Stop its workflow before enabling another page.');
  else notice('Only the tab you explicitly enable can be controlled.');
  render();
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
async function openPage(path) { await chrome.tabs.create({ url: chrome.runtime.getURL(path) }); }

$('#connect').addEventListener('click', async () => {
  try { await enableTab(activeTab); await refresh(); }
  catch (error) { notice(error.message || 'Could not enable on this page.', true); }
});
$('#start').addEventListener('click', async () => {
  try {
    const response = await send('UAC_START_WORKFLOW');
    if (!response?.ok) throw new Error(response?.error || 'Could not start point clicking.');
    notice('Quick click started. The enabled points will run in placement order.'); await refresh();
  } catch (error) { notice(error.message, true); }
});
$('#run-workflow').addEventListener('click', async () => {
  try {
    const workflow = workflows.find(w => w.id === $('#workflow').value) || workflows[0];
    if (!workflow || !workflow.nodes?.length) throw new Error('Add actions in Timeline before running a workflow.');
    await chrome.storage.local.set({ uacSelectedWorkflow: workflow.id });
    const response = await send('UAC_START_WORKFLOW', { workflow });
    if (!response?.ok) throw new Error(response?.error || 'Could not run Timeline workflow.');
    notice(`Timeline workflow “${workflow.name}” started.`); await refresh();
  } catch (error) { notice(error.message, true); }
});
$('#pause').addEventListener('click', async () => { try { await send('UAC_PAUSE'); notice('Workflow paused. Select Start to resume.'); await refresh(); } catch(e) { notice(e.message, true); } });
$('#stop').addEventListener('click', async () => { try { await send('UAC_STOP'); notice('Workflow stopped.'); await refresh(); } catch(e) { notice(e.message, true); } });
$('#workflow').addEventListener('change', async e => { await chrome.storage.local.set({ uacSelectedWorkflow: e.target.value }); render(); });
$('#add-point').addEventListener('click', async () => { try { if (activeTab?.id !== session?.targetTabId) throw new Error('Switch to the selected target tab before capturing a point.'); const r = await send('UAC_PICK_POINT', { name: `Point ${(currentState?.points?.length || 0) + 1}` }); if (!r?.ok) throw new Error(r?.error); window.close(); } catch(e) { notice(e.message, true); } });
$('#manage').addEventListener('click', async () => { try { await send('UAC_SHOW_FLOATING'); window.close(); } catch(e) { notice(e.message, true); } });
$('#timeline').addEventListener('click', () => openPage('timeline/index.html'));
$('#open-timeline').addEventListener('click', () => openPage('timeline/index.html'));
$('#settings').addEventListener('click', () => openPage('settings/index.html'));
$('#website').addEventListener('click', () => openPage('site/index.html'));
$('#reset-stats').addEventListener('click', async () => { try { await send('UAC_RESET_STATS'); notice('Statistics reset.'); await refresh(); } catch(e) { notice(e.message, true); } });
refresh().catch(error => notice(error.message || 'Could not load extension status.', true));
