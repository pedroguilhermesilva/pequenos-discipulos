# Pequenos Discípulos — guia para agentes

## Arquitetura

- **Camada de serviços:** `src/lib/services/` — lógica de negócio (equivalente a “use cases” de outros projetos).
- **Repositórios:** `src/lib/repositories/` — acesso Prisma.
- **Server Actions:** `src/lib/**/actions.ts` e rotas em `src/app/api/`.
- **Auth:** NextAuth (Auth.js) em `src/auth.ts`; proteção de rotas em `src/proxy.ts` (Next 16).
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
npm run dev
```

## Variáveis de ambiente

Ver `.env.example`. Obrigatórias em produção: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_URL`.

## Bíblia

Texto estático **Almeida 1911 (ALM1911)** em `data/bible/ALM1911.json` — domínio público ([damarals/biblias](https://github.com/damarals/biblias)). Provider: `LocalBibleTextProvider`.

## Geração de histórias

`StoryGenerationService`: cache-first (até 3 versões de outros utilizadores) → LLM. Modo `regenerate` via botão “Gerar novamente”.

## Testes locais (dev)

Utilizador seed: `dev@pequenos-discipulos.local` / `devpassword123` (após `npm run db:seed`).

## Documentação de módulos

- Serviços: `src/lib/services/docs/README.md`
