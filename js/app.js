import { exercises } from './data.js';
import { unlockAudio } from './audio.js';
import './stopwatch.js';
import './interval-timer.js';

// State
// The app always opens in Focus View. The header button names the view it
// switches to.
let listMode = 'focus'; // 'focus' or 'list' (shown as Expanded View)

// Utils
const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return 'Unknown date';
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// "1m 15s", "5m" or "45s" from a minutes value typed or filled into the form.
const formatDuration = (minutes) => {
    const total = Math.round(Number(minutes) * 60);
    if (!Number.isFinite(total) || total <= 0) return null;
    const m = Math.floor(total / 60);
    const s = total % 60;
    if (m && s) return `${m}m ${s}s`;
    return m ? `${m}m` : `${s}s`;
};

const LOG_PREFIX = 'logs_';

const isLogEntry = (entry) => !!entry
    && typeof entry === 'object'
    && typeof entry.date === 'string'
    && !Number.isNaN(new Date(entry.date).getTime())
    && !!entry.data
    && typeof entry.data === 'object'
    && !Array.isArray(entry.data);

// Never throws: unreadable or damaged history reads as empty rather than
// breaking the exercise page.
const getLogs = (id) => {
    try {
        const parsed = JSON.parse(localStorage.getItem(`${LOG_PREFIX}${id}`) || '[]');
        return Array.isArray(parsed) ? parsed.filter(isLogEntry) : [];
    } catch (e) {
        return [];
    }
};

const setLogs = (id, logs) => {
    try {
        localStorage.setItem(`${LOG_PREFIX}${id}`, JSON.stringify(logs));
        return true;
    } catch (e) {
        return false;
    }
};

const addLog = (id, data) => {
    const logs = getLogs(id);
    logs.unshift({
        date: new Date().toISOString(),
        data
    });
    return setLogs(id, logs);
};

// Ask the browser not to clear saved history when it is short on space.
let persistAsked = false;
const requestPersistentStorage = () => {
    if (persistAsked) return;
    persistAsked = true;
    try {
        navigator.storage?.persist?.().catch(() => {});
    } catch (e) {
        // Not supported; history still saves.
    }
};

const storageGet = (key) => {
    try { return localStorage.getItem(key); } catch (e) { return null; }
};

const storageSet = (key, value) => {
    try { localStorage.setItem(key, value); } catch (e) { /* private mode */ }
};

const storageRemove = (key) => {
    try { localStorage.removeItem(key); } catch (e) { /* private mode */ }
};

const CADENCE_ON_KEY = 'sj_cadence_on';
const CADENCE_BPM_KEY = 'sj_cadence_bpm';
const AGE_KEY = 'sj_age';
const BPM_MIN = 160;
const BPM_MAX = 190;

const readCadenceOn = () => storageGet(CADENCE_ON_KEY) === '1';

const readCadenceBpm = () => {
    const n = Number(storageGet(CADENCE_BPM_KEY));
    if (!Number.isInteger(n) || n < BPM_MIN || n > BPM_MAX) return 180;
    return n;
};

const readAge = () => {
    const raw = storageGet(AGE_KEY);
    if (raw == null || raw === '') return null;
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 10 || n > 110) return null;
    return n;
};

// Tanaka "niko niko" target: about 138 minus half your age.
const nikoNikoHeartRate = (age) => Math.round(138 - age / 2);

const heartRateHtml = (age, showRangeHint) => {
    if (age == null) {
        return `
            <p>Niko niko target heart rate is about 138 minus half your age.</p>
            ${showRangeHint ? '<p class="pace-hint">Enter an age from 10 to 110.</p>' : ''}
        `;
    }
    const hr = nikoNikoHeartRate(age);
    return `
        <div class="pace-hr">About ${hr} bpm</div>
        <p>138 minus half of ${age} (${age / 2}) is ${hr}. An approximate guide, not medical advice.</p>
    `;
};

