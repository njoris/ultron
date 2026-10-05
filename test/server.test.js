'use strict';

// Tests unitaires des fonctions pures et quasi-pures de server.js (S1-5).
// node:test, aucune dépendance. On redirige les données vers un dossier temporaire
// AVANT l'import pour ne jamais lire ni écrire dans data/.
const os = require('node:os');
const path = require('node:path');
process.env.ULTRON_DATA_DIR = path.join(os.tmpdir(), 'ultron-test-data');
delete process.env.PORT; // on veut le port par défaut 4242 pour isLocalRequest

const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../server.js');

const emptyDb = () => ({ metrics: {}, entries: [], goals: [], notes: [], memory: [], chat: [] });

/* ───────────── listStatus : colonnes réelles → statut (couvre aussi S1-1) ───────────── */

test('listStatus classe les colonnes du tableau (À faire / En cours / Q&A / Terminer)', () => {
  assert.equal(S.listStatus('À faire'), 'todo');
  assert.equal(S.listStatus('En cours'), 'doing');
  assert.equal(S.listStatus('Q&A'), 'review');
  assert.equal(S.listStatus('Terminer'), 'done');
});

test('listStatus reconnaît les variantes courantes', () => {
  assert.equal(S.listStatus('Backlog'), 'todo');       // défaut
  assert.equal(S.listStatus('To Do'), 'todo');
  assert.equal(S.listStatus('Doing'), 'doing');
  assert.equal(S.listStatus('WIP'), 'doing');
  assert.equal(S.listStatus('En revue'), 'review');
  assert.equal(S.listStatus('À valider'), 'review');
  assert.equal(S.listStatus('Recette'), 'review');
  assert.equal(S.listStatus('Terminé'), 'done');
  assert.equal(S.listStatus('Done'), 'done');
  assert.equal(S.listStatus('Fini'), 'done');
});

/* ───────────── slopePerDay ───────────── */

test('slopePerDay renvoie la pente par jour sur une série croissante régulière', () => {
  const today = '2026-10-05';
  const points = [];
  for (let i = 0; i < 10; i++) points.push({ date: S.addDays(today, -9 + i), value: i }); // +1/jour
  const slope = S.slopePerDay(points, today);
  assert.ok(Math.abs(slope - 1) < 1e-9, `attendu ~1, obtenu ${slope}`);
});

test('slopePerDay renvoie null sans assez de recul', () => {
  const today = '2026-10-05';
  assert.equal(S.slopePerDay([{ date: today, value: 1 }, { date: S.addDays(today, -1), value: 2 }], today), null); // < 3 points
  // 3 points mais étalés sur moins de 5 jours
  const narrow = [0, 1, 2].map((n) => ({ date: S.addDays(today, -n), value: n }));
  assert.equal(S.slopePerDay(narrow, today), null);
});

/* ───────────── streaks ───────────── */

test('streaks calcule la série en cours et le record', () => {
  const t = '2026-10-05';
  const dates = [
    t, S.addDays(t, -1), S.addDays(t, -2),                               // série en cours = 3
    S.addDays(t, -10), S.addDays(t, -11), S.addDays(t, -12), S.addDays(t, -13), // record = 4
  ];
  const r = S.streaks(dates, t);
  assert.equal(r.current, 3);
  assert.equal(r.best, 4);
});

test('streaks compte depuis hier si aujourd’hui n’est pas encore saisi', () => {
  const t = '2026-10-05';
  const r = S.streaks([S.addDays(t, -1), S.addDays(t, -2)], t);
  assert.equal(r.current, 2);
});

/* ───────────── evalGoal ───────────── */

test('evalGoal (reach) : objectif atteint', () => {
  const t = '2026-10-05';
  const m = { agg: 'last', unit: 'kg', points: [{ date: t, value: 74 }], slope: null };
  const g = S.evalGoal({ kind: 'reach', target: 75, start: 84 }, m, t);
  assert.equal(g.reached, true);
  assert.equal(g.status, 'reached');
});

test('evalGoal (reach) : estime une date quand la tendance va vers l’objectif', () => {
  const t = '2026-10-05';
  const m = { agg: 'last', unit: 'kg', points: [{ date: t, value: 75 }], slope: -0.5 };
  const g = S.evalGoal({ kind: 'reach', target: 70, start: 80, deadline: null }, m, t);
  assert.equal(g.reached, false);
  assert.equal(g.status, 'on_track');
  assert.equal(g.eta, S.addDays(t, 10)); // 5 kg à -0,5/jour = 10 jours
});

test('evalGoal (reach) : inconnu sans aucune mesure', () => {
  const t = '2026-10-05';
  const g = S.evalGoal({ kind: 'reach', target: 70, start: 80 }, { agg: 'last', unit: 'kg', points: [], slope: null }, t);
  assert.equal(g.status, 'unknown');
});

test('evalGoal (weekly) : atteint et en retard', () => {
  const t = '2026-10-05';
  const reached = S.evalGoal({ kind: 'weekly', target: 5 }, { agg: 'check', unit: '', week: 5 }, t);
  assert.equal(reached.reached, true);
  assert.equal(reached.status, 'reached');
  const behind = S.evalGoal({ kind: 'weekly', target: 10 }, { agg: 'check', unit: '', week: 0 }, t);
  assert.equal(behind.reached, false);
  assert.equal(behind.status, 'behind');
});

