/**
 * build.mjs — gera as páginas estáticas a partir de content/{pt,en}.json
 *
 *   node build.mjs
 *
 * Os JSONs continuam sendo a fonte única de conteúdo. Este script apenas os
 * materializa em HTML com metadados por idioma, hreflang, Open Graph e dados
 * estruturados. Sem dependências.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildDocument, PAGES, pageFile, casePage, caseStudyUrl, SITE } from './js/render.js';
import { loadContent, loadCaseStudies } from './js/content.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const LANGUAGES = ['pt', 'en'];

/**
 * Páginas estáticas fora do build, listadas no sitemap.
 * `href` precisa ser absoluto a partir da raiz; `alt` é a página no outro idioma.
 */
const SITEMAP_EXTRA = [
  { loc: '/article_algoritmos.html', changefreq: 'yearly', priority: '0.4', alt: null },
  { loc: '/article_ios.html', changefreq: 'yearly', priority: '0.4', alt: null },
  { loc: '/article_reconhecimento_facial.html', changefreq: 'yearly', priority: '0.4', alt: null },
  { loc: '/article_versioncheck.html', changefreq: 'yearly', priority: '0.4', alt: null },
  { loc: '/rex_info.html', changefreq: 'monthly', priority: '0.5', alt: null }
];

const today = new Date().toISOString().slice(0, 10);

/** Todas as páginas do site, com par PT/EN — base do sitemap e da validação. */
function allPages() {
  const fixed = PAGES.map(p => ({
    key: p.key, pt: p.pt, en: p.en, priority: p.key === 'home' ? '1.0' : '0.7'
  }));
  // Case studies entram depois das páginas fixas: /work/<slug>/ é uma
  // subpágina do catálogo e não deve ranquear acima dele.
  const studies = Object.keys(cases).map(slug => ({
    key: `case:${slug}`,
    pt: caseStudyUrl(slug, 'pt'),
    en: caseStudyUrl(slug, 'en'),
    priority: '0.6'
  }));
  return [...fixed, ...studies];
}

const content = {};
for (const lang of LANGUAGES) {
  content[lang] = loadContent(ROOT, lang);
}

/**
 * Todos os case studies, indexados por slug e com o par PT/EN montado.
 *
 * Um diretório ausente significa "nenhum case study ainda" — não é erro, porque
 * os estudos dependem de dados que ainda não foram fornecidos. O que é erro é
 * um estudo existir em um idioma e não no outro: isso quebraria o par de
 * hreflang silenciosamente, então falha aqui.
 */
const cases = {};
for (const lang of LANGUAGES) {
  for (const cs of loadCaseStudies(ROOT, lang)) (cases[cs.slug] ??= {})[lang] = cs;
}

const missingPair = Object.entries(cases)
  .filter(([, pair]) => !pair.pt || !pair.en)
  .map(([slug]) => slug);
if (missingPair.length) {
  throw new Error(`case study sem par de idiomas: ${missingPair.join(', ')}`);
}

/** Os estudos prontos para renderizar, cada um com o texto do idioma pedido. */
const caseStudies = lang =>
  Object.entries(cases)
    .map(([slug, pair]) => ({ ...pair[lang], slug }))
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.slug.localeCompare(b.slug));

/* ── páginas ── */
for (const lang of LANGUAGES) {
  const d = content[lang];
  const pages = [
    ...PAGES,
    ...caseStudies(lang).map(cs => ({ ...casePage(cs), cs }))
  ];
  for (const page of pages) {
    const html = buildDocument(d, lang, page);
    const out = join(ROOT, lang === 'pt' ? pageFile(page) : `en/${pageFile(page)}`);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, html, 'utf8');
    console.log(`  ${out.replace(ROOT + '/', '')}  ${(Buffer.byteLength(html) / 1024).toFixed(1)} kB`);
  }
}

/* ── sitemap.xml ──
   Cada página entra uma vez por idioma, sempre com o trio completo de
   alternates (pt-BR / en / x-default). Páginas fora do build não têm par
  bilíngue e por isso entram sem hreflang, em vez de apontar para a home. */
const pages = allPages();

const alternates = page => `
    <xhtml:link rel="alternate" hreflang="pt-BR" href="${SITE.origin}${page.pt}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE.origin}${page.en}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE.origin}${page.pt}"/>`;

const pageRows = pages.flatMap(p => [p.pt, p.en].map(loc => `  <url>
    <loc>${SITE.origin}${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${p.priority}</priority>${alternates(p)}
  </url>`));

const extraRows = SITEMAP_EXTRA.map(p => `  <url>
    <loc>${SITE.origin}${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[...pageRows, ...extraRows].join('\n')}
</urlset>
`;
writeFileSync(join(ROOT, 'sitemap.xml'), sitemap, 'utf8');
console.log('  sitemap.xml');

/* ── robots.txt ── */
const robots = `User-agent: *
Allow: /

Sitemap: ${SITE.origin}/sitemap.xml
`;
writeFileSync(join(ROOT, 'robots.txt'), robots, 'utf8');
console.log('  robots.txt');

console.log('\nbuild ok');