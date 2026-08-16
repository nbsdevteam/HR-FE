import { RouterProvider } from "react-router";
import { router } from "./router/routes";
import { publicRouter, isPublicPath } from "./router/publicRoutes";
import { AuthProvider, useAuth } from "@/shared/auth";
import { Login } from "@/features/auth/pages/Login";
import { Loader2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-muted-foreground ms-3">{arabicSource("common.loading")}</span>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <RouterProvider router={router} />;
}

export default function App() {
  // The candidate application page must render for logged-out visitors, so it
  // is resolved before the auth gate rather than inside the private router.
  if (typeof window !== "undefined" && isPublicPath(window.location.pathname)) {
    return <RouterProvider router={publicRouter} />;
  }

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
