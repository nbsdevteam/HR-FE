import { menuItems } from "@/app/components/navMenuItems";
import type { NavigateCommand } from "./types";

/** One "navigate" command per sidebar page, kept in lockstep via navMenuItems.ts. */
export const navigationCommands: NavigateCommand[] = menuItems.map((item) => ({
  id: `navigate.${item.id}`,
  kind: "navigate",
  group: "pages",
  label: item.label,
  icon: item.icon,
  routeKeys: item.routeKeys,
  to: item.path,
}));
