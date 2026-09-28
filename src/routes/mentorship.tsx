import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  Compass,
  GraduationCap,
  Radar,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckoutDialog } from "@/components/site/CheckoutDialog";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { StaffCheckoutNotice } from "@/components/site/StaffCheckoutNotice";
import { defaultCoachingPlans, fetchCoachingPlans } from "@/components/site/coachingPlans";
import mentorshipLiveReviewPreview from "@/assets/mentorship-live-review-preview.png";
import { useCurrency } from "@/lib/currency";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/mentorship")({
  head: () => ({
    meta: [
      { title: "Mentorship | ZacTrades" },
      {
        name: "description",
        content:
          "Learn how ZacTrades mentorship works, from onboarding and learning to guided execution, then choose 1-to-1 coaching or training group coaching.",
      },
      { property: "og:title", content: "Mentorship | ZacTrades" },
      {
        property: "og:description",
        content:
          "A structured trading mentorship path with onboarding, learning, guidance, and coaching options.",
      },
    ],
  }),
  component: MentorshipPage,
});

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const processSteps = [
  {
    icon: ClipboardCheck,
    title: "Understand Where You Are",
    description:
      "We start by looking at your current level, your experience, your trading habits, and the problems you're facing. This gives us a clear idea of what you actually need to work on.",
  },
  {
    icon: GraduationCap,
    title: "Build Your Foundation",
    description:
      "We work on the fundamentals that matter: market structure, liquidity, price action, risk management, and trade planning. The goal is to remove confusion and give you a clear way to read the market.",
  },
  {
    icon: Compass,
    title: "Apply It To The Market",
    description:
      "We take what you learn and apply it to real market conditions. We go through setups, entries, invalidation, trade management, and the decisions behind each trade.",
  },
  {
    icon: Radar,
    title: "Review, Correct & Improve",
    description:
      "This is where the real progress happens. We review your trades, identify mistakes and bad habits, and work on improving your decision-making, discipline, and execution.",
  },
  {
    icon: ShieldCheck,
    title: "Build Your Own Process",
    description:
      "The goal is not for you to depend on me forever. By the end, you should have a clear trading process, defined rules, and a better understanding of why you take a trade - or why you stay out.",
  },
];

const pillars = [
  {
    title: "Clear Direction",
    description: "Know what to focus on instead of jumping between strategies.",
  },
  {
    title: "Learn The Process",
    description: "Understand how to analyze, plan, execute, and manage a trade.",
  },
  {
    title: "Real Feedback",
    description: "Get honest feedback on your trades and the decisions behind them.",
  },
  {
    title: "Build Independence",
    description: "Develop your own process instead of depending on signals.",
  },
];

