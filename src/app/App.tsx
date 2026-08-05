import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider, useAuth } from "./lib/auth";
import { Login } from "./pages/Login";
import { isOdooBackend } from "./lib/api/client";
import { Loader2 } from "lucide-react";

function AppContent() {
  const { user, loading } = useAuth();

  // Login is only enforced in Odoo mode (VITE_API_BASE set), where a real,
  // reachable JWT backend exists to authenticate against. In Supabase mode
  // (the current production default, no public Odoo endpoint yet) the app
  // stays open, matching pre-Odoo-migration behavior.
  if (!isOdooBackend()) {
    return <RouterProvider router={router} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-muted-foreground ms-3">جاري التحميل...</span>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
