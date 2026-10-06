# Bíblia em português (dados estáticos)

## Tradução

**Almeida 1911** — *Bíblia Sagrada Traduzida em Portuguez por João Ferreira de Almeida* (reimpressão de 1911).

## Fonte dos dados

Pacote **ALM1911.json** do repositório [damarals/biblias](https://github.com/damarals/biblias) (release v1.0.0).

## Licença do texto bíblico

**Domínio público.** A tradução de João Ferreira de Almeida (edição de 1911) é uma obra histórica em domínio público; o repositório damarals/biblias marca esta versão com † (domínio público) como redistribuível livremente.

Referências adicionais:

- [CrossWire PorAlmeida1911](https://www.crosswire.org/sword/modules/ModInfo.jsp?modName=PorAlmeida1911) — módulo SWORD, GPL (empacotamento); texto Almeida 1911.
- [bibliaalmeida.com](https://bibliaalmeida.com/) — confirma domínio público integral da Almeida 1911.

## Licença do ficheiro JSON

O formato/empacotamento no repositório damarals/biblias está sob **MIT License**.

## Formato

Array de 66 livros (ordem protestante canónica), cada um com:

```json
{ "abbrev": "Mt", "chapters": [["v1 cap1", "v2 cap1"], ["v1 cap2"]] }
```

Os versículos são indexados a partir de 1 dentro de cada capítulo.
