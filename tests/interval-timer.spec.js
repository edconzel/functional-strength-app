const { test, expect, openExercise, display } = require('./helpers');

const IT = 'interval-timer';

test.describe('interval timer', () => {
    test('kettlebell counts work intervals only and runs to completion', async ({ page }) => {
        await openExercise(page, 'kettlebell-5min');
        await page.locator(`${IT} .btn-start`).click();
        await page.clock.fastForward(24000);
        await expect(page.locator(IT)).toContainText('Interval 1 / 8');
        await expect(page.locator(IT)).toContainText('Circular Rotations');

        await page.clock.fastForward(400000);
        await expect(page.locator(IT)).toContainText('WORKOUT COMPLETE');
        await expect(page.locator('#input-duration')).toHaveValue('5.7');
    });

    test('slow jogging: skip warm-up, interval count, and logged time', async ({ page }) => {
        await openExercise(page, 'slow-jogging');
        await expect(page.locator(IT)).toContainText('Warm-up Walk');

        await page.locator('.btn-skip-warmup').click();
        await expect(page.locator(IT)).toContainText('Interval 1 / 10');
        await expect(display(page, IT)).toHaveText('01:00');

        await page.locator(`${IT} .btn-start`).click();
        await page.clock.fastForward(125000);
        await expect(page.locator(IT)).toContainText('Interval 2 / 10');

        // The skipped warm-up must not be counted as time exercised.
        await page.locator(`${IT} .btn-pause`).click();
        await expect(page.locator('#input-duration')).toHaveValue('2.08');
    });

    test('slow jogging: switching mode loads a matching preset', async ({ page }) => {
        await openExercise(page, 'slow-jogging');
        await page.locator('[data-sj-mode="Continuous"]').click();
        await expect(page.locator('#sj-preset-summary')).toContainText('Continuous');
        await page.locator('.btn-skip-warmup').click();
        await expect(page.locator(IT)).toContainText('Interval 1 / 1');
    });

    test('slow jogging: pace guide works from age', async ({ page }) => {
        await openExercise(page, 'slow-jogging');
        await page.locator('#sj-age').fill('60');
        await expect(page.locator('.pace-hr')).toHaveText('About 108 bpm');
    });
});
