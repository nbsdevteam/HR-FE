import { createBrowserRouter } from "react-router";
import { PublicApply } from "@/features/recruitment/pages/PublicApply";
import PublicLeaveRequest from "@/features/leave/pages/PublicLeaveRequest";
import PublicExitSign from "@/features/employees/pages/PublicExitSign";
import NotFound from "./NotFound";

/**
 * Routes served without authentication. Candidates reach /apply/<token>,
 * employees reach /leave-request/<token>, and a leaving employee reaches
 * /exit-sign/<token> from a shared link; none of them are users of the HR
 * system, so this router deliberately skips Layout, the sidebar and every
 * authenticated data hook.
 */
export const PUBLIC_ROUTE_PREFIXES = ["/apply", "/leave-request", "/exit-sign"] as const;

export const isPublicPath = (pathname: string): boolean => {
  return PUBLIC_ROUTE_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export const publicRouter = createBrowserRouter([
  { path: "/apply/:token", Component: PublicApply },
  { path: "/leave-request/:token", Component: PublicLeaveRequest },
  { path: "/exit-sign/:token", Component: PublicExitSign },
  { path: "*", Component: NotFound },
]);
