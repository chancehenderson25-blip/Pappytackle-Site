import { test, expect } from '@playwright/test';

const PAGES = ['/', '/builds', '/services', '/book', '/about', '/reviews', '/contact'];

for (const p of PAGES) {
  test(`page ${p} renders without console errors and has h1`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    const resp = await page.goto(`http://localhost:4321${p}`);
    expect(resp?.status()).toBe(200);
    const h1 = await page.locator('h1').first().textContent();
    expect(h1?.trim().length).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });
}
