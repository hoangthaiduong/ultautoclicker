window.UACIcons?.replace(document);
const $ = selector => document.querySelector(selector);
const DEFAULTS = {
  theme: 'system', language: 'en', defaultClickMode: 'limited', startup: 'compact',
  floatingMode: 'mini', floatingCompact: true, floatingHidden: false,
  floatingSide: 'right', floatingOpacity: 100, globalIntervalOverride: null,
  defaultInterval: 500, defaultButton: 'left', defaultClickCount: 1, speedPreset: 'normal',
  humanize: false, humanizePercent: 10, cursorMode: false,
  shortcuts: { start: 'Alt+X', pause: 'Alt+Shift+P', stop: 'Alt+Shift+X', addPoint: 'Alt+Z', toggle: 'Alt+C' }
};
let settings = structuredClone(DEFAULTS);
let listening = null;

function showSaved(message = 'Settings saved locally.') { $('#save-message').textContent = message; }
function comboFromEvent(event) {
  const modifiers = [];
  if (event.ctrlKey) modifiers.push('Ctrl');
  if (event.altKey) modifiers.push('Alt');
  if (event.shiftKey) modifiers.push('Shift');
  if (event.metaKey) modifiers.push('Meta');
  let key = event.key;
  if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) return '';
  if (key === ' ') key = 'Space'; else if (key.length === 1) key = key.toUpperCase();
  modifiers.push(key);
  return modifiers.join('+');
}
function applyTheme() {
  const dark = settings.theme === 'dark' || (settings.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.body.classList.toggle('dark', dark);
}
function applyLanguage() {
  const vi = settings.language === 'vi';
  document.documentElement.lang = vi ? 'vi' : 'en';
  const titles = vi
    ? ['Chung', 'Bảng điều khiển nổi', 'Cài đặt click', 'Phím tắt', 'Dữ liệu & quyền riêng tư']
    : ['General', 'Floating control', 'Click settings', 'Keyboard shortcuts', 'Data & privacy'];
  const descriptions = vi
    ? ['Ngôn ngữ, giao diện và hành vi mặc định.', 'Chọn cạnh hiển thị và độ mờ của widget. Widget có ba chế độ Mode 1, Mode 2 và Mode 3.', 'Thiết lập mặc định cho điểm click và Timeline.', 'Phím tắt trong trang hoạt động khi trang được bật đang được focus. Phím tắt toàn cục do Chrome quản lý.', 'Xuất hoặc khôi phục tùy chọn cục bộ. Không thu thập lịch sử duyệt web hay nội dung trang.']
    : ['Language, appearance and default behavior.', 'Choose the widget side and opacity. The widget has Mode 1, Mode 2 and Mode 3.', 'Set defaults for click points and Timeline actions.', 'Page shortcuts work while the enabled page is focused. Global shortcuts are managed by Chrome.', 'Export or restore local preferences. No browsing history or page content is collected.'];
  document.querySelectorAll('.section-heading h2').forEach((el, index) => { el.textContent = titles[index] || el.textContent; });
  document.querySelectorAll('.section-heading p').forEach((el, index) => { el.textContent = descriptions[index] || el.textContent; });
  $('.page-heading h1').textContent = vi ? 'Cài đặt' : 'Settings';
  $('.page-heading p').textContent = vi ? 'Tùy chỉnh cách Ultimate Autoclicker hoạt động. Các thay đổi được lưu trên thiết bị.' : 'Make the extension feel right for your workflow. Changes are saved locally as you make them.';
  const labels = vi
    ? { language: 'Ngôn ngữ', theme: 'Giao diện', 'click-mode': 'Chế độ click mặc định', startup: 'Chế độ widget khi bật trang', side: 'Cạnh mặc định', opacity: 'Độ mờ', interval: 'Khoảng click mặc định (1–60.000 ms)', button: 'Nút chuột mặc định', 'click-count': 'Số click mỗi điểm (1–3)', preset: 'Thiết lập tốc độ' }
    : { language: 'Language', theme: 'Theme', 'click-mode': 'Default click mode', startup: 'Widget mode when a page is enabled', side: 'Default side', opacity: 'Opacity', interval: 'Default interval (1–60,000 ms)', button: 'Default mouse button', 'click-count': 'Clicks per point (1–3)', preset: 'Speed preset' };
  Object.entries(labels).forEach(([id, value]) => {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) { const output = label.querySelector('output'); label.textContent = value; if (output) label.appendChild(output); }
  });
  const startup = $('#startup');
  if (startup) {
    startup.options[0].textContent = vi ? 'Mode 3 — bảng đầy đủ' : 'Mode 3 — full controls';
    startup.options[1].textContent = vi ? 'Mode 2 — thanh dọc' : 'Mode 2 — vertical compact';
    startup.options[2].textContent = vi ? 'Mode 1 — nút cạnh màn hình' : 'Mode 1 — edge tab';
  }
  const shortcutNames = document.querySelectorAll('.shortcut-row span');
  (vi ? ['Bắt đầu / Tiếp tục', 'Tạm dừng', 'Dừng', 'Thêm điểm', 'Ẩn / Hiện bảng điều khiển'] : ['Start / Resume', 'Pause', 'Stop', 'Add point', 'Toggle floating control']).forEach((value, index) => { if (shortcutNames[index]) shortcutNames[index].textContent = value; });
  $('#back').textContent = vi ? 'Hoàn tất' : 'Done';
  $('#export-settings').textContent = vi ? 'Xuất cài đặt' : 'Export settings';
  $('#import-settings').textContent = vi ? 'Nhập cài đặt' : 'Import settings';
  $('#reset').textContent = vi ? 'Đặt lại cài đặt' : 'Reset settings';
  const helper = document.querySelector('.helper');
  if (helper) helper.textContent = vi
    ? 'Widget giữ nguyên các điều khiển ở ba chế độ Mode 1, Mode 2 và Mode 3. Thu nhỏ không dừng workflow hoặc xóa điểm click. Khoảng 1 ms là mục tiêu đặt lịch, không phải cam kết tốc độ thực tế.'
    : 'The widget keeps its controls across Mode 1, Mode 2 and Mode 3. Minimizing does not stop a workflow or remove click points. A 1 ms interval is a scheduling target, not a guaranteed real-world rate.';
}
function writeForm() {
  $('#language').value = settings.language || 'en';
  $('#theme').value = settings.theme || 'system';
  $('#click-mode').value = settings.defaultClickMode || 'limited';
  $('#startup').value = settings.startup || 'compact';
  $('#side').value = settings.floatingSide || 'right';
  $('#opacity').value = settings.floatingOpacity ?? 100;
  $('#opacity-value').textContent = `${settings.floatingOpacity ?? 100}%`;
  $('#interval').value = settings.defaultInterval ?? 500;
  $('#button').value = settings.defaultButton || 'left';
  $('#click-count').value = settings.defaultClickCount ?? 1;
  $('#preset').value = settings.speedPreset || 'normal';
  document.querySelectorAll('[data-shortcut]').forEach(button => { button.textContent = settings.shortcuts[button.dataset.shortcut] || 'Not set'; });
}
async function save() {
  await chrome.storage.local.set({ uacSettings: settings });
  showSaved(settings.language === 'vi' ? 'Đã lưu cài đặt trên thiết bị.' : 'Settings saved locally.');
  applyTheme(); applyLanguage();
}
function validateShortcuts() {
  const used = new Set();
  for (const value of Object.values(settings.shortcuts)) {
    if (!value) continue;
    if (used.has(value)) throw new Error('Each page shortcut must be unique.');
    used.add(value);
  }
}
function bind(id, key, transform = value => value) {
  $(id).addEventListener('change', async event => {
    settings[key] = transform(event.target.type === 'checkbox' ? event.target.checked : event.target.value);
    if (key === 'floatingSide') settings.floatingPosition = null;
    await save();
  });
}

