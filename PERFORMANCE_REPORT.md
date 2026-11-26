# PERFORMANCE_REPORT.md — Lighthouse do portfólio

**Data da medição:** 2026-11-26
**Commit analisado:** `52e3f53` (`Remove ItemList de artigos do JSON-LD`) — árvore limpa
**Alvo:** `https://pconradjunior.github.io/` (GitHub Pages, já publicado)
**Ferramenta:** Lighthouse `13.6.0` via `npx --yes lighthouse` + Google Chrome `158.0.8127.37`
**Finalidade:** diagnóstico e backlog para continuação. **Nenhum código foi alterado** e **nenhuma dependência foi adicionada** ao `package.json`.

> Linhas de código abaixo se referem ao commit `52e3f53`. Reconferir após qualquer alteração.

---

## 1. Como reproduzir

```bash
# Não instala nada no projeto (pacote fica só no cache do npx)
export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
export OUT="/private/var/folders/11/z84560sj5c3byrvspv9wv_z00000gn/T/opencode/portfolio-lighthouse"
mkdir -p "$OUT"

# Mobile (perfil padrão) — PT
npx --yes lighthouse https://pconradjunior.github.io/ \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json --output=html --output-path="$OUT/mobile" \
  --chrome-flags="--headless=new --no-sandbox" --quiet

# Mobile — EN
npx --yes lighthouse https://pconradjunior.github.io/en/ \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json --output-path="$OUT/en-mobile.json" \
  --chrome-flags="--headless=new --no-sandbox" --quiet

# Desktop — PT (repetir 2x; o resultado varia por ruído de long task)
npx --yes lighthouse https://pconradjunior.github.io/ \
  --only-categories=performance,accessibility,best-practices,seo \
  --preset=desktop \
  --output=json --output=html --output-path="$OUT/desktop" \
  --chrome-flags="--headless=new --no-sandbox" --quiet
```

**Relatórios brutos** (diretório temporário da sessão — se não existir mais, refaça os comandos acima):
- `$OUT/desktop.report.html`, `$OUT/mobile.report.html`
- `$OUT/desktop.report.json`, `$OUT/desktop2.json`, `$OUT/mobile.report.json`, `$OUT/en-mobile.json`
- Scripts de apoio: `$OUT/summary.mjs`, `$OUT/details.mjs`

---

## 2. Resultados

| Cenário | Performance | Acessibilidade | Boas práticas | SEO |
|---|---:|---:|---:|---:|
| `/` — mobile | **99** | 91 | 100 | 100 |
| `/en/` — mobile | **99** | 91 | 100 | 100 |
| `/` — desktop | **99**¹ | 91 | 100 | 100 |

¹ Primeira execução desktop marcou **92** por uma *long task* atípica de 391 ms classificada como "Unattributable" (mais 62 ms da página; 218 ms de *Style & Layout*). A repetição zerou o TBT e voltou a 99. Tratar como ruído, não como regressão.

### Core Web Vitals e métricas auxiliares

| Métrica | Mobile PT | Mobile EN | Desktop (2ª execução) |
|---|---:|---:|---:|
| FCP | 1,7 s | 1,8 s | 0,7 s |
| LCP | 1,7 s | 1,8 s | 0,7 s |
| TBT | 0 ms | 0 ms | 0 ms |
| CLS | 0 | 0 | 0,062 |
| Speed Index | 1,7 s | — | 1,2 s (1ª exec.) |
| TTI | 1,7 s | — | 0,8 s (1ª exec.) |

**Elemento LCP:** `<h1>` do hero — ou seja, texto, não imagem. Isso explica o LCP baixo mesmo com a foto grande fora da dobra.

**Peso/requisições:** 11 requests, 2 scripts, 2 stylesheets, 2 fontes, ~478 KiB no total. `images/profile.png` sozinho responde por ~365 KiB (~76%).

**Interpretação:** performance já está excelente (99, Core Web Vitals no verde). Os ganhos restantes são de transferência/repetição e de acessibilidade, não de tempo de interação.

> Não há meta de performance formal no TAP (`docs/03-TAP.md`). Lighthouse ≥ 90 foi usado como referência interna de diagnóstico, **não como gate autorizado**.

---

## 3. Backlog — o que precisamos fazer

Ordem: **P1 → P3 (concluídos em 26/11) → P2 (pendente) → decisão sobre P4 → revalidar no publicado → publicar somente após aprovação final** (TAP, item 7).

### [x] P1 — Otimizar `images/profile.png` (maior retorno) — CONCLUÍDO

**Status 26/11:** `images/profile.webp` criado a partir do PNG original (320×320, `cwebp -q 82`), **9,4 KiB no disco / 9,6 KiB transferidos** (antes: 356 KiB / ~365 KiB). `about.avatar` atualizado em `content/pt.json` e `content/en.json`; PNG original mantido como fonte. `npm run check` passou, inclusive o invariante "arquivo do avatar existe — /images/profile.webp".

