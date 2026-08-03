import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import type { User, Session } from "@supabase/supabase-js";
import {
  isOdooBackend,
  odooLogin,
  odooLogout,
  getAccessToken,
  getStoredUser,
  clearAuthSession,
  type HrAuthUser,
} from "./api/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  backend: "odoo" | "supabase";
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  backend: "supabase",
});

export const useAuth = () => useContext(AuthContext);

function toCompatUser(u: HrAuthUser): User {
  return {
    id: u.id || String(u.odoo_id || ""),
    email: u.email || u.login || "",
    app_metadata: {},
    user_metadata: { name: u.name || "", odoo_id: u.odoo_id },
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as User;
}

function toCompatSession(token: string, user: User): Session {
  return {
    access_token: token,
    refresh_token: localStorage.getItem("lugal_hr_refresh_token") || "",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user,
  } as Session;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const odooMode = isOdooBackend();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (odooMode) {
      const token = getAccessToken();
      const stored = getStoredUser();
      if (token && stored) {
        const u = toCompatUser(stored);
        setUser(u);
        setSession(toCompatSession(token, u));
      }
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) console.error("Failed to get session:", error.message);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Auth session error:", err);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [odooMode]);

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
    if (odooMode) {
      try {
        const result = await odooLogin(email, password);
        const u = toCompatUser(result.user);
        setUser(u);
        setSession(toCompatSession(result.access_token, u));
        return { error: null };
      } catch (e: any) {
        return { error: translateAuthError(e?.message || "Login failed") };
      }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? translateAuthError(error.message) : null };
  };

  const signUp = async (email: string, password: string) => {
    if (odooMode) {
      return { error: "إنشاء الحساب غير متاح عبر هذا النظام — يرجى طلب حساب من المسؤول" };
    }
    if (password.length < 6) return { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" };
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error ? translateAuthError(error.message) : null };
  };

  const signOut = async () => {
    if (odooMode) {
      await odooLogout();
      setUser(null);
      setSession(null);
      return;
    }
    clearAuthSession();
    await supabase.auth.signOut();
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
        backend: odooMode ? "odoo" : "supabase",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
