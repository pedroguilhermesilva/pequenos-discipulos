---
description: Fluxo obrigatório para features novas (use case → testes → código → revisor → docs → QA local → Asana)
alwaysApply: true
---

# Nova feature — ordem de trabalho

Ao implementar uma **feature nova** (não bugfix nem refactor isolado), seguir **esta ordem** e não avançar para o passo seguinte sem concluir o anterior.

Não copiar para aqui os checklists das skills: seguir os ficheiros indicados.

## 1. Use case

- Definir o comportamento de negócio em `src/use-cases/<modulo>/`.
- Um ficheiro por ação (ex.: `create-booking.ts`, `send-email-campaign.ts`).
- Reutilizar helpers partilhados (`require-tenant-context`, `requirePermission`, etc.).
- Exportar no `index.ts` do módulo quando aplicável.

## 2. Unit test

- Escrever testes **antes** da implementação completa da UI/API.
- Colocar em `tests/unit/use-cases/<nome-do-use-case>.test.ts`.
- Cobrir cenários de sucesso, validação e erros relevantes.
- Mockar dependências externas (Prisma, Resend, etc.) como nos testes existentes.

## 3. Funcionalidades

- Implementar o use case até satisfazer os testes.
- Ligar a UI (`app/`), Server Actions (`actions.ts`) e/ou rotas API conforme o módulo.
- Manter a lógica de negócio nos use cases — não duplicar regras na camada de apresentação.

## 4. Correr os unit tests

- Executar `npm test` (ou `npm test -- tests/unit/use-cases/<ficheiro>.test.ts` para o escopo da feature).
- Corrigir falhas antes de avançar.
- Só avançar para o revisor quando os testes da nova funcionalidade passarem.

## 5. Revisor das falhas comuns (IA)

- Seguir `.cursor/skills/revisor-falhas-ia/SKILL.md`.
- Âmbito = **diff desta feature** (ficheiros tocados), não o repositório inteiro.
- Findings **introduzidos ou tocados** por esta feature: corrigir, voltar a correr o revisor, e re-correr os unit tests do passo 4 se o código mudou. Repetir até não haver findings novos neste âmbito.
- Findings sistémicos **já existentes** (não causados por esta feature) não bloqueiam o avanço; não os corrigir neste passo.
- Sem findings novos no âmbito → passo seguinte.

## 6. Atualizar documentação

- Atualizar `src/modules/<modulo>/docs/README.md` do módulo afetado.
- Incluir: use cases novos, rotas, entidades, permissões e variáveis de ambiente se mudarem.
- Criar `docs/README.md` no módulo se ainda não existir.

## 7. Como testar em local (gate humano)

- Entregar um roteiro para ambiente local: como arrancar, que utilizador/dados usar, que ecrãs abrir, caso feliz e casos de erro/aviso.
- Pode ser técnico (comandos, seed). Não é o texto Asana.
- **Parar aqui.** Não avançar para o passo 8 até o utilizador confirmar que os testes manuais passaram (ou pedir para saltar este gate).

## Checklist rápido

- [ ] Use case criado em `src/use-cases/`
- [ ] Unit test escrito em `tests/unit/`
- [ ] UI/API/actions integrados
- [ ] `npm test` a passar
- [ ] Revisor limpo no âmbito da feature (skills/revisor-falhas-ia)
- [ ] Docs do módulo atualizadas
- [ ] Roteiro local entregue e testes manuais confirmados pelo utilizador
