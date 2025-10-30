const fs = require('fs');
const path = require('path');
const reporter = require('cucumber-html-reporter');

// Wait for the JSON report to exist and be valid
async function waitForJsonFile(filePath, timeout = 120000) {
  const start = Date.now();
  while (true) {
    if (fs.existsSync(filePath)) {
      try {
        JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return true;
      } catch {}
    }
    if (Date.now() - start > timeout) {
      throw new Error('JSON file not ready in time');
    }
    await new Promise(r => setTimeout(r, 500));
  }
}

// Recursively find video file in subfolders for a scenario
function findVideoForScenario(videosDir, scenarioNameSafe) {
  const subfolders = fs.readdirSync(videosDir, { withFileTypes: true })
    .filter(f => f.isDirectory() && f.name.startsWith(scenarioNameSafe));

  if (subfolders.length === 0) return null;

  const videoFiles = fs.readdirSync(path.join(videosDir, subfolders[0].name))
    .filter(f => f.endsWith('.webm') || f.endsWith('.mp4'));

  if (videoFiles.length === 0) return null;

  return path.join('videos', subfolders[0].name, videoFiles[0]); // relative path
}

// Embed video as base64 in scenario step
function embedVideoAsBase64(scenario, videoPath) {
  const ext = path.extname(videoPath).toLowerCase();
  const type = ext === '.mp4' ? 'video/mp4' : 'video/webm';

  const videoData = fs.readFileSync(path.join(__dirname, videoPath));
  const videoBase64 = videoData.toString('base64');

  scenario.steps[0].embeddings = scenario.steps[0].embeddings || [];
  scenario.steps[0].embeddings.push({
    mime_type: 'text/html',
    data: Buffer.from(`
      <video width="640" height="360" controls style="margin-top:10px">
        <source src="data:${type};base64,${videoBase64}" type="${type}">
        Your browser does not support the video tag.
      </video>
      <p>Full recording of scenario: ${scenario.name}</p>
    `).toString('base64')
  });
}

// Main function
(async () => {
  const reportsDir = path.join(__dirname, 'reports');
  const videosDir = path.join(__dirname, 'videos');
  const jsonFilePath = path.join(reportsDir, 'cucumber_report.json');
  const tempJsonPath = path.join(reportsDir, 'cucumber_report_with_videos.json');
  const htmlReportPath = path.join(reportsDir, 'cucumber_report.html');

  try {
    await waitForJsonFile(jsonFilePath);

    const reportData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

    // Loop through features and scenarios
    reportData.forEach(feature => {
      feature.elements.forEach(scenario => {
        if (!scenario.name || !scenario.steps || scenario.steps.length === 0) return;

        const scenarioNameSafe = scenario.name.replace(/[^a-zA-Z0-9]/g, '_');
        const videoPath = findVideoForScenario(videosDir, scenarioNameSafe);

        if (videoPath) {
          embedVideoAsBase64(scenario, videoPath);
        }
      });
    });

    // Save updated JSON
    fs.writeFileSync(tempJsonPath, JSON.stringify(reportData, null, 2));

    // Generate HTML report
    reporter.generate({
      theme: 'bootstrap',
      jsonFile: tempJsonPath,
      output: htmlReportPath,
      reportSuiteAsScenarios: true,
      launchReport: false,
      metadata: {
        "Test Environment": "STAGING",
        "Browser": "Chromium",
        "Platform": process.platform,
        "Executed": "Automated",
      },
      brandTitle: 'Cucumber Playwright Tests',
    });

    console.log(`✅ HTML report generated with playable scenario videos: ${htmlReportPath}`);
  } catch (err) {
    console.error('❌ Failed to generate HTML report:', err);
  }
})();
