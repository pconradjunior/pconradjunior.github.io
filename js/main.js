/**
 * main.js — i18n Engine + Portfolio Logic
 * ----------------------------------------
 * Modules:
 *  1. i18n    — language detection, JSON loading, switching
 *  2. Render  — DOM update functions per section
 *  3. Modals  — video modal + info modal
 *  4. Theme   — theme switcher (radio-based, localStorage)
 *  5. Nav     — mobile hamburger menu
 */

/* ============================================================
   1. i18n MODULE
   ============================================================ */

const I18n = (() => {
    const SUPPORTED = ['pt', 'en'];
    const DEFAULT_LANG = 'pt';
    let currentLang = DEFAULT_LANG;
    let currentData = null;

    /** Detect language from localStorage → browser → default */
    function detectLang() {
        const saved = localStorage.getItem('lang');
        if (saved && SUPPORTED.includes(saved)) return saved;

        const browser = (navigator.language || navigator.userLanguage || '').toLowerCase();
        if (browser.startsWith('pt')) return 'pt';
        if (browser.startsWith('en')) return 'en';
        return DEFAULT_LANG;
    }

    /** Fetch and apply a language JSON */
    function loadLang(lang) {
        if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;
        currentLang = lang;
        localStorage.setItem('lang', lang);

        return fetch(`content/${lang}.json`)
            .then(res => {
                if (!res.ok) throw new Error(`Failed to load content/${lang}.json`);
                return res.json();
            })
            .then(data => {
                currentData = data;
                Render.applyAll(data);
            })
            .catch(err => console.error('[i18n]', err));
    }

    /** Toggle between pt ↔ en */
    function toggleLang() {
        const next = currentLang === 'pt' ? 'en' : 'pt';
        loadLang(next);
    }

    function getCurrentLang() { return currentLang; }
    function getCurrentData() { return currentData; }

    return { detectLang, loadLang, toggleLang, getCurrentLang, getCurrentData };
})();


/* ============================================================
   2. RENDER MODULE
   ============================================================ */

