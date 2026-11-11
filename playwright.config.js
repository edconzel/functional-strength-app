// Browser tests. Run with `npm test` (see README).
const { defineConfig } = require('@playwright/test');

const PORT = 8123;

module.exports = defineConfig({
    testDir: './tests',
    timeout: 30000,
    fullyParallel: true,
    reporter: [['list']],
    use: {
        baseURL: `http://localhost:${PORT}/`,
        // Phone-sized, since the app is used on a phone.
        viewport: { width: 390, height: 844 },
        // Keeps the offline cache from serving stale files between tests.
        // The offline test turns it back on for itself.
        serviceWorkers: 'block',
        launchOptions: {
            // Set CHROME_PATH to use an installed Chrome instead of the
            // browser that `npx playwright install chromium` downloads.
            executablePath: process.env.CHROME_PATH || undefined
        }
    },
    webServer: {
        command: `node tests/server.js ${PORT}`,
        port: PORT,
        reuseExistingServer: !process.env.CI
    }
});
