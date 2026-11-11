// Web Audio cues and a lookahead metronome. One context is created on the
// first user gesture (Start, or the cadence toggle) so iOS Safari will play.
let audioCtx = null;
let master = null;
let keepAlive = null;
let audioSessionSet = false;

export function getAudioContext() {
    if (audioCtx) return audioCtx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
    master = audioCtx.createGain();
    master.gain.value = 0.9;
    master.connect(audioCtx.destination);
    return audioCtx;
}

function destination() {
    return master || getAudioContext()?.destination || null;
}

// Call synchronously inside a tap handler. Resume plus a one-sample buffer
// unlocks audio on iOS; playback session keeps cues audible with the mute switch on.
export function unlockAudio() {
    const ctx = getAudioContext();
    if (!ctx) return null;
    if (!audioSessionSet) {
        audioSessionSet = true;
        try {
            if (navigator.audioSession) navigator.audioSession.type = 'playback';
        } catch (e) {
            // Older browsers have no audio session API.
        }
    }
    if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
    }
    try {
        const buffer = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.connect(ctx.destination);
        src.start(0);
    } catch (e) {
        // Unlock is best-effort; cues still schedule if the context is running.
    }
    return ctx;
}

export function resumeAudio() {
    const ctx = audioCtx;
    if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
    }
}

// Near-silent tone so iOS is less likely to suspend the context between cues
// while the phone is locked. Inaudible at this level on a phone speaker.
export function startAudioKeepAlive() {
    const ctx = getAudioContext();
    const dest = destination();
    if (!ctx || !dest || keepAlive) return;
    try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 40;
        gain.gain.value = 0.0001;
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        keepAlive = osc;
    } catch (e) {
        keepAlive = null;
    }
}

export function stopAudioKeepAlive() {
    if (!keepAlive) return;
    try { keepAlive.stop(); } catch (e) { /* already stopped */ }
    keepAlive = null;
}

// Pocket-strength patterns for Android (Chrome and Samsung Internet).
// A second vibrate() call cancels the one in progress, so cues are spaced
// and each pattern is long enough for a phone motor to spin up in a pocket:
//   jog/work  = two knocks
//   walk/rest = one long buzz
//   done      = three pulses, last one longer
//   countdown = a short tap, stronger on the final second
function vibrate(pattern) {
    try {
        if (typeof navigator.vibrate !== 'function') return;
        const seq = (Array.isArray(pattern) ? pattern : [pattern])
            .map((n) => Math.max(0, Math.round(Number(n) || 0)));
        navigator.vibrate(seq);
    } catch (e) {
        // Blocked by the browser, or no vibrator (desktop). Timer keeps going.
    }
}

function toneAt(ctx, dest, start, dur, freq, peak, type) {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type || 'triangle';
    osc.frequency.setValueAtTime(freq, start);
    const attack = Math.min(0.012, dur * 0.35);
    const end = start + Math.max(dur, attack + 0.008);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), start + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(amp);
    amp.connect(dest);
    osc.start(start);
    osc.stop(end + 0.03);
    return osc;
}

// Jog/work rises, walk/rest falls, done is a short major arpeggio.
// Countdown ticks are short and higher so they don't sound like a phase change.
const CUES = {
    work: {
        vibrate: [220, 150, 220],
        notes: [
            { freq: 784, at: 0, dur: 0.1, gain: 0.5 },
            { freq: 1175, at: 0.11, dur: 0.16, gain: 0.55 }
        ]
    },
    rest: {
        vibrate: [500],
        notes: [
            { freq: 523, at: 0, dur: 0.14, gain: 0.44 },
            { freq: 349, at: 0.15, dur: 0.22, gain: 0.42 }
        ]
    },
    done: {
        vibrate: [180, 100, 180, 100, 360],
        notes: [
            { freq: 523, at: 0, dur: 0.13, gain: 0.46 },
            { freq: 659, at: 0.14, dur: 0.13, gain: 0.46 },
            { freq: 784, at: 0.28, dur: 0.28, gain: 0.52 }
        ]
    },
    beep: {
        vibrate: [100],
        notes: [
            { freq: 988, at: 0, dur: 0.055, gain: 0.34, type: 'sine' }
        ]
    },
    beepFinal: {
        vibrate: [200],
        notes: [
            { freq: 1319, at: 0, dur: 0.08, gain: 0.4, type: 'sine' }
        ]
    }
};

export function playCue(kind) {
    const spec = CUES[kind] || CUES.beep;
    vibrate(spec.vibrate);
    const ctx = audioCtx;
    const dest = destination();
    if (!ctx || !dest) return;
    try {
        const t0 = ctx.currentTime;
        for (const note of spec.notes) {
            toneAt(ctx, dest, t0 + note.at, note.dur, note.freq, note.gain, note.type || 'triangle');
        }
    } catch (e) {
        // A failed cue must not stop the timer.
    }
}

// Lookahead scheduler: clicks are placed on the audio clock, not fired from
// the timer callback, so the beat stays even when the callback jitters.
export function createMetronome() {
    let bpm = 180;
    let running = false;
    let timer = null;
    let next = 0;
    const pending = new Set();
    const HORIZON = 1.5;
    const PUMP_MS = 400;

    const period = () => 60 / bpm;

    function dropPending() {
        for (const node of pending) {
            try { node.stop(); } catch (e) { /* already ended */ }
        }
        pending.clear();
    }

    function schedule(ctx) {
        const dest = destination();
        if (!dest) return;
        const earliest = ctx.currentTime + 0.02;
        const step = period();
        if (next < earliest) {
            if (earliest - next < step) {
                next = earliest;
            } else {
                const missed = Math.ceil((earliest - next) / step);
                next += missed * step;
                if (next < earliest) next = earliest;
            }
        }
        const horizon = ctx.currentTime + HORIZON;
        while (next < horizon) {
            try {
                const node = toneAt(ctx, dest, next, 0.025, 1760, 0.32, 'square');
                pending.add(node);
                node.onended = () => pending.delete(node);
            } catch (e) {
                // Skip a beat rather than killing the scheduler.
            }
            next += step;
        }
    }

    function pump() {
        if (!running) return;
        const ctx = getAudioContext();
        if (ctx) schedule(ctx);
        timer = setTimeout(pump, PUMP_MS);
    }

    return {
        setBpm(value) {
            if (!Number.isFinite(value) || value === bpm) return;
            bpm = value;
            if (!running) return;
            const ctx = getAudioContext();
            dropPending();
            if (ctx) {
                next = ctx.currentTime + 0.06;
                schedule(ctx);
            }
        },
        isRunning() {
            return running;
        },
        start() {
            const ctx = getAudioContext();
            if (!ctx || running) return;
            running = true;
            next = ctx.currentTime + 0.06;
            if (timer) clearTimeout(timer);
            pump();
        },
        stop() {
            running = false;
            if (timer) clearTimeout(timer);
            timer = null;
            dropPending();
        }
    };
}
