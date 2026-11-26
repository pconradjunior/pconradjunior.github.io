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

**Peso/requisições:** 11 requests, 2 scripts, 2 stylesheets, 2 fontes, ~478 KiB no total. `resources/images/profile.png` sozinho responde por ~365 KiB (~76%).

**Interpretação:** performance já está excelente (99, Core Web Vitals no verde). Os ganhos restantes são de transferência/repetição e de acessibilidade, não de tempo de interação.

> Não há meta de performance formal no TAP (`docs/03-TAP.md`). Lighthouse ≥ 90 foi usado como referência interna de diagnóstico, **não como gate autorizado**.

---

## 3. Backlog — o que precisamos fazer

Ordem executada: **P1 → P3 → P2 → P4 (encerrado como limitação) → P5 → rodada 2 (reorganização em `resources/`, Font Awesome local e og-images PT/EN) → rodada 3 (WebP, SVG inline e acessibilidade; ver §8)**. Tudo concluído, publicado e revalidado no site público (TAP, item 7 atendido), inclusive a rodada 3 (§8).

### [x] P1 — Otimizar `resources/images/profile.png` (maior retorno) — CONCLUÍDO

**Status 26/11:** `resources/images/profile.webp` criado a partir do PNG original (320×320, `cwebp -q 82`), **9,4 KiB no disco / 9,6 KiB transferidos** (antes: 356 KiB / ~365 KiB). `about.avatar` atualizado em `resources/content/pt.json` e `resources/content/en.json`; PNG original mantido como fonte. `npm run check` passou, inclusive o invariante "arquivo do avatar existe — /resources/images/profile.webp".

**Evidência:** PNG RGBA de 460×460 px, 356 KiB no disco / ~365 KiB transferidos. Exibido a 120 px no avatar (`.lp-avatar`, CSS `landing.css:509`; atributo HTML `width/height=112`) e 160 px no diálogo (`.lp-profile-photo`, `landing.css:941`; 120 px no mobile, `landing.css:1573`). Lighthouse `image-delivery-insight`: **economia estimada de ~350 KiB** (354 KiB desktop / 350 KiB mobile).

**Ação:**
1. Gerar `resources/images/profile.webp` (ou AVIF) a partir do original, com ~320 px (2× o maior uso em CSS) e manter o PNG como fallback se desejar compatibilidade.
2. Atualizar `about.avatar` em `resources/content/pt.json:223` e `resources/content/en.json:223`.
3. Se usar `<picture>`, alterar os dois pontos de renderização em `resources/js/render.js:243` (foto do diálogo) e `resources/js/render.js:333` (avatar). Manter `width`/`height` explícitos.
4. `npm run build` (regera `index.html` e `en/index.html`) e `npm run check`.
5. **Não editar `index.html`/`en/index.html` diretamente** — são gerados; a fonte é `resources/content/*.json` + `resources/js/render.js`.

**Critério de aceite:** payload da imagem < 40 KiB; `npm run check` sem falhas; LCP/CLS inalterados ou melhores; aparência idêntica nas duas resoluções.

---

### [x] P3 — Corrigir os 4 achados de acessibilidade (score 91 → 100) — CONCLUÍDO

**Status 26/11:** os quatro ajustes abaixo foram aplicados. Lighthouse local: **accessibility 100 em `/` e `/en/`** (antes: 91 nas duas). `npm run check` passou integralmente nas duas rotas e na paridade PT/EN.

- **a)** `--cyan-text: #0E7490` adicionado em `resources/css/landing.css:18`; `.lp-entry-meta` passou a usá-lo (`landing.css:681`). `--cyan` permanece para bordas/acentos.
- **b)** `renderLinks` em `resources/js/render.js` não emite mais `aria-label` a partir de `l.title`; o `title` (tooltip) foi preservado e o nome acessível passou a ser o texto visível.
- **c)** `.lp-typed-meta a { text-decoration: underline; text-underline-offset: 2px; }` em `resources/css/landing.css:767`.
- **d)** badge de visitas em `resources/js/render.js` agora tem `width="88" height="20"` (SVG remoto é 87,6×20).

