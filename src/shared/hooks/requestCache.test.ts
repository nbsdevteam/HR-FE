import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearCache,
  fetchThroughCache,
  invalidateCache,
  invalidateCachePrefix,
  isCacheFresh,
  readCache,
  setCacheError,
  subscribeToCache,
} from "./requestCache";

afterEach(() => {
  clearCache();
});

describe("requestCache", () => {
  it("returns nothing for a key that was never fetched", () => {
    expect(readCache("missing")).toBeUndefined();
    expect(isCacheFresh("missing", 1000)).toBe(false);
  });

  it("stores a fetched list and serves it as fresh within the TTL", async () => {
    await fetchThroughCache("employees", async () => [{ id: "1" }]);

    expect(readCache<{ id: string }>("employees")?.data).toEqual([{ id: "1" }]);
    expect(isCacheFresh("employees", 60_000)).toBe(true);
  });

  it("treats an entry older than the TTL as stale", async () => {
    await fetchThroughCache("employees", async () => [{ id: "1" }]);
    // A zero-length TTL makes any elapsed time stale without faking timers.
    expect(isCacheFresh("employees", 0)).toBe(false);
  });

  it("collapses concurrent callers onto a single in-flight request", async () => {
    const fetcher = vi.fn(async () => [{ id: "1" }]);

    const [a, b, c] = await Promise.all([
      fetchThroughCache("employees", fetcher),
      fetchThroughCache("employees", fetcher),
      fetchThroughCache("employees", fetcher),
    ]);

    // This is the attendance-page case: table + shift assigner both call
    // useEmployees() and must share one roster fetch.
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it("keeps separate keys independent", async () => {
    await fetchThroughCache("employees", async () => [{ id: "e" }]);
    await fetchThroughCache("departments", async () => [{ id: "d" }]);

    expect(readCache<{ id: string }>("employees")?.data).toEqual([{ id: "e" }]);
    expect(readCache<{ id: string }>("departments")?.data).toEqual([{ id: "d" }]);
  });

  it("notifies subscribers when a key's data lands", async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToCache("employees", listener);

    await fetchThroughCache("employees", async () => [{ id: "1" }]);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    await fetchThroughCache("departments", async () => [{ id: "2" }]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("propagates a rejection and leaves nothing cached", async () => {
    const failure = new Error("network down");
    await expect(
      fetchThroughCache("employees", async () => {
        throw failure;
      })
    ).rejects.toThrow("network down");

    expect(readCache("employees")).toBeUndefined();
  });

  it("retries after a failure instead of reusing the dead promise", async () => {
    const fetcher = vi
      .fn<() => Promise<Array<{ id: string }>>>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce([{ id: "1" }]);

    await expect(fetchThroughCache("employees", fetcher)).rejects.toThrow("boom");
    await expect(fetchThroughCache("employees", fetcher)).resolves.toEqual([{ id: "1" }]);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("records an error so every subscriber to the key sees it", () => {
    const listener = vi.fn();
    subscribeToCache("employees", listener);

    setCacheError("employees", "Failed to load employees");

    expect(readCache("employees")).toEqual({ data: [], error: "Failed to load employees" });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("invalidate forces the next read to refetch", async () => {
    const fetcher = vi.fn(async () => [{ id: "1" }]);
    await fetchThroughCache("employees", fetcher);
    expect(isCacheFresh("employees", 60_000)).toBe(true);

    invalidateCache("employees");

    expect(isCacheFresh("employees", 60_000)).toBe(false);
    await fetchThroughCache("employees", fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("invalidateCachePrefix clears a whole family but leaves others alone", async () => {
    await fetchThroughCache("leaveRequests:[1]", async () => [{ id: "a" }]);
    await fetchThroughCache("leaveRequests:[2]", async () => [{ id: "b" }]);
    await fetchThroughCache("employees", async () => [{ id: "c" }]);

    invalidateCachePrefix("leaveRequests");

    expect(isCacheFresh("leaveRequests:[1]", 60_000)).toBe(false);
    expect(isCacheFresh("leaveRequests:[2]", 60_000)).toBe(false);
    expect(isCacheFresh("employees", 60_000)).toBe(true);
  });

  it("clearCache wipes everything — the sign-out path", async () => {
    await fetchThroughCache("employees", async () => [{ id: "1" }]);
    clearCache();
    expect(readCache("employees")).toBeUndefined();
  });
});
