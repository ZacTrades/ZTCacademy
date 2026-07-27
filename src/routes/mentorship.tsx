import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  Compass,
  BadgePercent,
  GraduationCap,
  MessageSquareText,
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
import tradingViewPreview from "@/assets/zactrades-tradingview-preview.jpeg";
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
    title: "Onboarding",
    label: "Week 0",
    description:
      "We map your level, goals, risk profile, schedule, and the exact problems blocking your consistency.",
  },
  {
    icon: Compass,
    title: "Learning path",
    label: "Week 1",
    description:
      "You get a focused plan covering market structure, risk rules, entries, journaling, and review habits.",
  },
  {
    icon: Radar,
    title: "Guided execution",
    label: "Weeks 2-3",
    description:
      "We review setups, decision quality, timing, and trade management so your process becomes clearer.",
  },
  {
    icon: ShieldCheck,
    title: "Accountability",
    label: "Week 4",
    description:
      "You leave with cleaner rules, next steps, and a repeatable routine for studying and trading with discipline.",
  },
];

const pillars = [
  "Personal feedback instead of random lessons",
  "Risk-first rules before any setup",
  "Live market context and structured review",
  "Clear next steps after each coaching cycle",
];

function MentorshipPage() {
  const { isStaff } = useAuth();
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
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
          <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
          <div className="grid-bg absolute inset-0 -z-10" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/45 via-background/80 to-background" />

          <div className="mx-auto grid max-w-7xl gap-10 px-4 md:px-6 lg:grid-cols-[0.96fr_1.04fr] lg:items-center">
            <motion.div {...fadeUp}>
              <Badge variant="outline" className="glass mb-6 border-gold/40 text-xs">
                <GraduationCap className="mr-1.5 h-3.5 w-3.5 text-gold" />
                ZacTrades Mentorship
              </Badge>
              <h1 className="font-display text-5xl font-bold leading-tight tracking-tight md:text-7xl">
                Build a trading process you can actually{" "}
                <span className="text-gradient-gold">repeat.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Our mentorship is a guided training cycle for traders who want structure, feedback,
                and accountability. We keep it brief, practical, and focused on the decisions you
                make before, during, and after each trade.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {pillars.map((pillar) => (
                  <div
                    key={pillar}
                    className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/45 px-4 py-3 text-sm text-muted-foreground"
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-bull/15 text-bull">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    {pillar}
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
              <div className="glass-strong overflow-hidden rounded-3xl p-3 md:p-4 glow-primary">
                <div className="flex flex-wrap items-center gap-2 px-3 py-2">
                  <span className="h-3 w-3 rounded-full bg-bear/70" />
                  <span className="h-3 w-3 rounded-full bg-gold/70" />
                  <span className="h-3 w-3 rounded-full bg-bull/70" />
                  <span className="ml-0 min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground sm:ml-4">
                    mentorship desk / live review
                  </span>
                  <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-gold">
                    Guided
                  </span>
                </div>
                <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-[#070b10]">
                  <img
                    src={tradingViewPreview}
                    alt="TradingView execution review used in ZacTrades mentorship."
                    className="aspect-[4/3] w-full object-contain md:aspect-[1.4/1]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-border/50 bg-background/80 p-4 backdrop-blur">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-electric">
                        <MessageSquareText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Review the decision, not only P/L.</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Every session is built around clarity, rules, and execution quality.
                        </p>
                      </div>
                    </div>
                  </div>
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
              <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
                From onboarding to guided execution
              </h2>
              <p className="mt-4 text-muted-foreground">
                A simple mentorship path designed to remove confusion and make your next trading
                week more intentional.
              </p>
            </motion.div>

            <div className="relative mt-12 grid gap-5 lg:grid-cols-4">
              <div className="absolute left-0 right-0 top-16 hidden h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent lg:block" />
              {processSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: index * 0.07 }}
                  className="glass relative rounded-2xl p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-electric ring-1 ring-primary/30">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-gold">
                      {step.label}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-bold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.description}</p>
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
              <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
                Coaching that stays close to your actual decisions.
              </h2>
              <p className="mt-5 text-sm leading-7 text-muted-foreground md:text-base">
                The goal is not to overwhelm you with theory. The goal is to help you understand
                what to look for, when to wait, how much to risk, and how to review the result
                without emotion taking over.
              </p>
            </motion.div>

            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.1 }}
              className="grid gap-4 sm:grid-cols-2"
            >
              {[
                "Clear trade plan structure",
                "Risk and drawdown limits",
                "Setup review and execution feedback",
                "Journaling and weekly improvement loop",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-border/50 bg-card/35 p-5">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-bull/15 text-bull">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </div>
                  <p className="mt-4 text-sm font-semibold">{item}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <section id="choose-coaching" className="py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="glass mb-4 border-primary/40 text-xs">
                Choose your path
              </Badge>
              <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
                Private focus or group momentum
              </h2>
              <p className="mt-4 text-muted-foreground">
                Pick the mentorship format that matches how you want to learn.
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
                  {option.promotionEnabled && (
                    <div className="relative mb-5 overflow-hidden rounded-2xl border border-gold/45 bg-gold/15 p-4 shadow-[0_20px_60px_-44px_hsl(var(--gold)/0.95)]">
                      <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-gold/20 to-transparent" />
                      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold text-background">
                            <BadgePercent className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold">
                              Limited promotion
                            </div>
                            <div className="mt-1 font-display text-lg font-bold text-foreground">
                              {option.promotionLabel || "Special coaching offer"}
                            </div>
                          </div>
                        </div>
                        {(option.promotionNote || option.promotionEndsAt) && (
                          <div className="rounded-xl border border-gold/35 bg-background/55 px-4 py-3 text-xs font-semibold leading-5 text-gold sm:max-w-56 sm:text-right">
                            {[option.promotionNote, option.promotionEndsAt]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
                    <div
                      className={`shrink-0 rounded-xl border p-4 sm:text-right ${
                        option.promotionEnabled
                          ? "border-gold/45 bg-gold/10"
                          : "border-border/50 bg-background/55"
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        {option.promotionEnabled ? "Promotion price" : "Starting at"}
                      </div>
                      {option.promotionEnabled && option.originalPrice && (
                        <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 font-mono text-xs text-muted-foreground">
                          <span>Was</span>
                          <span className="line-through">{option.originalPrice}</span>
                        </div>
                      )}
                      <div
                        className={`font-display text-4xl font-bold ${
                          option.promotionEnabled ? "mt-2 text-gold" : "mt-1 text-primary"
                        }`}
                      >
                        {option.price}
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
                      <StaffCheckoutNotice description="Mentorship checkout is hidden for admin and moderator accounts. Staff can manage coaching prices and promotions from the admin page." />
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
                      {option.promotionEnabled ? `Claim offer - ${option.cta}` : option.cta}
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
