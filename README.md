# Test BDD de la connexion à un compte GitHub (Cucumber + Playwright)

Devoir INF563 : tester la **connexion à un compte GitHub** avec la technique **BDD** (scénarios Gherkin en
français exécutés par **Cucumber.js**, navigateur piloté par **Playwright**), le tout en **JavaScript**.
Les tests se déclenchent à chaque `git push` grâce à **GitHub Actions**.

Ce projet est **indépendant** de l'application To-do (projet `todo-bdd`) : dépôt, dépendances et pipeline séparés.

## Contenu

```
features/connexion_github.feature     les scénarios (Gherkin en français)
features/step_definitions/            le code Playwright derrière chaque phrase
features/support/hooks.js             démarrage du serveur et du navigateur, capture d'écran en cas d'échec
faux-github/                          faux site de connexion "à la GitHub" (login, dashboard, auth.js = règles)
tests-unitaires/                      tests unitaires Vitest (auth) et outils (pairwise, ulp)
vitest.config.mjs, stryker.config.json   couverture et test de mutation
server.js                             petit serveur local qui sert le faux site
cucumber.cjs                          configuration (rapports HTML et JUnit)
.github/workflows/ci.yml              pipeline : tests à chaque push
```

## Installation et lancement

Prérequis : **Node.js 20 ou plus** (`node -v`).

```
npm install
npx playwright install chromium     # télécharge le navigateur de test (une seule fois)
npm test                            # tests unitaires + couverture, puis les 13 scénarios BDD (faux site)
```

Options utiles (PowerShell) :

```
$env:HEADED = "1"; npm test                         # voir le navigateur
$env:HEADED = "1"; $env:SLOWMO = "400"; npm test    # ... en ralenti
```

