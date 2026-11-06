"use client";

import { useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type Onglet = { id: string; libelle: string; contenu: React.ReactNode };

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
  const [actif, setActif] = useState(
    onglets.some((o) => o.id === ongletInitial) ? ongletInitial! : onglets[0].id,
  );
  const boutons = useRef<Record<string, HTMLButtonElement | null>>({});

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
    setActif(id);
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
              onClick={() => setActif(o.id)}
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
