import {
    playCue,
    resumeAudio,
    startAudioKeepAlive,
    stopAudioKeepAlive,
    unlockAudio
} from './audio.js';

const TARGET_MAX = 60 * 60;

const targetKey = (id) => `target_${id}`;

const storageGet = (key) => {
    try { return localStorage.getItem(key); } catch (e) { return null; }
};

const storageSet = (key, value) => {
    try { localStorage.setItem(key, value); } catch (e) { /* private mode */ }
};

// Elapsed time is derived from the wall clock, not from counting ticks, so a
// locked or backgrounded phone catches up instead of losing time.
//
// With a target (the `target` attribute, in seconds) the display counts down,
// beeps over the last three seconds and plays the "done" cue at zero. It then
// keeps counting up so a longer hold is still measured. With no target it is
// a plain count-up stopwatch.
export class StopwatchTimer extends HTMLElement {
    constructor() {
        super();
        this.elapsedMs = 0;
        this.startedAt = null;
        this.tickId = null;
        this.isRunning = false;
        this.targetSeconds = 0;
        this.targetReached = false;
        this.lastBeepSecond = null;
        this.wakeLock = null;
        this._wakeLockPending = false;
        this._onVisible = null;
    }

    connectedCallback() {
        this.targetSeconds = this._readTarget();
        if (!this._onVisible) {
            this._onVisible = () => {
                if (!this.isRunning || document.visibilityState !== 'visible') return;
                resumeAudio();
                this._tick();
                this._requestWakeLock();
            };
            document.addEventListener('visibilitychange', this._onVisible);
            window.addEventListener('pageshow', this._onVisible);
            window.addEventListener('focus', this._onVisible);
        }
        this.render();
    }

    disconnectedCallback() {
        this._halt();
        if (this._onVisible) {
            document.removeEventListener('visibilitychange', this._onVisible);
            window.removeEventListener('pageshow', this._onVisible);
            window.removeEventListener('focus', this._onVisible);
            this._onVisible = null;
        }
    }

    _clampTarget(n) {
        if (!Number.isFinite(n)) return 0;
        return Math.min(TARGET_MAX, Math.max(0, Math.round(n)));
    }

    // A target the user adjusted wins over the exercise default.
    _readTarget() {
        const fallback = this._clampTarget(Number(this.getAttribute('target')));
        const id = this.getAttribute('exercise-id');
        if (!id) return fallback;
        const raw = storageGet(targetKey(id));
        if (raw == null || raw === '') return fallback;
        const n = Number(raw);
        return Number.isFinite(n) ? this._clampTarget(n) : fallback;
    }

