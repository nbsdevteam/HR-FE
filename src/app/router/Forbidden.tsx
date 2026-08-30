import { useCallback } from "react";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

/**
 * Mirrors `NotFound`'s look — rendered by `RequireHrRoute` when the current
 * user's permissions don't grant any of a route's `routeKeys`.
 */
const Forbidden = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleBackToDashboard = useCallback((): void => {
    navigate("/");
  }, [navigate]);

  return (
    <section className="flex min-h-full items-center justify-center p-6">
      <div className="max-w-md rounded-2xl border border-border/40 bg-card/40 p-8 text-center shadow-xl backdrop-blur-md">
        <ShieldAlert className="mx-auto mb-4 h-14 w-14 text-primary" aria-hidden="true" />
        <h1 className="mb-2 text-2xl text-foreground">{t("errors.forbidden_title")}</h1>
        <p className="mb-6 text-muted-foreground">{t("errors.forbidden_message")}</p>
        <button
          type="button"
          onClick={handleBackToDashboard}
          className="mx-auto flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-primary-foreground transition-opacity hover:opacity-90"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("errors.back_to_dashboard")}
        </button>
      </div>
    </section>
  );
};

export default Forbidden;
