/** Narrow a caught `unknown` to a displayable string. */
export const errorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return String(error);
};
