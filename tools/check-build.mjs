/**
 * check-build.mjs — valida as páginas geradas. Roda no CI e localmente.
 * Falha com código 1 se algum check reprovar.
 *
 * Princípio: nenhuma estrutura é repetida aqui. Toda expectativa é derivada de
 * content/*.json e de js/render.js, para que o validador não possa divergir do
 * que o build realmente produz.
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PAGES, pageUrl, pageFile, GROUPS, CATALOG, SITE, fill } from '../js/render.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const LANGS = ['pt', 'en'];

let failures = 0;
const ok = m => console.log(`  [32m✓[0m ${m}`);
const bad = m => { failures++; console.log(`  [31m✗[0m ${m}`); };
const check = (cond, m) => (cond ? ok(m) : bad(m));

const read = p => readFileSync(join(ROOT, p), 'utf8');
const content = lang => JSON.parse(read(`content/${lang}.json`));
const css = read('css/style.css');

/** Escapa como render.js escapa, para comparar com o HTML gerado. */
const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ─────────────────────────────────────────────────────────────
   paridade PT/EN
   A troca de idioma re-renderiza a página inteira a partir do JSON
   vizinho, sem recarregar. Divergência de estrutura falha em silêncio
   e produz uma página quebrada, então precisa ser reprovada aqui.
   ───────────────────────────────────────────────────────────── */

/** Assinatura estrutural: chaves e comprimentos de array, nunca valores. */
function shape(value, path = '$', out = []) {
  if (Array.isArray(value)) {
    out.push(`${path}[] (${value.length})`);
    value.forEach((v, i) => shape(v, `${path}[${i}]`, out));
  } else if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    out.push(`${path}{${keys.join(',')}}`);
    keys.forEach(k => shape(value[k], `${path}.${k}`, out));
  }
  return out;
}

console.log('\nparidade pt/en');
{
  const [pt, en] = [shape(content('pt')), shape(content('en'))];
  const onlyPt = pt.filter(x => !en.includes(x));
  const onlyEn = en.filter(x => !pt.includes(x));
  check(onlyPt.length === 0 && onlyEn.length === 0,
    onlyPt.length || onlyEn.length
      ? `estrutura diverge — só em pt: ${onlyPt.slice(0, 4).join(' | ')} · só em en: ${onlyEn.slice(0, 4).join(' | ')}`
      : `estrutura idêntica (${pt.length} nós)`);
}

/* ─────────────────────────────────────────────────────────────
   páginas
   ───────────────────────────────────────────────────────────── */

/** Cards esperados por página, derivado do conteúdo. */
function expectedCards(lang, pageKey) {
  const p = content(lang).projects;
  return CATALOG[pageKey].groups.reduce((n, k) => n + (p[k]?.items?.length ?? 0), 0);
}

