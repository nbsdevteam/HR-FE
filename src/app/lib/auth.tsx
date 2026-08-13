import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  odooLogin,
  odooLogout,
  getAccessToken,
  getStoredUser,
  fetchMyPermissions,
  type HrAuthUser,
} from "./api/client";
import {
  can as canPerm,
  canAny as canAnyPerm,
  canRoute as canRouteKey,
  canAnyRoute as canAnyRouteKeys,
  emptyPermissionState,
  type HrPermissionState,
  type HrPermissionTree,
} from "./permissions";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  odooId?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  session: { access_token: string } | null;
  loading: boolean;
  permissionsReady: boolean;
  permissions: HrPermissionTree;
  routes: Record<string, boolean>;
  role: string;
  roleLabel: string;
  jobTitle: string;
  can: (path: string) => boolean;
  canAny: (...paths: string[]) => boolean;
  canRoute: (routeKey: string) => boolean;
  canAnyRoute: (...routeKeys: string[]) => boolean;
  refreshPermissions: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  permissionsReady: false,
  permissions: {},
  routes: {},
  role: "none",
  roleLabel: "",
  jobTitle: "",
  can: () => false,
  canAny: () => false,
  canRoute: () => false,
  canAnyRoute: () => false,
  refreshPermissions: async () => {},
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

function toAuthUser(u: HrAuthUser): AuthUser {
  return {
    id: u.id || String(u.odoo_id || ""),
    email: u.email || u.login || "",
    name: u.name || "",
    odooId: u.odoo_id,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionsReady, setPermissionsReady] = useState(false);
  const [permState, setPermState] = useState<HrPermissionState>(emptyPermissionState);

  const applyPermissionState = useCallback((state: HrPermissionState) => {
    setPermState(state);
    setPermissionsReady(true);
  }, []);

  const loadPermissions = useCallback(async () => {
    try {
      const state = await fetchMyPermissions();
      applyPermissionState(state);
    } catch {
      // Fail closed for gated modules; keep session so user can still use ungated pages.
      applyPermissionState(emptyPermissionState());
    }
  }, [applyPermissionState]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = getAccessToken();
      const stored = getStoredUser();
      if (token && stored) {
        if (!cancelled) {
          setUser(toAuthUser(stored));
          setSession({ access_token: token });
        }
        try {
          const state = await fetchMyPermissions();
          if (!cancelled) applyPermissionState(state);
        } catch {
          if (!cancelled) applyPermissionState(emptyPermissionState());
        }
      } else if (!cancelled) {
        setPermissionsReady(false);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [applyPermissionState]);

  const translateAuthError = (msg: string): string => {
    if (msg.includes("Invalid login") || msg.includes("Access Denied") || msg.includes("Wrong login"))
      return "البريد الإلكتروني أو كلمة المرور غير صحيحة";
    if (msg.includes("Email not confirmed")) return "لم يتم تأكيد البريد الإلكتروني بعد";
    if (msg.includes("User already registered")) return "هذا البريد الإلكتروني مسجّل مسبقاً";
    if (msg.includes("Password should be")) return "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
    if (msg.includes("rate limit")) return "تم تجاوز عدد المحاولات المسموحة، يرجى المحاولة لاحقاً";
    if (msg.includes("signup") || msg.includes("Sign up"))
      return "إنشاء الحساب غير متاح — يرجى طلب حساب من المسؤول";
    return msg;
  };

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await odooLogin(email, password);
        const u = toAuthUser(result.user);
        setUser(u);
        setSession({ access_token: result.access_token });
        setPermissionsReady(false);
        await loadPermissions();
        return { error: null };
      } catch (e: any) {
        return { error: translateAuthError(e?.message || "Login failed") };
      }
    },
    [loadPermissions],
  );

  const signUp = useCallback(async (_email: string, _password: string) => {
    return { error: "إنشاء الحساب غير متاح عبر هذا النظام — يرجى طلب حساب من المسؤول" };
  }, []);

  const signOut = useCallback(async () => {
    await odooLogout();
    setUser(null);
    setSession(null);
    setPermState(emptyPermissionState());
    setPermissionsReady(false);
  }, []);

  const canFn = useCallback(
    (path: string) => canPerm(permState.permissions, path),
    [permState.permissions],
  );
  const canAnyFn = useCallback(
    (...paths: string[]) => canAnyPerm(permState.permissions, paths),
    [permState.permissions],
  );
  const canRouteFn = useCallback(
    (routeKey: string) => canRouteKey(permState.routes, routeKey),
    [permState.routes],
  );
  const canAnyRouteFn = useCallback(
    (...routeKeys: string[]) => canAnyRouteKeys(permState.routes, routeKeys),
    [permState.routes],
  );

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      loading,
      permissionsReady,
      permissions: permState.permissions,
      routes: permState.routes,
      role: permState.role,
      roleLabel: permState.role_label,
      jobTitle: permState.job_title,
      can: canFn,
      canAny: canAnyFn,
      canRoute: canRouteFn,
      canAnyRoute: canAnyRouteFn,
      refreshPermissions: loadPermissions,
      signIn,
      signUp,
      signOut,
    }),
    [
      user,
      session,
      loading,
      permissionsReady,
      permState,
      canFn,
      canAnyFn,
      canRouteFn,
      canAnyRouteFn,
      loadPermissions,
      signIn,
      signUp,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
