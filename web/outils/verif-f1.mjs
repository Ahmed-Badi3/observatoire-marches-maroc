// Vérifications de la tâche F1 : clavier (onglets, tri) et absence de défilement horizontal sur téléphone.
import { chromium } from "playwright";
const base = process.env.SITE_URL ?? "http://localhost:3100";
const pages = ["/", "/opcvm-actions", "/contexte-economique", "/taux-obligations", "/introductions-en-bourse", "/synthese", "/methode"];
const nav = await chromium.launch();
let echecs = 0;
const ok = (c, m) => { console.log(`${c ? "✓" : "✗"} ${m}`); if (!c) echecs++; };

// 1. Pas de défilement horizontal de la page sur téléphone
const tel = await nav.newContext({ viewport: { width: 390, height: 844 } });
for (const p of pages) {
  const page = await tel.newPage();
  await page.goto(base + p, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  ok(sw <= iw, `téléphone ${p} : pas de débordement horizontal (${sw} / ${iw})`);
  await page.close();
}

// 2. Clavier : flèche droite change d'onglet ; Entrée sur un en-tête trie le tableau
const pc = await nav.newContext({ viewport: { width: 1440, height: 900 } });
const page = await pc.newPage();
await page.goto(base + "/introductions-en-bourse", { waitUntil: "load" });
await page.waitForTimeout(1200);
await page.getByRole("tab", { name: "Performance face au MASI" }).focus();
await page.keyboard.press("ArrowRight");
ok((await page.getByRole("tab", { name: "Premier jour" }).getAttribute("aria-selected")) === "true", "clavier : flèche droite passe à l'onglet suivant");
await page.keyboard.press("End");
ok((await page.getByRole("tab", { name: "Achat après un mois" }).getAttribute("aria-selected")) === "true", "clavier : Fin va au dernier onglet");
const entete = page.getByRole("button", { name: /Société/ });
await entete.focus();
await page.keyboard.press("Enter");
ok((await page.locator("th[aria-sort='descending'], th[aria-sort='ascending']").count()) === 1, "clavier : Entrée sur un en-tête trie le tableau");

// 3. Filtre de période et sélecteur au clavier
await page.goto(base + "/opcvm-actions#indices", { waitUntil: "load" });
await page.waitForTimeout(1200);
const unAn = page.getByRole("button", { name: "1 an" });
await unAn.focus();
await page.keyboard.press("Enter");
ok((await unAn.getAttribute("aria-pressed")) === "true", "clavier : le filtre 1 an s'active");
await nav.close();
process.exit(echecs ? 1 : 0);
