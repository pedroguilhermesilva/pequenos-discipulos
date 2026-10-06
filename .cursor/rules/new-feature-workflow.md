---
description: Fluxo obrigatório para features novas (serviço → testes → código → revisor → docs → QA local)
alwaysApply: true
---

# Nova feature — ordem de trabalho

Ao implementar uma **feature nova** (não bugfix nem refactor isolado), seguir **esta ordem** e não avançar para o passo seguinte sem concluir o anterior.

Não copiar para aqui os checklists das skills: seguir os ficheiros indicados.

## Arquitetura deste repo (referência rápida)

| Camada | Onde |
|--------|------|
| Lógica de negócio | `src/lib/services/` |
| Acesso a dados | `src/lib/repositories/` |
| Wiring / DI | `src/lib/container.ts` |
| Schemas Zod | `src/lib/domain/schemas.ts` |
| Auth (sessão) | `src/auth.ts`, `requireCurrentUser()` em `src/lib/auth/get-current-user.ts` |
| Server Actions | `src/lib/**/actions.ts` (ex.: `profiles/actions.ts`, `stories/library-actions.ts`) |
| Route Handlers | `src/app/api/**/route.ts` |
| UI | `src/app/`, `src/components/` |
| Proteção de rotas | `src/proxy.ts` |

Conta dos pais (`User`) → perfis de crianças (`ChildProfile`) → histórias (`UserStory`). Isolamento por **`userId`** / **`childProfileId`**, não multi-tenant.

## 1. Lógica de negócio (serviço)

- Definir o comportamento em `src/lib/services/<nome>.service.ts` (ou estender serviço existente).
- Um serviço por domínio (ex.: `StoryGenerationService`, `VoteService`, `ChildProfileService`).
- Persistência via repositório em `src/lib/repositories/` — **não** Prisma directo na UI nem nas routes.
- Registar instâncias novas em `src/lib/container.ts`.
- Reutilizar helpers de auth: `requireCurrentUser()`, `getCurrentUserId()`, `getCurrentChildProfileId()`; acções sensíveis de pais → `verifyParentGateToken()` (ver `src/lib/auth/parent-gate.ts`).
- Validar input com schemas de `src/lib/domain/schemas.ts` (ou schema Zod colocado junto ao serviço).

## 2. Unit test

- Escrever testes **antes** da implementação completa da UI/API.
- Colocar ao lado do código: `src/lib/services/<nome>.service.test.ts` (padrão Vitest do repo).
- Cobrir cenários de sucesso, validação e erros relevantes.
- Mockar dependências externas (Prisma, LLM, ElevenLabs, etc.) como nos testes existentes — ver `vitest.setup.ts` para mock de `@/auth`.

## 3. Funcionalidades

- Implementar o serviço até satisfazer os testes.
- Expor via **Server Action** (`src/lib/**/actions.ts`) e/ou **Route Handler** (`src/app/api/**/route.ts`) conforme o fluxo:
  - Mutações autenticadas: chamar `requireCurrentUser()` na action/route **antes** do serviço.
  - Geração de histórias: `POST /api/stories/generate` → `container.services.storyGeneration`.
  - Votos/aprovações: `POST /api/votes` com parent gate no servidor.
- Ligar UI em `src/app/` e `src/components/`.
- Manter regras de negócio nos **serviços** — não duplicar na camada de apresentação nem confiar em flags do cliente (`parentUnlocked`, etc.).

## 4. Correr os unit tests

```bash
npm test
# ou, escopo da feature:
npm test -- src/lib/services/<nome>.service.test.ts
```

- Corrigir falhas antes de avançar.
- Só avançar para o revisor quando os testes da nova funcionalidade passarem.

## 5. Revisor das falhas comuns (IA)

- Seguir `.cursor/skills/revisor-falhas-ia/SKILL.md` (adaptado a esta arquitetura).
- Âmbito = **diff desta feature** (ficheiros tocados), não o repositório inteiro.
- Findings **introduzidos ou tocados** por esta feature: corrigir, voltar a correr o revisor, e re-correr os unit tests do passo 4 se o código mudou. Repetir até não haver findings novos neste âmbito.
- Findings sistémicos **já existentes** (não causados por esta feature) não bloqueiam o avanço; não os corrigir neste passo.
- Sem findings novos no âmbito → passo seguinte.

## 6. Atualizar documentação

- **`AGENTS.md`** — comandos, env vars, arquitectura geral (se a feature mudar algo global).
- **`src/lib/services/docs/README.md`** — serviços novos/alterados, rotas API, schemas, auth/parent gate, variáveis de ambiente.
- Documentação específica de domínio quando fizer sentido (ex.: `data/bible/README.md` para texto bíblico).
- Incluir: serviços, rotas/actions, modelos Prisma tocados, env vars novas.

## 7. Como testar em local (gate humano)

- Entregar um roteiro para ambiente local: como arrancar, que utilizador/dados usar, que ecrãs abrir, caso feliz e casos de erro/aviso.
- Referência mínima:

```bash
cp .env.example .env   # DATABASE_URL, DIRECT_URL, AUTH_SECRET
npm install && npm run db:migrate && npm run db:seed
npm run dev
# Login seed: dev@pequenos-discipulos.local / devpassword123
```

- **Parar aqui.** Não avançar (deploy, merge, etc.) até o utilizador confirmar que os testes manuais passaram (ou pedir para saltar este gate).

## Checklist rápido

- [ ] Serviço (e repositório, se necessário) em `src/lib/services/` + registo em `container.ts`
- [ ] Unit test em `src/lib/**/*.test.ts`
- [ ] UI / Server Actions / rotas API integrados com auth no servidor
- [ ] `npm test` a passar
- [ ] Revisor limpo no âmbito da feature (`.cursor/skills/revisor-falhas-ia/SKILL.md`)
- [ ] `AGENTS.md` e/ou `src/lib/services/docs/README.md` actualizados
- [ ] Roteiro local entregue e testes manuais confirmados pelo utilizador
