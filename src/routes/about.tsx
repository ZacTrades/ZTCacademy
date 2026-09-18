import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Check,
  Compass,
  Flame,
  GraduationCap,
  Shield,
  Target,
  Users,
} from "lucide-react";

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
          "Learn the story behind ZacTrades, the trading education community built on patience, fearless execution, discipline, and real market understanding.",
      },
      { property: "og:title", content: "About | ZacTrades" },
      {
        property: "og:description",
        content: "The story, mission, and vision behind ZacTrades and the ZTC trading community.",
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

const stats = [
  { value: "6 years", label: "trading journey" },
  { value: "ZTC", label: "community vision" },
  { value: "2 rules", label: "patient and fearless" },
];

const storySections = [
  {
    icon: Flame,
    eyebrow: "The beginning",
    title: "It Started With a Dream",
    body: [
      `I started trading 6 years ago with one simple goal: I wanted to become financially free and build something of my own.`,
      `I never wanted to spend my life working for someone else. Becoming a businessman was always a dream of mine.`,
      `I was also inspired by the mindset behind Get Rich or Die Tryin' — not just the money, but the idea of building something for yourself and refusing to settle for an ordinary life.`,
      `But the journey was not easy.`,
    ],
  },
  {
    icon: Compass,
    eyebrow: "The lessons",
    title: "Learning The Hard Way",
    body: [
      `When I started, I struggled with two major things: capital and the right information.`,
      `There was so much information online, but finding information that actually made sense was difficult. Like many new traders, I spent a lot of time trying different things and learning through mistakes.`,
      `Then I discovered Michael Huddleston (ICT). ICT became my first major mentor in trading and completely changed the way I looked at the market.`,
      `His concepts gave me a strong foundation and helped me understand that trading was not simply about looking for entries. It was about understanding price, liquidity, structure, risk, and the behavior behind the market.`,
      `From there, I continued learning, testing, making mistakes, and developing my own approach. I didn't want to simply copy someone else's strategy. I wanted to understand the market for myself.`,
    ],
  },
  {
    icon: Users,
    eyebrow: "The mission",
    title: "Why I Created ZacTrades",
    body: [
      `As I became more experienced, I started helping some of my friends who were struggling with trading. I saw people making the same mistakes I had made.`,
      `Some were following random signals. Some were buying courses from people who had never really traded. Others were looking for a quick way to become financially free. And many were simply overwhelmed by too much information.`,
      `That made me realize something: there are many people who want to learn trading, but they don't know where to start or who to trust.`,
      `That's why I created ZacTrades. I wanted to build the community I wish I had when I started.`,
      `A place where beginners and experienced traders can learn, ask questions, study the markets, and develop a real understanding of trading. No fake promises. No shortcuts. No pretending that trading is easy. Just education, experience, discipline, and real work.`,
    ],
  },
  {
    icon: Target,
    eyebrow: "The vision",
    title: "The Vision",
    body: [
      `ZacTrades is bigger than just trading.`,
      `My goal is to build ZTC into the strongest trading community in Morocco, and eventually make it a name recognized across the Arab world.`,
      `I want ZTC to become a place where people can learn real skills, think for themselves, and build knowledge that stays with them for life.`,
      `Six years ago, I started trading because I wanted freedom. Today, I am building something that can help others work toward theirs.`,
      `This is only the beginning. Welcome to ZTC. Learn. Trade. Grow.`,
    ],
  },
];

const beliefs = [
  {
    icon: Shield,
    title: "Discipline under pressure",
    description: `A good trader can stay disciplined when the market is moving against them and take a loss without losing control.`,
  },
  {
    icon: BarChart3,
    title: "Patience before execution",
    description: `A good trader can wait when there is no opportunity and save energy for the setups that actually matter.`,
  },
  {
    icon: GraduationCap,
    title: "Patient. Fearless.",
    description: `Patience to wait for the right opportunity. Fearlessness to execute when the opportunity is there.`,
  },
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
          <div className="absolute right-0 top-24 -z-10 h-80 w-80 rounded-full bg-gold/15 blur-3xl" />
          <div className="absolute left-0 bottom-0 -z-10 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />

          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl text-center">
              <Badge variant="outline" className="glass mb-6 border-primary/40 text-xs uppercase">
                About ZacTrades
              </Badge>
              <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-7xl">
                It started with a <span className="text-gradient-gold">dream</span> and became a
                trading <span className="text-gradient">community.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
                I started trading 6 years ago because I wanted freedom, independence, and the chance
                to build something of my own. ZacTrades is the community I wish I had when I was
                learning the hard way.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  style={{ background: "var(--gradient-primary)" }}
                  className="group h-12 px-7 font-semibold text-primary-foreground glow-primary hover:opacity-90"
                >
                  <a href="/mentorship">
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

        <section className="py-12">
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

        <section className="py-16 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 md:px-6 lg:grid-cols-2">
            {storySections.map((section, index) => (
              <motion.article
                key={section.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: index * 0.06 }}
                className="glass-strong relative overflow-hidden rounded-3xl p-6 md:p-8"
              >
                <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-electric ring-1 ring-primary/30">
                      <section.icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="glass border-gold/40 text-[11px] uppercase">
                      {section.eyebrow}
                    </Badge>
                  </div>
                  <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                    {section.title}
                  </h2>
                  <div className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground md:text-base">
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
              <Badge variant="outline" className="glass mb-4 border-gold/40 text-xs">
                <GraduationCap className="mr-1.5 h-3.5 w-3.5 text-gold" />
                What I Believe
              </Badge>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                A good trader is not defined by one winning day.
              </h2>
              <p className="mt-4 text-muted-foreground md:text-lg">
                A good trader is built through patience, emotional control, risk management, and the
                courage to execute only when the opportunity is there.
              </p>
            </motion.div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {beliefs.map((belief, index) => (
                <motion.div
                  key={belief.title}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: index * 0.06 }}
                  className="rounded-2xl border border-border/50 bg-card/35 p-6"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-electric ring-1 ring-primary/30">
                    <belief.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-display text-xl font-bold">{belief.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {belief.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-20 md:pb-28">
          <div className="mx-auto max-w-5xl px-4 md:px-6">
            <motion.div
              {...fadeUp}
              className="glass-strong relative overflow-hidden rounded-3xl p-7 text-center md:p-10"
            >
              <div className="absolute left-1/2 top-0 -z-10 h-56 w-56 -translate-x-1/2 rounded-full bg-gold/15 blur-3xl" />
              <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-bull/15 text-bull ring-1 ring-bull/30">
                <Check className="h-6 w-6" strokeWidth={3} />
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight md:text-5xl">
                Welcome to ZTC.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Learn real skills. Study the market for yourself. Build knowledge that stays with
                you for life.
              </p>
              <p className="mt-6 font-display text-2xl font-bold text-gradient-gold">
                Learn. Trade. Grow.
              </p>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