**a) 25 falhas de contraste em `.lp-entry-meta`**
- `resources/css/landing.css:678` usa `color: var(--cyan)`; `--cyan: #06B6D4` (`landing.css:17`) sobre `--surface: #FFFFFF` dá **2,43:1** (mínimo 4,5:1 para texto small/bold de 0,88 rem).
- Afeta os 25 `<p class="lp-entry-meta">` e `<time>` das formações/experiências (`resources/js/render.js:377`, `resources/js/render.js:387`).
- **Ação:** criar `--cyan-text: #0E7490` (**5,36:1** no branco) e usar apenas em texto sobre superfície clara, preservando `--cyan` para bordas/acentos. Alternativas measure: `#155E75` (7,27:1), `#0369A1` (5,93:1), `--blue: #1D4ED8` (6,70:1).

**b) 3 `aria-label` divergentes do texto visível**
- `resources/js/render.js:150-158` (`renderLinks`) aplica `aria-label="${l.title}"` onde o texto visível é `l.label`.
- Casos: "Ver demo" × "Ver demonstração do App Unipampa" / "Ver demonstração do ChessKids" (`resources/content/pt.json:74-80`, `resources/content/pt.json:118-124`); "Ver projeto" × "Página do REx" (`resources/content/pt.json:148-156`). Equivalentes em `resources/content/en.json`.
- **Ação:** remover o `aria-label` quando `title` existir (manter apenas `title` como tooltip) ou fazer o nome acessível começar pelo texto visível, ex.: `aria-label="Ver demo — App Unipampa"`. Conferir invariantes em `tools/check-build.mjs`.

**c) 3 links distinguidos apenas por cor**
- `resources/js/render.js:199` (`renderPubItem`) gera `<a>` dentro de `<span class="lp-typed-meta">`; `resources/css/landing.css:761` não aplica sublinhado.
- Links afetados: 3 registros do repositório WTICIFES nas publicações (`index.html:311`, `:315`, `:319`; mesmos em `en/index.html`).
- **Ação:** `text-decoration: underline` (com `text-underline-offset`) em `.lp-typed-meta a` perto de `landing.css:761`.

**d) `<img>` do badge sem dimensões**
- `resources/js/render.js:453` gera o badge de visitas sem `width`/`height`; no audit o `src` apareceu vazio (recurso externo bloqueado/falho no headless).
- O SVG remoto tem `width="87.6" height="20"`.
- **Ação:** adicionar `width="88" height="20"` ao `<img>` em `render.js:453`. URL configurada em `resources/content/pt.json:511` / `en.json:511`.

**Critério de aceite:** `npm run check` sem falhas; Lighthouse accessibility ≥ 98 nas duas rotas; navegação por teclado/leitor de tela preservada nos `<details>` e diálogos; contraste verificado também no EN.

---

### [x] P2 — Reduzir bloqueio de renderização das fontes — CONCLUÍDO

**Decisão de escopo:** o usuário escolheu **todo o site**. Nenhuma requisição a `fonts.googleapis.com` ou `fonts.gstatic.com` permanece em HTML/CSS/JS.

**Evidência original:** `render-blocking-insight` de **840 ms (PT)** e **720 ms (EN)** no mobile; FCP 1,8 s / 1,7 s.

**Resultado local (após P2):**

| Rota | FCP | Render-blocking | Perf | A11y |
|---|---:|---:|---:|---:|
| `/` | 1,1 s | 40 ms | **100** | 100 |
| `/en/` | 1,1 s | 280 ms | **100** | 100 |

