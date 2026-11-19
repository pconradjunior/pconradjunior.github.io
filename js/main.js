/**
 * main.js — comportamento da landing page
 * ----------------------------------------
 * O conteúdo já vem pronto do HTML (gerado por build.mjs a partir de
 * content/*.json). Aqui só há comportamento:
 *   1. Nav        — menu mobile
 *   2. Modals     — player de vídeo (foco preso, Esc, backdrop)
 *   2b.ImageModal — ampliar imagens (mesma interação do player de vídeo)
 *   3. I18n       — troca de idioma sem reload, re-renderizando via render.js
 *
 * A rolagem suave das âncoras é nativa (CSS scroll-behavior).
 * Depende de ./render.js como ES module.
 */

import { renderMain, renderHeader, renderFooter, renderVideoModal, buildJsonLd, fill, SITE } from './render.js';

/* ============================================================
   1. NAV
   ============================================================ */

const Nav = (() => {
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
            a.addEventListener('click', () => { if (a.id !== 'langToggle') close(); });
        });

        document.addEventListener('click', e => {
            if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) close();
        });

        window.addEventListener('resize', () => { if (window.innerWidth > 768) close(); });
    }

    return { init };
})();

/* ============================================================
   2. MODALS — player de vídeo
   ============================================================ */

const Modals = (() => {
    let videoModal, videoFrame, lastFocused = null, bound = false;

    const FOCUSABLE = 'button, [href], iframe, [tabindex]:not([tabindex="-1"])';

    function focusables() {
        return Array.from(videoModal.querySelectorAll(FOCUSABLE))
            .filter(el => el.offsetParent !== null && !el.disabled);
    }

    function open() {
        lastFocused = document.activeElement;
        videoModal.hidden = false;
        document.body.style.overflow = 'hidden';
        (focusables()[0] ?? videoModal).focus({ preventScroll: true });
    }

    function close() {
        videoModal.hidden = true;
        document.body.style.overflow = '';
        // removeAttribute evita que o iframe recarregue a própria página
        videoFrame.removeAttribute('src');
        lastFocused?.focus({ preventScroll: true });
    }

    function onKeydown(e) {
        if (videoModal.hidden) return;

        if (e.key === 'Escape') { close(); return; }
        if (e.key !== 'Tab') return;

        const f = focusables();
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];

        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    function init() {
        videoModal = document.getElementById('videoModal');
        videoFrame = document.getElementById('videoFrame');
        if (!videoModal || !videoFrame) return;

        if (!bound) {
            document.addEventListener('click', e => {
                const trigger = e.target.closest('[data-video]');
                if (trigger && videoFrame) {
                    videoFrame.src = `https://www.youtube-nocookie.com/embed/${trigger.dataset.video}?autoplay=1&rel=0`;
                    open();
                    return;
                }
                if (e.target.closest('[data-close-modal]') || e.target === videoModal) close();
            });
            document.addEventListener('keydown', onKeydown);
            bound = true;
        }
    }

    return { init };
})();

/* ============================================================
   2b. IMAGE MODAL — ampliar imagens (mesma interação do vídeo)
   ============================================================ */

const ImageModal = (() => {
    let imageModal, imageFrame, imageCaption, lastFocused = null, bound = false;

    const FOCUSABLE = 'button, [href], [tabindex]:not([tabindex="-1"])';

    function focusables() {
        return Array.from(imageModal.querySelectorAll(FOCUSABLE))
            .filter(el => el.offsetParent !== null && !el.disabled);
    }

    function open() {
        lastFocused = document.activeElement;
        imageModal.hidden = false;
        document.body.style.overflow = 'hidden';
        (focusables()[0] ?? imageModal).focus({ preventScroll: true });
    }

    function close() {
        imageModal.hidden = true;
        document.body.style.overflow = '';
        imageFrame.removeAttribute('src');
        imageFrame.alt = '';
        imageCaption.textContent = '';
        lastFocused?.focus({ preventScroll: true });
    }

    function onKeydown(e) {
        if (imageModal.hidden) return;

        if (e.key === 'Escape') { close(); return; }
        if (e.key !== 'Tab') return;

        const f = focusables();
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];

        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    function init() {
        imageModal = document.getElementById('imageModal');
        imageFrame = document.getElementById('imageFrame');
        imageCaption = document.getElementById('imageCaption');
        if (!imageModal || !imageFrame) return;

        if (!bound) {
            document.addEventListener('click', e => {
                const trigger = e.target.closest('[data-image]');
                if (trigger) {
                    imageFrame.src = trigger.dataset.image;
                    imageFrame.alt = trigger.dataset.caption || '';
                    imageCaption.textContent = trigger.dataset.caption || '';
                    open();
                    return;
                }
                if (e.target.closest('[data-close-modal]') || e.target === imageModal) close();
            });
            document.addEventListener('keydown', onKeydown);
            bound = true;
        }
    }

    return { init };
})();

/* ============================================================
   2c. CAREER DIALOG — acervo completo de certificações/publicações
   Usa <dialog>.showModal(): Escape, focus trap, backdrop e bloqueio
   de rolagem são nativos; este módulo só abre, fecha e posiciona.
   ============================================================ */

const CareerDialog = (() => {
    let dialog, bound = false;

    function open(section) {
        dialog.showModal();
        const target = dialog.querySelector(`#careerDialog-${section}`);
        dialog.querySelector('[data-career-dialog-close]').focus({ preventScroll: true });
        target?.scrollIntoView({ block: 'start' });
    }

    function init() {
        dialog = document.getElementById('careerDialog');
        if (!dialog || bound) return;

        document.addEventListener('click', e => {
            const trigger = e.target.closest('[data-career-dialog]');
            if (trigger) { open(trigger.dataset.careerDialog); return; }
            if (e.target.closest('[data-career-dialog-close]')) { dialog.close(); return; }
            if (e.target === dialog) dialog.close();
        });
        bound = true;
    }

    return { init };
})();

/* ============================================================
   3. I18N
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

    /** Re-renderiza header/main/footer/modal a partir do JSON do idioma alvo. */
    function paint(d, lang) {
        document.querySelector('header').outerHTML = renderHeader(d, lang);
        document.querySelector('main').outerHTML = renderMain(d);
        document.querySelector('footer').outerHTML = renderFooter(d, lang);
        const modal = document.getElementById('videoModal');
        if (modal) modal.outerHTML = renderVideoModal(d, lang);

        Nav.init();
        Modals.init();
        CareerDialog.init();
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
        // Páginas de termos usam o mesmo header, mas não têm o conteúdo da landing.
        // Nesse caso o toggle deve navegar para a home no outro idioma (link nativo).
        if (!document.querySelector('main .lp-hero, main .lp-grid')) return;

        toggle.addEventListener('click', e => {
            e.preventDefault();
            switchTo(toggle.getAttribute('href') === '/en/' ? 'en' : 'pt');
        });

        window.addEventListener('popstate', e => switchTo(e.state?.lang ?? current()));
    }

    return { init, current };
})();

/* ============================================================
   BOOTSTRAP
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    Nav.init();
    Modals.init();
    ImageModal.init();
    CareerDialog.init();
    I18n.init();
});
