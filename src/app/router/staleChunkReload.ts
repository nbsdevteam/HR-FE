const STALE_RELOAD_KEY = "hr-stale-chunk-reload";

/**
 * True for the "Failed to fetch dynamically imported module" / "Importing a
 * module script failed" errors the browser and Vite throw when a route
 * chunk from a previous deploy no longer exists on the server (a tab left
 * open across a deploy still references the old build's chunk hashes).
 */
export const isStaleChunkError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return /fetch dynamically imported module|importing a module script failed/i.test(message);
};

/**
 * Reloads the tab once per session to pick up a fresh deploy's asset map.
 * Returns false without reloading if this session already tried it, so a
 * genuinely broken deploy doesn't loop forever.
 */
export const reloadForStaleChunk = (): boolean => {
  if (sessionStorage.getItem(STALE_RELOAD_KEY)) return false;
  sessionStorage.setItem(STALE_RELOAD_KEY, "1");
  window.location.reload();
  return true;
};

/**
 * Once the app has been stable for a bit, allow a future stale-chunk reload
 * again (e.g. if another deploy ships later in the same session).
 */
export const armStaleChunkReloadReset = (): void => {
  window.setTimeout(() => sessionStorage.removeItem(STALE_RELOAD_KEY), 10000);
};
