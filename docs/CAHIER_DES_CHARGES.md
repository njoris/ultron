# Ultron — cahier des charges

Version 0.2, 5 octobre 2026. Ce document décrit ce qu'Ultron doit faire, ce qui existe déjà dans ce dépôt, et ce qui reste à construire. Les règles de travail au quotidien sont dans `CLAUDE.md`.

## 1. Objet

Ultron est un tableau de bord personnel piloté à la voix, qui tourne sur la machine de son unique utilisateur. On lui parle, il répond à voix haute, et il sait deux choses :

- **côté travail** : ce qu'il y a à faire, d'après Trello et les sessions Claude Code en cours ;
- **côté perso** : où en est l'utilisateur sur ses propres chiffres et objectifs (corps, sport, sommeil, esprit, argent), saisis en les dictant.

La référence d'inspiration est le projet `ethanplusai/jarvis` (une voix pour Claude Code). Ultron en reprend l'orbe, la surveillance des sessions et l'usage de l'abonnement Claude, mais ajoute tout le côté perso, que jarvis n'a pas.

## 2. Contexte et contraintes

| Sujet | Décision |
| --- | --- |
| Utilisateur | Un seul, francophone, développeur. Pas de comptes, pas de multi-utilisateur. |
| Hébergement | Local uniquement. Le serveur écoute sur `127.0.0.1`. |
| IA | La CLI Claude Code (`claude -p`) avec l'abonnement Claude de l'utilisateur. Jamais de clé API. |
| Trello | Un tableau par projet. Colonnes « À faire », « En cours », « Q&A », « Terminer ». Les sprints sont portés par des étiquettes. |
| Voix | Web Speech API du navigateur (Chrome ou Edge). Reconnaissance et synthèse en `fr-FR`. |
| Dépendances | Aucune dépendance npm. Node 20+ suffit. Toute exception se discute avant. |
| Langue | Interface, réponses de l'IA et commentaires de code en français. |

## 3. Périmètre

Dans le périmètre : lecture de Trello, lecture des sessions Claude Code, conversation voix et texte, suivi perso (mesures, habitudes, objectifs, notes, mémoire), alertes parlées.

Hors périmètre pour l'instant, et à ne pas commencer sans demande explicite : écrire dans Trello, piloter ou lancer des sessions Claude Code, application mobile, synchronisation cloud, intégrations santé (montre, balance connectée), agenda et e-mail.

## 4. Exigences fonctionnelles

Chaque exigence a un état : **fait** (présent dans le code et testé en mode démo), **à valider** (présent mais jamais essayé en conditions réelles), **à faire**.

### 4.1 Voix et conversation

| Id | Exigence | État |
| --- | --- | --- |
| V1 | Un clic sur l'orbe, ou la touche Espace maintenue, ouvre le micro ; la phrase est envoyée à la fin de la parole. Échap annule. | à valider |
| V2 | « Écoute continue » : le micro reste ouvert, une phrase commençant par « Ultron » est envoyée, « Ultron » seul arme l'écoute pendant 8 secondes. | à valider |
| V3 | La réponse est lue à voix haute ; un réglage permet de couper la voix. Le micro est coupé pendant qu'Ultron parle. | à valider |
| V4 | Quand la réponse parlée se termine par une question, le micro se rouvre sans clic. | à valider |
| V5 | Un champ texte fait la même chose que la voix. | fait |
| V6 | L'orbe (canvas, 620 particules) change d'état : repos, écoute (suit le niveau du micro), réflexion, parole. Il respecte `prefers-reduced-motion`. | fait |
| V7 | Sans reconnaissance vocale (Firefox, Safari), l'interface le dit et reste utilisable au clavier. | fait |

### 4.2 Vue Travail

