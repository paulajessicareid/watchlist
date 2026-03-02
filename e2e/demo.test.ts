import { expect, test } from '@playwright/test';

test('app shows Watchlist branding', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('link', { name: /Watchlist/i })).toBeVisible();
});
