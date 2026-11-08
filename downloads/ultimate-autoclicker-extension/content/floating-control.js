(() => {
  if (!window.UAC) return;
  const existingRoots = [...document.querySelectorAll('uac-root[aria-label=\"Ultimate Autoclicker controls\"]')];
  // If a prior injection ever created multiple widgets, keep exactly one DOM root.
  existingRoots.slice(1).forEach(root => root.remove());
  if (window.__UAC_FLOATING_READY__ || existingRoots.length) { window.__UAC_FLOATING_READY__ = true; return; }
  window.__UAC_FLOATING_READY__ = true;

  const host = document.createElement('uac-root');
  host.setAttribute('aria-label', 'Ultimate Autoclicker controls');
  host.setAttribute('data-uac-owner', 'ultimate-autoclicker');
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      :host{all:initial;position:fixed;inset:0;z-index:2147483646;pointer-events:none;color:#17233d;font:13px/1.45 Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color-scheme:light}
      *{box-sizing:border-box}button,input,select{font:inherit}button{cursor:pointer}
      .panel,.mini,.tab-handle{position:fixed;pointer-events:auto;box-sizing:border-box}
      .panel{width:354px;max-width:calc(100vw - 16px);max-height:calc(100vh - 20px);overflow:auto;background:#fff;border:1px solid #dbe4f0;border-radius:20px;box-shadow:0 24px 70px rgba(23,35,61,.24),0 4px 12px rgba(23,35,61,.08);color:#17233d;scrollbar-width:thin;scrollbar-color:#cbd5e1 transparent}
      .top{display:flex;align-items:center;gap:9px;min-height:58px;padding:0 14px;background:linear-gradient(135deg,#f8fbff 0%,#edf3ff 100%);border-bottom:1px solid #e5ecf5;cursor:grab;user-select:none;position:sticky;top:0;z-index:3}
      .top:active{cursor:grabbing}.brand-mark{width:31px;height:31px;border-radius:10px;background:linear-gradient(145deg,#3971ff,#214ed6);color:#fff;display:grid;place-items:center;font-size:14px;font-weight:850;flex:none;box-shadow:0 4px 10px rgba(49,94,251,.25)}
      .brand{font-size:13px;font-weight:850;letter-spacing:-.35px;flex:1;white-space:nowrap}.status{display:flex;align-items:center;gap:6px;color:#64748b;font-size:10px;white-space:nowrap;text-transform:capitalize}.dot{width:7px;height:7px;border-radius:99px;background:#94a3b8;box-shadow:0 0 0 3px #e2e8f0}.dot.running{background:#16a34a;box-shadow:0 0 0 3px #dcfce7}.dot.paused{background:#d97706;box-shadow:0 0 0 3px #fef3c7}
      .icon{width:31px;height:31px;display:grid;place-items:center;border:1px solid transparent;border-radius:10px;background:transparent;color:#64748b;padding:0;flex:none}.icon:hover:not(:disabled){background:#edf3ff;border-color:#dbe7ff;color:#315efb}.icon:disabled{opacity:.36;cursor:not-allowed}.icon svg,.btn svg{width:16px;height:16px}.body{padding:14px;display:grid;gap:13px}
      .row{display:flex;align-items:center;gap:8px}.between{justify-content:space-between}.muted{font-size:10px;color:#8390a6}.section-title{font-weight:850;font-size:12px;letter-spacing:-.1px}.speed-box{border:1px solid #e2eaf5;border-radius:14px;padding:12px;background:linear-gradient(180deg,#fbfdff,#f6f9ff);display:grid;gap:9px}.speed-head{display:flex;justify-content:space-between;align-items:center}.speed-head label{font-size:11px;color:#53627a;font-weight:750}.speed-value{width:88px;height:33px;border:1px solid #dbe4f0;border-radius:9px;padding:0 9px;text-align:right;color:#17233d;background:#fff;font-size:12px;font-weight:750;outline:none}.speed-value:focus,.field select:focus,.mini-speed:focus{border-color:#8eabff;box-shadow:0 0 0 3px rgba(49,94,251,.12)}.range{width:100%;accent-color:#315efb;margin:0}.actions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.btn{height:38px;border:0;border-radius:11px;display:flex;align-items:center;justify-content:center;gap:7px;font-size:11px;font-weight:800;padding:0 9px;transition:transform .14s ease,background .14s ease,box-shadow .14s ease}.btn:hover:not(:disabled){transform:translateY(-1px)}.primary{background:linear-gradient(135deg,#3971ff,#2856e8);color:#fff;box-shadow:0 4px 10px rgba(49,94,251,.17)}.primary:hover{background:#244ed7}.soft{background:#edf3ff;color:#2755d9}.soft:hover{background:#e0eaff}.danger{background:#fff0f0;color:#c43f4a}.danger:hover{background:#ffe5e6}.btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
      .options{display:grid;grid-template-columns:1fr 1fr;gap:9px}.field{display:grid;gap:5px}.field label{font-size:10px;color:#8390a6;font-weight:750}.field select{height:34px;width:100%;border:1px solid #e2eaf3;border-radius:9px;background:#fff;padding:0 8px;color:#24324b;font-size:11px;outline:none}.checkrow{display:flex;align-items:center;gap:7px;font-size:10px;color:#596982;font-weight:650}.checkrow input{accent-color:#315efb;width:13px;height:13px}
      .points-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.point-tools{display:flex;gap:4px;align-items:center}.textbtn{background:transparent;border:0;padding:5px 4px;color:#315efb;font-size:10px;font-weight:800;border-radius:7px}.textbtn:hover{background:#eff4ff}.point-tools .textbtn{display:flex;align-items:center;gap:4px}.point-tools .textbtn svg{width:12px;height:12px}.pointlist{display:grid;gap:6px;max-height:190px;overflow:auto}.point{display:grid;grid-template-columns:27px minmax(0,1fr) auto;align-items:center;gap:8px;padding:8px;border:1px solid #e7edf5;border-radius:11px;background:#fff}.point.off{opacity:.5}.point-number{width:25px;height:25px;border-radius:8px;background:#edf3ff;color:#315efb;display:grid;place-items:center;font-size:10px;font-weight:850}.point-name{font-size:11px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.point-meta{font-size:9px;color:#8390a6;margin-top:2px}.ptools{display:flex;gap:1px;flex:0 0 auto}.ptools .icon{width:25px;height:25px}.ptools .icon svg{width:14px;height:14px}.empty{padding:16px 11px;text-align:center;border:1px dashed #c9d6e8;border-radius:12px;color:#8390a6;font-size:10px;line-height:1.65;background:#fafcff}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.stat{padding:9px;border-radius:11px;background:#f7f9fd;border:1px solid #edf1f7}.stat span{display:block;font-size:9px;color:#8390a6}.stat strong{display:block;font-size:15px;font-variant-numeric:tabular-nums;color:#203a80;margin-top:2px}.message{padding:9px 10px;background:#fff8ed;color:#9a5b17;border:1px solid #f8dfbb;border-radius:10px;font-size:10px}.message.hidden{display:none}.foot{display:flex;align-items:center;justify-content:space-between;gap:5px;border-top:1px solid #edf1f7;padding:10px 12px;background:#fbfcff}.foot span{font-size:9px;color:#94a3b8}.foot .textbtn{display:flex;align-items:center;gap:5px}
      /* Mode 2 — single vertical dock, inspired by the supplied reference */
      .mini{width:100px;max-width:calc(100vw - 12px);max-height:calc(100vh - 16px);overflow:visible;scrollbar-width:none;display:flex;flex-direction:column;align-items:center;gap:9px;padding:10px 8px 9px;border:1.5px solid #d7c2ff;border-radius:40px;background:rgba(255,255,255,.94);box-shadow:0 0 0 4px rgba(193,160,255,.12),0 13px 38px rgba(116,76,190,.2),0 2px 8px rgba(44,35,74,.08);color:#17233d;backdrop-filter:blur(18px);isolation:isolate}
      .mini-top{width:100%;height:13px;display:flex;align-items:center;justify-content:center;position:relative;cursor:grab;touch-action:none;user-select:none}.mini-top:active{cursor:grabbing}.mini-grip{display:grid;place-items:center;color:#b5a3df}.mini-grip svg{width:17px;height:17px}.mini-close{position:absolute!important;right:-13px;top:-11px;width:19px!important;height:19px!important;border-radius:50%!important;background:#f3eaff!important;border:1px solid #dccbfa!important;color:#ad91e4!important;box-shadow:0 2px 6px rgba(120,90,180,.13)}.mini-close svg{width:11px;height:11px}
      .mini-clear{width:36px;height:36px;display:grid;place-items:center;border-radius:50%;background:#fff5f7;border:1.5px solid #f4a2b5;color:#ed5577;box-shadow:0 3px 8px rgba(230,80,120,.08);padding:0;transition:transform .16s,background .16s}.mini-clear svg{width:17px;height:17px}.mini-clear:hover:not(:disabled){transform:translateY(-1px);background:#ffeaf0}.mini-clear:disabled{opacity:.35;cursor:not-allowed}
      .mini-metrics{width:100%;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:2px;padding:7px 3px 6px;border:1px solid #eee8f8;border-radius:14px;background:linear-gradient(180deg,#fbfaff,#f6f2fc);text-align:center}.mini-metric{min-width:0;display:grid;gap:3px;justify-items:center}.mini-metric small{font-size:6.5px;line-height:1;font-weight:850;letter-spacing:.3px;color:#9a91aa;text-transform:uppercase;white-space:nowrap}.mini-metric strong{font-size:11px;line-height:1.1;font-weight:850;color:#34304c;font-variant-numeric:tabular-nums}.mini-status{font-size:7px;line-height:1;font-weight:850;letter-spacing:1.2px;color:#9a91aa;text-transform:uppercase;margin-top:-4px}
      .mini-toggle{width:62px;height:62px;border-radius:50%;display:grid;place-items:center;border:2px solid #64d7e9;background:linear-gradient(145deg,#f7fdff,#e9faff);color:#36bed2;box-shadow:0 5px 15px rgba(64,199,217,.13);padding:0;transition:transform .16s,box-shadow .16s,background .16s}.mini-toggle svg{width:23px;height:23px;fill:currentColor;stroke-width:1.6}.mini-toggle:hover:not(:disabled){transform:scale(1.035);box-shadow:0 7px 18px rgba(64,199,217,.2)}.mini-toggle.running{border-color:#f29ab0;color:#e45d7d;background:linear-gradient(145deg,#fff7fa,#fff0f4);box-shadow:0 5px 15px rgba(228,93,125,.12)}.mini-toggle:disabled{opacity:.45;cursor:not-allowed}
      .mini-speed-wrap{width:100%;display:flex;align-items:center;justify-content:space-between;gap:1px;padding:3px 2px;border:1px solid #eee8f8;border-radius:12px;background:#faf8fd}.mini-speed-step{width:14px;height:24px;display:grid;place-items:center;flex:none;border:0;border-radius:7px;background:transparent;color:#9e96ae;padding:0}.mini-speed-step svg{width:12px;height:12px}.mini-speed-step:hover{background:#eee8f8;color:#7254bc}.mini-speed{width:46px;min-width:46px;height:26px;border:0;border-radius:5px;padding:0;text-align:center;font-size:12px;font-weight:900;background:transparent;color:#504a61;outline:none;font-variant-numeric:tabular-nums}.mini-speed:focus{background:#fff;box-shadow:0 0 0 2px rgba(169,139,230,.2)}.mini-speed-unit{font-size:9px;color:#777087;font-weight:850;margin-right:2px}
      .mini-add{width:43px;height:43px;display:grid;place-items:center;border:0;border-radius:50%;background:linear-gradient(145deg,#9860ff,#7536e9);color:#fff;box-shadow:0 6px 14px rgba(127,69,235,.25),inset 0 1px 0 rgba(255,255,255,.25);padding:0;transition:transform .16s,box-shadow .16s}.mini-add svg{width:23px;height:23px}.mini-add:hover{transform:translateY(-2px);box-shadow:0 8px 18px rgba(127,69,235,.32)}
      .mini-mode-trigger{width:100%;height:11px;display:grid;place-items:center;border:0;background:transparent;color:#c0a9ed;padding:0;cursor:pointer}.mini-mode-trigger svg{width:17px;height:12px}.mini-mode-menu{position:absolute;right:calc(100% + 9px);bottom:7px;width:142px;padding:5px;display:grid;gap:3px;border:1px solid #e7def7;border-radius:13px;background:#fff;box-shadow:0 12px 32px rgba(57,42,91,.18);z-index:5}.mini-mode-menu button{height:30px;display:flex;align-items:center;gap:8px;border:0;border-radius:8px;background:transparent;color:#5f5870;font-size:10px;font-weight:750;padding:0 8px;text-align:left}.mini-mode-menu button svg{width:13px;height:13px}.mini-mode-menu button:hover,.mini-mode-menu button[aria-current="true"]{background:#f2edff;color:#7447cd}
      .tab-handle{width:38px;height:76px;border:1px solid #dce6f4;background:linear-gradient(155deg,#fff,#f2f6ff);color:#315efb;box-shadow:0 12px 30px rgba(18,35,71,.2);border-radius:14px;display:grid;place-items:center}.tab-handle svg{width:19px;height:19px}.tab-handle .tab-dot{width:7px;height:7px;border-radius:99px;background:#94a3b8;position:absolute;top:9px;right:8px}.tab-handle .tab-dot.running{background:#16a34a}.tab-handle .tab-dot.paused{background:#d97706}
      .hidden{display:none!important}.markers{position:fixed;inset:0;pointer-events:none}.marker{position:fixed;appearance:none;transform:translate(-50%,-50%);width:29px;height:29px;border:2px solid #fff;border-radius:50%;background:linear-gradient(145deg,#4f82ff,#2855df);color:#fff;box-shadow:0 3px 13px rgba(15,23,42,.28),0 0 0 2px rgba(49,94,251,.12);display:grid;place-items:center;font-size:10px;font-weight:900;pointer-events:auto;touch-action:none;cursor:grab;padding:0;z-index:1;transition:transform .16s cubic-bezier(.2,.8,.2,1),box-shadow .16s,filter .16s;user-select:none}.marker:hover,.marker:focus-visible{transform:translate(-50%,-50%) scale(1.22);z-index:4;box-shadow:0 6px 20px rgba(15,23,42,.32),0 0 0 4px rgba(49,94,251,.16);filter:saturate(1.12);outline:none}.marker:active{cursor:grabbing;transform:translate(-50%,-50%) scale(1.12)}.marker.off{background:linear-gradient(145deg,#aab4c4,#7d899c)}.marker-number{pointer-events:none}.marker-delete{position:absolute;right:-10px;top:-11px;width:21px;height:21px;border:1.5px solid #fff;border-radius:50%;background:linear-gradient(145deg,#ff6678,#e52d49);color:#fff;display:grid;place-items:center;padding:0;opacity:0;visibility:hidden;transform:scale(.65);box-shadow:0 3px 9px rgba(229,45,73,.32);transition:opacity .14s,transform .14s,visibility .14s;cursor:pointer;z-index:6;pointer-events:auto}.marker-delete svg{width:11px;height:11px;stroke-width:2.5;pointer-events:none}.marker:hover .marker-delete,.marker:focus-visible .marker-delete,.marker-delete:hover,.marker-delete:focus-visible{opacity:1;visibility:visible;transform:scale(1)}.marker-delete:active{transform:scale(.88);background:#c91f3a}.click-ripple{position:fixed;width:22px;height:22px;border:2px solid rgba(74,207,232,.95);border-radius:50%;box-shadow:0 0 0 3px rgba(74,207,232,.18),inset 0 0 10px rgba(74,207,232,.12);transform:translate(-50%,-50%) scale(.35);opacity:.95;pointer-events:none;z-index:0;animation:uac-click-ripple .72s cubic-bezier(.12,.72,.22,1) forwards}@keyframes uac-click-ripple{0%{transform:translate(-50%,-50%) scale(.35);opacity:.95}65%{opacity:.55}100%{transform:translate(-50%,-50%) scale(3.8);opacity:0}}@media(prefers-reduced-motion:reduce){.click-ripple{animation-duration:.01ms}}.marker-label{position:fixed;transform:translate(11px,-50%);padding:4px 7px;border-radius:6px;background:#17233d;color:#fff;font-size:9px;white-space:nowrap;pointer-events:none}
      button{ -webkit-tap-highlight-color:transparent }button:not(:disabled){transition:transform .16s cubic-bezier(.2,.8,.2,1),filter .16s,box-shadow .16s}button:not(:disabled):active{transform:scale(.94);filter:brightness(.96)}button:focus-visible{outline:3px solid rgba(49,94,251,.28);outline-offset:2px}.btn:active,.mini-toggle:active,.mini-add:active,.mini-clear:active{transform:scale(.94)}.mini-speed-step:active{transform:scale(.88);background:#e7ddfa}.marker:active{transform:translate(-50%,-50%) scale(1.12)}
      .picker{position:fixed;inset:0;z-index:2147483647;pointer-events:auto;cursor:crosshair;background:rgba(49,94,251,.05)}.picker-hint{position:fixed;top:14px;left:50%;transform:translateX(-50%);background:#fff;border:1px solid #c9d8ff;border-radius:12px;padding:11px 15px;box-shadow:0 10px 28px rgba(15,23,42,.18);color:#203a80;font-size:12px;font-weight:750;white-space:nowrap}.picker-cross{position:fixed;width:24px;height:24px;border:1.5px solid #315efb;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none}.picker-cross:before,.picker-cross:after{content:"";position:absolute;background:#315efb}.picker-cross:before{width:38px;height:1px;left:-8px;top:10px}.picker-cross:after{height:38px;width:1px;left:10px;top:-8px}
      :host([data-theme="dark"]){color-scheme:dark;color:#edf3ff}:host([data-theme="dark"]) .panel,:host([data-theme="dark"]) .mini,:host([data-theme="dark"]) .tab-handle{background:#111a2b;border-color:#2d3d59;color:#edf3ff}:host([data-theme="dark"]) .top{background:linear-gradient(135deg,#17243a,#1d2c46);border-color:#293b58}:host([data-theme="dark"]) .brand,:host([data-theme="dark"]) .section-title,:host([data-theme="dark"]) .stat strong,:host([data-theme="dark"]) .mini-stat strong{color:#eaf0ff}:host([data-theme="dark"]) .speed-box,:host([data-theme="dark"]) .stat,:host([data-theme="dark"]) .mini-speed-wrap{background:#17243a;border-color:#2c3c58}:host([data-theme="dark"]) .point,:host([data-theme="dark"]) .field select,:host([data-theme="dark"]) .speed-value,:host([data-theme="dark"]) .mini-speed,:host([data-theme="dark"]) .mini-action,:host([data-theme="dark"]) .mini-bottom .icon{background:#131f33;border-color:#2c3c58;color:#dce7fa}:host([data-theme="dark"]) .mini-action.primary{background:#315efb;border-color:#315efb;color:#fff}:host([data-theme="dark"]) .mini-action.danger{background:#321e2a;border-color:#513040;color:#fca5a5}:host([data-theme="dark"]) .mini-label{color:#bcd0ff}:host([data-theme="dark"]) .mini-status,:host([data-theme="dark"]) .muted,:host([data-theme="dark"]) .field label,:host([data-theme="dark"]) .mini-stat,:host([data-theme="dark"]) .mini-speed-unit{color:#9aabc5}:host([data-theme="dark"]) .point{border-color:#2c3c58}:host([data-theme="dark"]) .foot{background:#17243a;border-color:#2c3c58}:host([data-theme="dark"]) .empty{background:#131f33;border-color:#3a4b69;color:#9aabc5}:host([data-theme="dark"]) .mini-divider{background:#2b3b56}:host([data-theme="dark"]) .mini-dot{background:#60718a;box-shadow:0 0 0 3px #263650}:host([data-theme="dark"]) .mini-dot.running{background:#22c55e;box-shadow:0 0 0 3px #17472f}:host([data-theme="dark"]) .mini-dot.paused{background:#f59e0b;box-shadow:0 0 0 3px #4b371a}
      :host([data-theme="dark"]) .mini{background:rgba(22,18,37,.97);border-color:#604a83;box-shadow:0 0 0 4px rgba(134,97,191,.13),0 14px 38px rgba(0,0,0,.35)}
      :host([data-theme="dark"]) .mini-metrics,:host([data-theme="dark"]) .mini-speed-wrap{background:#211b31;border-color:#44365e}
      :host([data-theme="dark"]) .mini-metric small,:host([data-theme="dark"]) .mini-status{color:#a99bc2}:host([data-theme="dark"]) .mini-metric strong,:host([data-theme="dark"]) .mini-speed{color:#f0eaff}
      :host([data-theme="dark"]) .mini-speed-step{color:#b2a1d0}:host([data-theme="dark"]) .mini-close{background:#302541!important;border-color:#55406f!important;color:#c4a8ef!important}
      :host([data-theme="dark"]) .mini-mode-menu{background:#211b31;border-color:#493a62}:host([data-theme="dark"]) .mini-mode-menu button{color:#dfd5ef}:host([data-theme="dark"]) .mini-mode-menu button:hover,:host([data-theme="dark"]) .mini-mode-menu button[aria-current="true"]{background:#3b2d55;color:#d6bdff}
      @media(max-width:480px){.panel{max-height:calc(100vh - 12px);width:min(354px,calc(100vw - 12px))}.mini{width:90px;gap:7px;padding:8px 7px}}
      @media(prefers-reduced-motion:no-preference){.panel,.mini,.tab-handle{transition:box-shadow .18s ease,transform .18s ease,opacity .18s ease}.icon,.btn,.mini-action{transition:background .14s ease,color .14s ease,border-color .14s ease,transform .14s ease}}
    </style>
    <div class="markers" id="markers"></div>
    <section class="panel" id="panel" aria-label="Ultimate Autoclicker full panel">
      <header class="top" id="drag-panel">
        <div class="brand-mark">U</div><div class="brand">Ultimate Autoclicker</div>
        <div class="status"><i class="dot" id="dot"></i><span id="status">Stopped</span></div>
        <button class="icon" id="side" title="Move to other edge" aria-label="Move to other edge"><i data-lucide="move"></i></button>
        <button class="icon" id="to-mini" title="Mode 2 · Vertical compact" aria-label="Switch to Mode 2 · Vertical compact"><i data-lucide="panel-right"></i></button>
        <button class="icon" id="to-tab" title="Mode 1 · Edge tab" aria-label="Switch to Mode 1 · Edge tab"><i data-lucide="panel-left"></i></button><button class="icon" id="close-widget" title="Hide controls for this page" aria-label="Hide controls for this page"><i data-lucide="x"></i></button>
      </header>
      <div class="body">
        <div class="speed-box">
          <div class="speed-head"><label for="interval">Click interval</label><div class="row"><input id="interval" class="speed-value" type="number" min="1" max="60000" step="1" value="500" aria-label="Click interval in milliseconds"><span class="muted">ms</span></div></div>
          <input class="range" id="speed" type="range" min="1" max="5000" step="1" value="500" aria-label="Click interval slider">
          <div class="row between"><span class="muted">Fast</span><span class="muted">Slow</span></div>
        </div>
        <div class="actions">
          <button class="btn primary" id="start"><i data-lucide="play"></i>Play</button>
          <button class="btn soft" id="pause"><i data-lucide="pause"></i>Pause</button>
          <button class="btn danger" id="stop"><i data-lucide="square"></i>Stop</button>
        </div>
        <div class="options">
          <div class="field"><label for="mouse-button">Mouse button</label><select id="mouse-button"><option value="left">Left click</option><option value="right">Right click</option><option value="middle">Middle click</option></select></div>
          <div class="field"><label for="click-multiplier">Clicks per point</label><select id="click-multiplier"><option value="1">×1</option><option value="2">×2</option><option value="3">×3</option></select></div>
        </div>
        <div class="row between"><label class="checkrow"><input id="humanize" type="checkbox"> Humanize interval ±10%</label><label class="checkrow"><input id="cursor-mode" type="checkbox"> Cursor mode</label></div>
        <div class="points-head"><div class="section-title">Click points <span class="muted" id="point-count">0 / 100</span></div><div class="point-tools"><button class="textbtn" id="manual"><i data-lucide="mouse-pointer-2"></i>Coordinates</button><button class="textbtn" id="clear"><i data-lucide="trash-2"></i>Clear</button><button class="textbtn" id="add"><i data-lucide="plus-circle"></i>Add point</button></div></div>
        <div class="pointlist" id="points"><div class="empty">No points yet.<br>Press Add point, then select a spot on the page.</div></div>
        <div class="stats"><div class="stat"><span>Clicks</span><strong id="clicks">0</strong></div><div class="stat"><span>Cycles</span><strong id="cycles">0</strong></div><div class="stat"><span>Points</span><strong id="enabled-points">0</strong></div></div>
        <div class="message hidden" id="message" role="status"></div>
      </div>
      <footer class="foot"><span>Page-local · up to 100 points</span><button class="textbtn" id="timeline"><i data-lucide="workflow"></i>Timeline</button><button class="textbtn" id="settings"><i data-lucide="settings"></i>Settings</button></footer>
    </section>
    <section class="mini hidden" id="mini" aria-label="Ultimate Autoclicker vertical compact controls" aria-hidden="true">
      <div class="mini-top" id="drag-mini" title="Drag to move"><span class="mini-grip"><i data-lucide="grip-horizontal"></i></span><button class="mini-close" id="mini-close" title="Hide controls" aria-label="Hide controls"><i data-lucide="x"></i></button></div>
      <button class="mini-clear" id="mini-clear" title="Delete all points" aria-label="Delete all points" disabled><i data-lucide="trash-2"></i></button>
      <div class="mini-metrics" aria-label="Points, cycles and clicks">
        <div class="mini-metric"><small>Point</small><strong id="mini-points">0</strong></div>
        <div class="mini-metric"><small>Cycle</small><strong id="mini-cycles">0</strong></div>
        <div class="mini-metric"><small>Clicks</small><strong id="mini-clicks">0</strong></div>
      </div>
      <div class="mini-status" id="mini-status">Idle</div>
      <button class="mini-toggle" id="mini-toggle" title="Play" aria-label="Play"><i data-lucide="play"></i></button>
      <div class="mini-speed-wrap" title="Click interval in seconds">
        <button class="mini-speed-step" id="mini-speed-down" title="Decrease speed interval" aria-label="Decrease interval"><i data-lucide="chevron-left"></i></button>
        <input id="mini-speed" class="mini-speed" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" value="0.50" aria-label="Click interval in seconds" title="Current interval in seconds">
        <span class="mini-speed-unit">s</span>
        <button class="mini-speed-step" id="mini-speed-up" title="Increase speed interval" aria-label="Increase interval"><i data-lucide="chevron-right"></i></button>
      </div>
      <button class="mini-add" id="mini-add" title="Add point" aria-label="Add point"><i data-lucide="plus"></i></button>
      <button class="mini-mode-trigger" id="mini-modes" title="Change display mode" aria-label="Change display mode"><i data-lucide="grip-horizontal"></i></button>
      <div class="mini-mode-menu hidden" id="mini-mode-menu" role="menu" aria-label="Display modes">
        <button id="mode-tab" role="menuitem"><i data-lucide="panel-left"></i>Mode 1 · Edge Tab</button>
        <button id="mode-mini" role="menuitem" aria-current="true"><i data-lucide="panel-right"></i>Mode 2 · Vertical</button>
        <button id="mode-panel" role="menuitem"><i data-lucide="layout-dashboard"></i>Mode 3 · Full Panel</button>
      </div>
    </section>
    <button class="tab-handle hidden" id="tab-handle" aria-label="Open Ultimate Autoclicker controls" title="Open Ultimate Autoclicker"><i class="tab-dot" id="tab-dot"></i><i data-lucide="chevron-right"></i></button>
  `;
  (document.documentElement || document.body).appendChild(host);
  window.UACIcons?.replace(shadow);

  const $ = selector => shadow.querySelector(selector);
  const panel = $('#panel'), mini = $('#mini'), tabHandle = $('#tab-handle'), markerLayer = $('#markers'), miniModeMenu = $('#mini-mode-menu');
  let current = window.UAC.snapshot();
  let activeMode = 'mini';
  let picker = null;
  let dragState = null;
  let markerDrag = null;
  let settingsSave = Promise.resolve();
  let playbackTogglePending = false;
  const pendingPointDeletes = new Set();

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
  const safeText = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const iconButton = (id, title, icon, dataAction = '') => `<button class="icon" id="${id}" title="${title}" aria-label="${title}" ${dataAction ? `data-action="${dataAction}"` : ''}><i data-lucide="${icon}"></i></button>`;

  function saveSettings(patch) {
    const latest = { ...(current.settings || {}), ...patch };
    current.settings = latest;
    settingsSave = settingsSave.then(() => { if (!globalThis.chrome?.runtime?.id) throw contextExpiredError(); return chrome.storage.local.set({ uacSettings: latest }); });
    return settingsSave;
  }

  function setMode(mode, persist = true) {
    const valid = ['panel', 'mini', 'tab', 'hidden'].includes(mode) ? mode : 'mini';
    panel.classList.toggle('hidden', valid !== 'panel');
    mini.classList.toggle('hidden', valid !== 'mini');
    tabHandle.classList.toggle('hidden', valid !== 'tab');
    panel.setAttribute('aria-hidden', String(valid !== 'panel'));
    mini.setAttribute('aria-hidden', String(valid !== 'mini'));
    tabHandle.setAttribute('aria-hidden', String(valid !== 'tab'));
    miniModeMenu.classList.add('hidden');
    $('#mode-tab').setAttribute('aria-current', String(valid === 'tab'));
    $('#mode-mini').setAttribute('aria-current', String(valid === 'mini'));
    $('#mode-panel').setAttribute('aria-current', String(valid === 'panel'));
    if (valid !== 'hidden') current.settings.floatingMode = valid;
    activeMode = valid;
    if (valid === 'panel') { current.settings.floatingCompact = false; current.settings.floatingHidden = false; }
    if (valid === 'mini') { current.settings.floatingCompact = true; current.settings.floatingHidden = false; }
    if (valid === 'tab') { current.settings.floatingCompact = false; current.settings.floatingHidden = true; }
    updatePosition();
    if (persist && valid !== 'hidden') saveSettings({ floatingMode: valid, floatingCompact: valid === 'mini', floatingHidden: valid === 'tab' });
  }

  function updatePosition() {
    const side = current.settings?.floatingSide === 'left' ? 'left' : 'right';
    const custom = current.settings?.floatingPosition;
    const top = Number.isFinite(custom?.top) ? Math.max(6, Math.min(innerHeight - 70, custom.top)) : Math.round(innerHeight * .28);
    const requestedLeft = Number.isFinite(custom?.left) ? custom.left : null;
    for (const el of [panel, mini, tabHandle]) {
      const width = el.offsetWidth || (el === panel ? 354 : el === mini ? 82 : 38);
      const height = el.offsetHeight || (el === mini ? 320 : el === panel ? 480 : 76);
      const topLimit = Math.max(6, innerHeight - Math.min(height, innerHeight - 12) - 6);
      el.style.top = `${Math.max(6, Math.min(topLimit, top))}px`;
      if (requestedLeft !== null) {
        const left = Math.max(6, Math.min(Math.max(6, innerWidth - width - 6), requestedLeft));
        el.style.left = `${left}px`; el.style.right = 'auto';
      } else {
        el.style.left = side === 'left' ? '8px' : 'auto';
        el.style.right = side === 'left' ? 'auto' : '8px';
      }
    }
    mini.dataset.side = mini.getBoundingClientRect().left < innerWidth / 2 ? 'left' : 'right';
    if (side === 'left' && requestedLeft === null) tabHandle.style.transform = 'rotate(180deg)';
    else tabHandle.style.transform = '';
  }

  function setTheme() {
    const theme = current.settings?.theme || 'system';
    host.dataset.theme = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    host.style.opacity = String(Math.max(.45, Math.min(1, Number(current.settings?.floatingOpacity ?? 100) / 100)));
  }

  function updateMarkers() {
    const points = current.points || [];
    // Keep in-flight ripple animations when marker positions are re-rendered.
    const activeRipples = [...markerLayer.querySelectorAll('.click-ripple')];
    markerLayer.innerHTML = points.map((point, index) => {
      const x = point.pageX - scrollX, y = point.pageY - scrollY;
      return `<div class="marker ${point.enabled ? '' : 'off'}" data-marker="${safeText(point.id)}" style="left:${x}px;top:${y}px" title="Drag to move ${safeText(point.name)}" role="button" tabindex="0" aria-label="Click point ${index + 1}: ${safeText(point.name)}"><span class="marker-number">${index + 1}</span><button type="button" class="marker-delete" data-marker-delete="${safeText(point.id)}" title="Delete this point" aria-label="Delete point ${index + 1}">${window.UACIcons?.svg('trash-2') || '×'}</button></div>`;
    }).join('');
    activeRipples.forEach(ripple => markerLayer.appendChild(ripple));
  }

  function formatSeconds(ms) {
    const seconds = Math.max(0.001, Number(ms) / 1000);
    return seconds < 0.1 ? seconds.toFixed(3) : seconds.toFixed(2);
  }

  function render(data = window.UAC.snapshot()) {
    current = data;
    const status = data.status || 'stopped';
    $('#status').textContent = status[0].toUpperCase() + status.slice(1);
    $('#dot').className = `dot ${status}`;
    $('#tab-dot').className = `tab-dot ${status}`;
    $('#mini-status').textContent = status === 'running' ? 'Running' : status === 'paused' ? 'Paused' : 'Idle';
    $('#mini-points').textContent = Number(data.points.length || 0).toLocaleString();
    $('#mini-cycles').textContent = Number(data.cycleCount || 0).toLocaleString();
    $('#mini-clicks').textContent = Number(data.clickCount || 0).toLocaleString();
    $('#mini-clear').disabled = data.points.length === 0;
    const miniToggle = $('#mini-toggle');
    const isRunning = status === 'running';
    const toggleIcon = isRunning ? 'square' : 'play';
    miniToggle.classList.toggle('running', isRunning);
    miniToggle.title = isRunning ? 'Stop' : status === 'paused' ? 'Resume' : 'Play';
    miniToggle.setAttribute('aria-label', miniToggle.title);
    miniToggle.innerHTML = window.UACIcons?.svg(toggleIcon) || '';
    $('#clicks').textContent = Number(data.clickCount || 0).toLocaleString();
    $('#cycles').textContent = Number(data.cycleCount || 0).toLocaleString();
    $('#point-count').textContent = `${data.points.length} / 100`;
    $('#enabled-points').textContent = String(data.points.filter(point => point.enabled).length);
    $('#message').textContent = data.lastError || '';
    $('#message').classList.toggle('hidden', !data.lastError);
    $('#start').disabled = status === 'running';
    $('#pause').disabled = status !== 'running';


    const interval = Number(data.settings?.globalIntervalOverride ?? data.settings?.defaultInterval ?? 500);
    $('#interval').value = String(interval);
    $('#speed').value = String(Math.min(5000, interval));
    $('#mini-speed').value = formatSeconds(interval);
    $('#mouse-button').value = data.settings?.defaultButton || 'left';
    $('#click-multiplier').value = String(data.settings?.defaultClickCount || 1);
    $('#humanize').checked = Boolean(data.settings?.humanize);
    $('#cursor-mode').checked = Boolean(data.settings?.cursorMode);

    $('#points').innerHTML = data.points.length ? data.points.map((point, index) => `
      <div class="point ${point.enabled ? '' : 'off'}" data-id="${safeText(point.id)}">
        <span class="point-number">${index + 1}</span>
        <div><div class="point-name">${safeText(point.name)}</div><div class="point-meta">Page coordinates · ${Math.round(point.pageX)} × ${Math.round(point.pageY)} · ${point.interval ? `${point.interval} ms` : 'Global interval'} · ${Number(point.count || 0).toLocaleString()} clicks</div></div>
        <div class="ptools">
          ${iconButton('toggle-' + index, point.enabled ? 'Disable point' : 'Enable point', point.enabled ? 'minus' : 'check', 'toggle')}
          ${iconButton('edit-' + index, 'Edit point', 'pencil', 'edit')}
          ${iconButton('duplicate-' + index, 'Duplicate point', 'copy', 'duplicate')}
          ${iconButton('delete-' + index, 'Delete point', 'trash-2', 'delete')}
        </div>
      </div>`).join('') : '<div class="empty">No points yet.<br>Press Add point, then select a spot on the page.</div>';
    window.UACIcons?.replace($('#points'));
    updateMarkers();
  }

  async function sendCommand(type, data = {}) {
    const response = await runtimeMessage({ type: 'UAC_COMMAND', action: type, ...data });
    if (!response?.ok) throw new Error(response?.error || 'The extension could not complete this action.');
    if (response.state) render(response.state);
    return response;
  }

  function startPicker(name) {
    if (current.points.length >= 100) { alert('You can add up to 100 click points on one page.'); return; }
    if (picker) picker.remove();
    picker = document.createElement('div');
    picker.className = 'picker';
    picker.innerHTML = `<div class="picker-hint">Click a place on this page to add <b>${safeText(name)}</b> · Esc to cancel</div><div class="picker-cross"></div>`;
    shadow.appendChild(picker);
    const cross = picker.querySelector('.picker-cross');
    const onMove = event => { cross.style.left = `${event.clientX}px`; cross.style.top = `${event.clientY}px`; };
    const onKey = event => { if (event.key === 'Escape') finish(false); };
    const finish = success => {
      if (picker) picker.remove();
      picker = null;
      document.removeEventListener('keydown', onKey, true);
      if (!success) return;
    };
    picker.addEventListener('pointermove', onMove);
    picker.addEventListener('click', async event => {
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
      const point = { name, pageX: event.clientX + scrollX, pageY: event.clientY + scrollY, button: current.settings?.defaultButton || 'left', clickCount: current.settings?.defaultClickCount || 1, enabled: true, count: 0 };
      finish(true);
      try { await sendCommand('UAC_ADD_POINT', { point }); }
      catch (error) { alert(error.message); }
    }, true);
    document.addEventListener('keydown', onKey, true);
  }

  function setIntervalValue(value) {
    const interval = Math.max(1, Math.min(60000, Math.round(Number(value) || 1)));
    $('#interval').value = String(interval);
    $('#mini-speed').value = formatSeconds(interval);
    $('#speed').value = String(Math.min(5000, interval));
    saveSettings({ defaultInterval: interval, globalIntervalOverride: null });
  }

  async function start() {
    await sendCommand('UAC_START_WORKFLOW');
  }

  async function togglePlayback() {
    if (playbackTogglePending) return;
    playbackTogglePending = true;
    const toggleButton = $('#mini-toggle');
    toggleButton?.setAttribute('aria-busy', 'true');
    if (toggleButton) toggleButton.disabled = true;
    try { await sendCommand('UAC_TOGGLE_PLAYBACK'); }
    finally {
      playbackTogglePending = false;
      if (toggleButton?.isConnected) {
        toggleButton.disabled = false;
        toggleButton.removeAttribute('aria-busy');
      }
    }
  }

  function adjustMiniSpeed(deltaSeconds) {
    const currentSeconds = Number($('#mini-speed').value) || 0.5;
    const nextSeconds = Math.max(0.001, Math.min(60, currentSeconds + deltaSeconds));
    $('#mini-speed').value = nextSeconds < 0.1 ? nextSeconds.toFixed(3) : nextSeconds.toFixed(2);
    setIntervalValue(nextSeconds * 1000);
  }

  function beginDrag(event, el) {
    if (event.button !== 0 || event.target.closest('button,input,select')) return;
    const rect = el.getBoundingClientRect();
    dragState = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, el };
    el.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  shadow.addEventListener('pointerdown', event => {
    if (event.composedPath?.().some(node => node?.matches?.('[data-marker-delete]')) || event.target.closest?.('[data-marker-delete]')) { event.stopPropagation(); return; }
    const marker = event.target.closest?.('[data-marker]');
    if (marker) {
      const point = current.points.find(item => item.id === marker.dataset.marker);
      if (!point) return;
      markerDrag = { id: point.id, pointerId: event.pointerId, pageX: point.pageX, pageY: point.pageY };
      marker.setPointerCapture?.(event.pointerId);
      event.preventDefault();
      return;
    }
    if (event.target.closest?.('#drag-panel')) beginDrag(event, panel);
    else if (event.target.closest?.('#drag-mini')) beginDrag(event, mini);
  });

  shadow.addEventListener('pointermove', event => {
    if (markerDrag && markerDrag.pointerId === event.pointerId) {
      const point = current.points.find(item => item.id === markerDrag.id);
      if (!point) return;
      point.pageX = Math.max(0, event.clientX + scrollX);
      point.pageY = Math.max(0, event.clientY + scrollY);
      point.x = event.clientX; point.y = event.clientY;
      const marker = shadow.querySelector(`[data-marker="${CSS.escape(point.id)}"]`);
      if (marker) { marker.style.left = `${event.clientX}px`; marker.style.top = `${event.clientY}px`; }
      const row = shadow.querySelector(`.point[data-id="${CSS.escape(point.id)}"] .point-meta`);
      if (row) row.textContent = `${Math.round(point.pageX)} × ${Math.round(point.pageY)} · ${point.interval ? `${point.interval} ms` : 'Global interval'} · ${Number(point.count || 0).toLocaleString()} clicks`;
    } else if (dragState) {
      const width = dragState.el.offsetWidth || panel.offsetWidth;
      const height = dragState.el.offsetHeight || panel.offsetHeight;
      const left = Math.max(6, Math.min(innerWidth - width - 6, dragState.left + event.clientX - dragState.x));
      const top = Math.max(6, Math.min(innerHeight - height - 6, dragState.top + event.clientY - dragState.y));
      for (const el of [panel, mini, tabHandle]) { el.style.left = `${left}px`; el.style.right = 'auto'; el.style.top = `${top}px`; }
    }
  });

  shadow.addEventListener('pointerup', async event => {
    if (markerDrag && markerDrag.pointerId === event.pointerId) {
      const id = markerDrag.id; markerDrag = null;
      const point = current.points.find(item => item.id === id);
      if (point) {
        const response = await sendCommand('UAC_MOVE_POINT', { id, pageX: point.pageX, pageY: point.pageY }).catch(error => ({ ok: false, error: error.message }));
        if (!response.ok) alert(response.error);
      }
    }
    if (dragState) {
      const draggedElement = dragState.el;
      dragState = null;
      const rect = draggedElement.getBoundingClientRect();
      await saveSettings({ floatingPosition: { left: rect.left, top: rect.top } });
    }
  });

  shadow.addEventListener('click', async event => {
    try {
      const eventPath = event.composedPath?.() || [];
      const markerDelete = eventPath.find(node => node?.matches?.('[data-marker-delete]')) || event.target.closest?.('[data-marker-delete]');
      if (markerDelete) {
        event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
        const id = markerDelete.dataset.markerDelete;
        if (pendingPointDeletes.has(id)) return;
        const point = current.points.find(item => item.id === id);
        if (!point) return;
        pendingPointDeletes.add(id);
        markerDelete.disabled = true;
        try { await sendCommand('UAC_DELETE_POINT', { id }); }
        finally { pendingPointDeletes.delete(id); }
        return;
      }
      const button = event.target.closest?.('button');
      if (!button) return;
      if (button.id === 'add') startPicker(`Point ${current.points.length + 1}`);
      else if (button.id === 'manual') {
        const name = prompt('Point name', `Point ${current.points.length + 1}`);
        if (name === null) return;
        const xText = prompt('Page X coordinate (pixels)', String(Math.round(scrollX + innerWidth / 2)));
        if (xText === null) return;
        const yText = prompt('Page Y coordinate (pixels)', String(Math.round(scrollY + innerHeight / 2)));
        if (yText === null) return;
        const intervalText = prompt('Point interval in milliseconds (0 = use global interval)', '0');
        if (intervalText === null) return;
        const x = Number(xText), y = Number(yText), interval = Number(intervalText);
        if (![x, y, interval].every(Number.isFinite) || x < 0 || y < 0 || interval < 0 || interval > 60000) throw new Error('Enter valid non-negative coordinates and an interval from 0 to 60,000 ms.');
        await sendCommand('UAC_ADD_POINT', { point: { name: name.trim() || `Point ${current.points.length + 1}`, pageX: x, pageY: y, interval, button: current.settings?.defaultButton || 'left', clickCount: current.settings?.defaultClickCount || 1, enabled: true, count: 0 } });
      }
      else if (button.id === 'clear' || button.id === 'mini-clear') {
        if (current.points.length && confirm(`Delete all ${current.points.length} click points on this page?`)) await sendCommand('UAC_CLEAR_POINTS');
      } else if (button.id === 'start') await start();
      else if (button.id === 'pause') await sendCommand('UAC_PAUSE');
      else if (button.id === 'stop') await sendCommand('UAC_STOP');
      else if (button.id === 'mini-toggle') await togglePlayback();
      else if (button.id === 'to-mini') setMode('mini');
      else if (button.id === 'to-tab') setMode('tab');
      else if (button.id === 'close-widget' || button.id === 'mini-close') setMode('hidden', false);
      else if (button.id === 'expand' || button.id === 'mode-panel') setMode('panel');
      else if (button.id === 'mini-tab' || button.id === 'mode-tab') setMode('tab');
      else if (button.id === 'mode-mini') setMode('mini');
      else if (button.id === 'mini-modes') miniModeMenu.classList.toggle('hidden');
      else if (button.id === 'mini-speed-down') adjustMiniSpeed(-0.05);
      else if (button.id === 'mini-speed-up') adjustMiniSpeed(0.05);
      else if (button.id === 'mini-add') startPicker(`Point ${current.points.length + 1}`);
      else if (button.id === 'tab-handle') setMode('mini');
      else if (button.id === 'side') {
        const side = current.settings?.floatingSide === 'left' ? 'right' : 'left';
        await saveSettings({ floatingSide: side, floatingPosition: null }); updatePosition();
      } else if (button.id === 'timeline') await runtimeMessage({ type: 'UAC_OPEN_PAGE', path: 'timeline/index.html' });
      else if (button.id === 'settings') await runtimeMessage({ type: 'UAC_OPEN_PAGE', path: 'settings/index.html' });
      else if (['toggle', 'edit', 'duplicate', 'delete'].includes(button.dataset.action)) {
        const id = button.closest('.point')?.dataset.id;
        const point = current.points.find(item => item.id === id);
        if (!point) return;
        if (button.dataset.action === 'toggle') await sendCommand('UAC_UPDATE_POINT', { point: { id, enabled: !point.enabled } });
        else if (button.dataset.action === 'edit') {
          const name = prompt('Point name', point.name); if (name === null) return;
          const xText = prompt('Page X coordinate (pixels)', String(Math.round(point.pageX))); if (xText === null) return;
          const yText = prompt('Page Y coordinate (pixels)', String(Math.round(point.pageY))); if (yText === null) return;
          const intervalText = prompt('Point interval in milliseconds (0 = use global interval)', String(point.interval || 0)); if (intervalText === null) return;
          const countText = prompt('Clicks per point (1–3)', String(point.clickCount || 1)); if (countText === null) return;
          const buttonText = prompt('Mouse button: left, right or middle', point.button || 'left'); if (buttonText === null) return;
          const x = Number(xText), y = Number(yText), interval = Number(intervalText), clickCount = Number(countText), button = buttonText.trim().toLowerCase();
          if (![x, y, interval, clickCount].every(Number.isFinite) || x < 0 || y < 0 || interval < 0 || interval > 60000 || clickCount < 1 || clickCount > 3 || !['left', 'right', 'middle'].includes(button)) throw new Error('Enter valid coordinates, interval, click count and mouse button.');
          await sendCommand('UAC_UPDATE_POINT', { point: { id, name: name.trim() || point.name, pageX: x, pageY: y, interval, clickCount, button } });
        }
        else if (button.dataset.action === 'duplicate') {
          const { id: oldId, ...copy } = point;
          await sendCommand('UAC_ADD_POINT', { point: { ...copy, id: undefined, name: `${point.name} copy`, count: 0 } });
        }
        else if (button.dataset.action === 'delete' && confirm(`Delete “${point.name}”?`)) await sendCommand('UAC_DELETE_POINT', { id });
      }
    } catch (error) { alert(error.message || 'The action could not be completed.'); }
  });

  $('#interval').addEventListener('change', event => setIntervalValue(event.target.value));
  $('#mini-speed').addEventListener('change', event => {
    const raw = String(event.target.value).trim().replace(',', '.');
    const seconds = Number(raw);
    if (!Number.isFinite(seconds) || seconds <= 0) { event.target.value = formatSeconds(Number(current.settings?.defaultInterval || 500)); return; }
    setIntervalValue(seconds * 1000);
  });
  $('#mini-speed').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); event.target.blur(); } });
  $('#speed').addEventListener('input', event => { const value = Math.max(1, Math.round(Number(event.target.value))); $('#interval').value = String(value); $('#mini-speed').value = formatSeconds(value); });
  $('#speed').addEventListener('change', event => setIntervalValue(event.target.value));
  $('#mouse-button').addEventListener('change', async event => {
    const button = event.target.value;
    await saveSettings({ defaultButton: button });
    if (current.points.length) await sendCommand('UAC_UPDATE_POINT_DEFAULTS', { patch: { button } });
  });
  $('#click-multiplier').addEventListener('change', async event => {
    const clickCount = Number(event.target.value);
    await saveSettings({ defaultClickCount: clickCount });
    if (current.points.length) await sendCommand('UAC_UPDATE_POINT_DEFAULTS', { patch: { clickCount } });
  });
  $('#humanize').addEventListener('change', event => saveSettings({ humanize: event.target.checked }));
  $('#cursor-mode').addEventListener('change', event => saveSettings({ cursorMode: event.target.checked }));

  document.addEventListener('pointerdown', event => {
    if (!event.composedPath().includes(host) || !event.composedPath().some(node => node?.id === 'mini-modes' || node?.id === 'mini-mode-menu')) miniModeMenu.classList.add('hidden');
  }, true);
  window.addEventListener('uac:state', event => render(event.detail));
  window.addEventListener('uac:points', event => render(event.detail));
  window.addEventListener('uac:click-ripple', event => {
    const x = Number(event.detail?.x), y = Number(event.detail?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const ripple = document.createElement('span');
    ripple.className = 'click-ripple';
    ripple.style.left = `${x}px`; ripple.style.top = `${y}px`;
    markerLayer.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    window.setTimeout(() => ripple.remove(), 900);
  });
  window.addEventListener('uac:pick-point', event => startPicker(event.detail?.name || `Point ${current.points.length + 1}`));
  window.addEventListener('uac:deactivate', () => setMode('hidden', false));
  window.addEventListener('uac:activate', () => {
    const mode = current.settings?.floatingMode || (current.settings?.startup === 'hidden' ? 'tab' : current.settings?.startup === 'show' ? 'panel' : 'mini');
    setMode(mode, false);
  });
  window.addEventListener('scroll', updateMarkers, { passive: true, capture: true });
  window.addEventListener('resize', () => { updatePosition(); updateMarkers(); }, { passive: true });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.uacSettings) {
      current.settings = changes.uacSettings.newValue || {};
      setTheme(); updatePosition(); render(current);
      const mode = current.settings.floatingMode || (current.settings.floatingHidden ? 'tab' : current.settings.floatingCompact ? 'mini' : 'mini');
      if (mode !== activeMode) setMode(mode, false);
    }
  });
  window.addEventListener('uac:toggle-floating', () => {
    const preferred = current.settings?.floatingMode || 'mini';
    setMode(activeMode === 'hidden' ? preferred : 'hidden', false);
  });
  window.addEventListener('uac:show-floating', () => setMode(current.settings?.floatingMode || 'mini'));

  (async () => {
    try {
      const data = await chrome.storage.local.get(['uacSettings', 'uacModeInitialized']);
      current.settings = data.uacSettings || {};
      // One-time migration: all existing installs start in the new vertical Mode 2.
      // Subsequent manual mode selections are persisted and always respected.
      if (!data.uacModeInitialized) {
        current.settings = { ...current.settings, startup: 'compact', floatingMode: 'mini', floatingCompact: true, floatingHidden: false };
        await chrome.storage.local.set({ uacSettings: current.settings, uacModeInitialized: true });
      }
      setTheme(); updatePosition();
      const mode = current.settings.floatingMode || (current.settings.startup === 'hidden' ? 'tab' : current.settings.startup === 'show' ? 'panel' : 'mini');
      setMode(mode, false);
      render(window.UAC.snapshot());
    } catch (error) { console.error('Ultimate Autoclicker initialization failed:', error); }
  })();
})();
