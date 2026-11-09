"use client";

import { useRef } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

// Carte qui s'ouvre en panneau détaillé animé au clic (Priorité 8, lot B, « comme la carte jaune de la vidéo »).
// Image : une fiche cartonnée qu'on retourne pour lire le verso.
// Le contenu (aperçu et panneau) est préparé côté serveur par CarteConstat ; ce composant ne fait
// qu'ouvrir et fermer. La fenêtre native <dialog> garde le clavier à l'intérieur et se ferme avec Échap.

export function CarteOuvrable({
  fond,
  clair,
  titre,
  apercu,
  panneau,
}: {
  fond: string; // couleur de fond de la carte (variable CSS)
  clair: boolean; // texte blanc (fond foncé) ou foncé
  titre: string; // nom du panneau pour les lecteurs d'écran
  apercu: React.ReactNode;
  panneau: React.ReactNode;
}) {
  const fenetre = useRef<HTMLDialogElement>(null);
  const ouvrir = () => fenetre.current?.showModal();
  const fermer = () => fenetre.current?.close();
  const couleurTexte = clair ? "text-white" : "text-texte";

  return (
    <>
      <article
        onClick={ouvrir}
        className={cn(
          "flex cursor-pointer flex-col gap-4 rounded-carte p-6 shadow-carte transition-transform duration-200 hover:-translate-y-0.5",
          "animate-in fade-in slide-in-from-bottom-2 duration-500",
          couleurTexte,
        )}
        style={{ background: fond }}
      >
        {apercu}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            ouvrir();
          }}
          className="w-fit text-xs font-semibold underline-offset-4 hover:underline"
        >
          Voir l&apos;explication ▸
        </button>
      </article>

      <dialog
        ref={fenetre}
        aria-label={titre}
        onClick={(e) => e.target === fenetre.current && fermer()} // clic sur le voile : fermer
        className={cn(
          "m-auto w-[min(42rem,calc(100%-2rem))] max-h-[90vh] rounded-[20px] p-0 shadow-carte backdrop:bg-texte/50",
          "open:animate-in open:fade-in open:zoom-in-95 open:duration-300",
          couleurTexte,
        )}
        style={{ background: fond }}
      >
        <div className="relative flex flex-col gap-5 p-6 sm:p-8">
          <button
            type="button"
            onClick={fermer}
            aria-label="Fermer l'explication"
            className="absolute top-4 right-4 rounded-lg p-1 hover:bg-white/20"
          >
            <X className="size-5" />
          </button>
          {panneau}
        </div>
      </dialog>
    </>
  );
}
