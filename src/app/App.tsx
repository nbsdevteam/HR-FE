import { RouterProvider } from "react-router";
import { router } from "./router/routes";
import { publicRouter, isPublicPath } from "./router/publicRoutes";
import HydrateFallback from "./router/HydrateFallback";
import AuthProvider, { useAuth } from "@/shared/auth";
import Login from "@/features/auth/pages/Login";

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <HydrateFallback />;
  }

  if (!user) {
    return <Login />;
  }

  return <RouterProvider router={router} />;
};

const App = () => {
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
};

export default App;
