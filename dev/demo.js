#!/usr/bin/env node
'use strict';
// Mode démonstration : faux Trello, fausses sessions Claude Code, fausse IA, données inventées.
// Rien ne touche à ./data ni à ton abonnement.   →   npm run demo
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const DEMO = path.join(ROOT, 'data-demo');
const PORT = Number(process.env.PORT) || 4343;
const TRELLO_PORT = PORT + 1;
const iso = (days) => new Date(Date.now() + days * 864e5).toISOString();
const day = (days) => { const d = new Date(Date.now() + days * 864e5); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/* 1. faux Trello : mêmes routes et mêmes champs que ceux lus par server.js */
const card = (id, name, o = {}) => ({ id, name, shortUrl: 'https://trello.com/c/' + id, due: null, dueComplete: false, labels: [], dateLastActivity: iso(0), ...o });
const BOARDS = [{ id: 'b1', name: 'Homepedia', url: 'https://trello.com/b/demo1', dateLastActivity: iso(0) }, { id: 'b2', name: 'Paka', url: 'https://trello.com/b/demo2', dateLastActivity: iso(-3) }];
const LISTS = {
  b1: [
    { id: 'l1', name: 'À faire', cards: [card('c1', 'Filtre par quartier', { labels: [{ name: 'Sprint 3' }] }), card('c2', 'Export PDF des fiches', { labels: [{ name: 'Sprint 3' }] })] },
    { id: 'l2', name: 'En cours', cards: [card('c4', 'Pagination des annonces', { labels: [{ name: 'Sprint 2' }], due: iso(0) }), card('c5', 'Carte interactive des prix', { due: iso(-2) })] },
    { id: 'l3', name: 'Q&A', cards: [card('c6', 'Page de connexion')] },
    { id: 'l4', name: 'Terminer', cards: [card('c7', 'Maquettes'), card('c8', 'Schéma de base'), card('c9', 'CI')] },
  ],
  b2: [{ id: 'm1', name: 'À faire', cards: [card('d1', 'Migration Postgres 16')] }, { id: 'm2', name: 'En cours', cards: [] }, { id: 'm3', name: 'Terminer', cards: [card('d2', 'Auth')] }],
};
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  res.setHeader('content-type', 'application/json');
  if (u.pathname === '/1/members/me/boards') return res.end(JSON.stringify(BOARDS));
  const m = u.pathname.match(/^\/1\/boards\/(\w+)\/lists$/);
  if (m && LISTS[m[1]]) return res.end(JSON.stringify(LISTS[m[1]]));
  res.statusCode = 404; res.end('{}');
}).listen(TRELLO_PORT, '127.0.0.1');

/* 2. fausses sessions Claude Code, au format des fichiers ~/.claude/projects */
const home = path.join(DEMO, 'claude-home');
const writeSession = (dir, id, lines, minutesAgo) => {
  const d = path.join(home, 'projects', dir);
  fs.mkdirSync(d, { recursive: true });
  const file = path.join(d, id + '.jsonl');
  fs.writeFileSync(file, lines.map((l) => JSON.stringify(l)).join('\n') + '\n');
  const t = new Date(Date.now() - minutesAgo * 60000);
  fs.utimesSync(file, t, t);
};
writeSession('-dev-homepedia', 'demo-a', [
  { type: 'user', message: { role: 'user', content: 'Ajoute la pagination sur la liste des annonces' }, cwd: '/dev/homepedia', gitBranch: 'feat/pagination' },
  { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'La pagination est en place sur /annonces, 20 par page. Les tests passent. Tu veux que j\'ajoute le tri par prix ?' }] } },
], 4);
writeSession('-dev-paka', 'demo-b', [
  { type: 'user', message: { role: 'user', content: 'Migre la base vers Postgres 16' }, cwd: '/dev/paka', gitBranch: 'main' },
  { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'Je lance la migration.' }, { type: 'tool_use', id: 't', name: 'Bash', input: { command: 'docker compose down -v && docker compose up -d' } }] } },
], 12);

/* 3. sept semaines de suivi inventé (une seule fois : supprime data-demo/ pour repartir de zéro) */
const dbFile = path.join(DEMO, 'ultron.json');
if (!fs.existsSync(dbFile)) {
  let n = 0, seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const db = {
    metrics: {
      poids: { label: 'Poids', unit: 'kg', agg: 'last', category: 'corps' },
      course: { label: 'Course', unit: 'km', agg: 'sum', category: 'sport' },
      sommeil: { label: 'Sommeil', unit: 'h', agg: 'last', category: 'sommeil' },
      humeur: { label: 'Humeur', unit: '/5', agg: 'last', category: 'esprit' },
      meditation: { label: 'Méditation', unit: '', agg: 'check', category: 'esprit' },
    },
    entries: [], notes: [], memory: [], chat: [],
    goals: [
      { id: 'g1', key: 'poids', kind: 'reach', target: 75, start: 84.2, deadline: day(87), createdAt: iso(-48) },
      { id: 'g2', key: 'course', kind: 'weekly', target: 15, start: null, deadline: null, createdAt: iso(-48) },
    ],
  };
  const add = (key, off, value) => db.entries.push({ id: 'demo' + (++n), key, value, date: day(-off), note: '', ts: iso(-off) });
  for (let off = 48; off >= 1; off--) {
    if (off % 5 !== 3) add('poids', off, Math.round((84.2 - (48 - off) * 0.085 + (rnd() - 0.5) * 0.7) * 10) / 10);
    if (off % 3 === 0) add('course', off, Math.round((3 + rnd() * 4.5) * 10) / 10);
    if (off < 22) add('sommeil', off, Math.round((5.8 + rnd() * 2.2) * 10) / 10);
    if (off < 22 && off % 4 !== 0) add('humeur', off, 3 + Math.floor(rnd() * 3));
    if (off <= 6 || (off < 30 && off % 3 !== 0)) add('meditation', off, 1);
  }
  db.notes.push({ id: 'n1', text: 'Genou droit sensible après la sortie longue.', date: day(-2), ts: iso(-2) });
  db.memory.push({ id: 'm1', text: 'Court le matin avant le travail.', ts: iso(-15) });
  fs.mkdirSync(DEMO, { recursive: true });
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 1));
}

/* 4. le vrai serveur, branché sur tout ce qui précède */
const child = spawn(process.execPath, [path.join(ROOT, 'server.js')], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: String(PORT),
    ULTRON_DATA_DIR: DEMO,
    TRELLO_KEY: 'demo', TRELLO_TOKEN: 'demo', TRELLO_BOARDS: '',
    TRELLO_API_BASE: `http://127.0.0.1:${TRELLO_PORT}/1`,
    CLAUDE_HOME: home,
    CLAUDE_BIN: path.join(__dirname, 'fake-claude.js'), // sous Windows : lance plutôt `node dev/fake-claude.js` via un .cmd
  },
});
child.on('exit', (code) => process.exit(code ?? 0));
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
