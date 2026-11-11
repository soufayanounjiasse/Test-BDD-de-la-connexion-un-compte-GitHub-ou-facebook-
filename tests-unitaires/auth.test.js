import { describe, expect, test } from 'vitest';
import {
  COMPTES, DELAI_DE_BASE, FACTEUR, SEUIL_VERROUILLAGE, delaiVerrouillage, verifier,
} from '../faux-github/auth.js';
import { genererPairwise, notationJenny } from './outils/pairwise.js';
import { distanceUlp } from './outils/ulp.js';

const BON_IDENTIFIANT = 'etudiant-test';
const BON_MOT_DE_PASSE = 'MotDePasse!42';

/** Délai exact 30 × (3/2)^k calculé avec des entiers (BigInt) : l'oracle ne partage rien avec le code testé. */
function delaiExact(echecs) {
  const k = BigInt(echecs - 3);
  return Number(30n * 3n ** k) / Number(2n ** k);        // numérateur et dénominateur exacts : une seule division arrondie
}

describe('constantes du faux site', () => {
  test('compte de démonstration et réglages', () => {
    expect([...COMPTES]).toEqual([[BON_IDENTIFIANT, BON_MOT_DE_PASSE]]);
    expect(SEUIL_VERROUILLAGE).toBe(3);
    expect(DELAI_DE_BASE).toBe(30);
    expect(FACTEUR).toBe(1.5);
  });
});

// ------------------------------------------------------------------ délai de verrouillage : ulps
describe('delaiVerrouillage (comparaisons en ulps)', () => {
  test.each([[0], [1], [2], [-5]])('aucun délai sous le seuil (%s échec)', (echecs) => {
    expect(delaiVerrouillage(echecs)).toBe(0);
  });

  test.each([
    [3, 30],
    [4, 45],
    [5, 67.5],
    [6, 101.25],
  ])('après %s échecs : %s secondes', (echecs, attendu) => {
    expect(delaiVerrouillage(echecs)).toBe(attendu);
  });

  test('de 3 à 40 échecs, le résultat est à 1 ulp au plus de la valeur exacte', () => {
    for (let echecs = 3; echecs <= 40; echecs++) {
      expect(distanceUlp(delaiVerrouillage(echecs), delaiExact(echecs)), `${echecs} échecs`).toBeLessThanOrEqual(1);
    }
  });

  test('propriété : chaque échec multiplie le délai par 1,5, à 2 ulps près', () => {
    for (let echecs = 3; echecs <= 40; echecs++) {
      const rapport = delaiVerrouillage(echecs + 1) / delaiVerrouillage(echecs);
      expect(distanceUlp(rapport, 1.5), `${echecs} échecs`).toBeLessThanOrEqual(2);
    }
  });

  test('propriété : strictement croissant à partir du seuil', () => {
    for (let echecs = 3; echecs < 40; echecs++) {
      expect(delaiVerrouillage(echecs + 1)).toBeGreaterThan(delaiVerrouillage(echecs));
    }
  });
});

// ------------------------------------------------------------------ tentative de connexion : pairwise
const IDENTIFIANTS = [['valide', BON_IDENTIFIANT], ['inconnu', 'inconnu'], ['vide', ''], ['absent', undefined], ['clé du prototype', '__proto__']];
const MOTS_DE_PASSE = [['correct', BON_MOT_DE_PASSE], ['incorrect', 'mauvais'], ['vide', ''], ['casse changée', 'motdepasse!42'], ['absent', undefined]];
const ECHECS = [['aucun', 0], ['deux', 2], ['seuil', 3], ['beaucoup', 7]];
const DIMENSIONS = [IDENTIFIANTS, MOTS_DE_PASSE, ECHECS];

/** L'oracle : la spécification, écrite indépendamment du code. */
function attendu(identifiant, motDePasse, echecs) {
  if (echecs >= 3) {
    return { statut: 'verrouille', message: `Too many failed attempts. Try again in ${Math.ceil(delaiExact(echecs))} seconds.` };
  }
  if (identifiant === BON_IDENTIFIANT && motDePasse === BON_MOT_DE_PASSE) {
    return { statut: 'ok', utilisateur: BON_IDENTIFIANT };
  }
  return { statut: 'refuse', message: 'Incorrect username or password.' };
}

describe('verifier : combinaisons pairwise', () => {
  const cas = genererPairwise(DIMENSIONS.map((d) => d.length)).map((c) => [notationJenny(c), c]);

  test('le pairwise réduit bien les 100 combinaisons', () => {
    expect(cas.length).toBeLessThan(40);
  });

  test.each(cas)('combinaison %s', (_, combinaison) => {
    const [identifiant, motDePasse, echecs] = combinaison.map((v, i) => DIMENSIONS[i][v][1]);
    expect(verifier({ identifiant, motDePasse, echecs })).toMatchObject(attendu(identifiant, motDePasse, echecs));
  });
});

describe('verifier : cas particuliers', () => {
  test('connexion réussie : pas de message, pas de délai', () => {
    expect(verifier({ identifiant: BON_IDENTIFIANT, motDePasse: BON_MOT_DE_PASSE })).toEqual({
      statut: 'ok', utilisateur: BON_IDENTIFIANT,
    });
  });

  test('le nombre d’échecs vaut 0 par défaut', () => {
    expect(verifier({ identifiant: BON_IDENTIFIANT, motDePasse: BON_MOT_DE_PASSE }).statut).toBe('ok');
  });

  test('les bons identifiants ne passent plus quand le compte est verrouillé', () => {
    const r = verifier({ identifiant: BON_IDENTIFIANT, motDePasse: BON_MOT_DE_PASSE, echecs: 3 });
    expect(r).toEqual({ statut: 'verrouille', delai: 30, message: 'Too many failed attempts. Try again in 30 seconds.' });
  });

  test('le délai annoncé est arrondi à la seconde supérieure', () => {
    expect(verifier({ identifiant: 'x', motDePasse: 'y', echecs: 5 }).message)
      .toBe('Too many failed attempts. Try again in 68 seconds.');   // 67,5 -> 68
  });

  test('juste sous le seuil, la tentative est encore évaluée', () => {
    expect(verifier({ identifiant: BON_IDENTIFIANT, motDePasse: 'mauvais', echecs: 2 })).toEqual({
      statut: 'refuse', message: 'Incorrect username or password.',
    });
  });

  test('un identifiant inconnu sans mot de passe n’est pas accepté', () => {
    expect(verifier({ identifiant: 'inconnu' }).statut).toBe('refuse');
    expect(verifier({}).statut).toBe('refuse');
  });
});