**Evidência:** PNG RGBA de 460×460 px, 356 KiB no disco / ~365 KiB transferidos. Exibido a 120 px no avatar (`.lp-avatar`, CSS `landing.css:509`; atributo HTML `width/height=112`) e 160 px no diálogo (`.lp-profile-photo`, `landing.css:941`; 120 px no mobile, `landing.css:1573`). Lighthouse `image-delivery-insight`: **economia estimada de ~350 KiB** (354 KiB desktop / 350 KiB mobile).

**Ação:**
1. Gerar `images/profile.webp` (ou AVIF) a partir do original, com ~320 px (2× o maior uso em CSS) e manter o PNG como fallback se desejar compatibilidade.
2. Atualizar `about.avatar` em `content/pt.json:223` e `content/en.json:223`.
3. Se usar `<picture>`, alterar os dois pontos de renderização em `js/render.js:243` (foto do diálogo) e `js/render.js:333` (avatar). Manter `width`/`height` explícitos.
4. `npm run build` (regera `index.html` e `en/index.html`) e `npm run check`.
5. **Não editar `index.html`/`en/index.html` diretamente** — são gerados; a fonte é `content/*.json` + `js/render.js`.

**Critério de aceite:** payload da imagem < 40 KiB; `npm run check` sem falhas; LCP/CLS inalterados ou melhores; aparência idêntica nas duas resoluções.

---

### [x] P3 — Corrigir os 4 achados de acessibilidade (score 91 → 100) — CONCLUÍDO

**Status 26/11:** os quatro ajustes abaixo foram aplicados. Lighthouse local: **accessibility 100 em `/` e `/en/`** (antes: 91 nas duas). `npm run check` passou integralmente nas duas rotas e na paridade PT/EN.

- **a)** `--cyan-text: #0E7490` adicionado em `css/landing.css:18`; `.lp-entry-meta` passou a usá-lo (`landing.css:681`). `--cyan` permanece para bordas/acentos.
- **b)** `renderLinks` em `js/render.js` não emite mais `aria-label` a partir de `l.title`; o `title` (tooltip) foi preservado e o nome acessível passou a ser o texto visível.
- **c)** `.lp-typed-meta a { text-decoration: underline; text-underline-offset: 2px; }` em `css/landing.css:767`.
- **d)** badge de visitas em `js/render.js` agora tem `width="88" height="20"` (SVG remoto é 87,6×20).

**a) 25 falhas de contraste em `.lp-entry-meta`**
- `css/landing.css:678` usa `color: var(--cyan)`; `--cyan: #06B6D4` (`landing.css:17`) sobre `--surface: #FFFFFF` dá **2,43:1** (mínimo 4,5:1 para texto small/bold de 0,88 rem).
- Afeta os 25 `<p class="lp-entry-meta">` e `<time>` das formações/experiências (`js/render.js:377`, `js/render.js:387`).
- **Ação:** criar `--cyan-text: #0E7490` (**5,36:1** no branco) e usar apenas em texto sobre superfície clara, preservando `--cyan` para bordas/acentos. Alternativas measure: `#155E75` (7,27:1), `#0369A1` (5,93:1), `--blue: #1D4ED8` (6,70:1).

**b) 3 `aria-label` divergentes do texto visível**
- `js/render.js:150-158` (`renderLinks`) aplica `aria-label="${l.title}"` onde o texto visível é `l.label`.
- Casos: "Ver demo" × "Ver demonstração do App Unipampa" / "Ver demonstração do ChessKids" (`content/pt.json:74-80`, `content/pt.json:118-124`); "Ver projeto" × "Página do REx" (`content/pt.json:148-156`). Equivalentes em `content/en.json`.
- **Ação:** remover o `aria-label` quando `title` existir (manter apenas `title` como tooltip) ou fazer o nome acessível começar pelo texto visível, ex.: `aria-label="Ver demo — App Unipampa"`. Conferir invariantes em `tools/check-build.mjs`.

**c) 3 links distinguidos apenas por cor**
- `js/render.js:199` (`renderPubItem`) gera `<a>` dentro de `<span class="lp-typed-meta">`; `css/landing.css:761` não aplica sublinhado.
- Links afetados: 3 registros do repositório WTICIFES nas publicações (`index.html:311`, `:315`, `:319`; mesmos em `en/index.html`).
- **Ação:** `text-decoration: underline` (com `text-underline-offset`) em `.lp-typed-meta a` perto de `landing.css:761`.

**d) `<img>` do badge sem dimensões**
- `js/render.js:453` gera o badge de visitas sem `width`/`height`; no audit o `src` apareceu vazio (recurso externo bloqueado/falho no headless).
- O SVG remoto tem `width="87.6" height="20"`.
- **Ação:** adicionar `width="88" height="20"` ao `<img>` em `render.js:453`. URL configurada em `content/pt.json:511` / `en.json:511`.

