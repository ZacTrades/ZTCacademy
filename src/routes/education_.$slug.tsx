import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  FileDown,
  Lock,
  Loader2,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AuthDialog } from "@/components/site/AuthDialog";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ADMIN_EDUCATION_PREVIEW_STORAGE_KEY,
  defaultEducationArticleRows,
  educationArticleFromRow,
  educationArticlesFromRows,
  fetchEducationArticleRows,
  type EducationArticle,
  type EducationArticleRow,
} from "@/lib/education-content";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/education_/$slug")({
  validateSearch: (search: Record<string, unknown>) => ({
    preview: search.preview === "admin" ? ("admin" as const) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Education Article | ZacTrades" },
      {
        name: "description",
        content:
          "Read ZacTrades education articles about trading study, psychology, risk, and execution.",
      },
    ],
  }),
  component: EducationArticlePage,
});

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

function EducationArticlePage() {
  const { slug } = Route.useParams();
  const { preview } = Route.useSearch();
  const isAdminPreview = preview === "admin";
  const [articles, setArticles] = useState(() =>
    educationArticlesFromRows(defaultEducationArticleRows),
  );
  const [articlesLoading, setArticlesLoading] = useState(true);
  const { user, loading: authLoading, isConfigured, isAdmin, isStaff } = useAuth();
  const routeSlug = safeDecodeSlug(slug);
  const article = articles.find((item) => item.slug === slug || item.slug === routeSlug);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "join">("signin");
  const [hasPaidEducationAccess, setHasPaidEducationAccess] = useState(false);
  const [paidAccessLoading, setPaidAccessLoading] = useState(false);
  const isPaidArticle = article ? isPaidEducationArticle(article) : false;
  const canAccessPaidEducation = Boolean(user && (hasPaidEducationAccess || isStaff));
  const isCheckingPaidAccess = Boolean(
    isPaidArticle && (authLoading || (user && !isStaff && paidAccessLoading)),
  );
  const isLocked = Boolean(isPaidArticle && !canAccessPaidEducation);

  useEffect(() => {
    let mounted = true;

    if (isAdminPreview) {
      const previewArticle = readAdminEducationPreviewArticle(slug);

      if (previewArticle) {
        setArticles([previewArticle]);
        setArticlesLoading(false);
        return () => {
          mounted = false;
        };
      }
    }

    if (authLoading) return;

    setArticlesLoading(true);

    fetchEducationArticleRows({ includeUnpublished: isAdminPreview && isAdmin })
      .then((rows) => {
        if (mounted) {
          setArticles(educationArticlesFromRows(rows));
          setArticlesLoading(false);
        }
      })
      .catch((error) => {
        console.error(error);
        if (mounted) {
          setArticlesLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [authLoading, isAdmin, isAdminPreview, slug]);

  const openAuth = (mode: "signin" | "join") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  useEffect(() => {
    if (!supabase || !user || isStaff) {
      setHasPaidEducationAccess(false);
      setPaidAccessLoading(false);
      return;
    }

    let mounted = true;
    setPaidAccessLoading(true);

    supabase
      .rpc("current_user_has_paid_access")
      .then(({ data, error }) => {
        if (!mounted) return;

        if (error) {
          console.error(error);
          setHasPaidEducationAccess(false);
          return;
        }

        setHasPaidEducationAccess(Boolean(data));
      })
      .finally(() => {
        if (mounted) setPaidAccessLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user?.id, isStaff]);

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
              <a href="/education">
                <ArrowLeft className="h-4 w-4" />
                Back to education
              </a>
            </Button>

            {article ? (
              <motion.article {...fadeUp}>
                <Badge variant="outline" className="glass border-primary/35 text-electric">
                  {getCategoryLabel(article.category)}
                </Badge>
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

                <SocialShareButtons article={article} />
              </motion.article>
            ) : articlesLoading ? (
              <motion.div
                {...fadeUp}
                className="rounded-3xl border border-border/60 bg-card/35 p-8"
              >
                <Badge variant="outline" className="glass border-primary/35 text-electric">
                  Education
                </Badge>
                <h1 className="mt-5 font-display text-4xl font-black">Loading article</h1>
                <p className="mt-4 text-muted-foreground">
                  We are fetching the latest lesson content.
                </p>
              </motion.div>
            ) : (
              <motion.div
                {...fadeUp}
                className="rounded-3xl border border-border/60 bg-card/35 p-8"
              >
                <Badge variant="outline" className="glass border-primary/35 text-electric">
                  Education
                </Badge>
                <h1 className="mt-5 font-display text-4xl font-black">Article not found</h1>
                <p className="mt-4 text-muted-foreground">
                  This lesson is not available right now. Go back and choose another article.
                </p>
              </motion.div>
            )}
          </div>
        </section>

        {article ? (
          <section className="pb-24">
            <div className="mx-auto max-w-4xl px-4 md:px-6">
              {isCheckingPaidAccess ? (
                <motion.div
                  {...fadeUp}
                  className="rounded-3xl border border-primary/25 bg-card/35 p-8 text-center md:p-10"
                >
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  <h2 className="mt-5 font-display text-3xl font-black">Checking access</h2>
                  <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                    Verifying your paid ZacTrades access before opening this premium article.
                  </p>
                </motion.div>
              ) : isLocked ? (
                <motion.div
                  {...fadeUp}
                  className="rounded-3xl border border-gold/25 bg-gold/10 p-8 text-center shadow-[0_0_80px_-54px_hsl(var(--gold)/0.9)] md:p-10"
                >
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gold/15 text-gold ring-1 ring-gold/30">
                    <Lock className="h-7 w-7" />
                  </div>
                  <h2 className="mt-6 font-display text-3xl font-black">Premium article locked</h2>
                  <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                    This article is available only to users with active paid ZacTrades access.
                  </p>
                  {user ? (
                    <Button
                      asChild
                      variant="outline"
                      className="mt-7 border-gold/45 bg-gold/10 text-gold hover:bg-gold/20 hover:text-gold"
                    >
                      <a href="/mentorship">
                        <Lock className="h-4 w-4" />
                        Choose a plan
                      </a>
                    </Button>
                  ) : (
                    <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                      <Button
                        type="button"
                        disabled={!isConfigured || authLoading}
                        onClick={() => openAuth("signin")}
                        className="text-primary-foreground glow-primary hover:opacity-90"
                        style={{ background: "var(--gradient-primary)" }}
                      >
                        <LogIn className="h-4 w-4" />
                        Sign in
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!isConfigured || authLoading}
                        onClick={() => openAuth("join")}
                        className="glass border-border/60"
                      >
                        <UserPlus className="h-4 w-4" />
                        Create account
                      </Button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.article {...fadeUp}>
                  <div className="space-y-7 text-base leading-8 text-muted-foreground md:text-lg md:leading-9">
                    {article.content.map((block, index) => (
                      <ArticleContentBlock
                        key={article.slug + "-content-" + index}
                        block={block}
                        index={index}
                      />
                    ))}
                  </div>
                </motion.article>
              )}
            </div>
          </section>
        ) : null}
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

export function getCategoryLabel(category: EducationArticle["category"]) {
  const labels = {
    study: "Study",
    psychology: "Psychology",
    risk: "Risk Management",
    premium: "Premium",
  };

  return labels[category];
}

function isPaidEducationArticle(article: Pick<EducationArticle, "access" | "category">) {
  return article.category === "premium" || article.access === "Members";
}

function readAdminEducationPreviewArticle(slug: string) {
  if (typeof window === "undefined") return null;

  try {
    const rawArticle = window.localStorage.getItem(ADMIN_EDUCATION_PREVIEW_STORAGE_KEY);
    if (!rawArticle) return null;

    const row = JSON.parse(rawArticle) as EducationArticleRow;
    const routeSlug = safeDecodeSlug(slug);

    if (row.slug !== slug && row.slug !== routeSlug) {
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

function SocialShareButtons({ article }: { article: EducationArticle }) {
  const articleUrl = `https://www.zactrades.com/education/${article.slug}`;
  const encodedUrl = encodeURIComponent(articleUrl);
  const encodedTitle = encodeURIComponent(article.title);
  const encodedTelegramText = encodeURIComponent(`${article.title} ${articleUrl}`);

  const shareLinks = [
    {
      label: "Facebook",
      icon: <FacebookIcon />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
    },
    {
      label: "Telegram",
      icon: <TelegramIcon />,
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTelegramText}`,
    },
    {
      label: "X",
      icon: <XIcon />,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
  ];

  return (
    <div className="mt-8 flex gap-3" aria-label="Share this article">
      {shareLinks.map((network) => (
        <a
          key={network.label}
          href={network.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${network.label}`}
          className="grid h-11 w-11 place-items-center rounded-xl border border-border/60 bg-card/60 text-foreground shadow-[0_18px_45px_-34px_hsl(var(--primary)/0.8)] transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/10 hover:text-electric"
        >
          {network.icon}
        </a>
      ))}
    </div>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M14 8.2V6.7c0-.7.5-.9.9-.9h2.3V2.1L14 2c-3.5 0-4.4 2.7-4.4 4.4v1.8H7v3.9h2.6V22H14v-9.9h3l.5-3.9H14Z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M21.7 4.4 18.5 19c-.2 1-.8 1.2-1.6.8l-4.8-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.9 8.9-8c.4-.3-.1-.5-.6-.2L6.4 12.8 1.7 11.3c-1-.3-1-1 .2-1.5L20.3 2.7c.9-.3 1.7.2 1.4 1.7Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M18.9 2h3.3l-7.3 8.3L23.5 22h-6.7l-5.3-6.9L5.5 22H2.2l7.8-8.9L1.8 2h6.9l4.7 6.2L18.9 2Zm-1.2 17.9h1.8L7.7 4H5.8l11.9 15.9Z" />
    </svg>
  );
}

export function ArticleContentBlock({ block, index }: { block: string; index: number }) {
  const trimmed = block.trim();

  if (isRichHtmlContent(trimmed)) {
    return (
      <div
        className="rich-article-content text-base leading-8 text-muted-foreground md:text-lg md:leading-9 [&>*+*]:mt-5 [&_p+p]:!mt-1 [&_a]:text-electric [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-5 [&_blockquote]:text-foreground [&_h1]:font-display [&_h1]:text-4xl [&_h1]:font-black [&_h1]:leading-tight [&_h1]:text-foreground [&_h2]:pt-4 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:font-black [&_h2]:leading-tight [&_h2]:text-foreground md:[&_h2]:text-4xl [&_h3]:font-display [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:text-foreground [&_iframe]:aspect-video [&_iframe]:h-auto [&_iframe]:w-full [&_iframe]:rounded-3xl [&_iframe]:border [&_iframe]:border-primary/25 [&_iframe]:shadow-[0_24px_90px_-62px_hsl(var(--primary)/0.9)] [&_img]:my-7 [&_img]:max-h-[720px] [&_img]:w-full [&_img]:rounded-3xl [&_img]:object-cover [&_img]:shadow-[0_24px_90px_-62px_hsl(var(--primary)/0.9)] [&_li]:ml-6 [&_ol]:list-decimal [&_ul]:list-disc"
        dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(trimmed) }}
      />
    );
  }
  const imageBlock = parseMediaBlock(trimmed, "image");
  const youtubeBlock = parseMediaBlock(trimmed, "youtube");

  if (youtubeBlock) {
    const videoId = getYouTubeVideoId(youtubeBlock.url);

    if (!videoId) {
      return <p className="text-bear">This YouTube URL could not be loaded.</p>;
    }

    return (
      <div className="overflow-hidden rounded-3xl border border-primary/25 bg-background/60 shadow-[0_24px_90px_-62px_hsl(var(--primary)/0.9)]">
        <div className="aspect-video">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}`}
            title={youtubeBlock.caption || `Education video ${index + 1}`}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        {youtubeBlock.caption ? (
          <p className="border-t border-border/45 px-5 py-3 text-sm text-muted-foreground">
            {youtubeBlock.caption}
          </p>
        ) : null}
      </div>
    );
  }

  if (imageBlock && isSafeMediaUrl(imageBlock.url)) {
    return (
      <figure className="overflow-hidden rounded-3xl border border-border/60 bg-background/60 shadow-[0_24px_90px_-62px_hsl(var(--primary)/0.9)]">
        <img
          src={imageBlock.url}
          alt={imageBlock.caption || `Education article image ${index + 1}`}
          loading="lazy"
          className="max-h-[720px] w-full object-cover"
        />
        {imageBlock.caption ? (
          <figcaption className="border-t border-border/45 px-5 py-3 text-sm text-muted-foreground">
            {imageBlock.caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  if (trimmed.startsWith("## ")) {
    return (
      <h2 className="pt-4 font-display text-3xl font-black leading-tight text-foreground md:text-4xl">
        {trimmed.replace(/^##\s+/, "")}
      </h2>
    );
  }

  const lines = trimmed
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const isList = lines.length > 1 && lines.every((line) => line.startsWith("- "));

  if (isList) {
    return (
      <ul className="space-y-3">
        {lines.map((line) => (
          <li key={line} className="flex gap-3">
            <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-primary" />
            <span>{line.replace(/^-\s+/, "")}</span>
          </li>
        ))}
      </ul>
    );
  }

  return <p>{trimmed}</p>;
}

function isRichHtmlContent(content: string) {
  return /<\/?(?:p|h[1-6]|ul|ol|li|strong|em|u|a|img|blockquote|iframe|div|span|br)\b/i.test(
    content,
  );
}

const allowedArticleTags = new Set([
  "a",
  "blockquote",
  "br",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "iframe",
  "img",
  "li",
  "ol",
  "p",
  "span",
  "strong",
  "u",
  "ul",
]);

const voidArticleTags = new Set(["br", "img"]);

function sanitizeArticleHtml(html: string) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?([a-z][a-z0-9-]*)(\s[^<>]*)?>/gi, (match, rawTag, rawAttributes = "") => {
      const tag = rawTag.toLowerCase();

      if (!allowedArticleTags.has(tag)) return "";
      if (match.startsWith("</")) return voidArticleTags.has(tag) ? "" : `</${tag}>`;

      const attributes = sanitizeArticleAttributes(tag, rawAttributes);
      return `<${tag}${attributes ? ` ${attributes}` : ""}${voidArticleTags.has(tag) ? "" : ""}>`;
    });
}

function sanitizeArticleAttributes(tag: string, rawAttributes: string) {
  const safeAttributes: string[] = [];
  const attributePattern = /([^\s=/<>`]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g;
  let match: RegExpExecArray | null;

  while ((match = attributePattern.exec(rawAttributes))) {
    const name = match[1].toLowerCase();
    const rawValue = match[2] ?? "";
    const value = unquoteAttribute(rawValue);

    if (name.startsWith("on") || name === "srcdoc") continue;

    if (name === "style") {
      const safeStyle = sanitizeArticleStyle(value);
      if (safeStyle) safeAttributes.push(`style="${escapeHtmlAttribute(safeStyle)}"`);
      continue;
    }

    if (tag === "a" && name === "href" && isSafeArticleLink(value)) {
      safeAttributes.push(`href="${escapeHtmlAttribute(value)}"`);
      safeAttributes.push(`rel="noopener noreferrer"`);
      safeAttributes.push(`target="_blank"`);
      continue;
    }

    if (tag === "img" && name === "src" && isSafeArticleMediaUrl(value)) {
      safeAttributes.push(`src="${escapeHtmlAttribute(value)}"`);
      continue;
    }

    if (tag === "img" && name === "alt") {
      safeAttributes.push(`alt="${escapeHtmlAttribute(value.slice(0, 180))}"`);
      continue;
    }

    if (tag === "img" && name === "loading" && value === "lazy") {
      safeAttributes.push(`loading="lazy"`);
      continue;
    }

    if (tag === "iframe" && name === "src" && isSafeArticleIframeUrl(value)) {
      safeAttributes.push(`src="${escapeHtmlAttribute(value)}"`);
      continue;
    }

    if (tag === "iframe" && name === "title") {
      safeAttributes.push(`title="${escapeHtmlAttribute(value.slice(0, 180))}"`);
      continue;
    }

    if (tag === "iframe" && name === "allow") {
      safeAttributes.push(`allow="${escapeHtmlAttribute(sanitizeAllowAttribute(value))}"`);
      continue;
    }

    if (tag === "iframe" && name === "allowfullscreen") {
      safeAttributes.push("allowfullscreen");
      continue;
    }

    if (["p", "h1", "h2", "h3", "h4", "h5", "h6"].includes(tag) && name === "align") {
      const align = value.toLowerCase();
      if (["left", "center", "right", "justify"].includes(align)) {
        safeAttributes.push(`align="${align}"`);
      }
    }
  }

  return [...new Set(safeAttributes)].join(" ");
}

function unquoteAttribute(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function sanitizeArticleStyle(style: string) {
  const safeDeclarations: string[] = [];

  for (const declaration of style.split(";")) {
    const [rawProperty, ...rawValueParts] = declaration.split(":");
    const property = rawProperty?.trim().toLowerCase();
    const value = rawValueParts.join(":").trim();

    if (!property || !value) continue;

    if (property === "text-align" && /^(left|center|right|justify)$/i.test(value)) {
      safeDeclarations.push(`text-align: ${value.toLowerCase()}`);
    }

    if (property === "color" && /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i.test(value)) {
      safeDeclarations.push(`color: ${value}`);
    }

    if (
      property === "font-family" &&
      /^(Inter|Space Grotesk|Georgia|JetBrains Mono)(,\s*(sans-serif|serif|monospace))?$/i.test(
        value,
      )
    ) {
      safeDeclarations.push(`font-family: ${value}`);
    }
  }

  return safeDeclarations.join("; ");
}

function isSafeArticleLink(url: string) {
  if (url.startsWith("#") || url.startsWith("/")) return true;

  try {
    const parsed = new URL(url);
    return ["https:", "mailto:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function isSafeArticleMediaUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isSafeArticleIframeUrl(url: string) {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "www.youtube-nocookie.com" || parsed.hostname === "www.youtube.com") &&
      parsed.pathname.startsWith("/embed/")
    );
  } catch {
    return false;
  }
}

function sanitizeAllowAttribute(value: string) {
  return value.replace(/[^\w\s;:-]/g, "").slice(0, 240);
}

function escapeHtmlAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function parseMediaBlock(block: string, type: "image" | "youtube") {
  const prefix = `[${type}:`;

  if (!block.startsWith(prefix) || !block.endsWith("]")) {
    return null;
  }

  const rawValue = block.slice(prefix.length, -1).trim();
  const [rawUrl, ...captionParts] = rawValue.split("|");
  const url = rawUrl.trim();

  if (!isSafeMediaUrl(url)) {
    return null;
  }

  return {
    url,
    caption: captionParts.join("|").trim(),
  };
}

function getYouTubeVideoId(url: string) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "").trim();
    }

    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/embed/")[1]?.split("/")[0] ?? "";
      }

      return parsed.searchParams.get("v") ?? "";
    }
  } catch {
    return "";
  }

  return "";
}

function isSafeMediaUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}
