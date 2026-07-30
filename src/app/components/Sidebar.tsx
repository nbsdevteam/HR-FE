import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import {
  Home, Users, CalendarDays, Wallet, ClipboardCheck, AlertTriangle,
  FileText, GitBranch, UserPlus, GraduationCap, Clock, BarChart3,
  Settings, ChevronRight, Shield, Briefcase, Fingerprint, LogOut
} from "lucide-react";
import { useAuth } from "../lib/auth";

const menuItems = [
  { id: "dashboard", label: "لوحة التحكم", icon: Home, path: "/" },
  { id: "employees", label: "الموظفون", icon: Users, path: "/employees" },
  { id: "attendance", label: "الحضور والانصراف", icon: Clock, path: "/attendance" },
  { id: "leave", label: "الإجازات", icon: CalendarDays, path: "/leave" },
  { id: "payroll", label: "الرواتب", icon: Wallet, path: "/payroll" },
  { id: "evaluation", label: "تقييم الأداء", icon: ClipboardCheck, path: "/evaluation" },
  { id: "warnings", label: "الإنذارات", icon: AlertTriangle, path: "/warnings" },
  { id: "policies", label: "السياسات", icon: FileText, path: "/policies" },
  { id: "hierarchy", label: "الهيكل التنظيمي", icon: GitBranch, path: "/hierarchy" },
  { id: "recruitment", label: "التوظيف", icon: UserPlus, path: "/recruitment" },
  { id: "training", label: "التدريب والتطوير", icon: GraduationCap, path: "/training" },
  { id: "lifecycle", label: "دورة حياة الموظف", icon: Briefcase, path: "/lifecycle" },
  { id: "reports", label: "التقارير", icon: BarChart3, path: "/reports" },
  { id: "devices", label: "أجهزة البصمة", icon: Fingerprint, path: "/devices" },
  { id: "audit", label: "السجلات والإشعارات", icon: Shield, path: "/audit" },
  { id: "settings", label: "الإعدادات", icon: Settings, path: "/settings" },
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
              <h2 className="text-gradient-gold">نظام الموارد البشرية</h2>
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
          title="تسجيل الخروج"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span style={{ fontSize: 13 }}>تسجيل الخروج</span>}
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