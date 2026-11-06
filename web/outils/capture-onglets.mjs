// Capture chaque onglet d'une page (ordinateur et téléphone), en visant l'onglet par son ancre (#id).
// Usage : node outils/capture-onglets.mjs <dossier> <chemin> <id-onglet> [<id-onglet> ...]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const [dossier, chemin, ...ids] = process.argv.slice(2);
if (!dossier || !chemin || ids.length === 0) {
  console.error("Usage : node outils/capture-onglets.mjs <dossier> <chemin> <id> [<id> ...]");
  process.exit(1);
}
const base = process.env.SITE_URL ?? "http://localhost:3100";
mkdirSync(dossier, { recursive: true });
const ecrans = [
  { nom: "ordinateur", largeur: 1440, hauteur: 900 },
  { nom: "telephone", largeur: 390, hauteur: 844 },
];
const navigateur = await chromium.launch();
for (const ecran of ecrans) {
  const contexte = await navigateur.newContext({ viewport: { width: ecran.largeur, height: ecran.hauteur } });
  for (const id of ids) {
    const page = await contexte.newPage();
    const problemes = [];
    page.on("console", (m) => m.type() === "error" && problemes.push(m.text()));
    page.on("pageerror", (e) => problemes.push(e.message));
    await page.goto(`${base}${chemin}#${id}`, { waitUntil: "load" });
    await page.waitForTimeout(2000);
    const fichier = path.join(dossier, `${chemin.replace(/\//g, "") || "accueil"}-${id}-${ecran.nom}.png`);
    await page.screenshot({ path: fichier, fullPage: true });
    console.log(problemes.length ? `✗ ${ecran.nom} ${id} : ${problemes.join(" | ")}` : `✓ ${ecran.nom} ${id}`);
    await page.close();
  }
  await contexte.close();
}
await navigateur.close();
