/**
 * check-build.mjs — valida as páginas geradas. Roda no CI e localmente.
 * Falha com código 1 se algum check reprovar.
 *
 * Princípio: nenhuma estrutura é repetida aqui. Toda expectativa é derivada de
 * content/*.json e de js/render.js, para que o validador não possa divergir do
 * que o build realmente produz.
 */
import { readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildSvg, writeIco, magickAvailable, ICO_SIZES } from './build-favicon.mjs';
import {
  PAGES, PAGE_BY_KEY as PAGE_BY_KEY_WORK, pageUrl, pageFile, GROUPS, CATALOG, SITE, fill,
  casePage, caseStudyUrl,
  CS_REQUIRED_SECTIONS, CS_STATUSES, pageKey
} from '../js/render.js';
import { loadContent, loadCaseStudies, contentFiles, deepEqual, firstDiff } from '../js/content.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const LANGS = ['pt', 'en'];

let failures = 0;
const ok = m => console.log(`  [32m✓[0m ${m}`);
const bad = m => { failures++; console.log(`  [31m✗[0m ${m}`); };
const check = (cond, m) => (cond ? ok(m) : bad(m));

const read = p => readFileSync(join(ROOT, p), 'utf8');
const content = lang => loadContent(ROOT, lang);
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
  // Com um arquivo por seção, a paridade de arquivos vem primeiro: uma seção que
  // existe em pt e não em en é uma página a menos no outro idioma.
  const ptFiles = contentFiles(ROOT, 'pt');
  const enFiles = contentFiles(ROOT, 'en');
  const onlyPt = ptFiles.filter(f => !enFiles.includes(f));
  const onlyEn = enFiles.filter(f => !ptFiles.includes(f));
  check(onlyPt.length === 0 && onlyEn.length === 0,
    onlyPt.length || onlyEn.length
      ? `arquivos divergem — só em pt: ${onlyPt.join(', ') || '—'} · só em en: ${onlyEn.join(', ') || '—'}`
      : `${ptFiles.length} arquivos de conteúdo em cada idioma`);
  check(ptFiles.length > 0, 'content/pt tem arquivos de seção');

  const [pt, en] = [shape(content('pt')), shape(content('en'))];
  const onlyPtNodes = pt.filter(x => !en.includes(x));
  const onlyEnNodes = en.filter(x => !pt.includes(x));
  check(onlyPtNodes.length === 0 && onlyEnNodes.length === 0,
    onlyPtNodes.length || onlyEnNodes.length
      ? `estrutura diverge — só em pt: ${onlyPtNodes.slice(0, 4).join(' | ')} · só em en: ${onlyEnNodes.slice(0, 4).join(' | ')}`
      : `estrutura idêntica (${pt.length} nós)`);
}

/* ─────────────────────────────────────────────────────────────
   monólitos preservados
   content/pt.json e content/en.json foram mantidos como referência de
   migração, mas o build não os lê: a fonte é content/<idioma>/*.json.
   Editá-los cria duas verdades, então a divergência reprova aqui.
   ───────────────────────────────────────────────────────────── */
console.log('\nmonólitos preservados');
for (const lang of LANGS) {
  const file = `content/${lang}.json`;
  if (!existsSync(join(ROOT, file))) { ok(`${file} removido — layout por seção é a única fonte`); continue; }
  const mono = JSON.parse(read(file));
  const assembled = content(lang);
  const diff = firstDiff(mono, assembled);
  check(diff === null,
    diff === null
      ? `${file} bate com content/${lang}/ — não edite o monólito`
      : `${file} diverge em ${diff} — a fonte é content/${lang}/`);
}

/* ─────────────────────────────────────────────────────────────
   páginas
   ───────────────────────────────────────────────────────────── */

/** Cards esperados por página, derivado do conteúdo. */
function expectedCards(lang, pageKey) {
  const p = content(lang).projects;
  return CATALOG[pageKey].groups.reduce((n, k) => n + (p[k]?.items?.length ?? 0), 0);
}

const csSlugs = lang => loadCaseStudies(ROOT, lang).map(cs => cs.slug);

