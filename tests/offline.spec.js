const base = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const { test, expect } = base;

// This file uses the real clock and the real service worker.
test.use({ serviceWorkers: 'allow' });

test.describe('offline support', () => {
    test('the app opens with no connection after one visit', async ({ page, context }) => {
        await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
        await page.goto('./');
        await page.locator('.exercise-list .card').first().waitFor();
        await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
        // Give the install step time to finish saving files.
        await page.evaluate(async () => {
            const names = await caches.keys();
            const cache = await caches.open(names[0]);
            for (let i = 0; i < 50 && (await cache.keys()).length < 15; i++) {
                await new Promise((r) => setTimeout(r, 100));
            }
        });

        await context.setOffline(true);
        await page.reload();
        await expect(page.locator('.exercise-list .card').first()).toBeVisible();

        await page.goto('./#plank');
        await expect(page.locator('stopwatch-timer .timer-display')).toHaveText('01:00');
        const iconOk = await page.evaluate(() => fetch('./assets/plank_icon.png').then((r) => r.ok).catch(() => false));
        expect(iconOk).toBe(true);
    });

    test('every file the app uses is in the offline list', async () => {
        const root = path.resolve(__dirname, '..');
        const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
        const data = fs.readFileSync(path.join(root, 'js/data.js'), 'utf8');

        const listed = [...sw.matchAll(/'\.\/([^']+)'/g)].map((m) => m[1]);
        for (const file of listed) {
            expect(fs.existsSync(path.join(root, file)), `sw.js lists ${file}, which does not exist`).toBe(true);
        }

        const icons = [...data.matchAll(/'\.\/(assets\/[^']+)'/g)].map((m) => m[1]);
        const scripts = fs.readdirSync(path.join(root, 'js')).map((f) => `js/${f}`);
        for (const file of [...icons, ...scripts]) {
            expect(listed, `${file} is missing from the CORE list in sw.js`).toContain(file);
        }
    });

    test('manifest is valid and its icons exist', async () => {
        const root = path.resolve(__dirname, '..');
        const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
        expect(manifest.display).toBe('standalone');
        for (const icon of manifest.icons) {
            expect(fs.existsSync(path.join(root, icon.src))).toBe(true);
        }
    });
});