bind('#language', 'language');
bind('#theme', 'theme');
bind('#click-mode', 'defaultClickMode');
$('#startup').addEventListener('change', async event => {
  settings.startup = event.target.value;
  // Keep the saved widget mode and the startup preference in sync. Otherwise
  // an older saved floatingMode would override the user's new startup choice.
  const modeByStartup = { show: 'panel', compact: 'mini', hidden: 'tab' };
  settings.floatingMode = modeByStartup[settings.startup] || 'mini';
  settings.floatingCompact = settings.floatingMode === 'mini';
  settings.floatingHidden = settings.floatingMode === 'tab';
  await save();
  // An explicit startup-mode selection should not be overwritten by the v1.2.2 migration.
  await chrome.storage.local.set({ uacModeInitialized: true });
});
bind('#side', 'floatingSide');
bind('#button', 'defaultButton');
$('#preset').addEventListener('change', async event => {
  settings.speedPreset = event.target.value;
  settings.globalIntervalOverride = null;
  if (event.target.value === 'slow') settings.defaultInterval = 1000;
  if (event.target.value === 'normal') settings.defaultInterval = 500;
  if (event.target.value === 'fast') settings.defaultInterval = 250;
  await save(); writeForm();
});
$('#opacity').addEventListener('input', event => { $('#opacity-value').textContent = `${event.target.value}%`; });
$('#opacity').addEventListener('change', async event => { settings.floatingOpacity = Number(event.target.value); await save(); });
$('#interval').addEventListener('change', async event => {
  settings.defaultInterval = Math.max(1, Math.min(60000, Number(event.target.value) || 500));
  settings.globalIntervalOverride = null;
  event.target.value = settings.defaultInterval;
  await save();
});
$('#click-count').addEventListener('change', async event => {
  settings.defaultClickCount = Math.max(1, Math.min(3, Number(event.target.value) || 1));
  event.target.value = settings.defaultClickCount;
  await save();
});

