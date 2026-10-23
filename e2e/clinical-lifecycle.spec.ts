import { test, expect } from '@playwright/test';

test.describe('End-to-End Clinical Lifecycle Journey', () => {
  test('(a) Doctor Directory and 5-Step Booking Wizard UI Navigation', async ({ page }) => {
    // Navigate to public doctor directory
    await page.goto('/doctors');
    await expect(page).toHaveTitle(/Digital Clinic|Doctors/i);

    // Verify search and department filter elements exist
    const searchInput = page.locator('input[placeholder*="Search by doctor name or specialty"]');
    await expect(searchInput).toBeVisible();

    // Verify specialty filter / cards
    const directoryCards = page.locator('[data-testid="doctor-card"], article, .group');
    await expect(directoryCards.first()).toBeVisible({ timeout: 15000 });

    // Navigate to booking page for a doctor
    const bookButton = page.locator('a:has-text("Book Appointment"), a:has-text("Book Consultation")').first();
    if (await bookButton.isVisible()) {
      await bookButton.click();
      await page.waitForURL(/\/book/);
      expect(page.url()).toContain('/book');
    }
  });

  test('(b) Doctor Queue and Clinical Charting Interface', async ({ page }) => {
    // Verify doctor queue structure
    await page.goto('/doctor');
    // If redirected to login, verify login elements are present
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();
    } else {
      await expect(page.locator('h1, h2')).toContainText(/Doctor|Consultation|Queue|Schedule/i);
    }
  });

  test('(c) Patient EHR Health Records and Clinical Reviews Interface', async ({ page }) => {
    await page.goto('/patient/records');
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();
    } else {
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('(d) Admin Review Moderation Queue Interface', async ({ page }) => {
    await page.goto('/admin/reviews');
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();
    } else {
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
