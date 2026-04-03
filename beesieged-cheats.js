// ==UserScript==
// @name         🐝 EdShed Beesieged Cheats
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Infinite pollen, infinite health, unlock all units
// @match        https://play.edshed.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  // ─── 🔑 Change this PIN ───────────────────────────────────────────────────
  const SECRET_PIN = '1234';
  // ─────────────────────────────────────────────────────────────────────────

  // ─── State ────────────────────────────────────────────────────────────────
  let gameComp = null;
  let scene = null;
  let originalUnits = null;
  let moneyActive = false;
  let healthActive = false;
  let moneyFloor = 9999;
  let unitsUnlocked = false;
  let locked = true;
  let pinEntry = '';

  // ─── Styles ───────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #sc-host {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
    }
    #sc-panel {
      width: 230px;
      background: rgba(18, 16, 12, 0.95);
      border: 1px solid rgba(245, 185, 40, 0.3);
      border-radius: 14px;
      color: #fff;
      box-shadow: 0 12px 40px rgba(0,0,0,0.6);
      overflow: hidden;
      user-select: none;
    }
    #sc-panel * { box-sizing: border-box; margin: 0; padding: 0; }

    /* Header */
    #sc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: rgba(245, 185, 40, 0.1);
      border-bottom: 1px solid rgba(245, 185, 40, 0.15);
      cursor: grab;
    }
    #sc-header:active { cursor: grabbing; }
    #sc-title {
      font-size: 13px;
      font-weight: 700;
      color: #f5b928;
    }
    .sc-hbtn {
      background: rgba(255,255,255,0.08);
      border: none;
      color: rgba(255,255,255,0.6);
      cursor: pointer;
      font-size: 14px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-left: 6px;
    }
    .sc-hbtn:hover { background: rgba(255,255,255,0.15); color: #fff; }

    /* ── PIN screen ── */
    #sc-pin-screen {
      padding: 18px 16px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
    }
    #sc-pin-hint {
      font-size: 11px;
      color: rgba(255,255,255,0.35);
      letter-spacing: 0.04em;
    }
    #sc-pin-dots {
      display: flex;
      gap: 12px;
    }
    .sc-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.25);
      background: transparent;
      transition: background 0.15s, border-color 0.15s;
    }
    .sc-dot.sc-filled {
      background: #f5b928;
      border-color: #f5b928;
    }
    .sc-dot.sc-error {
      background: #ff453a;
      border-color: #ff453a;
    }
    #sc-pin-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 7px;
      width: 100%;
    }
    .sc-key {
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 9px;
      color: #fff;
      font-size: 16px;
      font-weight: 500;
      font-family: inherit;
      padding: 10px 0;
      cursor: pointer;
      transition: background 0.12s;
      text-align: center;
    }
    .sc-key:hover  { background: rgba(255,255,255,0.13); }
    .sc-key:active { background: rgba(255,255,255,0.2);  }
    .sc-key.sc-del { font-size: 18px; color: rgba(255,255,255,0.5); }
    .sc-key.sc-del:hover { color: #fff; }
    .sc-key.sc-zero { grid-column: 2; }

    /* ── Main controls ── */
    #sc-body {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    #sc-panel.sc-collapsed #sc-body,
    #sc-panel.sc-collapsed #sc-pin-screen { display: none; }

    .sc-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .sc-label {
      font-size: 12px;
      color: rgba(255,255,255,0.75);
      display: flex;
      align-items: center;
      gap: 7px;
      flex: 1;
    }
    .sc-live {
      font-size: 10px;
      color: rgba(255,255,255,0.3);
      font-variant-numeric: tabular-nums;
      min-width: 36px;
      text-align: right;
    }
    .sc-toggle { position: relative; width: 38px; height: 22px; flex-shrink: 0; }
    .sc-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
    .sc-track {
      position: absolute;
      inset: 0;
      background: rgba(255,255,255,0.12);
      border-radius: 11px;
      cursor: pointer;
      transition: background 0.25s;
    }
    .sc-track::after {
      content: '';
      position: absolute;
      width: 16px; height: 16px;
      background: #fff;
      border-radius: 50%;
      top: 3px; left: 3px;
      transition: transform 0.22s cubic-bezier(.4,0,.2,1);
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    }
    .sc-toggle input:checked + .sc-track { background: #34c759; }
    .sc-toggle input:checked + .sc-track::after { transform: translateX(16px); }
    .sc-divider { height: 1px; background: rgba(255,255,255,0.07); }
    .sc-unlock-btn {
      width: 100%;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 9px;
      color: rgba(255,255,255,0.75);
      font-size: 12px;
      font-weight: 500;
      padding: 8px 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      font-family: inherit;
      transition: background 0.15s;
    }
    .sc-unlock-btn:hover { background: rgba(255,255,255,0.1); }
    .sc-unlock-btn.sc-active {
      background: rgba(52, 199, 89, 0.15);
      border-color: rgba(52, 199, 89, 0.4);
      color: #34c759;
    }
    #sc-status {
      font-size: 10px;
      color: rgba(255,255,255,0.25);
      text-align: center;
    }
    #sc-status.sc-ready   { color: rgba(52,199,89,0.8); }
    #sc-status.sc-waiting { color: rgba(245,185,40,0.7); }

    /* Disabled state while game isn't ready */
    .sc-toggle input:disabled + .sc-track { opacity: 0.35; cursor: not-allowed; }
    .sc-unlock-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  `;
  document.head.appendChild(style);

  // ─── HTML ─────────────────────────────────────────────────────────────────
  const host = document.createElement('div');
  host.id = 'sc-host';
  host.innerHTML = `
    <div id="sc-panel">

      <div id="sc-header">
        <span id="sc-title">🐝 Beesieged Cheats</span>
        <div style="display:flex;align-items:center">
          <button class="sc-hbtn" id="sc-lock-btn"  title="Lock">🔒</button>
          <button class="sc-hbtn" id="sc-min-btn"   title="Minimise">−</button>
        </div>
      </div>

      <!-- PIN screen -->
      <div id="sc-pin-screen">
        <span id="sc-pin-hint">Enter PIN to unlock</span>
        <div id="sc-pin-dots">
          <div class="sc-dot" id="sc-d0"></div>
          <div class="sc-dot" id="sc-d1"></div>
          <div class="sc-dot" id="sc-d2"></div>
          <div class="sc-dot" id="sc-d3"></div>
        </div>
        <div id="sc-pin-grid">
          <button class="sc-key" data-n="1">1</button>
          <button class="sc-key" data-n="2">2</button>
          <button class="sc-key" data-n="3">3</button>
          <button class="sc-key" data-n="4">4</button>
          <button class="sc-key" data-n="5">5</button>
          <button class="sc-key" data-n="6">6</button>
          <button class="sc-key" data-n="7">7</button>
          <button class="sc-key" data-n="8">8</button>
          <button class="sc-key" data-n="9">9</button>
          <button class="sc-key sc-del" id="sc-del-btn">⌫</button>
          <button class="sc-key sc-zero" data-n="0">0</button>
        </div>
      </div>

      <!-- Controls (hidden until unlocked) -->
      <div id="sc-body" style="display:none">

        <div class="sc-row">
          <span class="sc-label">🍯 Infinite Pollen</span>
          <span class="sc-live" id="sc-val-money">—</span>
          <label class="sc-toggle">
            <input type="checkbox" id="sc-tog-money">
            <span class="sc-track"></span>
          </label>
        </div>

        <div class="sc-row">
          <span class="sc-label">❤️ Infinite Health</span>
          <span class="sc-live" id="sc-val-health">—</span>
          <label class="sc-toggle">
            <input type="checkbox" id="sc-tog-health">
            <span class="sc-track"></span>
          </label>
        </div>

        <div class="sc-divider"></div>
        <button class="sc-unlock-btn" id="sc-units-btn">🔓 Unlock All Units</button>
        <div id="sc-status" class="sc-waiting">⏳ Waiting for game…</div>

      </div>
    </div>
  `;

  function mount() {
    if (!document.body) { setTimeout(mount, 100); return; }
    document.body.appendChild(host);
    init();
  }
  mount();

  // ─── Logic ────────────────────────────────────────────────────────────────
  function init() {
    const panel      = document.getElementById('sc-panel');
    const pinScreen  = document.getElementById('sc-pin-screen');
    const body       = document.getElementById('sc-body');
    const minBtn     = document.getElementById('sc-min-btn');
    const lockBtn    = document.getElementById('sc-lock-btn');
    const delBtn     = document.getElementById('sc-del-btn');
    const dots       = [0,1,2,3].map(i => document.getElementById('sc-d' + i));
    const togMoney   = document.getElementById('sc-tog-money');
    const togHealth  = document.getElementById('sc-tog-health');
    const valMoney   = document.getElementById('sc-val-money');
    const valHealth  = document.getElementById('sc-val-health');
    const unitsBtn   = document.getElementById('sc-units-btn');
    const statusEl   = document.getElementById('sc-status');
    const header     = document.getElementById('sc-header');
    const pinHint    = document.getElementById('sc-pin-hint');

    // ── PIN ──
    function updateDots(error) {
      dots.forEach((d, i) => {
        d.classList.remove('sc-filled', 'sc-error');
        if (error) { d.classList.add('sc-error'); return; }
        if (i < pinEntry.length) d.classList.add('sc-filled');
      });
    }

    function showError() {
      updateDots(true);
      pinHint.textContent = 'Wrong PIN — try again';
      pinHint.style.color = '#ff453a';
      setTimeout(() => {
        pinEntry = '';
        updateDots(false);
        pinHint.textContent = 'Enter PIN to unlock';
        pinHint.style.color = '';
      }, 900);
    }

    function pressKey(n) {
      if (pinEntry.length >= SECRET_PIN.length) return;
      pinEntry += n;
      updateDots(false);
      if (pinEntry.length === SECRET_PIN.length) {
        if (pinEntry === SECRET_PIN) {
          // Correct
          locked = false;
          pinEntry = '';
          updateDots(false);
          pinScreen.style.display = 'none';
          body.style.display = 'flex';
          lockBtn.style.display = '';
        } else {
          showError();
        }
      }
    }

    function doLock() {
      locked = true;
      pinEntry = '';
      updateDots(false);
      pinHint.textContent = 'Enter PIN to unlock';
      pinHint.style.color = '';
      body.style.display = 'none';
      pinScreen.style.display = '';
    }

    // Number keys
    document.getElementById('sc-pin-grid').addEventListener('click', e => {
      const btn = e.target.closest('.sc-key');
      if (!btn) return;
      if (btn === delBtn) {
        pinEntry = pinEntry.slice(0, -1);
        updateDots(false);
      } else if (btn.dataset.n !== undefined) {
        pressKey(btn.dataset.n);
      }
    });

    // Keyboard support for PIN entry
    document.addEventListener('keydown', e => {
      if (locked && /^[0-9]$/.test(e.key)) pressKey(e.key);
      if (locked && (e.key === 'Backspace' || e.key === 'Delete')) {
        pinEntry = pinEntry.slice(0, -1);
        updateDots(false);
      }
    });

    lockBtn.addEventListener('click', doLock);
    // Hide lock button initially (shown only when unlocked)
    lockBtn.style.display = 'none';

    // ── Minimise ──
    minBtn.addEventListener('click', () => {
      const c = panel.classList.toggle('sc-collapsed');
      minBtn.textContent = c ? '+' : '−';
    });

    // ── Drag ──
    let dragging = false, ox, oy, sx, sy;
    header.addEventListener('mousedown', e => {
      if (e.target.closest('.sc-hbtn')) return;
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      const r = host.getBoundingClientRect();
      ox = r.left; oy = r.top;
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      host.style.left  = (ox + e.clientX - sx) + 'px';
      host.style.top   = (oy + e.clientY - sy) + 'px';
      host.style.right = 'auto';
    });
    document.addEventListener('mouseup', () => dragging = false);

    // ── Cheat helpers ──
    function lockProp(obj, prop, floor) {
      let _v = Math.max(obj[prop] ?? floor, floor);
      Object.defineProperty(obj, prop, {
        get() { return _v; },
        set(v) { _v = Math.max(v, floor); },
        configurable: true,
      });
    }
    function unlockProp(obj, prop) {
      const cur = obj[prop];
      delete obj[prop];
      obj[prop] = cur;
    }

    togMoney.addEventListener('change', () => {
      if (!scene) return;
      moneyActive = togMoney.checked;
      if (moneyActive) {
        lockProp(scene, 'money', moneyFloor);
      } else { unlockProp(scene, 'money'); }
    });

    togHealth.addEventListener('change', () => {
      if (!scene) return;
      healthActive = togHealth.checked;
      healthActive ? lockProp(scene, 'health', 9999) : unlockProp(scene, 'health');
    });

    const ALL_UNITS = [
      'bee','honeybee','rangerbee','spikebee','bombus',
      'dewbee','pepperbee','freezebee','royalguard','flower',
    ].map(key => ({ key, unlockedThisSession: false }));

    unitsBtn.addEventListener('click', () => {
      if (!gameComp) return;
      unitsUnlocked = !unitsUnlocked;
      gameComp.unitsUnlocked = unitsUnlocked ? ALL_UNITS : (originalUnits || []);
      unitsBtn.classList.toggle('sc-active', unitsUnlocked);
      unitsBtn.textContent = unitsUnlocked ? '🔒 Restore Original Units' : '🔓 Unlock All Units';
    });

    // ── Enable / disable all controls based on game readiness ──
    function setControlsEnabled(enabled) {
      togMoney.disabled   = !enabled;
      togHealth.disabled  = !enabled;
      unitsBtn.disabled   = !enabled;
    }
    setControlsEnabled(false); // disabled until game is detected

    // ── Live ticker ──
    setInterval(() => {
      if (!scene) return;
      valMoney.textContent  = scene.money  ?? '—';
      valHealth.textContent = scene.health ?? '—';
    }, 800);

    // ── Re-apply whatever cheats are currently toggled on ──
    function reapplyCheats() {
      if (moneyActive)  lockProp(scene, 'money', moneyFloor);
      if (healthActive) {
        lockProp(scene, 'health', 9999);
      }
      if (unitsUnlocked) {
        gameComp.unitsUnlocked = ALL_UNITS;
      }
    }

    // ── Persistent game watcher — survives SPA navigation ──
    let sessionActive = false;

    setInterval(() => {
      const el = document.querySelector('[data-v-51d765c2]');

      // If we had a session, check it's still alive
      if (sessionActive) {
        const stillValid = el && el.__vue__ && el.__vue__.scene === scene;
        if (!stillValid) {
          // Game was torn down — reset and wait for a new one
          gameComp = null;
          scene = null;
          originalUnits = null;
          sessionActive = false;
          setControlsEnabled(false);
          statusEl.className   = 'sc-waiting';
          statusEl.textContent = '⏳ Waiting for game…';
        }
        return;
      }

      // No active session, look for a fresh game
      if (!el || !el.__vue__) return;
      const comp = el.__vue__;
      if (!comp.scene || comp.scene.money === undefined) return;

      gameComp      = comp;
      scene         = comp.scene;
      originalUnits = [...(gameComp.unitsUnlocked || [])];
      sessionActive = true;

      reapplyCheats();
      setControlsEnabled(true);  // restore any cheats that were on before navigation

      statusEl.className   = 'sc-ready';
      statusEl.textContent = '✅ Game ready';
      setTimeout(() => { statusEl.textContent = ''; }, 3000);
    }, 500);
  }

})();
