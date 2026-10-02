/**
 * sync-monoliths.mjs — reescreve content/{pt,en}.json a partir de
 * content/<idioma>/*.json
 *
 *   node tools/sync-monoliths.mjs
 *
 * Os monólitos foram preservados quando o conteúdo passou a ser um arquivo por
 * seção, mas o build não os lê. Editá-los à mão cria duas verdades; este script
 * regenera os dois a partir dos arquivos de seção, e o check de paridade
 * reprova se alguém mexer no monólito sem rodar o script.
 *
 * Use-o quando quiser os monólitos — e só para isso. A fonte é o layout por
 * seção. Apagar os monólitos também é uma opção válida: o check de paridade
 * passa a dizer "removido" e nada mais depende deles.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadContent } from '../js/content.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

/**
 * Ordem das chaves no monólito. Só afeta a legibilidade do arquivo — quem lê
 * é o JSON, e a comparação do check não depende de ordem.
 */
const ORDER = [
  'meta', 'nav', 'themeSwitcherTitle', 'hero', 'metrics', 'selectedWork',
  'experience', 'engineering', 'about', 'contact', 'caseStudy', 'projects',
  'writing', 'writingPreview', 'footer', 'infoModal', 'work'
];

for (const lang of ['pt', 'en']) {
  const content = loadContent(ROOT, lang);

  const ordered = {};
  for (const key of ORDER) if (key in content) ordered[key] = content[key];
  for (const key of Object.keys(content)) if (!(key in ordered)) ordered[key] = content[key];

  const out = join(ROOT, 'content', `${lang}.json`);
  writeFileSync(out, JSON.stringify(ordered, null, 4) + '\n');
  console.log(`  content/${lang}.json  ${Object.keys(ordered).length} chaves de topo`);
}