import type { LucideIcon } from "lucide-react";

import { ChiffreAnime } from "./chiffre-anime";
import { Variation, tonDe } from "./variation";

// Bandeau de 4 KPI en haut d'une page de module (Priorité 8, lot C, style de la vidéo d'Ahmed).
// Image : le tableau de bord d'une voiture, qu'on lit en un coup d'œil avant de regarder la route.
// Chaque KPI : icône ronde, grand chiffre, légende courte, pastille. La pastille montre un DEUXIÈME
// chiffre lu en base (ex. « 2025 : +10,6 Md ») : le site ne calcule aucun écart.
// Textes déjà formatés (lib/format.ts). La couleur de la pastille suit le signe de `valeurPastille`
// (vert si positif, rouge si négatif, jaune si neutre ou absent) ; le signe reste écrit dans le texte.

export type Kpi = {
  icone: LucideIcon;
  valeur: string;
  libelle: string;
  pastille?: string | null;
  valeurPastille?: number | string | null; // pour la couleur seulement ; absent = neutre
};

export function BandeauKpi({ kpis, titre }: { kpis: Kpi[]; titre: string }) {
  return (
    <section aria-label={titre} className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {kpis.map(({ icone: Icone, valeur, libelle, pastille, valeurPastille }) => (
        <div
          key={libelle}
          className="flex flex-col gap-2 rounded-carte bg-carte p-4 shadow-carte animate-in fade-in slide-in-from-bottom-2 duration-500 sm:p-5"
        >
          <span
            className="flex size-9 items-center justify-center rounded-full text-white"
            style={{ background: "var(--menu-fond)" }}
            aria-hidden="true"
          >
            <Icone className="size-[18px]" />
          </span>
          <p className="text-2xl font-semibold leading-tight text-texte tabular-nums sm:text-[28px]">
            <ChiffreAnime texte={valeur} />
          </p>
          <p className="flex-1 text-xs leading-snug text-texte-secondaire">{libelle}</p>
          {pastille && (
            <div>
              <Variation texte={pastille} ton={tonDe(valeurPastille)} />
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
