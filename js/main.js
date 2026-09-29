/**
 * main.js — comportamento do portfolio
 * ------------------------------------
 * O conteúdo já vem pronto do HTML (gerado por build.mjs a partir de
 * content/*.json). Aqui só há comportamento:
 *   1. Theme   — troca de tema via radio + localStorage
 *   2. Nav     — menu mobile e navegação por grupos
 *   3. Modals  — player de vídeo e modal de informação (com foco preso e Esc)
 *   4. i18n    — troca de idioma sem reload, re-renderizando via render.js
 *
 * Depende de ./render.js como ES module.
 */

import { renderMain, renderHeader, renderFooter, buildJsonLd, fill, SITE, GROUPS } from './render.js';

/* ============================================================
   1. THEME
   ============================================================ */

const Theme = (() => {
    const THEMES = ['theme-cyan', 'theme-purple', 'theme-green'];

    function init() {
        const saved = localStorage.getItem('theme');
        if (saved && THEMES.includes(saved)) {
            document.documentElement.classList.add(saved);
            const radio = document.querySelector(`input[name="theme"][value="${saved}"]`);
            if (radio) radio.checked = true;
        }

        document.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', function () {
                THEMES.forEach(t => document.documentElement.classList.remove(t));
                document.documentElement.classList.add(this.value);
                localStorage.setItem('theme', this.value);
            });
        });
    }

    return { init };
})();

/* ============================================================
   2. NAV
   ============================================================ */

const Nav = (() => {
    function init() {
        const hamburger = document.getElementById('hamburgerBtn');
        const navLinks = document.getElementById('navLinks');
        if (!hamburger || !navLinks) return;

        const close = () => {
            navLinks.classList.remove('open');
            hamburger.setAttribute('aria-expanded', 'false');
            document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('active-dropdown'));
        };

        hamburger.addEventListener('click', () => {
            const open = navLinks.classList.toggle('open');
            hamburger.setAttribute('aria-expanded', String(open));
        });

        navLinks.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', e => {
                // Dropdown de projetos no mobile: primeiro toque abre, segundo navega
                if (a.id === 'nav-projects' && window.innerWidth <= 768 && !a.parentElement.classList.contains('active-dropdown')) {
                    e.preventDefault();
                    a.parentElement.classList.add('active-dropdown');
                    return;
                }
                // Ver todos os grupos antes de rolar até um deles
                const group = GROUPS.find(g => `#${g.id}` === a.getAttribute('href'));
                if (group) {
                    const all = document.getElementById('pf-all');
                    if (all) all.checked = true;
                }
                if (a.id !== 'langToggle') close();
            });
        });

        // Fecha ao clicar fora e ao redimensionar para desktop
        document.addEventListener('click', e => {
            if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) close();
        });
        window.addEventListener('resize', () => { if (window.innerWidth > 768) close(); });
    }

    return { init };
})();

/* ============================================================
   3. MODALS
   ============================================================ */

const Modals = (() => {
    let videoModal, videoFrame, infoModal, lastFocused = null;

    const FOCUSABLE = 'button, [href], input, select, textarea, iframe, [tabindex]:not([tabindex="-1"])';

    function focusables(modal) {
        return Array.from(modal.querySelectorAll(FOCUSABLE))
            .filter(el => el.offsetParent !== null && !el.disabled);
    }

    function open(modal) {
        lastFocused = document.activeElement;
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
        const f = focusables(modal);
        (f[0] ?? modal).focus({ preventScroll: true });
    }

    function close(modal) {
        modal.hidden = true;
        document.body.style.overflow = '';
        // removeAttribute evita que o iframe recarregue a própria página
        if (modal === videoModal) videoFrame.removeAttribute('src');
        lastFocused?.focus({ preventScroll: true });
    }

    function onKeydown(e) {
        const modal = !videoModal.hidden ? videoModal : !infoModal.hidden ? infoModal : null;
        if (!modal) return;

        if (e.key === 'Escape') { close(modal); return; }
        if (e.key !== 'Tab') return;

        const f = focusables(modal);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];

        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    function init() {
        videoModal = document.getElementById('videoModal');
        videoFrame = document.getElementById('videoFrame');
        infoModal = document.getElementById('infoModal');

        document.addEventListener('click', e => {
            const trigger = e.target.closest('[data-video]');
            if (trigger) {
                videoFrame.src = `https://www.youtube-nocookie.com/embed/${trigger.dataset.video}?autoplay=1&rel=0`;
                open(videoModal);
                return;
            }
            if (e.target.closest('[data-info-modal]')) { open(infoModal); return; }
            if (e.target.closest('[data-close-modal]')) { close(e.target.closest('.video-modal, .info-modal')); return; }
            if (e.target === videoModal) close(videoModal);
            if (e.target === infoModal) close(infoModal);
        });

        document.addEventListener('keydown', onKeydown);
    }

    return { init };
})();

