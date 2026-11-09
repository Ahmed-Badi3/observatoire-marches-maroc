"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ExternalLink, Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { AUTEUR, MENTION_LEGALE, PAGES, URL_GITHUB, pageCourante } from "@/lib/pages";

// Un lien externe de la colonne de gauche : texte + petite flèche, ouvert dans un nouvel onglet.
// Dans la colonne bleue, le lien est blanc.
function LienExterne({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-semibold text-white hover:underline"
    >
      {children} <ExternalLink className="size-3" aria-hidden="true" />
    </a>
  );
}

// La « coque » du site : barre latérale, barre du haut, contenu, pied de page.
// Image : le cadre d'un tableau. Les pages ne changent que la peinture à l'intérieur.
export function AppShell({
  children,
  dateAmmc,
}: {
  children: React.ReactNode;
  dateAmmc: string | null;
}) {
  const chemin = usePathname();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const page = pageCourante(chemin);

  // Sur téléphone, le menu se ferme au clic sur un lien ou sur Échap.
  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => e.key === "Escape" && setMenuOuvert(false);
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, []);

  return (
    <div className="flex min-h-screen bg-page">
      {/* Voile sombre derrière le menu ouvert (téléphone seulement) */}
      {menuOuvert && (
        <div
          className="fixed inset-0 z-30 bg-texte/40 lg:hidden"
          onClick={() => setMenuOuvert(false)}
          aria-hidden="true"
        />
      )}

      <aside
        id="menu-lateral"
        className={cn(
          // overflow-y-auto : sur un écran bas, la colonne défile au lieu de couper le bloc auteur.
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col overflow-y-auto text-white shadow-carte transition-transform duration-200",
          "lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 lg:shadow-none",
          menuOuvert ? "translate-x-0" : "max-lg:invisible max-lg:-translate-x-full",
        )}
        style={{ background: "var(--menu-fond)" }}
      >
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <p className="text-xl font-semibold">Observatoire</p>
            <p className="text-xs text-white/90">Marchés financiers marocains</p>
          </div>
          <button
            type="button"
            className="rounded-lg p-1 text-white hover:bg-white/15 lg:hidden"
            onClick={() => setMenuOuvert(false)}
            aria-label="Fermer le menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav aria-label="Pages du site" className="flex-1 space-y-1 overflow-y-auto px-3">
          {PAGES.map(({ href, titre, icone: Icone }) => {
            const active = href === chemin;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => setMenuOuvert(false)}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150",
                  active
                    ? "bg-white/20 font-semibold text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white",
                )}
              >
                {active && (
                  <span className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-white" />
                )}
                <Icone className="size-[18px] shrink-0" />
                {titre}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-white/20 p-6 text-xs text-white/90">
          <p>
            Données AMMC jusqu&apos;au {formatDate(dateAmmc)}
          </p>
          <LienExterne href={URL_GITHUB}>Code sur GitHub</LienExterne>

          {/* L'auteur : un recruteur doit pouvoir me joindre en un clic. */}
          <div className="mt-4 space-y-1.5 border-t border-white/20 pt-4">
            <p className="text-sm font-semibold text-white">{AUTEUR.nom}</p>
            <p className="leading-snug">{AUTEUR.titre}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
              <LienExterne href={AUTEUR.linkedin}>LinkedIn</LienExterne>
              <LienExterne href={AUTEUR.rapport}>Rapport complet</LienExterne>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-separateur bg-carte px-4 py-4 sm:px-8">
          <button
            type="button"
            className="rounded-lg p-2 text-texte hover:bg-page lg:hidden"
            onClick={() => setMenuOuvert(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={menuOuvert}
            aria-controls="menu-lateral"
          >
            <Menu className="size-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-xs text-texte-secondaire">
              Observatoire
              {page?.href !== "/" && <> / {page?.titre ?? "Hors menu"}</>}
            </p>
            <h1 className="truncate text-2xl font-semibold text-texte">{page?.titre ?? "Page hors menu"}</h1>
            {/* Sur téléphone la barre latérale est repliée : la date de mise à jour reste visible ici. */}
            <p className="text-xs text-texte-secondaire lg:hidden">
              Données AMMC jusqu&apos;au {formatDate(dateAmmc)}
            </p>
          </div>
        </header>

        <main className="flex-1 bg-zone p-4 sm:p-8">{children}</main>

        <footer className="border-t border-separateur bg-carte px-4 py-4 text-xs text-texte-secondaire sm:px-8">
          {MENTION_LEGALE}
        </footer>
      </div>
    </div>
  );
}
