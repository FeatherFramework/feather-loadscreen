(() => {
    'use strict';

    const config = window.FeatherLoadscreenConfig && typeof window.FeatherLoadscreenConfig === 'object'
        ? window.FeatherLoadscreenConfig : {};
    function text(value, fallback = '', limit = 160) {
        return typeof value === 'string' && value.trim() ? Array.from(value.trim()).slice(0, limit).join('') : fallback;
    }
    function interval(value, fallback) {
        return typeof value === 'number' && Number.isFinite(value) ? Math.min(120000, Math.max(5000, value)) : fallback;
    }
    const media = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    let reducedMotion = false;
    let disposed = false;
    const root = document.documentElement;
    const elements = {
        logo: document.getElementById('server-logo'),
        eyebrow: document.getElementById('eyebrow'),
        title: document.getElementById('server-title'),
        subtitle: document.getElementById('server-subtitle'),
        status: document.getElementById('status-text'),
        value: document.getElementById('progress-value'),
        track: document.getElementById('progress-track'),
        bar: document.getElementById('progress-bar'),
        tip: document.getElementById('tip-text'),
        links: document.getElementById('community-links'),
        discord: document.getElementById('discord-link'),
        website: document.getElementById('website-link'),
        build: document.getElementById('build-label')
    };
    const configuredStatus = config.statusMessages && typeof config.statusMessages === 'object'
        ? config.statusMessages
        : {};
    const status = {
        connecting: text(configuredStatus.connecting, 'Connecting to server'),
        initializing: text(configuredStatus.initializing, 'Initializing game'),
        map: text(configuredStatus.map, 'Preparing the frontier'),
        environment: text(configuredStatus.environment, 'Setting up the world'),
        session: text(configuredStatus.session, 'Joining your session'),
        validating: text(configuredStatus.validating, 'Validating server assets'),
        downloading: text(configuredStatus.downloading, 'Downloading server assets'),
        dataFiles: text(configuredStatus.dataFiles, 'Loading game data'),
        scripts: text(configuredStatus.scripts, 'Starting client systems'),
        complete: text(configuredStatus.complete, 'Server assets loaded; waiting for character menu')
    };
    const stages = {
        INIT_BEFORE_MAP_LOADED: status.initializing,
        MAP_LOAD_PENDING: status.map,
        INIT_AFTER_MAP_LOADED: status.environment,
        INIT_SESSION: status.session
    };
    let progress = 0;
    let tipIndex = 0;
    let tipTimer;
    let backgroundTimer;
    let previewTimer;

    function setText(element, value) {
        if (progress >= 100 && element === elements.status) value = status.complete;
        const normalized = text(value, '', element === elements.subtitle || element === elements.tip ? 512 : 160);
        if (normalized) element.textContent = normalized;
    }

    function safeImagePath(value) {
        if (typeof value !== 'string') return null;
        const path = value.trim();
        if (path.length > 256 || !/^assets\/images\/[a-z0-9_-]+\.(?:png|jpe?g|webp|gif)$/i.test(path)) return null;
        return path;
    }

    function setProgress(fraction) {
        if (typeof fraction !== 'number') return;
        const parsed = fraction;
        if (!Number.isFinite(parsed)) return;
        const next = Math.max(0, Math.min(100, Math.round(parsed * 100)));
        progress = Math.max(progress, next);
        elements.bar.style.width = `${progress}%`;
        elements.value.textContent = `${progress}%`;
        elements.track.setAttribute('aria-valuenow', String(progress));
        if (progress >= 100) setText(elements.status, status.complete);
    }

    function setStatus(message) {
        if (typeof message !== 'string') return;
        const normalized = message.trim();
        if (stages[normalized]) setText(elements.status, stages[normalized]);
        else if (/validat/i.test(normalized)) setText(elements.status, status.validating);
        else if (/download/i.test(normalized)) setText(elements.status, status.downloading);
        else if (/session/i.test(normalized)) setText(elements.status, status.session);
    }

    const tips = Array.isArray(config.tips)
        ? config.tips.slice(0, 64).map(tip => text(tip, '', 512)).filter(Boolean)
        : [];
    function showTip() {
        elements.tip.hidden = tips.length === 0;
        if (!tips.length) return;
        elements.tip.textContent = tips[tipIndex % tips.length];
        tipIndex += 1;
    }

    const configuredBackgrounds = Array.isArray(config.backgrounds)
        ? config.backgrounds
        : [config.background];
    const backgrounds = configuredBackgrounds.slice(0, 64).map(safeImagePath).filter(Boolean);
    const backdropLayers = Array.from(document.querySelectorAll('.backdrop'));
    const backgroundImages = Array.from(document.querySelectorAll('.background-image'));
    let backgroundIndex = config.randomizeFirstBackground !== false && backgrounds.length > 1
        ? Math.floor(Math.random() * backgrounds.length)
        : 0;
    let activeBackdrop = 0;

    function setLayerBackground(index, path) {
        if (backgroundImages[index]) backgroundImages[index].src = path;
    }

    let imageGeneration = 0;
    let hasBackground = false;
    const failedBackgrounds = new Set();
    function requestBackground(index) {
        const path = backgrounds[index];
        if (!path || disposed) return;
        const generation = ++imageGeneration;
        const image = new Image();
        image.addEventListener('load', () => {
            if (disposed || generation !== imageGeneration) return;
            const next = hasBackground ? 1 - activeBackdrop : activeBackdrop;
            setLayerBackground(next, path);
            backdropLayers[next].classList.add('is-active');
            if (next !== activeBackdrop) backdropLayers[activeBackdrop].classList.remove('is-active');
            activeBackdrop = next;
            hasBackground = true;
        }, { once: true });
        image.addEventListener('error', () => {
            if (disposed || generation !== imageGeneration) return;
            failedBackgrounds.add(path);
            // Try each candidate once when no usable image exists; keep the last good image otherwise.
            if (!hasBackground) rotateBackground();
        }, { once: true });
        image.src = path;
    }
    function rotateBackground() {
        if (!backgrounds.length || backdropLayers.length < 2) return;
        for (let attempt = 0; attempt < backgrounds.length; attempt += 1) {
            backgroundIndex = (backgroundIndex + 1) % backgrounds.length;
            if (!failedBackgrounds.has(backgrounds[backgroundIndex])) {
                requestBackground(backgroundIndex);
                return;
            }
        }
    }

    function safeWebUrl(value) {
        if (typeof value !== 'string' || !value.trim()) return null;
        try {
            const url = new URL(value.trim());
            return url.protocol === 'https:' ? url.href : null;
        } catch (_) {
            return null;
        }
    }

    function configureLink(element, value) {
        const url = safeWebUrl(value);
        if (!url) return false;
        element.href = url;
        element.hidden = false;
        return true;
    }

    setText(elements.eyebrow, config.eyebrow);
    setText(elements.title, config.title);
    setText(elements.subtitle, config.subtitle);
    document.title = text(config.title, 'Feather Framework');
    setText(elements.status, status.connecting);
    if (typeof config.buildLabel === 'string' && config.buildLabel.trim()) {
        setText(elements.build, config.buildLabel);
        elements.build.hidden = false;
    }
    const links = config.links && typeof config.links === 'object' ? config.links : {};
    const hasDiscord = configureLink(elements.discord, links.discord);
    const hasWebsite = configureLink(elements.website, links.website);
    elements.links.hidden = !hasDiscord && !hasWebsite;
    if (typeof config.accent === 'string' && /^#[0-9a-f]{6}$/i.test(config.accent)) {
        root.style.setProperty('--accent', config.accent);
    }
    const logo = safeImagePath(config.logo);
    if (logo) {
        elements.logo.alt = text(config.logoAlt);
        elements.logo.hidden = false;
        elements.logo.addEventListener('error', () => { elements.logo.hidden = true; }, { once: true });
        elements.logo.src = logo;
    }

    if (backgrounds.length) {
        requestBackground(backgroundIndex);
    }
    if (typeof config.backgroundPosition === 'string' && config.backgroundPosition.length <= 64
        && /^[a-z\d.% -]+$/i.test(config.backgroundPosition)) {
        root.style.setProperty('--background-position', config.backgroundPosition);
    }
    const opacity = typeof config.overlayOpacity === 'number' ? config.overlayOpacity : NaN;
    if (Number.isFinite(opacity)) {
        root.style.setProperty('--overlay-opacity', String(Math.max(0, Math.min(1, opacity))));
    }

    const labels = config.accessibility && typeof config.accessibility === 'object' ? config.accessibility : {};
    elements.track.setAttribute('aria-label', text(labels.progress, 'Server asset loading progress'));
    elements.links.setAttribute('aria-label', text(labels.community, 'Community links'));
    setText(elements.discord, text(labels.discord, 'Discord'));
    setText(elements.website, text(labels.website, 'Website'));
    elements.tip.setAttribute('data-label', text(labels.tip, 'Tip'));
    root.setAttribute('lang', /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(config.language) ? config.language : 'en');
    function applyMotion() {
        reducedMotion = config.reducedMotion === true || (config.reducedMotion !== false && !!(media && media.matches));
        root.setAttribute('data-reduced-motion', String(reducedMotion));
        if (tipTimer) window.clearInterval(tipTimer);
        if (backgroundTimer) window.clearInterval(backgroundTimer);
        tipTimer = backgroundTimer = undefined;
        if (!disposed && !reducedMotion) {
            if (tips.length > 1) tipTimer = window.setInterval(showTip, interval(config.tipIntervalMs, 9000));
            if (backgrounds.length > 1) backgroundTimer = window.setInterval(rotateBackground, interval(config.backgroundIntervalMs, 12000));
        }
    }
    showTip();
    applyMotion();
    if (media && media.addEventListener) media.addEventListener('change', applyMotion);

    window.addEventListener('message', event => {
        const data = event.data;
        if (!data || typeof data !== 'object') return;
        switch (data.eventName) {
            case 'loadProgress':
                setProgress(data.loadFraction);
                break;
            case 'onLogLine':
                setStatus(data.message);
                break;
            case 'startDataFileEntries':
            case 'onDataFileEntry':
            case 'endDataFileEntries':
                setText(elements.status, status.dataFiles);
                break;
            case 'performMapLoadFunction':
                setText(elements.status, status.map);
                break;
            case 'startInitFunction':
            case 'startInitFunctionOrder':
            case 'initFunctionInvoking':
            case 'initFunctionInvoked':
            case 'endInitFunction':
                setText(elements.status, status.scripts);
                break;
        }
    });

    // Open index.html?preview=1 in a browser to inspect the screen without RedM.
    if (new URLSearchParams(window.location.search).get('preview') === '1') {
        const previewStages = Object.keys(stages);
        let tick = 0;
        previewTimer = window.setInterval(() => {
            tick += 1;
            setProgress(Math.min(1, tick / 20));
            if (tick % 5 === 1) setStatus(previewStages[Math.floor(tick / 5) % previewStages.length]);
            if (tick >= 20) window.clearInterval(previewTimer);
        }, 350);
    }

    window.addEventListener('beforeunload', () => {
        disposed = true;
        imageGeneration += 1;
        if (media && media.removeEventListener) media.removeEventListener('change', applyMotion);
        if (tipTimer) window.clearInterval(tipTimer);
        if (backgroundTimer) window.clearInterval(backgroundTimer);
        if (previewTimer) window.clearInterval(previewTimer);
    });
})();
