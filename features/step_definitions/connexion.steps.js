const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

const echapper = (texte) => texte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ------------------------------------------------------------------ contexte
Given('je suis sur la page de connexion de GitHub', async function () {
  await this.page.goto(this.urlConnexion);
  await expect(this.page.locator('#login_field')).toBeVisible();
});

// ------------------------------------------------------------------ actions
When("je saisis l'identifiant {string} et le mot de passe {string}", async function (identifiant, motDePasse) {
  await this.page.locator('#login_field').fill(identifiant);
  await this.page.locator('#password').fill(motDePasse);
});

When("je me trompe {int} fois de mot de passe pour l'identifiant {string}", async function (fois, identifiant) {
  for (let i = 0; i < fois; i++) {
    await this.page.locator('#login_field').fill(identifiant);
    await this.page.locator('#password').fill('mauvais-mot-de-passe');
    await this.page.getByRole('button', { name: 'Sign in' }).click();
    // on attend que le faux site ait compté l'échec avant de recommencer
    await this.page.waitForFunction(
      (attendu) => sessionStorage.getItem('faux-github-echecs') === String(attendu), i + 1
    );
  }
});

When('je saisis mes identifiants GitHub personnels', async function () {
  // Lus dans les variables d'environnement : jamais écrits dans le code ni dans le dépôt.
  await this.page.locator('#login_field').fill(process.env.GITHUB_USERNAME);
  await this.page.locator('#password').fill(process.env.GITHUB_PASSWORD);
});

When('je clique sur le bouton {string}', async function (nom) {
  await this.page.getByRole('button', { name: nom }).click();
});

When('je me rends directement sur le tableau de bord', async function () {
  await this.page.goto(`${this.baseUrl}/dashboard`);
});

// ------------------------------------------------------------------ vérifications
Then('je suis connecté en tant que {string}', async function (utilisateur) {
  await expect(this.page.locator('meta[name="user-login"]')).toHaveAttribute('content', utilisateur);
});

Then('je suis connecté avec mon compte personnel', async function () {
  await this.page.waitForLoadState('domcontentloaded');
  if (/two-factor|verified-device|sessions\/trusted|captcha/i.test(this.page.url())) {
    throw new Error(
      'GitHub demande une vérification supplémentaire (A2F, nouvel appareil ou captcha) : '
      + 'ce parcours ne peut pas être automatisé avec ce compte. Utilisez un compte de test sans A2F.'
    );
  }
  const attendu = new RegExp(`^${echapper(process.env.GITHUB_USERNAME)}$`, 'i');
  await expect(this.page.locator('meta[name="user-login"]')).toHaveAttribute('content', attendu);
});

Then("le message d'erreur {string} est affiché", async function (message) {
  await expect(this.page.locator('.flash-error')).toContainText(message);
});

Then('je ne suis pas connecté', async function () {
  await expect(this.page.locator('meta[name="user-login"]')).toHaveAttribute('content', '');
  await expect(this.page.locator('#login_field')).toBeVisible();
});

Then('le champ du mot de passe est masqué', async function () {
  await expect(this.page.locator('#password')).toHaveAttribute('type', 'password');
});

Then('je suis redirigé vers la page de connexion', async function () {
  await expect(this.page).toHaveURL(/\/login$/);
  await expect(this.page.locator('#login_field')).toBeVisible();
});
