'use strict';

// Garde-fou de facturation (S1-2 / exigence §5) : la CLI ne doit jamais hériter d'une variable
// qui ferait basculer l'usage vers l'API payante au lieu de l'abonnement.
const os = require('node:os');
const path = require('node:path');
process.env.ULTRON_DATA_DIR = path.join(os.tmpdir(), 'ultron-test-data');

const test = require('node:test');
const assert = require('node:assert/strict');
const { claudeEnv } = require('../server.js');

test('claudeEnv retire toutes les variables ANTHROPIC_*, CLAUDE_CODE_* et CLAUDECODE', () => {
  const base = {
    ANTHROPIC_API_KEY: 'sk-ant-xxx',
    ANTHROPIC_BASE_URL: 'https://api.anthropic.com',
    CLAUDE_CODE_SOMETHING: '1',
    CLAUDECODE: '1',
    PATH: '/usr/bin',
    HOME: '/home/joris',
    CLAUDE_MODEL: 'haiku', // ne commence pas par CLAUDE_CODE_ : doit rester
  };
  const env = claudeEnv(base, false);
  assert.equal('ANTHROPIC_API_KEY' in env, false);
  assert.equal('ANTHROPIC_BASE_URL' in env, false);
  assert.equal('CLAUDE_CODE_SOMETHING' in env, false);
  assert.equal('CLAUDECODE' in env, false);
  // Le reste de l'environnement est préservé.
  assert.equal(env.PATH, '/usr/bin');
  assert.equal(env.HOME, '/home/joris');
  assert.equal(env.CLAUDE_MODEL, 'haiku');
});

test('claudeEnv ne modifie pas l’objet d’origine (copie superficielle)', () => {
  const base = { ANTHROPIC_API_KEY: 'sk-ant-xxx', PATH: '/usr/bin' };
  claudeEnv(base, false);
  assert.equal(base.ANTHROPIC_API_KEY, 'sk-ant-xxx'); // l'original garde ses clés
});

test('claudeEnv conserve les variables si useApiKey est vrai (choix explicite)', () => {
  const base = { ANTHROPIC_API_KEY: 'sk-ant-xxx', PATH: '/usr/bin' };
  const env = claudeEnv(base, true);
  assert.equal(env.ANTHROPIC_API_KEY, 'sk-ant-xxx');
});
