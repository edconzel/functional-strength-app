const fs = require('fs');
const { test, expect, openExercise } = require('./helpers');

test.describe('history backup', () => {
    test('export, wipe, import restores history without duplicates', async ({ page }, testInfo) => {
        await openExercise(page, 'plank');
        await page.locator('#input-notes').fill('backup me');
        await page.locator('#save-btn').click();
        await expect(page.locator('.history-item')).toHaveCount(1);

        await page.goto('./');
        const downloadPromise = page.waitForEvent('download');
        await page.getByText('Export history').click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/^functional-strength-history-\d{4}-\d{2}-\d{2}\.json$/);
        const file = testInfo.outputPath('history.json');
        await download.saveAs(file);
        const exported = JSON.parse(fs.readFileSync(file, 'utf8'));
        expect(exported.app).toBe('functional-strength');
        expect(exported.logs.plank).toHaveLength(1);

        await page.evaluate(() => localStorage.clear());
        await page.locator('#import-file').setInputFiles(file);
        await expect(page.locator('#backup-status')).toHaveText('Imported 1 new entry.');

        await page.locator('#import-file').setInputFiles(file);
        await expect(page.locator('#backup-status')).toContainText('Nothing new to import');
        const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('logs_plank')));
        expect(stored).toHaveLength(1);
    });

    test('a file that is not a backup is refused', async ({ page }, testInfo) => {
        const file = testInfo.outputPath('bad.json');
        fs.writeFileSync(file, 'not json');
        await page.goto('./');
        await page.locator('#import-file').setInputFiles(file);
        await expect(page.locator('#backup-status')).toContainText('Could not import');
    });

    test('exporting with no history says so', async ({ page }) => {
        await page.goto('./');
        await page.getByText('Export history').click();
        await expect(page.locator('#backup-status')).toHaveText('No history to export yet.');
    });
});
