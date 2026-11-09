import { cacheLife } from "next/cache";

import { sql } from "@/lib/db";

// Requêtes de lecture du site. Aucun calcul ici : on lit ce que la base a déjà calculé.

// Date (texte AAAA-MM-JJ) de la dernière semaine AMMC en base.
// Mise en cache 24 h : la base ne change qu'une fois par semaine.
// Image : on photographie la réponse, et on ne redemande à la base qu'après 24 h.
async function lireDerniereSemaineAmmc(): Promise<string> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });

  const lignes = await sql()<{ date: string }[]>`
    SELECT to_char(max(date), 'YYYY-MM-DD') AS date
    FROM dw.fact_opcvm_hebdo
  `;
  return lignes[0].date;
}

// Une ligne par placement ou portefeuille (analytics.synthese_classes_actifs).
// Les colonnes numeric arrivent en texte : lib/format.ts sait les lire.
export type Placement = {
  actif: string;
  debut: string;
  fin: string;
  rdt_cumule_pct: string | null;
  rdt_annualise_pct: string | null;
  volatilite_pct: string | null;
  pire_baisse_pct: string | null;
  ratio_rendement_risque: string | null;
  part_rdt_masi_pct: string | null;
  part_risque_masi_pct: string | null;
};

async function lirePlacements(): Promise<Placement[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });

  const lignes = await sql()<Placement[]>`
    SELECT actif,
           to_char(debut, 'YYYY-MM-DD') AS debut,
           to_char(fin, 'YYYY-MM-DD') AS fin,
           rdt_cumule_pct, rdt_annualise_pct, volatilite_pct, pire_baisse_pct,
           ratio_rendement_risque, part_rdt_masi_pct, part_risque_masi_pct
    FROM analytics.synthese_classes_actifs
    ORDER BY actif
  `;
  // On renvoie des objets simples (pas les objets spéciaux de postgres.js) : le cache les exige.
  return lignes.map((l) => ({ ...l }));
}

export async function placements(): Promise<Placement[] | null> {
  try {
    return await lirePlacements();
  } catch (erreur) {
    console.error("Lecture des placements impossible :", erreur);
    return null;
  }
}

// Version sûre : si la base est inaccessible, le site s'affiche quand même (avec « — »).
// Une erreur n'est pas mise en cache : la fois suivante, on réessaie.
export async function derniereSemaineAmmc(): Promise<string | null> {
  try {
    return await lireDerniereSemaineAmmc();
  } catch (erreur) {
    console.error("Lecture de la dernière semaine AMMC impossible :", erreur);
    return null;
  }
}
