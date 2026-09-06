import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useAsyncList } from "./useAsyncList";
import { useOdooMutation } from "./useOdooMutation";

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper };
};

describe("useOdooMutation", () => {
  it("invalidates every list sharing the cache key after a successful mutation", async () => {
    const { wrapper } = createWrapper();
    let version = 0;
    const listFetcher = vi.fn(async () => {
      version += 1;
      return [{ id: String(version) }];
    });

    const { result } = renderHook(
      () => ({
        list: useAsyncList(listFetcher, [], "failed", undefined, { cacheKey: "employees" }),
        mutation: useOdooMutation(async (name: string) => ({ name }), "employees"),
      }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.list.loading).toBe(false));
    expect(result.current.list.data).toEqual([{ id: "1" }]);

    await result.current.mutation.mutateAsync("new employee");

    await waitFor(() => expect(result.current.list.data).toEqual([{ id: "2" }]));
    expect(listFetcher).toHaveBeenCalledTimes(2);
  });

  it("surfaces a failed mutation without invalidating anything", async () => {
    const { wrapper } = createWrapper();
    const listFetcher = vi.fn(async () => [{ id: "1" }]);

    const { result } = renderHook(
      () => ({
        list: useAsyncList(listFetcher, [], "failed", undefined, { cacheKey: "employees" }),
        mutation: useOdooMutation(async () => {
          throw new Error("boom");
        }, "employees"),
      }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.list.loading).toBe(false));

    await expect(result.current.mutation.mutateAsync(undefined)).rejects.toThrow("boom");

    expect(listFetcher).toHaveBeenCalledTimes(1);
  });
});
