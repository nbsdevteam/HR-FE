/**
 * Scrolls the app's single scrollable content region (`main.app-shell-content`
 * in Layout.tsx) back to its top. Paginated tables live inside that region
 * rather than the window, so `window.scrollTo` would be a no-op.
 */
export const scrollContentToTop = (): void => {
  document.querySelector(".app-shell-content")?.scrollTo({ top: 0, behavior: "smooth" });
};
