import { describe, expect, it } from "vitest";

import {
  formatDate,
  formatDateCourte,
  formatMoisAnnee,
  formatMilliards,
  formatMontant,
  formatMultiple,
  formatNombre,
  formatPoints,
  formatPointsDeBase,
  formatAnnee,
  formatPeriode,
  formatPourcentage,
  formatTrimestre,
} from "./format";

// Caractères invisibles écrits explicitement, pour que le test voie la différence :
const NBSP = " "; // espace insécable : milliers et avant l'unité
const MOINS = "−"; // vrai signe moins

describe("pourcentages", () => {
  it("valeurs de contrôle de la tâche D5", () => {
    expect(formatPourcentage(42.26)).toBe(`+42,3${NBSP}%`);
    expect(formatPourcentage(37.55)).toBe(`+37,6${NBSP}%`);
  });
  it("négatif avec le vrai signe moins", () => {
    expect(formatPourcentage(-19.04)).toBe(`${MOINS}19,0${NBSP}%`);
  });
  it("sans signe à la demande", () => {
    expect(formatPourcentage(42.26, { signe: false })).toBe(`42,3${NBSP}%`);
  });
  it("zéro et quasi-zéro n'ont pas de signe", () => {
    expect(formatPourcentage(0)).toBe(`0,0${NBSP}%`);
    expect(formatPourcentage(-0.04)).toBe(`0,0${NBSP}%`);
    expect(formatPourcentage(0.04)).toBe(`0,0${NBSP}%`);
  });
});

describe("points, points de base, multiples, milliards", () => {
  it("points de pourcentage", () => {
    expect(formatPoints(17.25)).toBe(`+17,3${NBSP}pts`);
    expect(formatPoints(-4.2)).toBe(`${MOINS}4,2${NBSP}pts`);
  });
  it("points de base, sans décimale", () => {
    expect(formatPointsDeBase(68)).toBe(`+68${NBSP}pb`);
    expect(formatPointsDeBase(-12.4)).toBe(`${MOINS}12${NBSP}pb`);
  });
  it("multiples (PER)", () => {
    expect(formatMultiple(18)).toBe("18,0x");
    expect(formatMultiple(19.4)).toBe("19,4x");
  });
  it("milliards de dirhams", () => {
    expect(formatMilliards(10.6)).toBe(`+10,6${NBSP}Md`);
  });
});

describe("nombres et montants", () => {
  it("séparateurs français", () => {
    expect(formatNombre(16537.91)).toBe(`16${NBSP}537,91`);
    expect(formatNombre(0.66)).toBe("0,66");
    expect(formatNombre(1234567.891, { decimales: 0 })).toBe(`1${NBSP}234${NBSP}568`);
  });
  it("corrélation avec signe", () => {
    expect(formatNombre(0.43, { signe: true })).toBe("+0,43");
    expect(formatNombre(-0.08, { signe: true })).toBe(`${MOINS}0,08`);
  });
  it("montant en dirhams", () => {
    expect(formatMontant(16537.91)).toBe(`16${NBSP}537,91${NBSP}MAD`);
  });
});

describe("valeurs reçues de la base", () => {
  it("accepte le texte renvoyé par PostgreSQL (numeric)", () => {
    expect(formatPourcentage("42.26")).toBe(`+42,3${NBSP}%`);
  });
  it("donnée manquante : tiret, jamais d'erreur", () => {
    expect(formatPourcentage(null)).toBe("—");
    expect(formatPourcentage(undefined)).toBe("—");
    expect(formatPourcentage("")).toBe("—");
    expect(formatNombre("abc")).toBe("—");
    expect(formatMultiple(null)).toBe("—");
    expect(formatDate(null)).toBe("—");
  });
});

describe("dates", () => {
  it("date longue et courte", () => {
    expect(formatDate("2026-10-23")).toBe("23 octobre 2026");
    expect(formatDate("2026-11-03")).toBe("3 novembre 2026");
    expect(formatDateCourte("2026-10-23")).toBe("23/10/2026");
  });
  it("date invalide", () => {
    expect(formatDate("pas une date")).toBe("—");
  });
});

describe("années et trimestres partiels", () => {
  it("année complète : l'année seule", () => {
    expect(formatAnnee(2024, "2024-01-05", "2024-12-27", false)).toBe("2024");
  });
  it("année partielle : les mois couverts", () => {
    expect(formatAnnee(2026, "2026-01-02", "2026-10-23", true)).toBe("2026 (janv.–oct.)");
    expect(formatAnnee("2022", "2022-10-07", "2022-12-30", "true")).toBe("2022 (oct.–déc.)");
  });
  it("un seul mois", () => {
    expect(formatAnnee(2023, "2023-12-01", "2023-12-29", true)).toBe("2023 (déc.)");
  });
  it("trimestre en cours ou terminé", () => {
    expect(formatTrimestre(2026, 4, true)).toBe("2026 T4 (en cours)");
    expect(formatTrimestre(2026, 3, false)).toBe("2026 T3");
  });
});

describe("période et fréquence du MASI", () => {
  it("hebdomadaire : dates courtes et mention des dividendes", () => {
    expect(formatPeriode("2023-11-17", "2026-10-23", "hebdo")).toBe(
      "Chaque vendredi (jour des valeurs AMMC), du 17/11/2023 au 23/10/2026 · MASI hors dividendes",
    );
  });
  it("quotidien, sans la mention des dividendes", () => {
    expect(formatPeriode("2023-11-01", "2026-10-30", "quotidien", { horsDividendes: false })).toBe(
      "Chaque séance, du 01/11/2023 au 30/10/2026",
    );
  });
  it("mensuel : mois en toutes lettres", () => {
    expect(formatPeriode("2023-11-30", "2026-09-30", "mensuel")).toBe(
      "Fin de mois, de novembre 2023 à septembre 2026 · MASI hors dividendes",
    );
  });
  it("date manquante", () => {
    expect(formatPeriode(null, "2026-10-30", "quotidien", { horsDividendes: false })).toBe(
      "Chaque séance, du — au 30/10/2026",
    );
  });
});

describe("mois et année (axes des graphiques)", () => {
  it("écrit le mois en toutes lettres", () => {
    expect(formatMoisAnnee("2026-03-03")).toBe("mars 2026");
    expect(formatMoisAnnee(null)).toBe("—");
  });
});

import { graduationsRondes } from "./graphiques";

describe("graduations rondes de l'axe vertical", () => {
  it("pas rond et zéro inclus", () => {
    expect(graduationsRondes([13.5, 36.4, 20])).toEqual([0, 10, 20, 30, 40]);
    expect(graduationsRondes([-5, 37])).toEqual([-10, 0, 10, 20, 30, 40]);
  });
  it("aucune donnée", () => {
    expect(graduationsRondes([null])).toBeUndefined();
  });
});
