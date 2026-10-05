#!/usr/bin/env node
'use strict';
// Faux binaire `claude` pour développer sans consommer l'abonnement.
// Lit le prompt sur stdin et répond au format de `claude -p --output-format json`.
// Ce n'est pas une IA : quelques règles suffisent à exercer le contrat {say, actions}.
const input = require('node:fs').readFileSync(0, 'utf8');
const msg = (input.match(/<message>\n([\s\S]*?)\n<\/message>/) || [])[1] || '';
const num = (re) => { const m = msg.match(re); return m ? Number(m[1].replace(',', '.')) : null; };

const actions = [];
const said = [];
const poids = num(/p[èe]se\s+(\d+(?:[.,]\d+)?)/i);
const km = num(/(\d+(?:[.,]\d+)?)\s*(?:km|kilom)/i);
const sommeil = num(/dormi\s+(\d+(?:[.,]\d+)?)/i);
if (poids != null) { actions.push({ type: 'log_metric', key: 'poids', label: 'Poids', unit: 'kg', agg: 'last', category: 'corps', value: poids }); said.push(`${poids} kilos`); }
if (km != null) { actions.push({ type: 'log_metric', key: 'course', label: 'Course', unit: 'km', agg: 'sum', category: 'sport', value: km }); said.push(`${km} kilomètres`); }
if (sommeil != null) { actions.push({ type: 'log_metric', key: 'sommeil', label: 'Sommeil', unit: 'h', agg: 'last', category: 'sommeil', value: sommeil }); said.push(`${sommeil} heures de sommeil`); }
if (/m[ée]dit/i.test(msg)) { actions.push({ type: 'log_metric', key: 'meditation', label: 'Méditation', unit: '', agg: 'check', category: 'esprit' }); said.push('la méditation'); }
// Thème : « crée un thème cuisine », « range ça dans un thème cuisine » → add_theme (avant les log_metric).
const themeMatch = msg.match(/th[èe]me\s+([\p{L}]+)/iu);
if (themeMatch) {
  const label = themeMatch[1];
  const key = label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_');
  actions.unshift({ type: 'add_theme', key, label: label[0].toUpperCase() + label.slice(1) });
  said.push(`le thème ${label}`);
}

let say;
if (actions.length) say = `C'est noté : ${said.join(', ')}.`;
else if (/stats|objectif|où j'en suis/i.test(msg)) { actions.push({ type: 'show_view', view: 'moi' }); say = 'Voilà tes chiffres. Réponse de démonstration : le vrai Ultron lirait le contexte.'; }
else if (/bilan/i.test(msg)) say = 'Tu as dormi combien d\'heures ?';
else say = 'Réponse de démonstration. Lance « npm start » pour parler au vrai Ultron.';

process.stdout.write(JSON.stringify({ type: 'result', subtype: 'success', is_error: false, result: JSON.stringify({ say, actions }) }));
