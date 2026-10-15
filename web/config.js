// Server-owner presentation settings. Background paths are relative to index.html.
// Put additional backgrounds in assets/images so the manifest packages them.
window.FeatherLoadscreenConfig = {
    language: 'en',
    reducedMotion: 'auto', // true: always reduce; false: allow motion; auto: OS preference
    accessibility: { progress: 'Server asset loading progress', community: 'Community links',
        discord: 'Discord', website: 'Website', tip: 'Tip' },
    eyebrow: 'Feather Framework',
    title: 'Welcome to the Frontier',
    subtitle: 'Your story is about to begin.',
    accent: '#c6a15b',
    logo: 'assets/images/feather-logo-subdued.png',
    logoAlt: 'Feather Framework',
    backgrounds: [
        'assets/images/background-gunfighter.webp',
        'assets/images/background-horse-cactus.webp',
        'assets/images/background-horse-rearing.webp',
        'assets/images/background-night-horse.webp',
        'assets/images/background-train-horse.webp'
    ],
    randomizeFirstBackground: true,
    backgroundPosition: 'center',
    backgroundIntervalMs: 12000,
    overlayOpacity: 0.72,
    buildLabel: 'Alpha',
    links: {
        discord: '',
        website: ''
    },
    statusMessages: {
        connecting: 'Connecting to server',
        initializing: 'Initializing game',
        map: 'Preparing the frontier',
        environment: 'Setting up the world',
        session: 'Joining your session',
        validating: 'Validating server assets',
        downloading: 'Downloading server assets',
        dataFiles: 'Loading game data',
        scripts: 'Starting client systems',
        complete: 'Server assets loaded; waiting for character menu'
    },
    tipIntervalMs: 9000,
    tips: [
        'Roleplay the character, not the outcome.',
        'Give other players room to shape the story.',
        'Use your inventory to manage weapons, ammunition, and supplies.'
    ]
};
