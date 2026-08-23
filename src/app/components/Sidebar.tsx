import { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Home, Users, CalendarDays, Wallet, ClipboardCheck, AlertTriangle,
  FileText, GitBranch, UserPlus, GraduationCap, Clock, BarChart3,
  Settings, ChevronRight, Shield, Briefcase, Fingerprint, X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { arabicSource } from "@/i18n/source";
import { useNavShell } from "./NavShellContext";
import SidebarNavItem, { type SidebarMenuItem } from "./SidebarNavItem";

const menuItems: SidebarMenuItem[] = [
  { id: "dashboard", label: arabicSource("common.control_panel"), icon: Home, path: "/" },
  { id: "employees", label: arabicSource("common.employees"), icon: Users, path: "/employees" },
  { id: "attendance", label: arabicSource("common.attendance_and_departure"), icon: Clock, path: "/attendance" },
  { id: "leave", label: arabicSource("common.vacations"), icon: CalendarDays, path: "/leave" },
  { id: "payroll", label: arabicSource("common.salaries"), icon: Wallet, path: "/payroll" },
  { id: "evaluation", label: arabicSource("common.performance_evaluation"), icon: ClipboardCheck, path: "/evaluation" },
  { id: "warnings", label: arabicSource("common.alarms"), icon: AlertTriangle, path: "/warnings" },
  { id: "policies", label: arabicSource("shared.policies"), icon: FileText, path: "/policies" },
  { id: "hierarchy", label: arabicSource("common.organizational_structure"), icon: GitBranch, path: "/hierarchy" },
  { id: "recruitment", label: arabicSource("common.recruitment"), icon: UserPlus, path: "/recruitment" },
  { id: "training", label: arabicSource("common.training_and_development"), icon: GraduationCap, path: "/training" },
  { id: "lifecycle", label: arabicSource("common.employee_life_cycle"), icon: Briefcase, path: "/lifecycle" },
  { id: "reports", label: arabicSource("common.reports"), icon: BarChart3, path: "/reports" },
  { id: "devices", label: arabicSource("common.fingerprint_devices"), icon: Fingerprint, path: "/devices" },
  { id: "audit", label: arabicSource("shared.records_and_notices"), icon: Shield, path: "/audit" },
  { id: "settings", label: arabicSource("common.settings"), icon: Settings, path: "/settings" },
];

const SidebarNav = ({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSelect = useCallback(
    (path: string): void => {
      navigate(path);
      onNavigate?.();
    },
    [navigate, onNavigate]
  );

  return (
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto relative z-10">
      {menuItems.map((item, index) => (
        <SidebarNavItem
          key={item.id}
          item={item}
          index={index}
          isActive={location.pathname === item.path}
          collapsed={collapsed}
          onSelect={handleSelect}
        />
      ))}
    </nav>
  );
};

const Sidebar = () => {
  const { mobileNavOpen, closeMobileNav, isDesktop } = useNavShell();
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const [collapsed, setCollapsed] = useState(false);
  const offscreenX = isRtl ? "100%" : "-100%";

  const handleToggleCollapsed = useCallback((): void => {
    setCollapsed((value) => !value);
  }, []);

  // Escape closes mobile drawer
  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobileNav();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen, closeMobileNav]);

  // Desktop rail
  if (isDesktop) {
    return (
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.25 }}
        className="hidden md:flex h-screen bg-sidebar border-e border-sidebar-border flex-col relative overflow-hidden flex-shrink-0"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 pointer-events-none" />

        <div className="p-4 border-b border-sidebar-border relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-gradient-gold leading-tight" style={{ fontSize: 15 }}>
                  {arabicSource("shared.human_resources_system")}
                </p>
              </motion.div>
            )}
          </div>
        </div>

        <SidebarNav collapsed={collapsed} />

        <button
          onClick={handleToggleCollapsed}
          className="p-3 border-t border-sidebar-border text-muted-foreground hover:text-foreground transition-colors relative z-10 flex items-center justify-center cursor-pointer"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <motion.div animate={{ rotate: collapsed ? 0 : 180 }}>
            <ChevronRight className="w-5 h-5" />
          </motion.div>
        </button>
      </motion.aside>
    );
  }

  // Mobile drawer
  return (
    <AnimatePresence>
      {mobileNavOpen && (
        <>
          <motion.div
            key="nav-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] md:hidden"
            onClick={closeMobileNav}
            aria-hidden
          />
          <motion.aside
            key="nav-drawer"
            initial={{ x: offscreenX }}
            animate={{ x: 0 }}
            exit={{ x: offscreenX }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-y-0 start-0 z-[70] w-[min(288px,85vw)] bg-sidebar border-e border-sidebar-border flex flex-col shadow-2xl md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label={arabicSource("shared.human_resources_system")}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 pointer-events-none" />

            <div className="p-4 border-b border-sidebar-border relative z-10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-primary-foreground" />
                </div>
                <p className="text-gradient-gold truncate" style={{ fontSize: 15 }}>
                  {arabicSource("shared.human_resources_system")}
                </p>
              </div>
              <button
                onClick={closeMobileNav}
                className="p-2 rounded-lg hover:bg-sidebar-accent text-muted-foreground hover:text-foreground cursor-pointer flex-shrink-0"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <SidebarNav collapsed={false} onNavigate={closeMobileNav} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
