/**
 * Narrow a caught `unknown` to a displayable string.
 *
 * Replaces the `catch (e: any)` + `e.message` pattern, which silently produces
 * `undefined` in the UI whenever a non-Error value is thrown (a rejected fetch
 * body, a string, `null`).
 */
export const errorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return String(error);
};
