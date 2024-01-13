import { expect, test } from '@playwright/test';

test('about page has expected h1', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('heading', { name: 'About this app' })).toBeVisible();
});

// Note: trailingSlash has bad effect on paths in the tests: /about -> /about/
// TODO: (when needed) Honor trailingSlash=true, which can be per-route. Yikes!
// test('/about/ page has expected h1', async ({ page }) => {
//   await page.goto('/about/');
//   expect(await page.textContent('h1')).toBe('About this app');
// });
