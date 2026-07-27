import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Check, GraduationCap, Shield, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About | ZacTrades" },
      {
        name: "description",
        content:
          "Learn about ZacTrades, the trading education community built around live sessions, mentorship, indicators, and disciplined risk management.",
      },
      { property: "og:title", content: "About | ZacTrades" },
      {
        property: "og:description",
        content:
          "Meet the ZacTrades trading education ecosystem and the principles behind our community.",
      },
    ],
  }),
  component: AboutPage,
});

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const values = [
  {
    icon: Shield,
    title: "Risk first",
    description:
      "Every lesson starts with protecting capital, controlling position size, and respecting drawdown.",
  },
  {
    icon: BarChart3,
    title: "Process over hype",
    description:
      "We focus on repeatable setups, journaling, market structure, and trade review instead of noise.",
  },
  {
    icon: Users,
    title: "Community accountability",
    description:
      "Members learn faster when they can ask questions, review mistakes, and stay close to serious traders.",
  },
];

const stats = [
  { value: "10k+", label: "traders reached" },
  { value: "5 days", label: "live market sessions" },
  { value: "4 paths", label: "education tracks" },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-24">
          <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
          <div className="grid-bg absolute inset-0 -z-10" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/45 via-background/75 to-background" />

          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
              <Badge variant="outline" className="glass mb-6 border-primary/40 text-xs">
                About ZacTrades
              </Badge>
              <h1 className="font-display text-5xl font-bold leading-tight tracking-tight md:text-7xl">
                Built for traders who want <span className="text-gradient">structure</span>, not
                noise.
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                ZacTrades is a trading education ecosystem combining live market sessions,
                mentorship, premium tools, and community support for traders who want to build a
                disciplined process.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  style={{ background: "var(--gradient-primary)" }}
                  className="group h-12 px-7 font-semibold text-primary-foreground glow-primary hover:opacity-90"
                >
                  <a href="/#mentorship">
                    Start Mentorship
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="glass h-12 border-border/60 px-7 font-semibold"
                >
                  <a href="/education">Explore Education</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 md:grid-cols-3 md:px-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: index * 0.05 }}
                className="rounded-2xl border border-border/50 bg-card/35 p-6 text-center"
              >
                <div className="font-mono text-4xl font-bold text-gradient-gold">{stat.value}</div>
                <div className="mt-2 text-sm uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 md:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <motion.div {...fadeUp}>
              <Badge variant="outline" className="glass mb-4 border-gold/40 text-xs">
                Our mission
              </Badge>
              <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
                Help traders build skill before they chase returns.
              </h2>
              <p className="mt-5 text-sm leading-7 text-muted-foreground md:text-base">
                Most traders do not fail because they need another random setup. They fail because
                they lack a repeatable plan, clean risk rules, review habits, and a calm environment
                to learn inside. ZacTrades brings those pieces together in one place.
              </p>
            </motion.div>

            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.1 }}
              className="grid gap-4"
            >
              {[
                "Live sessions for real-time market context",
                "Mentorship for direct feedback and accountability",
                "Education paths for foundations, psychology, study, and risk",
                "Tools and indicators designed to support disciplined execution",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/45 p-4"
                >
                  <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-bull/15 text-bull">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="glass mb-4 border-primary/40 text-xs">
                <GraduationCap className="mr-1.5 h-3.5 w-3.5 text-gold" />
                What guides us
              </Badge>
              <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
                Principles behind the platform
              </h2>
            </motion.div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: index * 0.06 }}
                  className="rounded-2xl border border-border/50 bg-card/35 p-6"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-electric ring-1 ring-primary/30">
                    <value.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-display text-xl font-bold">{value.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
