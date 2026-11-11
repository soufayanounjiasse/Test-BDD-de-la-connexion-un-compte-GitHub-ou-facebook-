// Règles d'authentification du FAUX site (module pur, sans DOM : testé unitairement).
// Chargé par la page de connexion (<script type="module">) et par les tests Vitest.

export const COMPTES = new Map([['etudiant-test', 'MotDePasse!42']]);   // compte de démonstration (faux)
export const SEUIL_VERROUILLAGE = 3;       // nombre d'échecs à partir duquel les tentatives sont refusées
export const DELAI_DE_BASE = 30;           // secondes d'attente au seuil
export const FACTEUR = 1.5;                // le délai est multiplié par 1,5 à chaque nouvel échec

/** Délai d'attente (en secondes) annoncé après `echecs` échecs ; 0 tant que le seuil n'est pas atteint. */
export function delaiVerrouillage(echecs) {
  if (echecs < SEUIL_VERROUILLAGE) return 0;
  return DELAI_DE_BASE * FACTEUR ** (echecs - SEUIL_VERROUILLAGE);
}

/**
 * Vérifie une tentative de connexion.
 * - trop d'échecs précédents : "verrouille" (même avec les bons identifiants) ;
 * - identifiants valides : "ok" ;
 * - sinon : "refuse".
 */
export function verifier({ identifiant, motDePasse, echecs = 0 }) {
  if (echecs >= SEUIL_VERROUILLAGE) {
    const delai = delaiVerrouillage(echecs);
    return {
      statut: 'verrouille',
      delai,
      message: `Too many failed attempts. Try again in ${Math.ceil(delai)} seconds.`,
    };
  }
  const attendu = COMPTES.get(identifiant);
  if (attendu !== undefined && attendu === motDePasse) {
    return { statut: 'ok', utilisateur: identifiant };
  }
  return { statut: 'refuse', message: 'Incorrect username or password.' };
}
