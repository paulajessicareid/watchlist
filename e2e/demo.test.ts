import { expect, test } from '@playwright/test';

test('app shows Filmheads branding', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('link', { name: /Filmheads/i })).toBeVisible();
});
