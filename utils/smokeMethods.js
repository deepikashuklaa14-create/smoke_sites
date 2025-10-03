
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const sites = require('../data/sitePagesData.js');
const { setDefaultTimeout } = require('@cucumber/cucumber');

/**
 * Opens the homepage of the given site.
 */
async function openHomepage(siteUrl) {
  this.siteConfig = sites.find(site => site.site === siteUrl);
  if (!this.siteConfig) {
    throw new Error(`Site configuration for "${siteUrl}" not found.`);
  }
  await this.page.goto(siteUrl, { timeout: 180000, waitUntil: 'domcontentloaded' });
}

/**
 * Sanitizes sheet name to make it Excel-safe
 */
function sanitizeSheetName(name) {
  return name.replace(/[\\/*?:[\]]/g, '_').slice(0, 31);
}

/**
 * Prepares an Excel workbook and sheet with styled headers.
 */
async function setupExcelWorkbook(sheetName) {
  const workbook = new ExcelJS.Workbook();
  const safeSheetName = sanitizeSheetName(sheetName);
  const worksheet = workbook.addWorksheet(safeSheetName);

  worksheet.columns = [
    { header: 'URL', key: 'URL', width: 60 },
    { header: 'Expected Title', key: 'ExpectedTitle', width: 40 },
    { header: 'Actual Title', key: 'ActualTitle', width: 40 },
    { header: 'Status Code', key: 'Status', width: 15 },
    { header: 'Duration (ms)', key: 'Duration', width: 15 },
    { header: 'Result', key: 'Result', width: 10 }
  ];

  worksheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  return { workbook, worksheet };
}

/**
 * Writes a styled row to the Excel sheet with conditional formatting.
 */
function writeStyledRow(worksheet, result, rowIndex) {
  const row = worksheet.addRow(result);
  const isEven = rowIndex % 2 === 0;
  const bgColor = isEven ? 'FFF2F2F2' : 'FFFFFFFF';

  row.eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: bgColor }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  });

  const resultCell = row.getCell('Result');
  if (result.Result === 'PASS') {
    resultCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB6FFB6' } };
    resultCell.font = { bold: true, color: { argb: 'FF006100' } };
  } else if (result.Result === 'FAIL') {
    resultCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
    resultCell.font = { bold: true, color: { argb: 'FF9C0006' } };
  } else {
    resultCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
    resultCell.font = { italic: true, color: { argb: 'FF000000' } };
  }
}

/**
 * Creates the result object template.
 */
function createResultObject(url, expectedTitle = '') {
  return {
    URL: url,
    ExpectedTitle: expectedTitle,
    ActualTitle: '',
    Status: '',
    Duration: '',
    Result: ''
  };
}

/**
 * Saves the Excel file to the proper directory.
 */
async function saveExcelReport(workbook, fileName, folder) {
  const dir = path.resolve(__dirname, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, fileName);
  await workbook.xlsx.writeFile(filePath);
  console.log(`📊 Excel report saved to: ${filePath}`);
}

/**
 * Takes a screenshot on error.
 */
async function captureScreenshot(page, url, timestamp, basePath) {
  const screenshotsDir = path.resolve(__dirname, basePath);
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  const filename = url.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50);
  const screenshotPath = path.join(screenshotsDir, `${filename}_${timestamp}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
}

/**
 * Visits a URL and extracts timing, title, status.
 */
async function navigateToPage(page, url, useH1 = true) {
  const start = Date.now();
  const response = await page.goto(url);
  await page.waitForLoadState('load');
  const end = Date.now();

  const status = response.status();
  const title = useH1
    ? await page.$eval('h1', el => el.textContent.trim()).catch(() => 'Title not Found')
    : await page.title();

  return { title, status, duration: end - start };
}

/**
 * Smoke test runner for a given site config.
 */
async function runSmokeTests(siteName) {
  const page = this.page;
  setDefaultTimeout(300000);

  const siteConfig = sites.find(site => site.site === siteName);
  if (!siteConfig) {
    throw new Error(`Site configuration for "${siteName}" not found.`);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const { workbook, worksheet } = await setupExcelWorkbook(`${siteName}_SmokeTest`);
  let rowIndex = 2;

  for (const pageConfig of siteConfig.pages) {
    const fullUrl = `${siteConfig.site}${pageConfig.url}`;
    const expectedTitle = pageConfig.expectedTitle || '';
    const result = createResultObject(fullUrl, expectedTitle);

    try {
      const { title, status, duration } = await navigateToPage(page, fullUrl, true);
      result.ActualTitle = title;
      result.Status = status;
      result.Duration = duration;
      result.Result = title === expectedTitle ? 'PASS' : 'FAIL';

      if (result.Result === 'PASS') {
        console.log(` [${status}] H1 matches for ${fullUrl}`);  
      } else {
        console.error(`Title mismatch on ${fullUrl}:\nExpected: "${expectedTitle}"\nActual:   "${title}"`);
      }
    } catch (err) {
      console.error(` Error visiting ${fullUrl}: ${err.message}`);
      await captureScreenshot(page, fullUrl, timestamp, '../reports/screenshots');
      Object.assign(result, {
        ActualTitle: 'Error or no Title',
        Status: 'Error',
        Duration: 'N/A',
        Result: 'FAIL'
      });
    }

    writeStyledRow(worksheet, result, rowIndex++);
  }

  await saveExcelReport(
    workbook,
    `${sanitizeSheetName(siteName)}_SmokeTestResults_${timestamp}.xlsx`,
    '../reports'
  );
}

/**
 * Custom link checker for arbitrary URLs.
 */
async function clickLinksCollectResults(urlsToCheck) {
  const page = this.page;

  if (!Array.isArray(urlsToCheck)) {
    throw new TypeError(`"urlsToCheck" must be an array. Got: ${typeof urlsToCheck}`);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const { workbook, worksheet } = await setupExcelWorkbook('CustomURLs');
  let rowIndex = 2;

  for (const { url, expectedTitle } of urlsToCheck) {
    const result = createResultObject(url, expectedTitle);

    try {
      console.log(`Visiting: ${url}`);
      const { title, status, duration } = await navigateToPage(page, url, true);
      result.ActualTitle = title;
      result.Status = status;
      result.Duration = duration;
      result.Result = expectedTitle ? (title === expectedTitle ? 'PASS' : 'FAIL') : 'N/A';

      if (expectedTitle) {
        if (result.Result === 'PASS') {
          console.log(`Title matches for ${url}`);
        } else {
          console.error(`Title mismatch for ${url}: Expected "${expectedTitle}", got "${title}"`);
        }
      }
    } catch (error) {
      console.error(`Error visiting ${url}: ${error.message}`);
      await captureScreenshot(page, url, timestamp, '../reports/screenshots');
      Object.assign(result, {
        ActualTitle: 'Error',
        Status: 'Error',
        Duration: 'N/A',
        Result: 'FAIL'
      });
    }

    writeStyledRow(worksheet, result, rowIndex++);
  }

  await saveExcelReport(workbook, `CustomURLs_SmokeTestResults_${timestamp}.xlsx`, '../reports');

  if (!this.allSiteLinkResults) this.allSiteLinkResults = {};
  this.allSiteLinkResults[this.siteConfig ? this.siteConfig.site : 'Custom'] = worksheet;
}

module.exports = {
  openHomepage,
  runSmokeTests,
  clickLinksCollectResults
};
