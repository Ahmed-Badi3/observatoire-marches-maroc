import postgres from "postgres";

// Connexion à Supabase, côté serveur uniquement (ce fichier n'est jamais envoyé au navigateur
// tant qu'il n'est importé que par des composants serveur et par lib/donnees.ts).
// L'adresse vient de web/.env.local (variable DATABASE_URL), jamais du code.
// Elle utilise le rôle `site_lecture` : SELECT seulement sur dw et analytics.
//
// Image : le pooler de Supabase est un standard téléphonique partagé. En mode « transaction »,
// chaque requête peut tomber sur une ligne différente : on désactive donc les requêtes
// préparées à l'avance (prepare: false).

declare global {
  var __sqlObservatoire: ReturnType<typeof postgres> | undefined;
}

function creerConnexion() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL est absente : créez web/.env.local (voir docs/DATA.md).",
    );
  }
  // SSL obligatoire pour Supabase ; désactivé pour une base sur ce PC (copie figée, tâche B7),
  // qui n'a en général pas de certificat.
  const surCePc = /@(localhost|127\.0\.0\.1)(:|\/)/.test(url);
  return postgres(url, {
    ssl: surCePc ? false : "require",
    prepare: false,
    // En ligne : une fonction serverless = une connexion.
    // En développement (`npm run dev`), Next prépare la même page plusieurs fois en parallèle ; avec un seul
    // guichet, une préparation attendrait l'autre et Next la bloquerait (erreur « use cache … awaiting a
    // promise created outside it », page à ~3 min). On ouvre donc plusieurs guichets, en local seulement.
    max: process.env.NODE_ENV === "development" ? 10 : 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

// En développement, Next recharge les fichiers souvent : on garde une seule connexion ouverte.
export function sql() {
  if (!globalThis.__sqlObservatoire) {
    globalThis.__sqlObservatoire = creerConnexion();
  }
  return globalThis.__sqlObservatoire;
}