const paintHeartRate = (age, showRangeHint = false) => {
    const el = document.getElementById('sj-hr');
    if (el) el.innerHTML = heartRateHtml(age, showRangeHint);
};

// Views
const renderList = () => {
    const isFocus = listMode === 'focus';

    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;">
            <h1>Functional Strength</h1>
            <button type="button" class="toggle-btn view-switch" onclick="window.toggleViewMode()">
                ${isFocus ? 'Expanded View' : 'Focus View'}
            </button>
        </div>
        
        <div class="exercise-list ${isFocus ? 'focus-mode' : ''}">
            ${exercises.map(ex => `
                <a href="#${ex.id}" class="card" style="text-decoration:none; color:inherit; display:flex;">
                    <div class="card-icon">
                        <img src="${ex.icon}" alt="${ex.title}" loading="lazy">
                    </div>
                    <div class="card-content">
                        <div class="card-title">${ex.title}</div>
                        <div class="card-desc">${ex.summary}</div>
                        ${isFocus ? '<div style="margin-top:16px; font-size:12px; opacity:0.6">Tap for Details</div>' : ''}
                    </div>
                </a>
            `).join('')}
        </div>

        <div class="card backup-card">
            <div class="card-title">Workout History Backup</div>
            <p class="backup-hint">Your history is stored only in this browser. Export a copy now and then so it can't be lost, and import it to restore or move to another phone.</p>
            <div class="backup-actions">
                <button type="button" class="toggle-btn" onclick="window.exportHistory()">Export history</button>
                <button type="button" class="toggle-btn" onclick="document.getElementById('import-file').click()">Import history</button>
                <input type="file" id="import-file" accept="application/json,.json" hidden onchange="window.importHistory(this)">
            </div>
            <div id="backup-status" class="form-status" role="status"></div>
        </div>
    `;
};

// Seconds from a saved duration such as "1m 5s", "5m" or "45s".
const parseDuration = (text) => {
    const match = /^(?:(\d+)m)?\s*(?:(\d+)s)?$/.exec(String(text ?? '').trim());
    if (!match || (match[1] == null && match[2] == null)) return null;
    return Number(match[1] || 0) * 60 + Number(match[2] || 0);
};

const historyItemHtml = (id, log, index, hideKeys = []) => `
    <div class="history-item">
        <div class="history-text">
            <div class="history-date">${escapeHtml(formatDate(log.date))}</div>
            <div>${Object.entries(log.data)
                .filter(([k]) => !hideKeys.includes(k))
                .map(([k, v]) => `${escapeHtml(k)}: ${escapeHtml(v)}`).join(' | ')}</div>
        </div>
        <button type="button" class="history-delete" aria-label="Delete this entry" onclick="window.deleteLog('${id}', ${index})">Delete</button>
    </div>
`;

// One history per side (left leg, right leg), each with its best time, so a
// weaker side is easy to spot.
const renderSidedHistory = (ex, logs) => {
    const indexed = logs.map((log, index) => ({ log, index }));
    const sections = ex.sides.map(side => {
        const entries = indexed.filter(e => e.log.data.side === side);
        const times = entries.map(e => parseDuration(e.log.data.duration)).filter(n => n != null);
        const best = times.length ? Math.max(...times) : null;
        return { side, entries, best };
    });
    const other = indexed.filter(e => !ex.sides.includes(e.log.data.side));
    const bests = sections.filter(s => s.best != null);
    const topBest = bests.length ? Math.max(...bests.map(s => s.best)) : null;
    const uneven = bests.length === ex.sides.length && bests.some(s => s.best !== topBest);

    return `
        <div class="card side-summary">
            <div class="card-title">Best Times</div>
            <div class="side-bests">
                ${sections.map(s => `
                    <div class="side-best ${uneven && s.best === topBest ? 'leading' : ''}">
                        <div class="side-best-label">${escapeHtml(s.side)}</div>
                        <div class="side-best-time">${s.best != null ? escapeHtml(formatDuration(s.best / 60) ?? '0s') : '--'}</div>
                        <div class="side-best-count">${s.entries.length} ${s.entries.length === 1 ? 'attempt' : 'attempts'}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        ${sections.filter(s => s.entries.length).map(s => `
            <div class="card">
                <div class="card-title">${escapeHtml(s.side)} History</div>
                ${s.entries.map(e => historyItemHtml(ex.id, e.log, e.index, ['side'])).join('')}
            </div>
        `).join('')}
        ${other.length ? `
            <div class="card">
                <div class="card-title">Other History</div>
                ${other.map(e => historyItemHtml(ex.id, e.log, e.index)).join('')}
            </div>
        ` : ''}
    `;
};

const renderHistory = (id) => {
    const logs = getLogs(id);
    if (!logs.length) return '';
    const ex = exercises.find(e => e.id === id);
    if (ex?.sides) return renderSidedHistory(ex, logs);
    return `
        <div class="card">
            <div class="card-title">History</div>
            ${logs.map((log, index) => historyItemHtml(id, log, index)).join('')}
        </div>
    `;
};

const renderDetail = (id) => {
    const ex = exercises.find(e => e.id === id);
    if (!ex) return '<div>Exercise not found</div>';

    const isSlowJog = ex.id === 'slow-jogging';
    const cadenceOn = isSlowJog && readCadenceOn();
    const cadenceBpm = readCadenceBpm();
    const age = isSlowJog ? readAge() : null;

    // Dynamic inputs based on type
    let inputHtml = '';
    if (ex.type === 'reps') {
        inputHtml = `
            <label for="input-reps">Reps</label>
            <input type="number" id="input-reps" min="0" step="1" inputmode="numeric" placeholder="0">
            ${ex.inputs?.includes('sets') ? `
                <label for="input-sets">Sets</label>
                <input type="number" id="input-sets" min="0" step="1" inputmode="numeric" placeholder="0">
            ` : ''}
        `;
    } else if (ex.type === 'duration' || ex.type === 'timer') {
        inputHtml = ex.durationUnit === 'seconds' ? `
            <label for="input-duration">Time (seconds)</label>
            <input type="number" id="input-duration" data-unit="seconds" min="0" step="1" inputmode="numeric" placeholder="0">
        ` : `
            <label for="input-duration">Duration (minutes)</label>
            <input type="number" id="input-duration" min="0" step="any" inputmode="decimal" placeholder="${ex.defaultDuration ? ex.defaultDuration / 60 : 0}">
        `;
    }

    inputHtml += `
        <label for="input-notes">Notes</label>
        <textarea id="input-notes" rows="3" placeholder="Add details..."></textarea>
    `;

    return `
        <div class="detail-view">
            <button class="btn btn-secondary" onclick="window.location.hash = ''">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                Back
            </button>
            
            <div class="detail-header">
                <div class="detail-icon">
                     <img src="${ex.icon}" alt="${ex.title}">
                </div>
                <h1>${ex.title}</h1>
            </div>
            
            <div class="card">
                <div class="card-title">Instructions</div>
                <ul class="instruction-list">
                    ${ex.instructions.map(i => `<li>${i}</li>`).join('')}
                </ul>
            </div>
            
            ${isSlowJog ? `
                <div class="card pace-card">
                    <div class="card-title">Pace Guide</div>
                    <div id="sj-hr">${heartRateHtml(age)}</div>
                    <label for="sj-age">Your age</label>
                    <input type="number" id="sj-age" inputmode="numeric" min="10" max="110" autocomplete="off" placeholder="e.g. 64" value="${age ?? ''}" oninput="window.setSlowJogAge(this.value)">
                    <p class="pace-safety">This is an approximate guide, not medical advice. Check with a doctor before starting a new exercise program, especially if you have a heart condition.</p>
                </div>
            ` : ''}

            <div class="card">
                <div class="card-title">Timer</div>
                ${ex.sides ? `
                    <div class="side-row" role="group" aria-label="Side">
                        ${ex.sides.map(side => `
                            <button type="button" class="toggle-btn side-btn ${side === currentSide(ex) ? 'active' : ''}" data-side="${side}" aria-pressed="${side === currentSide(ex) ? 'true' : 'false'}" onclick="window.setSide('${ex.id}', '${side}')">${side}</button>
                        `).join('')}
                    </div>
                ` : ''}
                ${ex.presets ? `
                    <div style="display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap;">
                        ${['Intervals', 'Continuous'].map(mode => `
                            <button type="button" class="toggle-btn ${mode === 'Intervals' ? 'active' : ''}" data-sj-mode="${mode}" onclick="window.setSlowJogMode('${ex.id}', '${mode}')">
                                ${mode}
                            </button>
                        `).join('')}
                    </div>
                    <label for="sj-preset">Preset</label>
                    <select id="sj-preset" onchange="window.setSlowJogPreset('${ex.id}', this.value)">
                        ${ex.presets.map((p, i) => `
                            <option value="${i}" data-group="${p.group}" ${i === (ex.defaultPreset ?? 0) ? 'selected' : ''}>${p.label}</option>
                        `).join('')}
                    </select>
                    <div id="sj-preset-summary" style="font-size:13px; color:var(--text-muted); margin:8px 0 16px;"></div>
                ` : ''}
                ${isSlowJog ? `
                    <div class="cadence-row">
                        <button type="button" id="sj-cadence" class="toggle-btn cadence-toggle ${cadenceOn ? 'active' : ''}" aria-pressed="${cadenceOn ? 'true' : 'false'}" onclick="window.toggleSlowJogCadence()">
                            Cadence beat: ${cadenceOn ? 'On' : 'Off'}
                        </button>
                        <label class="bpm-field" for="sj-bpm">BPM
                            <input id="sj-bpm" type="number" min="${BPM_MIN}" max="${BPM_MAX}" step="1" inputmode="numeric" autocomplete="off" value="${cadenceBpm}" oninput="window.setSlowJogBpm(this.value)">
                        </label>
                    </div>
                    <p class="cadence-hint">Ticks only during slow-jog intervals, not during walks. About 180 steps per minute.</p>
                ` : ''}
                <!-- Web Component -->
                ${ex.intervals ? `
                    <interval-timer></interval-timer>
                ` : `
                    <stopwatch-timer exercise-id="${ex.id}" target="${ex.type === 'timer' && ex.defaultDuration ? ex.defaultDuration : 0}"></stopwatch-timer>
                `}
            </div>

            <div class="card">
                <div class="card-title">Log Session</div>
                <form id="log-form" onsubmit="event.preventDefault(); window.saveLog('${ex.id}')">
                    ${inputHtml}
                    <button type="submit" class="btn" id="save-btn">${ex.sides ? `Save ${currentSide(ex)}` : 'Save Session'}</button>
                    <div id="log-status" class="form-status" role="status"></div>
                </form>
            </div>

            <div id="history">${renderHistory(id)}</div>
        </div>
    `;
};

// Router
const router = () => {
    const hash = window.location.hash.slice(1);
    const view = document.getElementById('app');

    // Reset scroll
    view.scrollTop = 0;
    window.scrollTo(0, 0);

    if (!hash) {
        view.innerHTML = renderList();
    } else {
        view.innerHTML = renderDetail(hash);

        // Post-render init for interval timer
        const ex = exercises.find(e => e.id === hash);
        if (ex && ex.intervals) {
            const timer = view.querySelector('interval-timer');
            if (timer) {
                customElements.whenDefined('interval-timer').then(() => {
                    if (ex.presets) {
                        const defaultIdx = ex.defaultPreset ?? 0;
                        window.setSlowJogMode(ex.id, ex.presets[defaultIdx].group);
                    } else {
                        timer.setIntervals(ex.intervals);
                    }
                });
            }
        }
        // Chrome may restore a half-typed age over the saved value. The stored age wins.
        if (ex?.id === 'slow-jogging') {
            const applyStoredAge = () => {
                const stored = readAge();
                const ageInput = document.getElementById('sj-age');
                if (!ageInput || stored == null) return;
                ageInput.value = String(stored);
                paintHeartRate(stored);
            };
            applyStoredAge();
            setTimeout(applyStoredAge, 0);
        }
    }

    // Ensure separate fade-in if needed, but synchronous for now
    view.style.opacity = '1';
};

// Slow Jogging preset handling (mode toggle + preset picker)
let currentSlowJogPreset = null;

const slowJogTimer = () => document.querySelector('interval-timer');

const sameLoadedPreset = (idx) => {
    const timer = slowJogTimer();
    return !!(timer && timer.dataset.presetIndex === String(idx) && timer.intervals?.length);
};

const confirmDiscard = () => {
    const timer = slowJogTimer();
    if (!timer || typeof timer.hasProgress !== 'function' || !timer.hasProgress()) return true;
    return window.confirm('Discard this workout and switch presets? Your progress will be lost. Cancel keeps the current workout.');
};

const updateSlowJogModeUI = (mode, idx) => {
    document.querySelectorAll('[data-sj-mode]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sjMode === mode);
    });
    const select = document.getElementById('sj-preset');
    if (!select) return;
    select.querySelectorAll('option').forEach(opt => {
        const visible = opt.dataset.group === mode;
        opt.hidden = !visible;
        opt.disabled = !visible;
    });
    select.value = String(idx);
    const chosen = select.querySelector(`option[value="${idx}"]`);
    if (chosen) chosen.selected = true;
};

const applyCadenceToTimer = () => {
    const timer = slowJogTimer();
    if (!timer || typeof timer.setCadence !== 'function') return;
    timer.setCadence({ enabled: readCadenceOn(), bpm: readCadenceBpm() });
};

const applySlowJogPreset = (ex, idx) => {
    const preset = ex.presets?.[idx];
    if (!preset) return;
    currentSlowJogPreset = { id: ex.id, index: idx, label: preset.label, mode: preset.group };

    const timer = slowJogTimer();
    if (timer && typeof timer.setIntervals === 'function') {
        timer.dataset.presetIndex = String(idx);
        timer.setIntervals(preset.intervals);
        applyCadenceToTimer();
    }

    const totalSeconds = preset.intervals.reduce((sum, i) => sum + i.duration, 0);
    const summary = document.getElementById('sj-preset-summary');
    if (summary) {
        summary.textContent = `${preset.label} · ${Math.round(totalSeconds / 60)} min total, including the 5 min warm-up and 5 min cool-down walks.`;
    }
};

const nextIndexForMode = (ex, mode) => {
    const select = document.getElementById('sj-preset');
    const baseline = currentSlowJogPreset?.index ?? Number(select?.value ?? ex.defaultPreset ?? 0);
    const current = ex.presets[baseline];
    if (current && current.group === mode) return baseline;
    const match = ex.presets.findIndex(p => p.group === mode);
    return match >= 0 ? match : 0;
};

window.setSlowJogMode = (id, mode) => {
    const ex = exercises.find(e => e.id === id);
    if (!ex?.presets) return;
    const nextIdx = nextIndexForMode(ex, mode);
    if (sameLoadedPreset(nextIdx)) {
        updateSlowJogModeUI(mode, nextIdx);
        return;
    }
    if (!confirmDiscard()) return;
    updateSlowJogModeUI(mode, nextIdx);
    applySlowJogPreset(ex, nextIdx);
};

window.setSlowJogPreset = (id, idx) => {
    const ex = exercises.find(e => e.id === id);
    if (!ex?.presets) return;
    const next = Number(idx);
    if (sameLoadedPreset(next)) return;
    if (!confirmDiscard()) {
        if (currentSlowJogPreset) updateSlowJogModeUI(currentSlowJogPreset.mode, currentSlowJogPreset.index);
        return;
    }
    const preset = ex.presets[next];
    if (preset) updateSlowJogModeUI(preset.group, next);
    applySlowJogPreset(ex, next);
};

window.toggleSlowJogCadence = () => {
    unlockAudio();
    const next = !readCadenceOn();
    storageSet(CADENCE_ON_KEY, next ? '1' : '0');
    const btn = document.getElementById('sj-cadence');
    if (btn) {
        btn.classList.toggle('active', next);
        btn.setAttribute('aria-pressed', next ? 'true' : 'false');
        btn.textContent = `Cadence beat: ${next ? 'On' : 'Off'}`;
    }
    applyCadenceToTimer();
};

window.setSlowJogBpm = (value) => {
    const n = Number(value);
    if (!Number.isInteger(n) || n < BPM_MIN || n > BPM_MAX) return;
    storageSet(CADENCE_BPM_KEY, String(n));
    applyCadenceToTimer();
};

window.setSlowJogAge = (value) => {
    const trimmed = String(value).trim();
    if (trimmed === '') {
        storageRemove(AGE_KEY);
        paintHeartRate(null);
        return;
    }
    if (!/^\d{1,3}$/.test(trimmed)) {
        paintHeartRate(null);
        return;
    }
    const age = Number(trimmed);
    if (age >= 10 && age <= 110) {
        storageSet(AGE_KEY, String(age));
        paintHeartRate(age);
        return;
    }
    // One digit is usually the start of a two-digit age; don't nag mid-typing.
    const partial = trimmed.length < 2 && age < 10;
    paintHeartRate(null, !partial);
};

// Side selection (left or right) for exercises that are logged per side.
const sideKey = (id) => `side_${id}`;

function currentSide(ex) {
    const stored = storageGet(sideKey(ex.id));
    return ex.sides.includes(stored) ? stored : ex.sides[0];
}

window.setSide = (id, side) => {
    const ex = exercises.find(e => e.id === id);
    if (!ex?.sides?.includes(side)) return;
    storageSet(sideKey(id), side);
    document.querySelectorAll('[data-side]').forEach(btn => {
        const active = btn.dataset.side === side;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    const save = document.getElementById('save-btn');
    if (save) save.textContent = `Save ${side}`;
};

// Log form and history
const setStatus = (elementId, message, isError = false) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.classList.toggle('error', isError);
};

// Redraw only the history, so saving or deleting never resets a running timer.
const refreshHistory = (id) => {
    const el = document.getElementById('history');
    if (el) el.innerHTML = renderHistory(id);
};

// A timer that pauses or finishes fills in the duration actually done, unless
// the user has typed their own value.
document.addEventListener('timer-elapsed', (event) => {
    const input = document.getElementById('input-duration');
    const seconds = event.detail?.seconds;
    if (!input || !Number.isFinite(seconds) || seconds < 1) return;
    if (input.value !== '' && input.dataset.autofilled !== input.value) return;
    const value = input.dataset.unit === 'seconds'
        ? String(seconds)
        : String(Math.round((seconds / 60) * 100) / 100);
    input.value = value;
    input.dataset.autofilled = value;
});

window.deleteLog = (id, index) => {
    const logs = getLogs(id);
    if (index < 0 || index >= logs.length) return;
    if (!window.confirm('Delete this entry from your history?')) return;
    logs.splice(index, 1);
    if (!setLogs(id, logs)) {
        setStatus('log-status', 'Could not update history. Browser storage is unavailable.', true);
        return;
    }
    refreshHistory(id);
};

const collectAllLogs = () => {
    const all = {};
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith(LOG_PREFIX)) continue;
            const id = key.slice(LOG_PREFIX.length);
            const logs = getLogs(id);
            if (logs.length) all[id] = logs;
        }
    } catch (e) {
        // Storage unavailable; export what was read.
    }
    return all;
};

