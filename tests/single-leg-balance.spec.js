const { test, expect, openExercise, runTimer, display } = require('./helpers');

const SW = 'stopwatch-timer';

test.describe('single-leg balance', () => {
    test('needs a time before it will save', async ({ page }) => {
        await openExercise(page, 'single-leg-balance');
        await expect(page.locator('.side-btn.active')).toHaveText('Left leg');
        await page.locator('#save-btn').click();
        await expect(page.locator('#log-status')).toContainText('Run the timer');
    });

    test('logs each leg separately with its best time', async ({ page }) => {
        await openExercise(page, 'single-leg-balance');
        await expect(display(page, SW)).toHaveText('00:00');

        await runTimer(page, SW, 42500);
        await expect(page.locator('#input-duration')).toHaveValue('42');
        await expect(page.locator('#save-btn')).toHaveText('Save Left leg');
        await page.locator('#save-btn').click();
        await expect(page.locator('#log-status')).toHaveText('Saved 42s for left leg.');
        // Ready for the next attempt.
        await expect(display(page, SW)).toHaveText('00:00');

        await page.locator('.side-btn', { hasText: 'Right leg' }).click();
        await expect(page.locator('#save-btn')).toHaveText('Save Right leg');
        await runTimer(page, SW, 27300);
        await page.locator('#save-btn').click();
        await runTimer(page, SW, 75000);
        await page.locator('#save-btn').click();

        await expect(page.locator('#history')).toContainText('Left leg History');
        await expect(page.locator('#history')).toContainText('Right leg History');
        await expect(page.locator('.side-best-time')).toHaveText(['42s', '1m 15s']);
        await expect(page.locator('.side-best-count')).toHaveText(['1 attempt', '2 attempts']);
        await expect(page.locator('.side-best.leading .side-best-label')).toHaveText('Right leg');

        // Deleting from one leg's list removes that entry and no other.
        page.once('dialog', (d) => d.accept());
        await page.locator('.card', { hasText: 'Right leg History' }).locator('.history-delete').first().click();
        await expect(page.locator('.side-best-time')).toHaveText(['42s', '27s']);
    });

    test('remembers the selected leg', async ({ page }) => {
        await openExercise(page, 'single-leg-balance');
        await page.locator('.side-btn', { hasText: 'Right leg' }).click();
        await page.reload();
        await expect(page.locator('.side-btn.active')).toHaveText('Right leg');
    });
});
