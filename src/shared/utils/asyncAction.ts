type RunAsyncActionOptions = {
  onError: (error: unknown) => void;
  setLoading?: (loading: boolean) => void;
};

/**
 * Wraps the `setLoading(true) → try/await → catch → finally setLoading(false)`
 * shape repeated across the policies/training submit handlers, without
 * dictating what "success" does (each handler still chains its own toast,
 * state resets, and refetch inside `action`).
 */
export const runAsyncAction = async (
  action: () => Promise<void>,
  { onError, setLoading }: RunAsyncActionOptions,
): Promise<void> => {
  setLoading?.(true);
  try {
    await action();
  } catch (error) {
    onError(error);
  } finally {
    setLoading?.(false);
  }
};
