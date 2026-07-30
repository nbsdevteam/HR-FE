import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session with error handling
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error("Failed to get session:", error.message);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      console.error("Auth session error:", err);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const translateAuthError = (msg: string): string => {
    if (msg.includes("Invalid login")) return "البريد الإلكتروني أو كلمة المرور غير صحيحة";
    if (msg.includes("Email not confirmed")) return "لم يتم تأكيد البريد الإلكتروني بعد";
    if (msg.includes("User already registered")) return "هذا البريد الإلكتروني مسجّل مسبقاً";
    if (msg.includes("Password should be")) return "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
    if (msg.includes("rate limit")) return "تم تجاوز عدد المحاولات المسموحة، يرجى المحاولة لاحقاً";
    return msg;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? translateAuthError(error.message) : null };
  };

  const signUp = async (email: string, password: string) => {
    if (password.length < 6) return { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" };
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error ? translateAuthError(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
