"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ExternalLink, Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { MENTION_LEGALE, PAGES, URL_GITHUB, pageCourante } from "@/lib/pages";

// La « coque » du site : barre latérale, barre du haut, contenu, pied de page.
// Image : le cadre d'un tableau. Les pages ne changent que la peinture à l'intérieur.
export function AppShell({ children }: { children: React.ReactNode }) {
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
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-carte shadow-carte transition-transform duration-200",
          "lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 lg:shadow-none lg:border-r lg:border-separateur",
          menuOuvert ? "translate-x-0" : "max-lg:invisible max-lg:-translate-x-full",
        )}
      >
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <p className="text-xl font-semibold text-accent-fonce">Observatoire</p>
            <p className="text-xs text-texte-secondaire">Marchés financiers marocains</p>
          </div>
          <button
            type="button"
            className="rounded-lg p-1 text-texte-secondaire hover:bg-page lg:hidden"
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
                    ? "bg-page font-semibold text-accent-fonce"
                    : "text-texte-secondaire hover:bg-page/60 hover:text-texte",
                )}
              >
                {active && (
                  <span className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-accent-principal" />
                )}
                <Icone className="size-[18px] shrink-0" />
                {titre}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-separateur p-6 text-xs text-texte-secondaire">
          {/* La date réelle arrive à la tâche D4 (lue dans la base) */}
          <p>Dernière mise à jour : —</p>
          <a
            href={URL_GITHUB}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-accent-fonce hover:underline"
          >
            Code sur GitHub <ExternalLink className="size-3" />
          </a>
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
              {page.href !== "/" && <> / {page.titre}</>}
            </p>
            <h1 className="truncate text-2xl font-semibold text-texte">{page.titre}</h1>
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
