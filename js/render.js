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
  cv: {
    pt: '/cv/',
    en: '/en/cv/'
  },
  social: {
    github: 'https://github.com/pconradjunior',
    linkedin: 'https://www.linkedin.com/in/pconradjunior/',
    medium: 'https://medium.com/@pconradjunior',
    instagram: 'https://instagram.com/pedrojunior.dev'
  }
};

/** Ordem importa: publicada em sameAs e nos links do topo. */
export const SOCIAL_KEYS = ['github', 'linkedin', 'medium', 'instagram'];

export const sameAs = () => SOCIAL_KEYS.map(k => SITE.social[k]);

/* ─────────────────────────────────────────────────────────────
   páginas
   ───────────────────────────────────────────────────────────── */

/**
 * Páginas fixas do site. `dir` é o diretório em disco onde o build
 * escreve (relativo à raiz), '' para a raiz.
 */
export const PAGES = [
  { key: 'home', dir: '', pt: '/', en: '/en/' },
  { key: 'work', dir: 'work', pt: '/work/', en: '/en/work/' },
  { key: 'writing', dir: 'writing', pt: '/writing/', en: '/en/writing/' },
  { key: 'about', dir: 'about', pt: '/about/', en: '/en/about/' },
  { key: 'cv', dir: 'cv', pt: '/cv/', en: '/en/cv/' }
];

export const PAGE_BY_KEY = Object.fromEntries(PAGES.map(p => [p.key, p]));

/**
 * Chave da página → chave da seção de conteúdo. São iguais em quase todo caso,
 * mas o currículo mora em `resume` e a rota é /cv/ — sem este mapa, head()
 * buscaria `d.cv`, que não existe, e cairia no título da home.
 */
const PAGE_CONTENT_KEY = { cv: 'resume' };

export const pageKey = key => PAGE_CONTENT_KEY[key] ?? key;

/* ─────────────────────────────────────────────────────────────
   case studies
   ───────────────────────────────────────────────────────────── */

/**
 * Seções obrigatórias de um case study. Um estudo sem todas elas vira uma
 * página de propaganda, que é exatamente o que o reposicionamento quer evitar.
 * `architecture`, `decisions`, `challenges` são opcionais porque só entram
 * quando existe evidência para sustentá-las.
 */
export const CS_REQUIRED_SECTIONS = ['context', 'problem', 'solution', 'role'];

export const CS_STATUSES = ['active', 'finished', 'experimental'];

/** URL de um case study pelo slug. Espelha o diretório em disco. */
export const caseStudyUrl = (slug, lang) => (lang === 'pt' ? `/work/${slug}/` : `/en/work/${slug}/`);

/**
 * Descritor de página para um case study. Tem o mesmo formato de PAGES, então
 * pageUrl/pageFile/head/sitemap passam a funcionar sem tratamento especial.
 */
export const casePage = cs => ({
  key: `case:${cs.slug}`,
  kind: 'case',
  slug: cs.slug,
  cs,
  dir: `work/${cs.slug}`,
  pt: `/work/${cs.slug}/`,
  en: `/en/work/${cs.slug}/`
});

/** URL de uma página em um idioma. */
export const pageUrl = (p, lang) => (lang === 'pt' ? p.pt : p.en);

/** Caminho do arquivo que o build escreve para uma página. */
export const pageFile = p => (p.dir ? `${p.dir}/index.html` : 'index.html');

/**
 * Item de navegação. `page` aponta para uma página fixa; `anchor` aponta
 * para uma section da home — resolvido para `/#id` fora da home, para que
 * o link funcione de qualquer subpágina.
 */
const NAV_ITEMS = [
  { key: 'work', page: 'work', icon: 'fa fa-layer-group' },
  { key: 'engineering', anchor: 'engineering', icon: 'fa fa-diagram-project' },
  { key: 'writing', page: 'writing', icon: 'fa fa-pen-nib' },
  { key: 'about', page: 'about', icon: 'fa fa-user' },
  { key: 'contact', anchor: 'contact', icon: 'fa fa-envelope' }
];

/* ─────────────────────────────────────────────────────────────
   catálogo (páginas work e writing)
   ───────────────────────────────────────────────────────────── */

/** Grupos do catálogo de sistemas e do catálogo de textos. */
export const CATALOG = {
  work: {
    groups: ['mobile', 'web', 'other', 'videos'],
    filters: ['mobile', 'web', 'other', 'videos']
  },
  writing: {
    groups: ['technicalArticles', 'reflections', 'career', 'publications'],
    filters: null
  }
};

/**
 * chave no JSON de conteúdo · id de âncora · valor do filtro por categoria.
 * `key` e `filter` divergem de propósito: o JSON é escrito em camelCase e as
 * âncoras precisao ser kebab-case / estáveis.
 */
