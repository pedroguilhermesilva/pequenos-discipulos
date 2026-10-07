import { SignJWT, importPKCS8 } from 'jose';

type ServiceAccountCredentials = {
  client_email: string;
  private_key: string;
};

let cachedToken: { value: string; expiresAtMs: number } | null = null;

async function fetchAccessToken(credentialsJson: string): Promise<string> {
  const credentials = JSON.parse(credentialsJson) as ServiceAccountCredentials;

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('GOOGLE_TTS_CREDENTIALS_JSON inválido: falta client_email ou private_key.');
  }

  const now = Math.floor(Date.now() / 1000);
  const privateKey = await importPKCS8(credentials.private_key, 'RS256');
  const assertion = await new SignJWT({
    scope: 'https://www.googleapis.com/auth/cloud-platform',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(credentials.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Falha ao obter token Google TTS: ${response.status} ${body}`);
  }

  const payload = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!payload.access_token) {
    throw new Error('Resposta OAuth do Google sem access_token.');
  }

  const expiresInMs = (payload.expires_in ?? 3600) * 1000;
  cachedToken = {
    value: payload.access_token,
    expiresAtMs: Date.now() + expiresInMs - 60_000,
  };

  return payload.access_token;
}

export async function resolveGoogleTtsAuthorization(
  apiKey?: string,
  credentialsJson?: string
): Promise<{ headers: Record<string, string>; urlSuffix: string }> {
  if (apiKey) {
    return {
      headers: { 'Content-Type': 'application/json' },
      urlSuffix: `?key=${encodeURIComponent(apiKey)}`,
    };
  }

  if (credentialsJson) {
    if (cachedToken && cachedToken.expiresAtMs > Date.now()) {
      return {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cachedToken.value}`,
        },
        urlSuffix: '',
      };
    }

    const accessToken = await fetchAccessToken(credentialsJson);
    return {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      urlSuffix: '',
    };
  }

  throw new Error('Google TTS não configurado.');
}

export function resetGoogleTtsAuthCacheForTests() {
  cachedToken = null;
}
