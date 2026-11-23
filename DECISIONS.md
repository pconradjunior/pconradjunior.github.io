# Decisões — evolução do portfólio

Registro de decisões editoriais e técnicas da demanda de enriquecimento do
portfólio com informações verificáveis de LinkedIn, GitHub, Medium e Petrux.
Todas as decisões abaixo foram confirmadas pelo solicitante antes da
implementação.

## Critérios gerais

- **Mudança incremental.** Não reconstruir o site, não substituir a identidade
  visual, não remover conteúdos, URLs ou funcionalidades existentes.
- **Sem dependências novas e sem refatorações amplas.** Reutilizar componentes,
  navegação, estilos e padrões atuais.
- **Verificabilidade.** Nenhum cargo, período, certificação, nível, instituição
  ou resultado foi inventado. Experiência, formação, cursos, publicações e
  apresentações são diferenciados.
- **HTML estático.** Todos os campos essenciais (cargo, instituição, período,
  nome do curso, emissor e data) permanecem no HTML, sem depender de JavaScript.

## Posicionamento

- PT: `Engenheiro de Software | Desenvolvedor Full Stack | Arquiteto de Software`
- EN: `Software Engineer | Full Stack Developer | Software Architect`
- Tratado como **posicionamento profissional**, não como cargo empregaticio.

## Experiência

- Seis registros, com título visível `Experiência Profissional` / EN
  `Professional Experience` e item de menu `Trajetória Profissional` / EN `Career`.
- UNIPAMPA desde `06/2010`; cargo real: `Analista de Tecnologia da Informação`.
- Docência URCAMP em dois registros: `Ensino Superior` (universitária,
  `08/2002–09/2009`) e `Ensino Técnico` (`03/2003–09/2009`). Os termos
  `Ensino Técnico` e `Ensino Superior` são usados capitalizados nos rótulos.

## Formação

Três registros, com redação revisada pelo solicitante:

1. `Bacharelado em Informática — URCAMP (2002)`
2. `Pós-graduação Lato Sensu em Docência do Ensino Superior — URCAMP (2004–2006)`
3. `Curso Técnico em Processamento de Dados - TPD - 1995-1997 - Urcamp`

## Competências

- Dois grupos: **atuação documentada** e **estudo com certificação**. O grupo
  `experimental` foi eliminado.
- Os 10 itens originais foram preservados.
- `Inteligência artificial` e `LLMs e agentes de IA` migraram para **estudo com
  certificação**, com base na certificação mais recente (`Engenharia de Prompts`,
  Escola Superior de Redes, nov. 2026), que também justifica o item
  `Engenharia de prompts`. `DB2` foi movido para **atuação documentada**
  (decisão do solicitante).
- `Java` e `NestJS` foram **removidos** das competências (decisão do solicitante).
- `Gestão ágil e SCRUM` incluído explicitamente.

## Idiomas

- Português nativo, inglês profissional, espanhol elementar.
- `English Proficiency Score` (EF, 2022) usado como evidência documentada.
- Apresentados como **itens lado a lado**, reaproveitando o estilo de pills das
  competências (`.lp-skills`), com o nível de proficiência visível no mesmo item.

## Publicações

- SIGraDi 2008 com coautoria explícita (Denise Aristimunha de Lima).
- WTICIFES 2026 registrado como **participação em evento**, sem afirmar palestra
  ou apresentação específica.
- Notícias institucionais mantidas fora de `ScholarlyArticle` (classificadas como
  `NewsArticle` no JSON-LD).
- Apenas os **3 artigos mais recentes** ficam em destaque na seção; as outras
  **4 publicações** vão para o acervo em `<dialog>` (decisão do solicitante).

## Certificações

- Lista final: **19 itens**, sem códigos de verificação e sem links "Exibir
  credencial", por decisão explícita do solicitante.
- Incluído `Engenharia de Prompts` — Escola Superior de Redes — nov. 2026
  (decisão do solicitante).
- **5 certificações de 2024 a 2026** ficam na lista principal; as **14 anteriores**
  ficam no acervo em `<dialog>`.
- `Scrum: agilidade em seu projeto` apareceu duplicado na lista enviada, com o
  mesmo código; entra **uma única vez**.
