import { useMemo } from "react";
import { Moon, Sun, LogOut } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { useTheme } from "@/app/providers";
import { useAuth } from "@/shared/auth";
import type { RunActionCommand } from "./types";

/** Needs live theme/auth state, so this is a hook rather than a static array. */
export const useActionCommands = (): RunActionCommand[] => {
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();

  return useMemo(() => {
    const nextTheme = theme === "dark-enhanced" ? "light-turquoise" : "dark-enhanced";

    const toggleTheme: RunActionCommand = {
      id: "action.theme.toggle",
      kind: "run-action",
      group: "actions",
      label: arabicSource("shared.choose_the_theme"),
      icon: theme === "dark-enhanced" ? Sun : Moon,
      routeKeys: [],
      run: () => setTheme(nextTheme),
    };

    const signOutCommand: RunActionCommand = {
      id: "action.auth.signOut",
      kind: "run-action",
      group: "actions",
      label: arabicSource("common.log_out"),
      icon: LogOut,
      routeKeys: [],
      run: () => {
        void signOut();
      },
    };

    return [toggleTheme, signOutCommand];
  }, [theme, setTheme, signOut]);
};
