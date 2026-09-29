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
  ],
  storeLinks: {
    chesskids: 'https://play.google.com/store/apps/details?id=pconradjunior.chesskids',
    unipampaPlay: 'https://play.google.com/store/apps/details?id=br.edu.unipampa.app',
    unipampaIos: 'https://apps.apple.com/app/app-unipampa/id1639927711',
    smellcheck: 'https://play.google.com/store/apps/details?id=pconradjunior.smellcheck',
    fingernotes: 'https://play.google.com/store/apps/details?id=pconradjunior.fingernotes',
    phisicalc: 'https://play.google.com/store/apps/details?id=pconradjunior.phisicalc'
  }
};

/** Ordem das abas de filtro e o bloco do JSON que cada uma controla. */
export const GROUPS = [
  { key: 'mobile', id: 'mobile', filter: 'mobile' },
  { key: 'web', id: 'web', filter: 'web' },
  { key: 'other', id: 'other-projects', filter: 'other' },
  { key: 'technicalArticles', id: 'technical-articles', filter: 'technical' },
  { key: 'reflections', id: 'reflections', filter: 'reflections' },
  { key: 'career', id: 'career', filter: 'career' },
  { key: 'publications', id: 'publications', filter: 'publications' },
  { key: 'videos', id: 'videos', filter: 'videos' }
];

export const FILTER_LABELS = {
  pt: { all: 'Todos', group: 'Filtrar por categoria' },
  en: { all: 'All', group: 'Filter by category' }
};

/* ─────────────────────────────────────────────────────────────
   escaping
   ───────────────────────────────────────────────────────────── */

const ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapa texto para contexto de HTML. */
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ENT[c]);

/** Escapa texto destined to a JSON-LD string literal. */
const jsonStr = s => JSON.stringify(String(s ?? '')).slice(1, -1).replace(/</g, '\\u003c');