    formatTime(seconds) {
        const s = Math.max(0, Math.floor(seconds));
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    _currentElapsedMs(now = Date.now()) {
        if (this.isRunning && this.startedAt != null) {
            return this.elapsedMs + Math.max(0, now - this.startedAt);
        }
        return this.elapsedMs;
    }

    elapsedSeconds() {
        return Math.floor(this._currentElapsedMs() / 1000);
    }

    _countingDown(elapsedMs) {
        return this.targetSeconds > 0 && !this.targetReached && elapsedMs < this.targetSeconds * 1000;
    }

    _displayText(elapsedMs) {
        if (this._countingDown(elapsedMs)) {
            const remaining = Math.ceil((this.targetSeconds * 1000 - elapsedMs) / 1000);
            return this.formatTime(remaining);
        }
        return this.formatTime(elapsedMs / 1000);
    }

    _statusText(elapsedMs) {
        if (this.targetSeconds <= 0) return 'No target. Counting up.';
        if (this._countingDown(elapsedMs)) return `Target ${this.formatTime(this.targetSeconds)}`;
        return `Target ${this.formatTime(this.targetSeconds)} reached. Total time shown.`;
    }

    render() {
        const elapsedMs = this._currentElapsedMs();
        const started = elapsedMs > 0 || this.isRunning;
        this.dataset.running = this.isRunning ? 'true' : 'false';
        this.dataset.targetReached = this.targetReached ? 'true' : 'false';

        this.innerHTML = `
            <div class="timer-container">
                <div class="timer-display">${this._displayText(elapsedMs)}</div>
                <div class="timer-status">${this._statusText(elapsedMs)}</div>
                <div class="target-row">
                    <button type="button" class="toggle-btn target-btn" aria-label="Decrease target" ${started ? 'disabled' : ''} onclick="this.closest('stopwatch-timer').adjustTarget(-1)">&minus;</button>
                    <span class="target-value">${this.targetSeconds > 0 ? `Target ${this.formatTime(this.targetSeconds)}` : 'No target'}</span>
                    <button type="button" class="toggle-btn target-btn" aria-label="Increase target" ${started ? 'disabled' : ''} onclick="this.closest('stopwatch-timer').adjustTarget(1)">+</button>
                </div>
                <div class="timer-controls">
                    ${this.isRunning ? `
                        <button type="button" class="btn btn-timer btn-pause" onclick="this.closest('stopwatch-timer').pause()">Pause</button>
                    ` : `
                        <button type="button" class="btn btn-timer btn-start" onclick="this.closest('stopwatch-timer').start()">${elapsedMs > 0 ? 'Resume' : 'Start'}</button>
                    `}
                    <button type="button" class="btn btn-timer btn-reset" onclick="this.closest('stopwatch-timer').reset()">Reset</button>
                </div>
            </div>
        `;
    }

    _updateDisplay(elapsedMs) {
        const display = this.querySelector('.timer-display');
        const status = this.querySelector('.timer-status');
        if (!display) return;
        const text = this._displayText(elapsedMs);
        if (display.textContent !== text) display.textContent = text;
        const statusText = this._statusText(elapsedMs);
        if (status && status.textContent !== statusText) status.textContent = statusText;
    }

    // Steps of 15 seconds up to two minutes, then whole minutes. Zero means
    // no target. Locked once the timer has started so the countdown can't jump.
    adjustTarget(direction) {
        if (this.isRunning || this.elapsedMs > 0) return;
        const current = this.targetSeconds;
        let next;
        if (direction > 0) {
            next = current < 120 ? current + 15 : current + 60;
        } else {
            next = current <= 120 ? current - 15 : current - 60;
        }
        this.targetSeconds = this._clampTarget(next);
        const id = this.getAttribute('exercise-id');
        if (id) storageSet(targetKey(id), String(this.targetSeconds));
        this.render();
    }

    start() {
        // Must run synchronously in the tap so iOS treats this as a gesture.
        unlockAudio();
        if (this.isRunning) return;
        this.isRunning = true;
        this.startedAt = Date.now();
        this.lastBeepSecond = null;
        startAudioKeepAlive();
        this._requestWakeLock();
        this._stopTicking();
        this.tickId = setInterval(() => this._tick(), 200);
        this.render();
    }

    pause() {
        const wasRunning = this.isRunning;
        this._halt();
        this.render();
        if (wasRunning) this._announceElapsed();
    }

    reset() {
        this._halt();
        this.elapsedMs = 0;
        this.targetReached = false;
        this.lastBeepSecond = null;
        this.render();
    }

    _halt() {
        if (this.isRunning && this.startedAt != null) {
            this.elapsedMs += Math.max(0, Date.now() - this.startedAt);
        }
        this.isRunning = false;
        this.startedAt = null;
        this._stopTicking();
        stopAudioKeepAlive();
        this._releaseWakeLock();
    }

    _stopTicking() {
        if (this.tickId) {
            clearInterval(this.tickId);
            this.tickId = null;
        }
    }

    _tick() {
        if (!this.isRunning) return;
        const elapsedMs = this._currentElapsedMs();

        if (this.targetSeconds > 0 && !this.targetReached) {
            const remainingMs = this.targetSeconds * 1000 - elapsedMs;
            if (remainingMs <= 0) {
                this.targetReached = true;
                playCue('done');
                this.render();
                this._announceElapsed();
                return;
            }
            const seconds = Math.ceil(remainingMs / 1000);
            if (seconds !== this.lastBeepSecond) {
                this.lastBeepSecond = seconds;
                if (seconds <= 3 && seconds < this.targetSeconds) {
                    playCue(seconds === 1 ? 'beepFinal' : 'beep');
                }
            }
        }

        this._updateDisplay(elapsedMs);
    }

    // Lets the page pre-fill the log form with the time actually done.
    _announceElapsed() {
        const seconds = this.elapsedSeconds();
        if (seconds < 1) return;
        this.dispatchEvent(new CustomEvent('timer-elapsed', {
            bubbles: true,
            detail: { seconds }
        }));
    }

    async _requestWakeLock() {
        if (this._wakeLockPending) return;
        if (!('wakeLock' in navigator) || typeof navigator.wakeLock?.request !== 'function') return;
        if (document.visibilityState !== 'visible') return;
        if (this.wakeLock && this.wakeLock.released !== true) return;
        this._wakeLockPending = true;
        try {
            const sentinel = await navigator.wakeLock.request('screen');
            if (!this.isRunning) {
                try { await sentinel.release(); } catch (e) { /* already released */ }
                return;
            }
            this.wakeLock = sentinel;
            sentinel.addEventListener('release', () => {
                if (this.wakeLock === sentinel) this.wakeLock = null;
            });
        } catch (e) {
            this.wakeLock = null;
        } finally {
            this._wakeLockPending = false;
        }
    }

    _releaseWakeLock() {
        const lock = this.wakeLock;
        this.wakeLock = null;
        if (!lock) return;
        lock.release().catch(() => {});
    }
}

customElements.define('stopwatch-timer', StopwatchTimer);
