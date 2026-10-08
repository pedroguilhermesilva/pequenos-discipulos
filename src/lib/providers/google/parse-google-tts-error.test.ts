import { describe, expect, it } from 'vitest';
import {
  describeGoogleApiError,
  parseGoogleTtsError,
} from '@/lib/providers/google/parse-google-tts-error';

function googleError(code: number, status: string, message: string, reason?: string) {
  return JSON.stringify({
    error: {
      code,
      status,
      message,
      details: reason
        ? [{ '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason, domain: 'googleapis.com' }]
        : [],
    },
  });
}

describe('describeGoogleApiError', () => {
  it('extracts status, reason and message from a Google error body', () => {
    const info = describeGoogleApiError(
      403,
      googleError(403, 'PERMISSION_DENIED', 'Caller does not have required permission to use project x.', 'USER_PROJECT_DENIED')
    );

    expect(info).toEqual({
      httpStatus: 403,
      status: 'PERMISSION_DENIED',
      reason: 'USER_PROJECT_DENIED',
      message: 'Caller does not have required permission to use project x.',
    });
  });

  it('handles non-JSON bodies and redacts API keys', () => {
    const info = describeGoogleApiError(500, 'boom key=AIzaSySECRET123 &key=abc');
    expect(info.message).not.toContain('AIzaSySECRET123');
    expect(info.message).toContain('key=[redacted]');
    expect(info.reason).toBeUndefined();
  });
});

describe('parseGoogleTtsError', () => {
  it('SERVICE_DISABLED → API not enabled', () => {
    const msg = parseGoogleTtsError(
      403,
      googleError(403, 'PERMISSION_DENIED', 'Cloud Text-to-Speech API has not been used in project 123 before or it is disabled.', 'SERVICE_DISABLED')
    );
    expect(msg).toMatch(/não está ativada/);
    expect(msg).toContain('SERVICE_DISABLED');
  });

  it('USER_PROJECT_DENIED → project header/permission', () => {
    const msg = parseGoogleTtsError(
      403,
      googleError(403, 'PERMISSION_DENIED', 'Caller does not have required permission to use project x.', 'USER_PROJECT_DENIED')
    );
    expect(msg).toMatch(/projeto/);
    expect(msg).toContain('USER_PROJECT_DENIED');
  });

  it('aiplatform.endpoints.predict / IAM_PERMISSION_DENIED → service account needs "Usuário da Plataforma de Agentes"', () => {
    const msg = parseGoogleTtsError(
      403,
      googleError(403, 'PERMISSION_DENIED', "Permission 'aiplatform.endpoints.predict' denied on resource.", 'IAM_PERMISSION_DENIED')
    );
    expect(msg).toContain('Usuário da Plataforma de Agentes');
    expect(msg).toContain('aiplatform.user');
    expect(msg).toMatch(/Vertex AI User/);
    expect(msg).toMatch(/conta de serviço/);
    expect(msg).not.toMatch(/chave de API|API key|GOOGLE_TTS_API_KEY/i);
  });

  it('no message ever suggests an API key', () => {
    const cases: Array<[number, string | undefined, string]> = [
      [403, 'SERVICE_DISABLED', 'disabled'],
      [403, 'USER_PROJECT_DENIED', 'Caller does not have required permission to use project x.'],
      [403, 'BILLING_DISABLED', 'billing'],
      [403, 'API_KEY_SERVICE_BLOCKED', 'blocked'],
      [400, 'API_KEY_INVALID', 'API key not valid.'],
      [401, 'ACCESS_TOKEN_EXPIRED', 'Request had invalid authentication credentials.'],
    ];
    for (const [status, reason, message] of cases) {
      expect(parseGoogleTtsError(status, googleError(status, 'X', message, reason))).not.toMatch(/GOOGLE_TTS_API_KEY|chave/i);
    }
  });

  it('BILLING_DISABLED → billing', () => {
    const msg = parseGoogleTtsError(
      403,
      googleError(403, 'PERMISSION_DENIED', 'This API method requires billing to be enabled.', 'BILLING_DISABLED')
    );
    expect(msg).toMatch(/faturação|faturamento/);
  });

  it('401 invalid credentials → points to GOOGLE_TTS_CREDENTIALS_JSON', () => {
    const msg = parseGoogleTtsError(
      401,
      googleError(401, 'UNAUTHENTICATED', 'Request had invalid authentication credentials.')
    );
    expect(msg).toContain('GOOGLE_TTS_CREDENTIALS_JSON');
  });

  it('unknown 403 includes Google status and message instead of a generic guess', () => {
    const msg = parseGoogleTtsError(403, googleError(403, 'PERMISSION_DENIED', 'Something else.'));
    expect(msg).toContain('403');
    expect(msg).toContain('Something else.');
  });

  it('400 with a generic message includes Google message', () => {
    const msg = parseGoogleTtsError(400, googleError(400, 'INVALID_ARGUMENT', 'Voice Leda not found.'));
    expect(msg).toContain('Voice Leda not found.');
  });

  it('429 → quota', () => {
    expect(parseGoogleTtsError(429, '')).toMatch(/Limite/);
  });
});
