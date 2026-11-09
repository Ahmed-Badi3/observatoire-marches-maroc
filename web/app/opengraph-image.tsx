import { ImageResponse } from "next/og";

import { AUTEUR } from "@/lib/pages";

// Image d'aperçu de partage (1200 × 630), affichée par LinkedIn ou WhatsApp quand on colle le lien.
// Next.js la dessine lui-même à partir de ce code (next/og, déjà inclus dans Next : rien à installer).
// Image : une affiche de vitrine, fabriquée une fois au build puis servie telle quelle.
// Aucun chiffre de marché : LinkedIn garde l'aperçu en cache, un chiffre y deviendrait faux.
// Couleurs du thème (app/globals.css) écrites en clair : l'image ne lit pas les variables CSS.

export const alt = "Observatoire des marchés financiers marocains — projet data d'Ahmed Badi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BLEU_FONCE = "#1b6f7e";
const SARCELLE = "#2a9db0";
const CORAIL = "#e8836b";
const AMBRE = "#f2b84b";

const THEMES = ["Actions", "OPCVM", "Taux", "Introductions en bourse"];

export default function ImageApercu() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: `linear-gradient(135deg, ${BLEU_FONCE}, ${SARCELLE})`,
          color: "white",
        }}
      >
        {/* Trois barres aux couleurs du site : un petit graphique en guise de logo */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
          <div style={{ width: 28, height: 40, borderRadius: 6, background: AMBRE }} />
          <div style={{ width: 28, height: 70, borderRadius: 6, background: CORAIL }} />
          <div style={{ width: 28, height: 100, borderRadius: 6, background: "white" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1 }}>
            Observatoire des marchés financiers marocains
          </div>
          <div style={{ fontSize: 30, opacity: 0.9, lineHeight: 1.3 }}>
            Ce qui a fait bouger le marché, et où il aurait fallu placer son argent.
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            {THEMES.map((t) => (
              <div
                key={t}
                style={{
                  display: "flex",
                  padding: "8px 18px",
                  borderRadius: 999,
                  background: "rgba(255, 255, 255, 0.18)",
                  fontSize: 24,
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 30, fontWeight: 700 }}>{AUTEUR.nom}</div>
          <div style={{ fontSize: 24, opacity: 0.9 }}>{AUTEUR.titre}</div>
        </div>
      </div>
    ),
    size,
  );
}