for (const lang of LANGS) {
  for (const page of PAGES) {
    const d = content(lang);
    const file = lang === 'pt' ? pageFile(page) : `en/${pageFile(page)}`;
    console.log(`\n${file}`);

    if (!existsSync(join(ROOT, file))) { bad('página não foi gerada'); continue; }
    const html = read(file);
    const p = d.projects;

    const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
    const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
    const url = `${SITE.origin}${pageUrl(page, lang)}`;
    const other = lang === 'pt' ? 'en' : 'pt';
    const otherUrl = `${SITE.origin}${pageUrl(page, other)}`;

    // ── SEO básico ──
    check(title.length >= 20 && title.length <= 75, `title com ${title.length} chars — ${JSON.stringify(title.slice(0, 50))}…`);
    check(desc.length >= 70 && desc.length <= 175, `description com ${desc.length} chars`);
    check(/lang="[^"]+"/.test(html), 'html lang definido');
    check(html.includes(`<link rel="canonical" href="${url}">`), `canonical correto — ${url}`);
    check(html.includes(`hreflang="pt-BR" href="${SITE.origin}${pageUrl(page, 'pt')}">`), 'alternate pt-BR correto');
    check(html.includes(`hreflang="en" href="${otherUrl}">`), 'alternate en correto');
    check(html.includes(`hreflang="x-default" href="${SITE.origin}${pageUrl(page, 'pt')}">`), 'alternate x-default correto');
    check(html.includes('og:title') && html.includes('og:image') && html.includes('twitter:card'), 'Open Graph + Twitter Card');

    // ── hierarquia ──
    const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map(m => m[1]);
    check(h1s.length === 1, `exatamente 1 h1 — ${JSON.stringify(h1s[0]?.replace(/<[^>]+>/g, '').slice(0, 60))}`);
    if (page.key === 'home') {
      check(h1s[0] === 'Pedro Conrad Jr', 'h1 da home é o nome');
    } else {
      check(h1s[0] === esc(d[page.key].sectionTitle), 'h1 é o título da página no idioma certo');
    }

    // ── navegação ──
    check(!html.includes('aria-haspopup'), 'sem dropdown na navegação');
    for (const key of ['work', 'engineering', 'writing', 'about', 'contact']) {
      const navPage = PAGES.find(x => x.key === key);
      const expect = navPage ? pageUrl(navPage, lang) : (page.key === 'home' ? `#${key}` : `/#${key}`);
      const re = new RegExp(`<a href="${expect.replace(/[/]/g, '\\/')}"`);
      check(re.test(html), `nav "${key}" → ${expect}`);
    }
    check(html.includes('fa-brands fa-github') && html.includes('fa-brands fa-linkedin'), 'GitHub e LinkedIn visíveis na navegação');
    check(html.includes(SITE.cv[lang]), `CV do idioma presente — ${SITE.cv[lang]}`);

    // ── conteúdo da página ──
    if (page.key === 'home') {
      const cards = (html.match(/class="project-card"/g) ?? []).length;
      check(cards === 0, 'catálogo não está na home');
      // Ordem de leitura da home reposicionada: escala → projetos →
      // experiência → engenharia → escritos → sobre → contato.
      for (const s of ['id="home"', 'id="metrics"', 'id="work"', 'id="experience"',
        'id="engineering"', 'id="writing"', 'id="about"', 'id="contact"']) {
        check(html.includes(s), `home tem ${s}`);
      }

      // As asserções de conteúdo comparam trechos que o renderizador quebra em
      // várias linhas; comparar sobre o HTML achatado evita falso negativo por
      // indentação, sem precisar desregular a formatação do template.
      const flat = html.replace(/>\s+</g, '><');

      // Cada bloco da home é conferido contra content/<lang>.json: o número de
      // métricas, de projetos, de experiências e de capacidades não pode divergir.
      const metrics = (html.match(/class="metric"/g)?? []).length;
      check(metrics === d.metrics.items.length, `${metrics} métricas (esperado ${d.metrics.items.length})`);
      for (const m of d.metrics.items) {
        const num = fill(m.number, d);
        if (num == null || String(num).includes('{{')) {
          check(false, `métrica "${m.label}" com token não resolvido: ${m.number}`);
          continue;
        }
        check(flat.includes(`>${esc(num)}</span><span class="metric-label">${esc(m.label)}</span>`),
          `métrica "${m.label}" = ${num}`);
      }

      const works = (html.match(/class="work-card"/g)?? []).length;
      check(works === d.selectedWork.items.length, `${works} projetos selecionados (esperado ${d.selectedWork.items.length})`);
      for (const w of d.selectedWork.items) {
        check(flat.includes(`<span class="work-number">${esc(w.number)}</span><h3>${esc(w.title)}</h3>`),
          `projeto ${w.number} é "${w.title}"`);
        // Todo link de projeto é externo e seguro; nenhum é example.com.
        for (const l of w.links) {
          check(/^https?:\/\//.test(l.href) && !/example\.(com|org)/.test(l.href),
            `link de "${w.title}" aponta para host real — ${l.href.slice(0, 48)}`);
        }
      }

      const exps = (html.match(/class="exp-entry"/g)?? []).length;
      check(exps === d.experience.entries.length, `${exps} experiências (esperado ${d.experience.entries.length})`);
      for (const x of d.experience.entries) {
        check(flat.includes(`>${esc(x.org)} <span class="exp-org-full">`) && html.includes(esc(x.period)),
          `experiência ${x.org} com período ${x.period}`);
        // Um <ul> por entrada; o que precisa bater com x.systems são os itens.
        const sysLists = (html.match(/class="exp-systems"/g) ?? []).length;
        check(sysLists === d.experience.entries.length, `${sysLists} listas de sistemas (esperado ${d.experience.entries.length})`);
        for (const s of x.systems) {
          check(flat.includes(`<strong>${esc(s.name)}</strong> — ${esc(s.desc)}`),
            `sistema "${s.name}" em ${x.org}`);
        }
      }

      const caps = (html.match(/class="service-card"/g)?? []).length;
      check(caps === d.engineering.capabilities.length, `${caps} capacidades de engenharia (esperado ${d.engineering.capabilities.length})`);
      check(flat.includes(esc(d.engineering.statement)), 'afirmação de engenharia presente');

      const witems = (html.match(/class="writing-list"/g)?? []).length;
      check(witems === 1, 'lista de escritos presente');
      for (const t of d.writingPreview.items) {
        check(flat.includes(esc(t.title)), `escrito "${t.title.slice(0, 40)}…"`);
      }
      check(html.includes(`>${esc(d.hero.ctaWork)}</a>`), 'CTA primário aponta para o catálogo');
    } else if (page.key === 'work' || page.key === 'writing') {
      const cards = (html.match(/class="project-card"/g) ?? []).length;
      const expected = expectedCards(lang, page.key);
      check(cards === expected, `${cards} cards (esperado ${expected} de content/${lang}.json)`);
      const groups = (html.match(/class="project-group"/g) ?? []).length;
      const expectedGroups = CATALOG[page.key].groups.filter(k => p[k]?.items?.length).length;
      check(groups === expectedGroups, `${groups} grupos (esperado ${expectedGroups})`);
      for (const k of CATALOG[page.key].groups) {
        if (!p[k]?.items?.length) continue;
        check(html.includes(`>${esc(p[k].title)} <span class="group-count">${p[k].items.length}</span>`),
          `grupo "${p[k].title}" com contagem ${p[k].items.length}`);
      }
      check(html.includes(`<p class="section-intro centered">${esc(d[page.key].intro)}</p>`), 'intro da página presente');
    } else if (page.key === 'about') {
      check(d.about.paragraphs.every(t => html.includes(esc(t))), 'todos os parágrafos do About presentes');
      check(html.includes(SITE.cv[lang]), 'CTA de download do CV');
    }

    // ── filtro por categoria: HTML e CSS precisam concordar ──
    if (CATALOG[page.key]?.filters) {
      const blocks = CATALOG[page.key].filters.filter(k => p[k]?.items?.length);
      const expectedTabs = ['all', ...blocks.map(k => GROUPS.find(g => g.key === k).filter)];
      const renderedTabs = [...html.matchAll(/for="pf-([\w-]+)" class="filter-tab"/g)].map(m => m[1]);
      check(JSON.stringify(renderedTabs) === JSON.stringify(expectedTabs),
        `abas de filtro — ${renderedTabs.join(', ')}`);
      for (const t of expectedTabs) {
        check(css.includes(`#pf-${t}:checked`), `CSS cobre o filtro pf-${t}`);
      }
      check(css.includes(`#${page.key}:has(#pf-${expectedTabs[1]}:checked)`),
        `CSS oculta os grupos no escopo de #${page.key}`);
    }

    // ── higiene ──
    check(!/\{\{\w+\}\}/.test(html), 'nenhum token {{...}} não resolvido');
    check(!/>null<|undefined|NaN/.test(html), 'sem null/undefined/NaN no HTML');
    check(!/jquery|select2/i.test(html), 'sem jQuery/Select2');
    check(!/carousel/i.test(html), 'sem vestígio de carrossel');
    check(!/web3forms|access_key/i.test(html), 'sem Web3Forms nem access_key');
    check(!/<form/i.test(html), 'sem formulário preenchível');
    check(!/href="(css|js|images|content|files)\//.test(html), 'links com caminho absoluto');
    check(!/src="(css|js|images)\//.test(html), 'scripts e imagens com caminho absoluto');

    // ── JSON-LD ──
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    check(blocks.length === 1, `${blocks.length} bloco JSON-LD (esperado 1)`);
    for (const [, raw] of blocks) {
      let parsed;
      try { parsed = JSON.parse(raw.replace(/\\u003c/g, '<')); }
      catch (e) { bad(`JSON-LD inválido: ${e.message}`); continue; }
      const types = (parsed['@graph'] ?? []).map(n => n['@type']);
      check(types.includes('Person') && types.includes('WebPage') && types.includes('WebSite'),
        `JSON-LD com Person, WebPage e WebSite — ${types.join(', ')}`);
    }

    // ── links internos resolvem ──
    const broken = new Set();
    for (const m of html.matchAll(/href="(\/[^"'#?]*)(?:[?#][^"']*)?"/g)) {
      const target = m[1];
      if (/\.(xml|txt)$/.test(target)) continue;
      const asFile = target.endsWith('/') ? join(target.slice(1), 'index.html') : target.slice(1);
      if (!existsSync(join(ROOT, asFile))) broken.add(target);
    }
    check(broken.size === 0, broken.size ? `links internos quebrados: ${[...broken].join(', ')}` : 'todos os links internos resolvem');
  }
}

/* ─────────────────────────────────────────────────────────────
   raiz
   ───────────────────────────────────────────────────────────── */
console.log('\nraiz');
const robots = read('robots.txt');
check(robots.includes('Sitemap: https://pconradjunior.github.io/sitemap.xml'), 'robots.txt referencia o sitemap');

const sitemap = read('sitemap.xml');
for (const page of PAGES) {
  for (const lang of LANGS) {
    check(sitemap.includes(`<loc>${SITE.origin}${pageUrl(page, lang)}</loc>`),
      `sitemap inclui ${pageUrl(page, lang)}`);
  }
}
check((sitemap.match(/<lastmod>/g) ?? []).length === PAGES.length * 2,
  'lastmod só nas páginas bilíngues, não nas avulsas');
check(existsSync(join(ROOT, '404.html')), '404.html existe');
check(existsSync(join(ROOT, 'images/og-image.png')), 'og-image.png existe');
for (const lang of LANGS) {
  check(existsSync(join(ROOT, SITE.cv[lang].slice(1))), `CV existe — ${SITE.cv[lang]}`);
}
check(!existsSync(join(ROOT, 'index_bak.html')) && !existsSync(join(ROOT, 'index_en_bak.html')), 'backups removidos');

console.log(failures ? `\n[31m${failures} falha(s)[0m\n` : '\n[32mtodos os checks passaram[0m\n');
process.exit(failures ? 1 : 0);