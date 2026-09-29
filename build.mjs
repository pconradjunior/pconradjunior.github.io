/**
 * build.mjs — gera as páginas estáticas a partir de content/{pt,en}.json
 *
 *   node build.mjs
 *
 * Os JSONs continuam sendo a fonte única de conteúdo. Este script apenas os
 * materializa em HTML com metadados por idioma, hreflang, Open Graph e dados
 * estruturados. Sem dependências.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildDocument, SITE } from './js/render.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const LANGUAGES = ['pt', 'en'];

/** Páginas estáticas listadas no sitemap. */
const SITEMAP_PAGES = [
  { loc: '/', changefreq: 'weekly', priority: '1.0', lastmod: true },
  { loc: '/en/', changefreq: 'weekly', priority: '0.9', lastmod: true },
  { loc: '/article_algoritmos.html', changefreq: 'yearly', priority: '0.4' },
  { loc: '/article_ios.html', changefreq: 'yearly', priority: '0.4' },
  { loc: '/article_reconhecimento_facial.html', changefreq: 'yearly', priority: '0.4' },
  { loc: '/article_versioncheck.html', changefreq: 'yearly', priority: '0.4' },
  { loc: '/rex_info.html', changefreq: 'monthly', priority: '0.5' }
];

const today = new Date().toISOString().slice(0, 10);

for (const lang of LANGUAGES) {
  const data = JSON.parse(readFileSync(join(ROOT, 'content', `${lang}.json`), 'utf8'));
  const html = buildDocument(data, lang);

  const out = lang === 'pt' ? join(ROOT, 'index.html') : join(ROOT, 'en', 'index.html');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html, 'utf8');

  console.log(`  ${out.replace(ROOT + '/', '')}  ${(Buffer.byteLength(html) / 1024).toFixed(1)} kB`);
}

/* ── sitemap.xml ── */
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${SITEMAP_PAGES.map(p => `  <url>
    <loc>${SITE.origin}${p.loc}</loc>${p.lastmod ? `
    <lastmod>${today}</lastmod>` : ''}
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
    <xhtml:link rel="alternate" hreflang="pt-BR" href="${SITE.origin}/"/>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE.origin}/en/"/>
  </url>`).join('\n')}
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
