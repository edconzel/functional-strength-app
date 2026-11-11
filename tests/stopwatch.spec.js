const { test, expect, openExercise, runTimer, display } = require('./helpers');

const SW = 'stopwatch-timer';

test.describe('stopwatch with a target (Plank)', () => {
    test('counts down, then shows total time once the target is reached', async ({ page }) => {
        await openExercise(page, 'plank');
        await expect(display(page, SW)).toHaveText('01:00');

        await page.locator(`${SW} .btn-start`).click();
        await page.clock.fastForward(20000);
        await expect(display(page, SW)).toHaveText('00:40');

        // A long jump stands in for a locked phone: the time must catch up.
        await page.clock.fastForward(45000);
        await expect(display(page, SW)).toHaveText('01:05');
        await expect(page.locator(SW)).toHaveAttribute('data-target-reached', 'true');
    });

    test('target can be adjusted before starting and is remembered', async ({ page }) => {
        await openExercise(page, 'plank');
        await page.getByLabel('Increase target').click();
        await expect(display(page, SW)).toHaveText('01:15');

        await page.reload();
        await expect(display(page, SW)).toHaveText('01:15');

        await page.locator(`${SW} .btn-start`).click();
        await expect(page.getByLabel('Increase target')).toBeDisabled();
    });

    test('pause, resume and reset', async ({ page }) => {
        await openExercise(page, 'plank');
        await runTimer(page, SW, 10000);
        await page.clock.fastForward(30000);
        await expect(display(page, SW)).toHaveText('00:50');

        await expect(page.locator(`${SW} .btn-start`)).toHaveText('Resume');
        await runTimer(page, SW, 5000);
        await expect(display(page, SW)).toHaveText('00:45');

        await page.locator(`${SW} .btn-reset`).click();
        await expect(display(page, SW)).toHaveText('01:00');
    });
});

test.describe('stopwatch with no target (Weighted Jump Rope)', () => {
    test('counts up', async ({ page }) => {
        await openExercise(page, 'weighted-jump-rope');
        await expect(display(page, SW)).toHaveText('00:00');
        await runTimer(page, SW, 125000);
        await expect(display(page, SW)).toHaveText('02:05');
    });
});
