#!/usr/bin/env node
'use strict';
// Faux binaire `claude` en mode flux : parle le protocole stream-json de `claude -p`
// (--input-format/--output-format stream-json). Lit des messages user ligne par ligne
// sur stdin, renvoie la réponse en events : des text_delta puis un result final.
// Sert à exercer le mode ULTRON_STREAM=1 sans la vraie CLI.
const readline = require('node:readline');
const reply = require('./fake-reply');

const send = (o) => process.stdout.write(JSON.stringify(o) + '\n');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
  let obj;
  try { obj = JSON.parse(line); } catch { return; }
  const content = obj && obj.message && obj.message.content;
  const text = Array.isArray(content) ? content.map((b) => b && b.text || '').join('') : String(content || '');
  const msg = (text.match(/<message>\n([\s\S]*?)\n<\/message>/) || [])[1] || text;
  const full = JSON.stringify(reply(msg)); // l'objet {say, actions} sérialisé, comme le renverrait le vrai modèle
  send({ type: 'system', subtype: 'init' });
  for (let i = 0; i < full.length; i += 24) {
    send({ type: 'stream_event', event: { type: 'content_block_delta', delta: { type: 'text_delta', text: full.slice(i, i + 24) } } });
  }
  send({ type: 'result', subtype: 'success', is_error: false, result: full });
});
