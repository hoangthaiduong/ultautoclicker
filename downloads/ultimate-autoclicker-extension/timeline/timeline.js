const $ = (s, root = document) => root.querySelector(s);
let workflows = [], points = [], selectedId = null, undoStack = [], redoStack = [], saveTimer = null, settings = {};
const uid = () => crypto.randomUUID ? crypto.randomUUID() : `n-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const clamp = (v, min, max) => Math.max(min, Math.min(max, Number(v) || min));
const active = () => workflows.find(w => w.id === selectedId) || workflows[0];
const clone = value => JSON.parse(JSON.stringify(value));
function makeNode(type) {
  if (type === 'click') return { id: uid(), type, pointId: points[0]?.id || '', button: settings.defaultButton || 'left', clickMode: settings.defaultClickMode || 'limited', clickCount: settings.defaultClickCount || 1, interval: settings.defaultInterval || 500, enabled: true };
  if (type === 'delay') return { id: uid(), type, duration: 1000, enabled: true };
  if (type === 'parallel') return { id: uid(), type, enabled: true, children: [] };
  return { id: uid(), type: 'repeat', times: 2, enabled: true, children: [] };
}
function toast(message, error = false) { $('#save-state').textContent = message; $('#save-state').style.color = error ? '#b91c1c' : '#16a34a'; }
function pushUndo() { undoStack.push(clone(workflows)); if (undoStack.length > 60) undoStack.shift(); redoStack = []; updateHistoryButtons(); }
function updateHistoryButtons() { $('#undo').disabled = !undoStack.length; $('#redo').disabled = !redoStack.length; $('#undo').style.opacity = undoStack.length ? '1' : '.45'; $('#redo').style.opacity = redoStack.length ? '1' : '.45'; }
function scheduleSave() {
  clearTimeout(saveTimer); toast('Saving…'); saveTimer = setTimeout(async () => {
    await chrome.storage.local.set({ uacWorkflows: workflows, uacSelectedWorkflow: selectedId }); toast('All changes saved'); renderSidebar();
  }, 250);
}
function countNodes(nodes) { return (nodes || []).reduce((total, n) => total + 1 + (n.children ? countNodes(n.children) : 0), 0); }
function walk(nodes, fn, depth = 0) { (nodes || []).forEach((node, i) => { fn(node, [i], depth); if (node.children) walkWithPrefix(node.children, fn, [i], depth + 1); }); }
function walkWithPrefix(nodes, fn, prefix, depth) { (nodes || []).forEach((node, i) => { const path = [...prefix, i]; fn(node, path, depth); if (node.children) walkWithPrefix(node.children, fn, path, depth + 1); }); }
function atPath(path) { let list = active().nodes, item; for (let i = 0; i < path.length; i++) { item = list[path[i]]; if (!item) return null; if (i < path.length - 1) list = item.children || []; } return { item, list, index: path[path.length - 1] }; }
function html(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function pointOptions(selected) { return `<option value="">Select a point…</option>${points.map(p => `<option value="${html(p.id)}" ${p.id === selected ? 'selected' : ''}>${html(p.name)} — (${Math.round(p.x)}, ${Math.round(p.y)})</option>`).join('')}`; }
function renderNode(node, path, index, depth = 0) {
  const pathStr = path.join('.'); const typeName = ({click:'Click action',delay:'Delay',parallel:'Parallel group',repeat:'Repeat group'})[node.type] || node.type;
  const title = node.type === 'click' ? (points.find(p => p.id === node.pointId)?.name || 'Choose a point') : node.type === 'delay' ? `Wait ${node.duration} ms` : node.type === 'parallel' ? 'Run enabled child actions together' : `Repeat ${node.times} times`;
  let config = '';
  if (node.type === 'click') config = `<div class="node-config">
    <div class="field"><label>Target point</label><select data-path="${pathStr}" data-prop="pointId">${pointOptions(node.pointId)}</select></div>
    <div class="field"><label>Mouse button</label><select data-path="${pathStr}" data-prop="button"><option value="left" ${node.button==='left'?'selected':''}>Left</option><option value="right" ${node.button==='right'?'selected':''}>Right</option><option value="middle" ${node.button==='middle'?'selected':''}>Middle</option></select></div>
    <div class="field"><label>Click mode</label><select data-path="${pathStr}" data-prop="clickMode"><option value="single" ${node.clickMode==='single'?'selected':''}>Single</option><option value="limited" ${!node.clickMode || node.clickMode==='limited'?'selected':''}>Limited</option><option value="continuous" ${node.clickMode==='continuous'?'selected':''}>Continuous* </option></select></div>
    <div class="field"><label>Click count (1–100)</label><input type="number" min="1" max="100" data-path="${pathStr}" data-prop="clickCount" value="${node.clickCount ?? 1}"></div>
    <div class="field"><label>Interval (ms)</label><input type="number" min="1" max="60000" data-path="${pathStr}" data-prop="interval" value="${node.interval ?? 500}"></div>
  </div>`;
  if (node.type === 'delay') config = `<div class="node-config"><div class="field"><label>Duration (ms)</label><input type="number" min="0" max="3600000" data-path="${pathStr}" data-prop="duration" value="${node.duration ?? 1000}"></div></div>`;
  if (node.type === 'repeat') config = `<div class="node-config"><div class="field"><label>Repeat count (1–100)</label><input type="number" min="1" max="100" data-path="${pathStr}" data-prop="times" value="${node.times ?? 2}"></div></div>`;
  let children = '';
  if (node.type === 'parallel' || node.type === 'repeat') {
    const childHtml = (node.children || []).map((child, i) => renderNode(child, [...path, i], i, depth + 1)).join('');
    children = `<div class="nested"><div class="nested-head"><span>${node.type === 'parallel' ? 'PARALLEL CHILD ACTIONS' : 'REPEATED STEPS'}</span><span>${(node.children || []).length} items</span></div>${childHtml || '<div class="nested-empty">No child actions yet.</div>'}<div class="row-child"><button class="nested-add" data-add-child="${pathStr}" data-child-type="click">+ Click</button><button class="nested-add" data-add-child="${pathStr}" data-child-type="delay">+ Delay</button></div></div>`;
  }
  return `<article class="node ${node.enabled === false ? 'disabled' : ''}" draggable="true" data-node-path="${pathStr}" data-node-id="${html(node.id)}">
    <div class="node-head"><span class="drag-handle" aria-label="Drag to reorder" title="Drag to reorder">⠿</span><span class="node-number">${index + 1}</span><span class="node-title">${html(title)}</span><span class="node-kind">${typeName}</span>
      <div class="node-controls"><button data-toggle="${pathStr}" title="Enable or disable" aria-label="Enable or disable action">${node.enabled === false ? '○' : '●'}</button><button data-duplicate="${pathStr}" title="Duplicate" aria-label="Duplicate action">⧉</button><button class="delete" data-delete="${pathStr}" title="Delete" aria-label="Delete action">×</button></div>
    </div>${config}${children}
  </article>`;
}
function render() {
  const w = active(); if (!w) return;
  $('#workflow-name').value = w.name;
  const total = countNodes(w.nodes); $('#action-count').textContent = total;
  $('#point-count').textContent = points.length;
  $('#timeline-list').innerHTML = w.nodes.map((node, i) => renderNode(node, [i], i)).join('');
  $('#empty-state').classList.toggle('hidden', w.nodes.length > 0);
  updateHistoryButtons();
}
function renderSidebar() {
  $('#workflow-list').innerHTML = workflows.map(w => `<button class="workflow-item ${w.id === selectedId ? 'active' : ''}" data-select="${w.id}"><svg viewBox="0 0 24 24"><path d="M4 5h16v14H4zM8 9h8M8 13h5"/></svg><span>${html(w.name)}</span><small>${w.nodes.length}</small></button>`).join('');
}
function mutate(fn) { pushUndo(); fn(); scheduleSave(); render(); renderSidebar(); }
function addNode(type, parentPath = null) {
  mutate(() => {
    if (!parentPath) active().nodes.push(makeNode(type));
    else { const parent = atPath(parentPath).item; if (!parent.children) parent.children = []; parent.children.push(makeNode(type)); }
  });
}
function normalizeImportedWorkflow(w) {
  if (!w || typeof w !== 'object' || !Array.isArray(w.nodes)) throw new Error('The file is not a valid workflow.');
  if (countNodes(w.nodes) > 1000) throw new Error('A workflow may contain at most 1,000 actions.');
  const validate = (nodes, depth = 0) => {
    if (depth > 5) throw new Error('Workflow nesting may not exceed five levels.');
    nodes.forEach(n => {
      if (!n || !['click','delay','parallel','repeat'].includes(n.type)) throw new Error('The workflow contains an unsupported action.');
      if (n.type === 'click') { n.clickCount = clamp(n.clickCount ?? 1, 1, 100); n.interval = clamp(n.interval ?? 500, 1, 60000); n.button = ['left','right','middle'].includes(n.button) ? n.button : 'left'; n.pointId = String(n.pointId || ''); }
      if (n.type === 'delay') n.duration = clamp(n.duration ?? 1000, 0, 3600000);
      if (n.type === 'repeat') n.times = clamp(n.times ?? 2, 1, 100);
      if (n.type === 'parallel' || n.type === 'repeat') { if (!Array.isArray(n.children)) n.children = []; validate(n.children, depth + 1); }
      n.id = String(n.id || uid()); n.enabled = n.enabled !== false;
    });
  };
  const result = clone(w); validate(result.nodes);
  return { id: uid(), name: String(result.name || 'Imported workflow').slice(0,60), nodes: result.nodes, updatedAt: Date.now() };
}

$('#workflow-name').addEventListener('change', e => { const value = e.target.value.trim() || 'Untitled workflow'; mutate(() => { active().name = value.slice(0,60); }); });
$('#timeline-list').addEventListener('change', e => {
  const el = e.target.closest('[data-path][data-prop]'); if (!el) return;
  const path = el.dataset.path.split('.').map(Number), prop = el.dataset.prop, ref = atPath(path); if (!ref) return;
  let value = el.value;
  if (['clickCount','interval','duration','times'].includes(prop)) value = Number(value);
  mutate(() => {
    if (prop === 'clickCount') value = clamp(value,1,100);
    if (prop === 'clickMode' && !['single','limited','continuous'].includes(value)) value = 'limited';
    if (prop === 'interval') value = clamp(value,1,60000);
    if (prop === 'duration') value = clamp(value,0,3600000);
    if (prop === 'times') value = clamp(value,1,100);
    ref.item[prop] = value;
  });
});
$('#timeline-list').addEventListener('click', e => {
  const toggle = e.target.closest('[data-toggle]'); const duplicate = e.target.closest('[data-duplicate]'); const del = e.target.closest('[data-delete]'); const child = e.target.closest('[data-add-child]');
  if (toggle) { const r = atPath(toggle.dataset.toggle.split('.').map(Number)); mutate(() => { r.item.enabled = r.item.enabled === false; }); }
  if (duplicate) { const r = atPath(duplicate.dataset.duplicate.split('.').map(Number)); mutate(() => { const copy = clone(r.item); copy.id = uid(); r.list.splice(r.index + 1, 0, copy); }); }
  if (del) { const r = atPath(del.dataset.delete.split('.').map(Number)); mutate(() => r.list.splice(r.index,1)); }
  if (child) { const path = child.dataset.addChild.split('.').map(Number); addNode(child.dataset.childType, path); }
});
$('#timeline-list').addEventListener('dragstart', e => { const node = e.target.closest('[data-node-path]'); if (!node) return; e.dataTransfer.setData('text/plain', node.dataset.nodePath); e.dataTransfer.effectAllowed = 'move'; node.classList.add('dragging'); });
$('#timeline-list').addEventListener('dragend', e => e.target.closest('[data-node-path]')?.classList.remove('dragging'));
$('#timeline-list').addEventListener('dragover', e => { const node = e.target.closest('[data-node-path]'); if (!node) return; e.preventDefault(); node.classList.add('drop-target'); });
$('#timeline-list').addEventListener('dragleave', e => e.target.closest('[data-node-path]')?.classList.remove('drop-target'));
$('#timeline-list').addEventListener('drop', e => {
  const targetEl = e.target.closest('[data-node-path]'); if (!targetEl) return; e.preventDefault(); targetEl.classList.remove('drop-target');
  const fromPath = e.dataTransfer.getData('text/plain').split('.').map(Number), toPath = targetEl.dataset.nodePath.split('.').map(Number);
  if (fromPath.length !== toPath.length || fromPath.slice(0,-1).join('.') !== toPath.slice(0,-1).join('.')) return;
  const from = atPath(fromPath), to = atPath(toPath); if (!from || !to || from.index === to.index) return;
  mutate(() => { const [item] = from.list.splice(from.index,1); const index = to.index > from.index ? to.index - 1 : to.index; from.list.splice(index,0,item); });
});
document.querySelectorAll('[data-add]').forEach(btn => btn.addEventListener('click', () => addNode(btn.dataset.add)));
$('#new-workflow').addEventListener('click', () => { const name = prompt('Workflow name', 'New workflow'); if (!name) return; mutate(() => { const w = { id: uid(), name: name.trim().slice(0,60) || 'New workflow', nodes: [], updatedAt: Date.now() }; workflows.push(w); selectedId = w.id; }); });
$('#workflow-list').addEventListener('click', e => { const btn = e.target.closest('[data-select]'); if (!btn) return; selectedId = btn.dataset.select; chrome.storage.local.set({ uacSelectedWorkflow: selectedId }); renderSidebar(); render(); });
$('#duplicate-workflow').addEventListener('click', () => { const w = active(); if (!w) return; mutate(() => { const copy = clone(w); copy.id = uid(); copy.name = `${w.name} copy`.slice(0,60); copy.updatedAt = Date.now(); workflows.push(copy); selectedId = copy.id; }); });
$('#delete-workflow').addEventListener('click', () => { if (workflows.length <= 1) return alert('Keep at least one workflow.'); const w = active(); if (!confirm(`Delete “${w.name}”?`)) return; mutate(() => { workflows = workflows.filter(x => x.id !== w.id); selectedId = workflows[0].id; }); });
$('#undo').addEventListener('click', () => { if (!undoStack.length) return; redoStack.push(clone(workflows)); workflows = undoStack.pop(); selectedId = workflows.some(w => w.id === selectedId) ? selectedId : workflows[0].id; scheduleSave(); renderSidebar(); render(); updateHistoryButtons(); });
$('#redo').addEventListener('click', () => { if (!redoStack.length) return; undoStack.push(clone(workflows)); workflows = redoStack.pop(); selectedId = workflows.some(w => w.id === selectedId) ? selectedId : workflows[0].id; scheduleSave(); renderSidebar(); render(); updateHistoryButtons(); });
$('#run-workflow').addEventListener('click', async () => {
  const workflow = active();
  if (!workflow?.nodes?.length) { toast('Add at least one Timeline action before running.', true); return; }
  try {
    const response = await chrome.runtime.sendMessage({ type: 'UAC_RUN_WORKFLOW', workflow: clone(workflow) });
    if (!response?.ok) throw new Error(response?.error || 'Could not start this workflow.');
    toast(`Running “${workflow.name}” on the selected tab`);
  } catch (error) { toast(error.message || 'Could not run workflow.', true); }
});
$('#pause-run').addEventListener('click', async () => {
  try { const response = await chrome.runtime.sendMessage({ type: 'UAC_CONTROL_SELECTED_TAB', action: 'UAC_PAUSE' }); if (!response?.ok) throw new Error(response?.error || 'Could not pause workflow.'); toast('Workflow paused'); }
  catch (error) { toast(error.message || 'Could not pause workflow.', true); }
});
$('#stop-run').addEventListener('click', async () => {
  try { const response = await chrome.runtime.sendMessage({ type: 'UAC_CONTROL_SELECTED_TAB', action: 'UAC_STOP' }); if (!response?.ok) throw new Error(response?.error || 'Could not stop workflow.'); toast('Workflow stopped'); }
  catch (error) { toast(error.message || 'Could not stop workflow.', true); }
});
$('#export').addEventListener('click', () => { const w = active(); const blob = new Blob([JSON.stringify({ format: 'uac-workflow', version: 1, exportedAt: new Date().toISOString(), workflow: w }, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${w.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'workflow'}.uacworkflow`; a.click(); URL.revokeObjectURL(a.href); });
$('#import').addEventListener('click', () => $('#import-file').click());
$('#preset-select').addEventListener('change', e => { const type = e.target.value; if (!type) return; const pointId = points[0]?.id || ''; mutate(() => { if (type === 'two-step') active().nodes.push({ id: uid(), type: 'click', pointId, button: settings.defaultButton || 'left', clickMode: 'limited', clickCount: 1, interval: settings.defaultInterval || 500, enabled: true }, { id: uid(), type: 'delay', duration: 700, enabled: true }, { id: uid(), type: 'click', pointId, button: settings.defaultButton || 'left', clickMode: 'limited', clickCount: 1, interval: settings.defaultInterval || 500, enabled: true }); if (type === 'repeat-click') active().nodes.push({ id: uid(), type: 'repeat', times: 3, enabled: true, children: [{ id: uid(), type: 'click', pointId, button: settings.defaultButton || 'left', clickMode: 'single', clickCount: 1, interval: settings.defaultInterval || 500, enabled: true }] }); if (type === 'parallel-clicks') active().nodes.push({ id: uid(), type: 'parallel', enabled: true, children: [{ id: uid(), type: 'click', pointId, button: settings.defaultButton || 'left', clickMode: 'single', clickCount: 1, interval: settings.defaultInterval || 500, enabled: true }, { id: uid(), type: 'click', pointId, button: settings.defaultButton || 'left', clickMode: 'single', clickCount: 1, interval: settings.defaultInterval || 500, enabled: true }] }); }); e.target.value = ''; });
$('#import-file').addEventListener('change', async e => { const file = e.target.files?.[0]; if (!file) return; try { const data = JSON.parse(await file.text()); const imported = normalizeImportedWorkflow(data.workflow || data); mutate(() => { workflows.push(imported); selectedId = imported.id; }); toast('Workflow imported'); } catch(error) { alert(error.message || 'Could not import this file.'); } finally { e.target.value = ''; } });

(async () => {
  const [data, targetData, settingsData] = await Promise.all([chrome.storage.local.get(['uacWorkflows','uacSelectedWorkflow']), chrome.runtime.sendMessage({ type: 'UAC_GET_TARGET_DATA' }), chrome.storage.local.get(['uacSettings'])]);
  settings = settingsData.uacSettings || {};
  workflows = Array.isArray(data.uacWorkflows) && data.uacWorkflows.length ? data.uacWorkflows : [{ id: uid(), name: 'Default workflow', nodes: [], updatedAt: Date.now() }];
  points = Array.isArray(targetData?.points) ? targetData.points : [];
  selectedId = workflows.some(w => w.id === data.uacSelectedWorkflow) ? data.uacSelectedWorkflow : workflows[0].id;
  renderSidebar(); render();
  if (!data.uacWorkflows?.length) await chrome.storage.local.set({ uacWorkflows: workflows });
})();
