# Corrections du site Observatoire — liste pour Claude Code

Nov 9, 2026 · @ahmed

## Mode d'emploi et corrections transversales

Ce document liste toutes les corrections relevées en relisant le site https://observatoire-marches-maroc.vercel.app/ (données au 23/10/2026). Pour Claude Code : traiter une case à la fois, en commençant par les corrections transversales, puis page par page. Les chiffres cités viennent du site ; ne pas les modifier sans recalcul depuis les modèles dbt.

### Priorité 1 — cohérence des chiffres du MASI

Le site affiche quatre rendements différents pour le MASI selon la page :

| Page | Rendement | Période | Fréquence |
| --- | --- | --- | --- |
| Accueil / Synthèse | +42,7 % | 17/11/2023 → 23/10/2026 | vendredis AMMC |
| OPCVM et marché actions | +37,5 % | 01/11/2023 → 30/10/2026 | quotidienne |
| Contexte économique (nominal et réel) | +50,5 % | nov. 2023 → sept. 2026 | fin de mois |
| OPCVM, onglet Flux (2026) | −8,0 % / −12,2 % selon la source | année 2026 | hebdo / quotidienne |

Même problème pour la pire baisse (−16,2 % en hebdo sur l'accueil, −19,0 % en quotidien sur la page actions) et la volatilité (15,1 % contre 14,9 %).

- [x] Choisir : une période commune à tout le site, OU écrire la période exacte et la fréquence sous chaque chiffre du MASI.
- [x] Ajouter dans « Méthode et sources » un paragraphe qui explique les différentes périodes et fréquences.
- [x] Préciser partout « MASI hors dividendes » (les fonds Actions, eux, encaissent les dividendes).

### Priorité 2 — années et trimestres partiels

- [x] Étiqueter directement sous les barres : « 2022 (oct.–déc.) », « 2026 (jan.–oct.) », « 2026 T4 (en cours) », au lieu de la seule note de bas de graphique.

### Priorité 3 — courbes lissées

- [x] Remplacer les courbes arrondies (spline / monotone) par des segments droits avec les points visibles là où il y a peu de points ou des données mensuelles : PER, inflation.

### Priorité 4 — profil de l'auteur (recherche d'emploi)

- [x] Ajouter dans la colonne de gauche, sous « Code sur GitHub » : nom (Ahmed Badi), une ligne « Ingénieur financier — recherche un poste de Data Analyst / Finance », lien LinkedIn, lien CV, lien vers le rapport complet. *(Fait sans le lien CV, choix d'Ahmed : le CV s'envoie sur demande. « Rapport complet » = README du dépôt.)*
- [x] Ajouter les métadonnées de partage (titre, description, image Open Graph) pour un bel aperçu sur LinkedIn.

### Priorité 5 — refonte des cartes de résultats (demande d'Ahmed)

Problème : on ne comprend ce que désigne le grand chiffre qu'après avoir lu le petit texte ; les badges « Résultat 1, 2, 3… » ne disent rien et ne sont pas beaux.

- [x] Supprimer les badges « Résultat N ». Les remplacer par une petite icône + le thème en gris (ex. « Comportement des épargnants », « Risque », « Valorisation », « Taux », « IPO », « Diversification »).
- [x] Nouvelle structure de carte, de haut en bas : 1) thème ; 2) le constat en une phrase ; 3) le ou les chiffres, chacun avec son étiquette JUSTE AU-DESSUS (ce que le chiffre mesure, en mots simples) et un mot d'interprétation en dessous (« lien net », « aucun lien », « moins cher que la moyenne ») ; 4) une phrase de conclusion courte.
- [x] Quand un résultat repose sur une comparaison (passé / futur, MASI / MASI 20, nominal / réel, fonds / indice), afficher les deux chiffres côte à côte dans deux mini-tuiles, pas un chiffre en gros et l'autre caché dans le texte.
- [x] Appliquer à toutes les cartes (18). Premier modèle proposé, PAS retenu par Ahmed (à redéfinir à partir de sa vidéo d'inspiration) : carte « flux et MASI » avec deux tuiles « Lien achats ↔ MASI du mois passé : 0,43 (lien net) » et « Lien achats ↔ MASI du mois suivant : −0,07 (aucun lien) ».
- [x] Garder le thème bleu actuel (sarcelle #2A9DB0, corail #E8836B, ambre #F2B84B).

### Priorité 6 — corrélations : toujours dire « entre quoi et quoi »

- [x] Partout où une corrélation est affichée (cartes, tableaux, notes), écrire les deux variables : « Corrélation entre \[variable A\] et \[variable B\] ». Exemples : « achats nets des fonds Actions ↔ MASI des 4 semaines précédentes » ; « rendement hebdo des fonds OMLT ↔ variation du taux à 10 ans » ; « MASI ↔ fonds OMLT (rendements hebdomadaires) ».
- [x] Ajouter un mot d'interprétation à côté de chaque valeur : < 0,2 « aucun lien » ; 0,2–0,4 « lien faible » ; 0,4–0,7 « lien net » ; > 0,7 « lien fort » (et « sens inverse » si négatif).
- [x] Colonnes de tableau : remplacer « Corrélation avec la performance passée » par l'intitulé complet des deux variables.

### Priorité 7 — assistant IA pour questionner les données (demande d'Ahmed)

Objectif : un visiteur pose une question en français (« Quel placement a le mieux résisté en 2026 ? ») et l'assistant répond à partir des résultats du site.

- [x] Interface : bouton « Poser une question » ouvrant un panneau de chat (dans le thème bleu) + 4 questions suggérées cliquables.
- [x] Architecture recommandée (version 1, sûre et peu coûteuse) : une route API Next.js côté serveur appelle le modèle de langage (Gemini, déjà utilisé dans n8n, ou l'API Claude). On lui donne en contexte les résultats déjà calculés (export JSON des vues analytics + définitions + limites de la page Méthode). Pas de SQL libre.
- [ ] Version 2 (optionnelle) : outil SQL en lecture seule, limité à une liste blanche de vues analytics, avec le rôle agent\_lecture (comme l'agent n8n de la phase 1).
- [x] Sécurité : clé API uniquement côté serveur (variable d'environnement Vercel), jamais dans le navigateur ; limite de requêtes par visiteur ; longueur de question limitée.
- [x] Consignes de l'assistant : répondre seulement sur les données du site, citer le chiffre et sa période, dire « je ne sais pas » sinon, refuser tout conseil d'investissement personnalisé, rappeler les limites (échantillons courts, MASI hors dividendes).
- [x] Ajouter dans « Méthode et sources » comment fonctionne l'assistant (modèle utilisé, données fournies, limites).

### Priorité 8 — inspiration visuelle

Source : vidéo d'Ahmed (reel « Sales pipeline CRM dashboard », compte code\_and\_chill). On reprend le style, pas les couleurs : on garde le thème bleu (sarcelle #2A9DB0, bleu foncé, corail #E8836B, ambre #F2B84B).

- [ ] Fond de page clair et chaud (blanc cassé), titres de page à gauche en grand. *(Non retenu le 09/11/2026 : Ahmed garde la colonne bleu vif et le contenu blanc bleuté.)*
- [ ] Navigation par pilules en haut de chaque page (onglets arrondis, l'actif rempli en bleu foncé). *(Lot A, non retenu le 09/11/2026.)*
- [x] Bandeau de KPI en haut de page : icône ronde + grand chiffre + petite légende dessous + pastille colorée de variation (ex. « +22 % vs 2024 »).
- [x] Cartes de résultats PLEINES et colorées (bleu foncé, sarcelle, corail, ambre) avec texte blanc : étiquette courte en haut (ce que mesure le chiffre, « Achats ↔ MASI du mois passé »), titre en une ligne, grand chiffre en bas à gauche, pastille d'interprétation en bas à droite (« lien net »). Coins très arrondis (≈ 16 px). Grille de 2 à 3 cartes.
- [x] Clic sur une carte : elle s'agrandit en panneau détaillé animé (comme la carte jaune de la vidéo) avec l'explication complète, la méthode et les limites. Le texte long quitte donc la carte.
- [x] Graphiques : boutons segmentés en pilule (1 an / 3 ans / Tout), infobulle au survol, ligne de référence en pointillé (ex. moyenne PER 20,3x).
- [x] Jauge en demi-cercle pour les résultats en proportion (ex. « 5 IPO sur 6 battent le MASI », « 58 % du rendement du MASI »).
- [x] Barre empilée horizontale pour les répartitions (ex. composition des portefeuilles prudent / équilibré / dynamique).
- [x] Animations légères : apparition des cartes, chiffres qui défilent jusqu'à leur valeur, transition entre onglets. *(Sans la transition entre onglets, prévue au lot A non retenu.)*

## Page Accueil

### Cartes du haut et « Le MASI en quatre chiffres »

- [x] Carte Volatilité : ajouter une petite courbe (volatilité glissante sur 3 mois), ou retirer les courbes des trois autres cartes pour que les quatre cartes soient homogènes. *(Fait : courbes retirées des 4 cartes, choix d'Ahmed.)*
- [x] Carte Sharpe : ajouter en gris « Taux sans risque : fonds monétaires, 2,8 %/an ».
- [x] Carte Pire baisse (−16,2 %) : ajouter « mesurée sur les vendredis ; en données quotidiennes : −19,0 % (03/03/2026) ».
- [x] Ajouter les 3 règles de la conclusion sur l'accueil : choisir son niveau de risque ; ne pas acheter après la hausse ; surveiller les taux.

### Graphique « Plus de rendement s'est payé par plus de risque »

- [x] Ajouter une phrase sous le titre : « Les placements sont presque alignés : aucun n'a offert plus de rendement sans plus de risque. »
- [x] Ajouter une légende des couleurs : ● Portefeuilles types · ● Fonds / indices.
- [x] Le Monétaire (1,2 % de volatilité) apparaît à droite de l'OCT (0,8 %) à cause d'une semaine anormale à −1,22 %. Vérifier cette semaine dans le fichier AMMC source et corriger si c'est une erreur de publication ou de saisie. *(Fait le 09/11/2026 : erreurs de publication AMMC confirmées dans les fichiers d'origine — Monétaire 11/04 et 16/05/2025, OCT 16/05/2025 — et corrigées dans dbt. Volatilité Monétaire 0,2 %, OCT 0,4 % ; Sharpe OCT 1,25 : phrase clé reformulée « hors fonds obligataires court terme ».)*

### Tableau « Tous les placements côte à côte »

- [x] Note sous le tableau : « Sharpe : taux sans risque = monétaire (2,8 %/an), d'où le « — » pour le monétaire. Portefeuilles : prudent 50/40/10, équilibré 20/40/40, dynamique 10/20/70 (Monétaire / OMLT / fonds Actions). »
- [x] Nuancer « rendement par unité de risque presque identique » : « écarts de Sharpe (0,54 à 0,66) trop faibles pour départager les placements sur moins de 3 ans ».
- [x] Nuancer la comparaison MASI / fonds Actions : le MASI est un indice (hors dividendes, sans frais) ; on ne peut pas l'acheter directement.

## Page OPCVM et marché actions

### Phrase d'introduction

- [x] « Le marché est pourtant devenu moins cher » : ajouter le chiffre entre parenthèses « (PER passé de 19,7x à 18,0x) ». *(Fait avec le premier et le dernier PER Scope 40 de l'année, comme la carte (19,4x → 18,0x), lus en base.)*

### Onglet Flux et MASI (Résultat 1)

- [x] Le titre du graphique dit « après la hausse » mais le MASI n'apparaît pas : afficher la performance annuelle du MASI au-dessus de chaque barre (ex. « MASI +22 % » en 2024, « +28 % » en 2025), ou une ligne.
- [x] Le titre ne colle plus quand on change d'onglet de catégorie (Diversifiés, etc.) : titre neutre « Flux net annuel par catégorie de fonds », ou titre qui change avec l'onglet.
- [x] Ajouter une nuance sous la carte : « Corrélation ≠ causalité ; le décalage dans le temps rend l'explication ‘les épargnants suivent la hausse’ très plausible. »
- [ ] Nouveau résultat à ajouter (après vérification semaine par semaine) : « En 2026, l'argent n'a pas quitté la Bourse : il est passé des fonds Actions (−0,6 Md) vers les fonds Diversifiés (≈ +9,5 Md), moins risqués. » Vérifier que les sorties Actions et les entrées Diversifiés tombent aux mêmes dates. Mentionner que les Diversifiés sont très utilisés par les institutionnels. *(Vérifié le 10/11/2026, NON confirmé : en 2026, les flux hebdomadaires Actions et Diversifiés vont plutôt dans le même sens (corrélation +0,37) ; 19 semaines sur 27 de sorties Actions seulement avec entrées Diversifiés. Les totaux (−0,6 / +9,6 Md) ne prouvent pas que c'est le même argent : résultat non ajouté.)*

### Onglet Volatilité et baisses (Résultat 2)

- [x] Carte : mettre en gros la volatilité 2026 (19,7 %), avec en dessous « contre 8,5 % en 2024 · pire baisse −19,0 % le 3 mars 2026 », pour coller au graphique en barres voisin.
- [x] Vérifier que la carte « pire baisse » est calculée automatiquement : fin octobre 2026, le MASI est à ≈ −18 %, tout près du record de −19 %. *(Oui : lue à chaque mise à jour dans dw.v_masi_drawdown ; la carte affiche aussi l'écart actuel avec le plus haut.)*
- [x] Phrase sous le graphique des baisses : « Depuis l'été 2025, le MASI n'a plus retrouvé son plus haut. »

### Onglet MASI et MASI 20 (Résultat 3)

- [x] Nuancer le titre : « Depuis l'été 2025, les grandes valeurs décrochent du reste du marché » (avant, les deux indices évoluaient ensemble).
- [x] Ajouter « à expliquer par l'analyse des principales capitalisations » tant que la cause n'est pas étudiée (ne pas inventer de raison).
- [x] Mettre en avant : l'écart actuel du MASI 20 (−27,8 %) égale sa pire baisse → il est à son point le plus bas au 30/10/2026.

### Onglet PER (Résultat 4)

- [x] La ligne grise « moyenne historique sur 10 ans » relie deux valeurs de sources et de périmètres différents (18,0x CFG marché total ; 20,3x BMCE Scope 40) : la remplacer par une ligne horizontale plate à 20,3x (BMCE, Scope 40, même périmètre que la ligne bleue). Garder 18,0x dans le tableau seulement.
- [x] Ligne bleue : segments droits avec les points visibles (seulement 3 points).
- [x] Ne pas mélanger Scope 40 et marché total sur un même graphique.
- [x] Message final de la carte : « Le PER 2026 prévu (Scope 40) est passé de 19,4x à 18,0x, sous sa moyenne de 10 ans de 20,3x. » Ajouter : « Moins cher ne veut pas dire bonne affaire : si les bénéfices baissent, le PER remontera. »

## Page Contexte économique

### Onglet MASI et PIB (Résultat 5)

- [x] Étiqueter « 2026 T4 (en cours) » : la barre −12,3 % ne couvre qu'octobre.
- [x] Remplacer « Le recul récent du MASI ne vient pas d'un ralentissement économique mais de la valorisation » (raisonnement circulaire) par : « Le recul du MASI en 2026 ne s'explique pas par l'économie, qui croît encore de 4 % : il suit deux années de forte hausse et la remontée des taux. »
- [x] Ajouter dans « Méthode et sources » : le PIB est une croissance réelle (hors inflation), le MASI une variation nominale ; l'inflation étant très basse, le message ne change pas.
- [x] Ne pas affirmer que la Bourse « annonce » l'économie : écrire « à tester sur une période plus longue » (seulement 8 à 9 trimestres).

### Onglet Nominal et réel (Résultat 6)

- [x] Nuance importante sur la carte : la période étudiée commence en novembre 2023, après le pic d'inflation (+10,1 % en février 2023). Écrire : « Sur la période étudiée, qui commence après le pic d'inflation, celle-ci a peu pesé. »
- [x] Le +50,5 % nominal est un 3e chiffre différent du MASI : voir Priorité 1.
- [x] Graphique de l'inflation : segments droits au lieu de la courbe lissée (les données sont mensuelles).
- [x] Phrase sous le graphique de l'inflation : « Fin 2025 et mi-2026, les prix ont même légèrement baissé (déflation). » *(Les mois de déflation sont lus dans la série HCP, pas écrits à la main.)*

### Onglet Décisions de la banque centrale (Résultat 7)

- [x] Expliquer pourquoi il n'y a pas de barre « Hausse » : les 3 hausses (sept. 2022, déc. 2022, mars 2023) sont avant le début de l'historique du MASI (≈ nov. 2023, 3 ans gratuits). Dire aussi pourquoi 9 maintiens seulement sur les décisions de la période.
- [x] Définir « performance habituelle » dans la note (moyenne du MASI sur 20 séances sur quelle période ?).
- [x] Ajouter une limite : les 3 baisses (juin 2024, déc. 2024, mars 2025) tombent toutes pendant la forte hausse de 2024–2025. Comparé à une moyenne qui inclut la baisse de 2026, le MASI de ces périodes paraît « anormal » même sans effet de la décision. Option : comparer à la moyenne des 60 séances précédant chaque décision. *(Limite ajoutée ; l'option « 60 séances avant chaque décision » demanderait un nouveau calcul dbt, non fait.)*
- [x] Avec 3 cas, montrer chaque baisse séparément (un point par décision) plutôt qu'une seule moyenne, pour voir si les 3 vont dans le même sens.
- [x] Lien avec l'onglet Anticipations : les baisses étaient des surprises pour le marché des taux (écart −2 à +8 pb), ce qui rend une réaction du MASI après l'annonce plus plausible. Ajouter cette phrase.

## Page Taux et obligations

### Onglet Fonds par année (Résultat 8)

- [x] Étiqueter « 2022 (3 mois, ancienne méthode BAM) » ou retirer 2022 ; étiqueter « 2026 (jan.–oct.) ».
- [x] Renommer la colonne « Taux à 10 ans » en « Variation du taux à 10 ans sur l'année » (risque de confusion avec « comparé à il y a 10 ans »).
- [x] Note sous le tableau : « Une hausse des taux fait baisser le prix des obligations : + = mauvais pour les fonds OMLT. 1 pb = 0,01 %. »
- [x] Ajouter l'explication 2023 vs 2026 : même hausse des taux (+68 / +73 pb) mais OMLT +1,6 % contre −1,8 %, car les taux de départ (donc les intérêts encaissés) étaient plus élevés en 2023. À vérifier d'abord : niveau du taux 10 ans au 1er janvier 2023 et au 1er janvier 2026 dans la courbe BAM. *(Vérifié : taux 10 ans 3,19 % au 1er janvier 2023 contre 2,95 % au 1er janvier 2026 ; phrase construite avec les valeurs de la base.)*
- [ ] Mettre à jour le rapport (−1,6 % / +68 pb) avec les chiffres du site (−1,8 % / +73 pb), ou dater les chiffres du rapport.

### Onglet Sensibilité aux taux (Résultat 9)

- [x] Erreur dans la carte : « Depuis le changement de méthode de Bank Al-Maghrib : 4,1 » est inversé. Le tableau donne 4,60 depuis le 24/03/2023 et 4,14 sur toute la période. Corriger en : « Sur toute la période (202 semaines) : 4,1. »
- [x] Expliquer le R² en mots sur la carte : « Les taux expliquent environ 38 % des variations hebdomadaires de ces fonds. »
- [x] Préciser le signe : « Sensibilité 4,6 = −4,6 % pour +1 point de taux. »
- [x] Préciser « taux à 10 ans (taux de marché des bons du Trésor, différent du taux directeur de BAM) ».
- [x] Signaler que la sensibilité du monétaire (0,29) n'est pas fiable (R² = 0,01). *(Obsolète depuis la correction AMMC du 09/11/2026 : R² ≈ 0,3. À revoir avec la page Taux.)* *(Sans objet depuis la correction AMMC : R² ≈ 0,3.)*

### Onglet Anticipations (Résultat 10)

- [x] Ajouter une limite sous la carte : les 3 hausses (27/09/2022, 22/12/2022, 23/03/2023) tombent avant ou au moment de la rupture de méthode BAM (21/03/2023) ; avant cette date, le taux 13 semaines est celui de la dernière transaction et peut dater de plusieurs semaines. Vérifier pour le 23/03/2023 quelle courbe sert de « veille ». *(Vérifié : pour la hausse du 23/03/2023, la dernière courbe disponible est celle du 20/03/2023, donc encore de l'ancienne méthode.)*
- [x] Ajouter la taille de l'échantillon : « 17 décisions, dont 3 hausses et 3 baisses : résultat indicatif, pas une preuve statistique. »
- [x] Ajouter le constat sur les maintiens : « En septembre 2024 (−16 pb) et septembre 2025 (−17 pb), le marché attendait une baisse qui n'est pas venue. » *(Maintiens retenus automatiquement : taux à 13 semaines au moins 10 pb sous le taux directeur la veille.)*
- [x] Ajouter une phrase d'explication : « Si le marché attend une hausse, personne ne prête à 3 mois au taux actuel : le taux 13 semaines monte avant la décision. » Exemple concret : 27/09/2022, taux 13 sem. la veille 1,91 % pour un nouveau taux directeur de 2,00 %.
- [x] Préciser que la « veille » peut dater d'une semaine en 2023–2025 (courbes BAM collectées le vendredi seulement).
- [x] Colonne « Écart avec le directeur » : retirer le vert/rouge (vert suggère « bon ») ; texte neutre, ou couleur selon la décision comme dans le graphique.

### Onglet Flux des épargnants (Résultat 11)

- [x] Rendre la comparaison avec les fonds Actions possible : recalculer la corrélation des fonds de taux avec les flux en % de l'actif net (comme pour les Actions, 0,43), ou celle des Actions en dirhams. Puis retirer la phrase « les deux chiffres ne se comparent pas exactement ». *(Nouvelle colonne dbt en % de l'actif net : 0,17 pour les fonds MLT contre 0,43 pour les fonds Actions ; la conclusion tient.)*
- [x] Étiqueter « 2022 (3 mois) » et « 2026 (jan.–oct.) » sous les barres.
- [x] Nuancer le titre « Les capitaux ont quitté les fonds MLT quand les taux ont remonté » : vrai en 2026 (−17 Md), mais en 2023 les taux ont aussi monté (+68 pb) et les OMLT ont reçu +18 Md. Ajouter : « En 2023, les épargnants ont acheté à taux élevés : bon timing avant le rallye de 2024 (+8,2 %). »
- [x] Ajouter le constat de rotation 2026 : « L'argent est passé des fonds longs (OMLT −17 Md) vers les fonds courts (Monétaire ≈ +37 Md, OCT ≈ +25 Md). »
- [x] Qualifier les corrélations : 0,15 et 0,09 sont faibles ; écrire « léger suivi de tendance » plutôt qu'un lien net. *(Barème du site : « aucun lien » sous 0,2.)*
- [x] Vérifier le nombre de semaines (213 ici, 212 dans le rapport) et dater les chiffres. *(212 sur la copie figée, 213 en ligne (une semaine AMMC de plus) : le site affiche le nombre lu en base.)*

### Onglet Courbe des taux

- [x] Bug du graphique « L'écart entre taux courts et taux longs » : l'axe horizontal place les points à intervalle égal (axe par catégorie) alors que les données sont quotidiennes en 2022–2023 et 2026, hebdomadaires en 2023–2025. Résultat : avril 2023 → août 2024 (16 mois) prend autant de place que février → juin 2026 (4 mois). Passer à un vrai axe de temps.
- [x] Sur ce même graphique, griser ou annoter la période avant le 21/03/2023 (« ancienne méthode BAM ») : les paliers plats et le saut vertical du 10 ans (≈ 3,2 % → 4,2 %) viennent de taux de dernière transaction, pas d'un vrai mouvement quotidien.
- [x] Vérifier les pics vers le bas du taux 13 semaines vers mi-2025 (jusqu'à ≈ 1,7 %) : probablement des erreurs de collecte ou des jours sans courbe. Corriger ou exclure. *(Vérifié : 3 cotations aberrantes de BAM (22/08, 03/09, 17/09/2025), écartées dans dbt (seed exclusions_courbe_bam).)*
- [x] Ajouter l'explication clé sous le graphique des courbes : « Entre nov. 2025 et nov. 2026, le taux court n'a presque pas bougé (≈ 2,2 %) mais le 10 ans est passé de ≈ 2,85 % à 3,81 % : la courbe s'est pentue. C'est ce qui a fait perdre les OMLT en 2026 alors que le monétaire gagnait encore. »
- [x] Ajouter aussi : « De nov. 2024 à nov. 2025, toute la courbe a baissé (baisses de BAM) : bonne année pour les obligations. »
- [x] Couleurs : le bleu-vert désigne la courbe 2026 sur le 1er graphique et le taux à 10 ans sur le 2e ; utiliser des couleurs différentes pour éviter la confusion.
- [x] Dater la carte : le 3,81 % est au 03/11/2026, alors que le reste du site est au 23/10/2026.

## Page Introductions en bourse

### Onglet Performance face au MASI (Résultat 12)

- [x] Nuance indispensable sur la carte : avec des sursouscriptions de 34x à 64x, un souscripteur n'a reçu qu'environ 1,5 à 3 % des actions demandées. Ajouter : « Mais avec 34x à 64x de sursouscription, le gain réel reste très faible : ≈ +0,73 DH pour 100 DH demandés sur SGTM. » (chiffres déjà calculés en phase 3 ; vérifier s'ils sont dans un autre onglet). *(Gain réel lu dans analytics.ipo_performance.gain_pour_100_dh_demandes (connu pour 3 IPO sur 6 : SGTM +0,73 DH).)*
- [x] Ajouter la taille et le contexte de l'échantillon : « 6 IPO, presque toutes lancées pendant la hausse de 2024–2025 : résultat indicatif. » *(Écrit avec le nombre d'IPO et la période de cotation lus en base ; « presque toutes pendant la hausse » non affirmé.)*
- [x] Dater les chiffres : « dernier cours au JJ/MM/2026 » sous le tableau (les écarts changent chaque jour).
- [x] Préciser que l'écart avec le MASI est calculé sur une période différente pour chaque IPO (de sa 1re cotation à aujourd'hui), et si les rendements sont hors dividendes comme le MASI.
- [x] Axe vertical du graphique : graduations rondes (0, 10, 20, 30, 40 pts) au lieu de 13 / 26 / 39.
- [x] Renommer la colonne « Achat à la 20e séance » en « Acheté en bourse après 1 mois et gardé jusqu'à aujourd'hui ».
- [x] Expliquer « Sursouscription 34,7x » dans une note : « la demande a été 34,7 fois plus grande que le nombre d'actions offertes ».
- [ ] Laprophan : ajouter une ligne « à venir » (souscription du 9 au 17/11/2026, prix 341 DH), puis ses chiffres après la 1re cotation. *(Non fait : c'est la tâche F3 de docs/TASKS.md (procédure manuelle d'Ahmed).)*

### Onglet Premier jour (Résultat 13)

- [x] Ajouter l'explication du +61,0 % : Vicenne, Cash Plus et SGTM ont exactement +61 % en 5 séances parce qu'elles ont touché le plafond de +10 % chaque jour pendant 5 jours (1,10 × 1,10 × 1,10 × 1,10 × 1,10 ≈ 1,61). Phrase : « Trois IPO ont atteint le plafond quotidien 5 jours de suite : la demande dépassait l'offre et le prix ne pouvait pas monter plus vite. » *(Le plafond de +10 % par séance est écrit dans l'explication (règle de la Bourse, pas une donnée de la base).)*
- [x] Carte : « Meilleur gain en 5 séances » laisse croire à une seule IPO ; écrire « +61,0 % pour 3 IPO sur 6 (Vicenne, Cash Plus, SGTM) ».
- [ ] Vérifier pourquoi T2S fait +20 % le 1er jour alors que les autres sont plafonnées à ≈ +10 % (seuil de variation modifié en 2026 ? règle spéciale le jour d'introduction ?). Citer la source une fois trouvée. *(Non fait : demande une recherche sur les règles de la Bourse de Casablanca (seuil de variation le jour d'introduction).)*
- [x] Ajouter que pour T2S et Cash Plus, la hausse s'arrête dès la 1re semaine (5 séances > 1 mois), contrairement au titre « la hausse se poursuit bien après le premier jour ».
- [x] Le tableau « Les introductions en bourse, une par une » est répété sous chaque onglet : le placer une seule fois sous les onglets.

### Structure de la page IPO

- [x] Les onglets se répètent : même tableau et mêmes chiffres (5 séances, 1 mois) sous chaque onglet. Option recommandée : remplacer les onglets « Premier jour » et « Achat après un mois » par un seul graphique « Trajectoire après l'introduction » (une ligne par IPO, base 100 au prix d'IPO, des séances 0 à 120), avec le jour 20 marqué d'un trait vertical. On y voit d'un coup le plafond des premiers jours, le pic, puis la redescente. *(Page restructurée : 3 cartes, graphique « Trajectoire après l'introduction » (nouveau modèle dbt ipo_trajectoires), écart avec le MASI, achat après un mois face au MASI, tableau unique.)*
- [x] Garder ensuite : carte Résultat 12 (face au MASI) + carte Résultat 13 (plafond +61 %) + carte « achat après un mois : perte dans 5 cas sur 6 » + le tableau une seule fois.

### Onglet Achat après un mois (Résultat 14)

- [x] Comparer au MASI sur la même période (de la 20e séance à aujourd'hui) : une partie des pertes vient de la baisse générale du marché en 2026. Ajouter une colonne ou une 2e barre « MASI sur la même période », et l'écart en points. *(Nouvelles colonnes dbt masi_depuis_j20_pct et anormal_achat_j20_pts : les 6 achats font moins bien que le MASI (−3 à −32 pts), CFG Bank compris (+20,2 % contre +30,6 %).)*
- [x] Indiquer la durée de détention de chaque achat (CFG ≈ 3 ans, T2S ≈ 3 mois) : les résultats ne se comparent pas directement. Option : ajouter le rendement annualisé. *(Colonne duree_detention_jours (dbt) dans le tableau ; rendement annualisé non affiché (trompeur sur 2 mois pour T2S).)*
- [x] Expliquer l'exception CFG Bank (+20,2 %) : achetée début 2024, au début de la hausse du marché, et gardée presque 3 ans.
- [x] Harmoniser la date : « gardé jusqu'au 3 novembre 2026 » alors que le reste du site est au 23/10/2026. *(Les cours des IPO et le MASI quotidien vont plus loin que les données AMMC : la date du dernier cours est écrite sous le tableau et dans la carte.)*

## Page Synthèse quantitative

### Onglet Rendement et risque (Résultat 15)

- [x] ERREUR de définition sous le graphique en barres : « Sharpe = rendement annualisé divisé par la volatilité » est faux. Le calcul réel est (rendement annualisé − taux sans risque) ÷ volatilité : MASI (12,8 − 2,8) ÷ 15,1 = 0,66 (sans le taux sans risque on obtiendrait 0,85). Corriger le texte.
- [x] Remplacer « Le Monétaire n'est pas affiché : son ratio n'est pas significatif » par « Le Monétaire sert de taux sans risque : son Sharpe vaut 0 par construction », et retirer sa place vide dans le graphique (elle ressemble à une donnée manquante).
- [x] Trier les barres du Sharpe par volatilité croissante ou par Sharpe, pas par ordre alphabétique.
- [x] Les noms coupés sous les barres (« …feuille dynamique », « …ortefeuille équilibré ») : raccourcir (« Dynamique », « Équilibré », « Prudent ») ou passer en barres horizontales.
- [x] Doublon avec l'accueil : même nuage de points et même tableau. Garder le détail ici et, sur l'accueil, seulement le nuage + un lien « Voir la synthèse » (ou l'inverse). *(Détail gardé dans la Synthèse ; sur l'accueil, nuage + notes + lien « Tous les placements côte à côte ».)*
- [x] Ajouter la légende des couleurs du nuage (portefeuilles types / fonds et indices), comme sur l'accueil.
- [x] Préciser la base des colonnes « % du rendement du MASI » et « % du risque du MASI » : calculées sur le rendement annualisé et la volatilité (équilibré : 7,4 ÷ 12,8 = 58 % ; 7,5 ÷ 15,1 = 50 %).
- [x] Mettre en avant les OCT : 26 % du rendement du MASI pour seulement 5 % de son risque. *(Après correction AMMC : 26 % du rendement du MASI pour 2,6 % de son risque (lus en base).)*
- [x] Corriger le titre de la carte « Plus de rendement, c'est autant plus de risque » → « Plus de rendement, c'est plus de risque », et ajouter : « écarts de Sharpe trop faibles pour départager les placements sur moins de 3 ans ».

### Onglet Année par année (Résultat 16)

- [x] La carte ne démontre pas son titre : « Le classement change d'une année à l'autre » avec en gros −8,7 % (fonds Actions 2026). Mettre plutôt en gros le changement de classement, ex. « Fonds Actions : 1er en 2024 (+22,6 %), dernier en 2026 (−8,7 %) ».
- [x] Ajouter au tableau Monétaire, OCT, OMLT et Diversifiés : sans eux, on ne voit pas le « classement » (en 2026, OCT ≈ +2,1 % et Monétaire ≈ +2,0 % passent en tête). Option : afficher le rang (1er…9e) dans chaque case.
- [x] Étiqueter « 2023 (≈ 6 semaines, depuis le 17/11) » et « 2026 (jan.–oct.) » dans le graphique et le tableau.
- [x] MASI 2026 = −7,7 % ici, −8,0 % et −12,2 % ailleurs : voir Priorité 1.
- [x] Ajouter une phrase sous le graphique : « Le prudent a perdu presque rien en 2026 (−0,5 %) mais n'a gagné qu'un tiers des actions en 2024–2025. »

### Onglet Corrélations (Résultat 17)

- [x] À VÉRIFIER EN PRIORITÉ : le Monétaire a une corrélation de 0,40 à 0,53 avec tous les placements, MASI compris. C'est anormal pour un placement presque sans risque. Hypothèse : la semaine anormale à −1,22 % (voir Accueil) tombe une semaine où tout baisse et tire toutes les corrélations. Recalculer la matrice sans cette semaine (ou après correction de la donnée AMMC) et comparer. *(Vérifié : après correction des 3 semaines AMMC, 0,25 à 0,35.)*
- [x] Afficher seulement la moitié de la matrice (triangle) : chaque chiffre apparaît aujourd'hui deux fois.
- [x] Renforcer l'échelle de couleurs : 0,38 et 0,53 ont presque la même teinte ; utiliser une échelle plus contrastée entre 0 et 1.
- [x] Ajouter le constat sur les Diversifiés : corrélation 0,98 avec les fonds Actions, ils se comportent comme une « petite dose » d'actions, pas comme un mélange indépendant.
- [x] Préciser dans la carte : aucune corrélation n'est négative ; les obligations amortissent les chutes (0,38 avec le MASI) sans les compenser.

### Onglet Fonds Actions et MASI (Résultat 18)

- [x] Erreur de raisonnement dans la carte : « Le MASI ne compte pas les dividendes : l'écart reflète les frais et les choix de gestion ». Comme les fonds encaissent les dividendes (≈ 3 %/an) et pas le MASI, l'écart réel est PLUS GRAND que 2,7 points (de l'ordre de 10 points sur la période). Corriger : « Le MASI ne compte pas les dividendes, que les fonds encaissent : à dividendes égaux, l'écart réel est plus grand. »
- [ ] Idéalement, comparer à un indice dividendes inclus (indice de rentabilité du MASI, à vérifier sur le site de la Bourse de Casablanca) ou ajouter ≈ 3 %/an de dividendes au MASI en estimation, en le disant. *(Non fait : demande une recherche (indice de rentabilité du MASI) ou une estimation des dividendes à ajouter en dbt.)*
- [x] Le graphique met sur le même axe deux mesures différentes (rendement cumulé et volatilité annualisée). Le remplacer par deux courbes base 100 dans le temps (MASI et fonds Actions), qui montrent quand l'écart s'est creusé. *(Nouveau modèle dbt synthese_base100 : deux courbes « 100 DH placés ».)*
- [x] Ajouter le ratio d'information (écart moyen fonds − MASI ÷ volatilité de cet écart) et la tracking error : indicateurs classiques pour juger un gérant face à son indice. *(Nouveau modèle dbt synthese_fonds_vs_masi : tracking error 6,2 %, ratio d'information −0,08.)*

## Page Méthode et sources

- [x] BUG : le tableau « Fraîcheur des données » est vide (une seule ligne « — »). Vérifier la requête ou la vue qui l'alimente (droits de lecture du compte du site, nom de vue, schéma analytics). Attendu : une ligne par source (AMMC, MASI, courbe BAM, HCP, IPO, PER) avec sa dernière date. *(Non reproduit le 10/11/2026 : en local, le tableau lit bien ses 7 sources sur Supabase. Probable version en cache sur Vercel lors d'une coupure de la base : à vérifier en ligne après le prochain déploiement.)*
- [x] Le tableau qualité affirme « Chaque page indique sur quelle fréquence le chiffre est calculé » : ce n'est pas encore le cas (voir Priorité 1). Soit le réaliser, soit corriger la phrase.
- [x] Ajouter une phrase à la ligne « changement de méthode en mars 2023 » : « Avant le 21/03/2023, BAM publiait le taux de la dernière transaction de chaque bon, parfois vieux de plusieurs semaines ; depuis, une courbe de référence calculée chaque jour. Les résultats sont donc donnés sur les deux périodes. »
- [x] Ajouter au tableau qualité, une fois vérifiés : la semaine anormale du monétaire (−1,22 %) et les pics du taux 13 semaines mi-2025. *(Les deux lignes sont dans le tableau qualité de la page Méthode.)*
- [x] Reformuler la limite « Le MASI sert d'approximation… les dividendes n'y sont pas comptés » en disant le sens du biais : « Le MASI exclut les dividendes (≈ 3 %/an) que les fonds encaissent : la comparaison avantage les fonds. »
- [x] Ajouter une section « Définitions des indicateurs » : Sharpe = (rendement annualisé − rendement du monétaire) ÷ volatilité ; volatilité (écart-type hebdo × √52) ; pire baisse ; composition des portefeuilles (prudent 50/40/10, équilibré 20/40/40, dynamique 10/20/70, rééquilibrés chaque semaine).
- [x] Ajouter un petit lexique pour les recruteurs non spécialistes : OPCVM, OMLT, OCT, monétaire, point de base, PER, sensibilité, corrélation, R², séance, sursouscription.
- [x] La page dit qu'aucun chiffre n'est écrit à la main, « y compris dans les phrases » : l'inversion 4,6 / 4,1 de la carte Résultat 9 vient donc probablement du modèle de phrase (mauvais champ). Vérifier le code de cette carte.

## Relecture terminée

Toutes les pages et tous les onglets du site ont été relus le 09/11/2026. Prochaine étape : traiter cette liste avec Claude Code, en commençant par les corrections transversales (Priorité 1 à 4), puis les erreurs signalées (Sharpe, 4,6 / 4,1, dividendes, axe du temps, tableau de fraîcheur vide), puis le reste.

- Après la cotation de Laprophan (fin novembre 2026) : ajouter ses chiffres sur la page IPO.
