import {
  BookOpen,
  House,
  Landmark,
  Percent,
  Rocket,
  Scale,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

// Les 7 pages du site (docs/PRD.md), dans l'ordre du menu.
// Une seule liste : le menu, le titre et le fil d'Ariane la lisent tous.
export type PageSite = {
  href: string;
  titre: string;
  icone: LucideIcon;
};

export const PAGES: PageSite[] = [
  { href: "/", titre: "Accueil", icone: House },
  { href: "/opcvm-actions", titre: "OPCVM et marché actions", icone: TrendingUp },
  { href: "/contexte-economique", titre: "Contexte économique", icone: Landmark },
  { href: "/taux-obligations", titre: "Taux et obligations", icone: Percent },
  { href: "/introductions-en-bourse", titre: "Introductions en bourse", icone: Rocket },
  { href: "/synthese", titre: "Synthèse quantitative", icone: Scale },
  { href: "/methode", titre: "Méthode et sources", icone: BookOpen },
];

export const URL_GITHUB =
  "https://github.com/Ahmed-Badi3/observatoire-marches-maroc";

// Adresse publique du site : sert aux aperçus de partage (LinkedIn, WhatsApp).
export const URL_SITE = "https://observatoire-marches-maroc.vercel.app";

// L'auteur, affiché sous le menu (Priorité 4 de docs/CORRECTIONS.md). Un seul endroit à modifier.
// Le « rapport complet » est le README du dépôt : il décrit les 6 modules et les 18 résultats.
export const AUTEUR = {
  nom: "Ahmed Badi",
  titre: "Ingénieur financier — Data Analyst / Finance",
  linkedin: "https://www.linkedin.com/in/ahmed-badi-01831a296",
  rapport: `${URL_GITHUB}#readme`,
};

export const MENTION_LEGALE =
  "Projet personnel à but pédagogique. Données publiques (AMMC, Bourse de Casablanca, Bank Al-Maghrib, HCP). Ne constitue pas un conseil en investissement.";

// null pour une page hors menu (pages de démonstration).
export function pageCourante(chemin: string): PageSite | null {
  return PAGES.find((p) => p.href === chemin) ?? null;
}
