(() => {
  if (window.__UAC_CONTENT_READY__) return;
  window.__UAC_CONTENT_READY__ = true;

  const MAX_POINTS = 100;
  const APP_VERSION = '1.2.5';
  const state = {
    enabled: false,
    points: [],
    status: 'stopped',
    clickCount: 0,
    runCount: 0,
    cycleCount: 0,
    workflowName: 'Default workflow',
    lastError: null,
    controller: null,
    currentRun: null,
    progressTimer: null,
    pauseRequested: false,
    resumeWaiters: [],
    runClickCount: 0,
    mode: 'basic',
    settings: {},
    cursor: { x: Math.round(innerWidth / 2), y: Math.round(innerHeight / 2) },
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : min));
  const uid = () => crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const abortError = () => new DOMException('The workflow was stopped.', 'AbortError');
  const contextExpiredError = () => new Error('Extension context đã hết hiệu lực do extension vừa được cập nhật hoặc tải lại. Hãy tải lại tab này (F5) để kết nối lại.');
  async function runtimeMessage(message) {
    try {
      const runtime = globalThis.chrome?.runtime;
      if (!runtime?.id || typeof runtime.sendMessage !== 'function') throw contextExpiredError();
      return await runtime.sendMessage(message);
    } catch (error) {
      if (/extension context invalidated|context.*invalidated|receiving end does not exist/i.test(String(error?.message || error))) throw contextExpiredError();
      throw error;
    }
  }

  function normalizePoint(input = {}) {
    const pageX = Number.isFinite(Number(input.pageX)) ? Number(input.pageX)
      : clamp(input.x ?? 0, 0, Math.max(0, innerWidth)) + scrollX;
    const pageY = Number.isFinite(Number(input.pageY)) ? Number(input.pageY)
      : clamp(input.y ?? 0, 0, Math.max(0, innerHeight)) + scrollY;
    return {
      id: String(input.id || uid()),
      name: String(input.name || `Point ${state.points.length + 1}`).trim().slice(0, 48),
      pageX: Math.max(0, pageX),
      pageY: Math.max(0, pageY),
      x: pageX - scrollX,
      y: pageY - scrollY,
      button: ['left', 'right', 'middle'].includes(input.button) ? input.button : (state.settings.defaultButton || 'left'),
      clickCount: clamp(input.clickCount ?? state.settings.defaultClickCount ?? 1, 1, 3),
      enabled: input.enabled !== false,
      count: clamp(input.count ?? 0, 0, Number.MAX_SAFE_INTEGER),
      interval: clamp(input.interval ?? 0, 0, 60000),
    };
  }

  function refreshPointViewport(point) {
    point.x = point.pageX - scrollX;
    point.y = point.pageY - scrollY;
    return point;
  }

  function snapshot() {
    return {
      version: APP_VERSION,
      points: state.points.map(point => ({ ...point })),
      status: state.status,
      clickCount: state.clickCount,
      runCount: state.runCount,
      cycleCount: state.cycleCount,
      workflowName: state.workflowName,
      lastError: state.lastError,
      mode: state.mode,
      settings: { ...state.settings },
    };
  }

  function notify(error = null) {
    if (error) state.lastError = String(error);
    else if (state.status === 'running') state.lastError = null;
    const data = snapshot();
    runtimeMessage({
      type: 'UAC_CONTENT_STATE',
      status: state.status,
      clickCount: state.clickCount,
      runCount: state.runCount,
      cycleCount: state.cycleCount,
      workflowName: state.workflowName,
      lastError: state.lastError,
    }).catch(() => {});
    window.dispatchEvent(new CustomEvent('uac:state', { detail: data }));
  }

  function savePoints() {
    runtimeMessage({ type: 'UAC_SAVE_TAB_POINTS', points: state.points }).catch(() => {});
    window.dispatchEvent(new CustomEvent('uac:points', { detail: snapshot() }));
  }

  // Persist counters in small batches. Writing to chrome.storage after every
  // synthetic click can throttle or overwhelm fast workflows.
  function scheduleProgressFlush() {
    if (state.progressTimer !== null) return;
    state.progressTimer = window.setTimeout(() => {
      state.progressTimer = null;
      savePoints();
      notify();
    }, 150);
  }

  function flushProgress() {
    if (state.progressTimer !== null) {
      clearTimeout(state.progressTimer);
      state.progressTimer = null;
      savePoints();
    }
  }

  async function checkpoint(signal) {
    while (state.pauseRequested) {
      if (signal.aborted) throw abortError();
      await new Promise(resolve => state.resumeWaiters.push(resolve));
    }
    if (signal.aborted) throw abortError();
  }

  async function wait(ms, signal) {
    let remaining = Math.max(0, Number(ms) || 0);
    while (remaining > 0) {
      await checkpoint(signal);
      const started = performance.now();
      await new Promise((resolve, reject) => {
        let timer;
        const clean = () => signal.removeEventListener('abort', onAbort);
        const onAbort = () => { clearTimeout(timer); clean(); reject(abortError()); };
        timer = setTimeout(() => { clean(); resolve(); }, Math.max(1, Math.min(remaining, 1000)));
        signal.addEventListener('abort', onAbort, { once: true });
        if (signal.aborted) onAbort();
      });
      remaining = Math.max(0, remaining - (performance.now() - started));
    }
    await checkpoint(signal);
  }

  function intervalFor(base) {
    const interval = clamp(base ?? state.settings.defaultInterval ?? 500, 1, 60000);
    if (!state.settings.humanize) return interval;
    const spread = clamp(state.settings.humanizePercent ?? 10, 0, 50) / 100;
    return Math.max(1, Math.round(interval * (1 + ((Math.random() * 2) - 1) * spread)));
  }

  function getPageTarget(point) {
    // Click points intentionally use fixed page coordinates, matching the reference
    // workflow. Resolve the current element at that position on every click.
    const x = point.pageX - scrollX;
    const y = point.pageY - scrollY;
    if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return null;
    let target = document.elementFromPoint(x, y);
    // Resolve open shadow roots when the hit target is a web-component host.
    while (target?.shadowRoot?.elementFromPoint) {
      const inner = target.shadowRoot.elementFromPoint(x, y);
      if (!inner || inner === target) break;
      target = inner;
    }
    return target;
  }

  function withOverlayHidden(callback) {
    const ui = document.querySelector('uac-root');
    const previous = ui?.style.display;
    if (ui) ui.style.display = 'none';
    try { return callback(); }
    finally { if (ui) ui.style.display = previous || ''; }
  }

  function dispatchOne(point, buttonOverride = null) {
    if (document.hidden) {
      throw new Error('The target page is hidden. Keep this tab in the foreground to run coordinate-based click points.');
    }
    const x = point.pageX - scrollX;
    const y = point.pageY - scrollY;
    const target = withOverlayHidden(() => getPageTarget(point));
    // The page body/document can be a valid coordinate target, e.g. clicking
    // an empty area. Do not reject it just because it has no child control.
    if (!target || !target.isConnected) {
      throw new Error(`${point.name || 'Click point'}: no page target is available at this position. Move the marker and try again.`);
    }
    if (target.closest?.('uac-root')) throw new Error('Choose a page position outside the floating control.');

    const buttonName = buttonOverride || point.button || 'left';
    const button = buttonName === 'right' ? 2 : buttonName === 'middle' ? 1 : 0;
    const base = { bubbles: true, cancelable: true, composed: true, view: window, button, buttons: 0, clientX: x, clientY: y };

    try {
      target.dispatchEvent(new PointerEvent('pointerdown', { ...base, buttons: button === 0 ? 1 : button === 1 ? 4 : 2, pointerId: 1, pointerType: 'mouse', isPrimary: true }));
    } catch (_) {}
    target.dispatchEvent(new MouseEvent('mousedown', { ...base, buttons: button === 0 ? 1 : button === 1 ? 4 : 2 }));
    try { target.dispatchEvent(new PointerEvent('pointerup', { ...base, pointerId: 1, pointerType: 'mouse', isPrimary: true })); } catch (_) {}
    target.dispatchEvent(new MouseEvent('mouseup', base));

    if (button === 0) {
      // HTMLElement.click() gives native DOM activation (for example checkbox toggling),
      // but is still synthetic and will never be a trusted operating-system input.
      if (typeof target.click === 'function') target.click();
      else target.dispatchEvent(new MouseEvent('click', base));
    } else if (button === 1) {
      target.dispatchEvent(new MouseEvent('auxclick', base));
    } else {
      target.dispatchEvent(new MouseEvent('contextmenu', base));
    }

    // Visual feedback in the floating overlay, synchronized with every point click.
    window.dispatchEvent(new CustomEvent('uac:click-ripple', {
      detail: { x, y, pointId: point.id, button: buttonName }
    }));

    const stored = state.points.find(item => item.id === point.id);
    if (stored) stored.count += 1;
    state.clickCount += 1;
    state.runClickCount += 1;
    scheduleProgressFlush();
  }

  async function clickPoint(point, options, signal) {
    const times = clamp(options?.clickCount ?? point.clickCount ?? 1, 1, 3);
    const interval = clamp(options?.interval ?? point.interval ?? state.settings.defaultInterval ?? 500, 1, 60000);
    for (let i = 0; i < times; i += 1) {
      await checkpoint(signal);
      dispatchOne(point, options?.button || point.button);
      if (i < times - 1) await wait(intervalFor(interval), signal);
    }
  }

  async function runBasic(signal) {
    state.mode = 'basic';
    while (!signal.aborted) {
      const enabledPoints = state.points.filter(point => point.enabled);
      if (state.settings.cursorMode) {
        const cursorPoint = { id: '__cursor__', name: 'Cursor', pageX: state.cursor.x + scrollX, pageY: state.cursor.y + scrollY, button: state.settings.defaultButton || 'left', clickCount: 1 };
        await clickPoint(cursorPoint, { interval: state.settings.defaultInterval, clickCount: state.settings.defaultClickCount }, signal);
        await wait(intervalFor(state.settings.defaultInterval), signal);
        continue;
      }
      if (!enabledPoints.length) throw new Error('Add at least one click point before pressing Play.');
      for (const point of enabledPoints) {
        await checkpoint(signal);
        const pointInterval = point.interval || state.settings.defaultInterval || 500;
        await clickPoint(point, { interval: pointInterval, button: point.button || state.settings.defaultButton || 'left', clickCount: point.clickCount || state.settings.defaultClickCount || 1 }, signal);
        await wait(intervalFor(pointInterval), signal);
      }
      state.cycleCount += 1;
      scheduleProgressFlush();
    }
  }

  async function runTimelineClick(node, signal) {
    const point = state.points.find(item => item.id === node.pointId && item.enabled);
    if (!point) throw new Error('A Timeline action refers to a missing or disabled click point.');
    const mode = ['single', 'limited', 'continuous'].includes(node.clickMode) ? node.clickMode : 'limited';
    const interval = clamp(node.interval ?? state.settings.defaultInterval ?? 500, 1, 60000);
    const count = mode === 'single' ? 1 : clamp(node.clickCount ?? point.clickCount ?? 1, 1, 100);
    let completed = 0;
    while (!signal.aborted) {
      await checkpoint(signal);
      dispatchOne(point, node.button || point.button);
      completed += 1;
      if (completed >= count && mode !== 'continuous') break;
      await wait(intervalFor(interval), signal);
    }
  }

  async function executeNodes(nodes, signal, depth = 0) {
    if (depth > 5) throw new Error('Timeline groups can be nested up to five levels.');
    for (const node of nodes || []) {
      await checkpoint(signal);
      if (node.enabled === false) continue;
      if (node.type === 'delay') {
        await wait(clamp(node.duration, 0, 3600000), signal);
      } else if (node.type === 'click') {
        await runTimelineClick(node, signal);
      } else if (node.type === 'parallel') {
        const children = (node.children || []).filter(child => child.enabled !== false);
        await Promise.all(children.map(child => executeNodes([child], signal, depth + 1)));
      } else if (node.type === 'repeat') {
        const repeatCount = clamp(node.times, 1, 100);
        for (let i = 0; i < repeatCount; i += 1) await executeNodes(node.children || [], signal, depth + 1);
      }
    }
  }

  function pause() {
    if (state.status !== 'running') return;
    state.pauseRequested = true;
    state.status = 'paused';
    flushProgress();
    notify();
  }

  function resume() {
    if (state.status !== 'paused') return;
    state.pauseRequested = false;
    state.status = 'running';
    state.resumeWaiters.splice(0).forEach(resolve => resolve());
    notify();
  }

  function stop(status = 'stopped') {
    const controller = state.controller;
    state.controller = null;
    state.currentRun = null;
    state.pauseRequested = false;
    state.resumeWaiters.splice(0).forEach(resolve => resolve());
    if (controller) controller.abort();
    state.status = status;
    flushProgress();
    notify();
  }

  function togglePlayback() {
    if (state.status === 'running' || state.status === 'paused') stop('stopped');
    else start(null);
  }

  function start(workflow = null) {
    const validWorkflow = workflow && Array.isArray(workflow.nodes) && workflow.nodes.length > 0 ? workflow : null;
    const requestedRun = validWorkflow?.id || '__basic__';
    if (state.status === 'running' && state.controller) {
      throw new Error('A workflow is already running. Pause or stop it before starting another mode.');
    }
    if (state.status === 'paused' && state.controller) {
      if (state.currentRun !== requestedRun) {
        throw new Error('A different workflow is paused. Stop it before switching between Quick Click and Timeline.');
      }
      resume();
      return;
    }
    if (!validWorkflow && !state.points.some(point => point.enabled) && !state.settings.cursorMode) {
      throw new Error('Add a click point first. Press Add point, choose a place on the page, then press Play.');
    }
    const controller = new AbortController();
    state.controller = controller;
    state.currentRun = validWorkflow?.id || '__basic__';
    state.workflowName = validWorkflow?.name || 'Quick Click';
    state.mode = validWorkflow ? 'timeline' : 'basic';
    state.status = 'running';
    state.runCount += 1;
    state.runClickCount = 0;
    state.lastError = null;
    state.cycleCount = 0;
    notify();
    const task = validWorkflow ? executeNodes(validWorkflow.nodes, controller.signal) : runBasic(controller.signal);
    task.then(() => {
      if (state.controller === controller && !controller.signal.aborted) {
        state.status = 'stopped';
        notify();
      }
    }).catch(error => {
      if (state.controller !== controller) return;
      if (error?.name === 'AbortError') {
        state.status = 'stopped';
        notify();
      } else {
        state.status = 'stopped';
        notify(error?.message || 'The workflow could not continue.');
      }
    }).finally(() => {
      if (state.controller === controller) {
        state.controller = null;
        state.currentRun = null;
      }
    });
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
      try {
        switch (message?.type) {
          case 'UAC_INIT': {
            if (state.controller) stop('stopped');
            state.enabled = true;
            const data = await runtimeMessage({ type: 'UAC_GET_TAB_DATA' });
            state.points = Array.isArray(data?.points) ? data.points.map(normalizePoint) : [];
            state.settings = data?.settings || {};
            state.settings.defaultInterval = clamp(state.settings.defaultInterval ?? 500, 1, 60000);
            state.clickCount = Number.isFinite(data?.clickCount) ? data.clickCount : state.points.reduce((sum, point) => sum + (Number(point.count) || 0), 0);
            state.status = 'stopped';
            notify();
            window.dispatchEvent(new CustomEvent('uac:activate'));
            sendResponse({ ok: true, state: snapshot() });
            break;
          }
          case 'UAC_GET_STATE': sendResponse({ ok: true, state: snapshot() }); break;
          case 'UAC_DEACTIVATE': stop('stopped'); state.enabled = false; window.dispatchEvent(new CustomEvent('uac:deactivate')); sendResponse({ ok: true }); break;
          case 'UAC_ADD_POINT': {
            if (!state.enabled) throw new Error('Enable this tab from the extension popup first.');
            if (state.points.length >= MAX_POINTS) throw new Error(`A page can contain up to ${MAX_POINTS} click points.`);
            const point = normalizePoint(message.point || {});
            state.points.push(point);
            savePoints(); notify();
            sendResponse({ ok: true, point, state: snapshot() });
            break;
          }
          case 'UAC_UPDATE_POINT': {
            const index = state.points.findIndex(point => point.id === message.point?.id);
            if (index < 0) throw new Error('Click point not found.');
            state.points[index] = normalizePoint({ ...state.points[index], ...message.point });
            savePoints(); notify();
            sendResponse({ ok: true, state: snapshot() });
            break;
          }
          case 'UAC_MOVE_POINT': {
            const point = state.points.find(item => item.id === message.id);
            if (!point) throw new Error('Click point not found.');
            point.pageX = Math.max(0, Number(message.pageX) || 0);
            point.pageY = Math.max(0, Number(message.pageY) || 0);
            refreshPointViewport(point);
            savePoints(); notify();
            sendResponse({ ok: true, state: snapshot() });
            break;
          }
          case 'UAC_DELETE_POINT': {
            const exists = state.points.some(point => point.id === message.id);
            if (!exists) throw new Error('This click point no longer exists.');
            // Remove before stop() flushes progress, so no stale copy can be persisted again.
            state.points = state.points.filter(point => point.id !== message.id);
            if (state.controller) stop('stopped');
            savePoints(); notify();
            sendResponse({ ok: true, state: snapshot() });
            break;
          }
          case 'UAC_CLEAR_POINTS':
            stop('stopped'); state.points = []; savePoints(); notify();
            sendResponse({ ok: true, state: snapshot() });
            break;
          case 'UAC_PICK_POINT':
            if (!state.enabled) throw new Error('Enable this tab from the extension popup first.');
            window.dispatchEvent(new CustomEvent('uac:pick-point', { detail: { name: message.name || `Point ${state.points.length + 1}` } }));
            sendResponse({ ok: true });
            break;
          case 'UAC_START_WORKFLOW':
            if (!state.enabled) throw new Error('Enable this tab from the extension popup first.');
            start(message.workflow || null);
            sendResponse({ ok: true, state: snapshot() });
            break;
          case 'UAC_TOGGLE_START':
            if (!state.enabled) throw new Error('Enable this tab from the extension popup first.');
            if (state.status === 'paused' && state.controller) {
              if (state.currentRun !== '__basic__') throw new Error('A Timeline workflow is paused. Resume it from Timeline.');
              resume();
            } else if (state.status !== 'running') start(null);
            sendResponse({ ok: true, state: snapshot() });
            break;
          case 'UAC_TOGGLE_PLAYBACK':
            if (!state.enabled) throw new Error('Enable this tab from the extension popup first.');
            if (state.status === 'paused' && state.controller) {
              if (state.currentRun === '__basic__') resume();
              else stop('stopped');
            } else togglePlayback();
            sendResponse({ ok: true, state: snapshot() });
            break;
          case 'UAC_UPDATE_POINT_DEFAULTS': {
            const patch = message.patch && typeof message.patch === 'object' ? message.patch : {};
            const clean = {};
            if (['left', 'right', 'middle'].includes(patch.button)) clean.button = patch.button;
            if ([1, 2, 3].includes(Number(patch.clickCount))) clean.clickCount = Number(patch.clickCount);
            state.points = state.points.map(point => normalizePoint({ ...point, ...clean }));
            savePoints(); notify();
            sendResponse({ ok: true, state: snapshot() });
            break;
          }
          case 'UAC_PAUSE': pause(); sendResponse({ ok: true, state: snapshot() }); break;
          case 'UAC_STOP': stop('stopped'); sendResponse({ ok: true, state: snapshot() }); break;
          case 'UAC_TOGGLE_FLOATING': window.dispatchEvent(new CustomEvent('uac:toggle-floating')); sendResponse({ ok: true }); break;
          case 'UAC_SHOW_FLOATING': window.dispatchEvent(new CustomEvent('uac:show-floating')); sendResponse({ ok: true }); break;
          case 'UAC_RESET_STATS':
            state.clickCount = 0; state.runCount = 0; state.cycleCount = 0; state.points.forEach(point => { point.count = 0; });
            savePoints(); notify(); sendResponse({ ok: true, state: snapshot() });
            break;
          default: sendResponse({ ok: false, error: 'Unknown action.' });
        }
      } catch (error) {
        sendResponse({ ok: false, error: error?.message || 'Action failed.' });
      }
    })();
    return true;
  });

  document.addEventListener('pointermove', event => {
    if (event.target?.closest?.('uac-root')) return;
    state.cursor = { x: event.clientX, y: event.clientY };
  }, { passive: true, capture: true });

  const onViewportChange = () => {
    state.points.forEach(refreshPointViewport);
    window.dispatchEvent(new CustomEvent('uac:points', { detail: snapshot() }));
  };
  window.addEventListener('scroll', onViewportChange, { passive: true, capture: true });
  window.addEventListener('resize', onViewportChange, { passive: true });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.uacSettings) {
      state.settings = changes.uacSettings.newValue || {};
      state.settings.defaultInterval = clamp(state.settings.defaultInterval ?? 500, 1, 60000);
      window.dispatchEvent(new CustomEvent('uac:state', { detail: snapshot() }));
    }
  });

  window.addEventListener('keydown', async event => {
    if (!state.enabled || event.repeat || event.target?.matches?.('input,textarea,select,[contenteditable="true"]')) return;
    let data;
    try { data = await chrome.storage.local.get(['uacSettings']); } catch (_) { return; }
    const shortcuts = data.uacSettings?.shortcuts || {};
    const combo = [event.ctrlKey && 'Ctrl', event.altKey && 'Alt', event.shiftKey && 'Shift', event.metaKey && 'Meta', event.key.length === 1 ? event.key.toUpperCase() : event.key].filter(Boolean).join('+');
    const action = {
      [shortcuts.start]: 'start', [shortcuts.pause]: 'pause', [shortcuts.stop]: 'stop',
      [shortcuts.addPoint]: 'add', [shortcuts.toggle]: 'toggle',
      'Alt+Z': 'add', 'Alt+X': 'startToggle', 'Alt+C': 'toggle',
    }[combo];
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    try {
      if (action === 'add') window.dispatchEvent(new CustomEvent('uac:pick-point', { detail: { name: `Point ${state.points.length + 1}` } }));
      else if (action === 'startToggle') togglePlayback();
      else if (action === 'start') {
        if (state.status === 'paused' && state.currentRun === '__basic__') resume();
        else if (state.status !== 'running') start(null);
        else throw new Error('A workflow is already running. Pause or stop it first.');
      } else if (action === 'pause') pause();
      else if (action === 'stop') stop('stopped');
      else if (action === 'toggle') window.dispatchEvent(new CustomEvent('uac:toggle-floating'));
    } catch (error) { notify(error?.message || 'Shortcut action failed.'); }
  }, true);

  window.UAC = { snapshot, dispatch: runtimeMessage, getState: snapshot };
})();
