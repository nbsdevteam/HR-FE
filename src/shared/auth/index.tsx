import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  odooLogin,
  odooLogout,
  getAccessToken,
  getStoredUser,
  type HrAuthUser,
} from "@/shared/api/client";

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
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
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

  useEffect(() => {
    const token = getAccessToken();
    const stored = getStoredUser();
    if (token && stored) {
      setUser(toAuthUser(stored));
      setSession({ access_token: token });
    }
    setLoading(false);
  }, []);

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

  const signIn = async (email: string, password: string) => {
    try {
      const result = await odooLogin(email, password);
      const u = toAuthUser(result.user);
      setUser(u);
      setSession({ access_token: result.access_token });
      return { error: null };
    } catch (e: any) {
      return { error: translateAuthError(e?.message || "Login failed") };
    }
  };

  const signUp = async (_email: string, _password: string) => {
    return { error: "إنشاء الحساب غير متاح عبر هذا النظام — يرجى طلب حساب من المسؤول" };
  };

  const signOut = async () => {
    await odooLogout();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
