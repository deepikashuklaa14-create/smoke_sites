
module.exports = {
  default: {
    require: ['hooks/hooks.js', 'features/step_definitions/**/*.js'],
    format: ['json:reports/cucumber_report.json', 'progress'],
    paths: ['features/**/*.feature'],
    publishQuiet: true,
  },
};