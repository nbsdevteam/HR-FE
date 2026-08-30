import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Home, Users, CalendarDays, Wallet, ClipboardCheck, AlertTriangle,
  FileText, GitBranch, UserPlus, GraduationCap, Clock, BarChart3,
  Settings, ChevronRight, Shield, Briefcase, Fingerprint, X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { arabicSource } from "@/i18n/source";
import { ROUTE_SEGMENT } from "@/app/router/routePaths";
import { usePermissions } from "@/shared/auth/permissions";
import { useNavShell } from "./NavShellContext";
import SidebarNavItem, { type SidebarMenuItem } from "./SidebarNavItem";
import { Button } from "@/shared/components";

const menuItems: SidebarMenuItem[] = [
  { id: "dashboard", label: arabicSource("common.control_panel"), icon: Home, path: "/", routeKeys: ["hr.dashboard"] },
  { id: "employees", label: arabicSource("common.employees"), icon: Users, path: `/${ROUTE_SEGMENT.employees}`, routeKeys: ["hr.employees"] },
  { id: "attendance", label: arabicSource("common.attendance_and_departure"), icon: Clock, path: `/${ROUTE_SEGMENT.attendance}`, routeKeys: ["hr.attendance"] },
  { id: "leave", label: arabicSource("common.vacations"), icon: CalendarDays, path: `/${ROUTE_SEGMENT.leave}`, routeKeys: ["hr.leave"] },
  { id: "payroll", label: arabicSource("common.salaries"), icon: Wallet, path: `/${ROUTE_SEGMENT.payroll}`, routeKeys: ["hr.payroll"] },
  { id: "evaluation", label: arabicSource("common.performance_evaluation"), icon: ClipboardCheck, path: `/${ROUTE_SEGMENT.evaluation}`, routeKeys: ["hr.evaluations"] },
  { id: "warnings", label: arabicSource("common.alarms"), icon: AlertTriangle, path: `/${ROUTE_SEGMENT.warnings}`, routeKeys: ["hr.warnings"] },
  { id: "policies", label: arabicSource("shared.policies"), icon: FileText, path: `/${ROUTE_SEGMENT.policies}`, routeKeys: ["hr.policies"] },
  { id: "hierarchy", label: arabicSource("common.organizational_structure"), icon: GitBranch, path: `/${ROUTE_SEGMENT.hierarchy}`, routeKeys: ["hr.departments", "hr.org"] },
  { id: "recruitment", label: arabicSource("common.recruitment"), icon: UserPlus, path: `/${ROUTE_SEGMENT.recruitment}`, routeKeys: ["hr.recruitment"] },
  { id: "training", label: arabicSource("common.training_and_development"), icon: GraduationCap, path: `/${ROUTE_SEGMENT.training}`, routeKeys: ["hr.training"] },
  { id: "lifecycle", label: arabicSource("common.employee_life_cycle"), icon: Briefcase, path: `/${ROUTE_SEGMENT.lifecycle}`, routeKeys: ["hr.lifecycle"] },
  { id: "reports", label: arabicSource("common.reports"), icon: BarChart3, path: `/${ROUTE_SEGMENT.reports}`, routeKeys: ["hr.reports"] },
  { id: "devices", label: arabicSource("common.fingerprint_devices"), icon: Fingerprint, path: `/${ROUTE_SEGMENT.devices}`, routeKeys: ["hr.devices"] },
  { id: "audit", label: arabicSource("shared.records_and_notices"), icon: Shield, path: `/${ROUTE_SEGMENT.audit}`, routeKeys: ["hr.audit", "hr.documents", "hr.notes"] },
  { id: "settings", label: arabicSource("common.settings"), icon: Settings, path: `/${ROUTE_SEGMENT.settings}`, routeKeys: ["hr.configs", "hr.modules"] },
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
  const { canSeeRoute } = usePermissions();

  const visibleItems = useMemo(
    () => menuItems.filter((item) => item.routeKeys.some(canSeeRoute)),
    [canSeeRoute],
  );

  const handleSelect = useCallback(
    (path: string): void => {
      navigate(path);
      onNavigate?.();
    },
    [navigate, onNavigate]
  );

  return (
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto relative z-10">
      {visibleItems.map((item, index) => (
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
  const [collapsed, setCollapsed] = useState(false);
  const { mobileNavOpen, closeMobileNav, isDesktop } = useNavShell();
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
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
        className="hidden md:flex h-screen bg-sidebar/90 backdrop-blur-md border-e border-sidebar-border shadow-xl flex-col relative overflow-hidden flex-shrink-0"
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

        <Button
          onClick={handleToggleCollapsed}
          variant="unstyled"
          size="unstyled"
          rounded=""
          className="p-3 border-t border-sidebar-border text-muted-foreground hover:text-foreground relative z-10 flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <motion.div animate={{ rotate: collapsed ? 0 : 180 }}>
            <ChevronRight className="w-5 h-5" />
          </motion.div>
        </Button>
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
            className="fixed inset-y-0 start-0 z-[70] w-[min(288px,85vw)] bg-sidebar/95 backdrop-blur-md border-e border-sidebar-border flex flex-col shadow-2xl md:hidden"
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
              <Button
                onClick={closeMobileNav}
                icon={X}
                iconClassName="w-5 h-5"
                size="icon"
                variant="unstyled"
                rounded="rounded-lg"
                className="text-muted-foreground hover:bg-sidebar-accent hover:text-foreground flex-shrink-0"
                aria-label="Close menu"
              />
            </div>

            <SidebarNav collapsed={false} onNavigate={closeMobileNav} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
