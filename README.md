# Ultron

Tableau de bord personnel qui tourne sur ta machine. Tu lui parles, il répond à voix haute, et il sait :

- ce que tu as à faire, d'après tes tableaux Trello (un tableau par projet, colonnes « À faire / En cours / Q&A / Terminer ») ;
- où en sont tes sessions Claude Code, et laquelle t'attend ;
- où tu en es, toi : tu dictes « aujourd'hui je pèse 80 kilos, j'ai dormi 7 heures, couru 3 km et médité », il range tout, trace les courbes et te dit à quelle date tu atteins tes objectifs à ton rythme actuel.

Deux vues, en haut du tableau de bord : **Travail** (projets Trello, sessions Claude Code) et **Moi** (objectifs, régularité, habitudes, mesures, journal). Tu peux aussi dire « montre-moi mes stats ».

Le cerveau est la CLI Claude Code lancée avec ton compte Claude. Aucune clé API, aucune dépendance npm.

## Lancer

Il te faut Node 20 ou plus, Claude Code installé et connecté (`claude` lancé une fois, puis `/login`), et Chrome ou Edge pour la voix.

```bash
cp .env.example .env     # puis remplis TRELLO_KEY et TRELLO_TOKEN
npm start                # ouvre http://localhost:4242
```

Sans Trello configuré, Ultron démarre quand même : les sessions Claude Code et le suivi fonctionnent.

Pour voir l'interface sans rien configurer et sans consommer ton abonnement : `npm run demo` (http://localhost:4343, données inventées, fausse IA).

Pour continuer le développement avec Claude Code : le besoin et la feuille de route sont dans `docs/CAHIER_DES_CHARGES.md`, les règles de travail dans `CLAUDE.md`.

## Brancher Trello

1. Va sur https://trello.com/power-ups/admin et crée un Power-Up (le nom n'a pas d'importance, il ne sert qu'à obtenir une clé).
2. Dans l'onglet « Clé API », génère la clé : c'est `TRELLO_KEY`.
3. Sur la même page, clique sur le lien « Jeton » pour t'en créer un à la main et autorise l'accès : c'est `TRELLO_TOKEN`.

Ultron lit seulement. Les colonnes sont classées par leur nom : « terminer / done / fini » comptent comme terminé, « Q&A / review / test » comme en revue, « en cours / doing » comme en cours, tout le reste comme à faire. Les étiquettes (par exemple « Sprint 3 ») sont affichées à côté des tickets et transmises à l'IA. Pour changer ces règles : fonction `listStatus` dans `server.js`.

## Lui parler

- Clique sur l'orbe, ou maintiens Espace, puis parle. Échap coupe la parole.
- « Écoute continue » : dis « Ultron », puis ta question. Le micro reste alors ouvert.
- Le champ texte fait la même chose sans micro.

Exemples :

- « Qu'est-ce que j'ai à faire aujourd'hui ? »
- « Où en est Homepedia ? »
- « Quelles sessions m'attendent ? »
- « Aujourd'hui je pèse 80 kilos, j'ai couru 3 km et fait 40 pompes. »
- « Mon objectif, c'est 75 kilos avant Noël. » / « Je veux courir 15 km par semaine. »
- « Où j'en suis sur mon poids ? »
- « Retiens que je cours le matin. » / « Annule la dernière mesure. »

- « J'ai médité. » / « Je veux méditer 5 fois par semaine. »
- « Mon humeur aujourd'hui, c'est 4 sur 5. » / « Note que j'ai mal dormi à cause du café. »
- « Je fais mon bilan du jour. » Il pose les questions une par une et rouvre le micro après chacune.

Quand une session Claude Code passe de « travaille » à « t'attend », Ultron te le dit sans que tu demandes.

## La vue Moi

Tu ne configures rien : chaque chose que tu dictes crée sa mesure, et l'IA choisit son type.

- **Un état** qu'on relève (poids, sommeil, humeur, épargne) : courbe, moyennes sur 7 et 30 jours, tendance par semaine.
- **Un cumul** (kilomètres, pompes, pages, dépenses) : total de la semaine, comparaison avec la semaine d'avant.
- **Une habitude** faite ou non (méditation, lecture) : série en cours et 14 derniers jours.

Les mesures sont rangées par thème : corps, sport, sommeil, esprit, argent.

