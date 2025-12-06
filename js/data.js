export const exercises = [
    {
        id: 'foam-roller',
        title: 'Foam Roller',
        summary: 'Myofascial release and recovery.',
        icon: './assets/foam_roller_icon_1765047424716.png',
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
        id: 'indian-clubs',
        title: 'Indian Clubs',
        summary: 'Shoulder mobility and grip strength.',
        icon: './assets/indian_clubs_icon_1765047438898.png',
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
        icon: './assets/jump_rope_icon_1765047452472.png',
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
        icon: './assets/paleo_squat_icon_1765047466767.png',
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
        icon: './assets/vibe_plate_icon_1765047479932.png',
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
        icon: './assets/yoga_icon_1765047545227.png',
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
        icon: './assets/plank_icon_1765047504537.png',
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
        icon: './assets/somersault_icon_1765047517236.png',
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
