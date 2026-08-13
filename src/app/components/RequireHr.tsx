import { Loader2, ShieldOff } from "lucide-react";
import { Navigate, useNavigate } from "react-router";
import type { ReactNode } from "react";
import { useAuth } from "../lib/auth";
import { arabicSource } from "../i18n/source";

type RequireHrProps = {
  children: ReactNode;
  /** Single CRM route flag, e.g. `hr.payroll` */
  route?: string;
  /** Any of these route flags */
  anyRoute?: readonly string[];
  /** Any of these permission leaf paths, e.g. `hr.configs.edit` */
  anyPerm?: readonly string[];
  /** Where to send denied users (must not be another gated page that loops). */
  fallback?: string;
};

/**
 * Route guard for HR SPA pages. Sidebar hiding is not enough —
 * this blocks direct URL access when the CRM permission/route is missing.
 */
export function RequireHr({
  children,
  route,
  anyRoute,
  anyPerm,
  fallback = "/forbidden",
}: RequireHrProps) {
  const { permissionsReady, canRoute, canAnyRoute, canAny } = useAuth();

  if (!permissionsReady) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">{arabicSource("common.loading")}</span>
      </div>
    );
  }

  const allowed =
    (route ? canRoute(route) : false) ||
    (anyRoute?.length ? canAnyRoute(...anyRoute) : false) ||
    (anyPerm?.length ? canAny(...anyPerm) : false);

  if (!allowed) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}

export function ForbiddenPage() {
  const navigate = useNavigate();
  return (
    <section className="flex min-h-full items-center justify-center p-6">
      <div className="max-w-md rounded-2xl border border-border/40 bg-card/40 p-8 text-center shadow-xl backdrop-blur-md">
        <ShieldOff className="mx-auto mb-4 h-14 w-14 text-destructive" aria-hidden="true" />
        <p className="mb-2 text-sm text-muted-foreground">403</p>
        <h1 className="mb-2 text-2xl text-foreground">غير مصرح</h1>
        <p className="mb-6 text-muted-foreground">
          ليس لديك صلاحية لعرض هذه الصفحة. إذا كنت بحاجة للوصول، تواصل مع مسؤول النظام.
        </p>
        <button
          type="button"
          onClick={() => navigate("/", { replace: true })}
          className="mx-auto rounded-lg bg-primary px-5 py-2.5 text-primary-foreground transition-opacity hover:opacity-90"
        >
          العودة إلى لوحة التحكم
        </button>
      </div>
    </section>
  );
}
