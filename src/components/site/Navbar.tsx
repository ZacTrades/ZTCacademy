import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown, Loader2, LogOut, Menu, MessageCircle, UserRound } from "lucide-react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { useState } from "react";
import { AuthDialog } from "@/components/site/AuthDialog";
import { BrandLogo } from "@/components/site/BrandLogo";
import { useLanguage, type Language, type TranslationKey } from "@/lib/language";
import { mobileMenuVariants, quickSpring } from "@/lib/motion";
import { startDiscordConnection } from "@/lib/discord-server";
import { useAuth } from "@/lib/use-auth";

const links = [
  { labelKey: "nav.liveTrading", href: "/live-trading" },
  { labelKey: "nav.mentorship", href: "/mentorship" },
  { labelKey: "nav.propfirms", href: "/propfirms" },
  { labelKey: "nav.indicator", href: "/indicators" },
  { labelKey: "nav.education", href: "/education" },
  { labelKey: "nav.news", href: "/news" },
] satisfies Array<{ labelKey: TranslationKey; href: string }>;

const isAppRoute = (href: string) => href.startsWith("/") && !href.startsWith("/#");

const languageOptions = [
  { value: "fr", label: "Francais", shortLabel: "FR", flag: "🇫🇷" },
  { value: "en", label: "English", shortLabel: "EN", flag: "🇺🇸" },
] satisfies Array<{ value: Language; label: string; shortLabel: string; flag: string }>;

