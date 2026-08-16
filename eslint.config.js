import js from '@eslint/js';

const browserGlobals = {
    AudioContext: 'readonly',
    DeviceOrientationEvent: 'readonly',
    Image: 'readonly',
    URL: 'readonly',
    console: 'readonly',
    document: 'readonly',
    fetch: 'readonly',
    innerHeight: 'readonly',
    innerWidth: 'readonly',
    localStorage: 'readonly',
    navigator: 'readonly',
    performance: 'readonly',
    requestAnimationFrame: 'readonly',
    setInterval: 'readonly',
    setTimeout: 'readonly',
    clearInterval: 'readonly',
    clearTimeout: 'readonly',
    window: 'readonly',
};

const nodeGlobals = {
    Buffer: 'readonly',
    process: 'readonly',
};

export default [
    {
        ignores: ['node_modules/**', 'playwright-report/**', 'test-results/**', 'docs/benchmarks/*.json'],
    },
    js.configs.recommended,
    {
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        },
    },
    {
        files: ['src/js/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: browserGlobals,
        },
    },
    {
        files: ['scripts/**/*.js', 'playwright.config.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...browserGlobals,
                ...nodeGlobals,
            },
        },
    },
    {
        files: ['tests/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: browserGlobals,
        },
    },
];