function MentorshipPage() {
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
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <Navbar />
      <main>
        <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
          <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
          <div className="grid-bg absolute inset-0 -z-10" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/45 via-background/80 to-background" />

          <div className="mx-auto grid max-w-7xl gap-10 px-4 md:px-6 lg:grid-cols-[0.94fr_1.06fr] lg:items-center">
            <motion.div {...fadeUp}>
              <Badge variant="outline" className="glass mb-6 border-gold/40 text-xs">
                <GraduationCap className="mr-1.5 h-3.5 w-3.5 text-gold" />
                ZacTrades Mentorship
              </Badge>
              <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-7xl">
                Stop Guessing. Start Building Your Own{" "}
                <span className="text-gradient-gold">Trading Process.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Learn how to read the market, build a trading plan, manage risk, and make your own
                decisions with confidence. My mentorship is built around real market conditions,
                practical training, and direct feedback, not endless theory.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {pillars.map((pillar) => (
                  <div
                    key={pillar.title}
                    className="group flex items-start gap-4 rounded-2xl border border-border/50 bg-background/45 px-4 py-4 transition hover:border-bull/35 hover:bg-bull/[0.04]"
                  >
                    <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-bull/15 text-bull ring-1 ring-bull/20 transition group-hover:bg-bull/20">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>
                    <span>
                      <span className="block font-display text-base font-bold text-foreground">
                        {pillar.title}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                        {pillar.description}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  style={{ background: "var(--gradient-primary)" }}
                  className="group h-12 px-7 font-semibold text-primary-foreground glow-primary hover:opacity-90"
                >
                  <a href="#choose-coaching">
                    Choose Coaching
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="glass h-12 border-border/60 px-7 font-semibold"
                >
                  <a href="#process">See Process</a>
                </Button>
              </div>
            </motion.div>

            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.12 }}
              className="relative"
            >
              <div className="absolute -inset-8 -z-10 rounded-full bg-primary/20 blur-3xl" />
              <div className="absolute -bottom-8 left-10 right-10 -z-10 h-20 rounded-full bg-electric/20 blur-3xl" />
              <div className="glass-strong overflow-hidden rounded-3xl border border-primary/20 p-2 shadow-[0_0_90px_rgba(0,149,255,0.18)] md:p-3">
                <div className="relative overflow-hidden rounded-[1.35rem] bg-[#050910]">
                  <img
                    src={mentorshipLiveReviewPreview}
                    alt="ZacTrades mentorship desk showing one-to-one coaching, group mentoring, and live trading review."
                    className="w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-[1.35rem] ring-1 ring-inset ring-white/10" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/25 via-transparent to-white/[0.02]" />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="process" className="py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="glass mb-4 border-primary/40 text-xs">
                Process
              </Badge>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                From Learning To Independent Trading
              </h2>
              <p className="mt-4 text-muted-foreground">
                A structured path designed to take you from understanding the basics to making your
                own informed trading decisions.
              </p>
            </motion.div>

            <div className="relative mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                whileInView={{ scaleX: 1, opacity: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-0 right-0 top-16 hidden h-px origin-left bg-gradient-to-r from-transparent via-primary/45 to-transparent xl:block"
              />
              {processSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 34, scale: 0.96, filter: "blur(8px)" }}
                  whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  viewport={{ once: true, margin: "-70px" }}
                  transition={{
                    duration: 0.72,
                    delay: index * 0.13,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="glass relative overflow-hidden rounded-2xl p-6"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: [0, 1, 0.35] }}
                    viewport={{ once: true, margin: "-70px" }}
                    transition={{ duration: 0.95, delay: index * 0.13 + 0.2 }}
                    className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/16 via-transparent to-gold/12"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.35 }}
                    whileInView={{ opacity: [0, 0.85, 0.35], scale: [0.35, 1.15, 1] }}
                    viewport={{ once: true, margin: "-70px" }}
                    transition={{ duration: 0.9, delay: index * 0.13 + 0.25 }}
                    className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary/20 blur-2xl"
                  />
                  <div className="relative flex items-start justify-between gap-4">
                    <motion.div
                      initial={{ rotate: -10, scale: 0.78 }}
                      whileInView={{ rotate: 0, scale: 1 }}
                      viewport={{ once: true, margin: "-70px" }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 16,
                        delay: index * 0.13 + 0.18,
                      }}
                      className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-electric ring-1 ring-primary/30"
                    >
                      <step.icon className="h-5 w-5" />
                    </motion.div>
                  </div>
                  <h3 className="relative mt-5 font-display text-xl font-bold">{step.title}</h3>
                  <p className="relative mt-3 text-sm leading-6 text-muted-foreground">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 md:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <motion.div {...fadeUp}>
              <Badge variant="outline" className="glass mb-4 border-gold/40 text-xs">
                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-gold" />
                What you receive
              </Badge>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Coaching Built Around Your Trading.
              </h2>
              <p className="mt-5 text-sm leading-7 text-muted-foreground md:text-base">
                You don't need more random trading information. You need to understand what you're
                doing, why you're doing it, and how to improve. We focus on your analysis,
                execution, risk management, and decision-making so you can build a process that is
                truly your own.
              </p>
            </motion.div>

            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.1 }}
              className="grid gap-4 sm:grid-cols-2"
            >
              {[
                {
                  title: "Clear Trading Process",
                  description:
                    "Learn how to analyze the market, build a plan, identify your setup, and know when to stay out.",
                },
                {
                  title: "Risk Management",
                  description:
                    "Understand how to manage your risk, protect your account, and control drawdown before thinking about profit.",
                },
                {
                  title: "Trade Review & Feedback",
                  description:
                    "We review your trades together and break down your entries, execution, management, mistakes, and decision-making.",
                },
                {
                  title: "Build Your Own System",
                  description:
                    "Develop clear rules and a repeatable process so you can trade independently instead of depending on signals.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border/50 bg-card/35 p-5"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-bull/15 text-bull">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <section id="choose-coaching" className="py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="glass mb-4 border-primary/40 text-xs">
                Choose Your Mentorship
              </Badge>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                One-to-One Coaching or Group Mentoring
              </h2>
              <p className="mt-4 text-muted-foreground">
                Choose the coaching format that fits your goals, experience, and the way you want to
                learn.
              </p>
            </motion.div>

            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              {coachingOptions.map((option, index) => (
                <motion.div
                  key={option.slug}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: index * 0.08 }}
                  className={`relative overflow-hidden rounded-2xl border p-6 md:p-8 ${
                    option.featured
                      ? "border-gold/40 bg-gold/10 shadow-[0_24px_80px_-46px_hsl(var(--gold)/0.9)]"
                      : "border-primary/25 bg-card/35"
                  }`}
                >
                  <div
                    className={`absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl ${
                      option.featured ? "bg-gold/20" : "bg-primary/20"
                    }`}
                    aria-hidden
                  />
                  <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div
                        className={`grid h-12 w-12 place-items-center rounded-xl ${
                          option.featured ? "bg-gold/15 text-gold" : "bg-primary/15 text-primary"
                        }`}
                      >
                        <option.icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-5 font-display text-2xl font-bold">{option.title}</h3>
                      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                        {option.desc}
                      </p>
                    </div>
                    <div className="shrink-0 rounded-xl border border-border/50 bg-background/55 p-4 sm:text-right">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Starting at
                      </div>
                      <div className="mt-1 font-display text-4xl font-bold text-primary">
                        {formatPrice(option.price)}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{option.duration}</div>
                    </div>
                  </div>

                  <div className="relative mt-7 grid gap-3 sm:grid-cols-3">
                    {option.details.map((detail) => (
                      <div
                        key={detail}
                        className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/45 px-3 py-2 text-xs text-muted-foreground"
                      >
                        <Check
                          className={`h-3.5 w-3.5 ${
                            option.featured ? "text-gold" : "text-primary"
                          }`}
                          strokeWidth={3}
                        />
                        {detail}
                      </div>
                    ))}
                  </div>

                  {isStaff ? (
                    <div className="relative mt-8">
                      <StaffCheckoutNotice description="Mentorship checkout is hidden for admin and moderator accounts. Staff can manage coaching prices from the admin page and use discount codes for offers." />
                    </div>
                  ) : (
                    <Button
                      type="button"
                      className={`group relative mt-8 ${
                        option.featured
                          ? "bg-gold text-background hover:bg-gold/90"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                      onClick={() => {
                        setSelectedCoachingIndex(index);
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
          </div>
        </section>
      </main>

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
      <Footer />
    </div>
  );
}
