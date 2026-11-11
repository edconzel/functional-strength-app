const { test, expect } = require('./helpers');

test.describe('home screen', () => {
    test('lists every exercise with a working icon', async ({ page }) => {
        await page.goto('./');
        const titles = await page.locator('.exercise-list .card-title').allInnerTexts();
        expect(titles.length).toBeGreaterThan(0);
        expect(new Set(titles).size).toBe(titles.length);

        const iconsOk = await page.evaluate(() => Promise.all(
            [...document.querySelectorAll('.card-icon img')].map((img) => fetch(img.src).then((r) => r.ok))
        ));
        expect(iconsOk.every(Boolean)).toBe(true);
    });

    test('every exercise page opens', async ({ page }) => {
        await page.goto('./');
        const links = await page.locator('.exercise-list a.card').evaluateAll((els) => els.map((a) => a.getAttribute('href')));
        for (const href of links) {
            await page.goto(`./${href}`);
            await expect(page.locator('.detail-view h1')).toBeVisible();
            await expect(page.locator('stopwatch-timer, interval-timer')).toHaveCount(1);
            await expect(page.locator('#log-form')).toBeVisible();
        }
    });

    test('opens in Focus View and the button names the other view', async ({ page }) => {
        await page.goto('./');
        await expect(page.locator('.exercise-list.focus-mode')).toHaveCount(1);
        await expect(page.locator('.view-switch')).toHaveText('Expanded View');

        await page.locator('.view-switch').click();
        await expect(page.locator('.exercise-list.focus-mode')).toHaveCount(0);
        await expect(page.locator('.view-switch')).toHaveText('Focus View');

        await page.reload();
        await expect(page.locator('.exercise-list.focus-mode')).toHaveCount(1);
    });

    test('an unknown exercise link shows a message instead of breaking', async ({ page }) => {
        await page.goto('./#no-such-exercise');
        await expect(page.locator('#app')).toContainText('Exercise not found');
    });
});
