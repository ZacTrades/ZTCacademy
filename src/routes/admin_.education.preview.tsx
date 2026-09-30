import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, CalendarDays, FileDown } from "lucide-react";
import { useEffect, useState } from "react";

import { Navbar } from "@/components/site/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ADMIN_EDUCATION_PREVIEW_STORAGE_KEY,
  educationArticleFromRow,
  type EducationArticle,
  type EducationArticleRow,
} from "@/lib/education-content";
import { ArticleContentBlock, getCategoryLabel } from "@/routes/education_.$slug";

export const Route = createFileRoute("/admin_/education/preview")({
  validateSearch: (search: Record<string, unknown>) => ({
    slug: typeof search.slug === "string" ? search.slug : "",
  }),
  head: () => ({
    meta: [
      { title: "Education Article Preview | ZacTrades Admin" },
      {
        name: "description",
        content: "Preview a ZacTrades education article before publishing.",
      },
    ],
  }),
  component: AdminEducationArticlePreviewPage,
});

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

function AdminEducationArticlePreviewPage() {
  const { slug } = Route.useSearch();
  const [article, setArticle] = useState<EducationArticle | null>(() =>
    readAdminEducationPreviewArticle(slug),
  );

  useEffect(() => {
    setArticle(readAdminEducationPreviewArticle(slug));
  }, [slug]);

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <Navbar />
      <main>
        <section className="relative overflow-hidden pt-32 pb-12 md:pt-40 md:pb-16">
          <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
          <div className="grid-bg absolute inset-0 -z-10 opacity-40" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/35 via-background/75 to-background" />
          <div className="absolute left-1/2 top-24 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />

          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <Button asChild variant="outline" className="glass mb-8 border-border/60">
              <a href="/admin?panel=education">
                <ArrowLeft className="h-4 w-4" />
                Back to admin
              </a>
            </Button>

            {article ? (
              <motion.article {...fadeUp}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="glass border-primary/35 text-electric">
                    {getCategoryLabel(article.category)}
                  </Badge>
                  <Badge variant="outline" className="glass border-gold/35 text-gold">
                    Admin preview
                  </Badge>
                </div>
                <h1 className="mt-6 max-w-5xl font-display text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-7xl">
                  {article.title}
                </h1>
                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground md:text-base">
                  <span className="inline-flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    ZacTrades
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {article.date}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <FileDown className="h-4 w-4" />
                    {article.level === "PDF" ? "PDF" : article.readTime}
                  </span>
                </div>
                <p className="mt-7 max-w-5xl text-base leading-8 text-muted-foreground md:text-xl md:leading-9">
                  {article.description}
                </p>
              </motion.article>
            ) : (
              <motion.div
                {...fadeUp}
                className="rounded-3xl border border-border/60 bg-card/35 p-8"
              >
                <Badge variant="outline" className="glass border-primary/35 text-electric">
                  Admin preview
                </Badge>
                <h1 className="mt-5 font-display text-4xl font-black">Preview not ready</h1>
                <p className="mt-4 text-muted-foreground">
                  Go back to the admin education list and click Preview again.
                </p>
              </motion.div>
            )}
          </div>
        </section>

        {article ? (
          <section className="pb-24">
            <div className="mx-auto max-w-4xl px-4 md:px-6">
              <motion.article {...fadeUp}>
                <div className="space-y-7 text-base leading-8 text-muted-foreground md:text-lg md:leading-9">
                  {article.content.map((block, index) => (
                    <ArticleContentBlock
                      key={article.slug + "-preview-content-" + index}
                      block={block}
                      index={index}
                    />
                  ))}
                </div>
              </motion.article>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function readAdminEducationPreviewArticle(slug: string) {
  if (typeof window === "undefined") return null;

  try {
    const rawArticle = window.localStorage.getItem(ADMIN_EDUCATION_PREVIEW_STORAGE_KEY);
    if (!rawArticle) return null;

    const row = JSON.parse(rawArticle) as EducationArticleRow;
    const routeSlug = safeDecodeSlug(slug);

    if (slug && row.slug !== slug && row.slug !== routeSlug) {
      return null;
    }

    return educationArticleFromRow(row);
  } catch (error) {
    console.error("Unable to read education article preview", error);
    return null;
  }
}

function safeDecodeSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}