/**
 * Páginas a validar: as fixas mais os case studies. O HTML de um estudo é
 * escrito em work/<slug>/index.html, com o mesmo formato das demais.
 */
const targets = lang => [
  ...PAGES.map(page => ({ kind: 'page', page, file: lang === 'pt' ? pageFile(page) : `en/${pageFile(page)}` })),
  ...loadCaseStudies(ROOT, lang).map(cs => {
    const page = casePage(cs);
    return { kind: 'case', page, cs, file: lang === 'pt' ? pageFile(page) : `en/${pageFile(page)}` };
  })
];

/* ─────────────────────────────────────────────────────────────
   temas
   A lista de temas vive em content/<lang>/ui.json, mas aparece em três
   lugares que precisam concordar: o HTML gerado, o CSS (variante de cor,
   anel de seleção e foco de teclado) e as páginas soltas da raiz, que
   carregam o mesmo switcher em HTML escrito à mão. Um tema novo no
   conteúdo que não chegue aos três passa despercebido e some justamente
   onde o usuário o procura.
   ───────────────────────────────────────────────────────────── */

console.log('\ntemas');
{
  const themeIds = lang => content(lang).themes.map(t => t.id);

  // Os ids não são valores de shape(), então a paridade não os cobre sozinha.
  check(JSON.stringify(themeIds('pt')) === JSON.stringify(themeIds('en')),
    `mesmos temas em pt e en — ${themeIds('pt').join(', ')}`);

  const all = themeIds('pt');
  for (const id of all) {
    const short = id.replace('theme-', '');
    // O primeiro tema da lista é o que está em :root — é o padrão e não ganha
    // variante própria, senão a mesma paleta estaria escrita duas vezes. A
    // lista reordenada troca quem é o padrão, e este check é o que pega isso.
    const isDefault = id === all[0];
    check(isDefault || css.includes(`html[data-theme="${id}"]`),
      isDefault ? `${id} é o tema padrão em :root` : `CSS define a variante ${id}`);
    check(css.includes(`#${id}:checked~.theme-switcher .label-${short}`), `CSS marca ${id} como selecionado`);
    check(css.includes(`#${id}:focus-visible~.theme-switcher .label-${short}`), `CSS mostra o foco de teclado em ${id}`);
    check(css.includes(`.label-${short} {`), `CSS pinta a swatch .label-${short}`);
  }

  // Regra de tema no CSS que ninguém mais declara: sobra de renomeação.
  const cssThemes = [...css.matchAll(/html\[data-theme="([\w-]+)"\]/g)].map(m => m[1]);
  check(cssThemes.every(t => all.includes(t)),
    `sem variante de tema órfã no CSS — ${[...new Set(cssThemes)].join(', ')}`);

  for (const lang of LANGS) {
    for (const { file } of targets(lang)) {
      const html = read(file);
      const radios = [...html.matchAll(/id="(theme-[\w-]+)" class="theme-controller"/g)].map(m => m[1]);
      check(JSON.stringify(radios) === JSON.stringify(themeIds(lang)),
        `${file}: switcher com os ${themeIds(lang).length} temas`);
      for (const t of content(lang).themes) {
        // Nome acessível próprio: um switcher cujas swatches se anunciam com o
        // mesmo texto não diz ao leitor de tela qual tema é qual.
        check(html.includes(`for="${t.id}" class="theme-label label-${t.id.replace('theme-', '')}"><span class="sr-only">${esc(t.name)}</span>`),
          `${file}: nome acessível de ${t.id}`);
      }
    }
  }

  // Páginas soltas da raiz: não são geradas, mas carregam o mesmo switcher.
  const generated = new Set(LANGS.flatMap(lang => targets(lang).map(t => t.file)));
  for (const file of readdirSync(ROOT).filter(f => f.endsWith('.html'))) {
    if (file === '404.html' || generated.has(file)) continue;
    const html = read(file);
    const radios = [...html.matchAll(/id="(theme-[\w-]+)" class="theme-controller"/g)].map(m => m[1]);
    const labels = [...html.matchAll(/for="(theme-[\w-]+)" class="theme-label/g)].map(m => m[1]);
    check(radios.length === all.length && all.every(t => radios.includes(t)),
      `${file}: switcher com os ${all.length} temas`);
    check(labels.length === all.length && all.every(t => labels.includes(t)),
      `${file}: uma swatch por tema`);
  }
}

/* ─────────────────────────────────────────────────────────────
   favicon
   O logo do site não é um arquivo: é o glifo `fa-code` do Font
   Awesome, que tools/build-favicon.mjs rasteriza em images/favicon.svg
   e empacota em /favicon.ico. São dois artefatos derivados do mesmo
   glifo, e o .ico é binário — nada o regenera sozinho. Aqui se
   verifica que ele existe, tem os tamanhos que se espera, e não ficou
   desatualizado em relação ao SVG.
   ───────────────────────────────────────────────────────────── */
console.log('\nfavicon');

{
  const svgPath = join(ROOT, 'images/favicon.svg');
  const icoPath = join(ROOT, 'favicon.ico');

  check(existsSync(svgPath), 'images/favicon.svg existe');
  check(existsSync(icoPath), 'favicon.ico existe na raiz (é o que o navegador pede por padrão)');

  if (existsSync(svgPath)) {
    const svg = readFileSync(svgPath, 'utf8');
    const built = buildSvg();
    check(svg === built,
      'images/favicon.svg é o que tools/build-favicon.mjs produz (sem edição manual por cima)');
    // A marca é o "< />". Os três traços com as coordenadas de MARK_PATH: se
    // alguém trocar por um glifo de fonte, ou trocar a ordem dos caracteres,
    // este check reprova.
    check(svg.includes('<path d="M216 126 L140 256 L216 386 M278 126 L234 386 M296 126 L372 256 L296 386"'),
      'a marca é o < /> (dois chevrons e a barra, nesta ordem)');
    check(!/<text|font-family/.test(svg),
      'a marca é traçado, não texto — assim não depende da fonte de quem abre');
    check(/stroke="#00f2ff"/.test(svg) && /fill="#0a0a0c"/.test(svg),
      'cores do header: fundo escuro do tema com o acento por cima');
  }

  if (existsSync(icoPath)) {
    const ico = readFileSync(icoPath);
    const reserved = ico.readUInt16LE(0);
    const type = ico.readUInt16LE(2);
    const count = ico.readUInt16LE(4);
    check(reserved === 0 && type === 1 && count > 0,
      `favicon.ico é um ICO válido com ${count} entradas`);

    // Cada entrada: largura, altura, ... , tamanho, deslocamento (16 bytes)
    const sizes = [];
    let sane = count > 0;
    for (let i = 0; i < count; i++) {
      const o = 6 + 16 * i;
      if (o + 16 > ico.length) { sane = false; break; }
      const w = ico[o] || 256;
      const h = ico[o + 1] || 256;
      const size = ico.readUInt32LE(o + 8);
      const offset = ico.readUInt32LE(o + 12);
      if (w !== h) sane = false;
      if (offset + size > ico.length) sane = false;
      sizes.push(w);
    }
    check(sane, 'todas as entradas do .ico apontam para dados dentro do arquivo');
    check(ICO_SIZES.every(s => sizes.includes(s)),
      `favicon.ico tem os tamanhos ${ICO_SIZES.join(', ')} — ${[...new Set(sizes)].sort((a, b) => a - b).join(', ')}`);

    // Desatualizado: o .ico é derivado do SVG, e o SVG é gerado. Refazer o
    // empacotamento e comparar dá o aviso sem depender do histórico do git.
    if (magickAvailable()) {
      const tmp = join(tmpdir(), `favicon-check-${process.pid}.ico`);
      try {
        writeIco({ svgPath, icoPath: tmp });
        check(readFileSync(tmp).equals(ico), 'favicon.ico está em dia com images/favicon.svg');
      } catch {
        check(false, 'favicon.ico pôde ser regerado para conferência');
      } finally {
        if (existsSync(tmp)) rmSync(tmp);
      }
    } else {
      console.log('  [33m![0] magick ausente: não consegui conferir se o .ico está em dia com o SVG');
    }
  }

  // Toda página gerada declara o SVG e a reserva em .ico. Sem o .ico na raiz,
  // quem só understande .ico cairia no 404.
  for (const lang of LANGS) {
    for (const { file } of targets(lang)) {
      const html = read(file);
      check(html.includes('<link rel="icon" type="image/svg+xml" href="/images/favicon.svg">')
        && html.includes('<link rel="alternate icon" type="image/x-icon" href="/favicon.ico">'),
        `${file}: declara o favicon em SVG e em .ico`);
    }
  }

  // O favicon deixou de depender do idioma (a bandeira ficou de fora). Se
  // alguém reintroduzir a troca, ela volta aqui.
  const mainJs = read('js/main.js');
  check(!/favicon\.ico|flags\/(br|us)\.svg/.test(mainJs),
    'main.js não troca mais o favicon conforme o idioma');
  check(!content('pt').meta.flagIcon && !content('en').meta.flagIcon,
    'meta.json não tem mais flagIcon apontando para a bandeira');
}

for (const lang of LANGS) {
  for (const { kind, page, cs, file } of targets(lang)) {
    const d = content(lang);
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
    } else if (kind === 'case') {
      check(h1s[0] === esc(cs.title), `h1 do estudo é "${cs.title}"`);
    } else {
      check(h1s[0] === esc(d[pageKey(page.key)].sectionTitle), 'h1 é o título da página no idioma certo');
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
      // Nem toda entrada tem sistemas: só as que os declaram geram <ul>.
      const withSystems = d.experience.entries.filter(x => x.systems?.length).length;
      const sysLists = (html.match(/class="exp-systems"/g) ?? []).length;
      check(sysLists === withSystems, `${sysLists} listas de sistemas (esperado ${withSystems})`);
      for (const x of d.experience.entries) {
        check(flat.includes(`>${esc(x.org)} <span class="exp-org-full">`) && html.includes(esc(x.period)),
          `experiência ${x.org} com período ${x.period}`);
        for (const r of x.responsibilities ?? []) {
          check(flat.includes(esc(r)), `responsabilidade "${r}" em ${x.org}`);
        }
        for (const s of x.systems ?? []) {
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

      // Toda referência a um estudo na home precisa existir de verdade: um slug
      // declarado e sem arquivo viraria um 404 silencioso em produção.
      for (const w of d.selectedWork.items) {
        if (!w.caseStudy) continue;
        check(csSlugs(lang).includes(w.caseStudy),
          `home referencia o estudo "${w.caseStudy}" — arquivo existe`);
        check(flat.includes(`href="${caseStudyUrl(w.caseStudy, lang)}"`),
          `home linka ${caseStudyUrl(w.caseStudy, lang)}`);
      }
    } else if (kind === 'case') {
      // Um estudo só vale se dá para chegar nele: a página precisa apontar de
      // volta para o catálogo e ser referenciada por alguma página do site.
      check(html.includes(`href="${pageUrl(PAGE_BY_KEY_WORK['work'], lang)}"`),
        `estudo tem link de volta para ${pageUrl(PAGE_BY_KEY_WORK['work'], lang)}`);
      const here = pageUrl(page, lang);
      const reachable = targets(lang).some(t => {
        const f = t.file;
        if (f === file) return false;
        return read(f).includes(`href="${here}"`);
      });
      check(reachable, `estudo é alcançável a partir de outra página`);
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
    // Só interessa saber se a biblioteca é carregada. A palavra "jQuery" pode e
    // deve aparecer como competência no currículo — o check é nos tags, não no texto.
    check(!/<(?:script|link)[^>]+(?:jquery|select2)/i.test(html), 'sem jQuery/Select2');
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
   case studies
   O esquema é o que impede um estudo de virar propaganda: seções
   obrigatórias, números que precisam sair de algum lugar verificável e
   links de evidência apontando para host real.
   ───────────────────────────────────────────────────────────── */
console.log('\ncase studies');

const ptSlugs = csSlugs('pt');
const enSlugs = csSlugs('en');
// Nenhum estudo ainda é um estado válido — o pipeline existe e os dados ainda
// não chegaram. Reprovar aqui deixaria o CI vermelho num commit limpo; o que
// não pode passar é um estudo escrito pela metade.
if (ptSlugs.length === 0) {
  ok('nenhum case study escrito ainda — pipeline pronto, aguardando conteúdo (veja content/README.md)');
} else {
  ok(`${ptSlugs.length} estudo(s) em content/<idioma>/case-studies`);
}
for (const s of ptSlugs) check(enSlugs.includes(s), `estudo "${s}" tem par em EN`);
for (const s of enSlugs) check(ptSlugs.includes(s), `estudo "${s}" tem par em PT`);

for (const lang of LANGS) {
  for (const cs of loadCaseStudies(ROOT, lang)) {
    console.log(`\n  case study ${lang}/${cs.slug}`);

    const ids = (cs.sections ?? []).map(s => s.id);
    for (const req of CS_REQUIRED_SECTIONS) {
      const s = (cs.sections ?? []).find(x => x.id === req);
      check(!!s && (s.paragraphs?.length || s.bullets?.length),
        `seção obrigatória "${req}" presente e preenchida`);
    }
    check(new Set(ids).size === ids.length, 'ids de seção sem repetição');
    check(CS_STATUSES.includes(cs.status), `status "${cs.status}" é um valor conhecido`);
    check(content(lang).caseStudy.status[cs.status] !== undefined, `status "${cs.status}" tem rótulo em ${lang}`);

    // Nenhum outcome pode ser um número inventado: ou é literal, ou é um token
    // que o conteúdo resolve ({{downloads}}, {{papers}}…).
    for (const o of cs.outcomes ?? []) {
      const n = fill(o.number, content(lang));
      check(n != null && !String(n).includes('{{') && String(n).trim() !== '',
        `outcome "${o.label}" resolve — ${o.number}`);
    }

    for (const e of cs.evidence ?? []) {
      check(/^https?:\/\//.test(e.href) && !/example\.(com|org)/.test(e.href),
        `evidência "${e.label}" aponta para host real`);
    }
    check((cs.related ?? []).every(r => r.href && r.title), 'referências relacionadas têm título e href');
    check(Array.isArray(cs.stack) && cs.stack.length > 0, 'stack declarada');
  }
}

/* ─────────────────────────────────────────────────────────────
   raiz
   ───────────────────────────────────────────────────────────── */
console.log('\nraiz');
const robots = read('robots.txt');
check(robots.includes('Sitemap: https://pconradjunior.github.io/sitemap.xml'), 'robots.txt referencia o sitemap');

const sitemap = read('sitemap.xml');
const sitemapPages = [...PAGES, ...ptSlugs.map(s => casePage({ slug: s }))];
for (const page of sitemapPages) {
  for (const lang of LANGS) {
    check(sitemap.includes(`<loc>${SITE.origin}${pageUrl(page, lang)}</loc>`),
      `sitemap inclui ${pageUrl(page, lang)}`);
  }
}
check((sitemap.match(/<lastmod>/g) ?? []).length === sitemapPages.length * 2,
  'lastmod só nas páginas bilíngues, não nas avulsas');
check(existsSync(join(ROOT, '404.html')), '404.html existe');
check(existsSync(join(ROOT, 'images/og-image.png')), 'og-image.png existe');
// O currículo é página gerada (/cv/), não arquivo solto: o PDF de 2022 saiu do
// site. Precisa existir o HTML nos dois idiomas, e nada pode apontar para /files/.
for (const lang of LANGS) {
  const cvFile = lang === 'en' ? `en/${pageFile(PAGE_BY_KEY_WORK.cv)}` : pageFile(PAGE_BY_KEY_WORK.cv);
  check(existsSync(join(ROOT, cvFile)), `currículo gerado — /${cvFile}`);
  // Varre as mesmas páginas que o loop principal valida, subpáginas inclusas:
  // um /files/ esquecido num case study viraria 404 igual.
  for (const { file } of targets(lang)) {
    check(!read(file).includes('/files/'), `${file} não referencia /files/`);
  }
}
check(!existsSync(join(ROOT, 'index_bak.html')) && !existsSync(join(ROOT, 'index_en_bak.html')), 'backups removidos');

console.log(failures ? `\n[31m${failures} falha(s)[0m\n` : '\n[32mtodos os checks passaram[0m\n');
process.exit(failures ? 1 : 0);