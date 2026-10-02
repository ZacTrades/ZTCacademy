import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Check,
  Clock3,
  MessageSquareText,
  Play,
  Radio,
  Shield,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckoutDialog } from "@/components/site/CheckoutDialog";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { StaffCheckoutNotice } from "@/components/site/StaffCheckoutNotice";
import {
  fetchLiveTradingPackages,
  liveTradingPackages,
} from "@/components/site/liveTradingPackages";
import liveTradingPreview from "@/assets/live-trading-room-preview.png";
import { useCurrency } from "@/lib/currency";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/live-trading")({
  head: () => ({
    meta: [
      { title: "Live Trading Room | ZacTrades" },
      {
        name: "description",
        content:
          "Join the ZacTrades live trading room with daily market sessions, real-time analysis, replay access, and flexible monthly plans.",
      },
      { property: "og:title", content: "Live Trading Room | ZacTrades" },
      {
        property: "og:description",
        content: "Daily live trading sessions, market commentary, and premium room access.",
      },
    ],
  }),
  component: LiveTradingPage,
});

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const roomBenefits = [
  "Live trading every day during the New York session",
  "Daily and weekly market analysis: Nasdaq, gold, FX, and more",
  "Pre-market live prep: plan, prepare, execute",
  "Q&A access: ask, learn, and get answers",
  "Extra psychology talks for mindset, discipline, and control",
  "Exclusive access to the Discord community",
];

const sessionFlow = [
  {
    icon: Clock3,
    title: "Pre-market Preparation",
    description:
      "We mark liquidity, bias, invalidation, and the high-probability zones before the session starts.",
  },
  {
    icon: Radio,
    title: "Live execution",
    description:
      "Follow the screen share while entries, exits, and trade management decisions are explained live.",
  },
  {
    icon: BarChart3,
    title: "Trade recap",
    description:
      "Review what worked, what failed, and what needs improvement so every session becomes study material.",
  },
];

