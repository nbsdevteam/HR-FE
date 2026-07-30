import { useState } from "react";
import { motion } from "motion/react";
import { Lock, Mail, Loader2, Eye, EyeOff, UserPlus, LogIn } from "lucide-react";
import { useAuth } from "../lib/auth";
import { arabicSource } from "../i18n/source";

export function Login() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError(arabicSource("login.please_enter_your_email_and_password")); return; }
    setLoading(true);
    setError("");
    setSuccess("");

    if (mode === "login") {
      const { error: err } = await signIn(email, password);
      if (err) setError(err);
    } else {
      const { error: err } = await signUp(email, password);
      if (err) {
        setError(err);
      } else {
        setSuccess(arabicSource("login.account_created_successfully_you_can_now_log_in"));
        setMode("login");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -start-32 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 -end-32 w-64 h-64 rounded-full bg-primary/3 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10"
          >
            <Lock className="w-10 h-10 text-primary" />
          </motion.div>
          <h1 className="text-gradient-gold text-2xl font-bold mb-1">{arabicSource("login.human_resources_management_system")}</h1>
          <p className="text-muted-foreground" style={{ fontSize: 14 }}>
            {mode === "login" ? arabicSource("login.log_in_to_your_account") : arabicSource("login.create_a_new_account")}
          </p>
        </div>

        {/* Form Card */}
        <motion.form
          onSubmit={handleSubmit}
          className="bg-card/30 backdrop-blur-md border border-border/40 rounded-2xl p-6 space-y-4 shadow-xl"
        >
          {/* Email */}
          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("common.email")}</label>
            <div className="relative">
              <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full ps-10 pe-4 py-2.5 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
                placeholder="example@company.com"
                dir="ltr"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("login.password")}</label>
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full ps-10 pe-10 py-2.5 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
                placeholder="••••••••"
                dir="ltr"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error/Success */}
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2"
              style={{ fontSize: 13 }}>
              {error}
            </motion.p>
          )}
          {success && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2"
              style={{ fontSize: 13 }}>
              {success}
            </motion.p>
          )}

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium shadow-lg shadow-primary/20 hover:bg-gold-dark transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ fontSize: 14 }}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : mode === "login" ? (
              <><LogIn className="w-5 h-5" /> {arabicSource("login.login")}</>
            ) : (
              <><UserPlus className="w-5 h-5" /> {arabicSource("login.create_account")}</>
            )}
          </motion.button>

          {/* Toggle mode */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setSuccess(""); }}
              className="text-primary hover:underline cursor-pointer"
              style={{ fontSize: 13 }}
            >
              {mode === "login" ? arabicSource("login.don_t_have_an_account_create_a_new_account") : arabicSource("login.already_have_an_account_login")}
            </button>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
}
