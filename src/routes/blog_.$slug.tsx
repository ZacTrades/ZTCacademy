import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CalendarDays,
  Clock,
  FileText,
  Lock,
  LogIn,
  Shield,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AuthDialog } from "@/components/site/AuthDialog";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import {
  defaultBlogPosts,
  fetchBlogPosts,
  type BlogPostRow,
} from "@/components/site/editableContent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/blog_/$slug")({
  head: () => ({
    meta: [
      { title: "Blog Article | ZacTrades" },
      {
        name: "description",
        content: "Read ZacTrades trading notes, education, psychology, and risk management posts.",
      },
    ],
  }),
  component: BlogPostPage,
});

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

function BlogPostPage() {
  const { slug } = Route.useParams();
  const { user, loading: authLoading, isConfigured } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "join">("signin");
  const [blogPosts, setBlogPosts] = useState(defaultBlogPosts);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const posts = getVisibleBlogPosts(blogPosts);
  const post = posts.find((item) => item.slug === slug);

  const openAuth = (mode: "signin" | "join") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  useEffect(() => {
    let mounted = true;

    fetchBlogPosts()
      .then((items) => {
        if (mounted) {
          setBlogPosts(getVisibleBlogPosts(items));
        }
      })
      .catch((error) => {
        console.error(error);
        if (mounted) {
          setBlogPosts(defaultBlogPosts);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoadingPosts(false);
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
        <section className="relative overflow-hidden pt-32 pb-12 md:pt-40 md:pb-16">
          <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
          <div className="grid-bg absolute inset-0 -z-10" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/45 via-background/75 to-background" />

          <div className="mx-auto max-w-4xl px-4 md:px-6">
            <Button asChild variant="outline" className="glass mb-8 border-border/60">
              <a href="/blog">
                <ArrowLeft className="h-4 w-4" />
                Back to blog
              </a>
            </Button>

            {post ? (
              <motion.article {...fadeUp}>
                <Badge variant="outline" className="glass mb-5 border-gold/40 bg-gold/10 text-gold">
                  {post.category}
                </Badge>
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-electric ring-1 ring-primary/30">
                  <PostIcon post={post} className="h-7 w-7" />
                </div>
                <h1 className="mt-7 font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
                  {post.title}
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
                  {post.excerpt}
                </p>
                <PostMeta
                  category={post.category}
                  date={post.published_date}
                  readTime={post.read_time}
                />
              </motion.article>
            ) : loadingPosts ? (
              <motion.div
                {...fadeUp}
                className="rounded-2xl border border-border/60 bg-card/35 p-8"
              >
                <Badge variant="outline" className="glass mb-4 border-primary/40 text-xs">
                  Blog
                </Badge>
                <h1 className="font-display text-4xl font-bold">Loading article</h1>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Opening the full blog post.
                </p>
              </motion.div>
            ) : (
              <motion.div
                {...fadeUp}
                className="rounded-2xl border border-border/60 bg-card/35 p-8"
              >
                <Badge variant="outline" className="glass mb-4 border-primary/40 text-xs">
                  Blog
                </Badge>
                <h1 className="font-display text-4xl font-bold">Post not found</h1>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  This blog post is not available right now. You can return to the blog and choose
                  another article.
                </p>
              </motion.div>
            )}
          </div>
        </section>

        {post && (
          <section className="pb-24">
            <div className="mx-auto max-w-4xl px-4 md:px-6">
              <motion.article
                {...fadeUp}
                className="rounded-3xl border border-border/60 bg-card/35 p-6 shadow-[0_0_90px_-52px_oklch(0.68_0.19_250/0.9)] md:p-10"
              >
                <div className="space-y-6 text-base leading-8 text-muted-foreground md:text-lg md:leading-9">
                  {formatBlogContent(post.content).map((paragraph, index) => (
                    <p key={`${post.slug}-paragraph-${index}`}>{paragraph}</p>
                  ))}
                </div>
              </motion.article>

              {post.pdf_url ? (
                <BlogPdfReader
                  pdfUrl={post.pdf_url}
                  canRead={Boolean(user)}
                  authLoading={authLoading}
                  isConfigured={isConfigured}
                  onSignIn={() => openAuth("signin")}
                  onJoin={() => openAuth("join")}
                />
              ) : null}
            </div>
          </section>
        )}
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

function BlogPdfReader({
  pdfUrl,
  canRead,
  authLoading,
  isConfigured,
  onSignIn,
  onJoin,
}: {
  pdfUrl: string;
  canRead: boolean;
  authLoading: boolean;
  isConfigured: boolean;
  onSignIn: () => void;
  onJoin: () => void;
}) {
  return (
    <motion.section
      {...fadeUp}
      className="mt-6 overflow-hidden rounded-3xl border border-primary/25 bg-card/35 shadow-[0_0_90px_-52px_oklch(0.68_0.19_250/0.9)]"
    >
      <div className="flex flex-col gap-4 border-b border-border/60 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <Badge variant="outline" className="glass border-primary/35 text-electric">
            <FileText className="h-3.5 w-3.5" />
            Attached PDF
          </Badge>
          <h2 className="mt-3 font-display text-2xl font-bold">Read the full PDF lesson</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            The admin attached a PDF to this blog post. Members can read it directly on this page.
          </p>
        </div>

        {canRead ? (
          <Button asChild variant="outline" className="glass border-border/60">
            <a href={pdfUrl} target="_blank" rel="noreferrer">
              Open PDF
            </a>
          </Button>
        ) : null}
      </div>

      {canRead ? (
        <iframe title="Blog PDF" src={pdfUrl} className="h-[72vh] w-full bg-background" />
      ) : (
        <div className="p-6 text-center md:p-10">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-electric ring-1 ring-primary/30">
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="mt-5 font-display text-2xl font-bold">Sign in to read the PDF</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            The article text is available above. Log in to open the attached PDF inside the blog
            page.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              type="button"
              disabled={!isConfigured || authLoading}
              onClick={onSignIn}
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
              onClick={onJoin}
              className="glass border-border/60"
            >
              <UserPlus className="h-4 w-4" />
              Create account
            </Button>
          </div>
        </div>
      )}
    </motion.section>
  );
}

function getVisibleBlogPosts(items: BlogPostRow[]) {
  const visibleItems = items.filter(
    (post) => post.slug && post.title && post.is_published !== false,
  );
  return visibleItems.length ? visibleItems : defaultBlogPosts;
}

function formatBlogContent(content: string) {
  const paragraphs = content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return paragraphs.length
    ? paragraphs
    : ["This article is being prepared and will be expanded soon."];
}

function PostIcon({ post, className }: { post: BlogPostRow; className: string }) {
  const Icon =
    post.category === "Risk Management"
      ? Shield
      : post.category === "Study"
        ? BookOpen
        : post.category === "Market Notes"
          ? BarChart3
          : TrendingUp;

  return <Icon className={className} />;
}

function PostMeta({
  category,
  date,
  readTime,
}: {
  category: string;
  date: string;
  readTime: string;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <span className="font-semibold text-gold">{category}</span>
      <span className="flex items-center gap-1.5">
        <CalendarDays className="h-3.5 w-3.5" />
        {date}
      </span>
      <span className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" />
        {readTime}
      </span>
    </div>
  );
}
