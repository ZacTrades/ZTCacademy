import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { fadeUp, staggerContainer } from "@/lib/motion";

type LegalSection = {
  title: string;
  body: string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  lastUpdated?: string;
  sections: LegalSection[];
};

export function LegalPage({
  eyebrow,
  title,
  intro,
  lastUpdated = "May 27, 2026",
  sections,
}: LegalPageProps) {
  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <Navbar />
      <main>
        <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-20">
          <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
          <div className="grid-bg absolute inset-0 -z-10" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/75 to-background" />

          <motion.div
            className="mx-auto max-w-4xl px-4 md:px-6"
            initial="hidden"
            animate="show"
            variants={fadeUp}
          >
            <Badge variant="outline" className="glass mb-5 border-primary/40 text-xs">
              {eyebrow}
            </Badge>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-7xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              {intro}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">Last updated: {lastUpdated}</p>
          </motion.div>
        </section>

        <section className="pb-20">
          <motion.div
            className="mx-auto max-w-4xl space-y-10 px-4 md:px-6"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            {sections.map((section) => (
              <motion.article
                key={section.title}
                className="border-b border-border/35 pb-10 last:border-b-0"
                variants={fadeUp}
              >
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground md:text-base md:leading-8">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </motion.article>
            ))}
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
