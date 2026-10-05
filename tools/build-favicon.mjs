/**
 * Gera o favicon do site a partir da marca `< />` que aparece no header ao lado
 * do nome, com as mesmas cores (fundo escuro do tema + acento).
 *
 * Escreve duas saídas:
 *
 *   images/favicon.svg  fonte de verdade, nitida em qualquer tamanho
 *   favicon.ico        na raiz, para quem pede o caminho padrao
 *
 * O .ico na raiz resolve o 404 das paginas avulsas: elas nao declaram
 * <link rel="icon">, entao o navegador pedia /favicon.ico e nao havia nada.
 *
 * Dependencia: ImageMagick (`magick`). Sem ele, o SVG ainda e escrito e o
 * script avisa que o .ico ficou para tras.
 *
 * Uso: node tools/build-favicon.mjs
 *      tools/check-build.mjs avisa quando o .ico desatualiza em relacao ao SVG.
 */
import { writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SVG_PATH = join(ROOT, 'images', 'favicon.svg');
const ICO_PATH = join(ROOT, 'favicon.ico');

/** Marca do site: os caracteres `< />`.
 *
 * Desenhados como traçado, e não como <text> com font-family. Um SVG de
 * favicon é renderizado pelo navegador de quem visita, com as fontes daquela
 * máquina: escrevesse o texto, o icone mudaria de forma conforme o sistema e
 * a largura da fonte. Traçado é o mesmo em todo lugar, e nao depende de o
 * cliente ter nenhuma fonte instalada. */
const MARK_PATH = [
  /* < */ 'M216 126 L140 256 L216 386',
  /* / */ 'M278 126 L234 386',
  /* > */ 'M296 126 L372 256 L296 386',
].join(' ');
const STROKE = 34;

/* Par de cores do header no tema padrao. O acento (#00f2ff) e claro demais
   para servir de fundo com glifo branco, entao o glifo e o acento sobre o
   fundo escuro do tema. Um quadrado escuro continua legivel tanto em aba
   clara quanto em aba escura, que e o que um favicon precisa aguentar. */
const BG = '#0a0a0c';
const FG = '#00f2ff';

/* A marca ocupa 232 x 260 no meio do quadrado: sobra de 126px na horizontal e
   140px na vertical, o que mantem as pontas dos tracos longe do canto
   arredondado. O traco tem 34px de espessura — 1.06px num icone de 16px, o
   menor tamanho que o navegador costuma exibir, onde um traco mais fino
   sumiria entre pixels. */
const CANVAS = 512;
const RADIUS = Math.round(CANVAS * 0.19);

/* 16/32/48 sao os tamanhos que o navegador realmente exibe numa barra de
   abas; 256 entra como PNG para telas HiDPI. Acima disso, quem precisa de
   nitidez usa o SVG — e cada entrada BMP cresce com o quadrado do tamanho:
   manter 64 e 128 custava +85 kB de um arquivo que ninguem consome assim. */
export const ICO_SIZES = [16, 32, 48, 256];

export function buildSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}" width="${CANVAS}" height="${CANVAS}" role="img" aria-label="Pedro Conrad Jr">
  <!-- Gerado por tools/build-favicon.mjs. Marca < /> traçada como vetor. -->
  <rect width="${CANVAS}" height="${CANVAS}" rx="${RADIUS}" fill="${BG}"/>
  <path d="${MARK_PATH}" fill="none" stroke="${FG}" stroke-width="${STROKE}" stroke-linecap="butt" stroke-linejoin="round"/>
</svg>
`;
}

function magickAvailable() {
  try {
    execFileSync('magick', ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
export { magickAvailable };

/** Empacota o SVG em um .ico multirresolucao. Aceita destinos alternativos:
 *  check-build regera em arquivo temporário para comparar com o que está
 *  commitado. */
export function writeIco({ svgPath = SVG_PATH, icoPath = ICO_PATH } = {}) {
  if (!magickAvailable()) return false;
  execFileSync(
    'magick',
    [
      '-background', 'none',
      svgPath,
      '-define', `icon:auto-resize=${ICO_SIZES.join(',')}`,
      icoPath,
    ],
    { stdio: 'pipe' },
  );
  return true;
}

function main() {
  writeFileSync(SVG_PATH, buildSvg());
  console.log(`  ${SVG_PATH.replace(`${ROOT}/`, '')}`);

  if (writeIco()) {
    console.log(`  favicon.ico (${ICO_SIZES.join(', ')})`);
  } else {
    console.warn('  magick nao encontrado: favicon.ico nao foi gerado (o SVG foi)');
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();

export { SVG_PATH, ICO_PATH };
