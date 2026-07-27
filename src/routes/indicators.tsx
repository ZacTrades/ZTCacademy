import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  BarChart3,
  Check,
  ExternalLink,
  Lock,
  LogIn,
  RefreshCw,
  Sparkles,
  UserPlus,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AuthDialog } from "@/components/site/AuthDialog";
import { CandleChart } from "@/components/site/CandleChart";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import tradingViewPreview from "@/assets/zactrades-tradingview-preview.jpeg";
import {
  defaultIndicators,
  fetchIndicators,
  type IndicatorRow,
} from "@/components/site/editableContent";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/indicators")({
  head: () => ({
    meta: [
      { title: "Premium Indicators | ZacTrades" },
      {
        name: "description",
        content:
          "Member-only ZacTrades premium TradingView indicators for trend confirmation, liquidity sweeps, and structured execution.",
      },
      { property: "og:title", content: "Premium Indicators | ZacTrades" },
      {
        property: "og:description",
        content: "Member-only premium indicators managed by ZacTrades.",
      },
    ],
  }),
  component: IndicatorsPage,
});

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const memberBenefits = [
  "TradingView-ready indicator access",
  "Structured setup confirmation",
  "Cleaner execution with less chart noise",
];

function IndicatorsPage() {
  const { user, loading: authLoading, isConfigured } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "join">("signin");
  const [indicators, setIndicators] = useState<IndicatorRow[]>([]);
  const [loadingIndicators, setLoadingIndicators] = useState(false);
  const canAccess = Boolean(user);

  const openAuth = (mode: "signin" | "join") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const loadIndicators = useCallback(async () => {
    if (!user) return;

    setLoadingIndicators(true);
    const nextIndicators = await fetchIndicators();
    setIndicators(nextIndicators);
    setLoadingIndicators(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      void loadIndicators();
      return;
    }

    setIndicators([]);
    setLoadingIndicators(false);
  }, [loadIndicators, user]);

  const visibleIndicators = indicators.length ? indicators : defaultIndicators;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <section className="relative overflow-hidden pt-32 pb-14 md:pt-40 md:pb-20">
          <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
          <div className="grid-bg absolute inset-0 -z-10" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/45 via-background/75 to-background" />

          <div className="mx-auto grid max-w-7xl gap-10 px-4 md:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <motion.div {...fadeUp}>
              <Badge variant="outline" className="glass mb-6 gap-2 border-primary/40 text-xs">
                <BarChart3 className="h-3.5 w-3.5 text-electric" />
                Member Indicators
              </Badge>
              <h1 className="font-display text-5xl font-bold leading-tight tracking-tight md:text-7xl">
                Premium indicators for cleaner <span className="text-gradient">execution.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Access ZacTrades indicators built to support market structure, trend confirmation,
                liquidity sweeps, and disciplined entries.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {canAccess ? (
                  <Button
                    type="button"
                    onClick={loadIndicators}
                    disabled={loadingIndicators}
                    className="text-primary-foreground glow-primary hover:opacity-90"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingIndicators ? "animate-spin" : ""}`} />
                    Refresh indicators
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      onClick={() => openAuth("signin")}
                      className="text-primary-foreground glow-primary hover:opacity-90"
                      style={{ background: "var(--gradient-primary)" }}
                      disabled={!isConfigured || authLoading}
                    >
                      <LogIn className="h-4 w-4" />
                      Sign in
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="glass border-border/60"
                      onClick={() => openAuth("join")}
                      disabled={!isConfigured || authLoading}
                    >
                      <UserPlus className="h-4 w-4" />
                      Create account
                    </Button>
                  </>
                )}
              </div>
            </motion.div>

            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.1 }}
              className="glass-strong relative overflow-hidden rounded-3xl p-5 md:p-6"
            >
              <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/25 blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-electric">
                      TradingView Toolkit
                    </div>
                    <h2 className="mt-2 font-display text-2xl font-bold">What members unlock</h2>
                  </div>
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-gold/15 text-gold ring-1 ring-gold/30">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-6 grid gap-3">
                  {memberBenefits.map((benefit) => (
                    <div
                      key={benefit}
                      className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/45 px-4 py-3 text-sm text-muted-foreground"
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-bull/15 text-bull">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                      {benefit}
                    </div>
                  ))}
                </div>
                <div className="mt-6 overflow-hidden rounded-2xl border border-primary/25 bg-[#05080d] p-2 shadow-[0_0_45px_-28px_hsl(var(--primary)/0.95)]">
                  <div className="relative aspect-[1288/887] w-full overflow-hidden rounded-xl bg-background">
                    <img
                      src={tradingViewPreview}
                      alt="TradingView chart preview with ZacTrades execution watermark"
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                    <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="pb-24">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            {authLoading ? (
              <AccessStatus title="Checking access" description="Verifying your member account." />
            ) : canAccess ? (
              <div className="grid gap-5 lg:grid-cols-3">
                {visibleIndicators.map((indicator, index) => (
                  <motion.div
                    key={indicator.slug}
                    {...fadeUp}
                    transition={{ ...fadeUp.transition, delay: index * 0.06 }}
                    className="glass group relative overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-1"
                  >
                    <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
                    <div className="relative">
                      <div className="flex items-start justify-between gap-4">
                        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-electric ring-1 ring-primary/25">
                          <Zap className="h-5 w-5" />
                        </div>
                        <Badge className="border-gold/30 bg-gold/15 text-gold">
                          {indicator.tag}
                        </Badge>
                      </div>
                      <h3 className="mt-5 font-display text-xl font-bold">{indicator.name}</h3>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {indicator.description}
                      </p>
                      <div className="mt-5 h-36 overflow-hidden rounded-xl bg-background/60 ring-1 ring-border/60">
                        <CandleChart count={40} height={140} />
                      </div>
                      <div className="mt-4 rounded-xl border border-border/50 bg-background/45 px-4 py-3 font-mono text-xs text-muted-foreground">
                        {indicator.stats_label}
                      </div>
                      <Button
                        asChild
                        size="sm"
                        className="mt-4 w-full font-semibold text-primary-foreground glow-primary hover:opacity-90"
                        style={{ background: "var(--gradient-primary)" }}
                      >
                        <a href={indicator.tradingview_url} target="_blank" rel="noreferrer">
                          Open on TradingView
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                {...fadeUp}
                className="mx-auto max-w-3xl rounded-2xl border border-primary/30 bg-card/35 p-6 text-center shadow-[0_0_70px_-45px_oklch(0.68_0.19_250/0.9)] md:p-10"
              >
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-electric ring-1 ring-primary/30">
                  <Lock className="h-7 w-7" />
                </div>
                <Badge variant="outline" className="glass mt-6 border-gold/40 text-xs">
                  Members only
                </Badge>
                <h2 className="mt-5 font-display text-3xl font-bold tracking-tight md:text-4xl">
                  Sign in to view premium indicators.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
                  The indicator library is available after you sign in or create a ZacTrades
                  account.
                </p>
                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button
                    type="button"
                    onClick={() => openAuth("signin")}
                    className="text-primary-foreground glow-primary hover:opacity-90"
                    style={{ background: "var(--gradient-primary)" }}
                    disabled={!isConfigured}
                  >
                    <LogIn className="h-4 w-4" />
                    Sign in
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="glass border-border/60"
                    onClick={() => openAuth("join")}
                    disabled={!isConfigured}
                  >
                    <UserPlus className="h-4 w-4" />
                    Create account
                  </Button>
                </div>
                {!isConfigured && (
                  <p className="mt-4 text-xs text-destructive">
                    Supabase is not configured, so authentication is unavailable.
                  </p>
                )}
              </motion.div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <AuthDialog
        open={authOpen}
        mode={authMode}
        onOpenChange={setAuthOpen}
        onModeChange={setAuthMode}
      />
    </div>
  );
}

function AccessStatus({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/35 p-8 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-primary/15 text-electric ring-1 ring-primary/30">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
      <h2 className="mt-5 font-display text-2xl font-bold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
