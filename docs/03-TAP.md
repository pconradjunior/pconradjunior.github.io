# 03 — Termo de Abertura de Projeto (TAP)

**Projeto:** Evolução do portfólio Pedro Conrad Jr
**Data:** 19/11/2026
**Fase:** 3 — Planejamento Inicial
**Agente responsável:** Petrux-Planner (com MESPro)
**Status:** Aprovado

---

## 1. Justificativa

O portfólio publicado não apresenta de forma estruturada e verificável os dados
profissionais disponíveis em LinkedIn, GitHub, Medium e Petrux. A demanda é de
requisito novo, classificada como prioridade alta, com viabilidade técnica e
operacional alta. A data-alvo de início não foi informada e permanece como
pendência de escopo, sem preenchimento presumido.

## 2. Objetivo

Enriquecer o site existente com trajetória profissional, formação, certificações,
idiomas, publicações tipadas e seção de engenharia, preservando identidade
visual, conteúdos, URLs e funcionalidades atuais.

## 3. Escopo

### Incluído

- Novas chaves em `content/pt.json` e `content/en.json`, com paridade.
- Novas seções renderizadas em `js/render.js`.
- Acervo em `<dialog>` nativo com as 14 certificações anteriores e as 4
  publicações além das 3 recentes em destaque; 6 disclosures nativos restantes
  nas experiências. Idiomas em itens lado a lado, no padrão das competências.
- Estilos em `css/landing.css` para os novos blocos, o diálogo e o ajuste do
  espaçamento superior do hero.
- Ajustes de SEO: `hreflang` restrito às páginas principais no sitemap,
  `lastmod` derivado do git, `alumniOf` unificado, `dateModified` e
  `numberOfItems` no JSON-LD, remoção do `meta keywords` e troca do `preload`
  do JSON por `prefetch`.
- Substituição dos ícones Font Awesome da landing por 16 SVGs inline próprios;
  `fetch-depth: 0` no checkout do CI para o cálculo do `lastmod`.
- Novos invariantes em `tools/check-build.mjs`.
- JSON-LD enriquecido sem aumentar o número de blocos.
- Documentos de governança: `DECISIONS.md`, `docs/00-BRIEFING.md`, este TAP.
- Validações de build, links, rotas, extração textual ATS e acessibilidade.

### Fora do escopo

- Reconstrução ou redesign do site.
- Novas dependências ou refatorações amplas.
- Novos modais (rejeitados pelo solicitante).
- Códigos de credencial e links "Exibir credencial".
- `Scrum Foundation Professional Certificate - SFPC™` (expirado).
- Mudança no `h1` do hero e enriquecimento de metadados das páginas auxiliares.
- Publicação/commit antes da aprovação final.

## 4. Entregáveis

| Entregável | Local |
|---|---|
| Briefing aprovado | `docs/00-BRIEFING.md` (Anexo I) |
| Registro de decisões | `DECISIONS.md` |
| Conteúdo PT/EN | `content/pt.json`, `content/en.json` |
| Renderização | `js/render.js` |
| Estilos | `css/landing.css` |
| Validador | `tools/check-build.mjs` |
| Páginas geradas | `index.html`, `en/index.html` |

## 5. Baseline autorizado

| Item | Valor |
|---|---|
| Prioridade | Alta |
| Data-alvo de início | Não informado |
| Orçamento autorizado | Não informado (demanda proporcional ao risco) |
| Roteamento | Petrux `architect`, fase `4.5` |
| Critério de aceite | `npm run check` sem falhas + validações manuais descritas no item 7 |

## 6. Restrições

- Não inventar dados; diferenciar experiência, formação, cursos, publicações e
  apresentações.
- Preservar PT/EN, responsividade, metadados, headings e acessibilidade.
- ATS sem keyword stuffing: HTML semântico, datas claras, texto selecionável.
- Campos essenciais fora dos `<details>`; apenas descrições longas recolhidas.

## 7. Validação

1. `npm run check` com todos os invariantes passando.
2. Rotas `/` e `/en/` renderizando as seis seções e cinco `h2`.
3. Extração textual ATS com os detalhes fechados.
4. Navegação por teclado e leitor de tela nos `<details>`.
5. Responsividade em 960/768/560 px.
6. Links externos e internos resolvendo.
7. Aprovação final do solicitante antes de publicar/commitar.

---

## Anexo I — Briefing de demanda

O briefing aprovado (`docs/00-BRIEFING.md`) integra este TAP como Anexo I e é
parte integrante do escopo autorizado. Seu teor, incluindo a decisão de triagem
(prioridade alta; viabilidade técnica e operacional alta; data-alvo de início
não informada), aplica-se integralmente a este documento.
