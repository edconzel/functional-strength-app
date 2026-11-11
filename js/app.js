import { exercises } from './data.js?v=5';
import { unlockAudio } from './audio.js?v=5';
import './stopwatch.js?v=5';
import './interval-timer.js?v=5';

const app = document.getElementById('app');

// State
let currentView = 'list';
let listMode = 'focus'; // 'list' or 'focus'
let currentExerciseId = null;

// Utils
const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString() + ' ' + new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getLogs = (id) => {
    const logs = localStorage.getItem(`logs_${id}`);
    return logs ? JSON.parse(logs) : [];
};

const addLog = (id, data) => {
    const logs = getLogs(id);
    logs.unshift({
        date: new Date().toISOString(),
        data
    });
    localStorage.setItem(`logs_${id}`, JSON.stringify(logs));
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
    const half = age / 2;
    const halfText = Number.isInteger(half) ? String(half) : String(half);
    return `
        <div class="pace-hr">About ${hr} bpm</div>
        <p>138 minus half of ${age} (${halfText}) is ${hr}. An approximate guide, not medical advice.</p>
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
            <button class="toggle-btn ${isFocus ? 'active' : ''}" onclick="window.toggleViewMode()">
                ${isFocus ? 'Focus View' : 'List View'}
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
    `;
};

const renderDetail = (id) => {
    const ex = exercises.find(e => e.id === id);
    if (!ex) return '<div>Exercise not found</div>';

    const logs = getLogs(id);
    const isSlowJog = ex.id === 'slow-jogging';
    const cadenceOn = isSlowJog && readCadenceOn();
    const cadenceBpm = readCadenceBpm();
    const age = isSlowJog ? readAge() : null;

    // Dynamic inputs based on type
    let inputHtml = '';
    if (ex.type === 'reps') {
        inputHtml = `
            <label>Reps</label>
            <input type="number" id="input-reps" placeholder="0">
            ${ex.inputs?.includes('sets') ? `
                <label>Sets</label>
                <input type="number" id="input-sets" placeholder="0">
            ` : ''}
        `;
    } else if (ex.type === 'duration' || ex.type === 'timer') {
        inputHtml = `
            <label>Duration (minutes)</label>
            <input type="number" id="input-duration" placeholder="${ex.defaultDuration ? ex.defaultDuration / 60 : 0}">
        `;
    }

    if (ex.inputs?.includes('notes') || true) {
        inputHtml += `
            <label>Notes</label>
            <textarea id="input-notes" rows="3" placeholder="Add details..."></textarea>
        `;
    }

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
                    <stopwatch-timer></stopwatch-timer>
                `}
            </div>

            <div class="card">
                <div class="card-title">Log Session</div>
                <form id="log-form" onsubmit="event.preventDefault(); window.saveLog('${ex.id}')">
                    ${inputHtml}
                    <button type="submit" class="btn">Save Session</button>
                </form>
            </div>

            ${logs.length > 0 ? `
                <div class="card">
                    <div class="card-title">History</div>
                    ${logs.map(log => `
                        <div class="history-item">
                            <div style="font-weight:600; font-size:12px; color:rgba(255,255,255,0.5)">${formatDate(log.date)}</div>
                            <div>${Object.entries(log.data).map(([k, v]) => `${k}: ${v}`).join(' | ')}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
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

// Global Handlers
window.saveLog = (id) => {
    const reps = document.getElementById('input-reps')?.value;
    const sets = document.getElementById('input-sets')?.value;
    const duration = document.getElementById('input-duration')?.value;
    const notes = document.getElementById('input-notes')?.value;

    const data = {};
    if (currentSlowJogPreset && currentSlowJogPreset.id === id) data.preset = currentSlowJogPreset.label;
    if (reps) data.reps = reps;
    if (sets) data.sets = sets;
    if (duration) data.duration = `${duration}m`;
    if (notes) data.notes = notes;

    if (Object.keys(data).length === 0) return;

    addLog(id, data);

    // Refresh view logic without full reload to keep scroll
    const logs = getLogs(id);
    // Cheap refresh: just re-route 
    router();
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