**Ação aplicada:**
1. Inter e Sora (latin, variáveis 400–700) em `resources/fonts/*.woff2` (47 KiB + 25 KiB), com as licenças OFL 1.1 (`Inter-OFL.txt`, `Sora-OFL.txt`).
2. `@font-face` com `font-display: swap` no início de `resources/css/landing.css`; `preload` dos dois arquivos no `<head>` gerado por `resources/js/render.js` e replicado nas 14 páginas estáticas.
3. `preconnect` externo removido; validadores atualizados para exigir as fontes locais.

**Critério de aceite:** atendido — zero requisições externas de fonte, render-blocking < 100 ms em PT, FCP/LCP melhoraram, tipografia preservada.

---

### [x] P4 — Cache — ENCERRADO como limitação residual

- **Evidência direta:** `curl -I` no GitHub Pages retorna `cache-control: max-age=600`, `expires` e `etag` em `resources/css/landing.css` e `resources/images/profile.webp`. Não há `_headers` nem qualquer configuração de cache no repositório; o GitHub Pages ignora `_headers` (convenção de Netlify/Cloudflare Pages). Referência externa confirmada em 26/11.
- **Antes do P1:** `cache-insight` estimava **343 KiB** de reaproveitamento, dos quais **326,9 KiB** vinham só de `profile.png`.
- **Depois do P1 (site público):** a estimativa caiu para **26 KiB** (8,8 KiB da imagem + 8,0 KiB de `render.js` + 5,4 KiB de `landing.css` + 3,4 KiB de `main.js`).
- **Decisão:** sem ação. Mudar exigiria CDN/domínio próprio ou service worker, fora do escopo. Item removido do backlog ativo e registrado como limitação da plataforma.

---

### [x] P5 — Revalidação ao final — CONCLUÍDO

**Status 26/11:** commit `97d4b14` enviado para `origin/main`, GitHub Pages propagado (200 em `/resources/images/profile.webp`), 4 auditorias finais no site público — tabela completa na seção 6. Acessibilidade 100 em todas; nenhuma regressão de LCP/CLS/TBT. `desktop` variou 98/99 como esperado; `mobile PT` marcou 97 numa execução com FCP/LCP 1,9 s (ruído de medição, TBT 0 e CLS 0).

1. `npm run build && npm run check` (equivalente a `npm run check`).
2. Repetir os 4 comandos da seção 1 **no site publicado** (após deploy) — não medir apenas local, para não comparar cache/headers diferentes.
3. Conferir as 4 rotas/estados: `/` PT mobile, `/en/` mobile, `/` desktop (2 execuções).
4. Atualizar este arquivo com a nova tabela de scores e datas; mover itens concluídos para uma seção "Histórico".
5. Indicadores do processo: **não medidos** (sem estimativa MESPro autorizada para esta demanda de diagnóstico) — não preencher com zero.

---

## 4. Restrições e decisões pendentes

| Item | Situação |
|---|---|
| Publicar/commitar | Usuário autorizou as três rodadas. Commits no ar: `97d4b14`, `5b2caba` (P1/P3), `84fd249` (P2 + `resources/` + Font Awesome + og-images) e `4ee40c7`, `e6896be`, `5df15c8`, `d887ea4` (rodada 3). Nenhum com coautoria de IA. GitHub Pages confirmado por HTTP 200 nos WebPs e zero referências a Font Awesome no HTML público. |
| Fonte única de conteúdo | `resources/content/pt.json`, `resources/content/en.json` + `resources/js/render.js`. HTML gerado não deve ser editado à mão. |
| Invariantes | `tools/check-build.mjs` valida estrutura, fontes self-hosted, presença dos WebP, og-image por idioma, ausência de CDN e — desde a rodada 3 — **ausência de Font Awesome** nos HTMLs/CSS. Rodar `npm run check` após qualquer mudança de markup. |
| Escopo do TAP | P2 executado em todo o site por decisão explícita do usuário. P4 encerrado como limitação do GitHub Pages. Novas mudanças preservam contratos e URLs públicas das páginas. |
| Documentação histórica | `docs/03-TAP.md` e `DECISIONS.md` mantêm os caminhos antigos (`content/`, `css/`, `js/`, `images/`) como registro do que foi aprovado; a estrutura vigente é `resources/`. |
| Licenças | Inter/Sora: SIL OFL 1.1 em `resources/fonts/*-OFL.txt`. Font Awesome 6.4.0: licença em `resources/fontawesome/LICENSE.txt` — diretório mantido, mas **sem referência desde a rodada 3** (remoção opcional mediante aprovação). |
| Questionário do briefing | Data-alvo de início e orçamento seguem "não informados" no TAP; não foram presumidos aqui. |

