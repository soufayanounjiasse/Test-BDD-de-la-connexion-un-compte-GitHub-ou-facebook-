// Serveur local, sans dépendance : il sert un FAUX site de connexion "à la GitHub" (dossier faux-github/).
// Les tests s'en servent par défaut : résultats reproductibles, pas de réseau, aucun risque pour un vrai compte.
// URLs : /login, /dashboard et /auth.js (règles d'authentification, partagées avec les tests unitaires)
const http = require('http');
const fs = require('fs');
const path = require('path');

const RACINE = path.join(__dirname, 'faux-github');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

function resoudre(urlBrute) {
  let chemin = decodeURIComponent(new URL(urlBrute, 'http://localhost').pathname);
  if (chemin === '/') chemin = '/login';
  if (!path.extname(chemin)) chemin += '.html';
  const complet = path.normalize(path.join(RACINE, chemin));
  return complet.startsWith(RACINE) ? complet : null;           // interdit de sortir du dossier
}

function demarrer(port = 0) {
  const serveur = http.createServer((req, res) => {
    const fichier = resoudre(req.url);
    if (!fichier) { res.writeHead(403).end('Interdit'); return; }
    fs.readFile(fichier, (erreur, contenu) => {
      if (erreur) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Introuvable'); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(fichier)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(contenu);
    });
  });
  return new Promise((resolve, reject) => {
    serveur.once('error', reject);
    serveur.listen(port, '127.0.0.1', () => {
      resolve({
        url: `http://127.0.0.1:${serveur.address().port}`,
        arreter: () => new Promise((fin) => serveur.close(() => fin())),
      });
    });
  });
}

module.exports = { demarrer };

if (require.main === module) {
  demarrer(Number(process.env.PORT) || 3000).then(({ url }) => console.log(`Faux site GitHub : ${url}/login`));
}
