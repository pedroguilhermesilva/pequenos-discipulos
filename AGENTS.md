# AGENTS.md

## Cursor Cloud specific instructions

### Overview

**Pequenos Discípulos** is a single Next.js 16 application (App Router, React 19, TypeScript, Tailwind CSS 3) for children's Bible education. It uses Supabase as a BaaS for auth and data persistence.

### Running the app

- `npm run dev` starts the dev server on `http://localhost:3000`
- The app has graceful Supabase fallback stubs in `src/lib/supabase-browser.ts` and `src/lib/supabase-server.ts`; all pages render and navigate without Supabase credentials.
- The login page (`/login`) has a **"Acessar em Modo de Desenvolvimento"** bypass button that skips auth and navigates directly to the onboarding flow.

### Environment variables

- Copy `.env.example` to `.env.local`. Leave values **empty** (not the placeholder strings) so the Supabase fallback stubs activate. Using the placeholder strings (e.g. `your-supabase-url`) causes build failures because they pass the truthy check but fail URL validation in `@supabase/ssr`.

### Linting

- `npm run lint` calls `next lint`, which was **removed in Next.js 16**. The project's `.eslintrc.json` (legacy format) is also incompatible with ESLint 9 (flat config only). These are pre-existing repo issues; TypeScript type-checking (`npx tsc --noEmit`) passes cleanly.

### Testing

- No test framework is configured (`package.json` has no test script).
- Manual testing can be done via the dev mode bypass on the login page.

### Build

- `npm run build` works when `.env.local` has empty Supabase values (not placeholders).
