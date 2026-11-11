// Configuration de Cucumber.js
// - "npm test"          : tous les scénarios SAUF @reel (faux site de connexion, reproductible, utilisable en CI)
// - "npm run test:reel" : uniquement le scénario @reel (vrai github.com ; GITHUB_USERNAME et GITHUB_PASSWORD requis)
module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: ['features/support/**/*.js', 'features/step_definitions/**/*.js'],
    tags: 'not @reel',
    format: ['pretty', 'html:reports/cucumber.html', 'junit:reports/junit.xml'],
  },
  reel: {
    paths: ['features/**/*.feature'],
    require: ['features/support/**/*.js', 'features/step_definitions/**/*.js'],
    tags: '@reel',
    format: ['pretty', 'html:reports/cucumber-reel.html'],
  },
};
