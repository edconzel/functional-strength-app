// --- Slow Jogging preset builders ---
// Research basis (Tanaka "niko niko" pace, Fukuoka University):
// - Interval trial protocol: 1 min slow jog / 1 min walk, repeated.
// - Beginner on-ramp used in slow jogging plans: 1 min jog / 2 min walk,
//   progressing to longer jog / shorter walk, then continuous.
// - Continuous target: ~30 min at a smile-and-talk pace, splittable
//   into 10-minute blocks.
// Every preset includes a 5-minute warm-up walk and a 5-minute
// cool-down walk.
const WARM_UP = { name: 'Warm-up Walk', duration: 300, type: 'rest' };
const COOL_DOWN = { name: 'Cool-down Walk', duration: 300, type: 'rest' };

const buildJogWalkIntervals = (jogSeconds, walkSeconds, rounds) => {
    const list = [{ ...WARM_UP }];
    for (let i = 1; i <= rounds; i++) {
        list.push({ name: `Slow Jog ${i} of ${rounds}`, duration: jogSeconds, type: 'work' });
        if (i < rounds) {
            list.push({ name: `Walk ${i} of ${rounds}`, duration: walkSeconds, type: 'rest' });
        }
    }
    list.push({ ...COOL_DOWN });
    return list;
};

const buildContinuous = (jogMinutes) => [
    { ...WARM_UP },
    { name: 'Slow Jog', duration: jogMinutes * 60, type: 'work' },
    { ...COOL_DOWN }
];

