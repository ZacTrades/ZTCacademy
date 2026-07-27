import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  Clock,
  ExternalLink,
  GraduationCap,
  Lock,
  LogIn,
  PlayCircle,
  Shield,
  Target,
  UserPlus,
} from "lucide-react";
import { useState } from "react";

import { AuthDialog } from "@/components/site/AuthDialog";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/education")({
  head: () => ({
    meta: [
      { title: "Education Library | ZacTrades" },
      {
        name: "description",
        content:
          "Trading education library with bootcamp, study, psychology, risk management, and premium video lessons.",
      },
      { property: "og:title", content: "Education Library | ZacTrades" },
      {
        property: "og:description",
        content:
          "Bootcamp, study, psychology, risk management, and premium lessons for serious traders.",
      },
    ],
  }),
  component: EducationPage,
});

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const sections = [
  {
    id: "bootcamp",
    label: "Bootcamp",
    title: "Bootcamp",
    description: "Start with the market foundations every serious trader needs.",
    icon: GraduationCap,
    tone: "text-gold border-gold/40 bg-gold/10",
    videos: [
      {
        title: "Trading for Beginners Full Course",
        focus: "Market structure, chart basics, and order types",
        length: "Beginner",
        query: "trading for beginners full course market structure order types",
      },
      {
        title: "Candlestick Patterns Explained",
        focus: "Reversal candles, continuation candles, and confirmation",
        length: "Beginner",
        query: "candlestick patterns explained for beginners trading",
      },
      {
        title: "Support and Resistance Masterclass",
        focus: "Levels, zones, retests, and breakout context",
        length: "Core skill",
        query: "support and resistance trading masterclass",
      },
    ],
  },
  {
    id: "study",
    label: "Study",
    title: "Study",
    description: "Build a repeatable review routine and sharpen your analysis.",
    icon: BookOpen,
    tone: "text-electric border-primary/40 bg-primary/10",
    videos: [
      {
        title: "How to Backtest a Trading Strategy",
        focus: "Rules, sample size, and journaling your results",
        length: "Study routine",
        query: "how to backtest a trading strategy properly",
      },
      {
        title: "Top Down Analysis Tutorial",
        focus: "Higher timeframes, bias, and execution zones",
        length: "Analysis",
        query: "top down analysis trading tutorial",
      },
      {
        title: "Trading Journal Setup",
        focus: "Track mistakes, setups, emotions, and improvement",
        length: "Workflow",
        query: "trading journal setup for day traders",
      },
    ],
  },
  {
    id: "psychology",
    label: "Psychology",
    title: "Psychology",
    description: "Control fear, greed, overtrading, and revenge trading.",
    icon: Brain,
    tone: "text-bull border-bull/40 bg-bull/10",
    videos: [
      {
        title: "Trading Psychology Explained",
        focus: "Discipline, patience, and emotional control",
        length: "Mindset",
        query: "trading psychology discipline emotional control",
      },
      {
        title: "How to Stop Revenge Trading",
        focus: "Reset rules, loss limits, and execution discipline",
        length: "Behavior",
        query: "how to stop revenge trading",
      },
      {
        title: "Building Confidence as a Trader",
        focus: "Process confidence instead of outcome confidence",
        length: "Mindset",
        query: "how to build confidence in trading psychology",
      },
    ],
  },
  {
    id: "risk",
    label: "Risk Management",
    title: "Risk Management",
    description: "Protect capital with position sizing, stops, and drawdown limits.",
    icon: Shield,
    tone: "text-bear border-bear/40 bg-bear/10",
    videos: [
      {
        title: "Risk Management for Traders",
        focus: "Risk per trade, max daily loss, and survival rules",
        length: "Essential",
        query: "risk management for traders risk per trade",
      },
      {
        title: "Position Sizing Tutorial",
        focus: "Lot size, account size, stop distance, and risk percentage",
        length: "Calculator",
        query: "position sizing trading tutorial risk percentage",
      },
      {
        title: "Risk Reward Ratio Explained",
        focus: "R multiples, win rate, expectancy, and trade selection",
        length: "Core skill",
        query: "risk reward ratio explained trading expectancy",
      },
    ],
  },
  {
    id: "premium",
    label: "Premium",
    title: "Premium",
    description:
      "Go deeper with advanced execution, elite review, and higher-level trade planning.",
    icon: Target,
    tone: "text-gold border-gold/40 bg-gold/10",
    videos: [
      {
        title: "Advanced Smart Money Concepts",
        focus: "Liquidity, displacement, fair value gaps, and premium entry logic",
        length: "Premium",
        query: "advanced smart money concepts liquidity displacement fair value gaps trading",
      },
      {
        title: "Institutional Order Flow Trading",
        focus: "Reading intent, market delivery, and confirmation around key levels",
        length: "Advanced",
        query: "institutional order flow trading advanced tutorial",
      },
      {
        title: "Elite Trade Review Framework",
        focus: "Grade setup quality, execution, risk, emotions, and improvement notes",
        length: "Review system",
        query: "advanced trade review framework trading journal execution",
      },
    ],
  },
];

function youtubeSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function EducationPage() {
  const { user, loading: authLoading, isConfigured } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "join">("signin");

  const openAuth = (mode: "signin" | "join") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <SectionNav />
        {sections.map((section, index) => (
          <VideoSection
            key={section.id}
            section={section}
            index={index}
            canAccessPremium={Boolean(user)}
            authLoading={authLoading}
            isConfigured={isConfigured}
            onOpenAuth={openAuth}
          />
        ))}
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

function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-20">
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
      <div className="grid-bg absolute inset-0 -z-10" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/70 to-background" />

      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="glass mb-6 gap-2 border-primary/30 px-4 py-1.5">
            <PlayCircle className="h-3.5 w-3.5 text-electric" />
            Video education library
          </Badge>
          <h1 className="font-display text-5xl font-bold leading-tight tracking-tight md:text-7xl">
            Learn the <span className="text-gradient">process</span> before risking capital.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            Five focused paths for building a stronger trading foundation: bootcamp, study,
            psychology, risk management, and premium execution.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function SectionNav() {
  return (
    <section className="sticky top-24 z-30 border-y border-border/40 bg-background/80 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 md:px-6">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-md border border-border/60 bg-background/50 px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <section.icon className="h-3.5 w-3.5" />
            {section.label}
          </a>
        ))}
      </div>
    </section>
  );
}

function VideoSection({
  section,
  index,
  canAccessPremium,
  authLoading,
  isConfigured,
  onOpenAuth,
}: {
  section: (typeof sections)[number];
  index: number;
  canAccessPremium: boolean;
  authLoading: boolean;
  isConfigured: boolean;
  onOpenAuth: (mode: "signin" | "join") => void;
}) {
  const isPremium = section.id === "premium";
  const shouldLockPremium = isPremium && !canAccessPremium;

  return (
    <section id={section.id} className="scroll-mt-32 py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div
          {...fadeUp}
          className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <Badge variant="outline" className={`mb-4 ${section.tone}`}>
              <section.icon className="mr-1.5 h-3.5 w-3.5" />
              {section.label}
            </Badge>
            <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
              {section.title}
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">{section.description}</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-xs text-muted-foreground">
            <BarChart3 className="h-3.5 w-3.5 text-electric" />
            Path {String(index + 1).padStart(2, "0")}
          </div>
        </motion.div>

        {shouldLockPremium ? (
          <LockedPremiumSection
            authLoading={authLoading}
            isConfigured={isConfigured}
            onOpenAuth={onOpenAuth}
          />
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              {section.videos.map((video, videoIndex) => (
                <motion.article
                  key={video.title}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: videoIndex * 0.06 }}
                  className="glass group flex min-h-72 flex-col overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-1 hover:border-primary/40"
                >
                  <div className="flex aspect-video items-center justify-center rounded-xl border border-border/60 bg-background/60">
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-electric ring-1 ring-primary/30 transition-transform group-hover:scale-105">
                      <PlayCircle className="h-7 w-7" />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-1 flex-col">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {video.length}
                    </div>
                    <h3 className="mt-3 font-display text-lg font-bold">{video.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
                      {video.focus}
                    </p>

                    <Button
                      asChild
                      className="mt-5 w-full text-primary-foreground glow-primary hover:opacity-90"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      <a href={youtubeSearchUrl(video.query)} target="_blank" rel="noreferrer">
                        Watch on YouTube
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>
                </motion.article>
              ))}
            </div>

            <motion.div {...fadeUp} className="mt-6">
              <Button asChild variant="outline" className="glass border-primary/40">
                <a
                  href={youtubeSearchUrl(`${section.title} trading course playlist`)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open more {section.label} videos
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
}

function LockedPremiumSection({
  authLoading,
  isConfigured,
  onOpenAuth,
}: {
  authLoading: boolean;
  isConfigured: boolean;
  onOpenAuth: (mode: "signin" | "join") => void;
}) {
  return (
    <motion.div
      {...fadeUp}
      className="relative overflow-hidden rounded-3xl border border-gold/30 bg-card/35 p-6 shadow-[0_0_80px_-48px_oklch(0.83_0.16_82/0.9)] md:p-10"
    >
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold/15 blur-3xl" />
      <div className="relative grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gold/15 text-gold ring-1 ring-gold/30">
            <Lock className="h-7 w-7" />
          </div>
          <Badge variant="outline" className="glass mt-6 border-gold/40 text-xs text-gold">
            Members only
          </Badge>
          <h3 className="mt-5 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Premium lessons unlock after login.
          </h3>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
            Sign in or create your ZacTrades account to access advanced execution videos, trade
            review frameworks, and higher-level planning lessons.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              onClick={() => onOpenAuth("signin")}
              disabled={!isConfigured || authLoading}
              className="text-primary-foreground glow-primary hover:opacity-90"
              style={{ background: "var(--gradient-primary)" }}
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </Button>
            <Button
              type="button"
              variant="outline"
              className="glass border-border/60"
              onClick={() => onOpenAuth("join")}
              disabled={!isConfigured || authLoading}
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
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {["Advanced entries", "Elite reviews", "Planning system"].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-border/50 bg-background/45 p-4 text-sm text-muted-foreground"
            >
              <div className="mb-5 flex aspect-video items-center justify-center rounded-xl border border-border/50 bg-background/70">
                <Lock className="h-6 w-6 text-gold" />
              </div>
              <div className="font-semibold text-foreground">{item}</div>
              <div className="mt-2 text-xs leading-5">Available for signed-in members.</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
