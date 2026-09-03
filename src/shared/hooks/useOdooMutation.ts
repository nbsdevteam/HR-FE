import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";

type OdooMutationOptions<TData, TVariables> = Omit<
  UseMutationOptions<TData, Error, TVariables>,
  "mutationFn" | "onSuccess"
> & {
  onSuccess?: (data: TData, variables: TVariables) => void;
};

/**
 * The `useMutation` counterpart to `useCachedList`: call an `odooData`
 * mutation, then invalidate the list(s) it affects. `invalidateKeys` are the
 * same cache-key strings the corresponding read hooks pass to
 * `useCachedList`/`useAsyncList` (e.g. `"employees"`, `"leaveRequests"`) —
 * every query whose key starts with one of them is marked stale and
 * refetched by whichever hook is currently mounted, the same reach
 * `invalidateCachePrefix` used to have under the old cache.
 */
export const useOdooMutation = <TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  invalidateKeys: string | string[] = [],
  options?: OdooMutationOptions<TData, TVariables>,
) => {
  const queryClient = useQueryClient();
  const keys = Array.isArray(invalidateKeys) ? invalidateKeys : [invalidateKeys];

  return useMutation<TData, Error, TVariables>({
    ...options,
    mutationFn,
    onSuccess: (data, variables) => {
      keys.forEach((key) => {
        void queryClient.invalidateQueries({ queryKey: [key] });
      });
      options?.onSuccess?.(data, variables);
    },
  });
};
