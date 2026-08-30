import { test, expect } from '@playwright/test';

test('SHOONYA UI Verification Plan', async ({ page }) => {
  // 1. Navigate to the local server
  console.log('Navigating to Shoonya dashboard...');
  await page.goto('http://localhost:5173/');

  // 2. Verify map is loaded 
  // (Note: '.map-container' class ko apne actual map class/id se replace karein)
  console.log('Verifying Map...');
  const mapElement = page.locator('.map-container').first(); 
  await expect(mapElement).toBeVisible({ timeout: 10000 });

  // 3. Verify incidents are loaded/displayed
  console.log('Verifying Incidents...');
  const incidents = page.locator('.incident-card, .incident-list').first();
  await expect(incidents).toBeVisible();

  // 4. Verify operational console tabs are present
  console.log('Verifying Console Tabs...');
  const consoleTabs = page.locator('.tabs, [role="tablist"]');
  await expect(consoleTabs).toBeVisible();

  // 5. Verify telemetry is displayed
  console.log('Verifying Telemetry...');
  const telemetryData = page.locator('.telemetry-panel, .telemetry');
  await expect(telemetryData).toBeVisible();

  // 6. Capture screenshot of the UI
  console.log('Taking screenshot...');
  await page.screenshot({ path: 'shoonya-ui-verification.png', fullPage: true });
  
  console.log('All verifications passed successfully!');
});