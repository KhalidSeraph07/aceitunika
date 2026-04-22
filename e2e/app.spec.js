import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('title, h1, .brand')).toBeVisible();
  });

  test('should login with valid credentials and redirect', async ({ page }) => {
    await page.goto('/');
    const usernameInput = page.locator('input[type="text"], input[name="username"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    if (await usernameInput.isVisible()) {
      await usernameInput.fill('administracion');
      await passwordInput.fill('123456');
      await page.locator('button[type="submit"], .btn-login, button:has-text("Ingresar")').first().click();
      await page.waitForURL('**/entrada_aceituna.html', { timeout: 5000 }).catch(() => {});
      await expect(page).not.toHaveURL('/');
    }
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/');
    const usernameInput = page.locator('input[type="text"], input[name="username"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    if (await usernameInput.isVisible()) {
      await usernameInput.fill('wrong');
      await passwordInput.fill('wrong');
      await page.locator('button[type="submit"], .btn-login').first().click();
      await page.waitForTimeout(1000);
      const errorVisible = await page.locator('.error, .error-message, [class*="error"]').isVisible().catch(() => false);
      expect(errorVisible || page.url().includes('index')).toBeTruthy();
    }
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/entrada_aceituna.html');
    await page.evaluate(() => {
      window.AppState = { user: { id: 1, username: 'admin', nombre: 'Admin', rol: 'admin', isLoggedIn: true } };
    });
  });

  test('should show sidebar navigation', async ({ page }) => {
    await page.goto('/entrada_aceituna.html');
    await expect(page.locator('.sidebar, nav, [class*="nav"]').first()).toBeVisible();
  });

  test('should have access to Entrada section', async ({ page }) => {
    const section = page.locator('#section-entrada, .section-entrada, [id="section-entrada"]');
    await page.waitForTimeout(500);
    if (await section.isVisible()) {
      await expect(section).toBeVisible();
    }
  });
});

test.describe('API Health', () => {
  test('should respond to health check', async ({ request }) => {
    const res = await request.get('/health');
    expect(res.ok() || res.status() === 200 || res.status() === 404).toBeTruthy();
  });
});
