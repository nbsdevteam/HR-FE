
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import LocalizationProvider from "./i18n/LocalizationProvider.tsx";
  import "./i18n";
  import "./styles/index.css";

  const STALE_RELOAD_KEY = "hr-stale-chunk-reload";

  const handleStaleChunk = (): void => {
    // After a new deploy overwrites dist/, a tab still open on the old build
    // will 404 when it lazy-loads a chunk hash that no longer exists. Reload
    // once to pick up the fresh index.html; guard against a reload loop if
    // the deploy is genuinely broken.
    if (sessionStorage.getItem(STALE_RELOAD_KEY)) return;
    sessionStorage.setItem(STALE_RELOAD_KEY, "1");
    window.location.reload();
  };

  window.addEventListener("vite:preloadError", handleStaleChunk);

  createRoot(document.getElementById("root")!).render(
    <LocalizationProvider>
      <App />
    </LocalizationProvider>,
  );

  // Once the app has been stable for a bit, allow a future stale-chunk
  // reload again (e.g. if another deploy ships later in the same session).
  window.setTimeout(() => sessionStorage.removeItem(STALE_RELOAD_KEY), 10000);
