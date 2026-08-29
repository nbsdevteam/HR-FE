import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAsyncList } from "./useAsyncList";
import { clearCache } from "./requestCache";

afterEach(() => {
  clearCache();
});

describe("useAsyncList", () => {
  it("loads data on mount and clears the loading flag", async () => {
    const { result } = renderHook(() =>
      useAsyncList(async () => [{ id: "1" }], [], "failed", undefined, { cacheKey: "employees" })
    );

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([{ id: "1" }]);
    expect(result.current.error).toBeNull();
  });

  it("shares one request between two hooks using the same cache key", async () => {
    const fetcher = vi.fn(async () => [{ id: "1" }]);

    // Mirrors the attendance page: the table and the shift assigner both call
    // useEmployees(), which previously fetched the roster twice.
    const first = renderHook(() =>
      useAsyncList(fetcher, [], "failed", undefined, { cacheKey: "employees" })
    );
    const second = renderHook(() =>
      useAsyncList(fetcher, [], "failed", undefined, { cacheKey: "employees" })
    );

    await waitFor(() => expect(first.result.current.loading).toBe(false));
    await waitFor(() => expect(second.result.current.loading).toBe(false));

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(first.result.current.data).toEqual([{ id: "1" }]);
    expect(second.result.current.data).toEqual([{ id: "1" }]);
  });

  it("serves a remount from cache without refetching", async () => {
    const fetcher = vi.fn(async () => [{ id: "1" }]);

    const first = renderHook(() =>
      useAsyncList(fetcher, [], "failed", undefined, { cacheKey: "employees" })
    );
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    first.unmount();

    // Navigating back to a page must not re-run its fetches.
    const second = renderHook(() =>
      useAsyncList(fetcher, [], "failed", undefined, { cacheKey: "employees" })
    );

    expect(second.result.current.loading).toBe(false);
    expect(second.result.current.data).toEqual([{ id: "1" }]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("caches different dep values separately", async () => {
    const fetcher = vi.fn(async (employeeId: string) => [{ id: employeeId }]);

    const a = renderHook(() =>
      useAsyncList(() => fetcher("e1"), ["e1"], "failed", undefined, { cacheKey: "contracts" })
    );
    const b = renderHook(() =>
      useAsyncList(() => fetcher("e2"), ["e2"], "failed", undefined, { cacheKey: "contracts" })
    );

    await waitFor(() => expect(a.result.current.loading).toBe(false));
    await waitFor(() => expect(b.result.current.loading).toBe(false));

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(a.result.current.data).toEqual([{ id: "e1" }]);
    expect(b.result.current.data).toEqual([{ id: "e2" }]);
  });

  it("refetch bypasses the cache and re-runs the fetcher", async () => {
    let calls = 0;
    const fetcher = vi.fn(async () => {
      calls += 1;
      return [{ id: String(calls) }];
    });

    const { result } = renderHook(() =>
      useAsyncList(fetcher, [], "failed", undefined, { cacheKey: "employees" })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([{ id: "1" }]);

    await result.current.refetch();

    await waitFor(() => expect(result.current.data).toEqual([{ id: "2" }]));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("surfaces the fallback message when the fetcher rejects", async () => {
    const { result } = renderHook(() =>
      useAsyncList(
        async () => {
          throw new Error("");
        },
        [],
        "Failed to load employees",
        undefined,
        { cacheKey: "employees" }
      )
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Failed to load employees");
    expect(result.current.data).toEqual([]);
  });

  it("refetches on every mount when no cache key is given", async () => {
    const fetcher = vi.fn(async () => [{ id: "1" }]);

    const first = renderHook(() => useAsyncList(fetcher, []));
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    first.unmount();

    const second = renderHook(() => useAsyncList(fetcher, []));
    await waitFor(() => expect(second.result.current.loading).toBe(false));

    // Opting out of caching must preserve the original always-refetch behaviour.
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
