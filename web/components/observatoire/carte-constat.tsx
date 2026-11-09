import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

// Carte de résultat, nouvelle version (Priorité 5 de docs/CORRECTIONS.md, style de la vidéo d'Ahmed).
// De haut en bas : le thème (icône + mot), le constat en une phrase, le ou les chiffres dans des
// mini-tuiles (ce que mesure le chiffre AU-DESSUS, un mot d'interprétation EN DESSOUS), une conclusion
// courte, puis « En savoir plus » qui replie le texte long (méthode, nuances).
// Image : l'étiquette d'un médicament. D'abord à quoi il sert, puis la dose, et la notice pliée en dessous.
//
// Tous les chiffres et mots arrivent DÉJÀ formatés (lib/format.ts, lib/interpretation.ts).
// Couleurs du thème : texte blanc seulement sur le bleu foncé ; sur sarcelle, corail et ambre, le blanc
// serait trop pâle pour les petits textes, on écrit donc en foncé (contraste ≥ 4,5:1).

export type Teinte = "fonce" | "sarcelle" | "corail" | "ambre";

export type Tuile = {
  etiquette: string; // ce que mesure le chiffre, en mots simples
  valeur: string; // le chiffre, déjà formaté
  interpretation?: string | null; // « lien net », « aucun lien »…
};

const FONDS: Record<Teinte, string> = {
  fonce: "var(--accent-fonce)",
  sarcelle: "var(--accent-principal)",
  corail: "var(--serie-2)",
  ambre: "var(--serie-5)",
};

export function CarteConstat({
  teinte = "fonce",
  icone: Icone,
  theme,
  constat,
  tuiles,
  conclusion,
  precision,
  details,
}: {
  teinte?: Teinte;
  icone: LucideIcon;
  theme: string;
  constat: string;
  tuiles: Tuile[]; // 1 ou 2 : côte à côte quand le résultat compare deux choses
  conclusion?: string;
  precision?: string; // période et fréquence (lib/format.ts, formatPeriode)
  details?: React.ReactNode; // texte long, replié sous « En savoir plus »
}) {
  const clair = teinte === "fonce";
  return (
    <article
      className={cn("flex flex-col gap-4 rounded-carte p-6 shadow-carte", clair ? "text-white" : "text-texte")}
      style={{ background: FONDS[teinte] }}
    >
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide opacity-80">
        <Icone className="size-4" aria-hidden="true" />
        {theme}
      </p>

      <h3 className="text-lg font-semibold leading-snug">{constat}</h3>

      <div className={cn("grid gap-3", tuiles.length > 1 && "grid-cols-2")}>
        {tuiles.map((t) => (
          <div
            key={t.etiquette}
            className={cn("flex flex-col gap-1 rounded-[12px] p-3", clair ? "bg-white/15" : "bg-white/40")}
          >
            {/* flex-1 : l'étiquette prend la place libre, les chiffres des deux tuiles restent alignés en bas */}
            <p className="flex-1 text-xs leading-snug opacity-90">{t.etiquette}</p>
            {/* Une fourchette (« +41 pb à +88 pb ») est écrite plus petit pour tenir sur une ligne */}
            <p
              className={cn(
                "font-semibold leading-tight tabular-nums",
                t.valeur.length > 9 ? "text-xl" : "text-[28px]",
              )}
            >
              {t.valeur}
            </p>
            {/* Pastille réservée même vide, pour que les deux tuiles gardent la même hauteur */}
            {tuiles.some((x) => x.interpretation) && (
              <span
                className={cn(
                  "w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  clair ? "bg-white/25" : "bg-white/70",
                  !t.interpretation && "invisible",
                )}
              >
                {t.interpretation ?? "—"}
              </span>
            )}
          </div>
        ))}
      </div>

      {precision && <p className="-mt-1 text-xs opacity-80">{precision}</p>}
      {conclusion && <p className="text-sm font-medium leading-snug">{conclusion}</p>}

      {details && (
        <details className="group text-xs leading-relaxed">
          <summary className="cursor-pointer list-none font-semibold underline-offset-4 hover:underline [&::-webkit-details-marker]:hidden">
            <span className="inline-block transition-transform group-open:rotate-90" aria-hidden="true">
              ▸
            </span>{" "}
            En savoir plus
          </summary>
          <div className="mt-2 opacity-90">{details}</div>
        </details>
      )}
    </article>
  );
}