function LanguageDropdown({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();
  const currentLanguage =
    languageOptions.find((option) => option.value === language) ?? languageOptions[1];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={
            compact
              ? "h-9 px-2 text-xs font-semibold"
              : "border border-border/50 bg-background/30 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
          }
          aria-label={t("nav.languageLabel")}
        >
          <span aria-hidden="true">{currentLanguage.flag}</span>
          <span>{compact ? currentLanguage.shortLabel : currentLanguage.label}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="glass-strong min-w-40 border-border/60 bg-background/95"
      >
        {languageOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className="cursor-pointer gap-3"
            onClick={() => setLanguage(option.value)}
          >
            <span className="text-base" aria-hidden="true">
              {option.flag}
            </span>
            <span className="flex-1">{option.label}</span>
            {language === option.value && <Check className="h-4 w-4 text-gold" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Navbar() {
  const { user, session, loading, isAdmin, isStaff, discordConnection, signOut } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "join">("join");
  const [discordLoading, setDiscordLoading] = useState(false);
  const [discordError, setDiscordError] = useState("");
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    restDelta: 0.001,
  });

  const openAuth = (mode: "signin" | "join") => {
    setAuthMode(mode);
    setAuthOpen(true);
    setOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleConnectDiscord = async () => {
    if (!session?.access_token) return;

    setDiscordLoading(true);
    setDiscordError("");

    try {
      const result = await startDiscordConnection({
        data: {
          accessToken: session.access_token,
          origin: window.location.origin,
        },
      });

      if (result.ok && result.url) {
        window.location.href = result.url;
        return;
      }

      setDiscordError(result.message);
    } catch (error) {
      console.error(error);
      setDiscordError(error instanceof Error ? error.message : "Unable to connect Discord.");
    } finally {
      setDiscordLoading(false);
    }
  };

  const userLabel = user?.user_metadata?.full_name ?? user?.email ?? "Member";

  return (
    <>
      <motion.header
        className="fixed top-0 inset-x-0 z-50"
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={quickSpring}
      >
        <motion.div
          className="absolute left-0 top-0 h-1 w-full origin-left bg-[var(--gradient-primary)] shadow-[0_0_24px_hsl(var(--primary)/0.55)]"
          style={{ scaleX }}
        />
        <div className="mx-auto mt-2 max-w-7xl px-3 md:mt-3 md:px-4">
          <div className="glass-strong flex items-center justify-between gap-3 rounded-2xl px-3 py-2 md:px-6 md:py-2.5 lg:grid lg:grid-cols-[auto_1fr_auto]">
            <Link to="/" className="flex min-w-0 items-center">
              <BrandLogo
                className="h-9 sm:h-10 md:h-11"
                showWordmark
                wordmarkClassName="text-lg sm:text-xl max-[360px]:hidden"
              />
            </Link>

            <nav className="hidden items-center justify-center gap-7 lg:flex">
              {links.map((l) =>
                isAppRoute(l.href) ? (
                  <Link
                    key={l.href}
                    to={l.href}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <motion.span
                      className="inline-block"
                      whileHover={{ y: -2 }}
                      transition={quickSpring}
                    >
                      {t(l.labelKey)}
                    </motion.span>
                  </Link>
                ) : (
                  <a
                    key={l.href}
                    href={l.href}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <motion.span
                      className="inline-block"
                      whileHover={{ y: -2 }}
                      transition={quickSpring}
                    >
                      {t(l.labelKey)}
                    </motion.span>
                  </a>
                ),
              )}
            </nav>

            <div className="flex items-center justify-end gap-2">
              <div className="hidden lg:block">
                <LanguageDropdown />
              </div>
              {user ? (
                <>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="hidden rounded-md border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/15 lg:inline-flex"
                    >
                      {t("nav.admin")}
                    </Link>
                  )}
                  {!isStaff &&
                    (discordConnection?.userId ? (
                      <div className="hidden max-w-44 items-center gap-2 truncate rounded-md border border-[#5865f2]/40 bg-[#5865f2]/10 px-3 py-1.5 text-xs font-semibold text-[#b8c0ff] lg:flex">
                        <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{discordConnection.username}</span>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="hidden border-[#5865f2]/45 bg-[#5865f2]/10 text-xs font-semibold text-[#b8c0ff] hover:bg-[#5865f2]/15 lg:inline-flex"
                        onClick={handleConnectDiscord}
                        disabled={discordLoading}
                        title={discordError || "Connect Discord"}
                      >
                        {discordLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MessageCircle className="h-4 w-4" />
                        )}
                        Connect Discord
                      </Button>
                    ))}
                  <div className="hidden max-w-44 items-center gap-2 truncate rounded-md border border-border/60 bg-background/40 px-3 py-1.5 text-xs font-medium lg:flex">
                    <UserRound className="h-3.5 w-3.5 shrink-0 text-electric" />
                    <span className="truncate">{userLabel}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden lg:inline-flex"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" />
                    {t("nav.signOut")}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden lg:inline-flex"
                    onClick={() => openAuth("signin")}
                    disabled={loading}
                  >
                    {t("nav.signIn")}
                  </Button>
                  <Button
                    size="sm"
                    className="text-primary-foreground glow-primary hover:opacity-90"
                    style={{ background: "var(--gradient-primary)" }}
                    onClick={() => openAuth("join")}
                    disabled={loading}
                  >
                    {t("nav.joinNow")}
                  </Button>
                </>
              )}
              <div className="lg:hidden">
                <LanguageDropdown compact />
              </div>
              <button
                className="p-2 lg:hidden"
                onClick={() => setOpen(!open)}
                aria-label={t("nav.menu")}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
          {discordError && user && !isStaff && (
            <div className="mx-auto mt-2 max-w-xl rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-2 text-center text-xs font-medium text-destructive">
              {discordError}
            </div>
          )}

          <AnimatePresence>
            {open && (
              <motion.div
                className="glass-strong mt-2 rounded-2xl p-4 lg:hidden"
                variants={mobileMenuVariants}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <nav className="flex flex-col gap-3">
                  {links.map((l) =>
                    isAppRoute(l.href) ? (
                      <Link
                        key={l.href}
                        to={l.href}
                        onClick={() => setOpen(false)}
                        className="text-sm font-medium text-muted-foreground hover:text-foreground"
                      >
                        {t(l.labelKey)}
                      </Link>
                    ) : (
                      <a
                        key={l.href}
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className="text-sm font-medium text-muted-foreground hover:text-foreground"
                      >
                        {t(l.labelKey)}
                      </a>
                    ),
                  )}
                  {user ? (
                    <>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setOpen(false)}
                          className="text-sm font-medium text-gold hover:text-gold/90"
                        >
                          {t("nav.admin")}
                        </Link>
                      )}
                      <div className="flex items-center gap-2 rounded-md border border-border/60 bg-background/40 px-3 py-2 text-sm">
                        <UserRound className="h-4 w-4 text-electric" />
                        <span className="truncate">{userLabel}</span>
                      </div>
                      {!isStaff &&
                        (discordConnection?.userId ? (
                          <div className="flex items-center gap-2 rounded-md border border-[#5865f2]/40 bg-[#5865f2]/10 px-3 py-2 text-sm font-semibold text-[#b8c0ff]">
                            <MessageCircle className="h-4 w-4" />
                            <span className="truncate">{discordConnection.username}</span>
                          </div>
                        ) : (
                          <button
                            className="inline-flex items-center gap-2 text-left text-sm font-medium text-[#b8c0ff] hover:text-[#dbe0ff]"
                            onClick={handleConnectDiscord}
                            disabled={discordLoading}
                          >
                            {discordLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MessageCircle className="h-4 w-4" />
                            )}
                            Connect Discord
                          </button>
                        ))}
                      <button
                        className="text-left text-sm font-medium text-muted-foreground hover:text-foreground"
                        onClick={handleSignOut}
                      >
                        {t("nav.signOut")}
                      </button>
                    </>
                  ) : (
                    <button
                      className="text-left text-sm font-medium text-muted-foreground hover:text-foreground"
                      onClick={() => openAuth("signin")}
                      disabled={loading}
                    >
                      {t("nav.signIn")}
                    </button>
                  )}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>
      <AuthDialog
        open={authOpen}
        mode={authMode}
        onOpenChange={setAuthOpen}
        onModeChange={setAuthMode}
      />
    </>
  );
}
