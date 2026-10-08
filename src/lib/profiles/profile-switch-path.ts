/**
 * Documented server/client steps for switching the active child profile.
 * Used for benchmarks, tests, and performance regression checks.
 */

export type ProfileSwitchPathMetrics = {
  label: string;
  /** Server actions awaited before client navigation */
  blockingServerRoundTrips: number;
  /** Fire-and-forget server work after navigation */
  backgroundServerRoundTrips: number;
  /** Postgres queries inside blocking work (approx.) */
  blockingDbQueries: number;
  /** Postgres queries triggered after /home mounts (library, etc.) */
  postNavigationDbQueries: number;
  /** Calls to router.refresh() before navigation */
  routerRefreshBeforeNav: number;
};

/** Path before perf optimisations (PR #29 initial fix). */
export const LEGACY_PROFILE_SWITCH_PATH: ProfileSwitchPathMetrics = {
  label: 'legacy',
  blockingServerRoundTrips: 3,
  backgroundServerRoundTrips: 0,
  blockingDbQueries: 6,
  postNavigationDbQueries: 3,
  routerRefreshBeforeNav: 1,
};

/** Optimised path: optimistic client state + one background cookie write. */
export const OPTIMIZED_PROFILE_SWITCH_PATH: ProfileSwitchPathMetrics = {
  label: 'optimized',
  blockingServerRoundTrips: 0,
  backgroundServerRoundTrips: 1,
  blockingDbQueries: 0,
  postNavigationDbQueries: 1,
  routerRefreshBeforeNav: 0,
};

export function estimateSwitchLatencyMs(
  metrics: ProfileSwitchPathMetrics,
  options: {
    serverRttMs: number;
    dbQueryMs: number;
    routerRefreshMs: number;
    clientNavMs: number;
    neonColdStartMs?: number;
  }
): { beforeHomeMs: number; libraryMs: number; totalMs: number } {
  const cold = options.neonColdStartMs ?? 0;
  const blockingActions =
    metrics.blockingServerRoundTrips * (options.serverRttMs + cold);
  const blockingDb = metrics.blockingDbQueries * options.dbQueryMs;
  const refresh = metrics.routerRefreshBeforeNav * options.routerRefreshMs;
  const beforeHomeMs = blockingActions + blockingDb + refresh + options.clientNavMs;

  const backgroundActions =
    metrics.backgroundServerRoundTrips * (options.serverRttMs + cold);
  const backgroundDb = metrics.backgroundServerRoundTrips * 1 * options.dbQueryMs;
  const postNavDb = metrics.postNavigationDbQueries * options.dbQueryMs;
  const libraryMs = backgroundActions + backgroundDb + postNavDb;

  return {
    beforeHomeMs,
    libraryMs,
    totalMs: beforeHomeMs + libraryMs,
  };
}
