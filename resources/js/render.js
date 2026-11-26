/**
 * render.js — Renderizador compartilhado entre o build (Node) e o runtime (browser).
 *
 * Este é o ÚNICO lugar onde a estrutura do HTML é definida. O build.mjs importa
 * para gerar as páginas estáticas; o main.js importa para trocar de idioma sem
 * recarregar. Nenhum dos dois duplica markup.
 *
 * Dependências: nenhuma. ES module puro (browser + Node >= 18).
 */

export const SITE = {
  origin: 'https://pconradjunior.github.io',
  ogImage: lang => `/resources/images/${lang === 'en' ? 'og-image-en.png' : 'og-image.png'}`,
  author: 'Pedro Conrad Jr',
  email: 'pconradjunior@gmail.com',
  sameAs: [
    'https://github.com/pconradjunior',
    'https://www.linkedin.com/in/pconradjunior/',
    'https://medium.com/@pconradjunior',
    'https://instagram.com/pedrojunior.dev'
  ]
};

/* ─────────────────────────────────────────────────────────────
   escaping e URLs
   ───────────────────────────────────────────────────────────── */

const ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapa texto para contexto de HTML. */
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ENT[c]);

/** Resolve a URL de um link interno para caminho absoluto a partir da raiz. */
function href(h) {
    if (!h) return '#';
    if (/^(https?:|mailto:|#)/.test(h)) return h;
    return '/' + h.replace(/^\.?\//, '');
}

/** Atributos de link externo (mailto não abre nova aba). */
function external(h) {
    return /^https?:/.test(h) ? ' target="_blank" rel="noopener noreferrer"' : '';
}

/* ─────────────────────────────────────────────────────────────
   ícones SVG próprios — substituem Font Awesome sem CDN nem fontes
   ───────────────────────────────────────────────────────────── */

const ICONS = {
    bars: '<path d="M3 7h18M3 12h18M3 17h18"/>',
    code: '<path d="m8 8-4 4 4 4m8-8 4 4-4 4m-3-11-2 18"/>',
    envelope: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    'file-pdf': '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M8 13h8M8 17h5"/>',
    'info-circle': '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
    'play-circle': '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/>',
    mobile: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    server: '<rect x="3" y="4" width="18" height="7" rx="1"/><rect x="3" y="13" width="18" height="7" rx="1"/><path d="M7 7.5h.01M7 16.5h.01"/>',
    newspaper: '<path d="M4 5h13a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2z"/><path d="M19 9h1a1 1 0 0 1 1 1v7a2 2 0 0 1-2 2"/><path d="M7 9h7M7 13h7M7 17h4"/>',
    video: '<rect x="3" y="5" width="13" height="14" rx="2"/><path d="m16 10 5-3v10l-5-3z"/>',
    'book-open': '<path d="M12 6c-2-1.5-5-2-8-1v13c3-1 6-.5 8 1 2-1.5 5-2 8-1V5c-3-1-6-.5-8 1z"/><path d="M12 6v13"/>',
    'external-link': '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    apple: '<path d="M12 7c-3.5 0-6 2.6-6 6 0 3.8 2.5 8 6 8s6-4.2 6-8c0-3.4-2.5-6-6-6z"/><path d="M12 7c0-2 1.2-3.4 3-3.5"/>',
    chrome: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M12 3v5.5m7.8-2L14 10m-5.8 9L11 14"/>',
    github: '<circle cx="12" cy="12" r="9"/><path d="M15.5 9a4 4 0 1 0 0 6"/><path d="M15 12h-3"/>',
    'google-play': '<path d="M5 3v18l10-9z" fill="currentColor" stroke="none"/><path d="m5 3 12 7-2 2z" fill="currentColor" stroke="none"/><path d="m5 21 12-7-2-2z" fill="currentColor" stroke="none"/>',
    linkedin: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 10v7M8 7h.01M12 17v-4a2 2 0 0 1 4 0v4"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
    medium: '<ellipse cx="7" cy="12" rx="5" ry="6" fill="currentColor" stroke="none"/><ellipse cx="15" cy="12" rx="1.8" ry="5.5" fill="currentColor" stroke="none"/><ellipse cx="20" cy="12" rx="0.9" ry="4.5" fill="currentColor" stroke="none"/>'
};

/** viewBoxes recortados para ícones cujos traços não ocupam o box inteiro. */
const ICON_VIEWBOX = {
    bars: '0 5 24 14',
    code: '2 3 20 18'
};

/** Extrai o nome do ícone das antigas classes Font Awesome dos dados. */
function iconKey(className) {
    return String(className ?? '')
        .replace(/^fa(?:-brands|-solid)?\s+fa-/, '')
        .replace(/^fa-/, '')
        .trim();
}

/** Converte as antigas classes Font Awesome dos dados em SVG inline. */
function renderIcon(className) {
    const key = iconKey(className);
    const body = ICONS[key] ?? ICONS['info-circle'];
    const viewBox = ICON_VIEWBOX[key] ?? '0 0 24 24';
    return `<svg class="lp-icon" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

/** Ícone usado diretamente no logo, sem depender dos dados. */
function logoSvg() {
    return `<svg class="lp-icon lp-logo-icon" viewBox="${ICON_VIEWBOX.code}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS.code}</svg>`;
}

/* ─────────────────────────────────────────────────────────────
   contagens derivadas — os números vêm dos dados, nunca do copy
   ───────────────────────────────────────────────────────────── */

const STORE = /play\.google\.com|apps\.apple\.com/;

/** Formata contagens grandes no estilo da Play Store: 5000 -> "5k+". */
function compact(n) {
    if (!n) return null;
    if (n >= 1000) return `${Math.round(n / 1000)}k+`;
    return `${n}+`;
}

/** Formata a contagem de downloads de um app, ou null se não informado. */
export function downloadLabel(item) {
    return item?.downloads ? compact(item.downloads) : null;
}

export function counts(d) {
    const p = d.projects;
    const mobile = p.mobile?.items ?? [];
    const published = mobile.filter(i => i.links.some(l => STORE.test(l.href || '')));
    const total = published.reduce((n, i) => n + (i.downloads || 0), 0);
    const byTitle = title => downloadLabel(mobile.find(i => i.title === title));

    return {
        apps: published.length,
        articles: (p.technicalArticles?.items ?? []).length
            + (p.reflections?.items ?? []).length
            + (p.career?.items ?? []).length,
        papers: (p.publications?.items ?? []).length,
        projects: Object.values(p).reduce((n, v) => n + (Array.isArray(v?.items) ? v.items.length : 0), 0),
        downloads: compact(total),
        downloadsExact: total,
        unipampaDownloads: byTitle('App Unipampa'),
        phisicalcDownloads: byTitle('PhisiCalc'),
        chesskidsDownloads: byTitle('ChessKids')
    };
}

/** Substitui os tokens {{chave}} pelos números atuais. */
export function fill(text, d) {
    const c = counts(d);
    return String(text ?? '').replace(/\{\{(\w+)\}\}/g, (m, k) => (c[k] ?? m));
}

/* ─────────────────────────────────────────────────────────────
   blocos de conteúdo
   ───────────────────────────────────────────────────────────── */

function renderLinks(links) {
    if (!links || !links.length) return '';
    const items = links.map(l => {
        const label = esc(l.label || l.title || '');
        const title = l.title ? ` title="${esc(l.title)}"` : '';
        const icon = renderIcon(l.icon);

        if (l.action === 'video' && l.videoId) {
            return `<button type="button" class="lp-link lp-link-video" data-video="${esc(l.videoId)}"${title}>
        ${icon} ${label}
      </button>`;
        }

        return `<a href="${esc(href(l.href))}"${external(l.href)} class="lp-link"${title}>
        ${icon} ${label}
      </a>`;
    });
    return `<div class="lp-links">${items.join('')}</div>`;
}

function renderFeatured(item, d) {
    return `<article class="lp-card">
        <span class="lp-card-type">${esc(item.type)}</span>
        <h3 class="lp-card-title">${esc(item.title)}</h3>
        <p class="lp-card-desc">${esc(item.desc)}</p>
        <span class="lp-card-metric">${esc(fill(item.metric, d))}</span>
        ${renderLinks(item.links)}
      </article>`;
}

/** Detalhe expansível nativo: mantém o texto no HTML sem depender de JS. */
function renderDetails(label, body) {
    return `<details class="lp-details">
        <summary>${esc(label)}</summary>
        <div class="lp-details-body">${body}</div>
      </details>`;
}

/** Item de certificação compartilhado entre a lista curta e o acervo. */
function renderCertItem(c) {
    return `<li class="lp-cert">
      <span class="lp-cert-name">${esc(c.name)}</span>
      <span class="lp-cert-meta">${esc(c.issuer)} · <time datetime="${esc(c.date)}">${esc(c.label)}</time></span>
    </li>`;
}

/** Item de publicação compartilhado entre a lista curta e o acervo. */
function renderPubItem(pub, linkLabel) {
    return `<li class="lp-typed-item">
      <span class="lp-typed-type">${esc(pub.type)}</span>
      <span class="lp-typed-title">${esc(pub.title)}</span>
      <span class="lp-typed-meta">${esc(pub.authors)} · <time datetime="${esc(pub.date)}">${esc(pub.date)}</time>${pub.href ? ` · <a href="${esc(pub.href)}" target="_blank" rel="noopener noreferrer">${esc(linkLabel)}</a>` : ''}</span>
    </li>`;
}

/** Acervo completo em <dialog> nativo (Escape, foco e backdrop sem JS extra). */
function renderCareerDialog(k, olderCerts) {
    const x = k.dialog;
    return `<dialog id="careerDialog" class="lp-dialog" aria-labelledby="careerDialogTitle">
      <div class="lp-dialog-inner">
        <div class="lp-dialog-head">
          <div>
            <h2 id="careerDialogTitle" class="lp-dialog-title">${esc(x.title)}</h2>
            <p class="lp-dialog-intro">${esc(x.intro)}</p>
          </div>
          <button type="button" class="lp-dialog-close" data-career-dialog-close aria-label="${esc(x.close)}">&times;</button>
        </div>
        <h3 id="careerDialog-certifications" class="lp-dialog-subtitle">${esc(x.certificationsTitle)}</h3>
        <ul class="lp-certs lp-dialog-list">${olderCerts.map(renderCertItem).join('')}</ul>
        <h3 id="careerDialog-publications" class="lp-dialog-subtitle">${esc(x.publicationsTitle)}</h3>
        <ul class="lp-typed lp-dialog-list">${k.publications.slice(3).map(p => renderPubItem(p, k.linkLabel)).join('')}</ul>
      </div>
    </dialog>`;
}

/** Ordem dos canais no cartão; a seção Contato mantém a ordem dos dados. */
const CARD_LINK_ORDER = ['github', 'linkedin', 'instagram', 'medium', 'envelope'];

/** Cartão de contato exibido ao clicar na foto de perfil. */
function renderProfileCard(a, c) {
    const card = c.card;
    const rank = ch => {
        const i = CARD_LINK_ORDER.indexOf(iconKey(ch.icon));
        return i < 0 ? CARD_LINK_ORDER.length : i;
    };
    const links = [...c.channels]
        .sort((x, y) => rank(x) - rank(y))
        .map(ch => `<li><a href="${esc(href(ch.href))}"${external(ch.href)} class="lp-profile-link">
          ${renderIcon(ch.icon)}<span>${esc(ch.label)}</span>
        </a></li>`)
        .join('');

    return `<dialog id="profileDialog" class="lp-dialog lp-profile-dialog" aria-labelledby="profileDialogName">
      <div class="lp-profile-card">
        <button type="button" class="lp-dialog-close lp-profile-close" data-profile-dialog-close aria-label="${esc(card.close)}">&times;</button>
        <img class="lp-profile-photo" src="${esc(a.avatar)}" alt="${esc(a.avatarAlt)}" width="160" height="160">
        <div class="lp-profile-info">
          <h2 id="profileDialogName" class="lp-profile-name">${esc(card.name)}</h2>
          <address class="lp-profile-address">
            <ul class="lp-profile-links">${links}</ul>
          </address>
        </div>
      </div>
    </dialog>`;
}

/* ─────────────────────────────────────────────────────────────
   header / main / footer
   ───────────────────────────────────────────────────────────── */

export function renderHeader(d, lang) {
  const n = d.nav;
  const other = lang === 'pt' ? '/en/' : '/';
  const aria = lang === 'pt' ? 'Navegação principal' : 'Main navigation';
  const open = lang === 'pt' ? 'Abrir menu' : 'Open menu';

  return `<header class="lp-header">
      <div class="lp-container">
        <nav class="lp-nav" aria-label="${esc(aria)}">
          <button class="lp-hamburger" id="hamburgerBtn" type="button"
              aria-label="${esc(open)}" aria-expanded="false" aria-controls="navLinks">
            ${renderIcon('fa fa-bars')}
          </button>
          <a href="#home" class="lp-logo">${logoSvg()} ${esc(n.brand)}</a>
          <div class="lp-nav-links" id="navLinks">
            <a href="#projects">${esc(n.projects)}</a>
            <a href="#about">${esc(n.about)}</a>
            <a href="#career">${esc(n.career)}</a>
            <a href="#contact">${esc(n.contact)}</a>
            <a href="${other}" id="langToggle" hreflang="${other === '/en/' ? 'en' : 'pt-BR'}" rel="alternate" title="${esc(n.langToggleLabel)}">
              <img src="${esc(n.langToggleFlag)}" alt="${esc(n.langToggleAlt)}" width="20" height="15" loading="lazy"> ${esc(n.langToggleLabel)}
            </a>
          </div>
        </nav>
      </div>
    </header>`;
}

export function renderMain(d) {
  const s = d.projectsSection, a = d.about, e = d.engineering, k = d.career, c = d.contact;
  const recentCerts = d.certifications.filter(x => x.date >= '2024');
  const olderCerts = d.certifications.filter(x => x.date < '2024');

  const stats = d.stats.map(x => `<div class="lp-stat">
        <strong>${esc(fill(x.number, d))}</strong>
        <span>${esc(fill(x.label, d))}</span>
      </div>`).join('');

  const cards = d.featured.map(item => renderFeatured(item, d)).join('');

  const channels = c.channels.map(ch => `<a href="${esc(href(ch.href))}"${external(ch.href)} class="lp-channel">
        ${renderIcon(ch.icon)}<span>${esc(ch.label)}</span>
      </a>`).join('');

  return `<main>
      <section id="home" class="lp-hero">
        <div class="lp-container">
          <p class="lp-eyebrow">${esc(d.hero.role)}</p>
          <h1>${esc(d.hero.title)}</h1>
          <p class="lp-positioning">${esc(d.hero.positioning)}</p>
          <p class="lp-stack">${esc(d.hero.stack)}</p>
          <p class="lp-description">${esc(d.hero.description)}</p>
          <div class="lp-stats">${stats}</div>
          <div class="lp-actions">
            <a href="#projects" class="lp-btn lp-btn-primary">${esc(d.hero.btnProjects)}</a>
            <a href="#contact" class="lp-btn lp-btn-secondary">${esc(d.hero.btnContact)}</a>
          </div>
        </div>
      </section>

      <section id="projects" class="lp-section">
        <div class="lp-container">
          <h2 class="lp-section-title">${esc(s.sectionTitle)}</h2>
          <p class="lp-section-intro">${esc(s.intro)}</p>
          <div class="lp-grid">${cards}</div>
          <p class="lp-archive"><a href="${esc(href(s.archiveHref))}" target="_blank" rel="noopener noreferrer">${esc(s.archiveLabel)} →</a><span class="lp-archive-sep" aria-hidden="true">·</span><a href="${esc(href(s.storeHref))}" target="_blank" rel="noopener noreferrer">${esc(s.storeLabel)} →</a></p>
        </div>
      </section>

      <section id="about" class="lp-section lp-section-alt">
        <div class="lp-container lp-about-grid">
          <div class="lp-about-text">
            <h2 class="lp-section-title">${esc(a.sectionTitle)}</h2>
            <div class="lp-about-head">
              <button type="button" class="lp-avatar-button" data-profile-dialog-open aria-label="${esc(c.card.open)}">
                <img class="lp-avatar" src="${esc(a.avatar)}" alt="${esc(a.avatarAlt)}" width="112" height="112">
              </button>
              <div class="lp-about-bio">
                ${a.paragraphs.map(p => `<p>${esc(p)}</p>`).join('')}
              </div>
            </div>
            <h3 class="lp-skills-title">${esc(a.skillsTitle)}</h3>
            <p class="lp-skills-intro">${esc(a.skillsIntro)}</p>
            ${a.skills.map(group => `
            <h4 class="lp-skill-group-title">${esc(group.title)}</h4>
            <ul class="lp-skills">${group.items.map(skill => `<li>${esc(skill)}</li>`).join('')}</ul>`).join('')}
          </div>
          <aside class="lp-publications">
            <h3>${esc(a.publicationsTitle)}</h3>
            <p>${esc(a.publicationsText)}</p>
            <a href="https://medium.com/@pconradjunior" target="_blank" rel="noopener noreferrer">${esc(a.mediumLabel)} →</a>
            <p>${esc(a.wticifesText)}</p>
            <a href="${esc(a.wticifesHref)}" target="_blank" rel="noopener noreferrer">${esc(a.wticifesLabel)} →</a>
          </aside>
        </div>
      </section>

      <section id="engineering" class="lp-section lp-section-alt">
        <div class="lp-container">
          <h2 class="lp-section-title">${esc(e.sectionTitle)}</h2>
          <p class="lp-section-intro">${esc(e.intro)}</p>
          <div class="lp-engineering-grid">
            ${e.items.map(item => `<article class="lp-engineering-item">
              <h3>${esc(item.title)}</h3>
              <p>${esc(item.text)}</p>
            </article>`).join('')}
          </div>
          <p class="lp-engineering-link"><a href="${esc(e.linkHref)}" target="_blank" rel="noopener noreferrer">${esc(e.linkLabel)} →</a></p>
        </div>
      </section>

      <section id="career" class="lp-section">
        <div class="lp-container">
          <h2 class="lp-section-title">${esc(k.sectionTitle)}</h2>
          <p class="lp-section-intro">${esc(k.intro)}</p>

          <div class="lp-entries">
            ${d.experience.map(job => `<article class="lp-entry">
              <h3 class="lp-entry-title">${esc(job.role)}</h3>
              <p class="lp-entry-meta">${esc(job.org)} · <time datetime="${esc(job.start)}">${esc(job.startLabel)}</time> – ${job.end ? `<time datetime="${esc(job.end)}">${esc(job.endLabel)}</time>` : esc(job.endLabel)}</p>
              <p class="lp-entry-summary">${esc(job.summary)}</p>
              ${renderDetails(k.moreLabel, `<p>${esc(job.details)}</p>`)}
            </article>`).join('')}
          </div>

          <h3 class="lp-subsection-title">${esc(k.educationTitle)}</h3>
          <div class="lp-entries lp-entries-compact">
            ${d.education.map(ed => `<article class="lp-entry">
              <h4 class="lp-entry-title">${esc(ed.title)}</h4>
              <p class="lp-entry-meta">${esc(ed.org)} · <time datetime="${esc(ed.start)}">${esc(ed.start)}</time>${ed.end ? ` – <time datetime="${esc(ed.end)}">${esc(ed.end)}</time>` : ''}</p>
            </article>`).join('')}
          </div>

          <h3 class="lp-subsection-title">${esc(k.certificationsTitle)}</h3>
          <ul class="lp-certs">
            ${recentCerts.map(renderCertItem).join('')}
          </ul>
          <p class="lp-dialog-action">
            <button type="button" class="lp-dialog-open" data-career-dialog="certifications">${esc(k.dialog.openCertifications)} →</button>
          </p>

          <h3 class="lp-subsection-title">${esc(k.publicationsTitle)}</h3>
          <ul class="lp-typed">
            ${k.publications.slice(0, 3).map(p => renderPubItem(p, k.linkLabel)).join('')}
          </ul>
          <p class="lp-dialog-action">
            <button type="button" class="lp-dialog-open" data-career-dialog="publications">${esc(k.dialog.openPublications)} →</button>
          </p>

          <h3 class="lp-subsection-title">${esc(k.languagesTitle)}</h3>
          <ul class="lp-skills lp-languages">
            ${k.languages.map(l => `<li><strong>${esc(l.name)}</strong> — ${esc(l.level)}</li>`).join('')}
          </ul>
        </div>
      </section>

      <section id="contact" class="lp-section">
        <div class="lp-container">
          <h2 class="lp-section-title">${esc(c.sectionTitle)}</h2>
          <p class="lp-section-intro">${esc(c.intro)}</p>
          <div class="lp-channels">${channels}</div>
        </div>
      </section>
      ${renderCareerDialog(k, olderCerts)}
      ${renderProfileCard(a, c)}
    </main>`;
}

export function renderFooter(d, lang) {
  const f = d.footer;
  const other = lang === 'pt' ? '/en/' : '/';
  const langLabel = lang === 'pt' ? 'English' : 'Português';
  const cols = [
    { title: f.articlesTitle, links: f.articleLinks },
    { title: f.privacyTitle, links: f.privacyLinks }
  ];

  return `<footer class="lp-footer">
      <div class="lp-container">
        <div class="lp-footer-grid">
          <div class="lp-footer-col lp-footer-archive">
            <h3>${esc(f.archiveTitle)}</h3>
            <p>${esc(f.archiveText)}</p>
            <a href="${esc(href(f.archiveLink.href))}" target="_blank" rel="noopener noreferrer">${esc(f.archiveLink.label)} →</a>
          </div>
          ${cols.map(col => `<div class="lp-footer-col">
            <h3>${esc(col.title)}</h3>
            <ul>${col.links.map(l => `<li><a href="${esc(href(l.href))}"${external(l.href)}>${esc(l.label)}</a></li>`).join('')}</ul>
          </div>`).join('')}
          <div class="lp-footer-col">
            <h3>${esc(lang === 'pt' ? 'Idioma' : 'Language')}</h3>
            <ul><li><a href="${other}" hreflang="${other === '/en/' ? 'en' : 'pt-BR'}" rel="alternate">${esc(langLabel)}</a></li></ul>
          </div>
        </div>
        <p class="lp-copyright">${esc(f.copyright)}</p>
        ${f.visitorBadge ? `<p class="lp-badge"><img src="${esc(f.visitorBadge)}" alt="${esc(f.visitorBadgeAlt || '')}" width="88" height="20" loading="lazy"></p>` : ''}
      </div>
    </footer>`;
}

/* ─────────────────────────────────────────────────────────────
   structured data (mantém o acervo completo indexável)
   ───────────────────────────────────────────────────────────── */

function operatingSystem(item) {
    const os = [];
    if (item.links.some(l => /play\.google\.com/.test(l.href || ''))) os.push('Android');
    if (item.links.some(l => /apps\.apple\.com/.test(l.href || ''))) os.push('iOS');
    return os.join(', ') || 'Android';
}

function softwareApp(item, lang) {
  const store = item.links.find(l => /play\.google\.com|apps\.apple\.com/.test(l.href || ''));
  return {
    '@type': 'SoftwareApplication',
    name: item.title,
    description: item.desc,
    applicationCategory: item.category || 'UtilitiesApplication',
    operatingSystem: operatingSystem(item),
    url: (store?.href) || `${SITE.origin}/#${item.title.toLowerCase().replace(/\s+/g, '-')}`,
    ...(store ? { downloadUrl: store.href } : {}),
    ...(item.downloads ? {
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/DownloadAction',
        userInteractionCount: item.downloads
      }
    } : {}),
    author: { '@id': `${SITE.origin}/#person` },
    inLanguage: lang
  };
}

export function buildJsonLd(d, lang) {
  const p = d.projects;
  const apps = [...(p.mobile?.items ?? [])].filter(i => i.links.some(l => /play\.google|apps\.apple/.test(l.href || '')));
  const webApps = p.web?.items ?? [];
  const papers = p.publications?.items ?? [];
  const skills = d.about.skills.flatMap(g => g.items);
  // Unifica grafias da mesma instituição (URCAMP / Urcamp) em uma única entidade.
  const orgs = new Map();
  for (const ed of d.education) {
    const key = ed.org.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!orgs.has(key)) orgs.set(key, /^urcamp$/i.test(ed.org) ? 'URCAMP' : ed.org);
  }
  const alumni = [...orgs.values()].map((name, i) => ({
    '@id': `${SITE.origin}/#org-${i + 1}`,
    '@type': 'CollegeOrUniversity',
    name
  }));

  const person = {
    '@id': `${SITE.origin}/#person`,
    '@type': 'Person',
    name: SITE.author,
    url: `${SITE.origin}/`,
    email: `mailto:${SITE.email}`,
    jobTitle: d.hero.role,
    description: fill(d.hero.description, d),
    knowsAbout: skills,
    knowsLanguage: d.career.languages.map(l => ({ '@type': 'Language', name: l.name })),
    alumniOf: alumni,
    hasCredential: d.certifications.map(c => ({
      '@type': 'EducationalOccupationalCredential',
      name: c.name,
      recognizedBy: { '@type': 'Organization', name: c.issuer },
      dateCreated: c.date
    })),
    worksFor: { '@type': 'CollegeOrUniversity', name: 'Universidade Federal do Pampa (Unipampa)' },
    sameAs: SITE.sameAs
  };

  return [
    { '@context': 'https://schema.org', '@graph': [person] },
    {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      url: lang === 'pt' ? `${SITE.origin}/` : `${SITE.origin}/en/`,
      name: fill(d.meta.title, d),
      description: fill(d.meta.description, d),
      inLanguage: d.meta.lang,
      ...(d.meta.dateModified ? { dateModified: d.meta.dateModified } : {}),
      mainEntity: { '@id': `${SITE.origin}/#person` }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: lang === 'pt' ? 'Aplicativos publicados' : 'Published applications',
      numberOfItems: apps.length,
      itemListElement: apps.map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: softwareApp(a, lang)
      }))
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: lang === 'pt' ? 'Sistemas web desenvolvidos' : 'Web systems built',
      numberOfItems: webApps.length,
      itemListElement: webApps.map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'WebApplication',
          name: a.title,
          description: a.desc,
          applicationCategory: a.category || 'UtilitiesApplication',
          operatingSystem: 'Any',
          author: { '@id': `${SITE.origin}/#person` },
          inLanguage: lang
        }
      }))
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: lang === 'pt' ? 'Trabalhos acadêmicos' : 'Academic papers',
      numberOfItems: papers.length,
      itemListElement: papers.map((a, i) => {
        const link = a.links.find(l => /^https?:/.test(l.href || ''));
        const isNews = /notícia|institutional news/i.test(a.typeLabel || '');
        return {
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': isNews ? 'NewsArticle' : 'ScholarlyArticle',
            name: a.title,
            headline: a.title,
            description: a.desc,
            url: link?.href,
            author: { '@id': `${SITE.origin}/#person` },
            inLanguage: lang
          }
        };
      })
    }
  ];
}