const GROUP_META = {
  mobile: { key: 'mobile', id: 'mobile', filter: 'mobile' },
  web: { key: 'web', id: 'web', filter: 'web' },
  other: { key: 'other', id: 'other-projects', filter: 'other' },
  videos: { key: 'videos', id: 'videos', filter: 'videos' },
  technicalArticles: { key: 'technicalArticles', id: 'technical-articles', filter: 'technical' },
  reflections: { key: 'reflections', id: 'reflections', filter: 'reflections' },
  career: { key: 'career', id: 'career', filter: 'career' },
  publications: { key: 'publications', id: 'publications', filter: 'publications' }
};

/** Todos os grupos, na ordem de renderização dentro das páginas work/writing. */
export const GROUPS = Object.entries(GROUP_META)
  .map(([k, g]) => ({ ...g, groupKey: k }));

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

/** Resolve a URL de um link interno para caminho absoluto a partir da raiz. */
function href(h) {
  if (!h) return '#';
  if (/^(https?:|mailto:|#)/.test(h)) return h;
  return '/' + h.replace(/^\.?\//, '');
}

/* ─────────────────────────────────────────────────────────────
   contagens derivadas
   Impedem que números citados em textos divirjam dos dados.
   Use {{apps}}, {{articles}}, {{papers}}, {{projects}}, {{systems}},
   {{downloads}} e {{downloadsExact}} nos JSONs.
   ───────────────────────────────────────────────────────────── */

const STORE = /play\.google\.com|apps\.apple\.com/;

/** Formata contagens grandes no estilo da Play Store: 5000 -> "5k+". */
function compact(n) {
    if (!n) return null;
    if (n >= 1000) return `${Math.round(n / 1000)}k+`;
    return `${n}+`;
}

/** Itens de publicação que são artigo científico (exclui notícias institucionais). */
const isPaper = item => (item.kind ?? 'paper') === 'paper';

export function counts(d) {
    const p = d.projects;
    const mobile = p.mobile?.items ?? [];
    const published = mobile.filter(i => i.links.some(l => STORE.test(l.href || '')));
    const total = published.reduce((n, i) => n + (i.downloads || 0), 0);

    const publications = p.publications?.items ?? [];

    return {
        apps: published.length,
        articles: (p.technicalArticles?.items ?? []).length
            + (p.reflections?.items ?? []).length
            + (p.career?.items ?? []).length,
        papers: publications.filter(isPaper).length,
        news: publications.length - publications.filter(isPaper).length,
        projects: ['mobile', 'web', 'other', 'videos', 'technicalArticles', 'reflections', 'career', 'publications']
            .reduce((n, k) => n + (p[k]?.items?.length ?? 0), 0),
        // sistemas e apps de fato construídos — não soma artigos nem publicações
        systems: ['mobile', 'web', 'other'].reduce((n, k) => n + (p[k]?.items?.length ?? 0), 0),
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
    return `<a href="${esc(href(l.href))}"${target} class="btn-link"${title}>
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

/* ─────────────────────────────────────────────────────────────
   header / footer
   ───────────────────────────────────────────────────────────── */

/** Resolve o href de um item de nav para a página atual. */
function navHref(item, page, lang) {
    if (item.page) return pageUrl(PAGE_BY_KEY[item.page], lang);
    // anchor da home: relativo quando já estamos na home, absoluto caso contrário
    return page.key === 'home' ? `#${item.anchor}` : `/#${item.anchor}`;
}

export function renderHeader(d, lang, page) {
  const n = d.nav;
  const other = lang === 'pt' ? 'en' : 'pt';
  const cv = SITE.cv[lang];

  // Um case study é uma subpágina de /work/, então "Work" é que fica ativo —
  // comparar com page.key nunca marcaria nada, já que a chave é "case:<slug>".
  const section = page.kind === 'case' ? 'work' : page.key;
  const navLinks = NAV_ITEMS.map(item => {
    const current = item.page === section;
    const cls = current ? ' class="active" aria-current="page"' : '';
    return `              <a href="${esc(navHref(item, page, lang))}"${cls}>${esc(n[item.key])}</a>`;
  }).join('\n');

  const socials = SOCIAL_KEYS
    .filter(k => k === 'github' || k === 'linkedin')
    .map(k => `<a href="${esc(SITE.social[k])}" target="_blank" rel="noopener noreferrer" title="${esc(n.socialTitle[k])}">
                <i class="fa-brands fa-${k}" aria-hidden="true"></i><span class="sr-only">${esc(n.socialTitle[k])}</span>
              </a>`)
    .join('');

  return `<header>
        <div class="container">
          <nav aria-label="${esc(n.navLabel)}">
            <button class="hamburger" id="hamburgerBtn" type="button"
                aria-label="${esc(n.openMenu)}" data-label-open="${esc(n.openMenu)}" data-label-close="${esc(n.closeMenu)}"
                aria-expanded="false" aria-controls="navLinks">
              <i class="fa fa-bars" aria-hidden="true"></i>
            </button>
            <a href="${esc(pageUrl(PAGE_BY_KEY.home, lang))}" class="logo">
              <i class="fa fa-code logo-icon" aria-hidden="true"></i><span>${esc(n.brand)}</span>
            </a>
            <div class="nav-links" id="navLinks">
${navLinks}
              <span class="nav-socials">
                ${socials}
                <a href="${esc(cv)}" title="${esc(n.cv)}"><i class="fa fa-file-pdf" aria-hidden="true"></i><span class="sr-only">${esc(n.cv)}</span></a>
              </span>
              <a href="${esc(pageUrl(page, other))}" id="langToggle" hreflang="${other === 'en' ? 'en' : 'pt-BR'}" rel="alternate" title="${esc(n.langToggleLabel)}">
                <img src="${esc(n.langToggleFlag)}" alt="" aria-hidden="true" width="20" height="15" loading="lazy"> ${esc(n.langToggleLabel)}
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
   páginas
   ───────────────────────────────────────────────────────────── */

/** Catálogo com filtro por categoria (página work) ou lista plana (writing). */
function renderCatalog(d, pageKey) {
  const p = d.projects;
  const lang = d.meta.lang === 'pt-BR' ? 'pt' : 'en';
  const spec = CATALOG[pageKey];

  const groups = spec.groups.map(key => {
    const g = GROUP_META[key];
    const blk = p[key];
    if (!blk || !blk.items.length) return '';
    return `<section class="project-group" id="${g.id}" data-category="${g.filter}" aria-labelledby="h-${g.id}">
          <h2 class="group-title" id="h-${g.id}">${esc(blk.title)} <span class="group-count">${blk.items.length}</span></h2>
          ${blk.desc ? `<p class="group-desc">${esc(blk.desc)}</p>` : ''}
          <div class="portfolio-grid">${blk.items.map(renderCard).join('')}</div>
        </section>`;
  }).join('');

  const content = d[pageKey];
  const blocks = spec.groups.filter(k => p[k]?.items?.length);
  const total = blocks.reduce((n, k) => n + p[k].items.length, 0);

  const filters = spec.filters ? `
            <div class="filters" role="group" aria-label="${esc(FILTER_LABELS[lang].group)}">
            ${[
              `<input type="radio" name="pf" id="pf-all" class="pf-controller" checked>`,
              ...blocks.map(k => `<input type="radio" name="pf" id="pf-${GROUP_META[k].filter}" class="pf-controller">`)
            ].join('\n            ')}
              <div class="filter-tabs">
              ${[
                `<label for="pf-all" class="filter-tab">${esc(FILTER_LABELS[lang].all)} <span class="filter-count">${total}</span></label>`,
                ...blocks.map(k =>
                  `<label for="pf-${GROUP_META[k].filter}" class="filter-tab">${esc(p[k].title)} <span class="filter-count">${p[k].items.length}</span></label>`)
              ].join('\n              ')}
              </div>
            </div>
` : '';

  return `
        <section id="${pageKey}" class="portfolio">
          <div class="container">
            <h1 class="page-title">${esc(content.sectionTitle)}</h1>
            <p class="section-intro centered">${esc(content.intro)}</p>
${filters}
            <div id="${pageKey === 'work' ? 'projectGroups' : 'articleGroups'}">${groups}</div>
          </div>
        </section>`;
}

/**
 * Uma entrada da linha do tempo profissional. `location`, `responsibilities`
 * e `systems` são opcionais — nem toda entrada tem os três, e as entradas sem
 * sistemas não devem renderizar uma lista vazia.
 */
function expEntry(x) {
  return `<div class="exp-entry">
              <div class="exp-head">
                <div>
                  <h3 class="exp-org">${esc(x.org)} <span class="exp-org-full">— ${esc(x.orgFull)}</span></h3>
                  <p class="exp-role">${esc(x.role)}</p>
                  ${x.location ? `<p class="exp-location">${esc(x.location)}</p>` : ''}
                </div>
                <span class="exp-period">${esc(x.period)}</span>
              </div>
              <p class="exp-summary">${esc(x.summary)}</p>
              ${(x.responsibilities ?? []).length
                ? `<ul class="exp-responsibilities" role="list">${x.responsibilities.map(r => `<li>${esc(r)}</li>`).join('')}</ul>`
                : ''}
              ${(x.systems ?? []).length
                ? `<ul class="exp-systems" role="list">${x.systems.map(s => `<li><strong>${esc(s.name)}</strong> — ${esc(s.desc)}</li>`).join('')}</ul>`
                : ''}
            </div>`;
}

export function renderPage(d, page) {
  if (page.kind === 'case') return renderCaseStudy(d, page.cs);
  if (page.key === 'work' || page.key === 'writing') {
    return `<main id="conteudo" tabindex="-1">${renderCatalog(d, page.key)}</main>`;
  }
  if (page.key === 'about') return renderAbout(d);
  if (page.key === 'cv') return renderResume(d);
  return renderHome(d);
}

/* ─────────────────────────────────────────────────────────────
   main — home
   ───────────────────────────────────────────────────────────── */

export function renderHome(d) {
  const lang = d.meta.lang === 'pt-BR' ? 'pt' : 'en';
  const href = k => esc(pageUrl(PAGE_BY_KEY[k], lang));
  const ext = (label, url) =>
    `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary"><span>${esc(label)}</span></a>`;
  const linkList = links => links.map(l =>
    `<a href="${esc(l.href)}" target="_blank" rel="noopener noreferrer" class="work-link"><i class="${esc(l.icon)}" aria-hidden="true"></i> <span>${esc(l.label)}</span></a>`
  ).join('');

  return `<main id="conteudo" tabindex="-1">
        <section id="home" class="hero">
          <div class="container">
            <div class="hero-content">
              <span class="hero-greeting">${esc(d.hero.eyebrow)}</span>
              <h1>${esc(d.hero.title)}</h1>
              <p class="hero-role">${esc(d.hero.headline)}</p>
              <p class="hero-stack">${esc(d.hero.stack)}</p>
              <div class="hero-buttons">
                <a href="${href('work')}" class="btn btn-primary">${esc(d.hero.ctaWork)}</a>
                ${ext(d.hero.ctaLinkedIn, SITE.social.linkedin)}
                ${ext(d.hero.ctaGitHub, SITE.social.github)}
                <a href="${esc(SITE.cv[lang])}" class="btn btn-secondary"><i class="fa fa-file-pdf" aria-hidden="true"></i> <span>${esc(d.hero.ctaCv)}</span></a>
              </div>
            </div>
          </div>
        </section>

        <section id="metrics" class="metrics">
          <div class="container">
            <div class="metrics-grid">
              ${d.metrics.items.map(m => `<div class="metric">
                <span class="metric-number">${esc(fill(m.number, d))}</span>
                <span class="metric-label">${esc(m.label)}</span>
              </div>`).join('')}
            </div>
          </div>
        </section>

        <section id="work" class="selected-work">
          <div class="container">
            <h2 class="section-title">${esc(d.selectedWork.sectionTitle)}</h2>
            <p class="section-intro centered">${esc(d.selectedWork.intro)}</p>
            <div class="work-grid">
              ${d.selectedWork.items.map(w => `<article class="work-card">
                <span class="work-number">${esc(w.number)}</span>
                <h3>${esc(w.title)}</h3>
                <p class="work-kind">${esc(w.kind)}</p>
                <p class="work-summary">${esc(w.summary)}</p>
                <ul class="tag-list" role="list">${w.tags.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
                ${w.caseStudy || w.links.length ? `<div class="work-links">
                  ${w.caseStudy ? `<a href="${esc(caseStudyUrl(w.caseStudy, lang))}" class="work-link"><i class="fa fa-file-lines" aria-hidden="true"></i> <span>${esc(d.selectedWork.caseStudyLabel)}</span></a>` : ''}
                  ${linkList(w.links)}
                </div>` : ''}
              </article>`).join('')}
            </div>
            <p class="section-cta"><a href="${href('work')}">${esc(d.selectedWork.all.label)} →</a></p>
          </div>
        </section>

        <section id="experience" class="experience">
          <div class="container">
            <h2 class="section-title">${esc(d.experience.sectionTitle)}</h2>
            <p class="section-intro centered">${esc(d.experience.intro)}</p>
            ${d.experience.entries.map(expEntry).join('\n            ')}
          </div>
        </section>

        <section id="engineering" class="services">
          <div class="container">
            <h2 class="section-title">${esc(d.engineering.sectionTitle)}</h2>
            <p class="engineering-statement">${esc(d.engineering.statement)}</p>
            <p class="section-intro centered">${esc(d.engineering.intro)}</p>
            <div class="services-grid">
              ${d.engineering.capabilities.map(x => `<div class="service-card">
                <div class="service-icon"><i class="${esc(x.icon)}" aria-hidden="true"></i></div>
                <h3>${esc(x.title)}</h3>
                <p>${esc(x.text)}</p>
              </div>`).join('')}
            </div>
          </div>
        </section>

        <section id="writing" class="writing-preview">
          <div class="container">
            <h2 class="section-title">${esc(d.writingPreview.sectionTitle)}</h2>
            <p class="section-intro centered">${esc(d.writingPreview.intro)}</p>
            <ul class="writing-list" role="list">
              ${d.writingPreview.items.map(t => `<li><a href="${esc(t.href)}" target="_blank" rel="noopener noreferrer">${esc(t.title)}</a></li>`).join('')}
            </ul>
            <p class="section-cta"><a href="${href('writing')}">${esc(d.writingPreview.all.label)} →</a></p>
          </div>
        </section>

        <section id="about" class="about">
          <div class="container">
            <h2 class="section-title">${esc(d.about.sectionTitle)}</h2>
            <div class="about-text centered">${d.about.short.map(t => `<p>${esc(t)}</p>`).join('')}</div>
            <p class="section-cta"><a href="${href('about')}">${esc(d.about.readMore)} →</a></p>
          </div>
        </section>

        <section id="contact" class="contact">
          <div class="container">
            <h2 class="section-title">${esc(d.contact.heading)}</h2>
            <div class="contact-container">
              <div class="contact-info">
                <h3>${esc(d.contact.infoTitle)}</h3>
                <p>${esc(d.contact.infoText)}</p>
                <div class="contact-details">${contactItems(d)}</div>
              </div>
            </div>
          </div>
        </section>
      </main>`;
}

/* ─────────────────────────────────────────────────────────────
   main — case study
   ───────────────────────────────────────────────────────────── */

export function renderCaseStudy(d, cs) {
  const lang = d.meta.lang === 'pt-BR' ? 'pt' : 'en';
  const L = d.caseStudy;
  const back = pageUrl(PAGE_BY_KEY.work, lang);

  const section = s => {
    const paras = (s.paragraphs ?? []).map(t => `<p>${esc(t)}</p>`).join('');
    const bullets = (s.bullets ?? []).length
      ? `<ul class="cs-list" role="list">${s.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`
      : '';
    return `<section class="cs-section" id="cs-${esc(s.id)}">
          <h2>${esc(s.title)}</h2>
          ${paras}${bullets}
        </section>`;
  };

  return `<main id="conteudo" class="cs" tabindex="-1">
        <div class="container">
          <p class="cs-back"><a href="${esc(back)}">&larr; ${esc(L.backToWork)}</a></p>

          <header class="cs-head">
            <p class="cs-kind">${esc(cs.kind)}</p>
            <h1>${esc(cs.title)}</h1>
            <p class="cs-summary">${esc(cs.summary)}</p>
            <dl class="cs-facts">
              <div><dt>${esc(L.periodLabel)}</dt><dd>${esc(cs.period)}</dd></div>
              <div><dt>${esc(L.statusLabel)}</dt><dd><span class="cs-status cs-status-${esc(cs.status)}">${esc(L.status[cs.status])}</span></dd></div>
            </dl>
            ${cs.stack.length ? `<ul class="tag-list cs-stack" role="list">${cs.stack.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
          </header>

          ${cs.sections.map(section).join('\n          ')}

          ${cs.outcomes.length ? `<section class="cs-section cs-outcomes">
            <h2>${esc(L.outcomesTitle)}</h2>
            <div class="metrics-grid">
              ${cs.outcomes.map(o => `<div class="metric">
                <span class="metric-number">${esc(fill(o.number, d))}</span>
                <span class="metric-label">${esc(o.label)}</span>
              </div>`).join('')}
            </div>
          </section>` : ''}

          ${cs.evidence.length ? `<section class="cs-section">
            <h2>${esc(L.evidenceTitle)}</h2>
            <ul class="cs-evidence" role="list">
              ${cs.evidence.map(e => `<li><a href="${esc(e.href)}" target="_blank" rel="noopener noreferrer"><i class="${esc(e.icon)}" aria-hidden="true"></i> ${esc(e.label)}</a></li>`).join('')}
            </ul>
          </section>` : ''}

          ${cs.related.length ? `<section class="cs-section">
            <h2>${esc(L.relatedTitle)}</h2>
            <ul class="writing-list" role="list">
              ${cs.related.map(r => `<li><a href="${esc(r.href)}">${esc(r.title)}</a></li>`).join('')}
            </ul>
          </section>` : ''}

          <p class="section-cta"><a href="${esc(back)}">&larr; ${esc(L.backToWork)}</a></p>
        </div>
      </main>`;
}

/** Só emite um stat quando todos os seus tokens resolveram (evita "null" na página). */
function renderStats(stats, d) {
    return stats.map(s => {
      const num = fill(s.number, d), label = fill(s.label, d);
      if (num == null || String(num).includes('{{')) return '';
      return `<div class="stat-card"><span class="stat-number">${esc(num)}</span><span class="stat-label">${esc(label)}</span></div>`;
    }).join('');
}

const CONTACT_CHANNELS = [
  { key: 'linkedin', icon: 'fa-brands fa-linkedin', handle: '/in/pconradjunior' },
  { key: 'github', icon: 'fa-brands fa-github', handle: '@pconradjunior' },
  { key: 'medium', icon: 'fa-brands fa-medium', handle: '@pconradjunior' },
  { key: 'instagram', icon: 'fa-brands fa-instagram', handle: '@pedrojunior.dev' }
];

function contactItems(d) {
  const rows = CONTACT_CHANNELS.map(c =>
    `<a href="${esc(SITE.social[c.key])}" target="_blank" rel="noopener noreferrer" class="contact-item"><i class="${c.icon}" aria-hidden="true"></i><span>${esc(c.handle)}</span></a>`
  );
  rows.push(`<a href="mailto:${esc(SITE.email)}" class="contact-item"><i class="fa fa-envelope" aria-hidden="true"></i><span>${esc(SITE.email)}</span></a>`);
  return rows.join('\n                  ');
}

/* ─────────────────────────────────────────────────────────────
   about
   ───────────────────────────────────────────────────────────── */

export function renderAbout(d) {
  const a = d.about;

  return `<main id="conteudo" tabindex="-1">
        <section id="about-page" class="page">
          <div class="container">
            <h1 class="page-title">${esc(a.sectionTitle)}</h1>
            <div class="prose">
              ${a.paragraphs.map(t => `<p>${esc(t)}</p>`).join('\n              ')}
              <p class="teaching"><strong>${esc(a.teaching.label)}:</strong> ${esc(a.teaching.title)} — ${esc(a.teaching.desc)}</p>
            </div>
            <div class="about-stats">
              ${a.stats.map(s => `<div class="metric">
                <span class="metric-number">${fill(s.number, d)}</span>
                <span class="metric-label">${esc(s.label)}</span>
              </div>`).join('\n              ')}
            </div>
            <h2 class="section-title">${esc(a.capabilitiesTitle)}</h2>
            <div class="skill-groups">
              ${a.skills.map(g => `<div class="skill-group">
                <h3 class="skill-group-title">${esc(g.group)}</h3>
                <ul class="skill-list skill-list-wide" role="list">${g.items.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
              </div>`).join('\n              ')}
            </div>
            <h2 class="section-title">${esc(d.education.sectionTitle)}</h2>
            <p class="section-intro">${esc(d.education.intro)}</p>
            <ul class="entry-list" role="list">
              ${d.education.entries.map(e => `<li class="entry-item">
                <div class="entry-head">
                  <span class="entry-title">${esc(e.degree)}</span>
                  <span class="entry-period">${esc(e.period)}</span>
                </div>
                <p class="entry-org">${esc(e.org)}</p>
              </li>`).join('\n              ')}
            </ul>
            <h2 class="section-title">${esc(d.languages.sectionTitle)}</h2>
            <p class="section-intro">${esc(d.languages.intro)}</p>
            <ul class="language-list" role="list">
              ${d.languages.items.map(l => `<li><span class="language-name">${esc(l.name)}</span><span class="language-level">${esc(l.level)}</span></li>`).join('\n              ')}
            </ul>
            <h2 class="section-title">${esc(d.contact.sectionTitle)}</h2>
            <div class="contact-details contact-details-inline">
              ${contactItems(d)}
            </div>
            <p class="section-cta"><a href="${esc(SITE.cv[d.meta.lang === 'pt-BR' ? 'pt' : 'en'])}">${esc(d.nav.cv)} →</a></p>
          </div>
        </section>
      </main>`;
}

/* ─────────────────────────────────────────────────────────────
   currículo
   ───────────────────────────────────────────────────────────── */

/**
 * O currículo em HTML. Reaproveita experiência, habilidades, idiomas e formação
 * que já existem no site — o que é exclusivo dele é o resumo em primeira pessoa
 * e a lista de projetos no formato de período, finalidade, tecnologias e papel.
 * Sem link de download: a página é a versão imprimível.
 */
export function renderResume(d) {
  const r = d.resume;
  const L = r.labels;

  return `<main id="conteudo" tabindex="-1">
        <section id="cv-page" class="page">
          <div class="container">
            <h1 class="page-title">${esc(r.sectionTitle)}</h1>
            <div class="prose">
              ${r.summary.map(t => `<p>${esc(t)}</p>`).join('\n              ')}
            </div>

            <h2 class="section-title">${esc(L.experienceTitle)}</h2>
            ${d.experience.entries.map(expEntry).join('\n            ')}

            <h2 class="section-title">${esc(L.skillsTitle)}</h2>
            <div class="skill-groups">
              ${d.about.skills.map(g => `<div class="skill-group">
                <h3 class="skill-group-title">${esc(g.group)}</h3>
                <ul class="skill-list skill-list-wide" role="list">${g.items.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
              </div>`).join('\n              ')}
            </div>

            <h2 class="section-title">${esc(L.languagesTitle)}</h2>
            <ul class="language-list" role="list">
              ${d.languages.items.map(l => `<li><span class="language-name">${esc(l.name)}</span><span class="language-level">${esc(l.level)}</span></li>`).join('\n              ')}
            </ul>

            <h2 class="section-title">${esc(L.educationTitle)}</h2>
            <ul class="entry-list" role="list">
              ${d.education.entries.map(e => `<li class="entry-item">
                <div class="entry-head">
                  <span class="entry-title">${esc(e.degree)}</span>
                  <span class="entry-period">${esc(e.period)}</span>
                </div>
                <p class="entry-org">${esc(e.org)}</p>
              </li>`).join('\n              ')}
            </ul>

            <h2 class="section-title">${esc(L.projectsTitle)}</h2>
            ${r.projects.map(p => `<article class="resume-project">
              <h3 class="resume-project-name">${esc(p.name)}</h3>
              <dl class="resume-project-meta">
                <div><dt>${esc(L.periodLabel)}</dt><dd>${esc(p.period)}</dd></div>
                <div><dt>${esc(L.purposeLabel)}</dt><dd>${esc(p.purpose)}</dd></div>
                ${p.stack?.length
                  ? `<div><dt>${esc(L.technologiesLabel)}</dt><dd>${p.stack.map(t => esc(t)).join(', ')}</dd></div>`
                  : ''}
                <div><dt>${esc(L.roleLabel)}</dt><dd>${esc(p.role)}</dd></div>
              </dl>
            </article>`).join('\n            ')}
          </div>
        </section>
      </main>`;
}

/* ─────────────────────────────────────────────────────────────
   structured data
   ───────────────────────────────────────────────────────────── */

function softwareApp(item, lang) {
  const store = item.links.find(l => STORE.test(l.href || ''));
  return {
    '@type': 'SoftwareApplication',
    name: item.title,
    description: item.desc,
    applicationCategory: item.category || 'UtilitiesApplication',
    operatingSystem: operatingSystem(item),
    url: store?.href || `${SITE.origin}/work/#${item.title.toLowerCase().replace(/\s+/g, '-')}`,
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

export function buildJsonLd(d, lang, page) {
  const p = d.projects;
  const isHome = page.key === 'home';
  const url = `${SITE.origin}${pageUrl(page, lang)}`;

  const person = {
    '@id': `${SITE.origin}/#person`,
    '@type': 'Person',
    name: SITE.author,
    url: `${SITE.origin}/`,
    email: `mailto:${SITE.email}`,
    // Posicionamento da Fase 1: engineer/architect, não "PHP e Flutter".
    jobTitle: d.hero.eyebrow,
    description: fill(d.hero.description, d),
    // skills é uma taxonomia por grupo: achata para o grafo, que quer rótulos.
    knowsAbout: [...d.about.skills.flatMap(g => g.items), ...d.engineering.capabilities.map(c => c.title)],
    worksFor: { '@type': 'CollegeOrUniversity', name: 'Universidade Federal do Pampa (Unipampa)' },
    sameAs: sameAs()
  };

  const webPage = {
    '@id': `${url}#webpage`,
    '@type': 'WebPage',
    url,
    name: fill(d.meta.title, d),
    description: fill(d.meta.description, d),
    inLanguage: d.meta.lang,
    isPartOf: { '@id': `${SITE.origin}/#website` },
    about: { '@id': `${SITE.origin}/#person` }
  };

  const graph = [
    {
      '@id': `${SITE.origin}/#website`,
      '@type': 'WebSite',
      url: `${SITE.origin}/`,
      name: SITE.author,
      inLanguage: ['pt-BR', 'en'],
      author: { '@id': `${SITE.origin}/#person` }
    },
    person,
    webPage
  ];

  if (!isHome) {
    // O currículo é a página que descreve a pessoa: ProfilePage liga a página
    // à Person do grafo, que é quem a busca costuma querer para "currículo".
    if (page.key === 'cv') {
      graph.push({
        '@id': `${url}#profilepage`,
        '@type': 'ProfilePage',
        url,
        name: fill(d.resume.metaTitle, d),
        description: fill(d.resume.metaDescription, d),
        inLanguage: d.meta.lang,
        mainEntity: { '@id': `${SITE.origin}/#person` },
        isPartOf: { '@id': `${SITE.origin}/#website` }
      });
    }
    return [{ '@context': 'https://schema.org', '@graph': graph }];
  }

  // Case study é um artigo técnico sobre um sistema próprio: entra no grafo da
  // própria página para que o motivo e a autoria fiquem legíveis na busca.
  if (page.kind === 'case') {
    graph.push({
      '@id': `${url}#techarticle`,
      '@type': 'TechArticle',
      headline: page.cs.title,
      description: fill(page.cs.summary, d),
      url,
      inLanguage: d.meta.lang,
      keywords: [...(page.cs.stack ?? []), ...(page.cs.kind ? [page.cs.kind] : [])],
      author: { '@id': `${SITE.origin}/#person` },
      isPartOf: { '@id': `${url}#webpage` }
    });
    return [{ '@context': 'https://schema.org', '@graph': graph }];
  }

  const apps = (p.mobile?.items ?? []).filter(i => i.links.some(l => STORE.test(l.href || '')));
  const webApps = p.web?.items ?? [];
  const writings = [
    ...(p.technicalArticles?.items ?? []),
    ...(p.reflections?.items ?? []),
    ...(p.career?.items ?? [])
  ];
  const papers = (p.publications?.items ?? []).filter(isPaper);

  const list = (name, items) => ({
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((a, i) => ({ '@type': 'ListItem', position: i + 1, item: a }))
  });

  graph.push(list(lang === 'pt' ? 'Aplicativos publicados' : 'Published applications',
    apps.map(a => softwareApp(a, lang))));

  graph.push(list(lang === 'pt' ? 'Sistemas web desenvolvidos' : 'Web systems built',
    webApps.map(a => ({
      '@type': 'WebApplication',
      name: a.title,
      description: a.desc,
      applicationCategory: a.category || 'UtilitiesApplication',
      operatingSystem: 'Any',
      author: { '@id': `${SITE.origin}/#person` },
      inLanguage: lang
    }))));

  graph.push(list(lang === 'pt' ? 'Publicações e artigos' : 'Publications and articles',
    writings.map(a => articleNode(a, lang))));

  graph.push(list(lang === 'pt' ? 'Trabalhos acadêmicos' : 'Academic papers',
    papers.map(a => {
      const link = a.links.find(l => /^https?:/.test(l.href || ''));
      return {
        '@type': 'ScholarlyArticle',
        name: a.title,
        headline: a.title,
        description: a.desc,
        url: link?.href,
        author: { '@id': `${SITE.origin}/#person` },
        inLanguage: lang
      };
    })));

  return [{ '@context': 'https://schema.org', '@graph': graph }];
}

/* ─────────────────────────────────────────────────────────────
   documento completo
   ───────────────────────────────────────────────────────────── */

export function buildHead(d, lang, page) {
    const m = d.meta;
    const url = `${SITE.origin}${pageUrl(page, lang)}`;
    const otherLang = lang === 'pt' ? 'en' : 'pt';
    const otherUrl = `${SITE.origin}${pageUrl(page, otherLang)}`;
    const image = `${SITE.origin}${SITE.ogImage}`;

    // Cada página tem título próprio: um sufixo sobre a title da home estouraria
    // o limite de caracteres, e não descreveria a página. Case studies trazem
    // metaTitle/metaDescription no próprio arquivo do estudo.
    const src = page.cs ?? d[pageKey(page.key)];
    const title = fill(src?.metaTitle ?? m.title, d);

    const description = fill(src?.metaDescription ?? m.description, d);

    const keywords = m.keywords.map(k => fill(k, d)).join(', ');

    const ld = buildJsonLd(d, lang, page)
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
    <link rel="alternate" hreflang="pt-BR" href="${SITE.origin}${pageUrl(page, 'pt')}">
    <link rel="alternate" hreflang="en" href="${otherUrl}">
    <link rel="alternate" hreflang="x-default" href="${SITE.origin}${pageUrl(page, 'pt')}">

    <meta property="og:type" content="website">
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

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(description)}">
    <meta name="twitter:image" content="${image}">
    <meta name="twitter:image:alt" content="${esc(m.alt)}">

    <link rel="icon" type="image/svg+xml" href="/images/favicon.svg">
    <link rel="alternate icon" type="image/x-icon" href="/favicon.ico">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Space+Grotesk:wght@300;400;500;700&display=swap">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="/css/style.css">
    <script>
      /* Anti-FOUC: precisa rodar antes da primeira pintura, senão a página
         aparece no tema padrão e troca depois. Sem preferência salva, segue a
         preferência de cor do sistema — quem tem o sistema em claro não vê
         um flash escuro na primeira visita. O atributo é o mesmo que o CSS
         lê, então aqui basta escrevê-lo. */
      (function () {
        var THEMES = ${JSON.stringify(d.themes.map(t => t.id))};
        var t = null;
        try {
          t = localStorage.getItem('theme');
        } catch (e) { /* modo privado: segue a preferência do sistema */ }
        if (THEMES.indexOf(t) === -1) {
          t = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
            ? 'theme-light'
            : 'theme-cyan';
        }
        document.documentElement.setAttribute('data-theme', t);
      })();
    </script>
    ${ld}`;
}

export function buildDocument(d, lang, page) {
  return `<!DOCTYPE html>
<html lang="${esc(d.meta.lang)}">

<head>
    ${buildHead(d, lang, page)}
</head>

<body>
    <a class="skip-link" href="#conteudo">${esc(d.skipToContent)}</a>

    ${d.themes.map((t, i) => `<input type="radio" name="theme" id="${esc(t.id)}" class="theme-controller" value="${esc(t.id)}"${i === 0 ? ' checked' : ''}>`).join('\n    ')}
    <div class="theme-switcher" role="group" aria-label="${esc(d.themeSwitcherTitle)}" title="${esc(d.themeSwitcherTitle)}">
      ${d.themes.map(t => `<label for="${esc(t.id)}" class="theme-label label-${esc(t.id.replace('theme-', ''))}"><span class="sr-only">${esc(t.name)}</span></label>`).join('\n      ')}
    </div>

    ${renderHeader(d, lang, page)}
    ${renderPage(d, page)}
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

    <script>window.PAGE_KEY = ${JSON.stringify(page.key)};</script>
    <script type="module" src="/js/main.js"></script>
</body>

</html>
`;
}