const Render = (() => {

    /** Set text safely, supporting HTML entities via innerHTML when needed */
    function setText(selector, text) {
        const el = document.querySelector(selector);
        if (el) el.textContent = text;
    }

    function setHtml(selector, html) {
        const el = document.querySelector(selector);
        if (el) el.innerHTML = html;
    }

    /* ── Meta & document root ── */
    function renderMeta(data) {
        document.documentElement.lang = data.meta.lang;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', data.meta.description);
        const favicon = document.getElementById('favicon');
        if (favicon) favicon.href = data.meta.flagIcon;
    }

    /* ── Navigation ── */
    function renderNav(data) {
        const n = data.nav;
        setText('#nav-home', n.home);
        setText('#nav-about', n.about);
        setText('#nav-expertise', n.expertise);
        setText('#nav-projects', n.projects);
        setText('#nav-contact', n.contact);

        // theme switcher tooltip
        const ts = document.querySelector('.theme-switcher');
        if (ts) ts.title = data.themeSwitcherTitle;

        // Lang toggle button
        const toggle = document.getElementById('langToggle');
        if (toggle) {
            toggle.innerHTML = `<img src="${n.langToggleFlag}" alt="${n.langToggleAlt}" style="vertical-align:middle;"> ${n.langToggleLabel}`;
        }
    }

    /* ── Hero ── */
    function renderHero(data) {
        const h = data.hero;
        setText('.hero-greeting', h.greeting);
        // h1 has the name + a <span> for subtitle
        const h1 = document.querySelector('.hero-content h1');
        if (h1) {
            h1.innerHTML = `${h.title} <span>${h.subtitle}</span>`;
        }
        const heroP = document.querySelector('.hero-content > p');
        if (heroP) heroP.textContent = h.description;
        setText('#btn-projects', h.btnProjects);
        setText('#btn-github', h.btnGitHub);
        setText('#btn-linkedin', h.btnLinkedIn);
        setText('#btn-instagram', h.btnInstagram);
    }

    /* ── About ── */
    function renderAbout(data) {
        const a = data.about;
        setText('#about .section-title', a.sectionTitle);

        // Paragraphs
        const textDiv = document.querySelector('#about .about-text');
        if (textDiv) {
            textDiv.innerHTML = a.paragraphs.map(p => `<p>${p}</p>`).join('');
        }

        // Stat cards
        const statsGrid = document.querySelector('#about .stats-grid');
        if (statsGrid) {
            statsGrid.innerHTML = a.stats.map(s => `
        <div class="stat-card">
          <span class="stat-number">${s.number}</span>
          <span class="stat-label">${s.label}</span>
        </div>`).join('');
        }
    }

    /* ── Expertise ── */
    function renderExpertise(data) {
        const e = data.expertise;
        setText('#expertise .section-title', e.sectionTitle);

        const grid = document.querySelector('#expertise .services-grid');
        if (grid) {
            grid.innerHTML = e.cards.map(c => `
        <div class="service-card">
          <div class="service-icon"><i class="${c.icon}"></i></div>
          <h3>${c.title}</h3>
          <p>${c.text}</p>
        </div>`).join('');
        }
    }

    /* ── Projects: generic card builder ── */
    function buildLinks(links) {
        return links.map(l => {
            // Icon-only links (no label) default to black so they're always visible
            const style = l.style
                ? ` style="${l.style}"`
                : (!l.label ? ' style="color:#000;"' : '');
            if (l.action === 'video') {
                return `<button onclick="Modals.openVideo('${l.videoId}')" class="btn-link" title="${l.title}">
                  <i class="${l.icon}"></i>${l.label ? ' ' + l.label : ''}
                </button>`;
            }
            if (l.action === 'infoModal') {
                return `<a href="javascript:void(0)" onclick="Modals.openInfoModal()" class="btn-link"${style} title="${l.title}">
                  <i class="${l.icon}"></i> ${l.label}
                </a>`;
            }
            // default: url
            return `<a href="${l.href}" target="_blank" class="btn-link"${style} title="${l.title}">
                <i class="${l.icon}"></i>${l.label ? ' ' + l.label : ''}
              </a>`;
        }).join('');
    }

    function buildProjectCard(item) {
        const cardClass = item.cardClass || 'project-card';
        const linksClass = item.linksClass || 'project-links';

        // Special: publication card with external link groups
        if (item.externalGroups) {
            const external = item.externalGroups.map(g =>
                `<div class="external-links-container">
          ${g.links.map(l => `<a href="${l.href}" target="_blank" class="external-link" style="justify-content:flex-start;text-align:left;"><i class="${l.icon}"></i> ${l.label}</a>`).join('')}
        </div>`
            ).join('');

            const published = item.publishedGroups.map(g =>
                `<div class="external-links-container">
          ${g.links.map(l => `<a href="${l.href}" target="_blank" class="external-link" style="justify-content:flex-start;text-align:left;"><i class="${l.icon}"></i> ${l.label}</a>`).join('')}
        </div>`
            ).join('');

            return `
        <article class="${cardClass}">
          <div class="project-content">
            <span class="project-type"><i class="${item.typeIcon}"></i> ${item.typeLabel}</span>
            <h3 class="project-title">${item.title}</h3>
            ${external}
            <br/>
            <h3 class="project-title">${item.publishedArticlesTitle}</h3>
            ${published}
          </div>
        </article>`;
        }

        const linksHtml = item.links && item.links.length
            ? `<div class="${linksClass}">${buildLinks(item.links)}</div>`
            : '';

        return `
      <article class="${cardClass}">
        <div class="project-content">
          <span class="project-type"><i class="${item.typeIcon}"></i> ${item.typeLabel}</span>
          <h3 class="project-title">${item.title}</h3>
          <p class="project-desc">${item.desc}</p>
          ${linksHtml}
        </div>
      </article>`;
    }

    function renderSubsection(subsection, containerId) {
        const titleEl = document.querySelector(`#${containerId} .section-title`);
        if (titleEl) titleEl.textContent = subsection.title;

        const grid = document.querySelector(`#${containerId} .portfolio-grid`);
        if (grid) {
            grid.innerHTML = subsection.items.map(buildProjectCard).join('');
        }
    }

    /* ── Projects section ── */
    function renderProjects(data) {
        const p = data.projects;
        setText('#projects > .container > .section-title', p.sectionTitle);

        const intro = document.querySelector('#projects .about-text p');
        if (intro) intro.textContent = p.intro;

        renderSubsection(p.mobile, 'mobile');
        renderSubsection(p.web, 'web');
        renderSubsection(p.other, 'other-projects');
        renderSubsection(p.articles, 'articles');
        renderSubsection(p.videos, 'videos');
    }

    /* ── Contact section ── */
    function renderContact(data) {
        const c = data.contact;
        const f = c.form;

        // Section title and info side
        setText('#contact .section-title', c.sectionTitle);
        setText('#contact-info-title', c.infoTitle);
        setText('#contact-info-text', c.infoText);

        // Form labels and placeholders
        setText('#label-name', f.labelName);
        setText('#label-email', f.labelEmail);
        setText('#label-subject', f.labelSubject);
        setText('#label-message', f.labelMessage);

        const inputName = document.getElementById('name');
        if (inputName) inputName.placeholder = f.placeholderName;

        const inputEmail = document.getElementById('email');
        if (inputEmail) inputEmail.placeholder = f.placeholderEmail;

        const inputMessage = document.getElementById('message');
        if (inputMessage) inputMessage.placeholder = f.placeholderMessage;

        // Subject dropdown — rebuild options to preserve Select2 compatibility
        const select = document.getElementById('subject');
        if (select) {
            const currentVal = select.value;
            select.innerHTML = f.options
                .map(o => `<option value="${o.value}">${o.label}</option>`)
                .join('');
            // Re-init Select2 after rebuilding options
            if (typeof $ !== 'undefined' && $.fn.select2) {
                $('#subject').select2({ dropdownCssClass: 'dark-dropdown' });
            }
        }

        // hCaptcha language attribute
        const captchaDiv = document.querySelector('.h-captcha');
        if (captchaDiv) captchaDiv.setAttribute('data-lang', f.captchaLang);

        // Submit button (preserves the icon already in the HTML)
        const btnSubmit = document.getElementById('btn-submit');
        if (btnSubmit) btnSubmit.innerHTML = `${f.btnSubmit} <i class="fa fa-paper-plane"></i>`;
    }

    /* ── Footer ── */
    function renderFooter(data) {
        const f = data.footer;
        setHtml('#footer-copyright', f.copyright);
        setText('#footer-version', f.version);
    }

    /* ── Info Modal text ── */
    function renderInfoModal(data) {
        setText('#infoModalText', data.infoModal.text);
    }

    /* ── Apply all renders ── */
    function applyAll(data) {
        renderMeta(data);
        renderNav(data);
        renderHero(data);
        renderAbout(data);
        renderExpertise(data);
        renderProjects(data);
        renderContact(data);
        renderFooter(data);
        renderInfoModal(data);
    }

    return { applyAll };
})();


