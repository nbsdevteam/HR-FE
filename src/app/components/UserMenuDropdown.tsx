import type { RefObject } from "react";
import { User, Loader2, LogOut } from "lucide-react";
import { ThemeSwitcher } from "@/app/providers";
import { arabicSource } from "@/i18n/source";
import DropdownPanel from "./DropdownPanel";

type UserMenuDropdownProps = {
  displayName: string;
  email?: string | null;
  isOpen: boolean;
  dropdownRef: RefObject<HTMLDivElement>;
  onToggle: () => void;
  signingOut: boolean;
  onSignOut: () => void;
};

const UserMenuDropdown = ({
  displayName,
  email,
  isOpen,
  dropdownRef,
  onToggle,
  signingOut,
  onSignOut,
}: UserMenuDropdownProps) => (
  <div className="relative" ref={dropdownRef}>
    <button
      type="button"
      onClick={onToggle}
      className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center cursor-pointer hover:bg-primary/30 transition-colors"
      aria-label="User menu"
    >
      <User className="w-4 h-4 text-primary" />
    </button>
    <DropdownPanel isOpen={isOpen} widthClassName="w-56">
      <div className="p-3 border-b border-border/40">
        <p className="text-foreground truncate" style={{ fontSize: 13 }}>
          {displayName}
        </p>
        {email && (
          <p
            className="text-muted-foreground truncate"
            style={{ fontSize: 11 }}
          >
            {email}
          </p>
        )}
      </div>

      {/* <div className="p-1.5 sm:hidden">
        <ThemeSwitcher />
      </div> */}

      <button
        type="button"
        onClick={onSignOut}
        disabled={signingOut}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer disabled:opacity-50"
        style={{ fontSize: 13 }}
      >
        {signingOut ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <LogOut className="w-4 h-4" />
        )}
        {arabicSource("common.log_out")}
      </button>
    </DropdownPanel>
  </div>
);

export default UserMenuDropdown;
