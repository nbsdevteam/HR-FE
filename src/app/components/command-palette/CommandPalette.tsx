import { useCallback } from "react";
import { useNavigate } from "react-router";
import { Command } from "cmdk";
import { Search } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { usePermissions } from "@/shared/auth/permissions";
import { LoadingState } from "@/shared/components";
import { useCommandPalette } from "./CommandPaletteContext";
import { useCommandIntent } from "./CommandIntentContext";
import { useCommandRegistry } from "./commands";
import type { CommandDefinition } from "./commands/types";
import CommandPaletteGroup from "./CommandPaletteGroup";
import CommandPaletteEmpty from "./CommandPaletteEmpty";
import { useCommandPaletteShortcut } from "./useCommandPaletteShortcut";

const CommandPalette = () => {
  const { isOpen, closePalette, togglePalette } = useCommandPalette();
  const { requestModal } = useCommandIntent();
  const { loading } = usePermissions();
  const registry = useCommandRegistry();
  const navigate = useNavigate();
  useCommandPaletteShortcut(togglePalette);

  const handleOpenChange = useCallback(
    (open: boolean): void => {
      if (!open) closePalette();
    },
    [closePalette],
  );

  const handleSelect = useCallback(
    (command: CommandDefinition): void => {
      if (command.kind === "navigate") {
        navigate(command.to);
      } else if (command.kind === "open-modal") {
        if (command.navigateTo) navigate(command.navigateTo);
        requestModal(command.modalId);
      } else if (command.kind === "run-action") {
        command.run();
      }
      closePalette();
    },
    [navigate, requestModal, closePalette],
  );

  return (
    <Command.Dialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      label="Command palette"
      loop
      overlayClassName="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
      contentClassName="fixed inset-x-4 top-[15vh] z-[210] mx-auto w-auto max-w-xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
    >
      <div className="p-2 border-b border-border/40 flex items-center gap-2">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <Command.Input
          autoFocus
          placeholder={arabicSource("common.search")}
          className="w-full h-10 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          style={{ fontSize: 14 }}
        />
      </div>
      {loading ? (
        <LoadingState
          variant="compact"
          wrapperClassName="flex items-center justify-center gap-3 py-10 text-muted-foreground"
        />
      ) : (
        <Command.List className="dropdown-scroll max-h-96 overflow-y-auto p-2">
          <CommandPaletteEmpty />
          <CommandPaletteGroup
            groupId="create"
            heading={arabicSource("common.create")}
            commands={registry.create}
            onSelect={handleSelect}
          />
          <CommandPaletteGroup
            groupId="pages"
            heading={arabicSource("common.sections")}
            commands={registry.pages}
            onSelect={handleSelect}
          />
          <CommandPaletteGroup groupId="actions" commands={registry.actions} onSelect={handleSelect} />
        </Command.List>
      )}
    </Command.Dialog>
  );
};

export default CommandPalette;
