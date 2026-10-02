# Conteúdo

O diretório do idioma vem primeiro; dentro dele, um arquivo `.json` por seção.
Nada de JSON gigante: um arquivo por seção é o que permite editar a home sem
tocar no catálogo, e revisar o catálogo sem reescrever a home.

```
content/
  README.md          este arquivo
  pt.json            monólito preservado — ver "Monólitos" abaixo
  en.json            monólito preservado — ver "Monólitos" abaixo

  pt/                en/
    meta.json          ← SEO por idioma (title, description, keywords, lang)
    nav.json           ← rótulos de navegação e do botão de idioma
    ui.json            ← rótulos soltos: seletor de tema, rodapé, modal
    hero.json          ← home: identidade, afirmação e CTAs
    metrics.json       ← home: números de escala
    selectedWork.json  ← home: os cinco projetos da vitrine
    experience.json    ← home: a experiência que origina os projetos
    engineering.json   ← home: capacidade de engenharia, não tecnologias
    about.json         ← resumo na home + bio longa na página /about/
    contact.json       ← home: chamada final
    work.json          ← cabeçalho da página /work/
    writing.json       ← cabeçalho da página /writing/
    writingPreview.json ← home: quatro escritos de destaque
    caseStudy.json     ← rótulos das páginas de estudo

    catalog/           ← os dados que alimentam /work/ e /writing/
      mobile.json          aplicativos publicados
      web.json             sistemas web
      other.json           demais projetos
      videos.json          vídeos
      technicalArticles.json  artigos técnicos
      reflections.json        reflexões
      career.json             textos de carreira
      publications.json       papers e notícias

    case-studies/      ← um arquivo por estudo (guri.json, sisppa.json…)
```

## Como o build lê isso

`js/content.js` reagrupa os arquivos na mesma forma em memória que os monólitos
tinham, então `js/render.js` não conhece o layout em disco. Para reorganizar,
mexa só em `js/content.js`.

O build **lê `content/<idioma>/` e não lê os monólitos**.

## Paridade entre idiomas

Dois checks seguram isso, e os dois reprovam o build:

1. **mesmos arquivos** — a lista de `.json` de `pt/` tem de ser idêntica à de
   `en/`. Uma seção que existe em um idioma e não no outro é uma página a menos
   no outro idioma, e isso é fácil de não ver;
2. **mesma estrutura** — as chaves e os tamanhos de array precisam coincidir. A
   troca de idioma re-renderiza a página a partir do JSON vizinho sem
   recarregar, então divergência falha em silêncio.

## Monólitos

`content/pt.json` e `content/en.json` foram preservados como referência da
migração. **Não são a fonte** — editar os dois cria duas verdades, então a
validação compara os monólitos com `content/<idioma>/` e reprova na primeira
divergência, apontando o caminho exato.

Quando quiser removê-los, é só apagar: o check de monólitos já passa para
"removido — layout por seção é a única fonte".

## Case studies

Pipeline pronto, **nenhum estudo escrito ainda**: os dados não chegaram, e
escrevê-los sem fonte seria inventar. O diretório `case-studies/` aparece dentro
de cada idioma quando o primeiro estudo existir.

O esquema e a lista de pendências de conteúdo estão no fim deste arquivo.

```jsonc
// content/pt/case-studies/guri.json
{
  "slug": "guri",                  // = nome do arquivo
  "order": 1,                      // ordem na vitrine
  "title": "GURI",
  "kind": "ERP institucional",
  "period": "2011 — 2022",
  "status": "finished",            // active | finished | experimental
  "summary": "uma frase, vai no card da home",
  "stack": ["PHP", "CodeIgniter"],

  "sections": [
    { "id": "context", "title": "Contexto", "paragraphs": ["..."], "bullets": [] }
    // problem, solution e role são obrigatórios
    // architecture, decisions e challenges são opcionais
  ],

  "outcomes": [
    { "number": "50+", "label": "Módulos" },
    { "number": "{{downloads}}", "label": "Downloads de aplicativos" }
  ],
  "evidence": [
    { "icon": "fa fa-newspaper", "label": "Notícia", "href": "https://..." }
  ],
  "related": [{ "title": "Artigo", "href": "https://..." }],

  "metaTitle": "…",                // 20–75 caracteres
  "metaDescription": "…"           // 70–175 caracteres
}
```

O que a validação reprova num estudo: seção obrigatória faltando ou vazia;
`status` fora dos três valores; `outcome` que não resolve — precisa ser literal
ou um token que exista no conteúdo (`{{downloads}}`, `{{papers}}`…); evidência
apontando para `example.com`; e a home referenciar um `caseStudy` cujo arquivo
não existe.

Para ligar um estudo à vitrine da home, em `selectedWork.json`:

```jsonc
{ "title": "GURI", "caseStudy": "guri", ... }
```

### Pendências de conteúdo

Para os cinco estudos previstos, falta do candidato:

- **GURI** — módulos em que atuamos, decisões de arquitetura, o que a evolução
  de 2011 a 2022 exigiu.
- **SisPPA** — de onde vêm os dados (Lattes/XML?), como a engenharia reversa das
  planilhas foi validada contra a planilha original.
- **App Unipampa** — quais APIs, como funciona a autenticação, o que os 35k
  downloads significam em uso.
- **MESPro** — o que é o método, quais hipóteses, como a calibração funciona, o
  que a prova de conceito já mediu.
- **Petrux** — arquitetura das treze fases, o que já foi automatizado, qual é a
  parte experimental.