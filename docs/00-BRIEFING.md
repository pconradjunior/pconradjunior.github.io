# 00 — Briefing de demanda

**Projeto:** Evolução do portfólio Pedro Conrad Jr
**Data:** 19/11/2026
**Fase:** 0 — Ideação e Brainstorming (registro consolidado)
**Agente responsável:** Petrux-Thinker (coordenação Petrux, fase 0)
**Rodadas de perguntas:** 5 áreas, todas respondidas pelo solicitante antes do
início da implementação
**Campos não informados:** data-alvo de início; viabilidade institucional

---

## 1. Problema

O portfólio publicado descreve bem os projetos entregues, mas não apresenta de
forma verificável e estruturada a trajetória profissional, a formação, as
certificações, os idiomas e a classificação correta das publicações. Informações
disponíveis em LinkedIn, GitHub e Medium, além da iniciativa Petrux, estavam
fora do site ou dispersas em texto corrido.

## 2. Público

- Recrutadores e gestores de tecnologia (triagem ATS e leitura humana).
- Equipes e instituições que contratam consultoria em sistemas institucionais,
  arquitetura de software e desenvolvimento mobile.
- Comunidade técnica que acompanha artigos e projetos de código aberto.

## 3. Proposta de valor

Tornar o portfólio uma fonte única, verificável e legível por máquinas e pessoas,
sem perder a identidade visual, os conteúdos ou as URLs já publicadas. A
evolução aumenta a densidade informativa sem transformar a página em um currículo
visualmente pesado: os detalhes longos ficam recolhidos em disclosures nativos.

## 4. Funcionalidades e conteúdo

- Posicionamento explícito em PT e EN, distinto de cargo empregaticio.
- Seção `Trajetória Profissional` com 6 registros de experiência.
- Formação com 3 registros: `Bacharelado em Informática`, `Pós-graduação Lato
  Sensu em Docência do Ensino Superior` e Curso Técnico em Processamento de Dados.
- Cursos e certificações com 19 itens, sem códigos e sem links de verificação;
  5 de 2024–2026 na lista principal e 14 anteriores em acervo nativo `<dialog>`.
- Publicações diferenciadas por tipo, com coautoria explícita no SIGraDi 2008 e
  WTICIFES 2026 classificado como participação em evento; 3 recentes em destaque
  e as 4 restantes no acervo.
- Idiomas apresentados como itens lado a lado, no mesmo padrão visual das
  competências, mantendo o nível de proficiência visível.
- Idiomas com níveis e evidência documentada de inglês.
- Seção de arquitetura, engenharia e IA com link para o artigo sobre Petrux.
- Competências em três grupos, incluindo `Gestão ágil e SCRUM`.
- JSON-LD enriquecido mantendo a quantidade de blocos.

## 5. Fluxos principais

1. Visitante acessa `/` (PT) ou `/en/` (EN) e encontra o posicionamento no hero.
2. Menu leva à seção `Trajetória Profissional`, onde cargo, instituição e
   período estão sempre visíveis.
3. Visitante expande "Ver atividades" apenas quando quiser o detalhe longo.
4. Links descritivos levam aos registros oficiais e ao artigo sobre Petrux.
5. Alternância de idioma repinta todo o conteúdo sem recarregar a página.

## 6. Escopo do MVP

Incluído: conteúdo PT/EN, seções novas, disclosures nativos, CSS responsivo,
validador de build, documentos de governança e JSON-LD enriquecido.

Fora do escopo: reconstrução do site, troca de identidade visual, novas
dependências, novos modais, publicação de códigos de credencial, mudança de URLs
existentes e inventário de dados não informados pelo solicitante.

## 7. Decisão de triagem

| Critério | Valor |
|---|---|
| Tipo | Requisito novo (evolução de portfólio), não defeito |
| Prioridade | Alta |
| Viabilidade técnica | Alta |
| Viabilidade operacional | Alta |
| Viabilidade institucional | Não informada |
| Data-alvo de início | Não informado |
| Roteamento Petrux | `architect`, fase `4.5` |

**Riscos de escopo:** ausência de data-alvo e de manifestação sobre viabilidade
institucional. Nenhum dos dois foi preenchido por suposição; se tornaram
pendências registradas em `DECISIONS.md`.

---

**Anexo I do TAP:** este documento é o Anexo I de `docs/03-TAP.md`.
