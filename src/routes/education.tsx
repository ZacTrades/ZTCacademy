import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Clock,
  ExternalLink,
  GraduationCap,
  Lock,
  LogIn,
  PlayCircle,
  Search,
  Shield,
  Target,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AuthDialog } from "@/components/site/AuthDialog";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  defaultEducationArticleRows,
  educationArticlePath,
  educationArticlesFromRows,
  fetchEducationArticleRows,
} from "@/lib/education-content";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/use-auth";
import websiteLogoUrl from "@/assets/zactrades-logo4-clean.png";

export const Route = createFileRoute("/education")({
  head: () => ({
    meta: [
      { title: "Education Center | ZacTrades" },
      {
        name: "description",
        content:
          "A simple ZacTrades education center for trading foundations, core concepts, advanced execution, psychology, risk, and downloadable study material.",
      },
      { property: "og:title", content: "Education Center | ZacTrades" },
      {
        property: "og:description",
        content:
          "Search trading lessons, follow structured learning paths, and build a repeatable market routine with ZacTrades.",
      },
    ],
  }),
  component: EducationPage,
});

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const categories = [
  { id: "bootcamp", label: "Bootcamp", icon: GraduationCap },
  { id: "study", label: "Study", icon: BookOpen },
  { id: "psychology", label: "Psychology", icon: Brain },
  { id: "risk", label: "Risk Management", icon: Shield },
  { id: "premium", label: "Premium", icon: Target },
] as const;

type CategoryId = (typeof categories)[number]["id"];

type Lesson = {
  title: string;
  description: string;
  category: CategoryId;
  level: string;
  duration: string;
  access: "Free" | "Members";
  query: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  isLogoThumbnail?: boolean;
  slug?: string;
  articleDate?: string;
};

