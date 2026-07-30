import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider, useAuth } from "./lib/auth";
import { Login } from "./pages/Login";
import { Loader2 } from "lucide-react";
import { arabicSource } from "./i18n/source";
import { useTranslation } from "react-i18next";

function AppContent() {
  const { user, loading } = useAuth();
  const { i18n } = useTranslation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir={i18n.dir()}>
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
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