Pour un objectif du type « 75 kilos avant Noël », Ultron prolonge la tendance des 30 derniers jours et annonce une date d'arrivée, puis la compare à l'échéance. C'est une droite tracée sur tes mesures, pas une prédiction : avec moins de trois mesures sur cinq jours il ne donne pas de date, et si la tendance est plate ou dans le mauvais sens il le dit. Pour un objectif hebdomadaire, il compare ce qui est fait à ce qui devrait l'être à ce jour de la semaine.

« Régularité » montre les douze dernières semaines, un carré par jour, plus foncé quand tu as saisi davantage. « Pas encore saisi aujourd'hui » liste ce que tu as relevé au moins trois jours sur les sept derniers.

Clique sur une mesure pour voir sa courbe : son détail te laisse **ajouter ou corriger une valeur à la main**, à n'importe quelle date, sans passer par la voix ni par l'IA. La liste des dernières valeurs t'offre « corriger » et « supprimer ».

## Comment ça marche

```
navigateur (public/index.html)          server.js (127.0.0.1 uniquement)
  orbe, micro, synthèse vocale   ──▶    /api/state  Trello + sessions + suivi
  Web Speech API                 ──▶    /api/chat   construit le contexte du jour,
                                                    appelle `claude -p`, applique les actions
```

- **Trello** : API REST, mise en cache une minute.
- **Sessions Claude Code** : lecture des fichiers `~/.claude/projects/*/*.jsonl`. L'état est déduit du dernier message : si Claude a fini son tour, la session t'attend ; si un outil est en suspens depuis plus de deux minutes, c'est probablement une demande d'autorisation. C'est une déduction, pas une information donnée par la CLI.
- **Suivi** : tout est dans `data/ultron.json` (mesures, objectifs, notes, mémoire, conversation). L'IA ne touche pas au fichier : elle renvoie des actions (`log_metric`, `set_goal`, `add_note`, `remember`…) que le serveur valide puis applique. Les moyennes, tendances et dates estimées sont calculées par le serveur (`buildTracking` et `evalGoal` dans `server.js`), puis données à l'IA déjà faites : elle les lit, elle ne les recalcule pas.
- **IA** : `claude -p` sans aucun outil, sans serveurs MCP, sans enregistrement de session, lancé dans un dossier vide. Les variables `ANTHROPIC_*` sont retirées de son environnement pour qu'une clé API qui traînerait ne détourne pas la facturation vers l'API.

## À savoir

- La reconnaissance vocale de Chrome envoie l'audio aux serveurs de Google. Le reste ne quitte ta machine que pour Trello et Claude.
- La voix est celle du navigateur (`speechSynthesis`). Pour une meilleure voix, c'est la fonction `speak` de `public/index.html` qu'il faut remplacer.
- Chaque question lance un `claude -p` : compte deux à six secondes de délai, et l'usage est décompté de ton abonnement Claude. Anthropic a annoncé puis suspendu en juin 2026 un passage de `claude -p` sur un crédit séparé ; si ça revient, c'est ici que ça se verra.
- Testé sous Linux avec un faux Trello et un faux binaire `claude`. Sous Windows, le lancement de la CLI passe par le shell : à vérifier chez toi.

## Validation manuelle (reste du Sprint 1)

Ces vérifications demandent ta machine, ton abonnement Claude et Chrome ; elles ne peuvent pas être automatisées. Le vrai Trello (T1) et le format des sessions (T5) sont déjà validés.

- **S1-2 — vraie CLI `claude`.** Lance `npm start`, ouvre http://localhost:4242 et pose une question à l'écrit. À vérifier : tu obtiens une réponse (lue à voix haute dans Chrome), et aucune session « Ultron » n'apparaît dans la liste des sessions. Chaque question lance un vrai `claude -p` et consomme l'abonnement.
- **S1-4 — voix (Chrome).** Clic sur l'orbe et touche Espace maintenue ouvrent le micro ; la phrase part à la fin de la parole, Échap annule. « Écoute continue » : « Ultron » seul arme l'écoute 8 s, une phrase commençant par « Ultron » est envoyée. La réponse est lue à voix haute et le micro se rouvre quand elle finit par une question. Note comment « Ultron » est transcrit et ajuste l'expression `WAKE` dans `public/index.html` si besoin.
- **S1-6 — latence.** Sur dix questions avec le modèle `haiku`, relève le temps entre l'envoi et le début de la réponse, puis écris la mesure ici dans le README.

Garde-fou facturation (exigence §5) : avant de lancer la CLI, Ultron retire de son environnement toutes les variables `ANTHROPIC_*`, `CLAUDE_CODE_*` et `CLAUDECODE`. Un test automatisé de ce garde-fou reste à ajouter.
