import { motion } from "framer-motion";
import { Instagram, X, Youtube } from "lucide-react";
import type { SVGProps } from "react";

import { BrandLogo } from "@/components/site/BrandLogo";
import { useLanguage, type TranslationKey } from "@/lib/language";
import { fadeUp, staggerContainer } from "@/lib/motion";

function DiscordIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" {...props}>
      <path d="M19.54 5.23a16.9 16.9 0 0 0-4.24-1.31.06.06 0 0 0-.06.03c-.18.32-.38.74-.52 1.07a15.68 15.68 0 0 0-4.72 0c-.14-.33-.35-.75-.53-1.07a.07.07 0 0 0-.06-.03 16.84 16.84 0 0 0-4.24 1.31.06.06 0 0 0-.03.02C2.45 9.27 1.7 13.2 2.06 17.08c0 .02.01.04.03.05a17 17 0 0 0 5.2 2.63.07.07 0 0 0 .08-.02c.4-.55.76-1.13 1.06-1.74a.07.07 0 0 0-.04-.09 11.2 11.2 0 0 1-1.63-.78.07.07 0 0 1-.01-.11l.32-.25a.06.06 0 0 1 .07 0c3.13 1.43 6.52 1.43 9.61 0a.06.06 0 0 1 .07 0l.33.25a.07.07 0 0 1-.01.11c-.52.31-1.06.57-1.63.78a.07.07 0 0 0-.04.09c.31.61.66 1.19 1.06 1.74a.07.07 0 0 0 .08.02 16.95 16.95 0 0 0 5.21-2.63.07.07 0 0 0 .03-.05c.43-4.49-.72-8.39-3.26-11.83a.05.05 0 0 0-.03-.02ZM8.68 14.71c-.94 0-1.72-.86-1.72-1.92s.76-1.92 1.72-1.92c.97 0 1.74.87 1.72 1.92 0 1.06-.76 1.92-1.72 1.92Zm6.64 0c-.94 0-1.72-.86-1.72-1.92s.76-1.92 1.72-1.92c.97 0 1.74.87 1.72 1.92 0 1.06-.75 1.92-1.72 1.92Z" />
    </svg>
  );
}

export function Footer() {
  const { t } = useLanguage();

  const columns = [
    {
      titleKey: "footer.platform",
      links: [
        { labelKey: "footer.liveRoom", href: "/#live" },
        { labelKey: "footer.mentorship", href: "/#mentorship" },
        { labelKey: "footer.indicators", href: "/#indicators" },
        { labelKey: "footer.community", href: "/#testimonials" },
      ],
    },
    {
      titleKey: "footer.company",
      links: [
        { labelKey: "footer.about", href: "/about" },
      ],
    },
    {
      titleKey: "footer.legal",
      links: [
        { labelKey: "footer.privacy", href: "/privacy-policy" },
        { labelKey: "footer.terms", href: "/terms-of-service" },
        { labelKey: "footer.refund", href: "/refund-policy" },
      ],
    },
  ] satisfies Array<{
    titleKey: TranslationKey;
    links: Array<{ labelKey: TranslationKey; href: string }>;
  }>;

  const socials = [
    { label: "YouTube", href: "https://www.youtube.com/@itsZac_Trades", icon: Youtube },
    { label: "X", href: "https://x.com/Zac_Trades", icon: X },
    { label: "Instagram", href: "https://www.instagram.com/itszac_trades/", icon: Instagram },
    { label: "Discord", href: "https://discord.com", icon: DiscordIcon },
  ];

  return (
    <motion.footer
      className="mt-6 border-t border-border/40 bg-card/30 py-8 md:mt-10 md:py-10"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={staggerContainer}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 text-center sm:grid-cols-2 sm:text-left lg:grid-cols-4 lg:gap-10">
          <motion.div className="sm:col-span-2 lg:col-span-1" variants={fadeUp}>
            <div className="flex justify-center sm:justify-start">
              <BrandLogo className="h-14 sm:h-16" showWordmark wordmarkClassName="text-xl sm:text-2xl" />
            </div>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-muted-foreground sm:mx-0 sm:max-w-xs">{t("footer.tagline")}</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              {socials.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="grid h-11 w-11 place-items-center rounded-xl border border-border/50 bg-background/35 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-foreground sm:h-10 sm:w-10"
                  whileHover={{ y: -3, scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 320, damping: 24 }}
                >
                  <social.icon className="h-5 w-5" strokeWidth={2.2} />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {columns.map((col) => (
            <motion.div key={col.titleKey} variants={fadeUp}>
              <h4 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-foreground/90">
                {t(col.titleKey)}
              </h4>
              <ul className="mt-3 flex flex-col items-center gap-1 sm:items-start">
                {col.links.map((link) => (
                  <li key={link.labelKey}>
                    <a
                      href={link.href}
                      className="inline-flex min-h-9 items-center justify-center rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground sm:justify-start sm:px-0 sm:hover:bg-transparent"
                    >
                      {t(link.labelKey)}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-7 grid gap-4 border-t border-border/40 pt-6 text-left md:mt-10 md:grid-cols-2"
          variants={staggerContainer}
        >
          <motion.div
            className="rounded-2xl border border-border/50 bg-background/35 p-4 sm:p-5"
            variants={fadeUp}
          >
            <h4 className="font-display text-sm font-semibold text-foreground">
              {t("footer.disclosureTitle")}
            </h4>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              {t("footer.disclosureBody")}
            </p>
          </motion.div>

          <motion.div
            className="rounded-2xl border border-border/50 bg-background/35 p-4 sm:p-5"
            variants={fadeUp}
          >
            <h4 className="font-display text-sm font-semibold text-foreground">
              {t("footer.disclaimerTitle")}
            </h4>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              {t("footer.disclaimerBody")}
            </p>
          </motion.div>
        </motion.div>

        <motion.div className="mt-7 border-t border-border/40 pt-6 text-center sm:text-left md:mt-8" variants={fadeUp}>
          <p className="text-xs leading-6 text-muted-foreground">
            © {new Date().getFullYear()} ZacTrades. {t("footer.risk")}
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );
}
