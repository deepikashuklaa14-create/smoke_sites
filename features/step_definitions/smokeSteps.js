const { Given, Then } = require('@cucumber/cucumber');
const { openHomepage, runSmokeTests, clickLinksCollectResults } = require('../../utils/smokeMethods.js');

Given('I open {string} homepage', async function (siteUrl) {
  await openHomepage.call(this, siteUrl);
});

Then('I run smoke tests for {string}', { timeout: 5000000 }, async function (siteName) {
  await runSmokeTests.call(this, siteName);
});

Then('I click all links and save results to Excel report', async function () {
  const urlsToCheck = this.siteConfig?.pages?.map(page => ({
    url: `${this.siteConfig.site}${page.url}`,
    expectedTitle: page.expectedTitle,
  }));

  if (!Array.isArray(urlsToCheck)) {
    throw new Error('Failed to generate URLs to check from siteConfig');
  }
// Prepare to write custom URLs test results here

  await clickLinksCollectResults.call(this, urlsToCheck);
});