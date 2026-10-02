import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BarChart3, ExternalLink, Lock, LogIn, RefreshCw, UserPlus, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { AuthDialog } from "@/components/site/AuthDialog";
import { CandleChart } from "@/components/site/CandleChart";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  defaultIndicators,
  fetchIndicators,
  type IndicatorRow,
} from "@/components/site/editableContent";
import { useAuth } from "@/lib/use-auth";
import liquidityLevelsPreview from "@/assets/ztc-liquidity-levels-preview.png";

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

const comingSoonIndicatorSlugs = new Set(["liquidity_sweep", "smart_entry_ai"]);

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
    setLoadingIndicators(true);
    const nextIndicators = await fetchIndicators();
    setIndicators(nextIndicators);
    setLoadingIndicators(false);
  }, []);

  useEffect(() => {
    void loadIndicators();
  }, [loadIndicators]);

  const visibleIndicators = indicators.length ? indicators : defaultIndicators;
  const heroIndicator = visibleIndicators.find((indicator) => indicator.video_url?.trim());

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
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
                ZTC Indicators
              </Badge>
              <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-7xl">
                Built To Improve Your  <span className="text-gradient">Trading.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Professional TradingView indicators designed to complement your analysis and help you approach the market with greater clarity and confidence
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
                    Explore The Indicators
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
              className="relative overflow-hidden rounded-3xl"
            >
              <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/25 blur-3xl" />
              <HeroIndicatorPreview indicator={heroIndicator} />
            </motion.div>
          </div>
        </section>

        <section className="pb-24">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            {authLoading ? (
              <AccessStatus title="Checking access" description="Verifying your member account." />
            ) : canAccess ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {visibleIndicators.map((indicator, index) => {
                  const isComingSoon = comingSoonIndicatorSlugs.has(indicator.slug);
                  const thumbnailUrl = indicator.thumbnail_url?.trim();
                  const useLiquidityPreview = index === 0;
                  const useBlurredPreview = index > 0;

                  return (
                    <motion.div
                      key={indicator.slug}
                      {...fadeUp}
                      transition={{ ...fadeUp.transition, delay: index * 0.06 }}
                      className={`glass group relative overflow-hidden rounded-2xl p-5 transition-all ${
                        isComingSoon
                          ? "border-destructive/35 bg-card/45 shadow-[0_0_45px_-30px_rgba(248,113,113,0.85)]"
                          : "hover:-translate-y-1"
                      }`}
                    >
                      <div
                        className={`absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl ${
                          isComingSoon ? "bg-destructive/20" : "bg-primary/20"
                        }`}
                      />
                      {isComingSoon && (
                        <>
                          <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-destructive/70 to-transparent" />
                          <div className="pointer-events-none absolute -right-16 top-16 h-24 w-56 rotate-12 bg-destructive/10 blur-2xl" />
                        </>
                      )}
                      <div className="relative">
                        <div className="flex items-start justify-between gap-4">
                          <div
                            className={`grid h-11 w-11 place-items-center rounded-xl ring-1 ${
                              isComingSoon
                                ? "bg-destructive/12 text-destructive ring-destructive/30"
                                : "bg-primary/15 text-electric ring-primary/25"
                            }`}
                          >
                            {isComingSoon ? <Lock className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                          </div>
                          {isComingSoon ? (
                            <Badge className="gap-1.5 border-destructive/35 bg-destructive/12 px-3 py-1 text-destructive shadow-[0_0_22px_rgba(248,113,113,0.18)]">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
                              Coming soon
                            </Badge>
                          ) : (
                            <Badge className="border-gold/30 bg-gold/15 text-gold">Pro</Badge>
                          )}
                        </div>
                        <h3 className="mt-5 font-display text-xl font-bold">{indicator.name}</h3>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {indicator.description}
                        </p>
                        <div
                          className={`relative mt-5 overflow-hidden rounded-xl bg-background/60 ring-1 ring-border/60 ${
                            useLiquidityPreview ? "aspect-[2910/1398]" : "h-36"
                          }`}
                        >
                          {thumbnailUrl ? (
                            <img
                              src={thumbnailUrl}
                              alt={`${indicator.name} preview`}
                              className="h-full w-full object-cover object-center"
                              loading="lazy"
                            />
                          ) : useLiquidityPreview ? (
                            <img
                              src={liquidityLevelsPreview}
                              alt="ZTC Liquidity Levels chart preview"
                              className="h-full w-full object-contain object-center"
                              loading="lazy"
                            />
                          ) : useBlurredPreview ? (
                            <>
                              <img
                                src={liquidityLevelsPreview}
                                alt=""
                                className="h-full w-full scale-110 object-cover object-center opacity-70 blur-[3px] brightness-75 saturate-125"
                                loading="lazy"
                                aria-hidden
                              />
                              <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-background/35 to-destructive/25" />
                              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/75 to-transparent" />
                            </>
                          ) : (
                            <CandleChart count={40} height={140} />
                          )}
                          {isComingSoon && (
                            <div className="absolute inset-0 grid place-items-center bg-background/55 backdrop-blur-[2px]">
                              <div className="rounded-full border border-destructive/35 bg-background/80 px-4 py-2 text-xs font-black uppercase tracking-[0.26em] text-destructive shadow-[0_0_24px_rgba(248,113,113,0.18)]">
                                In development
                              </div>
                            </div>
                          )}
                        </div>
                        {isComingSoon ? (
                          <Button
                            type="button"
                            size="sm"
                            disabled
                            className="mt-4 w-full border border-destructive/25 bg-destructive/10 font-semibold text-destructive opacity-100"
                          >
                            Coming soon
                            <Lock className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
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
                        )}
                      </div>
                    </motion.div>
                  );
                })}
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

function HeroIndicatorPreview({ indicator }: { indicator?: IndicatorRow }) {
  const videoUrl = indicator?.video_url?.trim();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const playVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    void video.play().catch(() => undefined);
  }, [videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.load();

    const playTimer = window.setTimeout(playVideo, 250);
    return () => window.clearTimeout(playTimer);
  }, [playVideo, videoUrl]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-transparent shadow-[0_0_45px_-30px_hsl(var(--primary)/0.75)]">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#02060b]">
        {videoUrl ? (
          <video
            ref={videoRef}
            key={videoUrl}
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            aria-label={`Video preview for ${indicator?.name ?? "ZacTrades indicator"}`}
            onLoadedData={playVideo}
            onCanPlay={playVideo}
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : (
          <div className="grid h-full w-full place-items-center px-6 text-center text-sm text-muted-foreground">
            Upload a video URL for the first indicator to show the preview here.
          </div>
        )}
      </div>
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