---

## 5. Resumo executivo

- **Já está bom:** performance 97–99 no publicado, CLS 0, TBT 0, SEO e boas práticas 100.
- **Concluído (P1):** `profile.png` (356 KiB) → `profile.webp` (9,4 KiB). Economia real de ~347 KiB.
- **Concluído (P3):** acessibilidade 91 → **100** nas duas rotas.
- **Concluído (P2):** fontes self-hosted em todo o site. Render-blocking 840 ms → 40 ms (PT), FCP 1,8 s → 1,1 s, performance local 100.
- **Encerrado (P4):** cache do GitHub Pages é fixo em `max-age=600`; impacto residual caiu de 343 KiB para 26 KiB. Sem ação possível pelo repositório.
- **Rodada 2 publicada:** commit `84fd249` — todos os recursos em `resources/`, Font Awesome local e og-images PT/EN.
- **P5 final no público:** `100/100/100/100` em PT mobile e desktop, `99/100/100/100` no EN mobile. FCP 0,9 s (PT) e 0,4 s (desktop), CLS 0, sem erros de console.

---

## 6. Registro de execução — 2026-11-26

### Arquivos alterados (locais, sem commit)

| Arquivo | Mudança |
|---|---|
| `resources/images/profile.webp` | Novo. WebP 320×320, `cwebp -resize 320 320 -q 82`, 9.640 bytes. PNG original mantido. |
| `resources/content/pt.json` | `about.avatar` → `/resources/images/profile.webp` |
| `resources/content/en.json` | `about.avatar` → `/resources/images/profile.webp` |
| `resources/js/render.js` | `renderLinks`: sem `aria-label` derivado de `title`; badge com `width/height` |
| `resources/css/landing.css` | `--cyan-text`, `.lp-entry-meta`, `.lp-typed-meta a` |
| `index.html`, `en/index.html` | Regenerados por `npm run build` (não editados à mão) |
| `PERFORMANCE_REPORT.md` | Atualizado com status e resultados |

### Validação

1. `npm run check` — **todos os checks passaram** (PT, EN, paridade, CSS, páginas avulsas, raiz), incluindo `arquivo do avatar existe — /resources/images/profile.webp` e `contador de visitas presente no footer`.
2. Lighthouse 13.6.0 em servidor local (`python3 -m http.server 8000 --bind 127.0.0.1`), mobile, Chrome 158:

