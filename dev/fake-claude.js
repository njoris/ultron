#!/usr/bin/env node
'use strict';
// Faux binaire `claude` pour développer sans consommer l'abonnement (mode mono-coup).
// Lit le prompt sur stdin et répond au format de `claude -p --output-format json`.
const input = require('node:fs').readFileSync(0, 'utf8');
const msg = (input.match(/<message>\n([\s\S]*?)\n<\/message>/) || [])[1] || '';
const { say, actions } = require('./fake-reply')(msg);
process.stdout.write(JSON.stringify({ type: 'result', subtype: 'success', is_error: false, result: JSON.stringify({ say, actions }) }));
