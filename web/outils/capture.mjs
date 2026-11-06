// Captures d'écran d'une ou plusieurs pages, sur ordinateur ET téléphone (tâches E, F1).
// Elles servent à vérifier l'affichage, et à repérer les erreurs de console.
//
// Usage (le site doit tourner, par exemple `npm run build` puis `npx next start -p 3100`) :
//   node outils/capture.mjs <dossier-de-sortie> <chemin> [<chemin> ...]
// Exemple :
//   node outils/capture.mjs ../captures /opcvm-actions /synthese
//
// Variable facultative : SITE_URL (par défaut http://localhost:3100).

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const [dossier, ...chemins] = process.argv.slice(2);
if (!dossier || chemins.length === 0) {
  console.error("Usage : node outils/capture.mjs <dossier> <chemin> [<chemin> ...]");
  process.exit(1);
}
const base = process.env.SITE_URL ?? "http://localhost:3100";
mkdirSync(dossier, { recursive: true });

const ecrans = [
  { nom: "ordinateur", largeur: 1440, hauteur: 900 },
  { nom: "telephone", largeur: 390, hauteur: 844 },
];

const navigateur = await chromium.launch();
let erreurs = 0;

for (const ecran of ecrans) {
  const contexte = await navigateur.newContext({
    viewport: { width: ecran.largeur, height: ecran.hauteur },
    deviceScaleFactor: 1,
  });
  for (const chemin of chemins) {
    const page = await contexte.newPage();
    const problemes = [];
    page.on("console", (m) => m.type() === "error" && problemes.push(`console : ${m.text()}`));
    page.on("pageerror", (e) => problemes.push(`erreur de page : ${e.message}`));

    await page.goto(base + chemin, { waitUntil: "networkidle" });
    const nom = (chemin === "/" ? "accueil" : chemin.replace(/^\//, "").replace(/\//g, "-")) + `-${ecran.nom}.png`;
    await page.screenshot({ path: path.join(dossier, nom), fullPage: true });

    // Une page qui déborde à droite est un défaut sur téléphone (défilement horizontal de la page).
    const debordement = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    if (debordement) problemes.push("la page déborde horizontalement");

    console.log(`${problemes.length ? "✗" : "✓"} ${ecran.nom} ${chemin} -> ${nom}`);
    for (const p of problemes) console.log(`    ${p}`);
    erreurs += problemes.length;
    await page.close();
  }
  await contexte.close();
}

await navigateur.close();
process.exit(erreurs ? 2 : 0);