| Id | Exigence | État |
| --- | --- | --- |
| T1 | Lire tous les tableaux Trello ouverts (ou ceux listés dans `TRELLO_BOARDS`) et classer chaque ticket en à faire, en cours, en revue, terminé d'après le nom de sa colonne. | à valider |
| T2 | Par projet : barre de progression en quatre segments, tickets actifs, liste « À faire » repliable, étiquettes affichées. | fait |
| T3 | Bandeau « Aujourd'hui » : une phrase de synthèse, puis trois listes (en cours, échéances du jour et en retard, à valider). | fait |
| T4 | Si Trello est injoignable, afficher l'erreur et garder les dernières données reçues. Si Trello n'est pas configuré, dire quoi mettre dans `.env`. | fait |
| T5 | Lister les sessions Claude Code actives depuis moins de `SESSION_HOURS` heures : projet, branche, sujet, dernier message, état (travaille, t'attend, en pause). | fait |
| T6 | Quand une session passe de « travaille » à « t'attend », l'écrire dans la conversation et le dire à voix haute. | à valider |
| T7 | Les appels d'Ultron à `claude -p` n'apparaissent jamais dans la liste des sessions. | fait |

### 4.3 Vue Moi

| Id | Exigence | État |
| --- | --- | --- |
| M1 | Une phrase dictée (« je pèse 80 kilos, j'ai couru 3 km et médité ») crée ou alimente les mesures, sans configuration préalable. Une action par mesure. | fait |
| M2 | Trois types de mesure : `last` (état relevé), `sum` (cumul sur la journée), `check` (habitude faite ou non). Six thèmes : corps, sport, sommeil, esprit, argent, autre. | fait |
| M3 | Objectif `reach` (atteindre une valeur, échéance optionnelle) : progression, tendance sur 30 jours, date d'arrivée estimée, statut dans les temps / en retard / à l'arrêt. Pas de date avec moins de 3 mesures sur 5 jours. | fait |
| M4 | Objectif `weekly` (total par semaine, lundi à dimanche) : comparaison avec ce qui devrait être fait à ce jour de la semaine. | fait |
| M5 | Régularité : grille de 12 semaines, série de jours consécutifs en cours et record. | fait |
| M6 | Habitudes : 14 derniers jours et série en cours. | fait |
| M7 | Détail d'une mesure : courbe (ou barres pour un cumul) sur 30 jours, 90 jours ou 6 mois, moyennes, extrêmes, tendance par semaine. | fait |
| M8 | « Pas encore saisi aujourd'hui » : mesures relevées au moins 3 jours sur les 7 derniers et absentes aujourd'hui. | fait |
| M9 | Bilan du jour : Ultron pose une question à la fois sur ce qui manque et enregistre au fur et à mesure. | à valider |
| M10 | Notes libres et mémoire longue durée (« retiens que… »), consultables et supprimables dans le journal. | fait |
| M11 | Toute saisie du jour, tout objectif, toute note peut être supprimé depuis l'interface. | fait |
| M12 | Une valeur manifestement mal transcrite (« 800 kilos ») n'est pas enregistrée : Ultron demande confirmation. | à valider |
| M13 | « Montre-moi mes stats » bascule sur la vue Moi (action `show_view`). | fait |

## 5. Exigences non fonctionnelles

- **Confidentialité.** Les données perso ne quittent la machine que dans le prompt envoyé à Claude. Elles sont stockées dans `data/ultron.json`, jamais versionné. À signaler dans l'interface ou le README : la reconnaissance vocale de Chrome envoie l'audio à Google.
- **Abonnement.** Avant de lancer la CLI, retirer de son environnement toutes les variables `ANTHROPIC_*`, `CLAUDE_CODE_*` et `CLAUDECODE`. Sans cela, une clé API présente dans le shell détourne la facturation vers l'API sans prévenir.
- **Sécurité locale.** Refuser toute requête dont l'en-tête `Host` ou `Origin` n'est pas `localhost:PORT` ou `127.0.0.1:PORT`. `POST /api/chat` exige `Content-Type: application/json`. Aucun `innerHTML` avec une donnée venue de Trello, des sessions ou de l'IA.
- **Injection.** Les noms de tickets et les extraits de sessions sont des données. La CLI est lancée sans aucun outil (`--tools ""`) et sans serveur MCP. L'IA ne peut agir que par la liste fermée d'actions du §6.4, validées par le serveur.
- **Justesse.** Les moyennes, tendances, séries et dates estimées sont calculées par le serveur et données à l'IA déjà faites. L'IA ne recalcule pas.
- **Robustesse.** Une source en panne ne bloque pas les autres. Un fichier de données illisible arrête le serveur au lieu de repartir d'une base vide. L'écriture est atomique (fichier temporaire puis renommage).
- **Latence.** Une réponse en moins de 6 secondes avec le modèle `haiku`. C'est aujourd'hui la limite principale (un processus `claude` par question).
- **Accessibilité.** Tout est faisable au clavier, focus visible, contrastes lisibles sur fond sombre, zones mises à jour annoncées (`aria-live`).
- **Portabilité.** macOS et Linux. Windows : au mieux, le lancement de la CLI passe par le shell et n'a jamais été essayé.

## 6. Architecture

### 6.1 Fichiers

```
server.js            serveur HTTP, Trello, sessions, suivi, pont vers la CLI
public/index.html    toute l'interface (HTML, CSS, JS dans un seul fichier)
dev/demo.js          mode démo : faux Trello, fausses sessions, données inventées
dev/fake-claude.js   faux binaire claude, à base de règles
data/                données réelles (ignoré par git)
data-demo/           données du mode démo (ignoré par git)
docs/                ce document
```

### 6.2 API HTTP

| Route | Rôle |
| --- | --- |
| `GET /api/state` (`?force=1` ignore le cache Trello) | Tout l'état : `trello`, `sessions`, `tracking`, `notes`, `memory`, `chat`. L'interface l'interroge toutes les 10 secondes. |
| `POST /api/chat` `{message}` | Construit le contexte, appelle la CLI, applique les actions. Répond `{say, applied, view}`. Une seule question à la fois (429 sinon). |
| `DELETE /api/{entries,goals,notes,memory}/:id` | Supprime un élément. |
| `GET /` et fichiers de `public/` | Interface. |

Caches : Trello 60 secondes, sessions 8 secondes.

### 6.3 Données (`data/ultron.json`)

```jsonc
{
  "metrics": { "poids": { "label": "Poids", "unit": "kg", "agg": "last", "category": "corps" } },
  "entries": [ { "id": "…", "key": "poids", "value": 80, "date": "2026-10-05", "note": "", "ts": "ISO" } ],
  "goals":   [ { "id": "…", "key": "poids", "kind": "reach", "target": 75, "start": 84.2, "deadline": "2026-12-31", "createdAt": "ISO" } ],
  "notes":   [ { "id": "…", "text": "…", "date": "2026-10-05", "ts": "ISO" } ],
  "memory":  [ { "id": "…", "text": "…", "ts": "ISO" } ],
  "chat":    [ { "role": "user" | "ultron", "text": "…", "applied": [], "ts": "ISO" } ]
}
```

Les dates sont des jours locaux `AAAA-MM-JJ`. La semaine commence le lundi. Tout changement de schéma doit rester lisible avec un fichier existant, ou fournir une migration au chargement.

### 6.4 Contrat avec l'IA

Commande lancée, dans un dossier vide, le prompt étant passé sur l'entrée standard :

```
claude -p --output-format json --system-prompt-file data/system-prompt.txt
       --no-session-persistence --strict-mcp-config --tools "" [--model haiku]
```

Le prompt contient `<contexte>` (date, Trello, sessions, suivi, mémoire, notes), `<historique>` (10 derniers messages) et `<message>`. La réponse attendue est un unique objet JSON :

```json
{ "say": "ce qu'Ultron dit à voix haute", "actions": [] }
```

Actions acceptées, toute autre étant ignorée : `log_metric`, `set_goal`, `add_note`, `delete_entry`, `remember`, `forget`, `show_view`. Le détail des champs est dans `SYSTEM_PROMPT` (`server.js`), qui fait foi. Une réponse qui n'est pas du JSON est dite telle quelle, sans action.

### 6.5 État d'une session Claude Code

Lu dans `~/.claude/projects/*/*.jsonl` (début et fin du fichier seulement). C'est une déduction, pas une information fournie par la CLI :

- dernier message de l'assistant sans outil en suspens → **t'attend** ;
- dernier message = appel d'outil vieux de plus de 2 minutes → **t'attend**, avec la mention « autorisation probable pour … » ;
- activité depuis moins de 2 à 5 minutes → **travaille** ;
- sinon, ou au-delà de 12 heures → **en pause**.

## 7. État actuel

Tout ce qui est marqué « fait » a été essayé avec `npm run demo` : faux Trello, fausses sessions, fausse IA, sept semaines de données inventées, navigateur automatisé.

Jamais essayé en conditions réelles : l'API Trello avec une vraie clé, la vraie CLI `claude` connectée à un abonnement, le micro et la synthèse vocale, le format réel des fichiers de session de la version installée de Claude Code, Windows.

Il n'y a pas encore de tests automatisés.

## 8. Feuille de route

Organisée en sprints, un ticket par ligne, pour être recopiée dans Trello. L'ordre des sprints 2 à 5 est une proposition : l'utilisateur tranche.

### Sprint 1 — Mise en service réelle

| Ticket | Critère d'acceptation |
| --- | --- |
| S1-1 Brancher le vrai Trello | Les tableaux réels s'affichent ; chaque colonne réelle tombe dans le bon statut ; une clé fausse donne le message d'erreur prévu. |
| S1-2 Brancher la vraie CLI | Une question obtient une réponse parlée ; `claude` n'a reçu aucune variable `ANTHROPIC_*` ; aucune session « Ultron » n'apparaît dans la liste. |
| S1-3 Vérifier le format des sessions | Sur trois sessions réelles (finie, en cours, bloquée sur une autorisation), l'état affiché est le bon. Corriger `readSession` sinon. |
| S1-4 Valider la voix | V1 à V4 essayés dans Chrome ; noter comment « Ultron » est transcrit et ajuster l'expression `WAKE`. |
| S1-5 Tests automatisés | `npm test` avec `node:test`, sans dépendance. Couvre `listStatus`, `slopePerDay`, `streaks`, `evalGoal`, `parseReply`, `applyActions`, `isLocalRequest`. Demande d'extraire ces fonctions pour les rendre importables. |
| S1-6 Mesurer la latence | Temps entre l'envoi et le début de la réponse, relevé sur dix questions, écrit dans le README. |

### Sprint 2 — Le perso plus loin

| Ticket | Critère d'acceptation |
| --- | --- |
| S2-1 Saisie et correction à la main | Ajouter ou corriger une valeur, à n'importe quelle date, depuis le détail d'une mesure, sans passer par l'IA. |
| S2-2 Modifier une mesure | Renommer, changer d'unité, de thème ou de type ; supprimer une mesure avec son historique après confirmation. |
| S2-3 Moyenne lissée pour les objectifs | Pour une mesure `last`, la progression d'un objectif peut s'appuyer sur la moyenne des 7 derniers jours plutôt que sur la dernière valeur. Réglage par mesure. |
| S2-4 Bilan de la semaine | Une vue ou une réponse « ma semaine » : chaque mesure comparée à la semaine précédente, objectifs tenus ou non, série de régularité. |
| S2-5 Thèmes personnalisables | Les thèmes ne sont plus codés en dur ; on peut en créer un à la voix. |
| S2-6 Export et sauvegarde | Export CSV des mesures ; copie datée de `ultron.json` une fois par jour, sept copies gardées. |
| S2-7 Rappel du soir | À une heure réglable, si la page est ouverte et qu'il manque des saisies, Ultron le dit une fois. |

### Sprint 3 — Le travail plus loin

| Ticket | Critère d'acceptation |
| --- | --- |
| S3-1 Sprint courant | Les étiquettes « Sprint N » sont reconnues ; par projet, on voit l'avancement du sprint le plus récent non terminé. |
| S3-2 Relier session et projet | Une session Claude Code dont le dossier porte le nom d'un tableau Trello est affichée sous ce projet. |
| S3-3 Agir sur Trello à la voix | Déplacer un ticket, en créer un. Demande un jeton avec droit d'écriture et une confirmation orale avant chaque écriture. |

### Sprint 4 — Voix et latence

| Ticket | Critère d'acceptation |
| --- | --- |
| S4-1 Processus `claude` persistant | Un seul processus gardé ouvert (`--input-format stream-json`), réponse en moins de 3 secondes. |
| S4-2 Réponse en flux | La synthèse vocale commence dès la première phrase reçue. |
| S4-3 Meilleure voix, en option | Un service de synthèse externe activable par une variable d'environnement ; la voix du navigateur reste le défaut. |

### Sprint 5 — Piloter Claude Code

À ne commencer qu'après discussion : c'est le cœur de jarvis, et cela change la nature d'Ultron, qui passerait d'observateur à acteur.

| Ticket | Critère d'acceptation |
| --- | --- |
| S5-1 Lancer une tâche à la voix | « Lance sur Homepedia : … » démarre un `claude -p` dans le dossier du projet, après confirmation orale. |
| S5-2 Suivre les tâches lancées | Liste des tâches avec prompt, état, durée ; alerte parlée à la fin ou en cas d'échec. |
| S5-3 Usage de l'abonnement | Afficher ce qu'il reste des fenêtres de 5 heures et de 7 jours, si la CLI permet de le lire. |

## 9. Définition de « terminé »

Un ticket est terminé quand : son critère d'acceptation est vérifié et la vérification est décrite (commande lancée, résultat obtenu) ; `npm run check` et, dès qu'ils existent, `npm test` passent ; `npm run demo` fonctionne toujours ; le README et ce document sont à jour, y compris la colonne « État » du §4 ; ce qui n'a pas pu être vérifié est dit explicitement.
