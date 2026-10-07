# Índice bíblico (metadados estáticos)

Este diretório contém **apenas metadados** para seleção e validação de passagens — **sem texto dos versículos** no repositório.

## Conteúdo de `index.json`

Para cada um dos 66 livros (ordem protestante canónica):

| Campo | Descrição |
|-------|-----------|
| `id` / `slug` | Identificador estável (ex.: `mateus`, `genesis`) |
| `name` | Nome em português (ex.: Mateus, Gênesis) |
| `abbrev` | Abreviatura (ex.: Mt, Gn) |
| `testament` | `old` ou `new` |
| `order` | Ordem canónica (1–66) |
| `versesPerChapter` | Array com o número de versículos por capítulo |

A UI usa estes dados para o utilizador escolher livro, capítulo e intervalo de versículos (ex.: Mateus 1:20 ou Mateus 2:1–3) e validar o intervalo.

A geração de histórias envia **apenas a referência** (livro, capítulo, versos) ao LLM, que narra a passagem a partir do seu próprio conhecimento bíblico.

## Fonte dos dados de contagem

As contagens de versículos por capítulo derivam do pacote **ALM1911** do repositório [damarals/biblias](https://github.com/damarals/biblias) (release v1.0.0). **Contagens de versículos não são protegidas por direitos de autor** — apenas o texto integral o seria.

## Tradução de referência

**Almeida 1911** — referência usada na app para identificar a versão (`alm1911`), sem armazenar o texto completo.

## Licença do empacotamento

O formato/empacotamento no repositório damarals/biblias está sob **MIT License**.
