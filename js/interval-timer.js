export class IntervalTimer extends HTMLElement {
    constructor() {
        super();
        this.intervals = [];
        this.currentIntervalIndex = 0;
        this.timeLeft = 0;
        this.intervalId = null;
        this.isRunning = false;
        this.totalDuration = 0;
    }

    connectedCallback() {
        this.render();
    }

    disconnectedCallback() {
        this.pause();
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    render() {
        const currentInterval = this.intervals[this.currentIntervalIndex];
        const nextInterval = this.intervals[this.currentIntervalIndex + 1];

        // Calculate total progress
        const completedDuration = this.intervals.slice(0, this.currentIntervalIndex).reduce((sum, i) => sum + i.duration, 0);
        const totalElapsedTime = completedDuration + (currentInterval ? (currentInterval.duration - this.timeLeft) : 0);
        const progressPercent = this.totalDuration > 0 ? (totalElapsedTime / this.totalDuration) * 100 : 0;

        const isWork = currentInterval?.type === 'work';
        const color = isWork ? 'var(--primary)' : 'var(--text-muted)';
        const bg = isWork ? 'rgba(6, 182, 212, 0.05)' : 'rgba(255, 255, 255, 0.05)';

        this.innerHTML = `
            <div class="timer-container" style="border-color: ${color}; background: ${bg}; transition: all 0.5s;">
                ${currentInterval ? `
                    <div style="font-size: 14px; text-transform: uppercase; color: ${color}; letter-spacing: 1px; margin-bottom: 8px;">
                        ${currentInterval.type === 'rest' ? 'Rest' : `Interval ${this.currentIntervalIndex} / ${this.intervals.length - 1}`}
                    </div>
                    <div style="font-size: 24px; font-weight: 700; margin-bottom: 4px; color: white;">
                        ${currentInterval.name}
                    </div>
                    <div class="timer-display" style="font-size: 64px; margin: 10px 0; color: ${isWork ? 'white' : 'var(--text-muted)'};">${this.formatTime(this.timeLeft)}</div>
                    
                    ${nextInterval ? `
                        <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px; background: rgba(0,0,0,0.2); display: inline-block; padding: 4px 12px; border-radius: 12px;">
                            Next: ${nextInterval.name}
                        </div>
                    ` : `
                        <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px; height: 26px;">
                            Final Interval
                        </div>
                    `}

                    <div style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-bottom: 24px; overflow: hidden;">
                        <div style="height: 100%; width: ${progressPercent}%; background: ${color}; transition: width 1s linear;"></div>
                    </div>

                ` : `
                    <div style="font-size: 32px; font-weight: 800; color: var(--primary); margin: 40px 0;">
                        WORKOUT COMPLETE
                    </div>
                `}

                <div class="timer-controls">
                    ${!currentInterval ? `
                        <button class="btn btn-timer" onclick="this.closest('interval-timer').reset()">Restart Workout</button>
                    ` : `
                        ${!this.isRunning ? `
                            <button class="btn btn-timer btn-start" onclick="this.closest('interval-timer').start()">
                                ${this.currentIntervalIndex === 0 && this.timeLeft === this.intervals[0].duration ? 'Start Workout' : 'Resume'}
                            </button>
                        ` : `
                            <button class="btn btn-timer btn-pause" style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2);" onclick="this.closest('interval-timer').pause()">Pause</button>
                        `}
                        <button class="btn btn-timer btn-reset" style="background: transparent; border: none; color: var(--text-muted);" onclick="this.closest('interval-timer').reset()">Reset</button>
                    `}
                </div>
            </div>
        `;
    }

    setIntervals(intervals) {
        this.intervals = intervals;
        this.totalDuration = intervals.reduce((sum, i) => sum + i.duration, 0);
        this.reset();
    }

    start() {
        if (this.isRunning) return;
        if (!this.intervals[this.currentIntervalIndex]) return;

        this.isRunning = true;
        this.render();

        this.intervalId = setInterval(() => {
            this.timeLeft--;

            if (this.timeLeft < 0) {
                this.nextInterval();
            } else {
                // Update just the time and progress bar to avoid full re-render flicker
                // But full render is safer for state consistency for now
                this.render();
            }
        }, 1000);
    }

    pause() {
        this.isRunning = false;
        if (this.intervalId) clearInterval(this.intervalId);
        this.render();
    }

    reset() {
        this.pause();
        this.currentIntervalIndex = 0;
        if (this.intervals.length > 0) {
            this.timeLeft = this.intervals[0].duration;
        }
        this.render();
    }

    nextInterval() {
        this.currentIntervalIndex++;
        if (this.currentIntervalIndex >= this.intervals.length) {
            this.pause();
            this.render(); // Show completion state
        } else {
            this.timeLeft = this.intervals[this.currentIntervalIndex].duration;
            // Play sound?
            this.render();
        }
    }
}

customElements.define('interval-timer', IntervalTimer);
