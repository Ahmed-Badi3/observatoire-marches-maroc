// Mots d'interprétation affichés sous un chiffre (Priorités 5 et 6 de docs/CORRECTIONS.md).
// Ce sont des RÈGLES D'AFFICHAGE, comme la couleur verte ou rouge d'un chiffre : elles traduisent
// une valeur déjà calculée par la base en mots simples. Aucun calcul financier ici.
//
// Barème des corrélations (choisi par Ahmed) : on lit la valeur arrondie à 2 décimales, comme elle
// est affichée, pour que le mot corresponde toujours au chiffre vu (0,199 s'affiche 0,20 : « lien faible »).
//   moins de 0,2 → aucun lien · 0,2 à 0,4 → lien faible · 0,4 à 0,7 → lien net · 0,7 et plus → lien fort
// Si la corrélation est négative (et au moins faible), on ajoute « sens inverse ».

export function interpreterCorrelation(v: number | string | null | undefined): string | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  const arrondi = Math.round(Math.abs(n) * 100) / 100;
  if (arrondi < 0.2) return "aucun lien";
  const force = arrondi < 0.4 ? "lien faible" : arrondi < 0.7 ? "lien net" : "lien fort";
  return n < 0 ? `${force}, sens inverse` : force;
}
