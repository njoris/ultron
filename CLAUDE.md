# Ultron

Tableau de bord personnel piloté à la voix, local, pour un seul utilisateur. Deux vues : Travail (Trello, sessions Claude Code) et Moi (mesures, habitudes, objectifs perso). Le cerveau est la CLI `claude -p` lancée par `server.js` avec l'abonnement Claude de l'utilisateur.

Le besoin, l'état de chaque exigence et la feuille de route sont dans `docs/CAHIER_DES_CHARGES.md`. Lis-le avant de commencer un ticket, et mets-le à jour quand tu en termines un.

## Commandes

```bash
npm run demo     # http://localhost:4343 — faux Trello, fausses sessions, fausse IA, données inventées
npm start        # http://localhost:4242 — vraies sources, lit .env, consomme l'abonnement à chaque question
npm run check    # vérifie la syntaxe des fichiers Node
```

Développe et vérifie avec `npm run demo`. N'utilise `npm start` que pour ce qui ne peut se voir qu'en réel (Trello, vraie CLI), et préviens avant, parce que chaque question y lance un vrai `claude -p`.

## Où est quoi

- `server.js` : tout le serveur. Sections dans l'ordre : utilitaires, stockage, Trello, sessions Claude Code, suivi perso (`buildTracking`, `evalGoal`), cerveau (`SYSTEM_PROMPT`, `buildContext`, `runClaude`, `applyActions`), HTTP.
- `public/index.html` : toute l'interface, dans un seul fichier. Orbe, micro, synthèse vocale, puis le rendu des deux vues.
- `dev/` : le mode démo. `fake-claude.js` répond par règles, ce n'est pas une IA.
- `data/` : les vraies données de l'utilisateur. `data-demo/` : celles de la démo, à supprimer pour repartir de zéro.

## Règles qui ne se négocient pas

- **Aucune dépendance npm.** Node 20+ et les modules intégrés. Si une dépendance te semble vraiment nécessaire, demande d'abord.
- **Ne touche jamais à `data/`** : ni lecture pour déboguer, ni écriture, ni suppression. Ce sont des données personnelles. Travaille sur `data-demo/`.
- **Le serveur n'écoute que sur 127.0.0.1** et refuse tout `Host` ou `Origin` étranger (`isLocalRequest`). Ne relâche pas ce contrôle.
- **Pas de `innerHTML` avec une donnée externe.** Tout ce qui vient de Trello, des sessions ou de l'IA passe par la fonction `h()`. Les seuls `innerHTML` autorisés construisent du SVG à partir de nombres.
- **La CLI est lancée sans outil, sans MCP, sans persistance de session, et sans variables `ANTHROPIC_*`** dans son environnement. Ne retire aucun de ces garde-fous : le dernier empêche une facturation à l'API à l'insu de l'utilisateur.
- **L'IA n'écrit rien elle-même.** Elle renvoie `{say, actions}` ; le serveur valide et applique. Une nouvelle capacité = une nouvelle action dans `SYSTEM_PROMPT` et dans `applyActions`, avec validation des champs.
- **Les calculs sont faits par le serveur**, puis donnés à l'IA dans le contexte. Ne demande jamais au modèle de calculer une moyenne, une tendance ou une date.
- **Le schéma de `ultron.json` reste rétrocompatible.** Un fichier créé par une version précédente doit toujours se charger.

## Conventions

- Tout en français : interface, messages d'erreur, commentaires, messages de commit.
- Les textes de l'interface sont en phrases simples, sans majuscules d'emphase. Une erreur dit ce qui s'est passé et quoi faire. Un écran vide dit quoi dire à Ultron pour le remplir.
- `say` est lu à voix haute : pas de markdown, pas de liste, phrases courtes.
- Couleurs et typographies : uniquement les variables CSS de `:root`. La braise (`--ember`) est réservée à l'orbe, aux retards et au point final des courbes.
- Les dates sont des jours locaux `AAAA-MM-JJ` ; la semaine commence le lundi.
- Un commentaire explique pourquoi, pas quoi.

## Vérifier avant de dire que c'est fini

1. `npm run check`, puis `npm test` dès qu'il existe.
2. `npm run demo`, et regarde le résultat dans le navigateur, sur les deux vues, y compris en largeur mobile.
3. Si tu as touché au contrat avec l'IA, adapte `dev/fake-claude.js` pour qu'il exerce la nouvelle action.
4. Dis ce que tu as vérifié et comment, et ce que tu n'as pas pu vérifier (micro, vrai Trello, vraie CLI).
