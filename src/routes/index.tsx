import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Play,
  Radio,
  Users,
  LineChart,
  Mail,
  Brain,
  Shield,
  MessageSquareText,
  GraduationCap,
  BarChart3,
  Sparkles,
  Check,
  Lock,
  ArrowRight,
  Star,
  ChevronDown,
  Trophy,
  Zap,
  TrendingUp,
  Crown,
  Copy,
  ExternalLink,
  Heart,
  Maximize,
  MessageCircle,
  Mic,
  Phone,
  Plus,
  Smile,
  Volume2,
  Wrench,
  Send,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Navbar } from "@/components/site/Navbar";
import { StaffCheckoutNotice } from "@/components/site/StaffCheckoutNotice";
import { TickerTape } from "@/components/site/TickerTape";
import { CandleChart } from "@/components/site/CandleChart";
import { Counter } from "@/components/site/Counter";
import { Footer } from "@/components/site/Footer";
import { CheckoutDialog } from "@/components/site/CheckoutDialog";
import { defaultCoachingPlans, fetchCoachingPlans } from "@/components/site/coachingPlans";
import {
  defaultCommunitySocials,
  defaultIndicators,
  fetchCommunitySocials,
  fetchIndicators,
  fetchTradingTools,
  type CommunitySocialRow,
  type IndicatorRow,
} from "@/components/site/editableContent";
import {
  fetchLiveTradingPackages,
  liveTradingPackages,
} from "@/components/site/liveTradingPackages";
import hero from "@/assets/hero-trading.jpg";
import tradingViewPreview from "@/assets/zactrades-tradingview-preview.jpeg";
import { useCurrency } from "@/lib/currency";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ZacTrades — Trade Like Professionals. Master the Markets." },
      {
        name: "description",
        content:
          "Join 10,000+ Professional traders. Live trading sessions, 1-on-1 mentorship, premium TradingView indicators, and a VIP community. Become consistently profitable.",
      },
      { property: "og:title", content: "ZacTrades — Professional Trading Coaching" },
      {
        property: "og:description",
        content: "Live trading rooms, mentorship, premium indicators.",
      },
      { property: "og:image", content: "/og.jpg" },
    ],
  }),
  component: Home,
});

const MEMBER_REVIEW_IMAGE_BUCKET = "member-review-images";
const MAX_REVIEW_IMAGE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_REVIEW_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const comingSoonIndicatorSlugs = new Set(["liquidity_sweep", "smart_entry_ai"]);

function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <TickerTape />
      <Features />
      <LiveRoom />
      <Mentorship />
      <Indicators />
      <TradingTools />
      <Stats />
      <Testimonials />
      <ConnectWithUs />
      <Newsletter />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}

/* ============================ HERO ============================ */
function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-10 md:pt-32 md:pb-20">
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
      <div className="grid-bg absolute inset-0 -z-10" />
      <img
        src={hero}
        alt=""
        className="absolute inset-0 -z-20 h-full w-full object-cover opacity-25"
        aria-hidden
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/50 via-background/70 to-background" />

      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div {...fadeUp}>
            <Badge
              variant="outline"
              className="glass mb-6 gap-2 border-primary/30 px-4 py-1.5 text-xs font-medium"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bull opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-bull" />
              </span>
              Live Trading Every day at 09h:00 AM (New York Timezone)
            </Badge>
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-7xl lg:text-8xl"
          >
            Learn Trading. <span className="text-gradient-gold">Understand the Market.</span>
            <br />
            Build Your <span className="text-gradient">Edge.</span>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg"
          >
            Learn trading through real market analysis, live trading, personal coaching, and
            practical education, all built to help you become a more confident and disciplined
            trader.
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.3 }}
            className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row md:mt-10"
          >
            <Button
              asChild
              size="lg"
              style={{ background: "var(--gradient-primary)" }}
              className="group h-12 px-8 text-base font-semibold text-primary-foreground glow-primary hover:opacity-90"
            >
              <a href="#mentorship">
                Start Mentorship
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.4 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground md:mt-8"
          >
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-gold text-gold" />
              <span>250+ Reviews</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-accent" />
              <span>Trusted By 5000+ traders</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-gold" />
              <span>+70% winrate</span>
            </div>
          </motion.div>
        </div>

        {/* Floating dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.5 }}
          className="relative mx-auto mt-8 max-w-5xl md:mt-10"
        >
          <motion.div
            className="glass-strong relative rounded-3xl p-3 md:p-4 glow-primary"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="flex flex-wrap items-center gap-2 px-3 py-2">
              <span className="h-3 w-3 rounded-full bg-bear/70" />
              <span className="h-3 w-3 rounded-full bg-gold/70" />
              <span className="h-3 w-3 rounded-full bg-bull/70" />
              <div className="ml-0 min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground sm:ml-4">
                tradingview.com / ZacTrades execution replay
              </div>
              <div className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-electric">
                Live chart study
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-[#080b10] shadow-[0_24px_80px_-34px_oklch(0.68_0.19_250/0.7)]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-transparent to-gold/10" />
              <div className="relative aspect-[4/3] w-full md:aspect-[1.4/1]">
                <img
                  src={tradingViewPreview}
                  alt="TradingView chart setup from ZacTrades showing a NASDAQ execution replay."
                  className="h-full w-full object-contain"
                  loading="eager"
                />
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
            </div>
          </motion.div>

          {/* Floating accents */}
          <motion.div
            className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-primary/30 blur-3xl"
            animate={{ opacity: [0.35, 0.8, 0.35], scale: [1, 1.18, 1] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-accent/30 blur-3xl"
            animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.12, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
        </motion.div>
      </div>
    </section>
  );
}

