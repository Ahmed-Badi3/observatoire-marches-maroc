// Format français des chiffres du site (règle de CLAUDE.md) :
//   16 537,91   +42,3 %   −19,0 %   0,66   +68 pb   +17,3 pts   18,0x
//
// Trois détails typographiques :
// - le signe moins est le vrai « − » (U+2212), pas le tiret « - » ;
// - l'espace des milliers et celle avant %, pts, pb ou Md sont des espaces insécables (U+00A0) :
//   un chiffre n'est jamais coupé par un retour à la ligne. (Intl met une espace fine U+202F
//   pour les milliers, mais la police du site la rend presque invisible : on la remplace.)
//
// Les colonnes `_pct` de la base sont DÉJÀ en pourcentage : 42.26 devient « +42,3 % ».
// Une valeur manquante (null, vide, non numérique) s'affiche « — » au lieu de planter.

export type Valeur = number | string | null | undefined;

const MOINS = "−";
const ESPACE = " ";
export const MANQUANT = "—";

// postgres.js renvoie les colonnes `numeric` sous forme de texte : on convertit ici.
function enNombre(v: Valeur): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

type Options = { decimales?: number; signe?: boolean };

// Cœur commun : « 1 234,5 » avec son signe éventuel. Un résultat qui s'arrondit à zéro
// n'a pas de signe (jamais « −0,0 » ni « +0,0 »).
function formaterNombre(v: Valeur, { decimales = 1, signe = false }: Options = {}): string | null {
  const n = enNombre(v);
  if (n === null) return null;
  const texte = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })
    .format(Math.abs(n))
    .replace(/ /g, ESPACE);
  const estZero = !/[1-9]/.test(texte);
  if (estZero) return texte;
  if (n < 0) return MOINS + texte;
  return signe ? "+" + texte : texte;
}

function avecUnite(v: Valeur, unite: string, options: Options): string {
  const texte = formaterNombre(v, options);
  return texte === null ? MANQUANT : texte + ESPACE + unite;
}

// Nombre simple : 16 537,91 (2 décimales par défaut, comme les cours).
// Avec { signe: true } : corrélations « +0,43 ». Sharpe : « 0,66 ».
export function formatNombre(v: Valeur, { decimales = 2, signe = false }: Options = {}): string {
  return formaterNombre(v, { decimales, signe }) ?? MANQUANT;
}

// Pourcentage : +42,3 %  /  −19,0 %. Le signe + est affiché par défaut (variations, rendements).
export function formatPourcentage(v: Valeur, { decimales = 1, signe = true }: Options = {}): string {
  return avecUnite(v, "%", { decimales, signe });
}

// Écart entre deux pourcentages : +17,3 pts
export function formatPoints(v: Valeur, { decimales = 1, signe = true }: Options = {}): string {
  return avecUnite(v, "pts", { decimales, signe });
}

// Points de base (taux) : +68 pb. La valeur est déjà en pb dans la base (ex. var_taux_10a_pb).
export function formatPointsDeBase(v: Valeur, { decimales = 0, signe = true }: Options = {}): string {
  return avecUnite(v, "pb", { decimales, signe });
}

// Multiple (PER) : 18,0x. Sans espace avant le « x », c'est l'usage.
export function formatMultiple(v: Valeur, { decimales = 1 }: Pick<Options, "decimales"> = {}): string {
  const texte = formaterNombre(v, { decimales });
  return texte === null ? MANQUANT : texte + "x";
}

// Milliards de dirhams : +10,6 Md. La valeur est déjà en milliards (colonnes `_md`).
export function formatMilliards(v: Valeur, { decimales = 1, signe = true }: Options = {}): string {
  return avecUnite(v, "Md", { decimales, signe });
}

// Montant en dirhams : 16 537,91 MAD
export function formatMontant(v: Valeur, { decimales = 2, signe = false }: Options = {}): string {
  return avecUnite(v, "MAD", { decimales, signe });
}

// Dates. On lit « AAAA-MM-JJ » à la main et on formate en UTC : aucun décalage de fuseau
// ne peut transformer le 23 en 22.
function enDate(v: Valeur): Date | null {
  if (typeof v !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (!m) return null;
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(date.getTime()) ? null : date;
}

// « 23 octobre 2026 »
export function formatDate(v: Valeur): string {
  const date = enDate(v);
  if (!date) return MANQUANT;
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

// « 23/10/2026 »
export function formatDateCourte(v: Valeur): string {
  const date = enDate(v);
  if (!date) return MANQUANT;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}