export const exercises = [
    {
        id: 'foam-roller',
        title: 'Foam Roller',
        summary: 'Myofascial release and recovery.',
        icon: './assets/foam_roller_icon.png',
        instructions: [
            'Place roller under target muscle group.',
            'Roll slowly back and forth for 30-60 seconds.',
            'Pause on tender spots for 10-15 seconds.',
            'Focus on quads, hamstrings, back, and calves.'
        ],
        type: 'timer',
        defaultDuration: 300 // 5 mins
    },
    {
        id: 'kettlebell-5min',
        title: '5 Min Kettlebell',
        summary: 'Full body metabolic blast.',
        icon: './assets/kettlebell_icon.png',
        instructions: [
            '<strong>Circular rotations</strong>: Rotate kettlebell around body <a href="https://youtu.be/Tc-7luBn2Bs?t=23" target="_blank">(0:23)</a>',
            '<strong>Side swings</strong>: Swing side-to-side between legs <a href="https://youtu.be/Tc-7luBn2Bs?t=63" target="_blank">(1:03)</a>',
            '<strong>Rows and swings</strong>: Bent-over row + swing <a href="https://youtu.be/Tc-7luBn2Bs?t=102" target="_blank">(1:42)</a>',
            '<strong>Squats with push-ups</strong>: Squat, place bell, push-up <a href="https://youtu.be/Tc-7luBn2Bs?t=142" target="_blank">(2:22)</a>',
            '<strong>Snatches</strong>: Overhead snatch, alternating arms <a href="https://youtu.be/Tc-7luBn2Bs?t=183" target="_blank">(3:03)</a>',
            '<strong>Lunges with rotations</strong>: Lunge + torso rotation <a href="https://youtu.be/Tc-7luBn2Bs?t=222" target="_blank">(3:42)</a>',
            '<strong>Rows and jumps</strong>: Row + explosive jump <a href="https://youtu.be/Tc-7luBn2Bs?t=262" target="_blank">(4:22)</a>',
            '<strong>Biceps curls</strong>: Classic curls <a href="https://youtu.be/Tc-7luBn2Bs?t=302" target="_blank">(5:02)</a>'
        ],
        intervals: [
            { name: 'Get Ready', duration: 23, type: 'rest' },
            { name: 'Circular Rotations', duration: 30, type: 'work' },
            { name: 'Rest', duration: 10, type: 'rest' },
            { name: 'Side Swings', duration: 30, type: 'work' },
            { name: 'Rest', duration: 9, type: 'rest' },
            { name: 'Rows and Swings', duration: 30, type: 'work' },
            { name: 'Rest', duration: 10, type: 'rest' },
            { name: 'Squats with Push-ups', duration: 30, type: 'work' },
            { name: 'Rest', duration: 11, type: 'rest' },
            { name: 'Snatches', duration: 30, type: 'work' },
            { name: 'Rest', duration: 9, type: 'rest' },
            { name: 'Lunges with Rotations', duration: 30, type: 'work' },
            { name: 'Rest', duration: 10, type: 'rest' },
            { name: 'Rows and Jumps', duration: 30, type: 'work' },
            { name: 'Rest', duration: 10, type: 'rest' },
            { name: 'Biceps Curls', duration: 30, type: 'work' },
            { name: 'Done', duration: 10, type: 'rest' }
        ],

        type: 'timer',
        defaultDuration: 300
    },

    {
        id: 'indian-clubs',
        title: 'Indian Clubs',
        summary: 'Shoulder mobility and grip strength.',
        icon: './assets/indian_clubs_icon.png',
        instructions: [
            'Stand with feet shoulder-width apart.',
            'Swing clubs in circular patterns.',
            'Keep core engaged and posture upright.',
            'Start with basic inward/outward swings.'
        ],
        type: 'reps',
        inputs: ['reps', 'sets']
    },
    {
        id: 'weighted-jump-rope',
        title: 'Weighted Jump Rope',
        summary: 'Cardio with added resistance.',
        icon: './assets/jump_rope_icon.png',
        instructions: [
            'Hold handles firmly.',
            'Keep elbows close to ribs.',
            'Jump on balls of feet.',
            'Maintain steady rhythm.'
        ],
        type: 'duration',
        inputs: ['duration']
    },
    {
        id: 'paleo-squats',
        title: 'Paleo Squats',
        summary: 'Deep resting squat for mobility.',
        icon: './assets/paleo_squats_icon.png',
        instructions: [
            'Stand feet shoulder-width apart.',
            'Squat down as deep as possible.',
            'Keep heels on the ground.',
            'Hold position for time.'
        ],
        type: 'timer',
        defaultDuration: 180
    },
    {
        id: 'vibe-plate',
        title: 'Vibe Plate',
        summary: 'Whole body vibration therapy.',
        icon: './assets/vibe_plate_icon.png',
        instructions: [
            'Stand in athletic stance on plate.',
            'Keep knees slightly bent.',
            'Hold for designated time.',
            'Can perform squats or stretches while vibrating.'
        ],
        type: 'timer',
        defaultDuration: 600
    },
    {
        id: 'yoga',
        title: 'Yoga',
        summary: 'Flexibility, balance, and flow.',
        icon: './assets/yoga_icon.png',
        instructions: [
            'Follow your specific flow routine.',
            'Focus on breath control.',
            'Move intentionally between poses.'
        ],
        type: 'duration',
        inputs: ['duration', 'notes']
    },
    {
        id: 'plank',
        title: 'Plank',
        summary: 'Core stability hold.',
        icon: './assets/plank_icon.png',
        instructions: [
            'Forearms on ground, elbows under shoulders.',
            'Body in straight line from head to heels.',
            'Engage core and glutes.',
            'Hold without sagging hips.'
        ],
        type: 'timer',
        defaultDuration: 60
    },
    {
        id: 'somersaults',
        title: 'Somersaults',
        summary: 'Forward rolls for coordination.',
        icon: './assets/somersaults_icon.png',
        instructions: [
            'Squat down, hands on the floor.',
            'Tuck chin to chest.',
            'Push off feet to roll forward.',
            'Protect neck/head, roll on upper back.'
        ],
        type: 'reps',
        inputs: ['reps']
    },
    {
        id: 'fascia-hopping',
        title: 'Fascia Hopping',
        summary: 'Rhythmic hopping for fascia elasticity.',
        icon: './assets/fascia_hopping_icon.png',
        instructions: [
            'Stand with feet hip-width apart.',
            'Hop lightly on the balls of your feet.',
            'Keep your heels off the ground.',
            'Maintain a steady rhythm.'
        ],
        type: 'timer',
        defaultDuration: 60
    },
    {
        id: 'slow-jogging',
        title: 'Slow Jogging',
        summary: 'Niko niko pace — jog slow enough to smile and talk.',
        icon: './assets/slow_jogging_icon.svg',
        instructions: [
            '<strong>Niko niko pace:</strong> jog only as fast as you can smile and hold a conversation. If you can\'t talk in full sentences, slow down — even if walkers pass you.',
            '<strong>Short, quick steps:</strong> aim for ~180 steps per minute, land midfoot with your foot under your hips, not out in front.',
            '<strong>Stay tall and relaxed:</strong> back straight, chin slightly up, eyes forward, shoulders loose, breathe naturally.',
            '<strong>Intervals mode:</strong> alternate slow jogging and walking on the timer — the walk breaks are part of the training, not a failure.',
            '<strong>Continuous mode:</strong> one steady slow jog between the warm-up and cool-down walks. A 30-minute session can also be split into 10-minute blocks across the day.',
            'Stop if you feel sharp pain, chest discomfort, or spinning dizziness.'
        ],
        type: 'timer',
        defaultDuration: 1800,
        // Default timer shown before a preset is picked: Level 2 intervals.
        intervals: buildJogWalkIntervals(60, 60, 10),
        presets: [
            {
                group: 'Intervals',
                label: 'Level 1 · Starter — Jog 1 min / Walk 2 min × 6',
                intervals: buildJogWalkIntervals(60, 120, 6)
            },
            {
                group: 'Intervals',
                label: 'Level 2 · Research — Jog 1 min / Walk 1 min × 10',
                intervals: buildJogWalkIntervals(60, 60, 10)
            },
            {
                group: 'Intervals',
                label: 'Level 3 · Build — Jog 5 min / Walk 1 min × 3',
                intervals: buildJogWalkIntervals(300, 60, 3)
            },
            {
                group: 'Continuous',
                label: 'Continuous — 10 min jog',
                intervals: buildContinuous(10)
            },
            {
                group: 'Continuous',
                label: 'Continuous — 20 min jog',
                intervals: buildContinuous(20)
            },
            {
                group: 'Continuous',
                label: 'Continuous — 30 min jog',
                intervals: buildContinuous(30)
            }
        ],
        defaultPreset: 1 // Level 2 · Research
    },
    {
        id: 'horse-stance',
        title: 'Horse Stance',
        summary: 'Isometric leg strength and posture hold.',
        icon: './assets/horse_stance_icon.svg',
        instructions: [
            '<strong>Wide base:</strong> feet about 1.5–2× shoulder width, toes forward or turned out just a little.',
            '<strong>Hip height:</strong> sink toward knee height as you are able. Beginners stay higher.',
            '<strong>Feet and knees:</strong> weight even over the whole foot, mid-foot and heels down. Knees track over the toes and press slightly out — never cave in, and never past the toes.',
            '<strong>Hips and back:</strong> pelvis neutral, tailbone lightly tucked. No arched lower back, and don\'t stick the butt out. Back straight, torso upright, not leaning forward.',
            '<strong>Top half:</strong> chest open, shoulders relaxed and down. Head up as if a string lifts the crown, eyes forward. Arms reach forward, or rest fists at the hips.',
            '<strong>Breathe and build:</strong> slow breaths through the nose — don\'t hold your breath. Start with 20–60 second holds and add time gradually.',
            'Stop for knee or back pain. If your knees bother you, use a higher stance.'
        ],
        type: 'timer',
        defaultDuration: 60
    }
];
