import { test, expect } from '@playwright/test';

test('check title of the webpage', async ({ page }) => {
    await page.goto('http://localhost:3000'); 
    const title = await page.title();
    expect(title).toBe('Expected Title'); 
});

test('check if specific element is present', async ({ page }) => {
    await page.goto('http://localhost:3000');
    const element = await page.locator('selector-for-element');
    await expect(element).toBeVisible();
});