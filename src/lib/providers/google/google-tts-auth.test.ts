import { afterEach, describe, expect, it } from 'vitest';
import {
  resetGoogleTtsAuthCacheForTests,
  resolveGoogleTtsAuthorization,
} from '@/lib/providers/google/google-tts-auth';

describe('resolveGoogleTtsAuthorization', () => {
  afterEach(() => resetGoogleTtsAuthCacheForTests());

  it('with API key, never sends x-goog-user-project (the key project is the quota project)', async () => {
    const auth = await resolveGoogleTtsAuthorization('test-key', undefined, 'demo-project');

    expect(auth.urlSuffix).toBe('?key=test-key');
    expect(auth.headers['x-goog-user-project']).toBeUndefined();
    expect(auth.headers['Content-Type']).toBe('application/json');
  });

  it('throws a clear error when nothing is configured', async () => {
    await expect(resolveGoogleTtsAuthorization()).rejects.toThrow(/não configurado/);
  });
});