/* ============================ FEATURES ============================ */
function Features() {
  const items = [
    {
      icon: Radio,
      title: "Live Trading Sessions",
      desc: "Trade alongside pros in real-time, 5 days a week.",
    },
    {
      icon: LineChart,
      title: "Real-Time Analysis",
      desc: "Daily market breakdowns, setups, and outlooks.",
    },
    {
      icon: Crown,
      title: "Private Coaching",
      desc: "1 to 1 coaching with ZacTrades.",
    },
    {
      icon: Zap,
      title: "Smart Indicators",
      desc: "Premium TradingView indicators with proven edge.",
    },
    {
      icon: Shield,
      title: "Risk Management",
      desc: "Master position sizing and capital preservation.",
    },
    { icon: Users, title: "Elite Community", desc: "Private Discord with 5000+ active traders." },
    {
      icon: MessageSquareText,
      title: "Trade Recaps",
      desc: "Daily recaps of every winning and losing trade.",
    },
    {
      icon: Brain,
      title: "Psychology",
      desc: "Build the mindset of a consistently profitable trader.",
    },
  ];
  return (
    <section id="features" className="py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="glass mb-4 border-primary/30 text-xs">
            <Sparkles className="mr-1.5 h-3 w-3 text-gold" />
            Everything you need
          </Badge>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            The complete ecosystem to <span className="text-gradient">become a better trader</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Built for serious traders. Built for real growth.
          </p>
        </motion.div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 md:mt-9">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              {...fadeUp}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ ...fadeUp.transition, delay: i * 0.04 }}
              className="group glass relative overflow-hidden rounded-2xl p-6 transition-all hover:-translate-y-1 hover:border-primary/40"
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/0 blur-2xl transition-all group-hover:bg-primary/30" />
              <div className="relative">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--gradient-primary)]/20 text-electric ring-1 ring-primary/30">
                  <it.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{it.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{it.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================ LIVE ROOM ============================ */
function LiveRoom() {
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

  return (
    <section id="live" className="py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <motion.div {...fadeUp}>
            <Badge variant="outline" className="glass mb-4 border-bull/40 text-xs">
              <span className="mr-1.5 h-2 w-2 rounded-full bg-bull animate-pulse-glow" />
              Live Trading Every day at 09h:00 AM (New York Timezone)
            </Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Premium membership for <span className="text-gradient">live traders.</span>
            </h2>
            <p className="mt-4 text-muted-foreground md:text-lg">
              Trade live with Zac every day, prepare before the session, review the market, ask
              questions, and stay connected through the private Discord community.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Live trading every day during the New York session",
                "Daily and weekly market analysis: Nasdaq, gold, FX, and more",
                "Pre-market live prep: plan, prepare, execute",
                "Q&A access: ask, learn, and get answers",
                "Extra psychology talks for mindset, discipline, and control",
                "Exclusive access to the Discord community",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3 text-sm">
                  <div className="grid h-5 w-5 place-items-center rounded-full bg-bull/15 text-bull">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </div>
                  {t}
                </li>
              ))}
            </ul>
            {isStaff ? (
              <div className="mt-8">
                <StaffCheckoutNotice description="Live trading checkout is hidden for admin and moderator accounts. Staff can manage live-room package pricing from the admin page." />
              </div>
            ) : (
              <>
                <div className="mt-8">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-display text-lg font-semibold">
                      Choose your live trading access
                    </h3>
                    <Badge variant="outline" className="glass border-bull/40 text-[10px] text-bull">
                      Flexible duration
                    </Badge>
                  </div>
                  <p className="mb-3 text-xs leading-5 text-muted-foreground">
                    Students after formation receive 20% off all live trading packages.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {livePackages.map((option, index) => (
                      <button
                        key={option.duration}
                        type="button"
                        onClick={() => {
                          setSelectedLivePackage(index);
                          setOpen(true);
                        }}
                        className={`group rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 ${
                          selectedLivePackage === index
                            ? "border-gold/60 bg-gold/10 ring-1 ring-gold/30"
                            : "border-border/60 bg-background/40 hover:border-primary/40 hover:bg-primary/5"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-display text-base font-bold">
                              {option.duration}
                            </div>
                          </div>
                          {option.badge && (
                            <span className="rounded-full bg-bull/15 px-2 py-1 text-[10px] font-semibold text-bull">
                              {option.badge}
                            </span>
                          )}
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span>
                            {option.originalPrice && (
                              <span className="mb-1 block font-mono text-xs text-muted-foreground line-through">
                                Before {formatPrice(option.originalPrice)}
                              </span>
                            )}
                            <span className="block font-mono text-2xl font-bold text-gradient-gold">
                              {formatPrice(option.price)}
                            </span>
                          </span>
                          <span className="flex items-center gap-1 text-xs font-semibold text-electric group-hover:underline">
                            Select
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  size="lg"
                  onClick={() => setOpen(true)}
                  style={{ background: "var(--gradient-primary)" }}
                  className="mt-8 glow-primary hover:opacity-90 text-primary-foreground"
                >
                  Access Live Trading Room
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <CheckoutDialog
                  open={open}
                  onOpenChange={setOpen}
                  initialPackageIndex={selectedLivePackage}
                  packages={livePackages}
                />
              </>
            )}
          </motion.div>

          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }}>
            <div className="glass-strong relative overflow-hidden rounded-2xl p-2 glow-emerald md:p-3">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/15 blur-3xl" />
              <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-bull/10 blur-3xl" />

              <div className="relative overflow-hidden rounded-xl border border-border/60 bg-[#111016] shadow-2xl">
                <div className="grid min-h-[620px] gap-0 lg:grid-cols-[minmax(0,1fr)_290px]">
                  <div className="flex min-w-0 flex-col bg-black">
                    <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-bear shadow-[0_0_12px_hsl(var(--bear))]" />
                        <div className="truncate font-display text-sm font-bold md:text-base">
                          LIVE Day Trading NewYork Session
                        </div>
                        <span className="hidden items-center gap-1.5 text-muted-foreground sm:flex">
                          <BarChart3 className="h-3.5 w-3.5" />
                          <TrendingUp className="h-3.5 w-3.5" />
                          <MessageSquareText className="h-3.5 w-3.5" />
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="hidden items-center gap-1 sm:flex">
                          <Mic className="h-3.5 w-3.5" />2 speaking
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          43 listening
                        </span>
                      </div>
                    </div>

                    <div className="p-2 sm:p-3">
                      <div className="group relative overflow-hidden rounded-md bg-[#080808] ring-1 ring-white/10">
                        <img
                          src={tradingViewPreview}
                          alt="ZacTrades live TradingView screen share"
                          className="aspect-[16/8.6] w-full object-cover opacity-80 grayscale-[0.15] transition-transform duration-700 group-hover:scale-[1.015]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/60" />
                        <div className="absolute left-4 top-4 flex max-w-[80%] items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                          <span className="h-2.5 w-2.5 rounded-full bg-bear shadow-[0_0_12px_hsl(var(--bear))]" />
                          LIVE market screen share
                        </div>
                        <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                          <LineChart className="h-4 w-4 text-electric" />
                          Zac Trades
                        </div>
                        <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1.5 text-[11px] text-muted-foreground backdrop-blur">
                          09:44:33 UTC-4 · ETH
                        </div>
                      </div>

                      <div className="mt-3 border-t border-white/10 pt-3">
                        <div className="mb-3 flex items-center justify-between text-xs font-semibold">
                          <span className="flex items-center gap-2">
                            <Mic className="h-4 w-4 text-muted-foreground" />
                            Intervenants — 2
                          </span>
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-3">
                          {[
                            { name: "ZacTrades", color: "bg-primary/20 text-electric" },
                            { name: "Suffy94", color: "bg-bull/20 text-bull" },
                          ].map((speaker) => (
                            <div key={speaker.name} className="flex items-center gap-2">
                              <div
                                className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ring-2 ring-background ${speaker.color}`}
                              >
                                {speaker.name[0]}
                              </div>
                              <Badge className="border-bear/40 bg-bear/80 px-2 py-0.5 text-[10px] text-white">
                                EN DIRECT
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3 border-t border-white/10 pt-3">
                        <div className="mb-3 flex items-center justify-between text-xs font-semibold">
                          <span className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            Audience — 43
                          </span>
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="grid max-h-44 grid-cols-5 gap-3 overflow-hidden sm:grid-cols-7 lg:grid-cols-6 xl:grid-cols-7">
                          {[
                            "aziz",
                            "Suffy94",
                            "MaowZ13",
                            "Dahaytam",
                            "Issaac",
                            "Fox",
                            "Hatimsp",
                            "RA-SM-AM",
                            "Leouf32",
                            "ayoub",
                            "simo",
                            "Badre",
                            "Khalid",
                            "mariam",
                            "BRADA",
                            "imad",
                            "Youssef",
                            "Spooox",
                            "S",
                            "Ilham",
                            "MOD",
                          ].map((avatar, index) => (
                            <div key={`${avatar}-${index}`} className="text-center">
                              <div
                                className={`mx-auto grid h-10 w-10 place-items-center rounded-full text-xs font-bold text-white ring-1 ring-white/10 ${
                                  index % 5 === 0
                                    ? "bg-[#5865f2]"
                                    : index % 4 === 0
                                      ? "bg-[#ed4fa8]"
                                      : index % 3 === 0
                                        ? "bg-[#2f855a]"
                                        : "bg-muted/40"
                                }`}
                              >
                                {avatar[0].toUpperCase()}
                              </div>
                              <div className="mx-auto mt-1 w-12 truncate text-[10px] text-muted-foreground">
                                {avatar}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mx-auto mb-4 mt-auto flex w-fit items-center gap-2 rounded-xl bg-card/95 px-3 py-2 shadow-xl ring-1 ring-border/60">
                      <button className="grid h-9 w-9 place-items-center rounded-md bg-background/70 text-muted-foreground">
                        <Mic className="h-4 w-4" />
                      </button>
                      <button className="grid h-9 w-9 place-items-center rounded-md bg-background/70 text-muted-foreground">
                        <Volume2 className="h-4 w-4" />
                      </button>
                      <button className="grid h-10 w-12 place-items-center rounded-md bg-bear text-white">
                        <Phone className="h-4 w-4" />
                      </button>
                      <button className="grid h-9 w-9 place-items-center rounded-md bg-background/70 text-muted-foreground">
                        <Maximize className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <aside className="flex min-h-[360px] flex-col border-t border-white/10 bg-[#1d1b22] lg:border-l lg:border-t-0">
                    <div className="border-b border-white/10 px-4 py-3">
                      <div className="flex items-center gap-2 font-display text-sm font-bold">
                        <span className="h-3 w-3 rounded-full bg-bear" />
                        Premium LIVE
                      </div>
                      <div className="text-[11px] text-muted-foreground">Live room chat</div>
                    </div>
                    <div className="border-b border-white/10 p-4">
                      <div className="mx-auto max-w-32 overflow-hidden rounded-md border border-white/10 bg-black/40">
                        <img
                          src={tradingViewPreview}
                          alt=""
                          className="h-24 w-full object-cover object-right opacity-80"
                        />
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded-md bg-muted/30 px-2 py-1">3 reactions</span>
                        <span className="rounded-md bg-muted/30 px-2 py-1">live chat</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-3 overflow-hidden p-4 text-xs">
                      {[
                        { u: "Oussama Touati", m: "Khoya zac chno bank wch nkhliha tp" },
                        { u: "imad", m: "hhhhhhhhhhhhhhhhhhhhhhhhhhhhhh" },
                        { u: "THE.OUTIS.LAMANI", m: "independent thinking !!", pro: true },
                        { u: "Hatimsp", m: "tema cpi high o london high" },
                        { u: "ZTC Radio", m: "Started playing I'm Your Poison", app: true },
                        { u: "THE.OUTIS.LAMANI", m: "i still see lower prices before 4H sibi" },
                      ].map((msg) => (
                        <div key={`${msg.u}-${msg.m}`} className="flex items-start gap-2">
                          <div
                            className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                              msg.pro
                                ? "bg-bull/20 text-bull"
                                : msg.app
                                  ? "bg-[#5865f2]/30 text-[#9fb0ff]"
                                  : "bg-muted/40 text-muted-foreground"
                            }`}
                          >
                            {msg.u[0]}
                          </div>
                          <div>
                            <div
                              className={`font-semibold ${msg.pro ? "text-gold" : "text-electric"}`}
                            >
                              {msg.u}
                            </div>
                            <div className="leading-5 text-foreground/80">{msg.m}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 border-t border-white/10 bg-background/45 p-3">
                      <Plus className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 rounded-lg bg-background/50 px-3 py-2 text-xs text-muted-foreground">
                        Message Premium LIVE
                      </div>
                      <Smile className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </aside>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ============================ MENTORSHIP ============================ */
function Mentorship() {
  const { isStaff } = useAuth();
  const { formatPrice } = useCurrency();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedCoachingIndex, setSelectedCoachingIndex] = useState(0);
  const [coachingOptions, setCoachingOptions] = useState(defaultCoachingPlans);
  const selectedCoaching = coachingOptions[selectedCoachingIndex] ?? coachingOptions[0];

  useEffect(() => {
    let mounted = true;

    fetchCoachingPlans().then((plans) => {
      if (mounted) {
        setCoachingOptions(plans);
        setSelectedCoachingIndex((current) => Math.min(current, plans.length - 1));
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section id="mentorship" className="py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="glass mb-4 border-gold/40 text-xs">
            <GraduationCap className="mr-1.5 h-3 w-3 text-gold" />
            Professional Mentorship
          </Badge>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Learn directly from a <span className="text-gradient-gold">trader who actually </span>{" "}
            trades the market
          </h2>
          <p className="mt-4 text-muted-foreground">
            Not here to sell you a dream. We’re here to teach you how the market really works.
          </p>
        </motion.div>

        <div className="mt-7 grid gap-5 md:mt-9 md:grid-cols-2">
          {coachingOptions.map((option, i) => (
            <motion.div
              key={option.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.08 }}
              className={`glass relative overflow-hidden rounded-2xl p-6 md:p-8 ${
                option.featured ? "border-gold/35 glow-gold" : "border-primary/20"
              }`}
            >
              <div
                className={`absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl ${
                  option.featured ? "bg-gold/20" : "bg-primary/20"
                }`}
                aria-hidden
              />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div
                    className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${
                      option.featured ? "bg-gold/15 text-gold" : "bg-primary/15 text-primary"
                    }`}
                  >
                    <option.icon className="h-5 w-5" />
                  </div>
                  <Badge
                    variant="outline"
                    className={`mb-4 text-[10px] uppercase tracking-[0.2em] ${
                      option.featured
                        ? "border-gold/40 text-gold"
                        : "border-primary/40 text-primary"
                    }`}
                  >
                    {option.promotionEnabled && option.promotionLabel
                      ? option.promotionLabel
                      : "Coaching Path"}
                  </Badge>
                  <h3 className="font-display text-2xl font-bold">{option.title}</h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                    {option.desc}
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-background/60 p-4 ring-1 ring-border/50">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Price
                      </div>
                      <div
                        className={`mt-1 font-display text-2xl font-bold ${option.featured ? "text-gold" : "text-primary"}`}
                      >
                        {formatPrice(option.price)}
                      </div>
                      {option.promotionEnabled && option.originalPrice && (
                        <div className="mt-1 font-mono text-xs text-muted-foreground line-through">
                          {formatPrice(option.originalPrice)}
                        </div>
                      )}
                      {option.promotionEnabled &&
                        (option.promotionNote || option.promotionEndsAt) && (
                          <div className="mt-2 text-[11px] leading-4 text-gold">
                            {[option.promotionNote, option.promotionEndsAt]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                        )}
                    </div>
                    <div className="rounded-xl bg-background/60 p-4 ring-1 ring-border/50">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Duration
                      </div>
                      <div className="mt-1 text-sm font-semibold text-foreground">
                        {option.duration}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
                {option.details.map((detail) => (
                  <div
                    key={detail}
                    className="flex items-center gap-2 rounded-lg bg-background/50 px-3 py-2 text-xs text-muted-foreground"
                  >
                    <Check
                      className={`h-3.5 w-3.5 ${option.featured ? "text-gold" : "text-primary"}`}
                    />
                    {detail}
                  </div>
                ))}
              </div>
              {isStaff ? (
                <div className="relative mt-7">
                  <StaffCheckoutNotice description="Coaching checkout is hidden for admin and moderator accounts. Staff can manage coaching prices and promotions from the admin page." />
                </div>
              ) : (
                <Button
                  type="button"
                  className={`group relative mt-7 ${
                    option.featured
                      ? "bg-gold text-background hover:bg-gold/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                  onClick={() => {
                    setSelectedCoachingIndex(i);
                    setCheckoutOpen(true);
                  }}
                >
                  {option.cta}
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              )}
            </motion.div>
          ))}
        </div>
        {!isStaff && (
          <CheckoutDialog
            open={checkoutOpen}
            onOpenChange={setCheckoutOpen}
            mentorshipPlanSlug={selectedCoaching.slug}
            planName={selectedCoaching.title}
            features={selectedCoaching.details}
            packages={selectedCoaching.checkoutPackages}
          />
        )}
      </div>
    </section>
  );
}

/* ============================ INDICATORS ============================ */
function Indicators() {
  const [items, setItems] = useState<IndicatorRow[]>(defaultIndicators);

  useEffect(() => {
    let mounted = true;

    fetchIndicators().then((indicators) => {
      if (mounted) {
        setItems(indicators);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section id="indicators" className="py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="glass mb-4 border-primary/40 text-xs">
            <BarChart3 className="mr-1.5 h-3 w-3 text-electric" />
            Premium Indicators
          </Badge>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Indicator by Professional Traders{" "}
            <span className="text-gradient">To Make your Analysis Simpler</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Indicators Built for Clearer Analysis. Simple and Easy to Use.
          </p>
        </motion.div>

        <div className="mt-7 grid gap-5 md:mt-9 lg:grid-cols-3">
          {items.map((indicator, index) => {
            const isComingSoon = comingSoonIndicatorSlugs.has(indicator.slug);

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

                  <div className="relative mt-5 h-36 overflow-hidden rounded-xl bg-background/60 ring-1 ring-border/60">
                    <CandleChart count={40} height={140} />
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
      </div>
    </section>
  );
}

/* ============================ TRADING TOOLS ============================ */
const toolThemes = [
  {
    accent: "#a855f7",
    halo: "rgba(168, 85, 247, 0.22)",
    badge: "MAX DISCOUNT%",
    subtitle: "MARKET REPLAY",
    logo: "FX Replay",
  },
  {
    accent: "#10b981",
    halo: "rgba(16, 185, 129, 0.2)",
    badge: "MAX DISCOUNT%",
    subtitle: "TRADE JOURNALING",
    logo: "TradeSyncer",
  },
  {
    accent: "#00a3ff",
    halo: "rgba(0, 163, 255, 0.2)",
    badge: "BEST CHARTS",
    subtitle: "CHARTING PLATFORM",
    logo: "TradingView",
  },
];

function TradingTools() {
  const [copiedToolName, setCopiedToolName] = useState<string | null>(null);
  const [tools, setTools] = useState<
    Array<{
      name: string;
      category: string;
      description: string;
      promo_code: string;
      discount: string;
      url: string;
      logo_url?: string | null;
      highlights: string[];
    }>
  >([]);

  const handleCopyToolCode = async (toolName: string, promoCode: string) => {
    setCopiedToolName(toolName);
    window.setTimeout(() => {
      setCopiedToolName((current) => (current === toolName ? null : current));
    }, 1800);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(promoCode);
        return;
      }

      const textArea = document.createElement("textarea");
      textArea.value = promoCode;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    } catch {
      setCopiedToolName(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    fetchTradingTools().then((items) => {
      if (mounted) {
        setTools(items);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section id="tools" className="relative overflow-hidden py-12 md:py-20">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(0,163,255,0.12),transparent_30%)]" />
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="glass mb-4 border-primary/40 text-xs">
            <Wrench className="mr-1.5 h-3 w-3 text-electric" />
            Trading Tools
          </Badge>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Top Trading Tools I Use for <span className="text-gradient">Success</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            The tools I use every day to prepare, trade, review my performance, and stay informed
            about the market.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-4 sm:gap-5 md:mt-12 lg:grid-cols-3">
          {tools.map((tool, i) => {
            const theme = toolThemes[i % toolThemes.length];
            const hasCode = tool.promo_code && tool.promo_code.toLowerCase() !== "none";
            const isCopied = copiedToolName === tool.name;

            return (
              <motion.div
                key={tool.name}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="group relative flex min-h-0 sm:min-h-[470px] lg:min-h-[520px] overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 bg-[#07080c] shadow-[0_16px_50px_rgba(0,0,0,0.38)] sm:shadow-[0_24px_80px_rgba(0,0,0,0.45)] transition-all duration-500 hover:-translate-y-2 hover:border-white/20"
              >
                <div
                  className="absolute inset-x-8 top-0 h-1 rounded-b-full opacity-90"
                  style={{ background: theme.accent, boxShadow: `0 0 36px ${theme.accent}` }}
                />
                <div
                  className="absolute inset-x-6 top-10 h-32 sm:top-14 sm:h-44 rounded-full blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: theme.halo }}
                />

                <div className="relative flex w-full flex-col">
                  <div className="flex h-24 items-center justify-center border-b border-white/10 bg-white px-5 sm:h-32 sm:px-8">
                    <ToolBrandLogo name={tool.name} fallback={theme.logo} logoUrl={tool.logo_url} />
                  </div>

                  <div className="flex flex-1 flex-col px-5 py-6 text-center sm:px-9 sm:py-9">
                    <div className="text-[0.65rem] font-bold uppercase tracking-[0.28em] sm:text-[0.72rem] sm:tracking-[0.42em] text-muted-foreground">
                      {tool.category || theme.subtitle}
                    </div>

                    <div className="mt-5 flex justify-center sm:mt-7">
                      <span
                        className="rounded-full border px-4 py-1.5 text-sm font-black uppercase tracking-wide sm:px-6 sm:py-2 sm:text-lg"
                        style={{
                          borderColor: theme.accent,
                          color: theme.accent,
                          background: theme.halo,
                          boxShadow: `0 0 28px ${theme.halo}`,
                        }}
                      >
                        {theme.badge}
                      </span>
                    </div>

                    <p className="mx-auto mt-5 max-w-sm text-sm leading-7 text-muted-foreground sm:mt-8 sm:flex-1 sm:text-base sm:leading-8">
                      {tool.description}
                    </p>

                    {hasCode && (
                      <button
                        type="button"
                        onClick={() => handleCopyToolCode(tool.name, tool.promo_code)}
                        className={`mt-6 flex w-full items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-left transition ${
                          isCopied
                            ? "border-bull/50 bg-bull/10 shadow-[0_0_24px_rgba(16,185,129,0.18)]"
                            : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]"
                        }`}
                      >
                        <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] sm:text-xs sm:tracking-[0.28em] text-muted-foreground">
                          {isCopied ? "Copied" : "Code"}
                        </span>
                        <span
                          className={`flex min-w-0 items-center gap-2 truncate font-mono text-sm font-black transition-colors sm:text-lg ${
                            isCopied ? "text-bull" : "text-foreground"
                          }`}
                        >
                          {isCopied ? "Copied" : tool.promo_code}
                          {isCopied ? (
                            <Check className="h-4 w-4 text-bull" />
                          ) : (
                            <Copy className="h-4 w-4 text-muted-foreground" />
                          )}
                        </span>
                      </button>
                    )}

                    <Button
                      asChild
                      variant="outline"
                      className="mt-4 h-12 w-full rounded-2xl sm:mt-5 sm:h-14 border-white/10 bg-white/[0.06] text-base font-bold text-foreground hover:border-white/20 hover:bg-white/[0.1]"
                    >
                      <a href={tool.url} target="_blank" rel="noreferrer">
                        Visit {tool.name}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ToolBrandLogo({
  name,
  fallback,
  logoUrl,
}: {
  name: string;
  fallback: string;
  logoUrl?: string | null;
}) {
  const normalized = name.toLowerCase();

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${name} logo`}
        className="max-h-14 w-full max-w-[220px] object-contain sm:max-h-20 sm:max-w-[280px]"
        loading="lazy"
      />
    );
  }

  if (normalized.includes("tradingview")) {
    return (
      <div className="flex flex-col items-center text-black">
        <div className="text-3xl font-black leading-none tracking-tighter sm:text-4xl">TV</div>
        <div className="mt-1 text-2xl font-black tracking-tight sm:mt-2 sm:text-3xl">
          TradingView
        </div>
      </div>
    );
  }

  if (normalized.includes("tradesyncer")) {
    return (
      <div className="flex items-center gap-3 text-black">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-600 text-xl sm:h-12 sm:w-12 sm:text-2xl font-black text-white">
          TS
        </span>
        <span className="text-2xl font-semibold tracking-tight sm:text-3xl">TradeSyncer</span>
      </div>
    );
  }

  if (normalized.includes("fx") || normalized.includes("replay")) {
    return (
      <div className="flex items-center gap-3 text-black">
        <span className="text-4xl font-black tracking-tighter sm:text-5xl">FX</span>
        <span className="text-2xl font-light tracking-wide sm:text-3xl">Replay</span>
      </div>
    );
  }

  return (
    <div className="text-2xl font-black tracking-tight text-black sm:text-3xl">{fallback}</div>
  );
}

/* ============================ STATS ============================ */
function Stats() {
  const stats = [
    { label: "Active members", value: 10240, suffix: "+" },
    { label: "Winrate", value: 71.3, suffix: "%", decimals: 1 },
    { label: "Trades Analyzed", value: 13540, suffix: "+" },
    { label: "Hours Streamed LIVE", value: 1000, suffix: "+" },
  ];
  return (
    <section className="relative py-12 md:py-16">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="glass-strong grid gap-8 rounded-3xl px-6 py-10 md:grid-cols-4 md:px-12">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-4xl font-bold md:text-5xl text-gradient">
                <Counter to={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
              </div>
              <div className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================ TESTIMONIALS ============================ */
type TestimonialReview = {
  id?: string;
  name: string;
  badges: string[];
  quote: string;
  reactions: Array<{ emoji: string; count: number }>;
  time: string;
  tone: string;
  planLabel?: string;
  rating?: number;
  imageUrls?: string[];
};

type MemberReviewRow = {
  id: string;
  display_name: string | null;
  message: string;
  rating: number;
  plan_label: string | null;
  created_at: string;
  image_urls: string[] | null;
};

function reviewAccessBadges(planLabel?: string) {
  return (planLabel ?? "")
    .split("+")
    .map((label) => label.trim())
    .filter(Boolean)
    .map((label) => {
      const normalized = label.toLowerCase();

      if (normalized === "live trading") {
        return {
          label: "Premium Access",
          className: "border-gold/45 bg-gold/10 text-gold",
        };
      }

      if (normalized === "1-to-1 coaching") {
        return {
          label: "1-to-1 Coaching",
          className: "border-bull/45 bg-bull/10 text-bull",
        };
      }

      if (normalized === "training group coaching" || normalized === "group coaching") {
        return {
          label: "Group Coaching",
          className: "border-sky-400/45 bg-sky-400/10 text-sky-300",
        };
      }

      return {
        label,
        className: "border-primary/35 bg-primary/10 text-electric",
      };
    });
}

function Testimonials() {
  const { user, isStaff } = useAuth();
  const [approvedReviews, setApprovedReviews] = useState<TestimonialReview[]>([]);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewImagePreviews, setReviewImagePreviews] = useState<string[]>([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [hasPaidReviewAccess, setHasPaidReviewAccess] = useState(false);
  const [reviewAccessLoading, setReviewAccessLoading] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    return () => {
      reviewImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [reviewImagePreviews]);

  const discordReviews: TestimonialReview[] = [
    {
      name: "Mimi",
      badges: ["ZTC", "🎓"],
      quote:
        "Je tiens à remercier Zakaria pour la qualité de sa formation et de son accompagnement en trading. Sa pédagogie, sa rigueur et sa capacité à simplifier des notions complexes m’ont permis de faire de réels progrès.\nGrâce à son coaching personnalisé, j’ai acquis une méthode claire, une meilleure gestion des émotions et une vision plus structurée des marchés. Je recommande vivement sa formation à toute personne souhaitant progresser sérieusement dans le trading.",
      reactions: [{ emoji: "❤️", count: 10 }],
      time: "12/10/2025, 20:25",
      tone: "text-bull",
    },
    {
      name: "MOAD",
      badges: ["ZTC", "🎓"],
      quote:
        "Slm alikom\n\n2 mois de formation m3a Zac Kent kangol 3andi des bases bach nkon profitable Trader ( presque 1 an et demi dial 9raya bou7di ) + had la formation li O9sim bilah hta had siyed awal 7aja wold nas w mrabi w baghi l khir layi wa7d baghi it3alm fahmo had kelma dial T3ALM 7aydo alikom l3gaz w ba3do 3la les groupes signaux b tajriba ba3do 3la s7ab affiliate b khosos ( li kigol likom dakhlo w 3andkom bonus ) had siyed macheft m3ah ghir khir O9sim bilah staghl o forsa staaaghlo KNOWLEDGE dial had siyd f bzaf 7wayj machi ghir domaine\n\nMn 9alb kantmana lik a khouya Zakaria dakchi li kat tmana f 7yatk w dommage 3raftk m3atl walakin had forsa jat 7amdolilah\n\nW kanchrok hta Team rakom 3zaz 😍\n\nA7san mentor Khouya Zac ❤️",
      reactions: [
        { emoji: "❤️", count: 9 },
        { emoji: "💯", count: 4 },
        { emoji: "♠️", count: 4 },
      ],
      time: "2/11/2025, 15:34",
      tone: "text-bull",
    },
    {
      name: "BOUMA3ZA",
      badges: ["ZTC", "💰"],
      quote:
        "LI HMD BFDAL LAH O FDAL ZAC T3lmt HAD DOMAINE O MN LES LIVE WAKHA RANI L HMD PROFITABLE MAIS KNB9a FLES LIVE HITACH TMA FIN KTLA7o LES VRAI TRUC LI KHASSK TSM3 AND WSLT WA/eD NIVO LI WLIT KNVALIDI FIH LES COMPT KOLA SIMANA KOLA NHAR C EST INCROYABLE THANKS ZAC",
      reactions: [
        { emoji: "❤️", count: 28 },
        { emoji: "🔥", count: 17 },
      ],
      time: "30/10/2025, 13:11",
      tone: "text-primary",
    },
    {
      name: "oumaimaesque",
      badges: ["ZTC", "VIP"],
      quote:
        "Franchement grâce l had community et spécifiquement ZAC t3alamt bezaf ou f koula live kant3alam bezaf risk psychologie kifach tkoun discipliné hta walit profitable blama nhadro 3la l’ambiance, Motivation aye haja bghitiha kayna hna.\nEn bref Merciiii beaucoup ZAC ✨✨✨",
      reactions: [
        { emoji: "♠️", count: 6 },
        { emoji: "❤️", count: 7 },
      ],
      time: "18/11/2025, 16:40",
      tone: "text-primary",
    },
    {
      name: "Adnane",
      badges: ["ZTC", "🎓"],
      quote:
        "Bonjour tt le monde,\nJe viens de terminer une séance( la troisième ) dial 1to1 mentorship avec Zac , et je voulais faire un témoignage( n9lebha 3arbiya daba 😅):\nKane 3tani wa7ed tamarin ndirhoum men 9bel et rje3lihoum galiya adnane hadchi lli 3atini rah ma houach , ha chnou bghitek te3tini ou bel mital ou l khater , dik sa3at ka tel9a l wa7ed dayer leak niya baghik t3elem machi wa7ed baghi i zreb 3lik wi tnez 3lik .\nGaliya rje3 lah i khelik et 3awed l exercice .\nAutre chose 3awtani ,\nZac professionnel et me39oul, ki programmi m3ak la séance , ki ltazem ou ila gaa3 khrej lih blane men jenb, ki sifet lik message dik sa3at bachi i 3elmek machi i 7ensrek ( kane siftli un message m3a 3h du matin ).\nBghit ndir had chhada lillah et merci beaucoup pour ta disponibilité et ton humilité 🙏🙏",
      reactions: [
        { emoji: "♠️", count: 8 },
        { emoji: "❤️", count: 14 },
      ],
      time: "2/12/2025, 08:05",
      tone: "text-bull",
    },
    {
      name: "Nizar",
      badges: ["ZTC"],
      quote:
        "ناس كنتي صباح او كنا لجال هاد المساج كنخرج اوقول الحمدالله تعلمت شيحاجا نخرج منها الفلوس ... ولكنها كنكر تقول شحال و انا كنت ترون من كروب لكروب على سينيال ... حتى حمدالله لقيت راسي هنا معاكم او حمد الله حيت علمني زكريا شي\nبغيت نقول ليكم الحراري و الله اي كوانشي سال تعلمو بدور ستراتيجيتكم ديركم ربي يسخر ليكم\nشكرا ليكم 🙏",
      reactions: [
        { emoji: "❤️", count: 22 },
        { emoji: "♠️", count: 9 },
      ],
      time: "20/11/2025, 12:56",
      tone: "text-gold",
    },
  ];

  const initialReviewCount = 4;
  const [visibleReviewCount, setVisibleReviewCount] = useState(initialReviewCount);
  const allReviews = [...approvedReviews, ...discordReviews];
  const visibleReviews = allReviews.slice(0, visibleReviewCount);
  const hasMoreReviews = visibleReviewCount < allReviews.length;

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;

    supabase
      .from("member_reviews")
      .select("id,display_name,message,rating,plan_label,image_urls,created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(24)
      .then(({ data, error }) => {
        if (!mounted) return;

        if (error) {
          console.error(error);
          return;
        }

        setApprovedReviews(
          ((data as MemberReviewRow[] | null) ?? []).map((review) => ({
            id: review.id,
            name: review.display_name?.trim() || "ZacTrades member",
            badges: [],
            planLabel: review.plan_label?.trim() || "Paid member",
            rating: review.rating,
            quote: review.message,
            imageUrls: Array.isArray(review.image_urls) ? review.image_urls.filter(Boolean) : [],
            reactions: [{ emoji: "⭐", count: review.rating }],
            time: formatReviewDate(review.created_at),
            tone: review.rating >= 5 ? "text-gold" : "text-primary",
          })),
        );
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!supabase || !user || isStaff) {
      setHasPaidReviewAccess(false);
      setReviewAccessLoading(false);
      return;
    }

    let mounted = true;
    setReviewAccessLoading(true);

    supabase
      .rpc("current_user_has_paid_access")
      .then(({ data, error }) => {
        if (!mounted) return;

        if (error) {
          console.error(error);
          setHasPaidReviewAccess(false);
          return;
        }

        setHasPaidReviewAccess(Boolean(data));
      })
      .finally(() => {
        if (mounted) setReviewAccessLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user?.id, isStaff]);

  const resetReviewImages = () => {
    setReviewImagePreviews((current) => {
      current.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
    setReviewImages([]);
  };

  const handleReviewImageSelection = (files: FileList | null) => {
    if (!files) return;

    const selectedFiles = Array.from(files);
    const nextImages = [...reviewImages, ...selectedFiles].slice(0, 2);

    const invalidFile = nextImages.find((file) => {
      const lowerName = file.name.toLowerCase();
      const hasAcceptedExtension = [".png", ".jpg", ".jpeg", ".webp", ".gif"].some((extension) =>
        lowerName.endsWith(extension),
      );

      return (file.type && !ACCEPTED_REVIEW_IMAGE_TYPES.has(file.type)) || !hasAcceptedExtension;
    });

    if (invalidFile) {
      setReviewStatus({
        type: "error",
        message: "Please upload only PNG, JPG, WEBP, or GIF images.",
      });
      return;
    }

    const oversizedFile = nextImages.find((file) => file.size > MAX_REVIEW_IMAGE_BYTES);

    if (oversizedFile) {
      setReviewStatus({
        type: "error",
        message: "Each review image must be smaller than 4 MB.",
      });
      return;
    }

    setReviewImages(nextImages);
    setReviewImagePreviews((current) => {
      current.forEach((url) => URL.revokeObjectURL(url));
      return nextImages.map((file) => URL.createObjectURL(file));
    });
    setReviewStatus(null);
  };

  const removeReviewImage = (index: number) => {
    setReviewImages((current) => {
      const nextImages = current.filter((_, imageIndex) => imageIndex !== index);
      setReviewImagePreviews((currentPreviews) => {
        currentPreviews.forEach((url) => URL.revokeObjectURL(url));
        return nextImages.map((file) => URL.createObjectURL(file));
      });
      return nextImages;
    });
  };

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase || !user) return;

    if (!hasPaidReviewAccess) {
      setReviewStatus({
        type: "error",
        message: "Only paid members can write reviews after joining a ZacTrades plan.",
      });
      return;
    }

    const message = reviewMessage.trim();

    if (message.length < 10) {
      setReviewStatus({
        type: "error",
        message: "Please write at least 10 characters before submitting your review.",
      });
      return;
    }

    setReviewSubmitting(true);
    setReviewStatus(null);

    let uploadedImageUrls: string[] = [];

    try {
      uploadedImageUrls = await uploadReviewImages(reviewImages, user.id);
    } catch (error) {
      console.error(error);
      setReviewStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Could not upload review images.",
      });
      setReviewSubmitting(false);
      return;
    }

    const metadataName =
      typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
    const displayName = metadataName.trim() || user.email?.split("@")[0] || "ZacTrades member";

    const { error } = await supabase.from("member_reviews").insert({
      user_id: user.id,
      display_name: displayName,
      email: user.email ?? null,
      message,
      rating: reviewRating,
      image_urls: uploadedImageUrls,
      status: "pending",
    });

    if (error) {
      console.error(error);
      setReviewStatus({
        type: "error",
        message: error.message,
      });
    } else {
      setReviewMessage("");
      setReviewRating(5);
      resetReviewImages();
      setReviewStatus({
        type: "success",
        message: "Thank you. Your review was sent to the admin for approval.",
      });
      setReviewDialogOpen(false);
    }

    setReviewSubmitting(false);
  };

  return (
    <section id="testimonials" className="py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="glass mb-4 border-bull/40 text-xs">
            <Trophy className="mr-1.5 h-3 w-3 text-bull" />
            Member Results
          </Badge>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Real traders. <span className="text-gradient-gold">Real profits.</span>
          </h2>
          <p className="mt-4 text-sm text-muted-foreground md:text-base">
            Real Discord feedback from ZacTrades members and students.
          </p>
        </motion.div>

        <div className="mt-7 grid gap-5 md:mt-9 md:grid-cols-2">
          {visibleReviews.map((review, i) => {
            const accessBadges = reviewAccessBadges(review.planLabel);

            return (
              <motion.div
                key={`${review.name}-${review.time}`}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: (i % 3) * 0.06 }}
                className="glass group flex h-full flex-col overflow-hidden rounded-2xl border-border/60 bg-[#1f2024]/70 transition-all hover:-translate-y-1 hover:border-primary/35 hover:bg-[#23252b]/80"
              >
                <div className="flex items-start gap-3 p-5">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary ring-1 ring-primary/25">
                    {review.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-lg font-bold text-white">
                        {review.name}
                      </span>
                      {accessBadges.length
                        ? accessBadges.map((badge) => (
                            <span
                              key={`${review.name}-${badge.label}`}
                              className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          ))
                        : review.badges.map((badge) => (
                            <span
                              key={`${review.name}-${badge}`}
                              className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-bold text-foreground ring-1 ring-white/10"
                            >
                              {badge}
                            </span>
                          ))}
                      {review.rating ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full border border-gold/35 bg-gold/10 px-2.5 py-1 text-gold">
                          {Array.from({ length: 5 }).map((_, starIndex) => (
                            <Star
                              key={`${review.name}-rating-${starIndex}`}
                              className={`h-3.5 w-3.5 ${
                                starIndex < (review.rating ?? 0)
                                  ? "fill-gold text-gold"
                                  : "text-muted-foreground/35"
                              }`}
                            />
                          ))}
                        </span>
                      ) : null}
                      <span className="text-xs font-medium text-muted-foreground">
                        {review.time}
                      </span>
                    </div>
                    <div className="mt-3 pr-2 text-sm leading-7 text-foreground/95 md:text-[15px]">
                      <p className="whitespace-pre-line">
                        <span className="mr-2 rounded-md bg-primary/25 px-1.5 py-0.5 font-semibold text-primary">
                          @Zac Trades
                        </span>
                        {review.quote}
                      </p>
                      {review.imageUrls?.length ? (
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          {review.imageUrls.map((imageUrl, imageIndex) => (
                            <a
                              key={`${review.name}-${review.time}-image-${imageIndex}`}
                              href={imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="group/image overflow-hidden rounded-2xl border border-primary/20 bg-background/45"
                            >
                              <img
                                src={imageUrl}
                                alt={`${review.name} review image ${imageIndex + 1}`}
                                className="aspect-video w-full object-cover transition-transform duration-300 group-hover/image:scale-105"
                              />
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {hasMoreReviews && (
          <motion.div {...fadeUp} className="mt-8 flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() =>
                setVisibleReviewCount((current) =>
                  Math.min(current + initialReviewCount, allReviews.length),
                )
              }
              className="glass border-primary/40 px-8 font-semibold text-electric hover:border-primary/70 hover:bg-primary/10"
            >
              Load more reviews
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {!isStaff && (
          <motion.div
            {...fadeUp}
            className="mx-auto mt-10 flex max-w-3xl flex-col items-center gap-4 rounded-3xl border border-primary/25 bg-card/35 p-5 text-center shadow-[0_24px_90px_-60px_rgba(0,163,255,0.9)] md:p-6"
          >
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-electric">
              Member review
            </Badge>
            <div>
              <h3 className="font-display text-2xl font-bold">Share your experience</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Paid members can write a review after joining mentorship, live trading, coaching, or
                news access.
              </p>
            </div>
            {reviewStatus && (
              <p
                className={`w-full rounded-xl border px-4 py-3 text-sm ${
                  reviewStatus.type === "success"
                    ? "border-bull/35 bg-bull/10 text-bull"
                    : "border-bear/35 bg-bear/10 text-bear"
                }`}
              >
                {reviewStatus.message}
              </p>
            )}
            <Button
              type="button"
              size="lg"
              disabled={Boolean(user) && reviewAccessLoading}
              onClick={() => {
                setReviewStatus(null);
                setReviewDialogOpen(true);
              }}
              className="px-8 text-primary-foreground glow-primary hover:opacity-90"
              style={{ background: "var(--gradient-primary)" }}
            >
              {reviewAccessLoading ? "Checking access..." : "Write review"}
              <MessageCircle className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        <Dialog
          open={reviewDialogOpen}
          onOpenChange={(open) => {
            setReviewDialogOpen(open);
            if (!open && !reviewSubmitting) {
              resetReviewImages();
            }
          }}
        >
          <DialogContent className="glass-strong max-w-2xl overflow-hidden border-border/60 p-0 shadow-2xl">
            <div className="relative">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
              <div className="absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-gold/10 blur-3xl" />
              <div className="relative p-5 md:p-7">
                <DialogHeader>
                  <Badge
                    variant="outline"
                    className="mb-2 w-fit border-primary/40 bg-primary/10 text-electric"
                  >
                    Member review
                  </Badge>
                  <DialogTitle className="font-display text-3xl font-bold">
                    Write your ZacTrades review
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-6">
                    Your review will stay pending until the admin approves it.
                  </DialogDescription>
                </DialogHeader>

                {!user ? (
                  <div className="mt-6 rounded-2xl border border-border/60 bg-background/45 p-5 text-sm leading-6 text-muted-foreground">
                    Sign in from the header to write a review as a ZacTrades member.
                  </div>
                ) : reviewAccessLoading ? (
                  <div className="mt-6 rounded-2xl border border-primary/35 bg-primary/10 p-5 text-sm leading-6 text-electric">
                    Checking your paid member access...
                  </div>
                ) : !hasPaidReviewAccess ? (
                  <div className="mt-6 rounded-2xl border border-gold/35 bg-gold/10 p-5 text-sm leading-6 text-muted-foreground">
                    Only paid members can write reviews. Join any ZacTrades plan first, then come
                    back to share your experience.
                  </div>
                ) : (
                  <form onSubmit={submitReview} className="mt-6 space-y-5">
                    <div>
                      <Label className="text-xs">Rating</Label>
                      <div className="mt-2 flex gap-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            disabled={reviewSubmitting}
                            onClick={() => setReviewRating(rating)}
                            className="rounded-full p-1 transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`${rating} star review`}
                          >
                            <Star
                              className={`h-7 w-7 ${
                                rating <= reviewRating
                                  ? "fill-gold text-gold"
                                  : "text-muted-foreground/45"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="member-review-message" className="text-xs">
                        Your review
                      </Label>
                      <Textarea
                        id="member-review-message"
                        value={reviewMessage}
                        onChange={(event) => {
                          setReviewMessage(event.target.value);
                          setReviewStatus(null);
                        }}
                        disabled={reviewSubmitting}
                        maxLength={2000}
                        placeholder="Write what changed for you after joining ZacTrades..."
                        className="mt-2 min-h-40 resize-y border-border/60 bg-background/45 text-sm leading-6"
                      />
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background/35 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <Label className="text-xs">Review images</Label>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Optional. Upload up to 2 images.
                          </p>
                        </div>
                        <label
                          className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary/35 bg-primary/10 px-4 py-2 text-sm font-semibold text-electric transition-colors hover:bg-primary/15 ${
                            reviewSubmitting || reviewImages.length >= 2
                              ? "pointer-events-none opacity-50"
                              : ""
                          }`}
                        >
                          <Upload className="h-4 w-4" />
                          Upload image
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            multiple
                            disabled={reviewSubmitting || reviewImages.length >= 2}
                            onChange={(event) => {
                              handleReviewImageSelection(event.target.files);
                              event.currentTarget.value = "";
                            }}
                            className="sr-only"
                          />
                        </label>
                      </div>

                      {reviewImagePreviews.length ? (
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          {reviewImagePreviews.map((imageUrl, imageIndex) => (
                            <div
                              key={imageUrl}
                              className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card/70"
                            >
                              <img
                                src={imageUrl}
                                alt={`Selected review image ${imageIndex + 1}`}
                                className="aspect-video w-full object-cover"
                              />
                              <button
                                type="button"
                                disabled={reviewSubmitting}
                                onClick={() => removeReviewImage(imageIndex)}
                                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Remove selected image"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    {reviewStatus?.type === "error" && (
                      <p className="rounded-xl border border-bear/35 bg-bear/10 px-4 py-3 text-sm text-bear">
                        {reviewStatus.message}
                      </p>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-muted-foreground">
                        Only approved reviews are displayed on the homepage.
                      </p>
                      <Button
                        type="submit"
                        disabled={reviewSubmitting}
                        className="text-primary-foreground glow-primary hover:opacity-90"
                        style={{ background: "var(--gradient-primary)" }}
                      >
                        {reviewSubmitting ? "Sending..." : "Submit review"}
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}

function formatReviewDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

async function uploadReviewImages(files: File[], userId: string) {
  if (!files.length) return [];

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const uploadedUrls: string[] = [];

  for (const file of files.slice(0, 2)) {
    if (file.size > MAX_REVIEW_IMAGE_BYTES) {
      throw new Error("Each review image must be smaller than 4 MB.");
    }

    if (!isAcceptedReviewImage(file)) {
      throw new Error("Please upload only PNG, JPG, WEBP, or GIF images.");
    }

    const extension = getReviewImageExtension(file);
    const safeName =
      file.name
        .replace(/\.[^.]+$/i, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "review-image";
    const storagePath = `${userId}/${crypto.randomUUID()}-${safeName}.${extension}`;

    const { error } = await supabase.storage
      .from(MEMBER_REVIEW_IMAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "86400",
        contentType: getReviewImageContentType(file),
        upsert: true,
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data } = supabase.storage.from(MEMBER_REVIEW_IMAGE_BUCKET).getPublicUrl(storagePath);
    uploadedUrls.push(data.publicUrl);
  }

  return uploadedUrls;
}

function isAcceptedReviewImage(file: File) {
  const lowerName = file.name.toLowerCase();
  const hasAcceptedExtension = [".png", ".jpg", ".jpeg", ".webp", ".gif"].some((extension) =>
    lowerName.endsWith(extension),
  );

  return (!file.type || ACCEPTED_REVIEW_IMAGE_TYPES.has(file.type)) && hasAcceptedExtension;
}

function getReviewImageExtension(file: File) {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") || file.type === "image/jpeg")
    return "jpg";
  if (lowerName.endsWith(".webp") || file.type === "image/webp") return "webp";
  if (lowerName.endsWith(".gif") || file.type === "image/gif") return "gif";

  return "png";
}

function getReviewImageContentType(file: File) {
  if (file.type && ACCEPTED_REVIEW_IMAGE_TYPES.has(file.type)) return file.type;

  const extension = getReviewImageExtension(file);
  if (extension === "jpg") return "image/jpeg";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";

  return "image/png";
}

/* ============================ CONNECT ============================ */
function BrandSocialIcon({ iconKey, className = "" }: { iconKey: string; className?: string }) {
  if (iconKey === "youtube") {
    return (
      <svg viewBox="0 0 512 512" aria-hidden="true" className={className}>
        <path
          fill="#ff0000"
          d="M501.3 132.8c-5.9-22.3-23.3-39.8-45.5-45.8C415.6 76.2 256 76.2 256 76.2S96.4 76.2 56.2 87c-22.2 6-39.6 23.5-45.5 45.8C0 173.2 0 257.4 0 257.4s0 84.2 10.7 124.6c5.9 22.3 23.3 39 45.5 45 40.2 10.8 199.8 10.8 199.8 10.8s159.6 0 199.8-10.8c22.2-6 39.6-22.7 45.5-45 10.7-40.4 10.7-124.6 10.7-124.6s0-84.2-10.7-124.6Z"
        />
        <path fill="#ffffff" d="m204.8 333.5 132.7-76.1-132.7-76.1v152.2Z" />
      </svg>
    );
  }

  if (iconKey === "instagram") {
    return (
      <svg viewBox="0 0 512 512" aria-hidden="true" className={className}>
        <defs>
          <radialGradient id="instagramGlow" cx="22%" cy="98%" r="110%">
            <stop offset="0%" stopColor="#ffd600" />
            <stop offset="42%" stopColor="#ff3d00" />
            <stop offset="70%" stopColor="#e80072" />
            <stop offset="100%" stopColor="#7638fa" />
          </radialGradient>
        </defs>
        <path
          fill="url(#instagramGlow)"
          d="M349.3 0H162.7C72.9 0 0 72.9 0 162.7v186.6C0 439.1 72.9 512 162.7 512h186.6C439.1 512 512 439.1 512 349.3V162.7C512 72.9 439.1 0 349.3 0Zm110.3 349.3c0 60.9-49.4 110.3-110.3 110.3H162.7c-60.9 0-110.3-49.4-110.3-110.3V162.7c0-60.9 49.4-110.3 110.3-110.3h186.6c60.9 0 110.3 49.4 110.3 110.3v186.6Z"
        />
        <path
          fill="url(#instagramGlow)"
          d="M256 124.6c-72.5 0-131.4 58.9-131.4 131.4S183.5 387.4 256 387.4 387.4 328.5 387.4 256 328.5 124.6 256 124.6Zm0 216.7c-47.1 0-85.3-38.2-85.3-85.3s38.2-85.3 85.3-85.3 85.3 38.2 85.3 85.3-38.2 85.3-85.3 85.3Z"
        />
        <circle cx="393.2" cy="118.8" r="30.7" fill="url(#instagramGlow)" />
      </svg>
    );
  }

  if (iconKey === "music") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
        <path
          fill="currentColor"
          d="M12.53.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z"
        />
      </svg>
    );
  }

  if (iconKey === "message") {
    return (
      <svg viewBox="0 0 512 512" aria-hidden="true" className={className}>
        <path
          fill="#6f82d8"
          d="M403.8 122.5c-29.7-13.6-61.4-23.6-94.6-29.2-4.1 7.4-8.8 17.2-12.1 25.1-35.3-5.3-70.4-5.3-105.1 0-3.3-7.9-8.1-17.7-12.2-25.1-33.2 5.7-64.9 15.6-94.7 29.3-59.9 88.9-76.1 175.6-68 261.1 39.8 29.2 78.4 46.9 116.4 58.5 9.4-12.7 17.8-26.1 25-40.2-13.7-5.1-26.8-11.4-39.2-18.7 3.3-2.4 6.5-4.9 9.6-7.4 75.6 34.6 157.6 34.6 232.3 0 3.2 2.6 6.4 5.1 9.6 7.4-12.4 7.3-25.6 13.6-39.3 18.7 7.2 14.1 15.5 27.5 25 40.2 38.1-11.6 76.7-29.3 116.5-58.5 9.5-99.2-16.2-185.1-68.1-261.2ZM171.9 331.2c-22.7 0-41.4-20.7-41.4-46.2s18.3-46.2 41.4-46.2c23.2 0 41.8 20.9 41.4 46.2 0 25.5-18.3 46.2-41.4 46.2Zm168.2 0c-22.7 0-41.4-20.7-41.4-46.2s18.3-46.2 41.4-46.2c23.2 0 41.8 20.9 41.4 46.2 0 25.5-18.2 46.2-41.4 46.2Z"
        />
      </svg>
    );
  }

  return <MessageCircle className={className} />;
}

function ConnectWithUs() {
  const [socials, setSocials] = useState<CommunitySocialRow[]>(defaultCommunitySocials);

  useEffect(() => {
    let mounted = true;

    fetchCommunitySocials().then((items) => {
      if (mounted) {
        setSocials(items);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const socialIconShells = {
    youtube: "border-bear/35 bg-bear/10 shadow-bear/10",
    instagram: "border-gold/35 bg-gold/10 shadow-gold/10",
    music: "border-foreground/15 bg-white shadow-white/10 text-black",
    message: "border-[#6f82d8]/40 bg-[#6f82d8]/10 shadow-[#6f82d8]/10",
  };

  return (
    <section id="connect" className="py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="glass mb-4 border-primary/40 text-xs">
            <MessageCircle className="mr-1.5 h-3 w-3 text-electric" />
            Connect with us
          </Badge>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Follow the <span className="text-gradient">ZacTrades</span> community
          </h2>
          <p className="mt-4 text-muted-foreground">
            Keep up with lessons, live updates, member wins, and community discussions.
          </p>
        </motion.div>

        <div className="mt-7 grid gap-5 sm:grid-cols-2 md:mt-9 lg:grid-cols-4">
          {socials.map((social, i) => {
            const iconShell =
              socialIconShells[social.icon_key as keyof typeof socialIconShells] ??
              "border-primary/40 bg-primary/10 shadow-primary/10";

            return (
              <motion.div
                key={social.slug}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.05 }}
                className="glass group flex min-h-64 flex-col rounded-2xl p-5 transition-all hover:-translate-y-1 hover:border-primary/40"
              >
                <div
                  className={`grid h-14 w-14 place-items-center rounded-2xl border shadow-lg ${iconShell}`}
                >
                  <BrandSocialIcon iconKey={social.icon_key} className="h-8 w-8" />
                </div>
                <h3 className="mt-5 font-display text-xl font-bold">{social.name}</h3>
                <p className="mt-1 text-sm font-semibold text-electric">{social.handle}</p>
                <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
                  {social.description}
                </p>
                <Button
                  asChild
                  className="mt-5 w-full text-primary-foreground glow-primary hover:opacity-90"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <a href={social.url} target="_blank" rel="noreferrer">
                    Open {social.name}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================ NEWSLETTER ============================ */
function Newsletter() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  return (
    <section id="newsletter" className="relative overflow-hidden py-12 md:py-20">
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
      <div className="grid-bg absolute inset-0 -z-10" />

      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <motion.div
          {...fadeUp}
          className="glass-strong relative overflow-hidden rounded-2xl p-6 md:p-10"
        >
          <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-gold/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <Badge variant="outline" className="glass mb-4 border-gold/40 text-xs">
                <Mail className="mr-1.5 h-3 w-3 text-gold" />
                Newsletter
              </Badge>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Join ZacTrades<span className="text-gradient-gold"> Newsletter</span>
              </h2>
              <p className="mt-4 max-w-2xl text-muted-foreground md:text-lg">
                Get weekly market notes, trade recaps, and mindset prompts from the ZacTrades team.
              </p>
            </div>

            <form
              className="rounded-xl border border-border/60 bg-background/55 p-3 shadow-sm"
              onSubmit={(event) => {
                event.preventDefault();
                if (!email.trim()) return;
                setJoined(true);
              }}
            >
              <label className="sr-only" htmlFor="newsletter-email">
                Email address
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setJoined(false);
                  }}
                  placeholder="you@example.com"
                  className="min-h-12 flex-1 rounded-lg border border-border/70 bg-card/80 px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                />
                <Button
                  type="submit"
                  size="lg"
                  style={{ background: "var(--gradient-gold)" }}
                  className="h-12 shrink-0 px-6 font-semibold text-background glow-gold hover:opacity-90"
                >
                  Subscribe
                  <Send className="ml-1 h-4 w-4" />
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {joined
                  ? "You're on the list. Watch your inbox for the next ZTC update."
                  : "No spam. Just sharp trading insights and community updates."}
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================ FAQ ============================ */
function FAQ() {
  const faqs = [
    {
      q: "Do I need trading experience to join?",
      a: "No. Our curriculum covers everything from beginner fundamentals to advanced strategies. Many of our most successful members started with zero experience.",
    },
    {
      q: "Do you provide signals or trade alerts?",
      a: "No, I don’t provide trade signals or alerts. This community is focused on education, insights, and market analysis. My goal is to help members understand specific strategies and learn how to apply them in real time so they can develop their own skills and confidence, not rely on direct signals.",
    },
    {
      q: "Are beginners welcome in this group?",
      a: "Yes, traders of all experience levels are welcome! The content is designed to be beginner-friendly while still valuable to more advanced traders. Inside the Discord, you’ll find an education section with a clear syllabus and attached lessons. After completing the lessons, make sure to work through the homework assignments to reinforce your understanding.",
    },
    {
      q: "Are you a financial advisor?",
      a: "No, I’m not a financial advisor, and nothing shared in this Discord group should be considered financial or investment advice. All content is for educational purposes only. Please consult a licensed financial professional before making any financial decisions.",
    },
    {
      q: "Do you guarantee profits or success in trading?",
      a: "No. Trading always involves risk, and no method can guarantee profit. My goal is to provide high-quality educational resources that help you make informed decisions, but your success ultimately depends on your own consistency, understanding, and risk management.",
    },
    {
      q: "What kind of content can I expect in this group?",
      a: "You can expect structured educational content covering All strategies , pre-market analysis, weekly outlooks, chart breakdowns, interactive discussions, and homework assignments. You’ll also find a well-organized study section with resources designed to deepen your understanding of the markets.",
    },
    {
      q: "Is there a daily or weekly routine in the group?",
      a: "Yes. We follow a consistent routine that includes weekly market outlooks every Sunday, daily pre-market plans, and regular member Q&A sessions. I also highlight key levels to watch and discuss any major market events or news that could influence price action",
    },
  ];
  return (
    <section id="faq" className="py-12 md:py-20">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <motion.div {...fadeUp} className="text-center">
          <Badge variant="outline" className="glass mb-4 border-primary/40 text-xs">
            FAQ
          </Badge>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Questions, <span className="text-gradient">answered.</span>
          </h2>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="mt-10">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="glass rounded-xl border-0 px-5">
                <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================ FINAL CTA ============================ */
function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
      <div className="grid-bg absolute inset-0 -z-10" />
      <div className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />

      <div className="mx-auto max-w-4xl px-4 text-center md:px-6">
        <motion.div {...fadeUp}>
          <ChevronDown className="mx-auto h-6 w-6 text-electric animate-bounce" />
          <h2 className="mt-6 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-7xl">
            Your trading <br />
            <span className="text-gradient-gold">transformation</span> starts today.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground md:text-base">
            Stop chasing signals. Start building your own understanding of the market.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              style={{ background: "var(--gradient-gold)" }}
              className="group h-14 px-10 text-base font-semibold text-background glow-gold hover:opacity-90"
            >
              <a href="#mentorship">
                Join ZTC Traders Club
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
