import { describe, expect, it } from "vitest";

import { interpreterCorrelation } from "./interpretation";

describe("interprétation des corrélations", () => {
  it("valeurs de contrôle du site", () => {
    expect(interpreterCorrelation(0.43)).toBe("lien net"); // achats ↔ MASI du mois passé
    expect(interpreterCorrelation(-0.07)).toBe("aucun lien"); // achats ↔ MASI du mois suivant
    expect(interpreterCorrelation("0.38")).toBe("lien faible"); // MASI ↔ fonds OMLT
    expect(interpreterCorrelation(0.98)).toBe("lien fort"); // fonds Diversifiés ↔ fonds Actions
  });
  it("bornes : la valeur affichée décide", () => {
    expect(interpreterCorrelation(0.199)).toBe("lien faible"); // affichée 0,20
    expect(interpreterCorrelation(0.194)).toBe("aucun lien"); // affichée 0,19
    expect(interpreterCorrelation(0.4)).toBe("lien net");
    expect(interpreterCorrelation(0.7)).toBe("lien fort");
  });
  it("sens inverse si négative", () => {
    expect(interpreterCorrelation(-0.45)).toBe("lien net, sens inverse");
  });
  it("valeur manquante", () => {
    expect(interpreterCorrelation(null)).toBeNull();
    expect(interpreterCorrelation("pas un nombre")).toBeNull();
  });
});
