/**
 * content.js — carrega o conteúdo de um idioma a partir de content/<lang>/*.json
 *
 * O layout é o diretório do idioma primeiro, com um arquivo por seção:
 *
 *   content/
 *     pt/
 *       meta.json  nav.json  hero.json  metrics.json  selectedWork.json
 *       experience.json  engineering.json  about.json  contact.json
 *       education.json  languages.json  resume.json
 *       work.json  writing.json  writingPreview.json  caseStudy.json
 *       ui.json                    rótulos soltos: tema, rodapé, modal
 *       catalog/                   um arquivo por grupo do catálogo
 *         mobile.json  web.json  other.json  videos.json
 *         technicalArticles.json  reflections.json  career.json  publications.json
 *       case-studies/              um arquivo por estudo (guri.json, …)
 *     en/                          mesma estrutura
 *
 * `loadContent` reagrupa tudo na MESMA forma em memória que os monolitos
 * tinham, então js/render.js não conhece o layout em disco. Quem muda a
 * organização dos arquivos mexe aqui e em LAYOUT — em nenhum outro lugar.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/** Seções com um arquivo próprio, mapeando chave de conteúdo → arquivo. */
const SECTIONS = [
  ['meta', 'meta.json'],
  ['nav', 'nav.json'],
  ['hero', 'hero.json'],
  ['metrics', 'metrics.json'],
  ['selectedWork', 'selectedWork.json'],
  ['experience', 'experience.json'],
  ['engineering', 'engineering.json'],
  ['about', 'about.json'],
  ['education', 'education.json'],
  ['languages', 'languages.json'],
  ['resume', 'resume.json'],
  ['contact', 'contact.json'],
  ['work', 'work.json'],
  ['writing', 'writing.json'],
  ['writingPreview', 'writingPreview.json'],
  ['caseStudy', 'caseStudy.json']
];

/** Rótulos soltos que não valem um arquivo só. */
const UI_FILE = 'ui.json';

/** Grupos do catálogo: cada um vira catalog/<grupo>.json. */
const CATALOG_DIR = 'catalog';

/**
 * Ordem dos grupos, explícita.
 *
 * Não usar a ordem de readdirSync: ela não é garantida e deixa o monólito com os
 * grupos em ordem alfabética, o que embaralha a leitura. Esta ordem é a que as
 * páginas usam de qualquer forma — render.js walks CATALOG[page].groups — e é a
 * que faz sentido para quem abre o arquivo.
 */
export const CATALOG_ORDER = [
  'mobile', 'web', 'other', 'videos',
  'technicalArticles', 'reflections', 'career', 'publications'
];

/** Subpasta dos case studies dentro do idioma. */
const CASE_DIR = 'case-studies';

const readJson = path => JSON.parse(readFileSync(path, 'utf8'));

/**
 * Conteúdo de um idioma, na mesma forma que os antigos monolitos.
 *
 * Ausência de diretório é erro: sem ele não há página nenhuma. Já um grupo do
 * catálogo ausente é tolerado, porque nem todo site usa todos.
 */
export function loadContent(root, lang) {
  const dir = join(root, 'content', lang);
  if (!existsSync(dir)) {
    throw new Error(`content/${lang}: diretório não encontrado — o layout exige content/<idioma>/*.json`);
  }

  const out = {};
  for (const [key, file] of SECTIONS) {
    const path = join(dir, file);
    if (!existsSync(path)) throw new Error(`content/${lang}/${file}: arquivo de seção ausente`);
    out[key] = readJson(path);
  }

  const uiPath = join(dir, UI_FILE);
  if (!existsSync(uiPath)) throw new Error(`content/${lang}/${UI_FILE}: arquivo de rótulos ausente`);
  Object.assign(out, readJson(uiPath));

  // Os grupos voltam aninhados em `projects`, que é como o renderizador os lê.
  const catalogDir = join(dir, CATALOG_DIR);
  out.projects = {};
  if (existsSync(catalogDir)) {
    const found = new Set(readdirSync(catalogDir).filter(f => f.endsWith('.json')).map(f => f.replace(/\.json$/, '')));
    for (const group of CATALOG_ORDER) {
      if (found.delete(group)) out.projects[group] = readJson(join(catalogDir, `${group}.json`));
    }
    // Grupo fora da ordem conhecida não se perde: entra no fim, e nenhum
    // check aponta que ele não é renderizado por página nenhuma.
    for (const group of [...found].sort()) {
      out.projects[group] = readJson(join(catalogDir, `${group}.json`));
    }
  }
  if (!Object.keys(out.projects).length) {
    throw new Error(`content/${lang}/${CATALOG_DIR}: nenhum grupo do catálogo`);
  }

  return out;
}

/**
 * Case studies de um idioma, ordenados. Diretório ausente é o estado normal
 * enquanto os estudos não forem escritos — devolve lista vazia, sem falhar.
 */
export function loadCaseStudies(root, lang) {
  const dir = join(root, 'content', lang, CASE_DIR);
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(file => {
      const cs = readJson(join(dir, file));
      // O slug precisa ser o nome do arquivo: URL, par de idiomas e hreflang
      // saem todos dele, e a divergência só apareceria no sitemap.
      if (cs.slug !== file.replace(/\.json$/, '')) {
        throw new Error(`content/${lang}/${CASE_DIR}/${file}: campo "slug" é "${cs.slug}" — precisa ser o nome do arquivo`);
      }
      return cs;
    })
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.slug.localeCompare(b.slug));
}

/** Nomes de todos os .json de um idioma, relativo ao diretório do idioma. */
export function contentFiles(root, lang) {
  const dir = join(root, 'content', lang);
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      for (const f of readdirSync(join(dir, entry.name)).filter(f => f.endsWith('.json'))) {
        out.push(`${entry.name}/${f}`);
      }
    } else if (entry.name.endsWith('.json')) {
      out.push(entry.name);
    }
  }
  return out.sort();
}

/** deepEqual sem dependência de ordem de chave — o layout em disco não a preserva. */
export function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (typeof a !== 'object') return false;

  const ka = Object.keys(a).sort();
  const kb = Object.keys(b).sort();
  if (ka.length !== kb.length || ka.some((k, i) => k !== kb[i])) return false;
  return ka.every(k => deepEqual(a[k], b[k]));
}

/** Primeira diferença entre dois objetos, para uma mensagem de check útil. */
export function firstDiff(a, b, path = '') {
  if (deepEqual(a, b)) return null;
  if (typeof a !== typeof b || a === null || b === null) return path || '$';
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return `${path} (array ${a.length} vs ${b.length})`;
    for (let i = 0; i < a.length; i++) {
      const d = firstDiff(a[i], b[i], `${path}[${i}]`);
      if (d) return d;
    }
    return null;
  }
  if (typeof a === 'object' && typeof b === 'object') {
    for (const k of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
      const d = firstDiff(a[k], b[k], path ? `${path}.${k}` : k);
      if (d) return d;
    }
    return null;
  }
  return path || '$';
}