/** Resolve a URL de um link interno para caminho absoluto a partir da raiz. */
function href(h) {
    if (!h) return '#';
    if (/^(https?:|mailto:|#)/.test(h)) return h;
    return '/' + h.replace(/^\.?\//, '');
}

/* ─────────────────────────────────────────────────────────────
   contagens derivadas
   Impedem que números citados em textos divirjam dos dados.
   Use {{apps}}, {{articles}}, {{papers}}, {{projects}} nos JSONs.
   ───────────────────────────────────────────────────────────── */

const STORE = /play\.google\.com|apps\.apple\.com/;

/** Formata contagens grandes no estilo da Play Store: 5000 -> "5k+". */
function compact(n) {
    if (!n) return null;
    if (n >= 1000) return `${Math.round(n / 1000)}k+`;
    return `${n}+`;
}

export function counts(d) {
    const p = d.projects;
    const mobile = p.mobile?.items ?? [];
    const published = mobile.filter(i => i.links.some(l => STORE.test(l.href || '')));
    const total = published.reduce((n, i) => n + (i.downloads || 0), 0);

    return {
        apps: published.length,
        articles: (p.technicalArticles?.items ?? []).length
            + (p.reflections?.items ?? []).length
            + (p.career?.items ?? []).length,
        papers: (p.publications?.items ?? []).length,
        projects: GROUPS.reduce((n, g) => n + (p[g.key]?.items?.length ?? 0), 0),
        downloads: compact(total),
        downloadsExact: total
    };
}

/** Substitui os tokens {{chave}} pelos números atuais. */
export function fill(text, d) {
    const c = counts(d);
    return String(text ?? '').replace(/\{\{(\w+)\}\}/g, (m, k) => (c[k] ?? m));
}

/** Formata a contagem de downloads de um app, ou null se não informado. */
export function downloadLabel(item) {
    return item.downloads ? compact(item.downloads) : null;
}

/* ─────────────────────────────────────────────────────────────
   blocos de conteúdo
   ───────────────────────────────────────────────────────────── */

function renderLinks(links) {
  if (!links || !links.length) return '';
  const items = links.map(l => {
    const label = l.label ? ` ${esc(l.label)}` : '';
    const title = l.title ? ` title="${esc(l.title)}" aria-label="${esc(l.title)}"` : '';
    if (l.action === 'video') {
      return `<button type="button" class="btn-link" data-video="${esc(l.videoId)}"${title}>
                <i class="${esc(l.icon)}" aria-hidden="true"></i>${label}
              </button>`;
    }
    if (l.action === 'infoModal') {
      return `<button type="button" class="btn-link" data-info-modal${title}>
                <i class="${esc(l.icon)}" aria-hidden="true"></i>${label}
              </button>`;
    }
    const target = /^(https?:|mailto:)/.test(l.href) ? ' target="_blank" rel="noopener noreferrer"' : '';
    const style = l.style ? ` style="${esc(l.style)}"` : '';
    return `<a href="${esc(href(l.href))}"${target}${style} class="btn-link"${title}>
              <i class="${esc(l.icon)}" aria-hidden="true"></i>${label}
            </a>`;
  });
  return `<div class="project-links">${items.join('')}</div>`;
}

function renderCard(item) {
    const dl = downloadLabel(item);
    return `<article class="project-card">
            <div class="project-content">
              <span class="project-type"><i class="${esc(item.typeIcon)}" aria-hidden="true"></i> ${esc(item.typeLabel)}</span>
              <h4 class="project-title">${esc(item.title)}</h4>
              ${dl ? `<span class="project-metric"><i class="fa fa-download" aria-hidden="true"></i> ${esc(dl)} downloads</span>` : ''}
              <p class="project-desc">${esc(item.desc)}</p>
              ${renderLinks(item.links)}
            </div>
          </article>`;
}

/** Sistemas operacionais derivados dos links de loja, não do stack. */
function operatingSystem(item) {
    const os = [];
    if (item.links.some(l => /play\.google\.com/.test(l.href || ''))) os.push('Android');
    if (item.links.some(l => /apps\.apple\.com/.test(l.href || ''))) os.push('iOS');
    return os.join(', ') || 'Android';
}

/** Só emite um stat quando todos os seus tokens resolveram (evita "null" na página). */
function renderStats(stats, d) {
    return stats.map(s => {
        const num = fill(s.number, d), label = fill(s.label, d);
        if (num == null || String(num).includes('{{')) return '';
        return `<div class="stat-card"><span class="stat-number">${esc(num)}</span><span class="stat-label">${esc(label)}</span></div>`;
    }).join('');
}

/* ─────────────────────────────────────────────────────────────
   header / footer
   ───────────────────────────────────────────────────────────── */
export function renderHeader(d, lang) {
  const n = d.nav;
  const other = lang === 'pt' ? '/en/' : '/';
  return `<header>
        <div class="container">
          <nav aria-label="${esc(lang === 'pt' ? 'Navegação principal' : 'Main navigation')}">
            <button class="hamburger" id="hamburgerBtn" type="button"
                aria-label="${esc(lang === 'pt' ? 'Abrir menu' : 'Open menu')}" aria-expanded="false" aria-controls="navLinks">
              <i class="fa fa-bars" aria-hidden="true"></i>
            </button>
            <a href="#" class="logo">
              <i class="fa fa-code logo-icon" aria-hidden="true"></i><span>${esc(n.brand ?? 'Pedro Conrad Jr')}</span>
            </a>
            <div class="nav-links" id="navLinks">
              <a href="#home">${esc(n.home)}</a>
              <a href="#about">${esc(n.about)}</a>
              <a href="#expertise">${esc(n.expertise)}</a>
              <div class="dropdown">
                <a href="#projects" id="nav-projects" aria-haspopup="true">${esc(n.projects)} <i class="fa fa-chevron-down" aria-hidden="true"></i></a>
                <div class="dropdown-content">
                  <a href="#mobile">${esc(n.projectsMobile)}</a>
                  <a href="#web">${esc(n.projectsWeb)}</a>
                  <a href="#other-projects">${esc(n.projectsOther)}</a>
                  <a href="#technical-articles">${esc(n.projectsTechArticles)}</a>
                  <a href="#reflections">${esc(n.projectsReflections)}</a>
                  <a href="#career">${esc(n.projectsCareer)}</a>
                  <a href="#publications">${esc(n.projectsPublications)}</a>
                  <a href="#videos">${esc(n.projectsVideos)}</a>
                </div>
              </div>
              <a href="#contact">${esc(n.contact)}</a>
              <a href="${other}" id="langToggle" hreflang="${other === '/en/' ? 'en' : 'pt-BR'}" rel="alternate" title="${esc(n.langToggleLabel)}">
                <img src="${esc(n.langToggleFlag)}" alt="${esc(n.langToggleAlt)}" width="20" height="15" loading="lazy"> ${esc(n.langToggleLabel)}
              </a>
            </div>
          </nav>
        </div>
      </header>`;
}

export function renderFooter(d) {
  return `<footer>
        <div class="container">
          <p>${esc(d.footer.copyright)}</p>
          <p class="footer-version">${esc(d.footer.version)}</p>
        </div>
      </footer>`;
}

/* ─────────────────────────────────────────────────────────────
   main
   ───────────────────────────────────────────────────────────── */

export function renderMain(d) {
  const a = d.about, e = d.expertise, p = d.projects, c = d.contact;

  const total = GROUPS.reduce((n, g) => n + (p[g.key]?.items?.length ?? 0), 0);

  const groups = GROUPS.map(g => {
    const blk = p[g.key];
    if (!blk || !blk.items.length) return '';
    return `<section class="project-group" id="${g.id}" data-category="${g.filter}" aria-labelledby="h-${g.id}">
          <h3 class="group-title" id="h-${g.id}">${esc(blk.title)} <span class="group-count">${blk.items.length}</span></h3>
          ${blk.desc ? `<p class="group-desc">${esc(blk.desc)}</p>` : ''}
          <div class="portfolio-grid">${blk.items.map(renderCard).join('')}</div>
        </section>`;
  }).join('');

  const tabs = [
    `<input type="radio" name="pf" id="pf-all" class="pf-controller" checked>`,
    ...GROUPS.filter(g => p[g.key]?.items?.length).map(g =>
      `<input type="radio" name="pf" id="pf-${g.filter}" class="pf-controller">`)
  ].join('\n          ');

  const labels = [
    `<label for="pf-all" class="filter-tab">${esc(FILTER_LABELS[d.meta.lang === 'pt-BR' ? 'pt' : 'en'].all)} <span class="filter-count">${total}</span></label>`,
    ...GROUPS.filter(g => p[g.key]?.items?.length).map(g =>
      `<label for="pf-${g.filter}" class="filter-tab">${esc(p[g.key].title)} <span class="filter-count">${p[g.key].items.length}</span></label>`)
  ].join('\n            ');

  return `<main>
        <section id="home" class="hero">
          <div class="container">
            <div class="hero-content">
              <span class="hero-greeting">${esc(d.hero.greeting)}</span>
              <h1>${esc(d.hero.title)}</h1>
              <p class="hero-role">${esc(d.hero.role)}</p>
              <p class="hero-stack">${esc(d.hero.stack)}</p>
              <p class="hero-description">${esc(d.hero.description)}</p>
              <div class="hero-buttons">
                <a href="#projects" class="btn btn-primary">${esc(d.hero.btnProjects)}</a>
                <a href="${SITE.sameAs[0]}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary"><i class="fa-brands fa-github" aria-hidden="true"></i> <span>${esc(d.hero.btnGitHub)}</span></a>
                <a href="${SITE.sameAs[1]}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary"><i class="fa-brands fa-linkedin" aria-hidden="true"></i> <span>${esc(d.hero.btnLinkedIn)}</span></a>
                <a href="${SITE.sameAs[3]}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary"><i class="fa-brands fa-instagram" aria-hidden="true"></i> <span>${esc(d.hero.btnInstagram)}</span></a>
              </div>
            </div>
          </div>
        </section>

        <section id="about" class="about">
          <div class="container">
            <h2 class="section-title">${esc(a.sectionTitle)}</h2>
            <div class="about-grid">
              <div class="about-text">
                <ul class="skill-list" role="list">${a.skills.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
                ${a.paragraphs.map(t => `<p>${esc(t)}</p>`).join('')}
                <p class="teaching"><strong>${esc(a.teaching.label)}:</strong> ${esc(a.teaching.title)} — ${esc(a.teaching.desc)}</p>
              </div>
              <div class="about-stats">
                <div class="stats-grid">
                  ${renderStats(a.stats, d)}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="expertise" class="services">
          <div class="container">
            <h2 class="section-title">${esc(e.sectionTitle)}</h2>
            <div class="about-text">${e.sectionIntro.map(t => `<p class="centered">${esc(t)}</p>`).join('')}</div>
            <div class="services-grid">
              ${e.cards.map(x => `<div class="service-card">
                <div class="service-icon"><i class="${esc(x.icon)}" aria-hidden="true"></i></div>
                <h3>${esc(x.title)}</h3>
                <p>${esc(x.text)}</p>
              </div>`).join('')}
            </div>
          </div>
        </section>

        <section id="projects" class="portfolio">
          <div class="container">
            <h2 class="section-title">${esc(p.sectionTitle)}</h2>
            <p class="section-intro centered">${esc(p.intro)}</p>

            <div class="filters" role="group" aria-label="${esc(FILTER_LABELS[d.meta.lang === 'pt-BR' ? 'pt' : 'en'].group)}">
          ${tabs}
              <div class="filter-tabs">
            ${labels}
              </div>
            </div>

            <div id="projectGroups">${groups}</div>
          </div>
        </section>

        <section id="contact" class="contact">
          <div class="container">
            <h2 class="section-title">${esc(c.sectionTitle)}</h2>
            <div class="contact-container">
              <div class="contact-info">
                <h3>${esc(c.infoTitle)}</h3>
                <p>${esc(c.infoText)}</p>
                <div class="contact-details">
                  <a href="${SITE.sameAs[2]}" target="_blank" rel="noopener noreferrer" class="contact-item"><i class="fa-brands fa-medium" aria-hidden="true"></i><span>@pconradjunior</span></a>
                  <a href="mailto:${SITE.email}" class="contact-item"><i class="fa fa-envelope" aria-hidden="true"></i><span>${esc(SITE.email)}</span></a>
                  <a href="${SITE.sameAs[1]}" target="_blank" rel="noopener noreferrer" class="contact-item"><i class="fa-brands fa-linkedin" aria-hidden="true"></i><span>/in/pconradjunior</span></a>
                  <a href="${SITE.sameAs[3]}" target="_blank" rel="noopener noreferrer" class="contact-item"><i class="fa-brands fa-instagram" aria-hidden="true"></i><span>@pedrojunior.dev</span></a>
                  <a href="${SITE.sameAs[0]}" target="_blank" rel="noopener noreferrer" class="contact-item"><i class="fa-brands fa-github" aria-hidden="true"></i><span>@pconradjunior</span></a>
                </div>
              </div>

              <form id="contact-form" action="https://api.web3forms.com/submit" method="POST" class="contact-form">
                <input type="hidden" name="access_key" value="39b311c5-6dc8-443a-8cb3-91516f8cf9e3">
                <input type="hidden" name="redirect" value="${SITE.origin}/${c.form.redirect}">
                <div class="form-group">
                  <label for="name">${esc(c.form.labelName)}</label>
                  <input type="text" id="name" name="name" class="form-control" placeholder="${esc(c.form.placeholderName)}" autocomplete="name" required>
                </div>
                <div class="form-group">
                  <label for="email">${esc(c.form.labelEmail)}</label>
                  <input type="email" id="email" name="email" class="form-control" placeholder="${esc(c.form.placeholderEmail)}" autocomplete="email" required>
                </div>
                <div class="form-group">
                  <label for="subject">${esc(c.form.labelSubject)}</label>
                  <select name="subject" id="subject" class="form-control" required>
                    ${c.form.options.map(o => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label for="message">${esc(c.form.labelMessage)}</label>
                  <textarea id="message" name="message" rows="5" class="form-control" placeholder="${esc(c.form.placeholderMessage)}" required></textarea>
                </div>
                <div class="h-captcha" data-captcha="true" data-theme="dark" data-lang="${esc(c.form.captchaLang)}"></div>
                <input type="text" name="botcheck" class="form-honey" tabindex="-1" autocomplete="off" aria-hidden="true">
                <p class="form-status" id="form-status" role="status" aria-live="polite"></p>
                <button type="submit" id="btn-submit" class="btn btn-submit">
                  <span class="btn-label">${esc(c.form.btnSubmit)} <i class="fa fa-paper-plane" aria-hidden="true"></i></span>
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>`;
}

/* ─────────────────────────────────────────────────────────────
   structured data
   ───────────────────────────────────────────────────────────── */

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
  // links adicionais viram citation: reforca a ligacao entre obra e publicacao
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
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Space+Grotesk:wght@300;400;500;700&display=swap">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="/css/style.css">
    <link rel="preload" as="fetch" href="/content/${lang}.json" crossorigin>
    <script>
      (function () {
        var t = localStorage.getItem('theme');
        if (t) document.documentElement.classList.add(t);
      })();
    </script>
    ${ld}`;
}

export function buildDocument(d, lang) {
  const c = d.contact;
  return `<!DOCTYPE html>
<html lang="${esc(d.meta.lang)}">

<head>
    ${buildHead(d, lang)}
</head>

<body>
    <input type="radio" name="theme" id="theme-cyan" class="theme-controller" value="theme-cyan">
    <input type="radio" name="theme" id="theme-purple" class="theme-controller" value="theme-purple">
    <input type="radio" name="theme" id="theme-green" class="theme-controller" value="theme-green">
    <div class="theme-switcher" role="group" aria-label="${esc(d.themeSwitcherTitle)}" title="${esc(d.themeSwitcherTitle)}">
      <label for="theme-cyan" class="theme-label label-cyan"><span class="sr-only">${esc(d.themeSwitcherTitle)}</span></label>
      <label for="theme-purple" class="theme-label label-purple"><span class="sr-only">${esc(d.themeSwitcherTitle)}</span></label>
      <label for="theme-green" class="theme-label label-green"><span class="sr-only">${esc(d.themeSwitcherTitle)}</span></label>
    </div>

    ${renderHeader(d, lang)}
    ${renderMain(d)}
    ${renderFooter(d)}

    <div class="video-modal" id="videoModal" role="dialog" aria-modal="true" aria-label="${esc(lang === 'pt' ? 'Player de vídeo' : 'Video player')}" hidden>
      <div class="modal-content">
        <button type="button" class="close-modal" data-close-modal aria-label="${esc(lang === 'pt' ? 'Fechar' : 'Close')}">&times;</button>
        <div class="video-container">
          <iframe id="videoFrame" title="${esc(lang === 'pt' ? 'Vídeo de demonstração' : 'Demo video')}" src="" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
      </div>
    </div>

    <div class="info-modal" id="infoModal" role="dialog" aria-modal="true" aria-label="${esc(lang === 'pt' ? 'Informação' : 'Information')}" hidden>
      <div class="modal-content">
        <button type="button" class="close-modal" data-close-modal aria-label="${esc(lang === 'pt' ? 'Fechar' : 'Close')}">&times;</button>
        <i class="fa fa-info-circle info-modal-icon" aria-hidden="true"></i>
        <p class="info-modal-text">${esc(d.infoModal.text)}</p>
      </div>
    </div>

    <script src="https://web3forms.com/client/script.js" async defer></script>
    <script type="module" src="/js/main.js"></script>
</body>

</html>
`;
}