/* ============================================================
   4. I18N
   ============================================================ */

const I18n = (() => {
    const SUPPORTED = ['pt', 'en'];
    const LANGS = { pt: 'pt-BR', en: 'en' };

    function current() {
        const html = document.documentElement.lang;
        return Object.keys(LANGS).find(k => LANGS[k] === html) ?? 'pt';
    }

    function setMeta(selector, attr, value) {
        const el = document.querySelector(selector);
        if (el) el.setAttribute(attr, value);
    }

    function updateHead(d, lang) {
        const m = d.meta;
        const url = lang === 'pt' ? `${SITE.origin}/` : `${SITE.origin}/en/`;
        const title = fill(m.title, d);
        const description = fill(m.description, d);

        document.title = title;
        document.documentElement.lang = LANGS[lang];

        setMeta('meta[name="description"]', 'content', description);
        setMeta('meta[name="keywords"]', 'content', m.keywords.map(k => fill(k, d)).join(', '));
        setMeta('link[rel="canonical"]', 'href', url);
        setMeta('meta[property="og:title"]', 'content', title);
        setMeta('meta[property="og:description"]', 'content', description);
        setMeta('meta[property="og:url"]', 'content', url);
        setMeta('meta[property="og:image:alt"]', 'content', m.alt);
        setMeta('meta[property="og:locale"]', 'content', m.ogLocale);
        setMeta('meta[property="og:locale:alternate"]', 'content', lang === 'pt' ? 'en_US' : 'pt_BR');
        setMeta('meta[name="twitter:title"]', 'content', title);
        setMeta('meta[name="twitter:description"]', 'content', description);
        setMeta('link#favicon', 'href', `/images/flags/${lang === 'pt' ? 'br' : 'us'}.svg`);

        document.querySelectorAll('script[type="application/ld+json"]').forEach(s => s.remove());
        const frag = document.createDocumentFragment();
        buildJsonLd(d, lang).forEach(node => {
            const s = document.createElement('script');
            s.type = 'application/ld+json';
            s.textContent = JSON.stringify(node);
            frag.appendChild(s);
        });
        document.head.appendChild(frag);
    }

    /** Re-renderiza header/main/footer a partir do JSON do idioma alvo. */
    function paint(d, lang) {
        const oldHeader = document.querySelector('header');
        const oldMain = document.querySelector('main');
        const oldFooter = document.querySelector('footer');

        oldHeader.outerHTML = renderHeader(d, lang);
        oldMain.outerHTML = renderMain(d);
        oldFooter.outerHTML = renderFooter(d);

        Modals.init();
        Nav.init();
        updateHead(d, lang);
    }

    async function switchTo(lang) {
        if (!SUPPORTED.includes(lang) || lang === current()) return;
        try {
            const res = await fetch(`/content/${lang}.json`, { cache: 'no-cache' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const d = await res.json();
            localStorage.setItem('lang', lang);
            paint(d, lang);
            history.pushState({ lang }, '', lang === 'pt' ? '/' : '/en/');
        } catch (err) {
            // Se o fetch falhar, a navegação nativa do link leva à página estática
            window.location.href = lang === 'pt' ? '/' : '/en/';
            console.error('[i18n]', err);
        }
    }

    function init() {
        const toggle = document.getElementById('langToggle');
        if (!toggle) return;

        toggle.addEventListener('click', e => {
            e.preventDefault();
            const other = toggle.getAttribute('href') === '/en/' ? 'en' : 'pt';
            switchTo(other);
        });

        window.addEventListener('popstate', e => switchTo(e.state?.lang ?? current()));
    }

    return { init, current };
})();

/* ============================================================
   BOOTSTRAP
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    Theme.init();
    Nav.init();
    Modals.init();
    I18n.init();
});
