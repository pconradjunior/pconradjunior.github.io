/**
 * main.js — comportamento do portfolio
 * ------------------------------------
 * O conteúdo já vem pronto do HTML (gerado por build.mjs a partir de
 * content/*.json). Aqui só há comportamento:
 *   1. Theme   — troca de tema via radio + localStorage
 *   2. Nav     — menu mobile, âncoras e filtro por categoria
 *   3. Modals  — player de vídeo e modal de informação (com foco preso e Esc)
 *   4. i18n    — troca de idioma sem reload, re-renderizando via render.js
 *
 * Depende de ./render.js como ES module.
 */

import {
  renderHeader, renderFooter, renderPage, buildJsonLd,
  fill, SITE, PAGE_BY_KEY, PAGES, pageUrl, GROUPS
} from './render.js';

/* ============================================================
   0. PÁGINA
   ============================================================ */

/**
 * Chave da página atual. Injetada pelo build em window.PAGE_KEY; o fallback
 * cobre abas file:// e qualquer página que não a tenha.
 */
function currentPage() {
  if (window.PAGE_KEY && PAGE_BY_KEY[window.PAGE_KEY]) return PAGE_BY_KEY[window.PAGE_KEY];
  const path = location.pathname.replace(/index\.html$/, '').replace(/^\/|\/$/g, '');
  return PAGES.find(p => p.dir === path) ?? PAGE_BY_KEY.home;
}

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
    let bound = false;

    /**
     * Se a URL traz o id de um grupo (ex.: /work/#web), seleciona o filtro
     * correspondente. Sem isso o alvo existiria mas ficaria oculto, porque o
     * filtro padrão esconde todos os grupos menos "Todos".
     */
    function syncFilterWithHash() {
        const id = location.hash.slice(1);
        const group = GROUPS.find(g => g.id === id);
        const radio = group && document.getElementById(`pf-${group.filter}`);
        if (radio) radio.checked = true;
    }

    function init() {
        const hamburger = document.getElementById('hamburgerBtn');
        const navLinks = document.getElementById('navLinks');
        if (!hamburger || !navLinks) return;

        const close = () => {
            navLinks.classList.remove('open');
            hamburger.setAttribute('aria-expanded', 'false');
        };

        hamburger.addEventListener('click', () => {
            const open = navLinks.classList.toggle('open');
            hamburger.setAttribute('aria-expanded', String(open));
        });

        navLinks.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                // Só fecha no mesmo documento: link entre páginas navega de verdade.
                const url = new URL(a.href, location.href);
                if (url.pathname === location.pathname) close();
            });
        });

        // Fecha ao clicar fora e ao redimensionar para desktop
        document.addEventListener('click', e => {
            if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) close();
        });
        window.addEventListener('resize', () => { if (window.innerWidth > 768) close(); });

        syncFilterWithHash();

        // Os dois listeners abaixo são globais: só os registra uma vez, senão
        // cada re-render de idioma acumularia outro.
        if (!bound) {
            window.addEventListener('hashchange', syncFilterWithHash);
            bound = true;
        }
    }

    return { init };
})();

/* ============================================================
   3. MODALS
   ============================================================ */

const Modals = (() => {
    let videoModal, videoFrame, infoModal, lastFocused = null;
    let bound = false;

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
        if (!videoModal || !infoModal) return;

        // Os modais ficam no <body>, que o re-render não troca. Os listeners
        // são de delegated em document, então registrá-los uma vez basta —
        // registrá-los por re-render duplicaria o foco preso a cada troca de idioma.
        if (bound) return;
        bound = true;

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
    let popstateBound = false;

    function current() {
        const html = document.documentElement.lang;
        return Object.keys(LANGS).find(k => LANGS[k] === html) ?? 'pt';
    }

    function setMeta(selector, attr, value) {
        const el = document.querySelector(selector);
        if (el) el.setAttribute(attr, value);
    }

    function updateHead(d, lang, page) {
        const m = d.meta;
        const other = lang === 'pt' ? 'en' : 'pt';

        // Título e descrição são por página: a title da home não serve para /work/.
        const title = fill(d[page.key]?.metaTitle ?? m.title, d);
        const description = fill(d[page.key]?.metaDescription ?? m.description, d);

        document.title = title;
        document.documentElement.lang = LANGS[lang];

        setMeta('meta[name="description"]', 'content', description);
        setMeta('meta[name="keywords"]', 'content', m.keywords.map(k => fill(k, d)).join(', '));
        setMeta('link[rel="canonical"]', 'href', `${SITE.origin}${pageUrl(page, lang)}`);
        setMeta('link[rel="alternate"][hreflang="pt-BR"]', 'href', `${SITE.origin}${pageUrl(page, 'pt')}`);
        setMeta('link[rel="alternate"][hreflang="en"]', 'href', `${SITE.origin}${pageUrl(page, other)}`);
        setMeta('link[rel="alternate"][hreflang="x-default"]', 'href', `${SITE.origin}${pageUrl(page, 'pt')}`);
        setMeta('meta[property="og:title"]', 'content', title);
        setMeta('meta[property="og:description"]', 'content', description);
        setMeta('meta[property="og:url"]', 'content', `${SITE.origin}${pageUrl(page, lang)}`);
        setMeta('meta[property="og:image:alt"]', 'content', m.alt);
        setMeta('meta[property="og:locale"]', 'content', m.ogLocale);
        setMeta('meta[property="og:locale:alternate"]', 'content', lang === 'pt' ? 'en_US' : 'pt_BR');
        setMeta('meta[name="twitter:title"]', 'content', title);
        setMeta('meta[name="twitter:description"]', 'content', description);
        setMeta('link#favicon', 'href', `/images/flags/${lang === 'pt' ? 'br' : 'us'}.svg`);

        document.querySelectorAll('script[type="application/ld+json"]').forEach(s => s.remove());
        const frag = document.createDocumentFragment();
        buildJsonLd(d, lang, page).forEach(node => {
            const s = document.createElement('script');
            s.type = 'application/ld+json';
            s.textContent = JSON.stringify(node);
            frag.appendChild(s);
        });
        document.head.appendChild(frag);
    }

    /** Re-renderiza header/main/footer a partir do JSON do idioma alvo. */
    function paint(d, lang, page) {
        document.querySelector('header').outerHTML = renderHeader(d, lang, page);
        document.querySelector('main').outerHTML = renderPage(d, page);
        document.querySelector('footer').outerHTML = renderFooter(d);

        Modals.init();
        Nav.init();
        I18n.init();
        updateHead(d, lang, page);
    }

    async function switchTo(lang) {
        if (!SUPPORTED.includes(lang) || lang === current()) return;
        const page = currentPage();

        const res = await fetch(`/content/${lang}.json`, { cache: 'no-cache' });
        if (!res.ok) {
            window.location.href = pageUrl(page, lang);
            return;
        }
        const d = await res.json();

        localStorage.setItem('lang', lang);
        paint(d, lang, page);
        history.pushState({ lang, page: page.key }, '', pageUrl(page, lang));
    }

    function init() {
        const toggle = document.getElementById('langToggle');
        if (!toggle) return;

        // init() roda de novo a cada re-render, e o toggle é um elemento novo
        // a cada vez — por isso o listener do clique vai junto. O popstate, não:
        // ele vive no window e duplicaria a cada troca de idioma.
        toggle.addEventListener('click', e => {
            e.preventDefault();
            switchTo(toggle.getAttribute('href') === pageUrl(currentPage(), 'en') ? 'en' : 'pt');
        });

        if (popstateBound) return;
        popstateBound = true;
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