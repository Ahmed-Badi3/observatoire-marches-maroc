import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { CarteOuvrable } from "./carte-ouvrable";
import { ChiffreAnime } from "./chiffre-anime";
import { Jauge } from "./jauge";

// Carte de résultat (Priorités 5 et 8 de docs/CORRECTIONS.md, style de la vidéo d'Ahmed).
// De haut en bas : le thème (icône + mot), le constat en une phrase, le ou les chiffres dans des
// mini-tuiles (ce que mesure le chiffre AU-DESSUS, un mot d'interprétation EN DESSOUS), une conclusion
// courte. Un clic ouvre le panneau détaillé : le texte long (méthode, nuances) quitte ainsi la carte.
// Image : l'étiquette d'un médicament. D'abord à quoi il sert, puis la dose ; la notice est au verso.
//
// Tous les chiffres et mots arrivent DÉJÀ formatés (lib/format.ts, lib/interpretation.ts).
// Couleurs du thème : texte blanc seulement sur le bleu foncé ; sur sarcelle, corail et ambre, le blanc
// serait trop pâle pour les petits textes, on écrit donc en foncé (contraste ≥ 4,5:1).

export type Teinte = "fonce" | "sarcelle" | "corail" | "ambre";

export type Tuile = {
  etiquette: string; // ce que mesure le chiffre, en mots simples
  valeur: string; // le chiffre, déjà formaté
  interpretation?: string | null; // « lien net », « aucun lien »…
  jauge?: { part: number | string | null | undefined; total: number | string | null | undefined }; // proportion
};

const FONDS: Record<Teinte, string> = {
  fonce: "var(--accent-fonce)",
  sarcelle: "var(--accent-principal)",
  corail: "var(--serie-2)",
  ambre: "var(--serie-5)",
};

function Tuiles({ tuiles, clair, grand = false }: { tuiles: Tuile[]; clair: boolean; grand?: boolean }) {
  const avecPastille = tuiles.some((x) => x.interpretation);
  return (
    <div className={cn("grid gap-3", tuiles.length > 1 && "grid-cols-2")}>
      {tuiles.map((t) => (
        <div
          key={t.etiquette}
          className={cn("flex flex-col gap-1 rounded-[12px] p-3", clair ? "bg-white/15" : "bg-white/40", grand && "p-4")}
        >
          {/* flex-1 : l'étiquette prend la place libre, les chiffres des deux tuiles restent alignés en bas */}
          <p className={cn("flex-1 leading-snug opacity-90", grand ? "text-sm" : "text-xs")}>{t.etiquette}</p>
          {t.jauge && (
            <Jauge
              part={t.jauge.part}
              total={t.jauge.total}
              fond={clair ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.55)"}
              className="mt-1 w-24"
            />
          )}
          {/* Une fourchette (« +41 pb à +88 pb ») est écrite plus petit pour tenir sur une ligne */}
          <p
            className={cn(
              "font-semibold leading-tight tabular-nums",
              t.valeur.length > 9 ? "text-xl" : grand ? "text-4xl" : "text-[28px]",
            )}
          >
            <ChiffreAnime texte={t.valeur} />
          </p>
          {/* Pastille réservée même vide, pour que les deux tuiles gardent la même hauteur */}
          {avecPastille && (
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
  );
}

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
  details?: React.ReactNode; // texte long, affiché seulement dans le panneau détaillé
}) {
  const clair = teinte === "fonce";
  const enTete = (
    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide opacity-80">
      <Icone className="size-4" aria-hidden="true" />
      {theme}
    </p>
  );

  const apercu = (
    <>
      {enTete}
      <h3 className="text-lg font-semibold leading-snug">{constat}</h3>
      <Tuiles tuiles={tuiles} clair={clair} />
      {precision && <p className="-mt-1 text-xs opacity-80">{precision}</p>}
      {conclusion && <p className="text-sm font-medium leading-snug">{conclusion}</p>}
    </>
  );

  const panneau = (
    <>
      {enTete}
      <h3 className="pr-8 text-2xl font-semibold leading-snug">{constat}</h3>
      <Tuiles tuiles={tuiles} clair={clair} grand />
      {precision && <p className="-mt-2 text-xs opacity-80">{precision}</p>}
      {conclusion && <p className="text-base font-semibold leading-snug">{conclusion}</p>}
      {details && <div className="text-sm leading-relaxed opacity-95">{details}</div>}
      <p className="border-t border-current/20 pt-4 text-xs opacity-90">
        Méthode, définitions et limites :{" "}
        <Link href="/methode" className="font-semibold underline underline-offset-4">
          Méthode et sources
        </Link>
      </p>
    </>
  );

  return (
    <CarteOuvrable fond={FONDS[teinte]} clair={clair} titre={constat} apercu={apercu} panneau={panneau} />
  );
}