document.querySelectorAll('[data-shortcut]').forEach(button => button.addEventListener('click', () => {
  if (listening) listening.classList.remove('listening');
  listening = button; button.classList.add('listening'); button.textContent = 'Press a key…';
}));
document.addEventListener('keydown', async event => {
  if (!listening) return;
  event.preventDefault(); event.stopPropagation();
  const value = comboFromEvent(event);
  if (!value) return;
  const key = listening.dataset.shortcut;
  const old = settings.shortcuts[key];
  settings.shortcuts[key] = value;
  try { validateShortcuts(); await save(); writeForm(); }
  catch (error) { settings.shortcuts[key] = old; alert(error.message); writeForm(); }
  listening = null;
}, true);
$('#chrome-shortcuts').addEventListener('click', event => { event.preventDefault(); chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }); });
$('#export-settings').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ format: 'uac-settings', version: 1, settings }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'ultimate-autoclicker-settings.json'; anchor.click(); URL.revokeObjectURL(url);
});
$('#import-settings').addEventListener('click', () => $('#settings-file').click());
$('#settings-file').addEventListener('change', async event => {
  const file = event.target.files?.[0]; if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const incoming = data.settings || data;
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) throw new Error('Invalid settings file.');
    settings = { ...DEFAULTS, ...incoming, shortcuts: { ...DEFAULTS.shortcuts, ...(incoming.shortcuts || {}) } };
    settings.defaultInterval = Math.max(1, Math.min(60000, Number(settings.defaultInterval) || 500));
    settings.defaultClickCount = Math.max(1, Math.min(3, Number(settings.defaultClickCount) || 1));
    validateShortcuts(); await save(); writeForm(); showSaved('Settings imported.');
  } catch (error) { alert(error.message || 'Could not import settings.'); }
  finally { event.target.value = ''; }
});
$('#reset').addEventListener('click', async () => {
  if (!confirm('Reset all settings to their defaults? Your workflows and points will not be deleted.')) return;
  settings = structuredClone(DEFAULTS); await save(); writeForm(); showSaved('Settings reset.');
});
$('#back').addEventListener('click', () => window.close());
(async () => {
  const data = await chrome.storage.local.get(['uacSettings']);
  settings = { ...DEFAULTS, ...(data.uacSettings || {}), shortcuts: { ...DEFAULTS.shortcuts, ...(data.uacSettings?.shortcuts || {}) } };
  if (settings.shortcuts.start === 'Alt+Shift+S') settings.shortcuts.start = 'Alt+X';
  if (settings.shortcuts.addPoint === 'Alt+Shift+N' || settings.shortcuts.addPoint === 'Ctrl+K') settings.shortcuts.addPoint = 'Alt+Z';
  if (settings.shortcuts.toggle === 'Alt+Shift+F') settings.shortcuts.toggle = 'Alt+C';
  await chrome.storage.local.set({ uacSettings: settings });
  settings.defaultInterval = Math.max(1, Math.min(60000, Number(settings.defaultInterval) || 500));
  writeForm(); applyTheme(); applyLanguage();
})();
