import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { motion } from "motion/react";
import { ThemeProvider } from "./ThemeContext";
import { SettingsProvider } from "./SettingsContext";

function LayoutInner() {
  return (
    <div dir="rtl" className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: "'Tajawal', sans-serif" }}>
      {/* Animated background orbs — colors driven by CSS variables */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -end-20 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, var(--orb-1) 0%, transparent 70%)", filter: "blur(60px)" }}
        />
        <motion.div
          animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-20 -start-20 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, var(--orb-2) 0%, transparent 70%)", filter: "blur(80px)" }}
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, var(--orb-3) 0%, transparent 70%)", filter: "blur(70px)" }}
        />
      </div>

      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function Layout() {
  return (
    <SettingsProvider>
      <ThemeProvider>
        <LayoutInner />
      </ThemeProvider>
    </SettingsProvider>
  );
}