"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { API_BASE_URL, fetchClient } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail, Shield, Ban, CreditCard, MonitorPlay, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

const SECURITY_BADGES = [
  { icon: Shield, label: "256-Bit TLS", sub: "Bank-grade session" },
  { icon: Ban, label: "Zero Spam", sub: "Only tickets & alerts" },
  { icon: CreditCard, label: "Wallet Pass", sub: "Apple & Google sync" },
];

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useAuthStore();

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const handleLogin = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const res = await fetchClient("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setUser(res.user);

      if (res.user.role === "admin") {
        toast.success(`Welcome Admin, ${res.user.name}!`);
        router.push("/admin");
      } else {
        toast.success(`Welcome back, ${res.user.name}!`);
        router.push("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const res = await fetchClient("/auth/register", {
        method: "POST",
        body: JSON.stringify({ ...data, role: "user" }),
      });
      setUser(res.user);
      toast.success("Account created! Welcome to CineBook.");
      router.push("/");
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">

      {/* ── LEFT: Cinematic Still ── */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col overflow-hidden bg-surface-dim">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&auto=format&fit=crop&q=80"
            alt="Cinema"
            fill
            priority
            sizes="45vw"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-linear-to-t from-surface-dim via-surface-dim/70 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-r from-surface-dim/30 to-transparent" />
        </div>

        {/* Content over image */}
        <div className="relative z-10 flex flex-col h-full p-10 max-w-2xl mx-auto w-full">
          {/* Top label */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-confirmed animate-pulse" />
            <span className="text-[11px] uppercase tracking-[0.12em] font-semibold text-surface-foreground/70">
              Curated Screening Vault
            </span>
          </div>

          {/* Film info — bottom of panel */}
          <div className="mt-auto space-y-4">
            <p className="text-[11px] uppercase tracking-[0.12em] font-semibold text-primary">
              NOW PREMIERING
            </p>
            <h2 className="font-display text-[52px] leading-none tracking-[0.03em] text-white uppercase">
              THE MIDNIGHT REQUIEM
            </h2>
            <p className="text-sm text-surface-foreground/60 leading-relaxed max-w-90">
              Experience 70mm archival restorations and premier festival screenings with millimeter-precise laser audio calibrated for pure cinephile devotion.
            </p>

            {/* Selected auditoria card */}
            <div className="mt-6 rounded-md bg-surface-elevated/80 backdrop-blur-md border border-border p-4">
              <div className="flex items-start justify-between">
                <p className="text-[11px] uppercase tracking-widest font-semibold text-surface-foreground/50">
                  Selected Auditoria
                </p>
                <span className="px-2 py-0.5 rounded-[3px] bg-gold/10 border border-gold/30 text-gold text-[10px] font-semibold uppercase tracking-[0.08em]">
                  IMAX 70MM
                </span>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <div className="w-9 h-9 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <MonitorPlay className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">Grand Horizon Palladium</p>
                  <p className="text-xs text-surface-foreground/50">Chamber 01 • Row F • Center Tier</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-surface-foreground/50 mt-4">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-status-confirmed" />
                Encrypted Seat Reservation
              </span>
              <span className="font-mono text-primary">v4.18-K</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Auth Form ── */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-border">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-surface-foreground/60 hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Storefront
          </Link>
          <Link href="/admin/login" className="flex items-center gap-1.5 text-sm text-surface-foreground/60 hover:text-foreground transition-colors">
            <MonitorPlay className="h-4 w-4" />
            Operator Gateway
          </Link>
        </div>

        {/* Form area — centered */}
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-110 space-y-7">

            {/* Brand + Security */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-DEFAULT bg-primary flex items-center justify-center">
                  <span className="font-display text-sm text-white tracking-wider">C</span>
                </div>
                <span className="font-display text-[26px] tracking-[0.06em] uppercase">CineBook Pass</span>
              </div>
              <span className="flex items-center gap-1.5 text-[11px] text-status-confirmed font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-status-confirmed" />
                TLS 1.3 Vault
              </span>
            </div>

            {/* Mode Toggle */}
            <div className="flex rounded-DEFAULT border border-border bg-surface p-1 gap-1">
              {(["signin", "register"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 rounded-sm text-sm font-semibold transition-all duration-200 ${mode === m
                    ? "bg-surface-elevated text-foreground shadow-sm"
                    : "text-surface-foreground/60 hover:text-foreground"
                    }`}
                >
                  {m === "signin" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            {/* Google OAuth */}
            <div>
              <button
                type="button"
                onClick={() => { window.location.href = `${API_BASE_URL}/auth/google`; }}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-DEFAULT bg-surface border border-border text-sm font-medium hover:border-border-bright transition-all"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
            </div>

            {/* Divider */}
            {/* Sign In Form */}
            {mode === "signin" ? (
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-medium text-foreground">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <Input
                      {...loginForm.register("email")}
                      type="email"
                      placeholder="patron@cinebook.com"
                      className="pl-10"
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="text-[12px] text-status-cancelled">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[13px] font-medium text-foreground">Vault Password</Label>
                    <button type="button" className="text-[13px] text-gold hover:text-gold/80 transition-colors">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <Input
                      {...loginForm.register("password")}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-[12px] text-status-cancelled">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded-[3px] accent-primary border border-border" />
                  <span className="text-sm text-surface-foreground/70 group-hover:text-foreground transition-colors">
                    Remember me for 30 days
                  </span>
                </label>
                <Button type="submit" className="w-full h-12 font-display text-base tracking-[0.06em] uppercase" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In to CineBook →"}
                </Button>
              </form>
            ) : (
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-medium text-foreground">Full Name</Label>
                  <Input {...registerForm.register("name")} placeholder="Your name" />
                  {registerForm.formState.errors.name && (
                    <p className="text-[12px] text-status-cancelled">{registerForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-medium text-foreground">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <Input {...registerForm.register("email")} type="email" placeholder="patron@cinebook.com" className="pl-10" />
                  </div>
                  {registerForm.formState.errors.email && (
                    <p className="text-[12px] text-status-cancelled">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-medium text-foreground">Vault Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <Input
                      {...registerForm.register("password")}
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      className="pl-10 pr-10"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-[12px] text-status-cancelled">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full h-12 font-display text-base tracking-[0.06em] uppercase" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account →"}
                </Button>
              </form>
            )}

            {/* Security Badges */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {SECURITY_BADGES.map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-DEFAULT bg-surface border border-border text-center">
                  <Icon className="h-4 w-4 text-gold" />
                  <span className="text-[11px] font-semibold text-foreground">{label}</span>
                  <span className="text-[10px] text-muted">{sub}</span>
                </div>
              ))}
            </div>

            <p className="text-[12px] text-center text-muted">
              By continuing, you agree to CineBook's{" "}
              <span className="text-foreground/70 hover:text-foreground cursor-pointer transition-colors">Terms of Exhibition</span>{" "}
              and{" "}
              <span className="text-foreground/70 hover:text-foreground cursor-pointer transition-colors">Privacy Policy</span>.
            </p>

            <div className="text-center">
              <button className="flex items-center justify-center gap-2 mx-auto text-[12px] text-muted hover:text-surface-foreground/70 transition-colors">
                <MonitorPlay className="h-3.5 w-3.5" />
                Box Office & Theater SysAdmin Access
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-border text-center">
          <p className="text-[11px] text-muted">CineBook Secure Theatrical Session & Identity Vault</p>
        </div>
      </div>
    </div>
  );
}

