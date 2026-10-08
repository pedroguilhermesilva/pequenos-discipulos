import { generateKeyPairSync } from 'node:crypto';
import { decodeJwt } from 'jose';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  extractGoogleProjectId,
  parseServiceAccountCredentials,
  resetGoogleTtsAuthCacheForTests,
  resolveGoogleTtsAuthorization,
} from '@/lib/providers/google/google-tts-auth';

const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const PEM = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

function serviceAccount(overrides: Record<string, string> = {}) {
  return {
    type: 'service_account',
    project_id: 'tts-test-507913',
    client_email: 'tts@tts-test-507913.iam.gserviceaccount.com',
    private_key: PEM,
    ...overrides,
  };
}

/** Mimics `JSON.stringify(..., null, 2)` — raw multi-line JSON as pasted into Vercel. */
const RAW_MULTILINE_JSON = JSON.stringify(serviceAccount(), null, 2);

describe('parseServiceAccountCredentials', () => {
  it('parses raw multi-line JSON', () => {
    const creds = parseServiceAccountCredentials(RAW_MULTILINE_JSON);
    expect(creds.client_email).toBe('tts@tts-test-507913.iam.gserviceaccount.com');
    expect(creds.project_id).toBe('tts-test-507913');
    expect(creds.private_key).toBe(PEM);
  });

  it('turns literal "\\n" sequences in private_key into real newlines', () => {
    const escapedKey = PEM.replace(/\n/g, '\\n');
    const json = JSON.stringify(serviceAccount({ private_key: escapedKey }));
    expect(json).toContain('\\\\n'); // really a backslash + n inside the value

    const creds = parseServiceAccountCredentials(json);
    expect(creds.private_key).toBe(PEM);
    expect(creds.private_key).not.toContain('\\n');
  });

  it('tolerates real newlines inside the private_key string (invalid strict JSON)', () => {
    const broken = `{\n  "type": "service_account",\n  "project_id": "tts-test-507913",\n  "client_email": "tts@tts-test-507913.iam.gserviceaccount.com",\n  "private_key": "${PEM}"\n}`;
    expect(() => JSON.parse(broken)).toThrow();

    const creds = parseServiceAccountCredentials(broken);
    expect(creds.private_key.trim()).toBe(PEM.trim());
  });

  it('tolerates the JSON wrapped in quotes or as a JSON string', () => {
    expect(parseServiceAccountCredentials(`'${RAW_MULTILINE_JSON}'`).client_email).toContain('@');
    expect(parseServiceAccountCredentials(JSON.stringify(RAW_MULTILINE_JSON)).client_email).toContain('@');
  });

  it('throws a clear Portuguese error when fields are missing', () => {
    expect(() => parseServiceAccountCredentials('{"project_id":"x"}')).toThrow(/client_email ou private_key/);
    expect(() => parseServiceAccountCredentials('não é json')).toThrow(/GOOGLE_TTS_CREDENTIALS_JSON/);
  });

  it('extractGoogleProjectId works with the tolerant parser', () => {
    expect(extractGoogleProjectId(RAW_MULTILINE_JSON)).toBe('tts-test-507913');
    expect(extractGoogleProjectId('lixo')).toBeUndefined();
  });
});

describe('resolveGoogleTtsAuthorization', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'ya29.token', expires_in: 3600 }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetGoogleTtsAuthCacheForTests();
  });

  it('uses the service account: Bearer token + x-goog-user-project from the JSON project_id, no ?key=', async () => {
    const auth = await resolveGoogleTtsAuthorization(RAW_MULTILINE_JSON);

    expect(auth).not.toHaveProperty('urlSuffix');
    expect(auth.headers.Authorization).toBe('Bearer ya29.token');
    expect(auth.headers['x-goog-user-project']).toBe('tts-test-507913');
    expect(auth.headers['Content-Type']).toBe('application/json');
  });

  it('uses GOOGLE_CLOUD_PROJECT_ID (projectId arg) over the JSON project_id for the header', async () => {
    const auth = await resolveGoogleTtsAuthorization(RAW_MULTILINE_JSON, 'other-project');
    expect(auth.headers['x-goog-user-project']).toBe('other-project');
  });

  it('requests the cloud-platform scope via JWT bearer grant', async () => {
    await resolveGoogleTtsAuthorization(RAW_MULTILINE_JSON);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://oauth2.googleapis.com/token');
    const body = new URLSearchParams(String(init.body));
    expect(body.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
    const claims = decodeJwt(body.get('assertion')!);
    expect(claims.scope).toBe('https://www.googleapis.com/auth/cloud-platform');
    expect(claims.iss).toBe('tts@tts-test-507913.iam.gserviceaccount.com');
    expect(claims.aud).toBe('https://oauth2.googleapis.com/token');
  });

  it('caches the access token until it expires', async () => {
    await resolveGoogleTtsAuthorization(RAW_MULTILINE_JSON);
    await resolveGoogleTtsAuthorization(RAW_MULTILINE_JSON);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 3600 * 1000);
    await resolveGoogleTtsAuthorization(RAW_MULTILINE_JSON);
    vi.useRealTimers();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('unusable JSON → clear TTS_NOT_CONFIGURED error (no fallback)', async () => {
    await expect(resolveGoogleTtsAuthorization('{"project_id":"x"}')).rejects.toMatchObject({
      code: 'TTS_NOT_CONFIGURED',
      message: expect.stringMatching(/client_email ou private_key/),
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('missing JSON → "Narração não configurada: falta GOOGLE_TTS_CREDENTIALS_JSON"', async () => {
    await expect(resolveGoogleTtsAuthorization(undefined)).rejects.toMatchObject({
      code: 'TTS_NOT_CONFIGURED',
      message: expect.stringContaining('Narração não configurada: falta GOOGLE_TTS_CREDENTIALS_JSON'),
    });
    await expect(resolveGoogleTtsAuthorization('   ')).rejects.toMatchObject({ code: 'TTS_NOT_CONFIGURED' });
  });
});
