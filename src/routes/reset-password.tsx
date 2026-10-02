import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, Check, Eye, EyeOff, Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { useAuth } from "@/lib/use-auth";
import { useLanguage } from "@/lib/language";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password | ZacTrades" },
      {
        name: "description",
        content: "Set a new password for your ZacTrades account.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { loading, passwordRecoveryMode, signOut, updatePassword } = useAuth();
  const { t } = useLanguage();
  const [canResetPassword, setCanResetPassword] = useState(() => urlHasRecoveryType());
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (passwordRecoveryMode || urlHasRecoveryType()) {
      setCanResetPassword(true);
      return;
    }

    if (loading) return;

    const redirectDelay = urlHasAuthCode() ? 1200 : 0;
    const timeoutId = window.setTimeout(() => {
      if (!urlHasRecoveryType()) {
        window.location.replace("/");
      }
    }, redirectDelay);

    return () => window.clearTimeout(timeoutId);
  }, [loading, passwordRecoveryMode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setErrorMessage(t("auth.passwordMismatch"));
      setSubmitting(false);
      return;
    }

    try {
      await updatePassword(password);
      await signOut();
      setSuccessMessage(t("auth.passwordUpdated"));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("auth.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <Navbar />
      <main className="relative overflow-hidden pt-32 pb-20 md:pt-40">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
        <div className="grid-bg absolute inset-0 -z-10" />
        <section className="mx-auto grid min-h-[52vh] max-w-xl place-items-center px-4 md:px-6">
          <div className="glass-strong w-full rounded-3xl border border-border/60 p-6 sm:p-8">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-electric ring-1 ring-primary/30">
              {successMessage ? <Check className="h-8 w-8" /> : <Lock className="h-8 w-8" />}
            </div>
            <p className="mt-6 text-center text-xs font-semibold uppercase tracking-[0.28em] text-electric">
              ZacTrades account
            </p>
            <h1 className="mt-3 text-center font-display text-3xl font-bold sm:text-4xl">
              {t("auth.forgotTitle")}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-center text-sm leading-6 text-muted-foreground">
              Choose a new password for your account.
            </p>

            {!canResetPassword && !successMessage ? (
              <div className="mt-7 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">Checking account link...</p>
              </div>
            ) : successMessage ? (
              <div className="mt-7 text-center">
                <p className="rounded-xl border border-bull/35 bg-bull/10 p-4 text-sm text-bull">
                  {successMessage}
                </p>
                <Button
                  asChild
                  className="mt-6 text-primary-foreground glow-primary hover:opacity-90"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Link to="/">
                    Go sign in
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                <PasswordInput
                  id="reset-password"
                  name="password"
                  label={t("auth.newPassword")}
                  showPassword={showPassword}
                  onToggle={() => setShowPassword((current) => !current)}
                  disabled={submitting}
                />

                <PasswordInput
                  id="reset-confirm-password"
                  name="confirmPassword"
                  label={t("auth.confirmPassword")}
                  showPassword={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword((current) => !current)}
                  disabled={submitting}
                />

                {errorMessage && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-semibold text-primary-foreground glow-primary hover:opacity-90"
                  style={{ background: "var(--gradient-primary)" }}
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Update password
                </Button>
              </form>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function urlHasRecoveryType() {
  if (typeof window === "undefined") return false;

  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  return searchParams.get("type") === "recovery" || hashParams.get("type") === "recovery";
}

function urlHasAuthCode() {
  if (typeof window === "undefined") return false;

  return new URLSearchParams(window.location.search).has("code");
}

function PasswordInput({
  id,
  name,
  label,
  showPassword,
  onToggle,
  disabled,
}: {
  id: string;
  name: string;
  label: string;
  showPassword: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <div className="relative mt-1">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          required
          minLength={6}
          placeholder="••••••••"
          className="bg-background/40 pl-9 pr-11"
          disabled={disabled}
        />
        <button
          type="button"
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          onClick={onToggle}
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={disabled}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
