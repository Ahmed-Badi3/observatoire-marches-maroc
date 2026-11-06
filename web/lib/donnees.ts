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