**Critério de aceite:** `npm run check` sem falhas; Lighthouse accessibility ≥ 98 nas duas rotas; navegação por teclado/leitor de tela preservada nos `<details>` e diálogos; contraste verificado também no EN.

---

### [ ] P2 — Reduzir bloqueio de renderização das fontes

**Evidência:** `js/render.js:648-651` (e as mesmas linhas 12-14 em todas as páginas estáticas) carrega `fonts.googleapis.com/css2?family=Inter...&family=Sora...&display=swap`. Lighthouse `render-blocking-insight`: **~870 ms no mobile** e ~220 ms no desktop (CSS de apenas 1,3 kB). Duas woff2 são baixadas: Inter ~48 kB e Sora ~25 kB (~73 kB no total).

**Ação (decidir escopo antes):**
1. Baixar as duas woff2 usadas (latin) para `fonts/`, declarar `@font-face` com `font-display: swap` no próprio `css/landing.css`.
2. Fazer `preload` dos dois arquivos em `js/render.js` — e remover `preconnect` a `fonts.googleapis.com` / `fonts.gstatic.com` se não houver mais requisição externa.
3. **Decisão de escopo:** aplicar somente nas páginas geradas (`index.html`, `en/index.html`) ou replicar nas ~15 páginas auxiliares que repetem o mesmo `<link>`? O TAP marca "novas dependências ou refatorações amplas" como fora de escopo; self-host não é dependência nova, mas tocar todas as páginas amplia a mudança.

**Critério de aceite:** nenhuma requisição a `fonts.googleapis.com`/`fonts.gstatic.com`; render-blocking < 100 ms no mobile; FCP/LCP não piorarem; tipografia idêntica.

---

### [ ] P4 — Cache (contexto, provavelmente sem ação)

- GitHub Pages responde os estáticos com `max-age=600` (10 min). Lighthouse `cache-insight` estima **~344 KiB reaproveitados em visitas repetidas**, quase todo proveniente de `profile.png`.
- Isso **não é configurável pelo repositório**. Só muda com CDN/domínio próprio ou service worker.
- **Ação:** registrar como limitação da plataforma; reavaliar depois do P1 (quando a imagem cair de ~356 KiB para < 40 KiB, o impacto residual vira insignificante). Não abrir trabalho sem decisão explícita.

---

### [x] P5 — Revalidação ao final — CONCLUÍDO

**Status 26/11:** commit `97d4b14` enviado para `origin/main`, GitHub Pages propagado (200 em `/images/profile.webp`), 4 auditorias finais no site público — tabela completa na seção 6. Acessibilidade 100 em todas; nenhuma regressão de LCP/CLS/TBT. `desktop` variou 98/99 como esperado; `mobile PT` marcou 97 numa execução com FCP/LCP 1,9 s (ruído de medição, TBT 0 e CLS 0).

1. `npm run build && npm run check` (equivalente a `npm run check`).
2. Repetir os 4 comandos da seção 1 **no site publicado** (após deploy) — não medir apenas local, para não comparar cache/headers diferentes.
3. Conferir as 4 rotas/estados: `/` PT mobile, `/en/` mobile, `/` desktop (2 execuções).
4. Atualizar este arquivo com a nova tabela de scores e datas; mover itens concluídos para uma seção "Histórico".
5. Indicadores do processo: **não medidos** (sem estimativa MESPro autorizada para esta demanda de diagnóstico) — não preencher com zero.

---

## 4. Restrições e decisões pendentes

| Item | Situação |
|---|---|
| Publicar/commitar | Usuário autorizou em 26/11. Commit `97d4b14` (`Otimiza imagem de perfil e corrige acessibilidade da landing`) enviado para `origin/main` e publicado no GitHub Pages. Sem coautoria de IA. |
| Fonte única de conteúdo | `content/pt.json`, `content/en.json` + `js/render.js`. HTML gerado não deve ser editado à mão. |
| Invariantes | `tools/check-build.mjs` valida estrutura (inclusive botão `lp-avatar-button`, seções, headings). Rodar `npm run check` após qualquer mudança de markup. |
| Escopo do TAP | Mudanças pontuais e preservação de arquitetura/URLs/PT-EN. Self-host de fontes (P2) e service worker (P4) precisam de decisão de escopo antes de executar. |
| Questionário do briefing | Data-alvo de início e orçamento seguem "não informados" no TAP; não foram presumidos aqui. |

---

## 5. Resumo executivo

