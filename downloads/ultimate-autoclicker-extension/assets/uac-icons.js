(() => {
  const icons = {
    'settings': '<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 2.94-.08-.03a1.7 1.7 0 0 0-1.78.34l-.06.06h-3.4l-.03-.08a1.7 1.7 0 0 0-1.29-1.16 1.7 1.7 0 0 0-1.5.46l-.06.06-2.94-1.7.03-.08a1.7 1.7 0 0 0-.34-1.78l-.06-.06v-3.4l.08-.03a1.7 1.7 0 0 0 1.16-1.29 1.7 1.7 0 0 0-.46-1.5l-.06-.06 1.7-2.94.08.03a1.7 1.7 0 0 0 1.78-.34l.06-.06h3.4l.03.08a1.7 1.7 0 0 0 1.29 1.16 1.7 1.7 0 0 0 1.5-.46l.06-.06 2.94 1.7-.03.08a1.7 1.7 0 0 0 .34 1.78l.06.06v3.4z"/>',
    'panel-right': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>',
    'panel-left': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
    'panel-right-open': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16M10 9l-3 3 3 3"/>',
    'x': '<path d="M18 6 6 18M6 6l12 12"/>',
    'minus': '<path d="M5 12h14"/>',
    'plus': '<path d="M12 5v14M5 12h14"/>',
    'play': '<path d="m6 4 14 8-14 8V4Z"/>',
    'pause': '<path d="M8 5h3v14H8zM15 5h3v14h-3z"/>',
    'square': '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    'mouse-pointer-2': '<path d="m5 3 14 11-7 1-3 6L5 3Z"/>',
    'gauge': '<path d="M12 14 16 8"/><path d="M20.2 16a9 9 0 1 0-16.4 0"/><path d="M12 18h.01"/>',
    'clock-3': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
    'layers': '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
    'list-checks': '<path d="m3 5 2 2 4-4M3 12l2 2 4-4M13 6h8M13 13h8M3 19h18"/>',
    'trash-2': '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/>',
    'pencil': '<path d="m16 4 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16 4 20Z"/>',
    'copy': '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    'check': '<path d="m5 12 4 4L19 6"/>',
    'grip-vertical': '<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>',
    'grip-horizontal': '<circle cx="5" cy="9" r="1"/><circle cx="12" cy="9" r="1"/><circle cx="19" cy="9" r="1"/><circle cx="5" cy="15" r="1"/><circle cx="12" cy="15" r="1"/><circle cx="19" cy="15" r="1"/>',
    'layout-dashboard': '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>' ,
    'workflow': '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M6 9v3a3 3 0 0 0 3 3h6M18 15v-3a3 3 0 0 0-3-3H9"/>',
    'globe': '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/>',
    'rotate-ccw': '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    'move': '<path d="M5 9 2 12l3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    'plus-circle': '<circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>',
    'sliders-horizontal': '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M2 14h4M10 8h4M18 16h4"/>',
    'help-circle': '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
    'activity': '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  };
  function svg(name, extraClass = '') {
    const body = icons[name] || icons['activity'];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"${extraClass ? ` class="${extraClass}"` : ''}>${body}</svg>`;
  }
  function replace(root = document) {
    root.querySelectorAll?.('[data-lucide]').forEach(node => {
      const name = node.getAttribute('data-lucide');
      const cls = node.getAttribute('class') || '';
      const template = document.createElement('template');
      template.innerHTML = svg(name, cls);
      node.replaceWith(template.content.firstElementChild);
    });
  }
  window.UACIcons = Object.freeze({ svg, replace });
})();