function LiveTradingPage() {
  const { isStaff } = useAuth();
  const { formatPrice } = useCurrency();
  const [open, setOpen] = useState(false);
  const [selectedLivePackage, setSelectedLivePackage] = useState(0);
  const [livePackages, setLivePackages] = useState(liveTradingPackages);

  useEffect(() => {
    let mounted = true;

    fetchLiveTradingPackages().then((packages) => {
      if (mounted) {
        setLivePackages(packages);
        setSelectedLivePackage((current) => Math.min(current, packages.length - 1));
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const selectPackage = (index: number) => {
    setSelectedLivePackage(index);
    setOpen(true);
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <Navbar />
      <main>
        <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
          <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
          <div className="grid-bg absolute inset-0 -z-10" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/45 via-background/80 to-background" />
          <div className="absolute left-1/2 top-20 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />

          <div className="mx-auto grid max-w-7xl gap-12 px-4 md:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <motion.div {...fadeUp}>
              <Badge
                variant="outline"
                className="glass mb-6 max-w-full border-bull/40 text-left text-xs uppercase tracking-[0.12em] whitespace-normal leading-relaxed sm:whitespace-nowrap"
              >
                <span className="mr-1.5 h-2 w-2 rounded-full bg-bull animate-pulse-glow" />
                LIVE TRADING EVERY DAY AT 09H:00 AM (NEW YORK TIMEZONE)
              </Badge>
              <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-7xl">
                Trade With Me. <span className="text-gradient">Learn From The Process.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Join Me live every day during the New York session and see how I prepare, analyze, execute, and manage trades in real time. Learn the process behind every decision , not just the trade.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() => setOpen(true)}
                  style={{ background: "var(--gradient-primary)" }}
                  className="group h-12 px-7 font-semibold text-primary-foreground glow-primary hover:opacity-90"
                >
                  JOIN THE LIVE ROOM
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="glass h-12 border-border/60 px-7 font-semibold"
                >
                  <a href="#plans">See Plans</a>
                </Button>
              </div>
            </motion.div>

            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.12 }}
              className="relative"
            >
              <div className="glass-strong overflow-hidden rounded-3xl p-3 glow-primary md:p-4">
                <div className="flex flex-wrap items-center gap-2 px-3 py-2">
                  <span className="h-3 w-3 rounded-full bg-bear/70" />
                  <span className="h-3 w-3 rounded-full bg-gold/70" />
                  <span className="h-3 w-3 rounded-full bg-bull/70" />
                  <span className="ml-0 min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground sm:ml-4">
                    live-room / market execution
                  </span>
                  <span className="rounded-full border border-bull/30 bg-bull/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-bull">
                    https://www.zactrades.com/
                  </span>
                </div>

                <div className="rounded-2xl border border-border/70 bg-[#070b10] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-bold">NASDAQ live breakdown</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        New York session screen share and room chat
                      </p>
                    </div>
                    <Badge className="border-bear/40 bg-bear/20 text-bear">REC</Badge>
                  </div>
                  <div className="group relative mt-4 overflow-hidden rounded-xl border border-border/60 bg-background/50">
                    <img
                      src={liveTradingPreview}
                      alt="ZacTrades live TradingView screen share"
                      className="w-full object-cover opacity-95 transition-transform duration-700 group-hover:scale-[1.015]"
                    />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <RoomStat label="Members live" value="180" icon={Users} />
                    <RoomStat label="Session bias" value="Bullish" icon={TrendingUp} />
                    <RoomStat label="Trades Taken" value="1" icon={Zap} />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-14 md:py-20">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="glass mb-4 border-primary/40 text-xs">
                <Play className="mr-1.5 h-3.5 w-3.5 text-electric" />
                What You Get
              </Badge>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Built for traders who want live context
              </h2>
              <p className="mt-4 text-muted-foreground">
                Every session is focused on preparation, execution, risk, and review.
              </p>
            </motion.div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {roomBenefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: index * 0.04 }}
                  className="glass rounded-2xl p-5"
                >
                  <div className="flex gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-bull/15 text-bull">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>
                    <p className="text-sm leading-6 text-muted-foreground">{benefit}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 md:py-20">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {sessionFlow.map((step, index) => (
                <motion.div
                  key={step.title}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: index * 0.08 }}
                  className="glass-strong rounded-3xl p-7"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-electric ring-1 ring-primary/30">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-display text-xl font-bold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="plans" className="py-14 md:py-20">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="glass mb-4 border-gold/40 text-xs">
                Flexible Duration
              </Badge>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Choose Your live Trading Plan
              </h2>
              <p className="mt-4 text-muted-foreground">
                Choose the plan that fits you best. Get full access to the Live Trading Room, daily New York session trading, market analysis, Q&A, psychology, and the ZTC community.

              </p>
            </motion.div>

            {isStaff ? (
              <div className="mx-auto mt-10 max-w-2xl">
                <StaffCheckoutNotice description="Live trading checkout is hidden for admin and moderator accounts. Staff can manage live-room package pricing from the admin page." />
              </div>
            ) : (
              <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {livePackages.map((option, index) => (
                  <motion.button
                    key={option.duration}
                    type="button"
                    onClick={() => selectPackage(index)}
                    {...fadeUp}
                    transition={{ ...fadeUp.transition, delay: index * 0.06 }}
                    className={
                      "group rounded-3xl border p-6 text-left transition-all hover:-translate-y-1 " +
                      (selectedLivePackage === index
                        ? "border-gold/60 bg-gold/10 ring-1 ring-gold/30"
                        : "border-border/60 bg-background/40 hover:border-primary/40 hover:bg-primary/5")
                    }
                  >
                    <div className="flex min-h-8 items-start justify-between gap-3">
                      <h3 className="font-display text-2xl font-bold">{option.duration}</h3>
                      {option.badge && (
                        <span className="rounded-full bg-bull/15 px-2.5 py-1 text-[10px] font-semibold text-bull">
                          {option.badge}
                        </span>
                      )}
                    </div>
                    <div className="mt-6">
                      {option.originalPrice && (
                        <p className="mb-1 font-mono text-sm font-semibold text-bull">
                          You save {formatPrice(option.originalPrice)}
                        </p>
                      )}
                      <p className="font-mono text-4xl font-bold text-gradient-gold">
                        {formatPrice(option.price)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatPrice(option.monthly)}
                      </p>
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-5">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Start now
                      </span>
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-electric transition-transform group-hover:translate-x-1">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="pb-20 md:pb-28">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <motion.div {...fadeUp} className="glass-strong overflow-hidden rounded-3xl p-6 md:p-8">
              <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                <div>
                  <Badge variant="outline" className="glass border-bull/40 text-xs">
                    Premium Room
                  </Badge>
                  <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">
                    See The Thinking Behind Every Trade.
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    You don't just see the entry. You see the analysis behind it — what I am looking for, why the setup makes sense, where it becomes invalid, and how risk is managed before the trade is taken
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <TrustCard
                    icon={Shield}
                    title="Risk comes before the trade."
                    text="Every setup has a clear invalidation point, stop loss, and defined risk before execution."
                  />
                  <TrustCard
                    icon={MessageSquareText}
                    title="Ask questions"
                    text="Use the Room chat and Ask questions during the live session and understand the reasoning behind the analysis, setup, and trade management."
                  />
                  <TrustCard
                    icon={Users}
                    title="Trade With The Community"
                    text="Learn alongside other traders, share ideas, ask questions, and stay focused on improving your execution."
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
      <CheckoutDialog
        open={open}
        onOpenChange={setOpen}
        initialPackageIndex={selectedLivePackage}
        packages={livePackages}
      />
    </div>
  );
}

function RoomStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/45 p-3">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-electric">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="font-mono text-sm font-semibold">{value}</div>
        </div>
      </div>
    </div>
  );
}

function TrustCard({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/45 p-5">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-bull/15 text-bull">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p>
    </div>
  );
}
