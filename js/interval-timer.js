import {
    createMetronome,
    playCue,
    resumeAudio,
    startAudioKeepAlive,
    stopAudioKeepAlive,
    unlockAudio
} from './audio.js?v=4';

// Remaining time is derived from a wall-clock end timestamp so a locked or
// backgrounded phone catches up, including intervals that fully elapsed.
export class IntervalTimer extends HTMLElement {
    constructor() {
        super();
        this.intervals = [];
        this.currentIntervalIndex = 0;
        this.remainingMs = 0;
        this.segmentEndAt = null;
        this.tickId = null;
        this.isRunning = false;
        this.isComplete = false;
        this.totalDuration = 0;
        this.lastBeepSecond = null;
        this.wakeLock = null;
        this._wakeLockPending = false;
        this._wakeLockTriedAt = 0;
        this._wakeLockRetries = 0;
        this._wakeLockRetryTimer = null;
        this._wakeLockHeldTimer = null;
        this._onVisible = null;
        this.cadenceEnabled = false;
        this.cadenceBpm = 180;
        this.cadencePlaying = false;
        this.metronome = createMetronome();
    }

    connectedCallback() {
        if (!this._onVisible) {
            this._onVisible = () => {
                if (!this.isRunning || document.visibilityState !== 'visible') return;
                resumeAudio();
                this._catchUp(Date.now());
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

    formatTime(seconds) {
        const s = Math.max(0, Math.floor(seconds));
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    _displayedSeconds() {
        const ms = this.isRunning && this.segmentEndAt != null
            ? Math.max(0, this.segmentEndAt - Date.now())
            : this.remainingMs;
        return Math.max(0, Math.ceil(ms / 1000));
    }

    _elapsedMs() {
        let elapsed = 0;
        const index = Math.min(this.currentIntervalIndex, this.intervals.length);
        for (let i = 0; i < index; i++) {
            elapsed += this.intervals[i].duration * 1000;
        }
        const current = this.intervals[this.currentIntervalIndex];
        if (current) {
            const remaining = this.isRunning && this.segmentEndAt != null
                ? Math.max(0, this.segmentEndAt - Date.now())
                : this.remainingMs;
            elapsed += Math.max(0, current.duration * 1000 - remaining);
        }
        return elapsed;
    }

    _cueKind(interval = this.intervals[this.currentIntervalIndex]) {
        if (!interval) return 'done';
        return interval.type === 'work' ? 'work' : 'rest';
    }

    // True when a workout is underway or partially finished, so the page can
    // ask before a preset change throws that progress away.
    hasProgress() {
        if (this.isComplete || !this.intervals.length) return false;
        if (this.isRunning) return true;
        if (this.currentIntervalIndex > 0) return true;
        const full = this.intervals[0].duration * 1000;
        return this.remainingMs < full - 250;
    }

    render() {
        const currentInterval = this.intervals[this.currentIntervalIndex];
        const nextInterval = this.intervals[this.currentIntervalIndex + 1];
        const seconds = currentInterval ? this._displayedSeconds() : 0;
        const totalMs = this.totalDuration * 1000;
        const progressPercent = totalMs > 0 ? Math.min(100, (this._elapsedMs() / totalMs) * 100) : 0;
        const isWork = currentInterval?.type === 'work';
        const urgent = !!(currentInterval && this.isRunning && seconds > 0 && seconds <= 3 && seconds < currentInterval.duration);
        const color = isWork ? 'var(--primary)' : 'var(--text-muted)';
        const bg = isWork ? 'rgba(6, 182, 212, 0.05)' : 'rgba(255, 255, 255, 0.05)';
        const timeColor = urgent ? '#fbbf24' : (isWork ? 'white' : 'var(--text-muted)');

        this.dataset.running = this.isRunning ? 'true' : 'false';
        this.dataset.complete = this.isComplete ? 'true' : 'false';
        this.dataset.phase = this.isComplete ? 'complete' : (currentInterval ? currentInterval.type : 'ready');

        if (!this.intervals.length && !this.isComplete) {
            this.innerHTML = `
                <div class="timer-container">
                    <div class="timer-display">--:--</div>
                </div>
            `;
            return;
        }

        this.innerHTML = `
            <div class="timer-container" style="border-color: ${color}; background: ${bg}; transition: all 0.5s;">
                ${currentInterval ? `
                    <div style="font-size: 14px; text-transform: uppercase; color: ${color}; letter-spacing: 1px; margin-bottom: 8px;">
                        ${currentInterval.type === 'rest' ? 'Rest' : `Interval ${this.currentIntervalIndex} / ${this.intervals.length - 1}`}
                    </div>
                    <div class="timer-phase" style="font-size: 24px; font-weight: 700; margin-bottom: 4px; color: white;">
                        ${currentInterval.name}
                    </div>
                    <div class="timer-display" style="margin: 10px 0; color: ${timeColor};">${this.formatTime(seconds)}</div>

                    ${nextInterval ? `
                        <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px; background: rgba(0,0,0,0.2); display: inline-block; padding: 4px 12px; border-radius: 12px;">
                            Next: ${nextInterval.name}
                        </div>
                    ` : `
                        <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px; height: 26px;">
                            Final Interval
                        </div>
                    `}

                    <div class="timer-progress-track">
                        <div class="timer-progress" style="width: ${progressPercent}%; background: ${color};"></div>
                    </div>

                ` : `
                    <div style="font-size: 32px; font-weight: 800; color: var(--primary); margin: 40px 0;">
                        WORKOUT COMPLETE
                    </div>
                `}

                <div class="timer-controls">
                    ${!currentInterval ? `
                        <button type="button" class="btn btn-timer" onclick="this.closest('interval-timer').reset()">Restart Workout</button>
                    ` : `
                        ${!this.isRunning ? `
                            <button type="button" class="btn btn-timer btn-start" onclick="this.closest('interval-timer').start()">
                                ${this.currentIntervalIndex === 0 && this.remainingMs >= this.intervals[0].duration * 1000 - 50 ? 'Start Workout' : 'Resume'}
                            </button>
                        ` : `
                            <button type="button" class="btn btn-timer btn-pause" style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2);" onclick="this.closest('interval-timer').pause()">Pause</button>
                        `}
                        <button type="button" class="btn btn-timer btn-reset" style="background: transparent; border: none; color: var(--text-muted);" onclick="this.closest('interval-timer').reset()">Reset</button>
                    `}
                </div>
            </div>
        `;
    }

    _updateDisplay() {
        const current = this.intervals[this.currentIntervalIndex];
        const display = this.querySelector('.timer-display');
        const bar = this.querySelector('.timer-progress');
        if (!display || !current) return;
        const seconds = this._displayedSeconds();
        const text = this.formatTime(seconds);
        if (display.textContent !== text) display.textContent = text;
        const urgent = this.isRunning && seconds > 0 && seconds <= 3 && seconds < current.duration;
        const isWork = current.type === 'work';
        display.style.color = urgent ? '#fbbf24' : (isWork ? 'white' : 'var(--text-muted)');
        if (bar && this.totalDuration > 0) {
            const pct = Math.min(100, (this._elapsedMs() / (this.totalDuration * 1000)) * 100);
            bar.style.width = `${pct}%`;
        }
    }

    setIntervals(intervals) {
        this.intervals = intervals.slice();
        this.totalDuration = this.intervals.reduce((sum, i) => sum + i.duration, 0);
        this.isComplete = false;
        this.reset();
    }

    setCadence({ enabled, bpm } = {}) {
        if (typeof enabled === 'boolean') this.cadenceEnabled = enabled;
        if (Number.isFinite(bpm)) {
            this.cadenceBpm = bpm;
            this.metronome.setBpm(bpm);
        }
        this._syncCadence();
    }

    _syncCadence() {
        const interval = this.intervals[this.currentIntervalIndex];
        const should = this.isRunning && this.cadenceEnabled && !this.isComplete && interval?.type === 'work';
        if (should) this.metronome.start();
        else this.metronome.stop();
        this.cadencePlaying = should && this.metronome.isRunning();
    }

    start() {
        // Must run synchronously in the tap so iOS treats this as a gesture.
        unlockAudio();
        if (this.isRunning || this.isComplete) return;
        if (!this.intervals[this.currentIntervalIndex]) return;

        const fresh = this.currentIntervalIndex === 0
            && this.remainingMs >= this.intervals[0].duration * 1000 - 50;

        this.isRunning = true;
        this.segmentEndAt = Date.now() + this.remainingMs;
        this.lastBeepSecond = this._displayedSeconds();
        startAudioKeepAlive();
        this._requestWakeLock();
        if (fresh) playCue(this._cueKind());
        this._syncCadence();
        this._startTicking();
        this.render();
    }

    pause() {
        this._halt();
        this.render();
    }

    reset() {
        this.isComplete = false;
        this._halt();
        this.currentIntervalIndex = 0;
        this.lastBeepSecond = null;
        this.remainingMs = this.intervals.length ? this.intervals[0].duration * 1000 : 0;
        this.render();
    }

    _halt() {
        if (this.isRunning && this.segmentEndAt != null) {
            this.remainingMs = Math.max(0, this.segmentEndAt - Date.now());
        }
        this.isRunning = false;
        this.segmentEndAt = null;
        this._stopTicking();
        this.metronome.stop();
        this.cadencePlaying = false;
        stopAudioKeepAlive();
        this._releaseWakeLock();
    }

    _finish() {
        this.isRunning = false;
        this.isComplete = true;
        this.segmentEndAt = null;
        this.remainingMs = 0;
        this.currentIntervalIndex = this.intervals.length;
        this._stopTicking();
        this.metronome.stop();
        this.cadencePlaying = false;
        stopAudioKeepAlive();
        this._releaseWakeLock();
        playCue('done');
        this.render();
    }

    _startTicking() {
        this._stopTicking();
        this.tickId = setInterval(() => {
            if (this.isRunning) this._catchUp(Date.now());
        }, 100);
    }

    _stopTicking() {
        if (this.tickId) {
            clearInterval(this.tickId);
            this.tickId = null;
        }
    }

    _maybeCountdown(now) {
        const interval = this.intervals[this.currentIntervalIndex];
        if (!interval || this.segmentEndAt == null) return;
        const seconds = Math.ceil(Math.max(0, this.segmentEndAt - now) / 1000);
        if (seconds === this.lastBeepSecond) return;
        this.lastBeepSecond = seconds;
        if (seconds >= 1 && seconds <= 3 && seconds < interval.duration) {
            playCue(seconds === 1 ? 'beepFinal' : 'beep');
        }
    }

    _catchUp(now) {
        if (!this.isRunning || this.segmentEndAt == null) return;

        let landed = false;
        let guard = 0;
        while (now >= this.segmentEndAt) {
            if (++guard > this.intervals.length + 2) {
                this._finish();
                return;
            }
            const next = this.currentIntervalIndex + 1;
            if (next >= this.intervals.length) {
                this._finish();
                return;
            }
            const startedAt = this.segmentEndAt;
            this.currentIntervalIndex = next;
            const durationMs = Math.max(1, this.intervals[next].duration * 1000);
            this.segmentEndAt = startedAt + durationMs;
            landed = true;
        }

        this.remainingMs = Math.max(0, this.segmentEndAt - now);

        if (landed) {
            // One cue for the interval we actually landed on, not a burst for
            // every interval that elapsed while the screen was off.
            // Do not also countdown-beep on this tick: a second vibrate()
            // would cancel the phase pattern on Android.
            this.lastBeepSecond = this._displayedSeconds();
            this._syncCadence();
            playCue(this._cueKind());
            this.render();
            this._maybeRefreshWakeLock(now);
            return;
        }

        this._maybeCountdown(now);
        this._updateDisplay();
        this._maybeRefreshWakeLock(now);
    }

    async _requestWakeLock() {
        if (this._wakeLockPending) return;
        if (!('wakeLock' in navigator) || typeof navigator.wakeLock?.request !== 'function') return;
        if (document.visibilityState !== 'visible') return;
        if (this.wakeLock && this.wakeLock.released !== true) return;
        this._wakeLockPending = true;
        this._wakeLockTriedAt = Date.now();
        try {
            const sentinel = await navigator.wakeLock.request('screen');
            if (!this.isRunning) {
                try { await sentinel.release(); } catch (e) { /* already released */ }
                return;
            }
            this.wakeLock = sentinel;
            // Only treat the lock as stable once it has survived a few seconds.
            // Resetting immediately would let a platform that releases the lock
            // at once retry forever.
            this._clearWakeLockRetry();
            this._wakeLockHeldTimer = setTimeout(() => {
                this._wakeLockHeldTimer = null;
                if (this.wakeLock === sentinel) this._wakeLockRetries = 0;
            }, 5000);
            sentinel.addEventListener('release', () => {
                if (this.wakeLock === sentinel) this.wakeLock = null;
                // Android drops the lock when the notification shade opens or
                // another app takes the screen. Ask again if the workout is
                // still running. Stop if the platform keeps refusing.
                if (!this.isRunning || document.visibilityState !== 'visible') return;
                if (this._wakeLockRetries >= 3) return;
                this._wakeLockRetries++;
                this._clearWakeLockRetry();
                this._wakeLockRetryTimer = setTimeout(() => {
                    this._wakeLockRetryTimer = null;
                    if (this.isRunning && document.visibilityState === 'visible') {
                        this._requestWakeLock();
                    }
                }, 800);
            });
        } catch (e) {
            this.wakeLock = null;
        } finally {
            this._wakeLockPending = false;
        }
    }

    _clearWakeLockRetry() {
        if (this._wakeLockRetryTimer) {
            clearTimeout(this._wakeLockRetryTimer);
            this._wakeLockRetryTimer = null;
        }
        if (this._wakeLockHeldTimer) {
            clearTimeout(this._wakeLockHeldTimer);
            this._wakeLockHeldTimer = null;
        }
    }

    _maybeRefreshWakeLock(now) {
        if (!this.isRunning || document.visibilityState !== 'visible') return;
        if (this.wakeLock && this.wakeLock.released !== true) return;
        if (now - this._wakeLockTriedAt < 15000) return;
        this._requestWakeLock();
    }

    _releaseWakeLock() {
        this._clearWakeLockRetry();
        const lock = this.wakeLock;
        this.wakeLock = null;
        if (!lock) return;
        lock.release().catch(() => {});
    }
}

customElements.define('interval-timer', IntervalTimer);