/* ─────────────────────────────────────────────────────────────
   documento completo
   ───────────────────────────────────────────────────────────── */

export function buildHead(d, lang) {
    const m = d.meta;
    const url = lang === 'pt' ? `${SITE.origin}/` : `${SITE.origin}/en/`;
    const image = `${SITE.origin}${SITE.ogImage(lang)}`;
    const flag = lang === 'pt' ? 'br' : 'us';

    const title = fill(m.title, d);
    const description = fill(m.description, d);

    const ld = buildJsonLd(d, lang)
        .map(x => `<script type="application/ld+json">${JSON.stringify(x).replace(/</g, '\\u003c')}</script>`)
        .join('\n    ');

    return `<meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <meta name="author" content="${esc(SITE.author)}">
    <meta name="dateModified" content="${esc(d.meta.dateModified ?? '')}">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <link rel="canonical" href="${url}">
    <link rel="alternate" hreflang="pt-BR" href="${SITE.origin}/">
    <link rel="alternate" hreflang="en" href="${SITE.origin}/en/">
    <link rel="alternate" hreflang="x-default" href="${SITE.origin}/">

    <meta property="og:type" content="profile">
    <meta property="og:site_name" content="${esc(SITE.author)}">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${image}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${esc(m.alt)}">
    <meta property="og:locale" content="${esc(m.ogLocale)}">
    <meta property="og:locale:alternate" content="${esc(lang === 'pt' ? 'en_US' : 'pt_BR')}">
    <meta property="profile:first_name" content="Pedro">
    <meta property="profile:last_name" content="Conrad Junior">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(description)}">
    <meta name="twitter:image" content="${image}">
    <meta name="twitter:image:alt" content="${esc(m.alt)}">

    <link rel="icon" type="image/svg+xml" href="/resources/images/flags/${flag}.svg" id="favicon">
    <link rel="preload" href="/resources/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/resources/fonts/sora-latin.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="/resources/css/landing.css">
    <link rel="prefetch" href="/resources/content/${lang}.json" as="fetch" crossorigin>
    ${ld}`;
}

export function renderVideoModal(d, lang) {
  const label = lang === 'pt' ? 'Player de vídeo' : 'Video player';
  const title = lang === 'pt' ? 'Vídeo de demonstração' : 'Demo video';
  const close = lang === 'pt' ? 'Fechar' : 'Close';

  return `<div class="lp-video-modal" id="videoModal" role="dialog" aria-modal="true" aria-label="${esc(label)}" hidden>
    <div class="lp-modal-content">
      <button type="button" class="lp-close-modal" data-close-modal aria-label="${esc(close)}">&times;</button>
      <div class="lp-video-container">
        <iframe id="videoFrame" title="${esc(title)}" src="" loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen></iframe>
      </div>
    </div>
  </div>`;
}

export function buildDocument(d, lang) {
  return `<!DOCTYPE html>
<html lang="${esc(d.meta.lang)}">

<head>
    ${buildHead(d, lang)}
</head>

<body>
    ${renderHeader(d, lang)}
    ${renderMain(d)}
    ${renderFooter(d, lang)}
    ${renderVideoModal(d, lang)}

    <script type="module" src="/resources/js/main.js"></script>
</body>

</html>
`;
}