/* ============================================================
   3. MODALS MODULE
   ============================================================ */

const Modals = (() => {
    let videoModal, videoFrame, infoModal;

    function init() {
        videoModal = document.getElementById('videoModal');
        videoFrame = document.getElementById('videoFrame');
        infoModal = document.getElementById('infoModal');

        window.addEventListener('click', e => {
            if (e.target === videoModal) closeVideo();
            if (e.target === infoModal) closeInfoModal();
        });
    }

    function openVideo(videoId) {
        if (!videoModal) return;
        videoModal.style.display = 'flex';
        videoFrame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }

    function closeVideo() {
        if (!videoModal) return;
        videoModal.style.display = 'none';
        videoFrame.src = '';
    }

    function openInfoModal() {
        if (infoModal) infoModal.style.display = 'flex';
    }

    function closeInfoModal() {
        if (infoModal) infoModal.style.display = 'none';
    }

    return { init, openVideo, closeVideo, openInfoModal, closeInfoModal };
})();

// Expose modal functions globally for inline onclick attributes
function openVideo(id) { Modals.openVideo(id); }
function closeVideo() { Modals.closeVideo(); }
function openInfoModal() { Modals.openInfoModal(); }
function closeInfoModal() { Modals.closeInfoModal(); }


/* ============================================================
   4. THEME MODULE
   ============================================================ */

const Theme = (() => {
    const THEMES = ['theme-purple', 'theme-cyan', 'theme-green'];

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
   5. NAV MODULE
   ============================================================ */

const Nav = (() => {
    function init() {
        const hamburger = document.getElementById('hamburgerBtn');
        const navLinks = document.getElementById('navLinks');
        if (!hamburger || !navLinks) return;

        hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
        navLinks.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => navLinks.classList.remove('open'));
        });

        // Language toggle: intercept click, switch lang in-place
        const langToggle = document.getElementById('langToggle');
        if (langToggle) {
            langToggle.addEventListener('click', e => {
                e.preventDefault();
                I18n.toggleLang();
            });
        }
    }

    return { init };
})();


/* ============================================================
   BOOTSTRAP
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    Theme.init();
    Nav.init();
    Modals.init();

    // Init Select2 on the contact form subject (contact section stays in HTML)
    if (typeof $ !== 'undefined' && $.fn.select2) {
        $('#subject').select2({ dropdownCssClass: 'dark-dropdown' });
    }

    // Load the correct language
    const lang = I18n.detectLang();
    I18n.loadLang(lang);
});
