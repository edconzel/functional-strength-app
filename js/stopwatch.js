export class StopwatchTimer extends HTMLElement {
    constructor() {
        super();
        this.timeLeft = 0;
        this.interval = null;
        this.isRunning = false;
    }

    connectedCallback() {
        this.render();
        this.attachListeners();
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

    attachListeners() {
        this.querySelector('.btn-start').addEventListener('click', () => this.start());
        this.querySelector('.btn-pause').addEventListener('click', () => this.pause());
        this.querySelector('.btn-reset').addEventListener('click', () => this.reset());
    }

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
