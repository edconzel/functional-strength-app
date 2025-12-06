import { exercises } from './data.js';

const app = document.getElementById('app');

// State
let currentView = 'list';
let listMode = 'focus'; // 'list' or 'focus'
let currentExerciseId = null;

// Timer State
let timerInterval = null;
let timeLeft = 0;
let isTimerRunning = false;
let audioContext = null;

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

// Stopwatch Logic
const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

window.startTimer = () => {
    console.log('startTimer called', { isTimerRunning, timeLeft });
    if (isTimerRunning) return;
    isTimerRunning = true;

    timerInterval = setInterval(() => {
        timeLeft++;
        console.log('tick', timeLeft);
        const display = document.getElementById('timer-display');
        if (display) display.textContent = formatTime(timeLeft);
    }, 1000);

    updateTimerUI();
};

window.pauseTimer = () => {
    isTimerRunning = false;
    clearInterval(timerInterval);
    updateTimerUI();
};

window.resetTimer = () => {
    window.pauseTimer();
    timeLeft = 0;
    const display = document.getElementById('timer-display');
    if (display) display.textContent = formatTime(timeLeft);
    updateTimerUI();
};

const updateTimerUI = () => {
    const startBtn = document.getElementById('btn-start');
    const pauseBtn = document.getElementById('btn-pause');
    if (!startBtn || !pauseBtn) return;

    if (isTimerRunning) {
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'inline-block';
    } else {
        startBtn.style.display = 'inline-block';
        pauseBtn.style.display = 'none';
        startBtn.textContent = timeLeft > 0 ? 'Resume' : 'Start';
    }
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
    const defaultTime = ex.defaultDuration || 60;

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
            
            <div class="card">
                <div class="card-title">Timer</div>
                <div class="timer-container">
                    <div id="timer-display" class="timer-display">00:00</div>
                    <div class="timer-controls">
                        <button id="btn-start" class="btn btn-timer">Start</button>
                        <button id="btn-pause" class="btn btn-timer pause" style="display:none">Pause</button>
                         <button id="btn-reset" class="btn btn-timer pause">Reset</button>
                    </div>
                </div>
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
        // Reset timer logic
        const ex = exercises.find(e => e.id === hash);
        if (ex) {
            if (ex) {
                window.resetTimer();
            }
        }
    }

    // Ensure separate fade-in if needed, but synchronous for now
    view.style.opacity = '1';
};

// Global Handlers
window.saveLog = (id) => {
    const reps = document.getElementById('input-reps')?.value;
    const sets = document.getElementById('input-sets')?.value;
    const duration = document.getElementById('input-duration')?.value;
    const notes = document.getElementById('input-notes')?.value;

    const data = {};
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

// Event Delegation for Timer
app.addEventListener('click', (e) => {
    const target = e.target.closest('button');
    if (!target) return;

    if (target.id === 'btn-start') {
        window.startTimer();
    } else if (target.id === 'btn-pause') {
        window.pauseTimer();
    } else if (target.id === 'btn-reset') {
        window.resetTimer();
    }
});

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
