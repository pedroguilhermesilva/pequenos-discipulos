import { SignJWT, importPKCS8 } from 'jose';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CLOUD_PLATFORM_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

export type ServiceAccountCredentials = {
  client_email: string;
  private_key: string;
  project_id?: string;
};

export type GoogleAuthMode = 'service-account' | 'api-key';

export type GoogleTtsAuthorization = {
  mode: GoogleAuthMode;
  headers: Record<string, string>;
  urlSuffix: string;
};

const tokenCache = new Map<string, { value: string; expiresAtMs: number }>();

/**
 * Escapa quebras de linha/tabs reais que estejam DENTRO de strings JSON
 * (ex.: private_key colada com quebras de linha reais na Vercel), mantendo
 * as que estão fora das strings como espaço em branco normal.
 */
function escapeControlCharsInsideStrings(input: string): string {
  let output = '';
  let inString = false;
  let escaped = false;

  for (const char of input) {
    if (inString) {
      if (escaped) {
        escaped = false;
        output += char;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        output += char;
        continue;
      }
      if (char === '"') {
        inString = false;
        output += char;
        continue;
      }
      if (char === '\n') {
        output += '\\n';
        continue;
      }
      if (char === '\r') continue;
      if (char === '\t') {
        output += '\\t';
        continue;
      }
      output += char;
      continue;
    }

    if (char === '"') inString = true;
    output += char;
  }

  return output;
}

function parseLooseJson(raw: string): unknown {
  let text = raw.trim();
  if (
    (text.startsWith("'") && text.endsWith("'")) ||
    (text.startsWith('`') && text.endsWith('`'))
  ) {
    text = text.slice(1, -1).trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = JSON.parse(escapeControlCharsInsideStrings(text));
  }

  // Valor guardado como string JSON ("{\"type\":...}") → decodificar outra vez.
  if (typeof parsed === 'string') {
    return parseLooseJson(parsed);
  }
  return parsed;
}

function normalizePrivateKey(key: string): string {
  return key.replace(/\\r\\n|\\n/g, '\n').replace(/\r\n/g, '\n');
}

/** Lê o JSON da service account tolerando o formato guardado na Vercel. */
export function parseServiceAccountCredentials(credentialsJson: string): ServiceAccountCredentials {
  let parsed: unknown;
  try {
    parsed = parseLooseJson(credentialsJson);
  } catch {
    throw new Error('GOOGLE_TTS_CREDENTIALS_JSON inválido: não é um JSON válido.');
  }

  const data = (parsed ?? {}) as Partial<Record<keyof ServiceAccountCredentials, unknown>>;
  const clientEmail = typeof data.client_email === 'string' ? data.client_email.trim() : '';
  const privateKey = typeof data.private_key === 'string' ? normalizePrivateKey(data.private_key) : '';

  if (!clientEmail || !privateKey) {
    throw new Error('GOOGLE_TTS_CREDENTIALS_JSON inválido: falta client_email ou private_key.');
  }

  const projectId = typeof data.project_id === 'string' ? data.project_id.trim() || undefined : undefined;
  return { client_email: clientEmail, private_key: privateKey, project_id: projectId };
}

async function getAccessToken(credentials: ServiceAccountCredentials): Promise<string> {
  const cached = tokenCache.get(credentials.client_email);
  if (cached && cached.expiresAtMs > Date.now()) {
    return cached.value;
  }

  const now = Math.floor(Date.now() / 1000);
  const privateKey = await importPKCS8(credentials.private_key, 'RS256');
  const assertion = await new SignJWT({ scope: CLOUD_PLATFORM_SCOPE })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(credentials.client_email)
    .setAudience(TOKEN_URL)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Falha ao obter token Google (service account): ${response.status} ${body.slice(0, 300)}`);
  }

  const payload = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!payload.access_token) {
    throw new Error('Resposta OAuth do Google sem access_token.');
  }

  const expiresInMs = (payload.expires_in ?? 3600) * 1000;
  tokenCache.set(credentials.client_email, {
    value: payload.access_token,
    expiresAtMs: Date.now() + expiresInMs - 60_000,
  });

  return payload.access_token;
}

export function extractGoogleProjectId(credentialsJson?: string): string | undefined {
  if (!credentialsJson) return undefined;
  try {
    return parseServiceAccountCredentials(credentialsJson).project_id;
  } catch {
    try {
      const loose = parseLooseJson(credentialsJson) as { project_id?: unknown };
      return typeof loose?.project_id === 'string' ? loose.project_id.trim() || undefined : undefined;
    } catch {
      return undefined;
    }
  }
}

/**
 * Autorização para APIs Google (TTS / Speech-to-Text).
 * Prioridade: service account (GOOGLE_TTS_CREDENTIALS_JSON) → API key.
 * O Gemini-TTS exige identidade IAM (aiplatform.endpoints.predict), que só a service account tem.
 */
export async function resolveGoogleTtsAuthorization(
  apiKey?: string,
  credentialsJson?: string,
  projectId?: string
): Promise<GoogleTtsAuthorization> {
  if (credentialsJson?.trim()) {
    let credentials: ServiceAccountCredentials | null = null;
    try {
      credentials = parseServiceAccountCredentials(credentialsJson);
    } catch (error) {
      if (!apiKey) throw error;
      console.error(
        `[GoogleAuth] ${(error as Error).message} A usar GOOGLE_TTS_API_KEY como alternativa (o Gemini-TTS pode recusar).`
      );
    }

    if (credentials) {
      const accessToken = await getAccessToken(credentials);
      const billingProject = projectId?.trim() || credentials.project_id;
      return {
        mode: 'service-account',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          ...(billingProject ? { 'x-goog-user-project': billingProject } : {}),
        },
        urlSuffix: '',
      };
    }
  }

  if (apiKey) {
    // Com API key, o projeto da própria chave é o projeto de quota/faturação.
    // x-goog-user-project exige uma identidade IAM com serviceusage.services.use,
    // que uma API key não tem — enviá-lo pode causar 403 (USER_PROJECT_DENIED).
    return {
      mode: 'api-key',
      headers: { 'Content-Type': 'application/json' },
      urlSuffix: `?key=${encodeURIComponent(apiKey)}`,
    };
  }

  throw new Error('Google TTS não configurado.');
}

export function resetGoogleTtsAuthCacheForTests() {
  tokenCache.clear();
}
