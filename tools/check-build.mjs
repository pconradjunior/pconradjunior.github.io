/**
 * check-build.mjs — valida as páginas geradas. Roda no CI e localmente.
 * Falha com código 1 se algum check reprovar.
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PAGES = [
  { lang: 'pt', file: 'index.html', dir: '', canonical: 'https://pconradjunior.github.io/' },
  { lang: 'en', file: 'en/index.html', dir: 'en', canonical: 'https://pconradjunior.github.io/en/' }
];

let failures = 0;
const ok = m => console.log(`  [32m✓[0m ${m}`);
const bad = m => { failures++; console.log(`  [31m✗[0m ${m}`); };
const check = (cond, m) => (cond ? ok(m) : bad(m));

const read = p => readFileSync(join(ROOT, p), 'utf8');

/** Seções e grupos esperados, derivados do próprio conteúdo. */
const SECTIONS = {
  projects: ['mobile', 'web', 'other', 'videos'],
  articles: ['technicalArticles', 'reflections', 'career', 'publications']
};
const GROUPS = Object.values(SECTIONS).flat();
const content = lang => JSON.parse(read(`content/${lang}.json`));
const expectedCards = lang => {
  const d = content(lang);
  return GROUPS.reduce((n, g) => n + (d.projects[g]?.items?.length ?? 0), 0);
};
const groupCards = (lang, section) => {
  const d = content(lang);
  return SECTIONS[section].reduce((n, g) => n + (d.projects[g]?.items?.length ?? 0), 0);
};