| Rota | Perf | A11y | Boas práticas | SEO | FCP | LCP | TBT | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` (local) | 99 | **100** | 100 | 100 | 1,8 s | 1,8 s | 0 ms | 0 |
| `/en/` (local) | 99 | **100** | 100 | 100 | 1,7 s | 1,7 s | 0 ms | 0 |

3. Relatórios: `$OUT/local-pt.report.html`, `$OUT/local-pt.report.json`, `$OUT/local-en.json` (mesmo `$OUT` da seção 1).
4. **Ressalva:** o servidor Python local não comprime texto. Por isso o "total byte weight" local (302 KiB PT / 296 KiB EN) não é comparável aos 478 KiB medidos no GitHub Pages (com gzip). A comparação válida é a da imagem: **356,7 KiB → 9,6 KiB**. A medição definitiva de payload e cache deve ser feita após o deploy (P5).
5. Auditorias ainda em score < 1 no local (`unminified-resources/css/js`, `unused-resources/css/js`, `cache-insight`, `render-blocking-insight`) são as mesmas do diagnóstico original; `render-blocking` é o item P2, adiado por decisão de escopo.

### Publicação e revalidação final (P5)

- Usuário autorizou a publicação em 26/11. Commit `97d4b14` — `Otimiza imagem de perfil e corrige acessibilidade da landing` — enviado para `origin/main`, **sem coautoria de IA**.
- CI `.github/workflows/build.yml` disparou pelos paths `resources/content/**`, `resources/css/**`, `resources/js/**`; HTML já estava sincronizado, então o job de build não precisou gerar novo commit.
- GitHub Pages confirmado: `GET /resources/images/profile.webp` → **200, 9.640 bytes**; HTML e CSS públicos contêm `profile.webp` e `--cyan-text`.
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

---

## 7. Rodada 2 — reorganização, Font Awesome local e og-images (26/11, local)

### Estrutura

- `css/`, `fonts/`, `images/`, `js/` e `content/` movidos para `resources/...` (os quatro primeiros com `git mv`; `fonts/` com `mv`, por ser diretório novo).
- Referências atualizadas em `build.mjs`, `tools/check-build.mjs`, `resources/js/render.js`, `resources/js/main.js`, `resources/css/landing.css`, `resources/content/*.json`, 14 HTMLs estáticos e `.github/workflows/build.yml` (`paths: resources/**`). Os HTMLs gerados foram regenerados por `npm run build`.
- Efeito colateral do replace em massa corrigido: a URL do Font Awesome CDN havia sido alterada para `.../6.4.0/resources/css/...`; restaurada antes da cópia local.

### Font Awesome local

- CSS completo em `resources/fontawesome/css/all.min.css` (100 KiB); 8 webfonts (woff2 + ttf) em `resources/fontawesome/webfonts/`; licença em `resources/fontawesome/LICENSE.txt`.
- As 14 páginas estáticas passaram a carregar `/resources/fontawesome/css/all.min.css`. Não resta nenhuma referência a `cdnjs.cloudflare.com` no repositório.
- Uso real: `fa-bars` nas 14 páginas; ícones adicionais em `rex_info.html`.

### og-images PT/EN

- Novos arquivos: `resources/images/og-image.png` (374,6 KiB) e `resources/images/og-image-en.png` (365,2 KiB), ambos 1200×630.
- Gerador reproduzível: `tools/generate-og.mjs` — Chrome headless, fontes self-hosted embutidas, textos e métricas lidos dos JSONs. Comando: `CHROME_PATH="..." node tools/generate-og.mjs`.
- Conteúdo: headline e `role` do hero + métricas `20+`, `50+`, `35k+`, na paleta da landing.
- **Bug corrigido durante a execução:** o `<br>` da quebra de linha era escapado para `&lt;br&gt;` e aparecia literalmente na imagem. Agora só o texto é escapado e a tag é inserida depois. Verificado no DOM renderizado: `innerText` contém `\n`, sem `<br>` literal.
- `SITE.ogImage(lang)` escolhe o arquivo por idioma; `main.js` atualiza `og:image` e `twitter:image` na troca de idioma. Os validadores conferem o arquivo correto em cada rota.

### Verificação final dos HTMLs estáticos (solicitada explicitamente)

1. `npm run check` — **todos os checks passaram**, incluindo os novos invariantes de fontes locais, Font Awesome local, licenças e og-image por idioma.
2. Servidor local (`python3 -m http.server 8000 --bind 127.0.0.1`) + varredura das **16 páginas** (14 estáticas + `index.html` + `en/index.html`): **355 referências locais** em `href`/`src`/meta de imagem/`url()` de CSS — **0 falhas, nenhum 404**.
3. Lighthouse 13.6.0 local (mobile, Chrome 158), com `errors-in-console` vazio e nenhum request HTTP ≥ 400:

| Rota | Perf | A11y | Boas práticas | SEO | FCP |
|---|---:|---:|---:|---:|---:|
| `/` | 98 | 100 | 100 | 100 | 1,2 s |
| `/en/` | 90 | 100 | 100 | 100 | 1,1 s |
| `/rex_info.html` | 47 | 98 | 100 | 100 | 1,7 s |
| `/article_ios.html` | 71 | 90 | 100 | 100 | 1,8 s |

4. **Ressalva da medição local:** o servidor Python não comprime texto, então `all.min.css` (100 KiB) e `fa-solid-900.woff2` (147 KiB) trafegam sem gzip. Nas páginas avulsas o Lighthouse registrou long task *Unattributable* de ~2,6 s com `scriptEvaluation` de ~20 ms — ruído do headless, não falha do código. A medição definitiva foi feita no público (item 6 abaixo), com compressão do GitHub Pages.
5. Relatórios locais: `$OUT/final-pt.json`, `$OUT/final-en.json`, `$OUT/final-rex.json`, `$OUT/final-article.json`.

### Publicação e P5 final no site público (26/11)

- Commit `84fd249` enviado para `origin/main`. GitHub Pages conferido: HTTP 200 em `og-image.png`, `og-image-en.png`, `profile.webp`, fontes Inter/Sora, CSS e webfont do Font Awesome e `content/pt.json`; HTML público aponta para `/resources/...`.
- Lighthouse 13.6.0 (Chrome 158, `errors-in-console` vazio, nenhum request ≥ 400):

| Rota | Perf | A11y | Boas práticas | SEO | FCP | LCP | TBT | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` (mobile) | **100** | 100 | 100 | 100 | 0,9 s | 0,9 s | 20 ms | 0 |
| `/en/` (mobile) | **99** | 100 | 100 | 100 | 1,1 s | 1,1 s | 110 ms | 0 |
| `/` (desktop) | **100** | 100 | 100 | 100 | 0,4 s | 0,4 s | 0 ms | 0 |
| `/rex_info.html` (mobile) | 71 | 98 | 100 | 100 | 1,1 s | 6,3 s | 310 ms | 0 |

- Comparação: PT mobile subiu de 97 (P5 da rodada 1) para **100**; render-blocking de 840 ms → **30 ms**; FCP de 1,8 s → **0,9 s**.
- `rex_info.html` segue com 71 por imagens grandes (até 369 KiB) e LCP 6,3 s — **sem baseline anterior**, é registro, não regressão. Fora do escopo desta rodada (TAP).
- `cache-insight` público passou a estimar 92 KiB (antes 26 KiB) por incluir o CSS/webfont do Font Awesome agora self-hosted; segue como limitação residual do GitHub Pages (P4).
- Relatórios: `$OUT/round2-pt.report.{json,html}`, `$OUT/round2-en.json`, `$OUT/round2-rex.json`, `$OUT/round2-desktop.json`.

### Estado

Rodada 2 concluída e publicada. Backlog ativo vazio; P4 registrado como limitação da plataforma, sem ação prevista.

---

## 8. Rodada 3 — WebP, SVG inline e acessibilidade das páginas estáticas (26/11)

### Escolha do usuário e baseline

O usuário pediu a revisão do desempenho de **todas as páginas estáticas** e escolheu três melhorias: **Imagens WebP (Recomendado)**, **Font Awesome → SVG inline** e **Corrigir acessibilidade**.

Baseline medido no **site público** nas 16 páginas (14 estáticas + `index.html` + `en/index.html`): performance **100 em todas**, CLS 0, TBT 0–50 ms, boas práticas 100. Acessibilidade 100 em 13 páginas, **98** em `404.html` e `rex_info.html` (`heading-order`) e **90** em `article_ios.html` (`link-name` + `list`). SEO 69 apenas no `404.html`, por `noindex, follow` — intencional.

Font Awesome custava **169 KiB por página** (22 KiB de CSS + 147 KiB de `fa-solid-900.woff2`) e **275 KiB** em `rex_info.html`, que também carregava `fa-brands-400.woff2`.

### 8.1 Imagens WebP

Seis imagens convertidas com `cwebp -quiet -q 82`, mantendo os PNGs originais como fonte:

| Imagem | PNG | WebP | Redução |
|---|---:|---:|---:|
| `article_imgs/rex/icone_rex_big.png` | 369,2 KiB | 73,2 KiB | 80% |
| `article_imgs/rex/rex_banner.png` | 337,9 KiB | 39,0 KiB | 88% |
| `article_imgs/rex/print_1.png` | 154,3 KiB | 63,6 KiB | 59% |
| `article_imgs/rex/print_2.png` | 242,4 KiB | 29,8 KiB | 88% |
| `article_imgs/rex/print_3.png` | 184,4 KiB | 75,7 KiB | 59% |
| `article_imgs/face_detection_ui_wireframe.png` | 732,5 KiB | 90,4 KiB | 88% |
| **Total** | **2.020,7 KiB** | **371,6 KiB** | **82%** |

`src` dos `<img>` e os três `data-image` do modal em `rex_info.html` passaram a apontar para `.webp`, além do wireframe em `article_reconhecimento_facial.html`. Os validadores agora exigem os seis WebPs e proíbem esses PNGs nos HTMLs.

### 8.2 Font Awesome → SVG inline

- **24 ícones em 14 HTMLs**: 14× hamburger e 10 em `rex_info.html` (download, busca, gráfico, 3× expandir, Chrome, Edge, Firefox e Medium).
- Padrão reaproveitado de `resources/js/render.js` (`renderIcon()` / `.lp-icon`): `viewBox`, `fill="none"`, `stroke="currentColor"`, `aria-hidden="true"` e `focusable="false"`.
- O `<link>` de `all.min.css` foi removido das 14 páginas; `all.min.css` e as webfonts deixaram de ser transferidos.
- CSS ajustado: `.lp-rex-step .lp-icon`, `.lp-rex-shot-icon` + `.lp-icon`, `.lp-rex-note h3`, `.lp-footer-col h2`.
- `tools/check-build.mjs` trocou os invariantes: de "Font Awesome local existe" para "sem Font Awesome, ícones em SVG inline" e "sem PNGs convertidos".

### 8.3 Correções de acessibilidade

- `article_ios.html`: 10 `</a>` faltantes nas referências — o `<a>` aberto virava filho direto do `<ol>`, disparando `link-name` e `list`. A data `<h4>Outubro/2025</h4>` virou `<p class="lp-article-date">`.
- `rex_info.html`: hierarquia corrigida (seções `<h3>`→`<h2>`, passos `<h4>`→`<h3>`, nota do desenvolvedor `<h4>`→`<h3>`).
- `404.html`: `<h3>` do rodapé → `<h2>`, evitando salto de nível após o `<h1>`.

### 8.4 Validação

1. `npm run build && npm run check` — **todos os checks passaram**; `index.html` e `en/index.html` regenerados sem diferença.
2. Varredura local das 16 páginas: **395 referências locais**, nenhum 404 (as 3 ocorrências de `href="/"` são o link para a raiz, não falha).
3. Inspeção via CDP no Chrome: **64 SVGs inline** no DOM, com hamburger a ~21 px, ícones de passo a ~19 px, cores corretas; os WebPs carregam com dimensões naturais preservadas (493×424, 1400×560, 1772×907, 1892×915, 1890×907, 1024×1024).
4. Lighthouse 13.6.0 em servidor local **com gzip** (para comparar com o GitHub Pages), 16 páginas:

| Cenário | Perf | A11y | Boas práticas | SEO | FCP | CLS |
|---|---:|---:|---:|---:|---:|---:|
| 15 páginas | **100** | **100** | 100 | 100¹ | 0,8 s | 0 |
| `rex_info.html` | **96–100**² | **100** | 100 | 100 | 0,8 s | 0 |
| `article_reconhecimento_facial.html` | **99**³ | **100** | 100 | 100 | 0,8 s | 0 |

¹ `404.html` marca 69 em SEO pelo `noindex, follow` intencional.
² Variação de Lighthouse: ora o `<p>` da seção é o LCP (0,8 s, score 100), ora o banner WebP é escolhido (2,6 s, score 96–97). TBT ≤ 70 ms e CLS 0 em ambas; `fetchpriority="high"` não alterou o desfecho e foi revertido.
³ A execução em lote marcou 84 por contenção de CPU com 4 auditorias paralelas (TBT 590 ms); a execução isolada marcou 99 (TBT 20 ms).

5. Única falha binária restante nas 16 páginas: `is-crawlable` no `404.html`, consequência direta do `noindex`.
6. Agregado nas 16 auditorias: **imagens 2.042 → 392 KiB (−81%)**; **Font Awesome 2.476 → 0 KiB**.
7. Relatórios e scripts: `$OUT/audit-static.sh` (baseline público), `$OUT/{local-audit,gzip-audit}/`, `$OUT/verify-local.mjs`, `$OUT/compare-round3.mjs`.

### 8.5 Publicação e revalidação final (aprovada pelo usuário)

- Usuário aprovou a publicação. Commits enviados para `origin/main`, **sem coautoria de IA**:
  - `4ee40c7` — WebP, SVG inline e acessibilidade das páginas estáticas;
  - `e6896be` — registro da auditoria da rodada 3;
  - `5df15c8` — `width`/`height` nas imagens WebP (correção de CLS encontrada no público);
  - `d887ea4` — `height: auto` no CSS (correção de proporção revelada pela correção anterior).
- GitHub Pages propagado: **HTTP 200 nos 6 WebPs** e **zero referências a Font Awesome nas 16 páginas públicas**.
- A primeira auditoria pública pós-deploy mostrou **CLS 0,102** em `rex_info.html` ("Unsized image element": banner WebP sem dimensões). A correção com `width`/`height` eliminou o CLS, mas expôs `image-aspect-ratio` e `image-size-responsive` (BP caiu para 92) porque o atributo `height` era interpretado como dica de estilo — o CSS definia só a largura. `height: auto` nos quatro seletores de imagem restaurou a proporção e o BP 100.
- Lighthouse 13.6.0 no **site público**, após a correção final:

| Rota | Perf | A11y | Boas práticas | SEO | FCP | LCP | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/` (mobile) | **100** | 100 | 100 | 100 | 0,9 s | 0,9 s | 0 |
| `/en/` (mobile) | **100** | 100 | 100 | 100 | 1,1 s | 1,1 s | 0 |
| `/rex_info.html` | **99** | **100** | 100 | 100 | 0,9 s | 2,0 s | 0 |
| `/article_reconhecimento_facial.html` | **100** | **100** | 100 | 100 | 0,9 s | 1,2 s | 0 |

- Nenhuma falha binária nas quatro rotas. No `rex_info.html` o LCP oscila entre o parágrafo e as imagens do topo (2,0–2,6 s na simulação do Lighthouse), sem TBT relevante e com CLS 0.
- As demais páginas públicas já haviam marcado 100/100/100/100 na primeira rodada pós-deploy; `404.html` mantém SEO 69 pelo `noindex` intencional (única falha `is-crawlable`).
- Relatórios: `$OUT/public-round3/` (`root-final2.json`, `en-final2.json`, `rex_info-final2.json`, `article_reconhecimento_facial-final2.json` e os intermediários).

### Pendências

- `resources/fontawesome/` segue no repositório sem nenhuma referência; a remoção é opcional e depende de autorização.
- Lighthouse ainda estima ~99 KiB de economia em `rex_info.html` (logo de 73 KiB exibido a 120 px). Não foi aplicado para manter o escopo das três melhorias escolhidas; fica como candidato a follow-up.
- P4 permanece encerrado como limitação do GitHub Pages (`cache-control: max-age=600`).
