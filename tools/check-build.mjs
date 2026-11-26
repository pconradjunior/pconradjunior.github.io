/**
 * check-build.mjs — valida as páginas geradas. Roda no CI e localmente.
 * Falha com código 1 se algum check reprovar.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { counts, fill, esc } from '../resources/js/render.js';

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
const content = lang => JSON.parse(read(`resources/content/${lang}.json`));
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
  const ogImage = page.lang === 'en' ? '/resources/images/og-image-en.png' : '/resources/images/og-image.png';
  check(html.includes(`content="https://pconradjunior.github.io${ogImage}"`),
    `og-image correto para ${page.lang} — ${ogImage}`);
  check(!html.includes(`<link rel="canonical" href="${PAGES.find(p => p.lang !== page.lang).canonical}">`), 'canonical não aponta para o idioma errado');
  check(!/name="keywords"/.test(html), 'meta keywords removido (obsoleto)');
  check(/<meta name="dateModified" content="\d{4}-\d{2}-\d{2}">/.test(html), 'dateModified presente no head');
  check(!/cdnjs\.cloudflare\.com|<i class="[^"]*\bfa(?:-| )|fa-brands|Font Awesome/i.test(html),
    'nenhum Font Awesome/CDN na landing');
  check(count(html, /<svg class="lp-icon/g) >= 15, `${count(html, /<svg class="lp-icon/g)} ícones SVG inline`);
  check(!/<i\b/.test(html), 'nenhum elemento <i> residual na landing');

  // ── identidade e hero ──
  check(count(html, /<h1>/g) === 1, 'h1 único');
  check(html.includes(`<h1>${d.hero.title}</h1>`), `h1 do hero preenchido — ${JSON.stringify(d.hero.title)}`);
  check(html.includes(d.nav.brand), 'nome de identidade presente');
  check(html.includes('<a href="#home" class="lp-logo"><svg class="lp-icon lp-logo-icon"') &&
        html.includes(`</svg> ${esc(d.nav.brand)}</a>`),
    'logo com ícone SVG inline e nome acessível');
  check(html.includes(fill('{{downloads}}', d)), `métrica de downloads derivada — ${fill('{{downloads}}', d)}`);
  check(count(html, /class="lp-stat"/g) === 3, '3 métricas no hero');
  check(count(html, /class="lp-btn lp-btn-/g) === 2, '2 botões no hero');
  check(html.includes('href="#projects"') && html.includes('href="#contact"'), 'botões apontam para Projetos e Contato');

  // ── 6 blocos + rodapé ──
  const ids = ['home', 'projects', 'about', 'engineering', 'career', 'contact'];
  const positions = ids.map(id => html.indexOf(`<section id="${id}"`));
  check(positions.every((p, i) => p > -1 && (i === 0 || p > positions[i - 1])),
    'ordem: Hero → Projetos → Sobre → Engenharia → Trajetória → Contato');
  check(html.indexOf('<footer') > positions[5], 'rodapé depois do Contato');

  const h2 = count(html, /<h2 class="lp-section-title">/g);
  check(h2 === 5, `${h2} headings h2 — Projetos, Sobre, Engenharia, Trajetória, Contato`);
  for (const title of [d.projectsSection.sectionTitle, d.about.sectionTitle, d.engineering.sectionTitle,
                       d.career.sectionTitle, d.contact.sectionTitle]) {
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
  check(html.includes(`href="${esc(d.projectsSection.storeHref)}"`) && html.includes(`${esc(d.projectsSection.storeLabel)} →`),
    'link da Play Store ao lado dos projetos de código aberto');

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
  check(bio.includes(page.lang === 'pt' ? 'Ensino Técnico e Ensino Superior' : 'Technical Education and Higher Education'),
    'docência técnica e superior com termos capitalizados');
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
  const allSkills = d.about.skills.flatMap(g => g.items);
  check(html.includes('<ul class="lp-skills">') && allSkills.every(skill => html.includes(`<li>${skill}</li>`)),
    `${allSkills.length} competências renderizadas no Sobre`);
  check(d.about.skills.every(g => html.includes(`<h4 class="lp-skill-group-title">${esc(g.title)}</h4>`)),
    `${d.about.skills.length} grupos de competências com título renderizado`);
  check(html.includes('https://medium.com/@pconradjunior'), 'link para o Medium presente');
  check(!/<section id="articles"/.test(html), 'lista completa de artigos não renderizada');

  // ── posicionamento e engenharia ──
  check(html.includes(`<p class="lp-positioning">${esc(d.hero.positioning)}</p>`), 'posicionamento no hero');
  check(html.includes(`<h2 class="lp-section-title">${esc(d.engineering.sectionTitle)}</h2>`), 'seção de engenharia presente');
  check(count(html, /class="lp-engineering-item"/g) === d.engineering.items.length,
    `${d.engineering.items.length} itens de engenharia renderizados`);
  check(html.includes(`href="${esc(d.engineering.linkHref)}"`) && html.includes(`${esc(d.engineering.linkLabel)} →`),
    'link do artigo sobre Petrux presente');

  // ── trajetória: registros, datas e campos essenciais no HTML estático ──
  check(html.includes(`<h2 class="lp-section-title">${esc(d.career.sectionTitle)}</h2>`), 'seção de trajetória presente');
  check(count(html, /class="lp-entry"/g) === d.experience.length + d.education.length,
    `${d.experience.length + d.education.length} registros (experiência + formação)`);
  for (const job of d.experience) {
    check(html.includes(`<h3 class="lp-entry-title">${esc(job.role)}</h3>`), `experiência presente — ${job.role}`);
    check(html.includes(esc(job.org)) && html.includes(`datetime="${esc(job.start)}"`),
      `instituição e início presentes — ${job.org}`);
    check(html.includes(esc(job.summary)), `resumo da experiência presente — ${job.role}`);
  }
  for (const ed of d.education) {
    check(html.includes(`<h4 class="lp-entry-title">${esc(ed.title)}</h4>`), `formação presente — ${ed.title}`);
    check(html.includes(esc(ed.org)), `instituição de formação presente — ${ed.org}`);
  }
  const recentCerts = d.certifications.filter(x => x.date >= '2024');
  const olderCerts = d.certifications.filter(x => x.date < '2024');
  const careerHtml = html.slice(positions[4], positions[5]);
  const dialogHtml = html.slice(html.indexOf('<dialog id="careerDialog"'));
  check(recentCerts.length === 5, `${recentCerts.length} certificações de 2024–2026 na lista principal`);
  check(count(careerHtml, /class="lp-cert"/g) === recentCerts.length,
    `${recentCerts.length} certificações visíveis na seção`);
  check(count(dialogHtml, /class="lp-cert"/g) === olderCerts.length,
    `${olderCerts.length} certificações anteriores no diálogo`);
  check(count(html, /class="lp-cert"/g) === d.certifications.length,
    `${d.certifications.length} certificações no total (lista + diálogo)`);
  for (const cert of d.certifications) {
    check(html.includes(`<span class="lp-cert-name">${esc(cert.name)}</span>`) &&
          html.includes(`<time datetime="${esc(cert.date)}">`), `certificação presente — ${cert.name}`);
  }
  check(recentCerts.some(c => /Engenharia de Prompts|Prompt Engineering/i.test(c.name)),
    'certificação de Engenharia de Prompts (nov. 2026) presente entre as recentes');
  check(!/\bJava\b|\bNestJS\b/.test(d.about.skills.flatMap(g => g.items).join(' ')), 'Java e NestJS removidos das competências');
  check(count(html, /<time datetime="/g) >= d.experience.length * 2 + d.education.length + d.certifications.length,
    'datas com <time datetime> em experiência, formação e certificações');
  check(d.career.languages.every(l => html.includes(`<strong>${esc(l.name)}</strong> — ${esc(l.level)}`)),
    'idiomas com nível renderizados');
  check(count(careerHtml, /class="lp-typed-item"/g) === 3, '3 publicações em destaque na seção');
  check(/<h3 class="lp-subsection-title">[^<]*<\/h3>\s*<ul class="lp-skills lp-languages">/.test(html),
    'idiomas renderizados como itens lado a lado, no padrão de competências');
  check(d.career.publications.every(pub => html.includes(esc(pub.title))), 'publicações tipadas renderizadas');
  check(!d.career.publications.some(pub => /<[^>]+>/.test(pub.title)), 'títulos de publicações sem HTML');

  // ── disclosures nativos: 6 blocos, sem heading dentro de summary ──
  const summaries = [...html.matchAll(/<summary>([\s\S]*?)<\/summary>/g)].map(m => m[1]);
  check(summaries.length === 6, `${summaries.length} blocos <details> (esperado 6)`);
  check(summaries.every(s => s.trim().length > 0), 'todos os <summary> têm texto');
  check(!summaries.some(s => /<h[1-6]/i.test(s)), 'nenhum heading dentro de <summary>');
  check(!/lp-cert-map|skillsMap|lp-coauthors|coauthorLabel/i.test(html), 'mapa e nota de coautoria removidos');
  check(/<dialog id="careerDialog"/.test(html) && /data-career-dialog-close/.test(html), 'acervo em <dialog> nativo');
  check(count(html, /data-career-dialog="certifications"/g) === 1 &&
        count(html, /data-career-dialog="publications"/g) === 1, 'dois gatilhos de abertura do diálogo');
  check(count(dialogHtml, /class="lp-typed-item"/g) === d.career.publications.length - 3,
    'publicações restantes presentes no diálogo');

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

  // ── cartão de contato aberto pela foto de perfil ──
  check(html.includes('<button type="button" class="lp-avatar-button" data-profile-dialog-open') &&
        html.includes(`aria-label="${esc(d.contact.card.open)}"`), 'foto de perfil abre o cartão');
  check(/<dialog id="profileDialog"/.test(html) && html.includes('data-profile-dialog-close'),
    'cartão de contato em <dialog> nativo');
  check(html.includes(`<h2 id="profileDialogName" class="lp-profile-name">${esc(d.contact.card.name)}</h2>`),
    'nome completo no cartão');
  const cardHtml = html.slice(html.indexOf('<dialog id="profileDialog"'));
  check(count(cardHtml, /class="lp-profile-link"/g) === d.contact.channels.length,
    `${d.contact.channels.length} links no cartão`);
  const cardPositions = ['github', 'linkedin', 'instagram', 'medium', 'envelope']
    .map(key => cardHtml.indexOf(d.contact.channels.find(ch => ch.icon.includes(key)).href));
  check(cardPositions.every((p, i) => p > -1 && (i === 0 || p > cardPositions[i - 1])),
    'ordem: GitHub, LinkedIn, Instagram, Medium e e-mail');

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
  check(!/href="(resources|css|fonts|js|images|content)\//.test(html), 'assets com caminho absoluto');
  check(!/src="(resources|css|fonts|js|images|content)\//.test(html), 'scripts e imagens com caminho absoluto');
  check(html.includes('href="/resources/css/landing.css"'), 'landing.css carregado no lugar do style.css');

  // ── JSON-LD ──
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  check(blocks.length === 5, `${blocks.length} blocos JSON-LD (esperado 5)`);
  for (const [, raw] of blocks) {
    try { JSON.parse(raw.replace(/\\u003c/g, '<')); } catch (e) { bad(`JSON-LD inválido: ${e.message}`); }
  }
  ok('todos os JSON-LD parseiam');

  const json = blocks.map(([, raw]) => JSON.parse(raw.replace(/\\u003c/g, '<')));
  const person = json.flatMap(b => b['@graph'] ?? [b]).find(b => b['@type'] === 'Person');
  check(!!person, 'bloco Person presente');
  check(person?.hasCredential?.length === d.certifications.length,
    `Person.hasCredential com ${d.certifications.length} entradas`);
  check(person?.hasCredential?.every(c => c.name && c.recognizedBy?.name && c.dateCreated),
    'credenciais com nome, emissor e data');
  check(person?.knowsLanguage?.length === d.career.languages.length, 'Person.knowsLanguage presente');
  check(person?.alumniOf?.length === 1 && person.alumniOf[0].name === 'URCAMP',
    'Person.alumniOf unificado em uma única entidade URCAMP');
  check(json.some(b => b['@type'] === 'ProfilePage' && /^\d{4}-\d{2}-\d{2}$/.test(b.dateModified ?? '')),
    'ProfilePage.dateModified derivado do conteúdo');
  check(json.filter(b => b['@type'] === 'ItemList').every(b => Number.isInteger(b.numberOfItems) &&
        b.numberOfItems === (b.itemListElement?.length ?? 0)),
    'todas as 3 listas declaram numberOfItems correto');
  check(person?.knowsAbout?.length === d.about.skills.flatMap(g => g.items).length,
    'Person.knowsAbout com todas as competências');
  const newsTitles = (d.projects.publications?.items ?? [])
    .filter(a => /notícia|institutional news/i.test(a.typeLabel || ''))
    .map(a => a.title);
  check(newsTitles.length === 2, `${newsTitles.length} notícias institucionais identificadas nos dados`);
  const newsNodes = json.filter(b => b['@type'] === 'ItemList')
    .flatMap(b => b.itemListElement ?? [])
    .map(i => i.item)
    .filter(item => newsTitles.includes(item?.headline));
  check(newsNodes.length === 2 && newsNodes.every(n => n['@type'] === 'NewsArticle'),
    'notícias institucionais classificadas como NewsArticle, não ScholarlyArticle');
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

// ── paridade de chaves PT/EN ──
console.log('\nparidade PT/EN');
function shape(o) {
  if (Array.isArray(o)) return `[${o.map(shape).join(',')}]`;
  if (o && typeof o === 'object') {
    return `{${Object.keys(o).sort().map(k => `${k}:${shape(o[k])}`).join('|')}}`;
  }
  return typeof o;
}
const pt = content('pt'), en = content('en');
check(shape(pt) === shape(en), 'mesmas chaves e formatos em content/pt.json e content/en.json');
for (const key of ['hero', 'about', 'engineering', 'career']) {
  check(shape(pt[key]) === shape(en[key]), `paridade de ${key}`);
}
for (const key of ['experience', 'education', 'certifications']) {
  check(shape(pt[key]) === shape(en[key]), `paridade de ${key}`);
}

// ── CSS ──
console.log('\nCSS');
check(existsSync(join(ROOT, 'resources/css/landing.css')), 'landing.css existe');
const landing = read('resources/css/landing.css');
check(/\/resources\/fonts\/inter-latin\.woff2/.test(landing) && /\/resources\/fonts\/sora-latin\.woff2/.test(landing),
  'fontes self-hosted referenciadas no CSS');
for (const f of ['inter-latin.woff2', 'sora-latin.woff2']) {
  check(existsSync(join(ROOT, 'resources/fonts', f)), `fonte ${f} existe`);
}
check(/flex:\s*0 0 120px/.test(landing) && /width:\s*120px/.test(landing), 'avatar com 120px');
check(!/backdrop-filter|blur\(/.test(landing), 'landing.css sem glassmorphism');
check(/\.lp-icon\s*\{[^}]*width:\s*1em/.test(landing) && !/Font Awesome|\\f121/.test(landing),
  'ícones SVG dimensionados por em, sem Font Awesome no CSS');
check(!existsSync(join(ROOT, 'resources/css/style.css')), 'style.css removido após a conversão das páginas');
check(!landing.includes('fontawesome') && !landing.includes('.fa-'), 'CSS sem dependência de Font Awesome');
for (const f of ['icone_rex_big.webp', 'rex_banner.webp', 'print_1.webp', 'print_2.webp', 'print_3.webp']) {
  check(existsSync(join(ROOT, 'article_imgs/rex', f)), `imagem WebP do REx existe — ${f}`);
}
check(existsSync(join(ROOT, 'article_imgs/face_detection_ui_wireframe.webp')),
  'wireframe WebP existe');

// ── páginas avulsas ──
console.log('\npáginas avulsas');
const subpages = readdirSync(ROOT).filter(f => f.endsWith('.html') && f !== 'index.html');
check(subpages.length === 14, `${subpages.length} páginas HTML na raiz além do index`);
for (const file of subpages) {
  const text = read(file);
  check(!text.includes('cdnjs.cloudflare.com'), `${file}: sem CDN externo`);
  check(!text.includes('fontawesome') && !/class="[^"]*\bfa[b-s]?\b/.test(text),
    `${file}: sem Font Awesome, ícones em SVG inline`);
  check(!/\/article_imgs\/rex\/[^"']+\.png|face_detection_ui_wireframe\.png/.test(text),
    `${file}: sem PNGs convertidos`);
  check(!/name="theme"|glass-panel|Glassmorphism|backdrop-filter/i.test(text), `${file}: sem tema nem glass`);
  if (text.includes('class="lp-logo"')) {
    check(text.includes('class="lp-logo">Pedro Conrad Jr</a>'), `${file}: logo sem ícone inline`);
  }
  // A 404 volta para "/" e "/en/", não para uma âncora de projeto.
  if (file !== '404.html') {
    check(text.includes('index.html#projects'), `${file}: link de volta aponta para #projects`);
  }
  if (file.endsWith('_privacy.html') || file === 'rex_info.html' || file === '404.html' || file.startsWith('article_')) {
    check(text.includes('/resources/css/landing.css'), `${file}: usa o CSS da landing`);
    check(text.includes('<header class="lp-header">'), `${file}: header replicado`);
    check(text.includes('<footer class="lp-footer">'), `${file}: rodapé replicado`);
    check(/class="lp-container lp-legal-panel(?: lp-rex-panel| lp-article| lp-error-panel)?"/.test(text),
      `${file}: conteúdo em painel`);
  }
  if (file.startsWith('article_')) {
    check(!/css\/style\.css|content-panel|class="logo"|logo-icon|code-window|Outfit|Space\+Grotesk|style="/.test(text),
      `${file}: sem vestígio do layout antigo`);
    check(text.includes('<p class="lp-eyebrow">Artigo</p>') && text.includes('<div class="lp-container lp-legal-panel lp-article">'),
      `${file}: título no hero e texto em painel de artigo`);
    check((text.match(/<pre><code>/g) ?? []).length === (text.match(/<\/code><\/pre>/g) ?? []).length,
      `${file}: blocos de código íntegros`);
  }
  if (file === '404.html') {
    check(!/error-page|error-code|btn btn-primary|Outfit|Space\+Grotesk|style="/.test(text),
      '404.html: sem vestígio do layout antigo');
    check(text.includes('lp-error-actions') && text.includes('lp-btn-primary') && text.includes('lp-btn-secondary'),
      '404.html: botões de volta no padrão da landing');
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
const sitemapUrls = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m => m[1]);
check(sitemapUrls.length === 7, `${sitemapUrls.length} URLs no sitemap (esperado 7)`);
check(sitemapUrls.filter(u => u.includes('xhtml:link')).length === 2,
  'hreflang apenas nas duas páginas principais');
check(sitemapUrls.filter(u => u.includes('<lastmod>')).length === 2,
  'lastmod apenas nas duas páginas com conteúdo versionado');
check(sitemapUrls.some(u => u.includes('hreflang="x-default"')), 'x-default declarado no sitemap');
check(existsSync(join(ROOT, '404.html')), '404.html existe');
check(existsSync(join(ROOT, 'resources/images/og-image.png')), 'og-image.png existe');
check(existsSync(join(ROOT, 'resources/images/og-image-en.png')), 'og-image-en.png existe');
check(!existsSync(join(ROOT, 'index_bak.html')) && !existsSync(join(ROOT, 'index_en_bak.html')), 'backups removidos');

console.log(failures ? `\n\u001b[31m${failures} falha(s)\u001b[0m\n` : '\n\u001b[32mtodos os checks passaram\u001b[0m\n');
process.exit(failures ? 1 : 0);