Le rapport est dans **`reports/cucumber.html`** (avec une capture d'écran pour chaque scénario en échec)
et `reports/junit.xml`.

## Les scénarios

| Scénario | Ce qu'il vérifie |
|---|---|
| Mot de passe masqué | le champ du mot de passe est de type `password` |
| Connexion réussie | identifiants valides : l'utilisateur est connecté |
| Mauvais mot de passe | message « Incorrect username or password. » et pas de connexion |
| Plan du scénario (4 exemples) | mot de passe de mauvaise casse, identifiant inconnu, deux champs faux, deux champs vides |
| Page protégée | le tableau de bord sans connexion renvoie vers la page de connexion |
| Déconnexion | après « Sign out », le tableau de bord n'est plus accessible |
| Verrouillage | après 3 échecs, même les bons identifiants sont refusés : « Too many failed attempts. Try again in 30 seconds. » |
| Plan du scénario (3 exemples) | le délai augmente à chaque échec : 30, 45, puis 68 secondes (67,5 arrondi) |
| `@reel` | connexion à **votre vrai compte** github.com (voir ci-dessous) |

Compte du faux site : `etudiant-test` / `MotDePasse!42` (ce ne sont pas de vrais identifiants).

## Tests unitaires, couverture, mutation, pairwise et ulp

En plus du BDD, ce projet utilise les techniques du cours (JUnit, JaCoCo, PIT, Jenny, ulp). Le projet est en
**JavaScript** : JUnit, JaCoCo et PIT sont des outils pour Java et ne s'appliquent pas à du code JavaScript.
On utilise donc leurs **équivalents JavaScript**, qui appliquent les mêmes idées :

| Technique du cours | Outil utilisé ici | Rôle |
|---|---|---|
| JUnit (tests unitaires, `@ParameterizedTest`) | **Vitest** (`test`, `test.each`, rapport JUnit XML) | tests unitaires de la logique métier |
| JaCoCo (couverture) | **Vitest + V8** (`--coverage`, seuils) | couverture des instructions, branches, fonctions, lignes ; échec sous les seuils |
| PIT (test de mutation) | **StrykerJS** | injecte des défauts dans le code et vérifie que les tests les détectent |
| Jenny (pairwise) | `tests-unitaires/outils/pairwise.js` | génère les combinaisons de tests ; lit aussi la sortie du vrai Jenny |
| ulp (tolérance en flottants) | `tests-unitaires/outils/ulp.js` | compare des nombres décimaux à N ulps près |

**Ce qui est testé unitairement** : `faux-github/auth.js`, les règles d'authentification du faux site : identifiants valides ou non, et **verrouillage temporaire** après 3 échecs avec un délai qui croît de 30 s × 1,5 à chaque échec (les pages HTML et le navigateur sont couverts par les scénarios BDD).

```
npm run test:unit        # Vitest : tests unitaires + couverture (échoue sous 90 % lignes, 80 % branches)
npm run test:bdd         # Cucumber : scénarios BDD
npm test                 # les deux, à la suite
npm run test:mutation    # StrykerJS : test de mutation (quelques minutes)
```

Rapports : `reports/couverture/index.html` (couverture), `reports/mutation/index.html` (mutation),
`reports/junit-unitaires.xml` (JUnit XML), `reports/cucumber.html` (BDD).

**Résultats mesurés** :

| Mesure | Résultat |
|---|---|
| Tests unitaires | **71** réussis |
| Couverture (`faux-github/auth.js`) | **100 %** instructions, branches, fonctions et lignes |
| Score de mutation (StrykerJS) | **100 %** (33 mutants tués sur 33 ; seuil d'échec : 80 %) |
| Scénarios BDD | **13** réussis |

**Pairwise (équivalent de Jenny)** : la tentative de connexion a 3 paramètres (identifiant : valide, inconnu, vide, absent, clé du prototype ; mot de passe : correct, incorrect, vide, casse changée, absent ; échecs précédents : 0, 2, 3, 7) : 100 combinaisons exhaustives, ramenées à **25 cas** par le pairwise.
Avec le vrai Jenny : `jenny -n2 3 3 3 > cas.txt`, puis `depuisSortieJenny(texte, 3)` (dans `pairwise.js`) lit le fichier.

**ulp** : le délai de verrouillage 30 × 1,5^k est un nombre décimal : le test le compare à la valeur exacte calculée avec des entiers (`BigInt`) et exige au plus **1 ulp** d'écart de 3 à 40 échecs ; la propriété « chaque échec multiplie le délai par 1,5 » est vérifiée à 2 ulps près.

**Mutation** : StrykerJS modifie le code (opérateur `<` changé en `<=`, constante changée, condition inversée,
etc.) et relance les tests : un mutant « tué » est un défaut détecté, un mutant « survivant » montre une
lacune des tests. Le rapport HTML liste chaque mutant. Les mutants qui survivent encore sont du code défensif
qu'aucun scénario public ne peut atteindre.

## Pourquoi un faux site par défaut ?

Un test automatique doit être **reproductible**. Le vrai github.com ne l'est pas : authentification à deux
facteurs, vérification d'appareil, captcha, blocage temporaire après des connexions répétées. Le faux site
reprend les mêmes champs (`#login_field`, `#password`, bouton « Sign in ») et les mêmes messages, donc
les mêmes étapes de test fonctionnent sur les deux.

## Tester VOTRE compte GitHub (scénario `@reel`)

Le scénario `@reel` est ignoré tant que les variables d'environnement ne sont pas définies :

```
$env:GITHUB_USERNAME = "mon-identifiant"      # l'identifiant, pas l'adresse e-mail
$env:GITHUB_PASSWORD = "mon-mot-de-passe"
npm run test:reel
```

Précautions :
- n'écrivez **jamais** vos identifiants dans le code ni dans le dépôt (le `.gitignore` exclut le fichier `.env`) ;
- préférez un compte de test ;
- si l'authentification à deux facteurs est activée, GitHub demandera un code ou une vérification de
  l'appareil : le test s'arrête alors avec un message explicatif ;
- des connexions automatisées répétées peuvent déclencher un captcha ou un blocage temporaire ;
- ce scénario n'est volontairement **pas** lancé par la CI.

**Facebook** n'est pas fourni : automatiser la connexion à Facebook va à l'encontre de ses conditions
d'utilisation et déclenche rapidement des blocages de compte.

## Intégration continue : les tests se lancent à chaque push

1. Créer un dépôt vide sur github.com (sans README), par exemple `github-login-bdd`.
2. Dans le dossier du projet :

```
git init
git add .
git commit -m "Tests BDD de connexion GitHub"
git branch -M main
git remote add origin https://github.com/VOTRE-COMPTE/github-login-bdd.git
git push -u origin main
```

3. Ouvrir l'onglet **Actions** du dépôt : le pipeline `ci` démarre (tests unitaires, couverture, BDD et mutation). Coche verte = tous les tests passent ;
   croix rouge = un test échoue (télécharger l'artefact `rapports-bdd` pour lire le rapport).
4. Chaque nouveau `git push` relance les tests.
