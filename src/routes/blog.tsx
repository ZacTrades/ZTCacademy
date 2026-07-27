import { Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  Clock,
  Mail,
  Shield,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import {
  defaultBlogPosts,
  fetchBlogPosts,
  type BlogPostRow,
} from "@/components/site/editableContent";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog | ZacTrades" },
      {
        name: "description",
        content:
          "Read ZacTrades market notes, trading psychology lessons, risk management tips, and education updates.",
      },
      { property: "og:title", content: "Blog | ZacTrades" },
      {
        property: "og:description",
        content: "Market notes, trade lessons, and trading education from ZacTrades.",
      },
    ],
  }),
  component: BlogPage,
});

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const categories = ["Market Notes", "Risk Management", "Psychology", "Study", "Trading Process"];

function BlogPage() {
  const [blogPosts, setBlogPosts] = useState(defaultBlogPosts);
  const visibleBlogPosts = getVisibleBlogPosts(blogPosts);
  const featuredPost = visibleBlogPosts.find((post) => post.is_featured) ?? visibleBlogPosts[0];
  const posts = visibleBlogPosts.filter((post) => post.slug !== featuredPost.slug);

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
      });

    return () => {
      mounted = false;
    };
  }, []);

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
                ZacTrades Blog
              </Badge>
              <h1 className="font-display text-5xl font-bold leading-tight tracking-tight md:text-7xl">
                Market lessons for <span className="text-gradient">serious traders.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Notes on trading process, risk management, psychology, and the habits that help
                traders stay disciplined when markets get loud.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="pb-20">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 md:px-6 lg:grid-cols-[1.45fr_0.75fr]">
            <motion.article
              {...fadeUp}
              className="glass-strong relative overflow-hidden rounded-2xl p-6 md:p-8"
            >
              <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
              <div className="relative">
                <Badge variant="outline" className="mb-5 border-gold/40 bg-gold/10 text-gold">
                  Featured
                </Badge>
                <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary/15 text-electric ring-1 ring-primary/30">
                  <PostIcon post={featuredPost} className="h-6 w-6" />
                </div>
                <h2 className="mt-6 font-display text-3xl font-bold tracking-tight md:text-5xl">
                  {featuredPost.title}
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                  {featuredPost.excerpt}
                </p>
                <PostMeta
                  category={featuredPost.category}
                  date={featuredPost.published_date}
                  readTime={featuredPost.read_time}
                />
                <Button
                  asChild
                  className="mt-7 text-primary-foreground glow-primary hover:opacity-90"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Link to="/blog/$slug" params={{ slug: featuredPost.slug }}>
                    Read more
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.article>

            <motion.aside
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.08 }}
              className="rounded-2xl border border-border/50 bg-card/35 p-5"
            >
              <h2 className="font-display text-xl font-bold">Categories</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full border border-border/60 bg-background/45 px-3 py-1.5 text-xs font-medium text-muted-foreground"
                  >
                    {category}
                  </span>
                ))}
              </div>

              <div className="mt-8 rounded-xl border border-gold/30 bg-gold/10 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gold">
                  <Mail className="h-4 w-4" />
                  Weekly newsletter
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Get market notes, trade recaps, and education updates from ZacTrades.
                </p>
                <Button asChild variant="outline" className="glass mt-4 w-full border-gold/40">
                  <a href="/#newsletter">Join ZTC newsletter</a>
                </Button>
              </div>
            </motion.aside>
          </div>
        </section>

        <section className="pb-24">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <motion.div {...fadeUp} className="mb-10">
              <Badge variant="outline" className="glass mb-4 border-primary/40 text-xs">
                Latest posts
              </Badge>
              <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
                Recent trading notes
              </h2>
            </motion.div>

            <div className="grid gap-5 md:grid-cols-3">
              {posts.map((post, index) => (
                <motion.article
                  key={post.title}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: index * 0.06 }}
                  className="group rounded-2xl border border-border/50 bg-card/35 p-5 transition-all hover:-translate-y-1 hover:border-primary/40"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-electric ring-1 ring-primary/30">
                    <PostIcon post={post} className="h-5 w-5" />
                  </div>
                  <PostMeta
                    category={post.category}
                    date={post.published_date}
                    readTime={post.read_time}
                  />
                  <h3 className="mt-4 font-display text-xl font-bold leading-tight">
                    {post.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
                  <Link
                    to="/blog/$slug"
                    params={{ slug: post.slug }}
                    className="mt-5 flex items-center gap-1 text-xs font-semibold text-electric transition-colors hover:text-primary"
                  >
                    Read more
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function getVisibleBlogPosts(items: BlogPostRow[]) {
  const visibleItems = items.filter((post) => post.slug && post.title && post.is_published !== false);
  return visibleItems.length ? visibleItems : defaultBlogPosts;
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
