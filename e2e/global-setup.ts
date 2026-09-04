import { execSync } from 'node:child_process';

const DEFAULT_DATABASE_URL =
  'postgresql://postgres:postgres@localhost:5432/pequenos_discipulos';

export default async function globalSetup() {
  const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
  const env = { ...process.env, DATABASE_URL: databaseUrl };

  execSync('npx prisma migrate deploy', { stdio: 'inherit', env });
  execSync('npx prisma db seed', { stdio: 'inherit', env });
}
