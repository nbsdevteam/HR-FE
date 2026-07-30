import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import {
  Home, Users, CalendarDays, Wallet, ClipboardCheck, AlertTriangle,
  FileText, GitBranch, UserPlus, GraduationCap, Clock, BarChart3,
  Settings, ChevronRight, Shield, Briefcase, Fingerprint, LogOut
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { arabicSource } from "../i18n/source";

const menuItems = [
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

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { signOut, user } = useAuth();

  return (
    <motion.aside
      initial={{ x: 20 }}
      animate={{ x: 0, width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3 }}
      className="h-screen bg-sidebar border-e border-sidebar-border flex flex-col relative overflow-hidden"
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      {/* Logo area */}
      <div className="p-4 border-b border-sidebar-border relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-gradient-gold">{arabicSource("shared.human_resources_system")}</h2>
            </motion.div>
          )}
        </div>
      </div>

      {/* Menu items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto relative z-10">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={{ x: -5 }}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-primary via-primary to-gold-dark text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </motion.button>
          );
        })}
      </nav>

      {/* User & Sign out */}
      <div className="border-t border-sidebar-border relative z-10">
        {user && !collapsed && (
          <div className="px-4 py-2 text-muted-foreground truncate" style={{ fontSize: 11 }} dir="ltr">
            {user.email}
          </div>
        )}
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          title={arabicSource("common.log_out")}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span style={{ fontSize: 13 }}>{arabicSource("common.log_out")}</span>}
        </button>
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 border-t border-sidebar-border text-muted-foreground hover:text-foreground transition-colors relative z-10 flex items-center justify-center cursor-pointer"
      >
        <motion.div animate={{ rotate: collapsed ? 0 : 180 }}>
          <ChevronRight className="w-5 h-5" />
        </motion.div>
      </button>
    </motion.aside>
  );
}