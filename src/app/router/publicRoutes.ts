import { createBrowserRouter } from "react-router";
import { PublicApply } from "@/features/recruitment/pages/PublicApply";
import { NotFound } from "./NotFound";

/**
 * Routes served without authentication. Candidates reach /apply/<token> from a
 * shared link and are not users of the HR system, so this router deliberately
 * skips Layout, the sidebar and every authenticated data hook.
 */
export const PUBLIC_ROUTE_PREFIXES = ["/apply"] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_ROUTE_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export const publicRouter = createBrowserRouter([
  { path: "/apply/:token", Component: PublicApply },
  { path: "*", Component: NotFound },
]);