test('evalGoal (reach) : le lissage s’appuie sur la moyenne 7 jours (S2-3)', () => {
  const t = '2026-10-05';
  const base = { agg: 'last', unit: 'kg', avg7: 76, points: [{ date: t, value: 70 }], slope: -0.5 };
  // Sans lissage, la dernière valeur (70) a déjà dépassé l'objectif (75, en descente) → atteint.
  const raw = S.evalGoal({ kind: 'reach', target: 75, start: 80 }, { ...base, smooth: false }, t);
  assert.equal(raw.reached, true);
  // Avec lissage, on utilise la moyenne 7 jours (76) → pas encore atteint.
  const smoothed = S.evalGoal({ kind: 'reach', target: 75, start: 80 }, { ...base, smooth: true }, t);
  assert.equal(smoothed.reached, false);
  assert.equal(smoothed.current, 76);
});

/* ───────────── parseReply ───────────── */

test('parseReply lit un JSON simple', () => {
  assert.deepEqual(S.parseReply('{"say":"ok","actions":[]}'), { say: 'ok', actions: [] });
});

test('parseReply extrait un JSON dans un bloc de code', () => {
  const r = S.parseReply('```json\n{"say":"hi","actions":[{"type":"show_view","view":"moi"}]}\n```');
  assert.equal(r.say, 'hi');
  assert.equal(r.actions.length, 1);
});

test('parseReply extrait un JSON entouré de texte', () => {
  const r = S.parseReply('Bien sûr : {"say":"yo","actions":[]} voilà.');
  assert.equal(r.say, 'yo');
});

test('parseReply rend le texte brut quand ce n’est pas du JSON', () => {
  const r = S.parseReply('juste du texte parlé');
  assert.equal(r.say, 'juste du texte parlé');
  assert.deepEqual(r.actions, []);
});

/* ───────────── applyActions ───────────── */

test('applyActions enregistre une mesure et normalise la clé', () => {
  S.__setDb(emptyDb());
  const applied = S.applyActions([{ type: 'log_metric', key: 'Poids', label: 'Poids', unit: 'kg', agg: 'last', category: 'corps', value: 80 }]);
  const db = S.__getDb();
  assert.ok(db.metrics.poids, 'la mesure poids est créée');
  assert.equal(db.entries.length, 1);
  assert.equal(db.entries[0].value, 80);
  assert.equal(db.entries[0].key, 'poids');
  assert.equal(applied.length, 1);
  assert.equal(applied[0].type, 'log_metric');
});

test('applyActions : une habitude sans valeur vaut 1', () => {
  S.__setDb(emptyDb());
  S.applyActions([{ type: 'log_metric', key: 'Méditation', agg: 'check', category: 'esprit' }]);
  const db = S.__getDb();
  assert.equal(db.entries.length, 1);
  assert.equal(db.entries[0].value, 1);
  assert.equal(db.metrics[db.entries[0].key].agg, 'check');
});

test('applyActions : valeur illisible → rien enregistré', () => {
  S.__setDb(emptyDb());
  const applied = S.applyActions([{ type: 'log_metric', key: 'poids', value: 'abc' }]);
  assert.equal(S.__getDb().entries.length, 0);
  assert.equal(applied.length, 0);
});

test('applyActions : objectif, note, mémoire, suppression et vue', () => {
  S.__setDb(emptyDb());
  S.applyActions([{ type: 'log_metric', key: 'poids', agg: 'last', category: 'corps', value: 80 }]);
  let db = S.__getDb();
  const entryId = db.entries[0].id;

  S.applyActions([{ type: 'set_goal', key: 'poids', target: 75, kind: 'reach' }]);
  db = S.__getDb();
  assert.equal(db.goals.length, 1);
  assert.equal(db.goals[0].kind, 'reach');
  assert.equal(db.goals[0].start, 80); // dernière valeur de la série

  S.applyActions([{ type: 'add_note', text: 'journée chargée' }]);
  assert.equal(S.__getDb().notes.length, 1);

  const rem = S.applyActions([{ type: 'remember', text: 'préfère courir le matin' }]);
  db = S.__getDb();
  assert.equal(db.memory.length, 1);
  assert.equal(rem[0].type, 'remember');
  const memId = db.memory[0].id;
  S.applyActions([{ type: 'forget', id: memId }]);
  assert.equal(S.__getDb().memory.length, 0);

  S.applyActions([{ type: 'delete_entry', id: entryId }]);
  assert.equal(S.__getDb().entries.length, 0);

  const view = S.applyActions([{ type: 'show_view', view: 'moi' }]);
  assert.equal(view.view, 'moi');
});

test('applyActions : add_theme crée un thème, réutilisable aussitôt par log_metric (S2-5)', () => {
  S.__setDb(emptyDb());
  const applied = S.applyActions([
    { type: 'add_theme', key: 'Cuisine', label: 'Cuisine' },
    { type: 'log_metric', key: 'cafe', agg: 'sum', unit: 'tasses', category: 'cuisine', value: 2 },
  ]);
  const db = S.__getDb();
  assert.ok(db.themes.some((t) => t.key === 'cuisine'), 'le thème cuisine existe');
  assert.equal(db.metrics.cafe.category, 'cuisine'); // le log_metric suivant a pu l'utiliser
  assert.ok(applied.some((a) => a.type === 'add_theme'));
});

/* ───────────── isLocalRequest ───────────── */

test('isLocalRequest n’accepte que l’hôte local attendu', () => {
  const port = S.CFG.port;
  assert.equal(S.isLocalRequest({ headers: { host: `localhost:${port}` } }), true);
  assert.equal(S.isLocalRequest({ headers: { host: `127.0.0.1:${port}` } }), true);
  assert.equal(S.isLocalRequest({ headers: { host: 'example.com' } }), false);
  assert.equal(S.isLocalRequest({ headers: { host: `localhost:${port}`, origin: `http://localhost:${port}` } }), true);
  assert.equal(S.isLocalRequest({ headers: { host: `localhost:${port}`, origin: 'http://evil.example' } }), false);
});
