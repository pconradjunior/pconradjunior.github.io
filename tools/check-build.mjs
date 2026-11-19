/**
 * check-build.mjs — valida as páginas geradas. Roda no CI e localmente.
 * Falha com código 1 se algum check reprovar.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { counts, fill, esc } from '../js/render.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PAGES = [
  { lang: 'pt', file: 'index.html', canonical: 'https://pconradjunior.github.io/' },
  { lang: 'en', file: 'en/index.html', canonical: 'https://pconradjunior.github.io/en/' }
];

let failures = 0;
const ok = m => console.log(`  \u001b[32m✓\u001b[0m ${m}`);
const bad = m => { failures++; console.log(`  \u001b[31m✗\u001b[0m ${m}`); };
const check = (cond, m) => (cond ? ok(m) : bad(m));

const read = p => readFileSync(join(ROOT, p), 'utf8');
const content = lang => JSON.parse(read(`content/${lang}.json`));
const count = (html, re) => (html.match(re) ?? []).length;

for (const page of PAGES) {
  console.log(`\n${page.file}`);
  const html = read(page.file);
  const d = content(page.lang);

  // ── SEO básico ──
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  check(title.length >= 20 && title.length <= 75, `title com ${title.length} chars`);
  check(desc.length >= 70 && desc.length <= 175, `description com ${desc.length} chars`);
  check(/lang="[^"]+"/.test(html), 'html lang definido');
  check(html.includes(`<link rel="canonical" href="${page.canonical}">`), 'canonical correto');
  check(html.includes('hreflang="pt-BR"') && html.includes('hreflang="en"') && html.includes('hreflang="x-default"'), 'hreflang pt/en/x-default presentes');
  check(html.includes('og:title') && html.includes('og:image') && html.includes('twitter:card'), 'Open Graph + Twitter Card');
  check(!html.includes(`<link rel="canonical" href="${PAGES.find(p => p.lang !== page.lang).canonical}">`), 'canonical não aponta para o idioma errado');

  // ── identidade e hero ──
  check(count(html, /<h1>/g) === 1, 'h1 único');
  check(html.includes(`<h1>${d.hero.title}</h1>`), `h1 do hero preenchido — ${JSON.stringify(d.hero.title)}`);
  check(html.includes(d.nav.brand), 'nome de identidade presente');
  check(html.includes(`<a href="#home" class="lp-logo">${d.nav.brand}</a>`),
    'logo sem ícone inline (ícone via CSS)');
  check(html.includes(fill('{{downloads}}', d)), `métrica de downloads derivada — ${fill('{{downloads}}', d)}`);
  check(count(html, /class="lp-stat"/g) === 3, '3 métricas no hero');
  check(count(html, /class="lp-btn lp-btn-/g) === 2, '2 botões no hero');
  check(html.includes('href="#projects"') && html.includes('href="#contact"'), 'botões apontam para Projetos e Contato');

  // ── 4 blocos + rodapé ──
  const ids = ['home', 'projects', 'about', 'contact'];
  const positions = ids.map(id => html.indexOf(`<section id="${id}"`));
  check(positions.every((p, i) => p > -1 && (i === 0 || p > positions[i - 1])), 'ordem: Hero → Projetos → Sobre → Contato');
  check(html.indexOf('<footer') > positions[3], 'rodapé depois do Contato');

  const h2 = count(html, /<h2 class="lp-section-title">/g);
  check(h2 === 3, `${h2} headings h2 — Projetos, Sobre, Contato`);
  for (const title of [d.projectsSection.sectionTitle, d.about.sectionTitle, d.contact.sectionTitle]) {
    check(html.includes(`<h2 class="lp-section-title">${title}</h2>`), `h2 preenchido — ${JSON.stringify(title)}`);
  }

  // ── projetos em destaque: exatamente 6 ──
  check(count(html, /class="lp-card"/g) === 6, '6 cards em destaque');
  for (const item of d.featured) {
    check(html.includes(`<h3 class="lp-card-title">${item.title}</h3>`), `card presente — ${item.title}`);
    check(html.includes(fill(item.metric, d)), `dado concreto do card — ${item.title}`);
  }
  check(html.includes(d.featured[4].links[0].href), 'link do SisPPA aponta para a publicação');
  const rex = d.featured.find(i => i.title.startsWith('REx'));
  check(rex && html.includes(`<h3 class="lp-card-title">${rex.title}</h3>`), 'REx incluído entre os projetos em destaque');
  check(rex && html.includes(`href="${rex.links[0].href}"`), 'REx linkado à própria página');
  check(html.includes(`href="${d.projectsSection.archiveHref}"`) && html.includes(`${esc(d.projectsSection.archiveLabel)} →`),
    'link de projetos de código aberto aponta para o GitHub');

  // ── vídeos: apenas os apps em destaque que têm demo ──
  const videoIds = d.featured.flatMap(i => (i.links ?? []).filter(l => l.action === 'video').map(l => l.videoId));
  check(videoIds.length === 2, `${videoIds.length} vídeos em destaque (App Unipampa e ChessKids)`);
  check(count(html, /data-video="/g) === 2, '2 gatilhos de vídeo renderizados');
  for (const id of videoIds) {
    check(html.includes(`data-video="${id}"`), `vídeo disponível — ${id}`);
  }
  check(html.includes('id="videoModal"') && html.includes('id="videoFrame"'), 'modal de vídeo restaurado');
  check(/id="videoFrame"[^>]*src=""/.test(html), 'iframe do modal começa sem src');
  check(!/data-info-modal|id="infoModal"/.test(html), 'sem modal de informação');

  // ── sobre / publicações ──
  const bio = d.about.paragraphs.join(' ');
  check(bio.toLowerCase().includes(page.lang === 'pt' ? 'desde 2010' : 'since 2010'), 'Unipampa desde 2010');
  check(bio.includes('2002') && bio.includes('2009'), 'docência entre 2002 e 2009');
  check(bio.includes(page.lang === 'pt' ? 'ensino técnico e superior' : 'technical and university level'), 'docência técnica e superior');
  check(html.includes(d.about.publicationsTitle), 'bloco Artigos e publicações presente');
  check(html.includes(`<p>${esc(d.about.wticifesText)}</p>`) &&
        html.includes(`href="${esc(d.about.wticifesHref)}"`) &&
        html.includes(`${esc(d.about.wticifesLabel)} →`),
    'artigos do WTICIFES com link oficial no card de publicações');
  check(html.includes(`<h3 class="lp-skills-title">${esc(d.about.skillsTitle)}</h3>`) &&
        html.includes(`<p class="lp-skills-intro">${esc(d.about.skillsIntro)}</p>`),
    'subtítulo e descrição das competências no Sobre');
  check(html.includes('<ul class="lp-skills">') && html.indexOf('lp-skills-title') < html.indexOf('lp-publications'),
    'competências na coluna esquerda, antes de publicações');
  check(html.includes('<ul class="lp-skills">') && d.about.skills.every(skill => html.includes(`<li>${skill}</li>`)),
    `${d.about.skills.length} competências renderizadas no Sobre`);
  check(html.includes('https://medium.com/@pconradjunior'), 'link para o Medium presente');
  check(!/<section id="articles"/.test(html), 'lista completa de artigos não renderizada');

  // ── contato: apenas canais reais ──
  check(html.includes(`<p class="lp-section-intro">${esc(d.contact.intro)}</p>`), 'texto de chamada para contato');
  check(count(html, /class="lp-channel"/g) === 5, '5 canais de contato');
  for (const ch of d.contact.channels) {
    check(html.includes(`href="${ch.href}"`), `canal presente — ${ch.label}`);
  }
  check(!/wa\.me|api\.whatsapp|web3forms|access_key/i.test(html), 'sem WhatsApp ou Web3Forms');
  check(!/<form/i.test(html), 'sem formulário preenchível');

  // ── sobre / avatar ──
  check(html.includes(`src="${d.about.avatar}"`), 'avatar do Sobre presente');
  check(html.includes(`alt="${d.about.avatarAlt}"`), 'alt do avatar presente');
  check(existsSync(join(ROOT, d.about.avatar)), `arquivo do avatar existe — ${d.about.avatar}`);

  // ── rodapé / arquivo ──
  const footerHtml = html.slice(html.indexOf('<footer'));
  check(html.includes(d.footer.copyright), 'copyright no rodapé');
  check(html.includes('href="/en/"') || html.includes('href="/"'), 'link para o outro idioma no rodapé');
  check(count(html, /class="lp-footer-col(?: lp-footer-archive)?"/g) === 4, '4 colunas de arquivo no rodapé');
  check(footerHtml.includes(d.footer.archiveText), 'acervo descrito em texto no rodapé');
  const archiveExpected = page.lang === 'pt'
    ? 'Escrevo sobre arquitetura de software, modelagem de dados, PHP e CodeIgniter, Flutter, carreira e gestão de equipes.'
    : 'I write about software architecture, data modeling, PHP and CodeIgniter, Flutter, career and team management.';
  check(d.footer.archiveText === archiveExpected, 'texto do acervo exatamente como solicitado');
  check(footerHtml.includes(`href="${d.footer.archiveLink.href}"`), 'link único do acervo resolvido');
  check(count(footerHtml, /href="https:\/\/medium\.com\/@pconradjunior"/g) === 1, 'acervo tem um único link para o Medium');
  for (const link of [...d.footer.articleLinks, ...d.footer.privacyLinks]) {
    check(html.includes(`href="${link.href}"`), `link de arquivo resolvido — ${link.label}`);
  }

  // ── contador de visitas preservado por decisão explícita ──
  const badge = d.footer.visitorBadge ?? '';
  check(badge && html.includes(`src="${badge}"`), 'contador de visitas presente no footer');

  // ── sem artefatos do layout antigo ──
  check(!/theme-controller|theme-switcher|localStorage\(['"]theme/.test(html), 'sem seletor de tema');
  check(!/carousel|filter-tab|aria-haspopup|info-modal/i.test(html), 'sem carrosséis, filtros, dropdowns ou modal de informação');
  check(!/Glassmorphism|backdrop-filter/i.test(html), 'sem glassmorphism');
  check(!/\{\{\w+\}\}/.test(html), 'nenhum token {{...}} não resolvido');
  check(!/>null<|undefined|NaN/.test(html), 'sem null/undefined/NaN no HTML');

  // ── caminhos absolutos (necessário para /en/) ──
  check(!/href="(css|js|images|content)\//.test(html), 'assets com caminho absoluto');
  check(!/src="(css|js|images)\//.test(html), 'scripts e imagens com caminho absoluto');
  check(html.includes('href="/css/landing.css"'), 'landing.css carregado no lugar do style.css');

  // ── JSON-LD ──
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  check(blocks.length === 6, `${blocks.length} blocos JSON-LD (esperado 6)`);
  for (const [, raw] of blocks) {
    try { JSON.parse(raw.replace(/\\u003c/g, '<')); } catch (e) { bad(`JSON-LD inválido: ${e.message}`); }
  }
  ok('todos os JSON-LD parseiam');
  check(counts(d).downloadsExact > 0, 'contagens derivadas dos dados intactas');

  // ── links internos resolvem ──
  const broken = new Set();
  for (const m of html.matchAll(/href="(\/[a-z0-9_\-/]*\.(?:html|xml|txt|png|svg|css|js|json))"/gi)) {
    const target = m[1];
    if (target === '/robots.txt' || target === '/sitemap.xml') continue;
    if (!existsSync(join(ROOT, target))) broken.add(target);
  }
  check(broken.size === 0, broken.size ? `links internos quebrados: ${[...broken].join(', ')}` : 'todos os links internos resolvem');
}

// ── CSS ──
console.log('\nCSS');
check(existsSync(join(ROOT, 'css/landing.css')), 'landing.css existe');
const landing = read('css/landing.css');
check(/flex:\s*0 0 120px/.test(landing) && /width:\s*120px/.test(landing), 'avatar com 120px');
check(!/backdrop-filter|blur\(/.test(landing), 'landing.css sem glassmorphism');
check(/\.lp-logo::before\s*\{[^}]*content:\s*"\\f121\\00a0"/.test(landing),
  'ícone fa-code via ::before com non-breaking space');
const shared = read('css/style.css');
check(!/backdrop-filter|body:has\(#theme|theme-switcher/.test(shared), 'style.css sem tema nem glassmorphism');
check(!/glass-panel/.test(shared), 'painéis das subpáginas renomeados para content-panel');

// ── páginas avulsas ──
console.log('\npáginas avulsas');
const subpages = readdirSync(ROOT).filter(f => f.endsWith('.html') && f !== 'index.html');
check(subpages.length === 14, `${subpages.length} páginas HTML na raiz além do index`);
for (const file of subpages) {
  const text = read(file);
  check(!/name="theme"|glass-panel|Glassmorphism|backdrop-filter/i.test(text), `${file}: sem tema nem glass`);
  if (text.includes('class="lp-logo"')) {
    check(text.includes('class="lp-logo">Pedro Conrad Jr</a>'), `${file}: logo sem ícone inline`);
  }
  // A 404 volta para "/" e "/en/", não para uma âncora de projeto.
  if (file !== '404.html') {
    check(text.includes('index.html#projects'), `${file}: link de volta aponta para #projects`);
  }
  if (file.endsWith('_privacy.html') || file === 'rex_info.html') {
    check(text.includes('/css/landing.css'), `${file}: usa o CSS da landing`);
    check(text.includes('<header class="lp-header">'), `${file}: header replicado`);
    check(text.includes('<footer class="lp-footer">'), `${file}: rodapé replicado`);
    check(/class="lp-container lp-legal-panel(?: lp-rex-panel)?"/.test(text), `${file}: conteúdo em painel`);
  }
  if (file === 'rex_info.html') {
    check(!/var\(--glass|scrollGallery|rex-gallery|onclick="openModal|function openModal|id="modalImg"/.test(text),
      `${file}: sem glass, galeria ou modal antigo`);
    check(text.includes('class="lp-image-modal"') && text.includes('id="imageModal"') && text.includes('id="imageFrame"'),
      `${file}: modal de imagem presente`);
    check((text.match(/data-image=/g) || []).length === 3, `${file}: 3 prints ampliáveis`);
    check(text.includes('data-close-modal') && text.includes('lp-image-caption'), `${file}: interação e legenda do modal`);
  }
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

console.log(failures ? `\n\u001b[31m${failures} falha(s)\u001b[0m\n` : '\n\u001b[32mtodos os checks passaram\u001b[0m\n');
process.exit(failures ? 1 : 0);
