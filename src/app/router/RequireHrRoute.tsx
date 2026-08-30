import type { ReactNode } from "react";
import { usePermissions } from "@/shared/auth/permissions";
import Forbidden from "./Forbidden";

type RequireHrRouteProps = {
  routeKeys: string[];
  children: ReactNode;
};

/**
 * Gates direct URL navigation the same way `Sidebar` gates its nav links —
 * hiding a tab never stops someone pasting its URL or using browser history.
 * Backend enforcement is unchanged and remains the authority; this only
 * decides what renders.
 */
const RequireHrRoute = ({ routeKeys, children }: RequireHrRouteProps) => {
  const { canSeeRoute } = usePermissions();

  if (!routeKeys.some(canSeeRoute)) {
    return <Forbidden />;
  }

  return <>{children}</>;
};

export default RequireHrRoute;
