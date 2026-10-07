import { NextResponse } from 'next/server';

/**
 * E2E-only HTML fixture with deliberately unsafe script tags.
 * Enabled when E2E_CSP_FIXTURE=1 (Playwright production CSP tests).
 */
export async function GET() {
  if (process.env.E2E_CSP_FIXTURE !== '1') {
    return new NextResponse('Not Found', { status: 404 });
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>CSP fixture</title>
  </head>
  <body>
    <h1>CSP fixture</h1>
    <script src="https://example.com/x.js"></script>
    <script>window.__cspInlineProbe = true;</script>
  </body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
