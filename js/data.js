export const exercises = [
    {
        id: 'foam-roller',
        title: 'Foam Roller',
        summary: 'Myofascial release and recovery.',
        icon: './assets/foam_roller_icon_1765160768741.png',
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
        icon: './assets/indian_clubs_icon_1765160596287.png',
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
        icon: './assets/jump_rope_icon_1765160621133.png',
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
        icon: './assets/paleo_squats_icon_1765160644641.png',
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
        icon: './assets/vibe_plate_icon_1765160662701.png',
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
        icon: './assets/yoga_icon_1765160686809.png',
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
        icon: './assets/plank_icon_1765160703767.png',
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
        icon: './assets/somersaults_icon_1765160825039.png',
        instructions: [
            'Squat down, hands on floor found.',
            'Tuck chin to chest.',
            'Push off feet to roll forward.',
            'Protect neck/head, roll on upper back.'
        ],
        type: 'reps',
        inputs: ['reps']
    }
];
