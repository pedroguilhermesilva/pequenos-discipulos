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

  it('API_KEY_SERVICE_BLOCKED → key restrictions', () => {
    const msg = parseGoogleTtsError(
      403,
      googleError(403, 'PERMISSION_DENIED', 'Requests to this API texttospeech method are blocked.', 'API_KEY_SERVICE_BLOCKED')
    );
    expect(msg).toMatch(/restrições/);
    expect(msg).toContain('API_KEY_SERVICE_BLOCKED');
  });

  it('USER_PROJECT_DENIED → project header/permission', () => {
    const msg = parseGoogleTtsError(
      403,
      googleError(403, 'PERMISSION_DENIED', 'Caller does not have required permission to use project x.', 'USER_PROJECT_DENIED')
    );
    expect(msg).toMatch(/projeto/);
    expect(msg).toContain('USER_PROJECT_DENIED');
  });

  it('aiplatform.endpoints.predict → Gemini-TTS needs IAM permission (service account)', () => {
    const msg = parseGoogleTtsError(
      403,
      googleError(403, 'PERMISSION_DENIED', "Permission 'aiplatform.endpoints.predict' denied on resource.", 'IAM_PERMISSION_DENIED')
    );
    expect(msg).toMatch(/aiplatform/);
    expect(msg).toMatch(/conta de serviço|GOOGLE_TTS_CREDENTIALS_JSON/);
  });

  it('BILLING_DISABLED → billing', () => {
    const msg = parseGoogleTtsError(
      403,
      googleError(403, 'PERMISSION_DENIED', 'This API method requires billing to be enabled.', 'BILLING_DISABLED')
    );
    expect(msg).toMatch(/faturação|faturamento/);
  });

  it('API_KEY_INVALID (400) → invalid key, not "invalid request"', () => {
    const msg = parseGoogleTtsError(
      400,
      googleError(400, 'INVALID_ARGUMENT', 'API key not valid. Please pass a valid API key.', 'API_KEY_INVALID')
    );
    expect(msg).toMatch(/GOOGLE_TTS_API_KEY/);
    expect(msg).toMatch(/inválida/);
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
