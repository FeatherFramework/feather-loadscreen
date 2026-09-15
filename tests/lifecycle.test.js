'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');

const manifest = fs.readFileSync('fxmanifest.lua', 'utf8');
const config = fs.readFileSync('config.lua', 'utf8');
const client = fs.readFileSync('client/main.lua', 'utf8');

assert.match(manifest, /loadscreen_manual_shutdown\s+'yes'/);
assert.match(manifest, /shared_script\s+'config\.lua'/);
assert.match(manifest, /client_script\s+'client\/main\.lua'/);
assert.match(config, /ManualShutdown\s*=\s*(true|false)/);
assert.match(config, /ManualShutdownFallbackMs\s*=\s*\d+/);
assert.match(client, /feather-loadscreen:client:character-ready/);
assert.match(client, /ShutdownLoadingScreenNui\(\)/);
assert.doesNotMatch(client, /\bShutdownLoadingScreen\(\)/);

console.log('Load-screen lifecycle checks passed.');