- **`Scrum Foundation Professional Certificate - SFPC™` (Certiprof, set. 2022 —
  expirado em set. 2024) fica FORA da lista.** A exclusão é definitiva: o
  certificado estava vencido na data da demanda e não deve ser reintroduzido.

## Interface e acessibilidade

- **Decisão revisada:** os modais customizados continuam fora, mas o solicitante
  autorizou um `<dialog>` **nativo** para o acervo (certificações anteriores e
  publicações além das 5 mais recentes). `showModal()` fornece Escape, focus
  trap, backdrop e bloqueio de rolagem sem JavaScript adicional.
- Restam **6 blocos `<details>/<summary>`** nativos (as descrições longas das
  6 experiências). Foram **removidos** o mapa `Relação entre certificações e
  competências` e a nota de coautoria/classificação, considerados poluentes.
- Cargo, instituição e período dos 6 registros, nome/emissor/data das 5
  certificações recentes e os dados do acervo permanecem no HTML estático;
  apenas as descrições longas das experiências ficam recolhidas.
- Espaçamento superior do hero reduzido de `6.5rem` para `4.5rem` (mobile:
  `3.5rem`), por solicitação, eliminando o excesso acima do conteúdo.
- ATS sem keyword stuffing: HTML semântico, `h1/h2/h3`, datas claras, texto
  selecionável no HTML estático e links descritivos.
- PT/EN com paridade de chaves; responsividade mobile; metadados, headings e
  acessibilidade preservados.

## SEO e performance

- **H1 alterado** a pedido do solicitante: de `Engenharia de sistemas
  institucionais` / `Institutional systems engineering` para `Sistemas
  desenvolvidos por pessoas, para pessoas` / `Systems built by people, for
  people`. O nome continua presente no `<title>`, no logo e no `Person` do
  JSON-LD; os demais metadados de SEO permanecem inalterados.
- **Sitemap**: `hreflang` apenas nas duas páginas principais. As 5 páginas
  auxiliares (4 artigos e `rex_info.html`) não declaram alternates, pois não têm
  versão traduzida. Elas permanecem no sitemap e mantêm seus metadados atuais.
- **`lastmod`** das páginas principais derivado do último commit que tocou
  `content/pt.json` / `content/en.json`, não da data do build. O checkout do CI
  passou a usar `fetch-depth: 0` para preservar o histórico.
- **`alumniOf`** unificado em uma única entidade `URCAMP` (antes havia `URCAMP`
  e `Urcamp` como entidades distintas).
- **`dateModified`** adicionado ao `ProfilePage` e ao `<head>`, preservado na
  troca de idioma via JS.
- **`numberOfItems`** declarado nas 4 listas do JSON-LD.
- **`meta keywords` removido** (obsoleto).
- **`preload` do JSON trocado por `prefetch`**: o arquivo só é usado na troca de
  idioma, então não deve competir com recursos críticos no carregamento inicial.
- **Font Awesome removido da landing**: 16 ícones SVG próprios e inline
  (`aria-hidden`, `focusable="false"`), sem CDN e sem fonte de ícones. As páginas
  auxiliares permanecem com seu markup atual, por decisão de escopo.
- Google Fonts mantido: `preconnect` e `display=swap` já presentes, e os quatro
  pesos carregados são usados.

## Estrutura final

- 6 seções, 5 `h2`.
- `section#career` com `h2 Experiência Profissional`, 6 registros em `<article>`
  com `<h3>` de cargo e `<h3>` para `Formação`, `Cursos e certificações`,
  `Publicações e participação` e `Idiomas`.
- JSON-LD mantém 6 blocos; `Person` ganha `hasCredential` (19 entradas),
  `knowsLanguage`, `alumniOf` único e `knowsAbout` ampliado.

## Priorização e triagem

- Prioridade: **alta**.
- Viabilidade: **técnica alta**, **operacional alta**; institucional não
  informada.
- Data-alvo de início: **não informado** (registrado como risco de escopo;
  nenhuma data foi assumida pelo agente).
- Roteamento Petrux: agente `architect`, fase `4.5`; TAP enxuto aprovado com o
  briefing como Anexo I.

## Publicação

- Publicar/commitar somente após validação e aprovação finais do solicitante.