const lessons: Lesson[] = [
  {
    title: "🚨 بداية الرحلة: تعلم التداول من الصفر بأسلوب Smart Money 💸 | كورس مجاني",
    description: "ZTC Bootcamp playlist lesson from Zac Trades. Opens directly on YouTube.",
    category: "bootcamp",
    level: "ZTC Bootcamp",
    duration: "Start here",
    access: "Free",
    query: "🚨 بداية الرحلة: تعلم التداول من الصفر بأسلوب Smart Money 💸 | كورس مجاني",
    videoUrl: "https://www.youtube.com/watch?v=GtI8UdUiTDc&list=PLrCn8vbtvsZB6hgwypLP6LlrPx3foiEoR",
    thumbnailUrl: "https://i.ytimg.com/vi/GtI8UdUiTDc/hqdefault.jpg",
  },
  {
    title: "ICT BOOTCAMP LESSON 1 : ⏰💰 كتخسر؟ حيت ما فاهمش الوقت و الثمن",
    description: "ZTC Bootcamp playlist lesson from Zac Trades. Opens directly on YouTube.",
    category: "bootcamp",
    level: "ZTC Bootcamp",
    duration: "Lesson 01",
    access: "Free",
    query: "ICT BOOTCAMP LESSON 1 : ⏰💰 كتخسر؟ حيت ما فاهمش الوقت و الثمن",
    videoUrl: "https://www.youtube.com/watch?v=1D6gyAxaCaI&list=PLrCn8vbtvsZB6hgwypLP6LlrPx3foiEoR",
    thumbnailUrl: "https://i.ytimg.com/vi/1D6gyAxaCaI/hqdefault.jpg",
  },
  {
    title: "ICT BOOTCAMP LESSON 2 : 🔐📊📉 البنية ديال السوق هي المفاتح",
    description: "ZTC Bootcamp playlist lesson from Zac Trades. Opens directly on YouTube.",
    category: "bootcamp",
    level: "ZTC Bootcamp",
    duration: "Lesson 02",
    access: "Free",
    query: "ICT BOOTCAMP LESSON 2 : 🔐📊📉 البنية ديال السوق هي المفاتح",
    videoUrl: "https://www.youtube.com/watch?v=eXjp4uuBAoc&list=PLrCn8vbtvsZB6hgwypLP6LlrPx3foiEoR",
    thumbnailUrl: "https://i.ytimg.com/vi/eXjp4uuBAoc/hqdefault.jpg",
  },
  {
    title: "ICT BOOTCAMP LESSON 3 : FVG & IFVG 🔁 هنا فين كيخليو الفلوس قبل ما يرجعو!",
    description: "ZTC Bootcamp playlist lesson from Zac Trades. Opens directly on YouTube.",
    category: "bootcamp",
    level: "ZTC Bootcamp",
    duration: "Lesson 03",
    access: "Free",
    query: "ICT BOOTCAMP LESSON 3 : FVG & IFVG 🔁 هنا فين كيخليو الفلوس قبل ما يرجعو!",
    videoUrl: "https://www.youtube.com/watch?v=FBLDYO5ERh4&list=PLrCn8vbtvsZB6hgwypLP6LlrPx3foiEoR",
    thumbnailUrl: "https://i.ytimg.com/vi/FBLDYO5ERh4/hqdefault.jpg",
  },
  {
    title: "ICT BOOTCAMP LESSON 4: LIQUIDITY ♻️💵 ها هو السر تاع  السيولة",
    description: "ZTC Bootcamp playlist lesson from Zac Trades. Opens directly on YouTube.",
    category: "bootcamp",
    level: "ZTC Bootcamp",
    duration: "Lesson 04",
    access: "Free",
    query: "ICT BOOTCAMP LESSON 4: LIQUIDITY ♻️💵 ها هو السر تاع  السيولة",
    videoUrl: "https://www.youtube.com/watch?v=CFnkrlx8UxQ&list=PLrCn8vbtvsZB6hgwypLP6LlrPx3foiEoR",
    thumbnailUrl: "https://i.ytimg.com/vi/CFnkrlx8UxQ/hqdefault.jpg",
  },
  {
    title: "ICT BOOTCAMP LESSON 5: ORDERBLOCK💵💎 الحيتان كيدخلو من هنا! 🐳",
    description: "ZTC Bootcamp playlist lesson from Zac Trades. Opens directly on YouTube.",
    category: "bootcamp",
    level: "ZTC Bootcamp",
    duration: "Lesson 05",
    access: "Free",
    query: "ICT BOOTCAMP LESSON 5: ORDERBLOCK💵💎 الحيتان كيدخلو من هنا! 🐳",
    videoUrl: "https://www.youtube.com/watch?v=hgjjVs1mS3Y&list=PLrCn8vbtvsZB6hgwypLP6LlrPx3foiEoR",
    thumbnailUrl: "https://i.ytimg.com/vi/hgjjVs1mS3Y/hqdefault.jpg",
  },
  {
    title: "ICT BOOTCAMP LESSON 6 : BREAKER BLOCKS منطقة الانعكاس القاتلة! 🔁",
    description: "ZTC Bootcamp playlist lesson from Zac Trades. Opens directly on YouTube.",
    category: "bootcamp",
    level: "ZTC Bootcamp",
    duration: "Lesson 06",
    access: "Free",
    query: "ICT BOOTCAMP LESSON 6 : BREAKER BLOCKS منطقة الانعكاس القاتلة! 🔁",
    videoUrl: "https://www.youtube.com/watch?v=2cYAGPb6njQ&list=PLrCn8vbtvsZB6hgwypLP6LlrPx3foiEoR",
    thumbnailUrl: "https://i.ytimg.com/vi/2cYAGPb6njQ/hqdefault.jpg",
  },
  {
    title: "ICT BOOTCAMP LESSON 7 : DAILY BIAS  🧭 GPS ديال الترايدر",
    description: "ZTC Bootcamp playlist lesson from Zac Trades. Opens directly on YouTube.",
    category: "bootcamp",
    level: "ZTC Bootcamp",
    duration: "Lesson 07",
    access: "Free",
    query: "ICT BOOTCAMP LESSON 7 : DAILY BIAS  🧭 GPS ديال الترايدر",
    videoUrl: "https://www.youtube.com/watch?v=GbXfp4vKeIE&list=PLrCn8vbtvsZB6hgwypLP6LlrPx3foiEoR",
    thumbnailUrl: "https://i.ytimg.com/vi/GbXfp4vKeIE/hqdefault.jpg",
  },
  {
    title: "ICT BOOTCAMP LESSON 8 : PREMIUM & DISCOUNT 🔄 فين تشري؟ فين تبيع؟ ها الجواب!",
    description: "ZTC Bootcamp playlist lesson from Zac Trades. Opens directly on YouTube.",
    category: "bootcamp",
    level: "ZTC Bootcamp",
    duration: "Lesson 08",
    access: "Free",
    query: "ICT BOOTCAMP LESSON 8 : PREMIUM & DISCOUNT 🔄 فين تشري؟ فين تبيع؟ ها الجواب!",
    videoUrl: "https://www.youtube.com/watch?v=9nNzXY2eOes&list=PLrCn8vbtvsZB6hgwypLP6LlrPx3foiEoR",
    thumbnailUrl: "https://i.ytimg.com/vi/9nNzXY2eOes/hqdefault.jpg",
  },
  {
    title: "ICT BOOTCAMP LESSON 9 : SMT DIVERGENCE 💸كتخسر؟ راك ماشفتيش",
    description: "ZTC Bootcamp playlist lesson from Zac Trades. Opens directly on YouTube.",
    category: "bootcamp",
    level: "ZTC Bootcamp",
    duration: "Lesson 09",
    access: "Free",
    query: "ICT BOOTCAMP LESSON 9 : SMT DIVERGENCE 💸كتخسر؟ راك ماشفتيش",
    videoUrl: "https://www.youtube.com/watch?v=jC3kd_lds4E&list=PLrCn8vbtvsZB6hgwypLP6LlrPx3foiEoR",
    thumbnailUrl: "https://i.ytimg.com/vi/jC3kd_lds4E/hqdefault.jpg",
  },
  {
    title: "ICT BOOTCAMP LESSON 10 : CFDs vs FUTURES 📊 شرح الفرق",
    description: "ZTC Bootcamp playlist lesson from Zac Trades. Opens directly on YouTube.",
    category: "bootcamp",
    level: "ZTC Bootcamp",
    duration: "Lesson 10",
    access: "Free",
    query: "ICT BOOTCAMP LESSON 10 : CFDs vs FUTURES 📊 شرح الفرق",
    videoUrl: "https://www.youtube.com/watch?v=xlP0E228ynU&list=PLrCn8vbtvsZB6hgwypLP6LlrPx3foiEoR",
    thumbnailUrl: "https://i.ytimg.com/vi/xlP0E228ynU/hqdefault.jpg",
  },
  {
    title: "ICT BOOTCAMP LESSON 11: CONTRACT SIZE & LOTSIZE📱كفاش تحسب",
    description: "ZTC Bootcamp playlist lesson from Zac Trades. Opens directly on YouTube.",
    category: "bootcamp",
    level: "ZTC Bootcamp",
    duration: "Lesson 11",
    access: "Free",
    query: "ICT BOOTCAMP LESSON 11: CONTRACT SIZE & LOTSIZE📱كفاش تحسب",
    videoUrl: "https://www.youtube.com/watch?v=pk48X7l6QLo&list=PLrCn8vbtvsZB6hgwypLP6LlrPx3foiEoR",
    thumbnailUrl: "https://i.ytimg.com/vi/pk48X7l6QLo/hqdefault.jpg",
  },
  {
    title: "ICT BOOTCAMP LESSON 12: THE DEALING RANGE 💸📉",
    description: "ZTC Bootcamp playlist lesson from Zac Trades. Opens directly on YouTube.",
    category: "bootcamp",
    level: "ZTC Bootcamp",
    duration: "Lesson 12",
    access: "Free",
    query: "ICT BOOTCAMP LESSON 12: THE DEALING RANGE 💸📉",
    videoUrl: "https://www.youtube.com/watch?v=EdFLn1GaSXs&list=PLrCn8vbtvsZB6hgwypLP6LlrPx3foiEoR",
    thumbnailUrl: "https://i.ytimg.com/vi/EdFLn1GaSXs/hqdefault.jpg",
  },
  {
    title: "ICT BOOTCAMP LESSON 13: OTE FIBONACCI 💎📊",
    description: "ZTC Bootcamp playlist lesson from Zac Trades. Opens directly on YouTube.",
    category: "bootcamp",
    level: "ZTC Bootcamp",
    duration: "Lesson 13",
    access: "Free",
    query: "ICT BOOTCAMP LESSON 13: OTE FIBONACCI 💎📊",
    videoUrl: "https://www.youtube.com/watch?v=i27at63HNdw&list=PLrCn8vbtvsZB6hgwypLP6LlrPx3foiEoR",
    thumbnailUrl: "https://i.ytimg.com/vi/i27at63HNdw/hqdefault.jpg",
  },
  {
    title: "ICT BOOTCAMP LESSON 14: BOS  💸🔥 شرح مبسط",
    description: "ZTC Bootcamp playlist lesson from Zac Trades. Opens directly on YouTube.",
    category: "bootcamp",
    level: "ZTC Bootcamp",
    duration: "Lesson 14",
    access: "Free",
    query: "ICT BOOTCAMP LESSON 14: BOS  💸🔥 شرح مبسط",
    videoUrl: "https://www.youtube.com/watch?v=TMJ8xlRjWy4&list=PLrCn8vbtvsZB6hgwypLP6LlrPx3foiEoR",
    thumbnailUrl: "https://i.ytimg.com/vi/TMJ8xlRjWy4/hqdefault.jpg",
  },
  {
    title: "ICT BOOTCAMP LESSON 15: MSS 💸انقلاب السوق",
    description: "ZTC Bootcamp playlist lesson from Zac Trades. Opens directly on YouTube.",
    category: "bootcamp",
    level: "ZTC Bootcamp",
    duration: "Lesson 15",
    access: "Free",
    query: "ICT BOOTCAMP LESSON 15: MSS 💸انقلاب السوق",
    videoUrl: "https://www.youtube.com/watch?v=Ogc6gLIYH1g&list=PLrCn8vbtvsZB6hgwypLP6LlrPx3foiEoR",
    thumbnailUrl: "https://i.ytimg.com/vi/Ogc6gLIYH1g/hqdefault.jpg",
  },
  {
    title: "ICT BOOTCAMP LESSON 16: CISD 💎📊 أقوى إشارة ديال الدخول",
    description: "ZTC Bootcamp playlist lesson from Zac Trades. Opens directly on YouTube.",
    category: "bootcamp",
    level: "ZTC Bootcamp",
    duration: "Lesson 16",
    access: "Free",
    query: "ICT BOOTCAMP LESSON 16: CISD 💎📊 أقوى إشارة ديال الدخول",
    videoUrl: "https://www.youtube.com/watch?v=TDEOHXoopyo&list=PLrCn8vbtvsZB6hgwypLP6LlrPx3foiEoR",
    thumbnailUrl: "https://i.ytimg.com/vi/TDEOHXoopyo/hqdefault.jpg",
  },
  {
    title: "ICT BOOTCAMP LESSON 17: Trading Asia Range 📈📉 إستراتيجية",
    description: "ZTC Bootcamp playlist lesson from Zac Trades. Opens directly on YouTube.",
    category: "bootcamp",
    level: "ZTC Bootcamp",
    duration: "Lesson 17",
    access: "Free",
    query: "ICT BOOTCAMP LESSON 17: Trading Asia Range 📈📉 إستراتيجية",
    videoUrl: "https://www.youtube.com/watch?v=x89VPk6L-_g&list=PLrCn8vbtvsZB6hgwypLP6LlrPx3foiEoR",
    thumbnailUrl: "https://i.ytimg.com/vi/x89VPk6L-_g/hqdefault.jpg",
  },
  {
    title: "ICT BOOTCAMP LESSON 18: SILVER BULLET  📈💎📉 إستراتيجية",
    description: "ZTC Bootcamp playlist lesson from Zac Trades. Opens directly on YouTube.",
    category: "bootcamp",
    level: "ZTC Bootcamp",
    duration: "Lesson 18",
    access: "Free",
    query: "ICT BOOTCAMP LESSON 18: SILVER BULLET  📈💎📉 إستراتيجية",
    videoUrl: "https://www.youtube.com/watch?v=_nequ6J-2Ms&list=PLrCn8vbtvsZB6hgwypLP6LlrPx3foiEoR",
    thumbnailUrl: "https://i.ytimg.com/vi/_nequ6J-2Ms/hqdefault.jpg",
  },
  {
    title: "ICT BOOTCAMP LESSON 19: ORB Strategy 📊💎📊 إستراتيجية",
    description: "ZTC Bootcamp playlist lesson from Zac Trades. Opens directly on YouTube.",
    category: "bootcamp",
    level: "ZTC Bootcamp",
    duration: "Lesson 19",
    access: "Free",
    query: "ICT BOOTCAMP LESSON 19: ORB Strategy 📊💎📊 إستراتيجية",
    videoUrl: "https://www.youtube.com/watch?v=xQJ0iyb7JRc&list=PLrCn8vbtvsZB6hgwypLP6LlrPx3foiEoR",
    thumbnailUrl: "https://i.ytimg.com/vi/xQJ0iyb7JRc/hqdefault.jpg",
  },
  {
    title: "ICT BOOTCAMP LESSON 20: Risk Management 💰💸📊 إدارة المخاطر",
    description: "ZTC Bootcamp playlist lesson from Zac Trades. Opens directly on YouTube.",
    category: "bootcamp",
    level: "ZTC Bootcamp",
    duration: "Lesson 20",
    access: "Free",
    query: "ICT BOOTCAMP LESSON 20: Risk Management 💰💸📊 إدارة المخاطر",
    videoUrl: "https://www.youtube.com/watch?v=lw0dNcFS3FI&list=PLrCn8vbtvsZB6hgwypLP6LlrPx3foiEoR",
    thumbnailUrl: "https://i.ytimg.com/vi/lw0dNcFS3FI/hqdefault.jpg",
  },
];

function youtubeSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function EducationPage() {
  const { user, loading: authLoading, isConfigured, isStaff } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "join">("signin");
  const [activeCategory, setActiveCategory] = useState<CategoryId>("bootcamp");
  const [searchTerm, setSearchTerm] = useState("");
  const [educationArticleRows, setEducationArticleRows] = useState(defaultEducationArticleRows);
  const [hasPaidEducationAccess, setHasPaidEducationAccess] = useState(false);
  const [paidAccessLoading, setPaidAccessLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    fetchEducationArticleRows()
      .then((rows) => {
        if (mounted) {
          setEducationArticleRows(rows);
        }
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      mounted = false;
    };
  }, []);

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

  const canAccessPaidEducation = Boolean(user && (hasPaidEducationAccess || isStaff));

  const articleLessons = useMemo<Lesson[]>(
    () =>
      educationArticlesFromRows(educationArticleRows).map((article) => {
        const articleThumbnailUrl = article.coverImageUrl?.trim();

        return {
          title: article.title,
          description: article.description,
          category: article.category,
          level: article.level,
          duration: article.readTime,
          access: article.access,
          query: article.title,
          slug: article.slug,
          articleDate: article.date,
          thumbnailUrl: articleThumbnailUrl || websiteLogoUrl,
          isLogoThumbnail: !articleThumbnailUrl,
        };
      }),
    [educationArticleRows],
  );

  const allLessons = useMemo(() => [...lessons, ...articleLessons], [articleLessons]);

  const searchResults = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return [];

    return allLessons.filter((lesson) =>
      [lesson.title, lesson.description, lesson.level, lesson.category, lesson.duration]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [allLessons, searchTerm]);

  const filteredLessons = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return allLessons.filter((lesson) => {
      const matchesCategory = lesson.category === activeCategory;
      const matchesSearch =
        !query ||
        [lesson.title, lesson.description, lesson.level, lesson.category]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, allLessons, searchTerm]);

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <Navbar />
      <main>
        <section className="relative overflow-visible pt-32 pb-10 md:pt-40 md:pb-14">
          <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
          <div className="grid-bg absolute inset-0 -z-10 opacity-45" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/20 via-background/75 to-background" />
          <div className="absolute left-1/2 top-20 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute right-10 top-36 -z-10 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />

          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <motion.div {...fadeUp} className="mx-auto max-w-5xl text-center">
              <h1 className="font-display text-4xl font-black leading-tight tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
                Trading <span className="text-gradient">Education Center</span>
              </h1>
              <p className="mx-auto mt-7 max-w-3xl text-base leading-7 text-muted-foreground md:text-xl">
                The ZacTrades Education Center gives traders a simple path to study market
                concepts, risk, psychology, execution, and premium lessons with more structure and
                less noise.
              </p>
            </motion.div>

            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.08 }}
              className="relative z-20 mx-auto mt-12 max-w-6xl"
            >
              <label className="relative block">
                <Search className="pointer-events-none absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Auto Fill Search..."
                  className="h-16 rounded-full border-primary/55 bg-background/85 pl-14 pr-16 text-base shadow-[0_0_45px_-26px_hsl(var(--primary)/0.95)] backdrop-blur-xl placeholder:text-muted-foreground/80 focus-visible:ring-primary/35"
                />
                {searchTerm ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-bear text-white shadow-[0_0_30px_-12px_hsl(var(--bear)/0.9)] transition hover:scale-105 hover:bg-bear/85"
                    aria-label="Clear education search"
                  >
                    <X className="h-5 w-5" />
                  </button>
                ) : null}
              </label>

              {searchTerm.trim() ? (
                <div className="absolute left-1/2 top-[calc(100%+0.9rem)] z-30 w-[min(100%,76rem)] -translate-x-1/2 overflow-hidden rounded-[1.8rem] border border-border/70 bg-background/95 p-2 shadow-[0_34px_100px_-42px_hsl(var(--primary)/0.95)] backdrop-blur-2xl sm:p-4">
                  {searchResults.length ? (
                    <div className="max-h-[min(76vh,44rem)] overflow-y-auto overscroll-contain pr-1 [scrollbar-color:hsl(var(--primary)/0.6)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary/45 [&::-webkit-scrollbar-track]:bg-transparent">
                      {searchResults.map((lesson) => (
                        <EducationSearchResult
                          key={lesson.category + "-" + lesson.title}
                          lesson={lesson}
                          isSignedIn={Boolean(user)}
                          canAccessPaidEducation={canAccessPaidEducation}
                          onOpenAuth={openAuth}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="px-5 py-8 text-center">
                      <Search className="mx-auto h-7 w-7 text-muted-foreground" />
                      <p className="mt-3 font-semibold text-foreground">No results found</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Try another word like liquidity, risk, psychology, or bootcamp.
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </motion.div>

            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.14 }}
              className="mx-auto mt-12 max-w-6xl"
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {categories.map((category) => {
                  const isActive = activeCategory === category.id;
                  const isPremium = category.id === "premium";
                  const CategoryIcon = category.icon;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setActiveCategory(category.id)}
                      className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-black transition-all md:text-base ${
                        isPremium
                          ? isActive
                            ? "border-gold/70 bg-gold text-background shadow-[0_20px_55px_-28px_hsl(var(--gold)/0.95)]"
                            : "border-gold/45 bg-gold/10 text-gold shadow-[0_16px_42px_-32px_hsl(var(--gold)/0.85)] hover:border-gold/70 hover:bg-gold/15"
                          : isActive
                            ? "border-primary/60 bg-primary/70 text-primary-foreground shadow-[0_18px_45px_-28px_hsl(var(--primary)/0.95)]"
                            : "border-border/55 bg-card/55 text-primary shadow-[0_16px_35px_-32px_hsl(var(--primary)/0.75)] hover:border-primary/45 hover:bg-primary/10 hover:text-foreground"
                      }`}
                    >
                      {isPremium ? <CategoryIcon className="h-4 w-4 shrink-0" /> : null}
                      {category.label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-7 h-px w-full bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
            </motion.div>
          </div>
        </section>

        <section className="pb-24 pt-0">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <motion.div {...fadeUp} className="mb-4 flex justify-end">
              <div className="rounded-2xl border border-border/60 bg-card/40 px-4 py-3 text-sm text-muted-foreground">
                Showing <span className="font-bold text-foreground">{filteredLessons.length}</span> lessons
              </div>
            </motion.div>

            {filteredLessons.length ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredLessons.map((lesson, index) => (
                  <LessonCard
                    key={lesson.title}
                    lesson={lesson}
                    index={index}
                    isSignedIn={Boolean(user)}
                    canAccessPaidEducation={canAccessPaidEducation}
                    authLoading={authLoading || paidAccessLoading}
                    isConfigured={isConfigured}
                    onOpenAuth={openAuth}
                  />
                ))}
              </div>
            ) : (
              <motion.div
                {...fadeUp}
                className="rounded-3xl border border-border/60 bg-card/35 p-10 text-center"
              >
                <Search className="mx-auto h-8 w-8 text-muted-foreground" />
                <h3 className="mt-4 font-display text-2xl font-bold">No lessons found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try another search term or switch back to the full library.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="glass mt-5"
                  onClick={() => {
                    setSearchTerm("");
                    setActiveCategory("bootcamp");
                  }}
                >
                  Reset library
                </Button>
              </motion.div>
            )}
          </div>
        </section>
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

function EducationSearchResult({
  lesson,
  isSignedIn,
  canAccessPaidEducation,
  onOpenAuth,
}: {
  lesson: Lesson;
  isSignedIn: boolean;
  canAccessPaidEducation: boolean;
  onOpenAuth: (mode: "signin" | "join") => void;
}) {
  const category = categories.find((item) => item.id === lesson.category) ?? categories[0];
  const href = lesson.slug ? educationArticlePath(lesson.slug) : lesson.videoUrl ?? youtubeSearchUrl(lesson.query);
  const isExternal = !lesson.slug;
  const isLocked = isPaidEducationLesson(lesson) && !canAccessPaidEducation;

  return (
    <a
      href={isLocked && isSignedIn ? "/mentorship" : href}
      target={isLocked || !isExternal ? undefined : "_blank"}
      rel={isLocked || !isExternal ? undefined : "noreferrer"}
      onClick={(event) => {
        if (!isLocked || isSignedIn) return;
        event.preventDefault();
        onOpenAuth("signin");
      }}
      className={`group grid grid-cols-[6.5rem_minmax(0,1fr)] gap-4 rounded-2xl p-3 transition sm:grid-cols-[9rem_minmax(0,1fr)] sm:p-4 lg:grid-cols-[12rem_minmax(0,1fr)] ${
        isLocked
          ? "border border-gold/25 bg-gold/5 hover:bg-gold/10"
          : "hover:bg-primary/10"
      }`}
    >
      <div className="relative aspect-video overflow-hidden rounded-xl border border-border/55 bg-card/60">
        {lesson.isLogoThumbnail ? (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,hsl(var(--primary)/0.24),transparent_42%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--background)))]" />
        ) : null}
        {lesson.thumbnailUrl ? (
          <img
            src={lesson.thumbnailUrl}
            alt={lesson.title + " thumbnail"}
            className={`relative h-full w-full transition duration-500 group-hover:scale-105 ${
              lesson.isLogoThumbnail ? "object-contain p-5" : "object-cover"
            }`}
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-primary/20 via-card to-gold/10">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
        )}
        {!lesson.slug ? (
          <span className="absolute inset-0 grid place-items-center bg-background/20">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-red-600/90 text-white shadow-[0_0_26px_rgba(239,68,68,0.45)]">
              <PlayCircle className="h-5 w-5" />
            </span>
          </span>
        ) : null}
        {isLocked ? (
          <span className="absolute inset-0 grid place-items-center bg-background/55 backdrop-blur-[2px]">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-gold/40 bg-background/85 text-gold">
              <Lock className="h-4 w-4" />
            </span>
          </span>
        ) : null}
      </div>
      <div className="min-w-0 py-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={
              lesson.category === "premium"
                ? "border-gold/45 bg-gold/10 text-gold"
                : "border-primary/35 bg-primary/10 text-electric"
            }
          >
            {category.label}
          </Badge>
          {isLocked ? (
            <Badge variant="outline" className="border-gold/45 bg-gold/10 text-gold">
              Locked
            </Badge>
          ) : null}
          <span className="text-xs font-semibold text-muted-foreground">{lesson.duration}</span>
        </div>
        <h3
          className={`mt-2 line-clamp-2 font-display text-base font-black leading-tight text-foreground sm:text-lg ${
            isLocked ? "group-hover:text-gold" : "group-hover:text-primary"
          }`}
        >
          {lesson.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
          {lesson.description}
        </p>
        {isLocked ? (
          <p className="mt-2 text-xs font-semibold text-gold">
            {isSignedIn ? "Choose a paid plan to unlock." : "Sign in with a paid account to unlock."}
          </p>
        ) : null}
      </div>
    </a>
  );
}

function LessonCard({
  lesson,
  index,
  isSignedIn,
  canAccessPaidEducation,
  authLoading,
  isConfigured,
  onOpenAuth,
}: {
  lesson: Lesson;
  index: number;
  isSignedIn: boolean;
  canAccessPaidEducation: boolean;
  authLoading: boolean;
  isConfigured: boolean;
  onOpenAuth: (mode: "signin" | "join") => void;
}) {
  const isPaidEducation = isPaidEducationLesson(lesson);
  const isLocked = isPaidEducation && !canAccessPaidEducation;
  const category = categories.find((item) => item.id === lesson.category) ?? categories[0];
  const CategoryIcon = category.icon;
  const articleTone = getArticleTone(lesson.category);
  const articleHref = lesson.slug ? educationArticlePath(lesson.slug) : youtubeSearchUrl(lesson.query);

  if (lesson.thumbnailUrl) {
    const thumbnailHref = lesson.slug ? articleHref : lesson.videoUrl ?? youtubeSearchUrl(lesson.query);
    const thumbnailLabel = lesson.slug ? "Read article" : "Watch now";

    return (
      <motion.article
        {...fadeUp}
        transition={{ ...fadeUp.transition, delay: Math.min(index, 5) * 0.04 }}
        className="group relative flex flex-col gap-4"
      >
        <a
          href={isLocked ? undefined : thumbnailHref}
          target={lesson.slug ? undefined : "_blank"}
          rel={lesson.slug ? undefined : "noreferrer"}
          onClick={(event) => {
            if (!isLocked) return;
            event.preventDefault();
            onOpenAuth("signin");
          }}
          className={`relative block overflow-hidden rounded-2xl border border-white/10 bg-card/40 shadow-[0_24px_70px_-45px_hsl(var(--gold)/0.9)] ring-1 ring-primary/15 transition-all duration-500 ${
            isLocked
              ? "cursor-default"
              : "hover:-translate-y-1 hover:border-gold/45 hover:shadow-[0_28px_80px_-42px_hsl(var(--gold)/0.95)]"
          }`}
          aria-label={thumbnailLabel + " " + lesson.title}
        >
          {lesson.isLogoThumbnail ? (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,hsl(var(--primary)/0.28),transparent_38%),radial-gradient(circle_at_85%_80%,hsl(var(--gold)/0.18),transparent_34%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--background)))]" />
          ) : null}
          <img
            src={lesson.thumbnailUrl}
            alt={lesson.title + " thumbnail"}
            className={`relative aspect-video w-full transition-transform duration-700 group-hover:scale-105 ${
              lesson.isLogoThumbnail ? "object-contain p-10 sm:p-12" : "object-cover"
            }`}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/75 via-background/5 to-transparent" />
          {lesson.slug ? (
            <div className="absolute left-4 top-4 rounded-full border border-primary/25 bg-background/80 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-electric backdrop-blur-md">
              {category.label}
            </div>
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-red-600/90 text-white shadow-[0_0_45px_rgba(239,68,68,0.55)] ring-8 ring-red-500/15 transition-all duration-300 group-hover:scale-110 group-hover:bg-red-500">
                <PlayCircle className="h-10 w-10 fill-white/20" />
              </div>
            </div>
          )}
          {lesson.slug ? (
            <h3 className="absolute bottom-3 left-4 right-4 line-clamp-2 font-display text-base font-black leading-tight text-foreground drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] sm:text-lg">
              {lesson.title}
            </h3>
          ) : null}
          {!lesson.slug ? (
            <div className="absolute bottom-3 right-3 rounded-lg bg-background/85 px-2.5 py-1 font-mono text-xs font-bold text-foreground backdrop-blur-md">
              {lesson.duration}
            </div>
          ) : null}
          {isLocked ? (
            <div className="absolute inset-0 grid place-items-center bg-background/55 p-5 backdrop-blur-[2px]">
              <div className="rounded-2xl border border-gold/35 bg-background/85 px-4 py-3 text-center shadow-[0_20px_60px_-42px_hsl(var(--gold)/0.9)]">
                <Lock className="mx-auto h-5 w-5 text-gold" />
                <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-gold">
                  Paid members only
                </p>
              </div>
            </div>
          ) : null}
        </a>

        {isLocked ? (
          <LockedEducationActions
            isSignedIn={isSignedIn}
            authLoading={authLoading}
            isConfigured={isConfigured}
            onOpenAuth={onOpenAuth}
          />
        ) : (
          <Button
            asChild
            variant="outline"
            className="h-12 w-fit rounded-full border-gold/35 bg-gold/10 px-7 font-black uppercase tracking-[0.12em] text-gold shadow-[0_18px_45px_-34px_hsl(var(--gold)/0.9)] hover:border-gold/60 hover:bg-gold/20 hover:text-gold"
          >
            <a href={thumbnailHref} target={lesson.slug ? undefined : "_blank"} rel={lesson.slug ? undefined : "noreferrer"}>
              {lesson.slug ? <BookOpen className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
              {thumbnailLabel}
            </a>
          </Button>
        )}
      </motion.article>
    );
  }

  return (
    <motion.article
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay: Math.min(index, 5) * 0.04 }}
      className={"group relative overflow-hidden rounded-[1.7rem] border bg-card/45 shadow-[0_24px_65px_-48px_hsl(var(--primary)/0.9)] transition-all duration-500 hover:-translate-y-1 hover:bg-card/65 " + articleTone.border}
    >
      <div className={"relative aspect-[1.55] overflow-hidden bg-gradient-to-br " + articleTone.cover}>
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:46px_46px]" />
        <div className="absolute bottom-9 right-8 flex h-28 w-44 items-end gap-2 opacity-90 sm:w-52">
          {[42, 70, 50, 92, 62, 105, 78].map((height, candleIndex) => (
            <div key={candleIndex} className="relative flex h-full flex-1 items-end justify-center">
              <span className="absolute bottom-0 h-full w-px bg-foreground/25" />
              <span
                className={"relative w-full rounded-sm " + (candleIndex % 3 === 1 ? "bg-bear" : "bg-bull")}
                style={{ height: height + "%" }}
              />
            </div>
          ))}
        </div>
        <div className={"absolute right-6 top-6 grid h-12 w-12 place-items-center rounded-2xl shadow-lg " + articleTone.icon}>
          <CategoryIcon className="h-5 w-5" />
        </div>
      </div>

      <div className="relative flex min-h-[14rem] flex-col p-6">
        <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            {lesson.duration}
          </span>
          <Badge
            className={
              lesson.access === "Free"
                ? "border-bull/30 bg-bull/15 text-bull"
                : "border-gold/30 bg-gold/15 text-gold"
            }
          >
            {lesson.access}
          </Badge>
        </div>
        <h3 className="mt-4 font-display text-2xl font-bold leading-tight text-foreground">
          {lesson.title}
        </h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{lesson.description}</p>

        {isLocked ? (
          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl border border-gold/25 bg-gold/10 px-4 py-3 text-sm text-gold">
              <Lock className="mr-2 inline h-4 w-4" />
              Paid member access is required for this premium article.
            </div>
            <LockedEducationActions
              isSignedIn={isSignedIn}
              authLoading={authLoading}
              isConfigured={isConfigured}
              onOpenAuth={onOpenAuth}
            />
          </div>
        ) : (
          <Button
            asChild
            variant="outline"
            className="mt-6 h-12 rounded-2xl border-border/60 bg-background/45 font-black text-foreground hover:border-primary/45 hover:bg-primary/10 hover:text-foreground"
          >
            <a href={articleHref}>
              Read article
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </motion.article>
  );
}

function LockedEducationActions({
  isSignedIn,
  authLoading,
  isConfigured,
  onOpenAuth,
}: {
  isSignedIn: boolean;
  authLoading: boolean;
  isConfigured: boolean;
  onOpenAuth: (mode: "signin" | "join") => void;
}) {
  if (isSignedIn) {
    return (
      <Button
        asChild
        variant="outline"
        className="h-12 w-fit rounded-full border-gold/45 bg-gold/10 px-7 font-black uppercase tracking-[0.12em] text-gold hover:border-gold/65 hover:bg-gold/20 hover:text-gold"
      >
        <a href="/mentorship">
          <Lock className="h-4 w-4" />
          Choose a plan
        </a>
      </Button>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        type="button"
        onClick={() => onOpenAuth("signin")}
        disabled={!isConfigured || authLoading}
        className="text-primary-foreground glow-primary hover:opacity-90"
        style={{ background: "var(--gradient-primary)" }}
      >
        <LogIn className="h-4 w-4" />
        Sign in
      </Button>
      <Button
        type="button"
        variant="outline"
        className="glass border-border/60"
        onClick={() => onOpenAuth("join")}
        disabled={!isConfigured || authLoading}
      >
        <UserPlus className="h-4 w-4" />
        Join
      </Button>
    </div>
  );
}

function isPaidEducationLesson(lesson: Pick<Lesson, "access" | "category">) {
  return lesson.category === "premium" || lesson.access === "Members";
}

function getArticleTone(category: CategoryId) {
  const tones: Record<CategoryId, { border: string; cover: string; icon: string }> = {
    bootcamp: {
      border: "border-gold/25",
      cover: "from-gold/30 via-primary/20 to-background",
      icon: "bg-gold/20 text-gold ring-1 ring-gold/30",
    },
    study: {
      border: "border-primary/25 hover:border-primary/50",
      cover: "from-sky-300 via-primary/30 to-background",
      icon: "bg-primary/20 text-electric ring-1 ring-primary/30",
    },
    psychology: {
      border: "border-fuchsia-400/20 hover:border-fuchsia-400/45",
      cover: "from-fuchsia-300 via-primary/25 to-background",
      icon: "bg-fuchsia-400/15 text-fuchsia-200 ring-1 ring-fuchsia-300/25",
    },
    risk: {
      border: "border-bull/25 hover:border-bull/45",
      cover: "from-emerald-300 via-bull/25 to-background",
      icon: "bg-bull/15 text-bull ring-1 ring-bull/30",
    },
    premium: {
      border: "border-gold/25 hover:border-gold/50",
      cover: "from-gold/55 via-primary/20 to-background",
      icon: "bg-gold/20 text-gold ring-1 ring-gold/35",
    },
  };

  return tones[category];
}

function getCoverTitle(lesson: Lesson) {
  if (lesson.category === "study") {
    if (lesson.title.includes("Liquidity")) return "Liquidity Map";
    if (lesson.title.includes("Fair")) return "Imbalance";
    if (lesson.title.includes("Backtest")) return "Backtest Rules";
    return "Weekly Review";
  }

  if (lesson.category === "psychology") return "Mindset Reset";
  if (lesson.category === "risk") return "Risk First";

  if (lesson.category === "premium") {
    if (lesson.title.includes("Daily")) return "Daily Bias";
    if (lesson.title.includes("Entry")) return "Entry Model";
    if (lesson.title.includes("Checklist")) return "Checklist";
    return "Trade Recap";
  }

  return "ZTC Study";
}
