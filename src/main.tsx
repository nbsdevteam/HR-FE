
  import { lazy, Suspense } from "react";
  import { createRoot } from "react-dom/client";
  import { QueryClientProvider } from "@tanstack/react-query";
  import App from "./app/App.tsx";
  import LocalizationProvider from "./i18n/LocalizationProvider.tsx";
  import { queryClient } from "./shared/api/queryClient.ts";
  import { armStaleChunkReloadReset, reloadForStaleChunk } from "./app/router/staleChunkReload.ts";
  import "./i18n";
  import "./styles/index.css";

  // Dynamically imported so the devtools code never lands in the prod bundle —
  // the import() only actually fires when the DEV branch below renders it.
  const ReactQueryDevtools = lazy(() =>
    import("@tanstack/react-query-devtools").then((m) => ({ default: m.ReactQueryDevtools })),
  );

  // After a new deploy overwrites dist/, a tab still open on the old build
  // will 404 when it lazy-loads a chunk hash that no longer exists. Vite
  // rethrows that fetch error unless we call preventDefault, so we must call
  // it here even though `routes.tsx`'s `lazyRoute` is what actually recovers
  // from a route-chunk failure — this listener is the catch-all for any
  // other dynamic import (e.g. this file's own ReactQueryDevtools import).
  const handleStaleChunk = (event: Event): void => {
    event.preventDefault();
    reloadForStaleChunk();
  };

  window.addEventListener("vite:preloadError", handleStaleChunk);

  createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={queryClient}>
      <LocalizationProvider>
        <App />
      </LocalizationProvider>
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>,
  );

  armStaleChunkReloadReset();
