import type { RouteObject } from "react-router";

/**
 * HR's routes for people who do not work here.
 *
 * A candidate opening an application link, and a leave request submitted from an emailed link, both
 * belong to someone with no account, no permission tree entry and no session. The shell patches
 * these at the router ROOT — outside its chrome and outside the authenticated boundary — so nothing
 * can redirect them to a login they could never pass.
 *
 * Declared as publicRoutePrefixes in CRM's mf.registry.json, which is what tells the host to look
 * here before it consults the normal prefix table.
 */
const publicRoutes: RouteObject[] = [
  {
    path: "/hr/apply",
    lazy: async () => {
      const { default: Component } = await import("@/features/recruitment/pages/PublicApply");
      return { Component };
    },
  },
  {
    path: "/hr/leave-request",
    lazy: async () => {
      const { default: Component } = await import("@/features/leave/pages/PublicLeaveRequest");
      return { Component };
    },
  },
];

export default publicRoutes;