for (const page of PAGES) {
  console.log(`\n${page.file}`);
  const html = read(page.file);

  // ── SEO básico ──
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  check(title.length >= 20 && title.length <= 75, `title com ${title.length} chars — ${JSON.stringify(title.slice(0, 50))}…`);
  check(desc.length >= 70 && desc.length <= 175, `description com ${desc.length} chars`);
  check(/lang="[^"]+"/.test(html), 'html lang definido');
  check(html.includes(`<link rel="canonical" href="${page.canonical}">`), 'canonical correto');
  check(html.includes('hreflang="pt-BR"') && html.includes('hreflang="en"') && html.includes('hreflang="x-default"'), 'hreflang pt/en/x-default presentes');
  check(html.includes('og:title') && html.includes('og:image') && html.includes('twitter:card'), 'Open Graph + Twitter Card');
  check(!/rel="canonical" href="https:\/\/pconradjunior\.github\.io\/en\/"/.test(page.file === 'index.html' ? html : html.replace(/href="https:\/\/pconradjunior\.github\.io\/en\/"/, '')), 'canonical não aponta para o idioma errado');

  // ── conteúdo pré-renderizado ──
  check(/<h1>[^<]{3,}<\/h1>/.test(html), 'h1 preenchido no HTML servido');
  const h1 = html.match(/<h1>([^<]*)<\/h1>/)?.[1] ?? '';
  check(h1 === 'Pedro Conrad Jr', 'h1 único e correto');
  const h2 = (html.match(/<h2/g) ?? []).length;
  check(h2 === 5, `${h2} headings h2 — About, Expertise, Projetos, Artigos, Contato`);
  const cards = (html.match(/class="project-card"/g) ?? []).length;
  const expected = expectedCards(page.lang);
  check(cards === expected, `${cards} cards renderizados (esperado ${expected} do content/${page.lang}.json)`);
  const groups = (html.match(/class="project-group"/g) ?? []).length;
  check(groups === GROUPS.length, `${groups} grupos (esperado ${GROUPS.length} do content/${page.lang}.json)`);

  // ── sections: ordem, isolamento e distribuição dos cards ──
  const iProjects = html.indexOf('<section id="projects"');
  const iArticles = html.indexOf('<section id="articles"');
  const iContact = html.indexOf('<section id="contact"');
  check(iProjects > -1 && iArticles > iProjects && iContact > iArticles,
    'ordem das sections: Projetos → Artigos → Contato');

  const articles = iArticles > -1 ? html.slice(iArticles, iContact > -1 ? iContact : undefined) : '';
  const articlesGroups = (articles.match(/class="project-group"/g) ?? []).length;
  check(articlesGroups === SECTIONS.articles.length,
    `${articlesGroups} grupos em Artigos (esperado ${SECTIONS.articles.length})`);
  const articlesCards = (articles.match(/class="project-card"/g) ?? []).length;
  const expectedArticles = groupCards(page.lang, 'articles');
  check(articlesCards === expectedArticles,
    `${articlesCards} cards em Artigos (esperado ${expectedArticles})`);
  const projectsCards = (html.slice(iProjects, iArticles).match(/class="project-card"/g) ?? []).length;
  check(projectsCards === groupCards(page.lang, 'projects'),
    `${projectsCards} cards em Projetos (esperado ${groupCards(page.lang, 'projects')})`);
  check(!/class="filters"/.test(articles), 'Artigos sem conjunto extra de filtros');
  const articleTitle = content(page.lang).articles?.sectionTitle ?? '';
  check(articles.includes(`<h2 class="section-title">${articleTitle}</h2>`), `h2 de Artigos preenchido — ${JSON.stringify(articleTitle)}`);
  check(/<p class="section-intro centered">[^<]{40,}<\/p>/.test(articles), 'intro descritivo de Artigos presente');
  check((html.match(/aria-haspopup="true"/g) ?? []).length === 2, 'menu com 2 dropdowns');
  check(/id="nav-projects"[^>]*aria-haspopup="true"[\s\S]*?href="#mobile"/.test(html), 'dropdown de Projetos com seus 4 grupos');
  check(/id="nav-articles"[^>]*aria-haspopup="true"[\s\S]*?href="#technical-articles"[\s\S]*?href="#publications"/.test(html),
    'dropdown de Artigos com seus 4 grupos');

  check(!/carousel/i.test(html), 'sem vestígio de carrossel');
  check(!/\{\{\w+\}\}/.test(html), 'nenhum token {{...}} não resolvido');
  check(!/>null<|undefined|NaN/.test(html), 'sem null/undefined/NaN no HTML');
  check(!/jquery|select2/i.test(html), 'sem jQuery/Select2');

  // ── contato: apenas links diretos, sem formulário de terceiros ──
  check(!/web3forms|access_key/i.test(html), 'sem Web3Forms nem access_key');
  check(!/<form/i.test(html), 'sem formulário preenchível');

  // ── caminhos absolutos (necessário para /en/) ──
  check(!/href="(css|js|images|content)\//.test(html), 'assets com caminho absoluto');
  check(!/src="(css|js|images)\//.test(html), 'scripts e imagens com caminho absoluto');

  // ── JSON-LD ──
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  check(blocks.length === 6, `${blocks.length} blocos JSON-LD (esperado 6)`);
  for (const [, raw] of blocks) {
    try { JSON.parse(raw.replace(/\\u003c/g, '<')); } catch (e) { bad(`JSON-LD inválido: ${e.message}`); }
  }
  ok('todos os JSON-LD parseiam');

  // ── links internos resolvem ──
  const broken = new Set();
  for (const m of html.matchAll(/href="(\/[a-z0-9_\-/]*\.(?:html|xml|txt|png|svg|css|js|json))"/gi)) {
    const target = m[1];
    if (target === '/robots.txt' || target === '/sitemap.xml') continue;
    if (!existsSync(join(ROOT, target))) broken.add(target);
  }
  check(broken.size === 0, broken.size ? `links internos quebrados: ${[...broken].join(', ')}` : 'todos os links internos resolvem');
}

// ── raiz ──
console.log('\nraiz');
const robots = read('robots.txt');
check(robots.includes('Sitemap: https://pconradjunior.github.io/sitemap.xml'), 'robots.txt referencia o sitemap');
const sitemap = read('sitemap.xml');
check(sitemap.includes('<loc>https://pconradjunior.github.io/</loc>'), 'sitemap inclui a raiz');
check(sitemap.includes('<loc>https://pconradjunior.github.io/en/</loc>'), 'sitemap inclui /en/');
check(existsSync(join(ROOT, '404.html')), '404.html existe');
check(existsSync(join(ROOT, 'images/og-image.png')), 'og-image.png existe');
check(!existsSync(join(ROOT, 'index_bak.html')) && !existsSync(join(ROOT, 'index_en_bak.html')), 'backups removidos');

console.log(failures ? `\n[31m${failures} falha(s)[0m\n` : '\n[32mtodos os checks passaram[0m\n');
process.exit(failures ? 1 : 0);
