import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { derniereSemaineAmmc } from "@/lib/donnees";
import { AUTEUR, URL_SITE } from "@/lib/pages";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Aperçu de partage (Priorité 4) : ce que LinkedIn ou WhatsApp affichent quand on colle le lien.
// L'image vient de app/opengraph-image.tsx. Aucun chiffre de marché ici : LinkedIn garde l'aperçu
// en cache, et un chiffre y deviendrait faux quand les données évoluent.
const TITRE_SITE = "Observatoire des marchés financiers marocains";
const DESCRIPTION_SITE =
  "Actions, OPCVM, taux et introductions en bourse au Maroc : ce qui a fait bouger le marché et où un investisseur aurait eu intérêt à placer son argent. Projet data d'Ahmed Badi.";

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITE),
  title: {
    default: TITRE_SITE,
    template: "%s · Observatoire",
  },
  description: DESCRIPTION_SITE,
  authors: [{ name: AUTEUR.nom, url: AUTEUR.linkedin }],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    siteName: TITRE_SITE,
    title: TITRE_SITE,
    description: DESCRIPTION_SITE,
  },
  twitter: {
    card: "summary_large_image",
    title: TITRE_SITE,
    description: DESCRIPTION_SITE,
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const dateAmmc = await derniereSemaineAmmc();
  return (
    <html
      lang="fr"
      className={`${jakarta.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppShell dateAmmc={dateAmmc}>{children}</AppShell>
      </body>
    </html>
  );
}
