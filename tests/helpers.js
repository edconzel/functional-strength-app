const base = require('@playwright/test');

// Every test gets a page with:
// - Google Fonts blocked, so tests don't depend on the network
// - a fake clock, so minutes of timer time pass instantly
// - a record of page errors, checked when the test ends
const test = base.test.extend({
    page: async ({ page }, use) => {
        const errors = [];
        page.on('pageerror', (e) => errors.push(String(e)));
        page.on('console', (m) => {
            if (m.type() === 'error' && !m.text().includes('ERR_FAILED')) errors.push(m.text());
        });
        await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
        await page.clock.install();
        await use(page);
        base.expect(errors, 'page errors').toEqual([]);
    }
});

const openExercise = async (page, id) => {
    await page.goto(`./#${id}`);
    await page.locator('.detail-view').waitFor();
};

// Start a timer, let `ms` pass, then pause it.
const runTimer = async (page, timer, ms) => {
    await page.locator(`${timer} .btn-start`).click();
    await page.clock.fastForward(ms);
    await page.locator(`${timer} .btn-pause`).click();
};

const display = (page, timer) => page.locator(`${timer} .timer-display`);

module.exports = { test, expect: base.expect, openExercise, runTimer, display };