- **Já está bom:** 99 de performance, LCP 1,7 s no mobile, CLS 0, TBT 0, SEO e boas práticas 100.
- **Concluído (P1):** `images/profile.png` (356 KiB) → `images/profile.webp` (9,4 KiB). Economia real de ~347 KiB no payload da imagem.
- **Concluído (P3):** acessibilidade 91 → **100** nas duas rotas.
- **Pendente (P2):** self-host das fontes (remove bloqueio de ~870 ms no mobile, mas exige decisão de escopo).
- **Não fazer sem decisão (P4):** mexer em cache do GitHub Pages.
- **Publicado em 26/11:** commit `97d4b14` no ar. P5 concluído: acessibilidade 100 nas 4 execuções públicas; performance 97–99 (variação de medição).

---

## 6. Registro de execução — 2026-11-26

### Arquivos alterados (locais, sem commit)

| Arquivo | Mudança |
|---|---|
| `images/profile.webp` | Novo. WebP 320×320, `cwebp -resize 320 320 -q 82`, 9.640 bytes. PNG original mantido. |
| `content/pt.json` | `about.avatar` → `/images/profile.webp` |
| `content/en.json` | `about.avatar` → `/images/profile.webp` |
| `js/render.js` | `renderLinks`: sem `aria-label` derivado de `title`; badge com `width/height` |
| `css/landing.css` | `--cyan-text`, `.lp-entry-meta`, `.lp-typed-meta a` |
| `index.html`, `en/index.html` | Regenerados por `npm run build` (não editados à mão) |
| `PERFORMANCE_REPORT.md` | Atualizado com status e resultados |

### Validação

1. `npm run check` — **todos os checks passaram** (PT, EN, paridade, CSS, páginas avulsas, raiz), incluindo `arquivo do avatar existe — /images/profile.webp` e `contador de visitas presente no footer`.
2. Lighthouse 13.6.0 em servidor local (`python3 -m http.server 8000 --bind 127.0.0.1`), mobile, Chrome 158:

| Rota | Perf | A11y | Boas práticas | SEO | FCP | LCP | TBT | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` (local) | 99 | **100** | 100 | 100 | 1,8 s | 1,8 s | 0 ms | 0 |
| `/en/` (local) | 99 | **100** | 100 | 100 | 1,7 s | 1,7 s | 0 ms | 0 |

3. Relatórios: `$OUT/local-pt.report.html`, `$OUT/local-pt.report.json`, `$OUT/local-en.json` (mesmo `$OUT` da seção 1).
4. **Ressalva:** o servidor Python local não comprime texto. Por isso o "total byte weight" local (302 KiB PT / 296 KiB EN) não é comparável aos 478 KiB medidos no GitHub Pages (com gzip). A comparação válida é a da imagem: **356,7 KiB → 9,6 KiB**. A medição definitiva de payload e cache deve ser feita após o deploy (P5).
5. Auditorias ainda em score < 1 no local (`unminified-css/js`, `unused-css/js`, `cache-insight`, `render-blocking-insight`) são as mesmas do diagnóstico original; `render-blocking` é o item P2, adiado por decisão de escopo.

### Publicação e revalidação final (P5)

- Usuário autorizou a publicação em 26/11. Commit `97d4b14` — `Otimiza imagem de perfil e corrige acessibilidade da landing` — enviado para `origin/main`, **sem coautoria de IA**.
- CI `.github/workflows/build.yml` disparou pelos paths `content/**`, `css/**`, `js/**`; HTML já estava sincronizado, então o job de build não precisou gerar novo commit.
- GitHub Pages confirmado: `GET /images/profile.webp` → **200, 9.640 bytes**; HTML e CSS públicos contêm `profile.webp` e `--cyan-text`.
- Lighthouse 13.6.0 no **site público**, após propagação:

| Rota / perfil | Perf | A11y | Boas práticas | SEO | FCP | LCP | TBT | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` mobile | 97 | **100** | 100 | 100 | 1,9 s | 1,9 s | 0 ms | 0 |
| `/en/` mobile | 99 | **100** | 100 | 100 | 1,7 s | 1,7 s | 0 ms | 0 |
| `/` desktop (exec. 1) | 98 | **100** | 100 | 100 | 0,8 s | 0,8 s | 0 ms | 0,062 |
| `/` desktop (exec. 2) | 99 | **100** | 100 | 100 | 0,6 s | 0,6 s | 0 ms | 0,062 |

- `profile.webp` aparece com **9,6 KiB transferidos** nas 4 auditorias públicas (antes: 356,7 KiB).
- A execução mobile PT a 97 teve FCP/LCP 1,9 s contra 1,7 s da baseline; TBT 0 e CLS 0 permaneceram. Variação dentro do ruído do Lighthouse, sem regressão estrutural.
- Relatórios finais: `$OUT/pub-pt.report.html`, `$OUT/pub-pt.report.json`, `$OUT/pub-en.json`, `$OUT/pub-desktop.json`, `$OUT/pub-desktop2.json`.
