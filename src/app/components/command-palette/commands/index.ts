import { useMemo } from "react";
import { usePermissions } from "@/shared/auth/permissions";
import { navigationCommands } from "./navigationCommands";
import { modalCommands } from "./modalCommands";
import { useActionCommands } from "./actionCommands";
import type { CommandDefinition, CommandGroupId } from "./types";

export type CommandRegistry = Record<CommandGroupId, CommandDefinition[]>;

/**
 * Merges every command source and filters each entry through the same
 * `canSeeRoute`/`hasPermission` checks `RequireHrRoute` and `Sidebar` already
 * use, so the palette never offers a page or action the user can't reach.
 */
export const useCommandRegistry = (): CommandRegistry => {
  const { canSeeRoute, hasPermission } = usePermissions();
  const actionCommands = useActionCommands();

  return useMemo(() => {
    const allCommands: CommandDefinition[] = [...navigationCommands, ...modalCommands, ...actionCommands];

    return allCommands.reduce<CommandRegistry>(
      (registry, command) => {
        const routeAllowed = command.routeKeys.length === 0 || command.routeKeys.some(canSeeRoute);
        const permissionAllowed =
          command.kind !== "open-modal" || !command.permissionPath || hasPermission(command.permissionPath);
        if (routeAllowed && permissionAllowed) registry[command.group].push(command);
        return registry;
      },
      { pages: [], create: [], actions: [] },
    );
  }, [canSeeRoute, hasPermission, actionCommands]);
};
