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
  ogImage: '/images/og-image.png',
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
        const title = l.title ? ` title="${esc(l.title)}" aria-label="${esc(l.title)}"` : '';
        const icon = `<i class="${esc(l.icon)}" aria-hidden="true"></i>`;

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
            <i class="fa fa-bars" aria-hidden="true"></i>
          </button>
          <a href="#home" class="lp-logo">${esc(n.brand)}</a>
          <div class="lp-nav-links" id="navLinks">
            <a href="#projects">${esc(n.projects)}</a>
            <a href="#about">${esc(n.about)}</a>
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
  const s = d.projectsSection, a = d.about, c = d.contact;

  const stats = d.stats.map(x => `<div class="lp-stat">
        <strong>${esc(fill(x.number, d))}</strong>
        <span>${esc(fill(x.label, d))}</span>
      </div>`).join('');

  const cards = d.featured.map(item => renderFeatured(item, d)).join('');

  const channels = c.channels.map(ch => `<a href="${esc(href(ch.href))}"${external(ch.href)} class="lp-channel">
        <i class="${esc(ch.icon)}" aria-hidden="true"></i><span>${esc(ch.label)}</span>
      </a>`).join('');

  return `<main>
      <section id="home" class="lp-hero">
        <div class="lp-container">
          <p class="lp-eyebrow">${esc(d.hero.role)}</p>
          <h1>${esc(d.hero.title)}</h1>
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
          <p class="lp-archive"><a href="${esc(href(s.archiveHref))}" target="_blank" rel="noopener noreferrer">${esc(s.archiveLabel)} →</a></p>
        </div>
      </section>

      <section id="about" class="lp-section lp-section-alt">
        <div class="lp-container lp-about-grid">
          <div class="lp-about-text">
            <h2 class="lp-section-title">${esc(a.sectionTitle)}</h2>
            <div class="lp-about-head">
              <img class="lp-avatar" src="${esc(a.avatar)}" alt="${esc(a.avatarAlt)}" width="112" height="112">
              <div class="lp-about-bio">
                ${a.paragraphs.map(p => `<p>${esc(p)}</p>`).join('')}
              </div>
            </div>
            <ul class="lp-skills">${a.skills.map(skill => `<li>${esc(skill)}</li>`).join('')}</ul>
          </div>
          <aside class="lp-publications">
            <h3>${esc(a.publicationsTitle)}</h3>
            <p>${esc(a.publicationsText)}</p>
            <a href="https://medium.com/@pconradjunior" target="_blank" rel="noopener noreferrer">${esc(a.mediumLabel)} →</a>
          </aside>
        </div>
      </section>

      <section id="contact" class="lp-section">
        <div class="lp-container">
          <h2 class="lp-section-title">${esc(c.sectionTitle)}</h2>
          <div class="lp-channels">${channels}</div>
        </div>
      </section>
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
        ${f.visitorBadge ? `<p class="lp-badge"><img src="${esc(f.visitorBadge)}" alt="${esc(f.visitorBadgeAlt || '')}" loading="lazy"></p>` : ''}
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

function articleNode(item, lang) {
  const externals = item.links.filter(l => /^https?:/.test(l.href || ''));
  const link = externals[0];
  const local = item.links.find(l => /^article_/.test(l.href || ''));
  const extra = (local ? externals : externals.slice(1));
  return {
    '@type': 'Article',
    headline: item.title,
    description: item.desc,
    url: local ? `${SITE.origin}/${local.href}` : link?.href,
    ...(extra.length ? {
      citation: extra.map(l => ({
        '@type': 'CreativeWork',
        name: l.title || l.label || item.title,
        url: l.href
      }))
    } : {}),
    author: { '@id': `${SITE.origin}/#person` },
    publisher: { '@id': `${SITE.origin}/#person` },
    inLanguage: lang
  };
}

export function buildJsonLd(d, lang) {
  const p = d.projects;
  const apps = [...(p.mobile?.items ?? [])].filter(i => i.links.some(l => /play\.google|apps\.apple/.test(l.href || '')));
  const webApps = p.web?.items ?? [];
  const writings = [
    ...(p.technicalArticles?.items ?? []),
    ...(p.reflections?.items ?? []),
    ...(p.career?.items ?? [])
  ];
  const papers = p.publications?.items ?? [];

  const person = {
    '@id': `${SITE.origin}/#person`,
    '@type': 'Person',
    name: SITE.author,
    url: `${SITE.origin}/`,
    email: `mailto:${SITE.email}`,
    jobTitle: d.hero.role,
    description: fill(d.hero.description, d),
    knowsAbout: d.about.skills,
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
      mainEntity: { '@id': `${SITE.origin}/#person` }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: lang === 'pt' ? 'Aplicativos publicados' : 'Published applications',
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
      name: lang === 'pt' ? 'Publicações e artigos' : 'Publications and articles',
      numberOfItems: writings.length,
      itemListElement: writings.map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: articleNode(a, lang)
      }))
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: lang === 'pt' ? 'Trabalhos acadêmicos' : 'Academic papers',
      numberOfItems: papers.length,
      itemListElement: papers.map((a, i) => {
        const link = a.links.find(l => /^https?:/.test(l.href || ''));
        return {
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'ScholarlyArticle',
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
    const image = `${SITE.origin}${SITE.ogImage}`;
    const flag = lang === 'pt' ? 'br' : 'us';

    const title = fill(m.title, d);
    const description = fill(m.description, d);
    const keywords = m.keywords.map(k => fill(k, d)).join(', ');

    const ld = buildJsonLd(d, lang)
        .map(x => `<script type="application/ld+json">${JSON.stringify(x).replace(/</g, '\\u003c')}</script>`)
        .join('\n    ');

    return `<meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <meta name="keywords" content="${esc(keywords)}">
    <meta name="author" content="${esc(SITE.author)}">
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

    <link rel="icon" type="image/svg+xml" href="/images/flags/${flag}.svg" id="favicon">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@400;500;600;700&display=swap">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="/css/landing.css">
    <link rel="preload" as="fetch" href="/content/${lang}.json" crossorigin>
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

    <script type="module" src="/js/main.js"></script>
</body>

</html>
`;
}
