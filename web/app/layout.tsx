import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { derniereSemaineAmmc } from "@/lib/donnees";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Observatoire des marchés financiers marocains",
    template: "%s · Observatoire",
  },
  description:
    "Évolution du marché financier marocain, 2023–2026 : actions, OPCVM, taux, introductions en bourse.",
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
