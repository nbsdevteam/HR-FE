import { useCallback } from "react";
import { RotateCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRouteError } from "react-router";

/**
 * Router-wide `ErrorBoundary`. Mirrors `NotFound`/`Forbidden`'s look. Mostly
 * a safety net for the rare case where a stale-chunk reload (see
 * `staleChunkReload.ts`) was already attempted this session and the failure
 * persists — offers a manual reload instead of react-router's default,
 * developer-facing error screen.
 */
const RouteError = () => {
  const { t } = useTranslation();
  const error = useRouteError();

  if (import.meta.env.DEV) {
    console.error(error);
  }

  const handleReload = useCallback((): void => {
    window.location.reload();
  }, []);

  return (
    <section className="flex min-h-full items-center justify-center p-6">
      <div className="max-w-md rounded-2xl border border-border/40 bg-card/40 p-8 text-center shadow-xl backdrop-blur-md">
        <RotateCw className="mx-auto mb-4 h-14 w-14 text-primary" aria-hidden="true" />
        <h1 className="mb-2 text-2xl text-foreground">{t("errors.unexpected_title")}</h1>
        <p className="mb-6 text-muted-foreground">{t("errors.unexpected_message")}</p>
        <button
          type="button"
          onClick={handleReload}
          className="mx-auto flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-primary-foreground transition-opacity hover:opacity-90"
        >
          <RotateCw className="h-4 w-4" aria-hidden="true" />
          {t("errors.reload_page")}
        </button>
      </div>
    </section>
  );
};

export default RouteError;
