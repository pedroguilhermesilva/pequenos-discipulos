import { describe, expect, it } from 'vitest';
import {
  estimateSwitchLatencyMs,
  LEGACY_PROFILE_SWITCH_PATH,
  OPTIMIZED_PROFILE_SWITCH_PATH,
} from '@/lib/profiles/profile-switch-path';

describe('profile-switch-path', () => {
  it('documents fewer blocking round-trips in the optimised path', () => {
    expect(LEGACY_PROFILE_SWITCH_PATH.blockingServerRoundTrips).toBe(3);
    expect(OPTIMIZED_PROFILE_SWITCH_PATH.blockingServerRoundTrips).toBe(0);
    expect(OPTIMIZED_PROFILE_SWITCH_PATH.backgroundServerRoundTrips).toBe(1);
    expect(LEGACY_PROFILE_SWITCH_PATH.routerRefreshBeforeNav).toBe(1);
    expect(OPTIMIZED_PROFILE_SWITCH_PATH.routerRefreshBeforeNav).toBe(0);
  });

  it('estimates lower time-to-home on the optimised path (preview-like RTT)', () => {
    const previewLike = {
      serverRttMs: 180,
      dbQueryMs: 35,
      routerRefreshMs: 120,
      clientNavMs: 60,
      neonColdStartMs: 400,
    };

    const legacy = estimateSwitchLatencyMs(LEGACY_PROFILE_SWITCH_PATH, previewLike);
    const optimized = estimateSwitchLatencyMs(OPTIMIZED_PROFILE_SWITCH_PATH, previewLike);

    expect(optimized.beforeHomeMs).toBeLessThan(legacy.beforeHomeMs);
    expect(legacy.beforeHomeMs).toBeGreaterThan(1500);
    expect(optimized.beforeHomeMs).toBeLessThan(200);
  });
});
