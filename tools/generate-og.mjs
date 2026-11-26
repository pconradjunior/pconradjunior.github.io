/**
 * generate-og.mjs — gera as imagens Open Graph (1200×630) em PT e EN.
 *
 *   CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
 *     node tools/generate-og.mjs
 *
 * Os textos e as métricas vêm de resources/content/{pt,en}.json. As fontes
 * são as mesmas self-hosted do site, embutidas como data URL no HTML temporal
 * rasterizado pelo Chrome. Sem dependências npm.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { esc, fill } from '../resources/js/render.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = join(ROOT, 'resources', 'images');
const WIDTH = 1200;
const HEIGHT = 630;

const COPY = {
  pt: { eyebrow: 'PORTFÓLIO · DESENVOLVIMENTO DE SOFTWARE', tag: 'PT-BR', breakBefore: 'por pessoas' },
  en: { eyebrow: 'PORTFOLIO · SOFTWARE DEVELOPMENT', tag: 'EN', breakBefore: 'for people' }
};

/** Quebra o título do hero no ponto que equilibra as duas linhas. */
function headline(title, lang) {
  const marker = ` ${COPY[lang].breakBefore}`;
  const i = title.indexOf(marker);
  if (i < 0) return esc(title);
  return `${esc(title.slice(0, i))}<br>${esc(COPY[lang].breakBefore)}${esc(title.slice(i + marker.length))}`;
}

/** Fonte self-hosted embutida, para o Chrome não depender de rede. */
function embeddedFont(file) {
  const bytes = readFileSync(join(ROOT, 'resources', 'fonts', file)).toString('base64');
  return `data:font/woff2;base64,${bytes}`;
}

function template(d, lang) {
  const c = COPY[lang];
  const stats = d.stats
    .map(s => `<div class="stat"><strong>${esc(fill(s.number, d))}</strong><span>${esc(s.label)}</span></div>`)
    .join('');

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<style>
@font-face{font-family:'Inter';font-style:normal;font-weight:400 700;font-display:block;src:url('${embeddedFont('inter-latin.woff2')}') format('woff2')}
@font-face{font-family:'Sora';font-style:normal;font-weight:400 700;font-display:block;src:url('${embeddedFont('sora-latin.woff2')}') format('woff2')}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden}
body{position:relative;background:linear-gradient(135deg,#0B1F3A 0%,#07182E 60%,#061527 100%);color:#F8FAFC;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}
body::before{content:'';position:absolute;top:-220px;right:-160px;width:760px;height:760px;border-radius:50%;background:radial-gradient(circle,rgba(6,182,212,.20) 0%,rgba(29,78,216,.10) 42%,transparent 70%)}
body::after{content:'';position:absolute;left:0;top:0;bottom:0;width:8px;background:linear-gradient(180deg,#1D4ED8 0%,#06B6D4 100%)}
.wrap{position:relative;z-index:1;height:100%;padding:70px 80px 52px 88px;display:flex;flex-direction:column}
header{display:flex;align-items:center;gap:14px}
header svg{width:34px;height:34px;flex:none}
.brand{font-family:'Sora',sans-serif;font-size:23px;font-weight:600;letter-spacing:-.02em}
.tag{margin-left:6px;padding:5px 12px;border:1px solid rgba(103,232,249,.55);border-radius:999px;color:#67E8F9;font-size:13px;font-weight:600;letter-spacing:.12em}
main{margin-top:78px}
.eyebrow{color:#67E8F9;font-size:17px;font-weight:600;letter-spacing:.22em}
h1{margin-top:24px;font-family:'Sora',sans-serif;font-size:58px;font-weight:700;line-height:1.15;letter-spacing:-.035em;max-width:1010px}
.sub{margin-top:26px;color:#CBD5E1;font-size:25px;font-weight:400;line-height:1.35;max-width:960px}
footer{margin-top:auto;padding-top:24px;border-top:1px solid rgba(255,255,255,.15);display:flex;align-items:flex-end;justify-content:space-between;gap:40px}
.stats{display:flex;gap:56px}
.stat{display:flex;flex-direction:column;gap:5px}
.stat strong{font-family:'Sora',sans-serif;font-size:32px;font-weight:700;line-height:1;color:#FFFFFF}
.stat span{font-size:15px;color:#94A3B8;white-space:nowrap}
.domain{color:#94A3B8;font-size:15px;font-weight:500;white-space:nowrap}
.domain b{color:#22D3EE;font-weight:600}
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="38" height="38" rx="11" fill="#1D4ED8"/>
        <path d="M10 27V13h9a5.5 5.5 0 0 1 0 11h-5v3h-4Zm4-7h5a1.5 1.5 0 0 0 0-3h-5v3Z" fill="#FFFFFF"/>
        <circle cx="29" cy="12" r="3" fill="#22D3EE"/>
      </svg>
      <span class="brand">Pedro Conrad Jr</span>
      <span class="tag">${c.tag}</span>
    </header>
    <main>
      <p class="eyebrow">${esc(c.eyebrow)}</p>
      <h1>${headline(d.hero.title, lang)}</h1>
      <p class="sub">${esc(d.hero.role)}</p>
    </main>
    <footer>
      <div class="stats">${stats}</div>
      <div class="domain"><b>pconradjunior</b>.github.io</div>
    </footer>
  </div>
</body>
</html>
`;
}

mkdirSync(OUT, { recursive: true });
const temp = join(tmpdir(), `portfolio-og-${process.pid}`);
mkdirSync(temp, { recursive: true });

for (const [lang, file] of [['pt', 'og-image.png'], ['en', 'og-image-en.png']]) {
  const d = JSON.parse(readFileSync(join(ROOT, 'resources', 'content', `${lang}.json`), 'utf8'));
  const source = join(temp, `${lang}.html`);
  const target = join(OUT, file);
  writeFileSync(source, template(d, lang), 'utf8');

  execFileSync(CHROME, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--virtual-time-budget=3000',
    `--window-size=${WIDTH},${HEIGHT}`,
    `--screenshot=${target}`,
    `file://${source}`
  ], { stdio: 'ignore' });

  const png = readFileSync(target);
  const w = png.readUInt32BE(16);
  const h = png.readUInt32BE(20);
  if (w !== WIDTH || h !== HEIGHT) throw new Error(`${file}: esperado ${WIDTH}x${HEIGHT}, obtido ${w}x${h}`);
  console.log(`  ${file}  ${w}x${h}  ${(png.length / 1024).toFixed(1)} KiB`);
}

console.log('\nog images ok');
