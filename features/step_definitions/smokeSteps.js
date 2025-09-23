const { Given ,Then,When} = require('@cucumber/cucumber');
const { getPage } = require('../../hooks/hooks.js');
const sites = require('../../data/sitePagesData.js')



Given('I open {string} homepage', async function (siteUrl) {
  this.siteConfig = sites.find(site => site.site === siteUrl);
  if (!this.siteConfig) {
    throw new Error(`Site configuration for "${siteUrl}" not found.`);
  }
  await this.page.goto(siteUrl);
});

Then('I run smoke tests for {string}', { timeout: 120000 }, async function(siteName) {
  const page = this.page; // Use this.page instead of getPage()
  const siteConfig = sites.find(site => site.site === siteName);

  if (!siteConfig) {
    throw new Error(`Site configuration for "${siteName}" not found.`);
  }

  for (const pageConfig of siteConfig.pages) {
    const fullUrl = `${siteConfig.site}${pageConfig.url}`;
    console.log(`Navigating to: ${fullUrl}`);
    const response = await page.goto(fullUrl);
    
    // Wait for page to fully load
    await page.waitForLoadState('load');

    const actualTitle = await page.title();
    if (actualTitle !== pageConfig.expectedTitle) {
      console.error(`Title mismatch on ${fullUrl}: Expected "${pageConfig.expectedTitle}", but got "${actualTitle}"`);
    } else {
      console.log(`Title match on ${fullUrl}: "${actualTitle}"`);
    }

    if (response.status() !== 200) {
      console.error(`Failed to load ${fullUrl}: Status code ${response.status()}`);
    } else {
      console.log(`Successfully loaded ${fullUrl}: Status code ${response.status()}`);
    }
  }
});
