# Pequenos Discípulos — guia para agentes

## Arquitetura

- **Camada de serviços:** `src/lib/services/` — lógica de negócio (equivalente a “use cases” de outros projetos).
- **Repositórios:** `src/lib/repositories/` — acesso Prisma.
- **Server Actions:** `src/lib/**/actions.ts` e rotas em `src/app/api/`.
- **Auth:** NextAuth (Auth.js) em `src/auth.ts`; proteção de rotas e **CSP com nonce** em `src/proxy.ts` (Next 16).
- **Conta vs perfis:** `User` = pais; `ChildProfile` = crianças na conta.

## Comandos

```bash
npm install
npm run db:migrate   # ou: npx prisma migrate deploy
npm run db:seed
npm test
npm run lint
npm run build
npm run test:e2e
npm run test:e2e:csp          # CSP e2e produção (bloqueia scripts maliciosos)
npm run test:e2e:csp-preview  # CSP e2e preview (permite inline do Toolbar)
npm run dev
```

## Variáveis de ambiente

Ver `.env.example`. Obrigatórias em produção: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_URL`.

Opcionais em produção: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (rate limit partilhado); `BLOB_READ_WRITE_TOKEN` (áudio privado no Vercel Blob store `pequenos-discipulos-audio`).

## Bíblia

Índice estático em `data/bible/index.json` — nomes, abreviações, testamentos, contagens de versículos por capítulo. **Sem texto integral no repositório.** A geração envia apenas a referência (livro/capítulo/versos) ao LLM.

## Geração de histórias

`StoryGenerationService`: cache-first (até 3 versões de outros utilizadores, ordenadas por `voteScore`) → LLM. Modo `regenerate` via botão “Gerar novamente”.

## Testes locais (dev)

Utilizador seed: `dev@pequenos-discipulos.local` / `devpassword123` (após `npm run db:seed`).

Roteiro manual: `scripts/manual-test-pr1.md`.

## Documentação de módulos

- Serviços: `src/lib/services/docs/README.md`
