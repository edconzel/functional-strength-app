const { test, expect, openExercise, runTimer, display } = require('./helpers');

const SW = 'stopwatch-timer';

test.describe('logging a session', () => {
    test('timer fills in the duration and saving keeps the timer', async ({ page }) => {
        await openExercise(page, 'plank');
        await runTimer(page, SW, 65000);
        await expect(page.locator('#input-duration')).toHaveValue('1.08');

        await page.locator('#save-btn').click();
        await expect(page.locator('#history')).toContainText('duration: 1m 5s');
        await expect(page.locator('#log-status')).toHaveText('Saved.');
        await expect(page.locator('#input-duration')).toHaveValue('');
        // Saving must not reset the timer.
        await expect(display(page, SW)).toHaveText('01:05');
    });

    test('a typed duration is not overwritten by the timer', async ({ page }) => {
        await openExercise(page, 'plank');
        await page.locator('#input-duration').fill('3');
        await runTimer(page, SW, 20000);
        await expect(page.locator('#input-duration')).toHaveValue('3');
    });

    test('notes are shown as text, never as HTML', async ({ page }) => {
        await openExercise(page, 'plank');
        await page.locator('#input-notes').fill('<b>bold</b> & <img src=x onerror=alert(1)>');
        await page.locator('#save-btn').click();
        await expect(page.locator('#history')).toContainText('<b>bold</b> & <img');
        await expect(page.locator('#history b, #history img')).toHaveCount(0);
    });

    test('an empty form is not saved', async ({ page }) => {
        await openExercise(page, 'plank');
        await page.locator('#save-btn').click();
        await expect(page.locator('#log-status')).toContainText('Enter something');
        await expect(page.locator('.history-item')).toHaveCount(0);
    });

    test('reps and sets are logged', async ({ page }) => {
        await openExercise(page, 'indian-clubs');
        await page.locator('#input-reps').fill('12');
        await page.locator('#input-sets').fill('3');
        await page.locator('#save-btn').click();
        await expect(page.locator('#history')).toContainText('reps: 12 | sets: 3');
    });

    test('an entry can be deleted', async ({ page }) => {
        await openExercise(page, 'plank');
        await page.locator('#input-notes').fill('first');
        await page.locator('#save-btn').click();
        await expect(page.locator('.history-item')).toHaveCount(1);

        page.once('dialog', (d) => d.accept());
        await page.locator('.history-delete').click();
        await expect(page.locator('.history-item')).toHaveCount(0);
    });

    test('damaged saved history does not break the page', async ({ page }) => {
        await page.goto('./');
        await page.evaluate(() => localStorage.setItem('logs_plank', '{bad json'));
        await openExercise(page, 'plank');
        await expect(page.locator('#log-form')).toBeVisible();
        await expect(display(page, SW)).toHaveText('01:00');
    });
});