window.exportHistory = () => {
    const logs = collectAllLogs();
    const count = Object.values(logs).reduce((sum, list) => sum + list.length, 0);
    if (!count) {
        setStatus('backup-status', 'No history to export yet.');
        return;
    }
    const payload = {
        app: 'functional-strength',
        version: 1,
        exportedAt: new Date().toISOString(),
        logs
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const now = new Date();
    const stamp = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
        .map(n => String(n).padStart(2, '0')).join('-');
    link.download = `functional-strength-history-${stamp}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus('backup-status', `Exported ${count} ${count === 1 ? 'entry' : 'entries'}.`);
};

// Import merges with what is already here: nothing is overwritten and
// entries that already exist are not duplicated.
window.importHistory = async (input) => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
        const payload = JSON.parse(await file.text());
        const incoming = payload?.logs;
        if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
            throw new Error('not a history file');
        }
        let added = 0;
        for (const [id, list] of Object.entries(incoming)) {
            if (!/^[a-z0-9-]{1,60}$/.test(id) || !Array.isArray(list)) continue;
            const existing = getLogs(id);
            const seen = new Set(existing.map(e => `${e.date}|${JSON.stringify(e.data)}`));
            const fresh = [];
            for (const entry of list) {
                if (!isLogEntry(entry)) continue;
                const clean = { date: entry.date, data: {} };
                for (const [k, v] of Object.entries(entry.data)) {
                    if (typeof v === 'string' || typeof v === 'number') clean.data[String(k).slice(0, 40)] = v;
                }
                const key = `${clean.date}|${JSON.stringify(clean.data)}`;
                if (seen.has(key)) continue;
                seen.add(key);
                fresh.push(clean);
            }
            if (!fresh.length) continue;
            const merged = existing.concat(fresh).sort((a, b) => new Date(b.date) - new Date(a.date));
            if (!setLogs(id, merged)) throw new Error('storage unavailable');
            added += fresh.length;
        }
        setStatus('backup-status', added
            ? `Imported ${added} new ${added === 1 ? 'entry' : 'entries'}.`
            : 'Nothing new to import. Everything in that file is already here.');
    } catch (e) {
        setStatus('backup-status', 'Could not import that file. Choose a history file exported from this app.', true);
    }
};

window.saveLog = (id) => {
    const reps = document.getElementById('input-reps')?.value;
    const sets = document.getElementById('input-sets')?.value;
    const durationInput = document.getElementById('input-duration');
    const duration = durationInput?.value;
    const notes = document.getElementById('input-notes')?.value;
    const ex = exercises.find(e => e.id === id);

    const data = {};
    const side = ex?.sides ? currentSide(ex) : null;
    if (currentSlowJogPreset && currentSlowJogPreset.id === id) data.preset = currentSlowJogPreset.label;
    if (reps) data.reps = reps;
    if (sets) data.sets = sets;
    const minutes = durationInput?.dataset.unit === 'seconds' ? Number(duration) / 60 : duration;
    const durationText = duration ? formatDuration(minutes) : null;
    if (side) {
        // A side on its own says nothing; the time is the point.
        if (!durationText) {
            setStatus('log-status', 'Run the timer or enter a time first.', true);
            return;
        }
        data.side = side;
    }
    if (durationText) data.duration = durationText;
    if (notes && notes.trim()) data.notes = notes.trim();

    if (Object.keys(data).length === 0) {
        setStatus('log-status', 'Enter something to save first.', true);
        return;
    }

    if (!addLog(id, data)) {
        setStatus('log-status', 'Could not save. Browser storage is full or unavailable.', true);
        return;
    }
    requestPersistentStorage();

    const form = document.getElementById('log-form');
    if (form) form.reset();
    if (durationInput) delete durationInput.dataset.autofilled;
    if (side) {
        // Ready for the next attempt.
        document.querySelector('stopwatch-timer')?.reset();
        setStatus('log-status', `Saved ${durationText} for ${side.toLowerCase()}.`);
    } else {
        setStatus('log-status', 'Saved.');
    }
    refreshHistory(id);
};

window.toggleViewMode = () => {
    listMode = listMode === 'list' ? 'focus' : 'list';
    router();
};

window.addEventListener('hashchange', router);
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', router);
} else {
    router();
}

// Offline support: after one visit the app opens without a connection.
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
}
