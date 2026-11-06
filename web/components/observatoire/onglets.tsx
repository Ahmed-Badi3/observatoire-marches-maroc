"use client";

import { useId, useRef, useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

export type Onglet = { id: string; libelle: string; contenu: React.ReactNode };

// L'adresse peut viser un onglet (ex. /opcvm-actions#volatilite) : on lit la partie après le « # ».
// useSyncExternalStore = « se brancher sur quelque chose qui vit hors de React » (ici l'adresse du navigateur).
function abonner(rappel: () => void) {
  window.addEventListener("hashchange", rappel);
  return () => window.removeEventListener("hashchange", rappel);
}
const lireAncre = () => window.location.hash.slice(1);
const ancreServeur = () => "";

// Onglets soulignés de 2 px couleur accent (DESIGN.md). Au clavier : flèches gauche / droite,
// Début et Fin pour passer d'un onglet à l'autre, comme dans les applications de bureau.
// Seul le contenu de l'onglet actif est affiché.
export function Onglets({
  onglets,
  ongletInitial,
}: {
  onglets: Onglet[];
  ongletInitial?: string;
}) {
  const base = useId();
  const ancre = useSyncExternalStore(abonner, lireAncre, ancreServeur);
  const [choisi, setChoisi] = useState<string | null>(null);
  const boutons = useRef<Record<string, HTMLButtonElement | null>>({});

  const existe = (id: string | null | undefined) => !!id && onglets.some((o) => o.id === id);
  // Priorité : le dernier clic, puis l'ancre de l'adresse, puis l'onglet demandé, puis le premier.
  const actif = existe(choisi) ? choisi! : existe(ancre) ? ancre : existe(ongletInitial) ? ongletInitial! : onglets[0].id;

  function surTouche(e: React.KeyboardEvent, index: number) {
    const dernier = onglets.length - 1;
    let cible: number | null = null;
    if (e.key === "ArrowRight") cible = index === dernier ? 0 : index + 1;
    if (e.key === "ArrowLeft") cible = index === 0 ? dernier : index - 1;
    if (e.key === "Home") cible = 0;
    if (e.key === "End") cible = dernier;
    if (cible === null) return;
    e.preventDefault();
    const id = onglets[cible].id;
    setChoisi(id);
    boutons.current[id]?.focus();
  }

  const courant = onglets.find((o) => o.id === actif) ?? onglets[0];

  return (
    <div>
      <div
        role="tablist"
        aria-label="Résultats"
        className="flex gap-6 overflow-x-auto border-b border-separateur"
      >
        {onglets.map((o, i) => {
          const selectionne = o.id === courant.id;
          return (
            <button
              key={o.id}
              ref={(el) => {
                boutons.current[o.id] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-onglet-${o.id}`}
              aria-selected={selectionne}
              aria-controls={`${base}-panneau-${o.id}`}
              tabIndex={selectionne ? 0 : -1}
              onClick={() => setChoisi(o.id)}
              onKeyDown={(e) => surTouche(e, i)}
              className={cn(
                "-mb-px shrink-0 whitespace-nowrap border-b-2 px-1 py-3 text-sm transition-colors duration-150",
                selectionne
                  ? "border-accent-principal font-semibold text-accent-fonce"
                  : "border-transparent text-texte-secondaire hover:text-texte",
              )}
            >
              {o.libelle}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${base}-panneau-${courant.id}`}
        aria-labelledby={`${base}-onglet-${courant.id}`}
        className="pt-6"
      >
        {courant.contenu}
      </div>
    </div>
  );
}
