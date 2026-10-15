'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'feather-loadscreen-package-'));
try {
    const manifest = fs.readFileSync('fxmanifest.lua', 'utf8');
    const packaged = [...manifest.matchAll(/'((?:web\/|client\/)[^']+|config\.lua)'/g)].map(m => m[1]);
    for (const entry of new Set(packaged)) {
        const entries = entry.endsWith('/*')
            ? fs.readdirSync(entry.slice(0, -2)).map(name => `${entry.slice(0, -1)}${name}`) : [entry];
        for (const source of entries) {
            assert(fs.statSync(source).isFile(), source);
            const target = path.join(staging, source);
            fs.mkdirSync(path.dirname(target), {recursive:true});
            fs.copyFileSync(source, target);
        }
    }
    const window = {};
    vm.runInNewContext(fs.readFileSync(path.join(staging, 'web/config.js'), 'utf8'), {window});
    for (const asset of [...window.FeatherLoadscreenConfig.backgrounds, window.FeatherLoadscreenConfig.logo]) {
        assert(fs.existsSync(path.join(staging, 'web', asset)), `missing staged asset ${asset}`);
    }
    for (const entry of ['web/index.html','web/css/style.css','web/js/script.js','config.lua','client/main.lua']) {
        assert(fs.existsSync(path.join(staging, entry)), entry);
    }
    console.log('Fresh staging package: all manifest files and configured media present.');
} finally {
    fs.rmSync(staging, {recursive:true, force:true});
}
