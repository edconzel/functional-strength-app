export class StopwatchTimer extends HTMLElement {
    constructor() {
        super();
        this.timeLeft = 0;
        this.interval = null;
        this.isRunning = false;
    }

    connectedCallback() {
        this.render();
        // Event Delegation: One listener for the whole component
        this.addEventListener('click', (e) => this.handleAction(e));
        this.addEventListener('touchstart', (e) => this.handleAction(e), { passive: false });
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
        this.innerHTML = `
            <div class="timer-container">
                <div class="timer-display">${this.formatTime(this.timeLeft)}</div>
                <div class="timer-controls">
                    <button class="btn btn-timer btn-start">Start</button>
                    <button class="btn btn-timer btn-pause" style="display:none">Pause</button>
                    <button class="btn btn-timer btn-reset">Reset</button>
                </div>
            </div>
        `;
        this.updateUI();
    }

    handleAction(e) {
        const btn = e.target.closest('.btn-timer');
        if (!btn) return;

        // Prevent ghost clicks if touch
        if (e.type === 'touchstart') e.preventDefault();

        if (btn.classList.contains('btn-start')) {
            this.start();
        } else if (btn.classList.contains('btn-pause')) {
            this.pause();
        } else if (btn.classList.contains('btn-reset')) {
            this.reset();
        }
    }

    // attachListeners removed as it is no longer used

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.updateUI();

        this.interval = setInterval(() => {
            this.timeLeft++;
            this.querySelector('.timer-display').textContent = this.formatTime(this.timeLeft);
        }, 1000);
    }

    pause() {
        this.isRunning = false;
        if (this.interval) clearInterval(this.interval);
        this.updateUI();
    }

    reset() {
        this.pause();
        this.timeLeft = 0;
        this.querySelector('.timer-display').textContent = this.formatTime(0);
        this.updateUI();
    }

    updateUI() {
        const startBtn = this.querySelector('.btn-start');
        const pauseBtn = this.querySelector('.btn-pause');

        if (this.isRunning) {
            startBtn.style.display = 'none';
            pauseBtn.style.display = 'inline-block';
        } else {
            startBtn.style.display = 'inline-block';
            pauseBtn.style.display = 'none';
            // Show "Resume" if paused and not at 0
            startBtn.textContent = this.timeLeft > 0 ? 'Resume' : 'Start';
        }
    }
}

customElements.define('stopwatch-timer', StopwatchTimer);
