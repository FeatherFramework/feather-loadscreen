'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function element() {
    const attributes = {};
    return {
        textContent: '', hidden: false, src: '', alt: '', href: '',
        style: { values: {}, setProperty(key, value) { this.values[key] = value; } },
        classList: { add() {}, remove() {} },
        setAttribute(key, value) { attributes[key] = value; },
        getAttribute(key) { return attributes[key]; },
        addEventListener() {}
    };
}

const ids = Object.fromEntries([
    'server-logo', 'eyebrow', 'server-title', 'server-subtitle', 'status-text',
    'progress-value', 'progress-track', 'progress-bar', 'tip-text',
    'community-links', 'discord-link', 'website-link', 'build-label'
].map(id => [id, element()]));
const backdrops = [element(), element()];
const backgroundImages = [element(), element()];
const listeners = {};
const timers = new Map();
let timerId = 0;
const media = { matches: false, addEventListener(_, fn) { this.change = fn; }, removeEventListener() { this.change = null; } };
const window = {
    matchMedia() { return media; },
    location: { search: '' },
    addEventListener(name, callback) { listeners[name] = callback; },
    setInterval(fn, ms) { timers.set(++timerId, {fn, ms}); return timerId; },
    clearInterval(id) { timers.delete(id); }
};
const document = {
    title: '',
    documentElement: element(),
    getElementById(id) { return ids[id]; },
    querySelectorAll(selector) {
        if (selector === '.backdrop') return backdrops;
        if (selector === '.background-image') return backgroundImages;
        return [];
    }
};
const requests = [];
class Image {
    constructor() { this.handlers = {}; requests.push(this); }
    addEventListener(name, fn) { this.handlers[name] = fn; }
    set src(value) { this.path = value; }
    load() { this.handlers.load(); }
    error() { this.handlers.error(); }
}
const context = vm.createContext({ window, document, Image, URL, URLSearchParams, Number, Array });
vm.runInContext(fs.readFileSync('web/config.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('web/js/script.js', 'utf8'), context);

assert.equal(document.title, 'Welcome to the Frontier');
assert.equal(ids['build-label'].textContent, 'Alpha');
assert.equal(ids['community-links'].hidden, true, 'empty optional links stay hidden');
requests[0].load();
assert.match(backgroundImages[0].src, /background-.+\.webp/);
listeners.message({ data: { eventName: 'loadProgress', loadFraction: 0.52 } });
assert.equal(ids['progress-value'].textContent, '52%');
assert.equal(ids['progress-track'].getAttribute('aria-valuenow'), '52');
listeners.message({ data: { eventName: 'loadProgress', loadFraction: 0.2 } });
assert.equal(ids['progress-value'].textContent, '52%', 'progress must not move backward');
listeners.message({ data: { eventName: 'onLogLine', message: 'INIT_SESSION' } });
assert.equal(ids['status-text'].textContent, 'Joining your session');
listeners.message({ data: { eventName: 'startDataFileEntries' } });
assert.equal(ids['status-text'].textContent, 'Loading game data');
listeners.message({ data: { eventName: 'initFunctionInvoking' } });
assert.equal(ids['status-text'].textContent, 'Starting client systems');
listeners.message({ data: { eventName: 'performMapLoadFunction' } });
assert.equal(ids['status-text'].textContent, 'Preparing the frontier');
listeners.message({ data: { eventName: 'loadProgress', loadFraction: 2 } });
assert.equal(ids['progress-value'].textContent, '100%');
assert.equal(ids['status-text'].textContent, 'Server assets loaded; waiting for character menu');
listeners.message({ data: { eventName: 'onLogLine', message: 'INIT_SESSION' } });
assert.equal(ids['status-text'].textContent, 'Server assets loaded; waiting for character menu');
listeners.message({ data: null });

console.log('Load-screen UI checks passed.');

const rotate = [...timers.values()].find(t => t.ms === 12000).fn;
rotate(); const older = requests.at(-1);
rotate(); const newer = requests.at(-1);
newer.load(); const displayed = backgroundImages.map(i => i.src);
older.load(); assert.deepEqual(backgroundImages.map(i => i.src), displayed, 'stale completion ignored');
rotate(); requests.at(-1).error(); assert.deepEqual(backgroundImages.map(i => i.src), displayed, 'failed later image keeps good image');
media.matches = true; media.change(); assert.equal(timers.size, 0, 'reduced motion stops content rotation');
assert.equal(document.documentElement.getAttribute('data-reduced-motion'), 'true');
media.matches = false; media.change(); assert.equal(timers.size, 2);
rotate(); const pending = requests.at(-1);
listeners.beforeunload(); pending.load(); assert.equal(timers.size, 0); assert.equal(media.change, null);
assert.deepEqual(backgroundImages.map(i => i.src), displayed, 'unloaded page ignores pending image');

function boot(config, search = '') {
    const localIds = Object.fromEntries(Object.keys(ids).map(id => [id, element()]));
    const localTimers = new Map(); const localRequests = []; const localListeners = {};
    class MockImage extends Image { constructor() { super(); localRequests.push(this); } }
    const localWindow = { FeatherLoadscreenConfig: config, location: {search},
        addEventListener(name, fn) { localListeners[name] = fn; },
        setInterval(fn, ms) { localTimers.set(++timerId, {fn, ms}); return timerId; },
        clearInterval(id) { localTimers.delete(id); } };
    const localDocument = { ...document, documentElement: element(), getElementById(id) { return localIds[id]; },
        querySelectorAll(selector) { return [element(), element()]; } };
    vm.runInNewContext(fs.readFileSync('web/js/script.js', 'utf8'), {window: localWindow, document: localDocument, Image: MockImage, URL, URLSearchParams});
    return {ids: localIds, timers: localTimers, requests: localRequests, listeners: localListeners, document: localDocument};
}
const broken = boot({backgrounds: ['assets/images/a.webp', 'assets/images/b.webp'], randomizeFirstBackground: false});
broken.requests[0].error(); assert.equal(broken.requests[1].path, 'assets/images/b.webp');
broken.requests[1].error(); assert.equal(broken.requests.length, 2, 'all broken candidates terminate retry');
const invalid = boot({title: {}, tips: [false, {}, 'valid'], backgrounds: ['//remote/image.png', '../a.png'],
    tipIntervalMs: Infinity, backgroundIntervalMs: NaN, overlayOpacity: Infinity,
    statusMessages: {complete: {}}, links: {discord: 'http://example.com'}, accessibility: {progress: {}}, language: {}});
assert.equal(invalid.requests.length, 0); assert.equal(invalid.ids['community-links'].hidden, true);
assert.equal(invalid.document.title, 'Feather Framework');
assert.equal(invalid.ids['progress-track'].getAttribute('aria-label'), 'Server asset loading progress');
for (const payload of [null, false, {}, {eventName: 'loadProgress', loadFraction: '1'}, {eventName: 'loadProgress', loadFraction: Infinity}]) invalid.listeners.message({data: payload});
assert.equal(invalid.ids['progress-value'].textContent, '');
const single = boot({backgrounds: ['assets/images/a.webp'], tips: ['a'], reducedMotion: true});
assert.equal(single.timers.size, 0); single.requests[0].load();
const bounded = boot({tips: ['x'.repeat(1000), 'y'], tipIntervalMs: 999999, backgrounds: [],
    accessibility: {discord: 'Community', tip: 'Hint'}, links: {discord: 'https://example.com'}});
assert.equal([...bounded.timers.values()][0].ms, 120000);
assert.equal(bounded.ids['tip-text'].textContent.length, 512);
assert.equal(bounded.ids['discord-link'].textContent, 'Community');
assert.equal(bounded.ids['tip-text'].getAttribute('data-label'), 'Hint');
const preview = boot({}, '?preview=1');
const tick = [...preview.timers.values()][0].fn;
for (let i=0; i<20; i++) tick();
assert.equal(preview.ids['progress-value'].textContent, '100%'); assert.equal(preview.timers.size, 0);
const empty = boot(null); assert.equal(empty.requests.length, 0);
const boundedLists = boot({backgrounds: Array.from({length: 100}, (_, i) => `assets/images/image${i}.webp`),
    tips: Array(100).fill('tip'), backgroundIntervalMs: -10, tipIntervalMs: NaN, reducedMotion: false});
assert.deepEqual([...boundedLists.timers.values()].map(t => t.ms), [9000, 5000]);
for (let i=0; i<70; i++) boundedLists.requests.at(-1).error();
assert.equal(boundedLists.requests.length, 64, 'candidate count bounded');
