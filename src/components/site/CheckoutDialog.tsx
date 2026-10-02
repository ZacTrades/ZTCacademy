import { useEffect, useState, type FormEvent } from "react";
import {
  CreditCard,
  Lock,
  Check,
  ShieldCheck,
  LogIn,
  UserPlus,
  AlertCircle,
  Wallet,
  BadgePercent,
  Loader2,
  MessageCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthDialog } from "@/components/site/AuthDialog";
import { StaffCheckoutNotice } from "@/components/site/StaffCheckoutNotice";
import { liveTradingPackages, type CheckoutPackage } from "@/components/site/liveTradingPackages";
import payzoneSecureCheckoutImage from "@/assets/payzone-secure-checkout.svg";
import {
  previewDiscountCode,
  startLiveTradingCheckout,
  startMentorshipCheckout,
  startNewsSubscriptionCheckout,
} from "@/lib/payment-server";
import { formatPriceForCurrency, useCurrency } from "@/lib/currency";
import { useAuth } from "@/lib/use-auth";
import { startDiscordConnection } from "@/lib/discord-server";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mentorshipPlanSlug?: "one_to_one" | "group";
  checkoutKind?: "live" | "mentorship" | "news";
  planName?: string;
  features?: string[];
  initialPackageIndex?: number;
  packages?: CheckoutPackage[];
};

type PaymentMethod = "card" | "crypto";

type AppliedDiscountPreview = {
  code: string;
  originalAmountLabel: string;
  discountAmountLabel: string;
  discountedAmountLabel: string;
  message: string;
};

const cryptoPaymentOptions = [
  { asset: "USDT", network: "TRC20", label: "USDT TRC20" },
  { asset: "USDT", network: "ERC20", label: "USDT ERC20" },
  { asset: "BTC", network: "Bitcoin", label: "Bitcoin" },
  { asset: "ETH", network: "Ethereum", label: "Ethereum" },
];

export function CheckoutDialog({
  open,
  onOpenChange,
  mentorshipPlanSlug,
  checkoutKind = "live",
  planName = "Live Trading Room — Pro",
  initialPackageIndex = 0,
  features = [
    "Live trading every day",
    "Daily and weekly market analysis",
    "Pre-market live prep",
    "Q&A access",
    "Extra psychology talks",
    "Exclusive Discord community",
  ],
  packages = liveTradingPackages,
}: Props) {
  const { user, session, isStaff, discordConnection } = useAuth();
  const { currency, formatPrice } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [statusTitle, setStatusTitle] = useState("Checkout complete");
  const [statusDescription, setStatusDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedPackage, setSelectedPackage] = useState(0);
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [cryptoOption, setCryptoOption] = useState(cryptoPaymentOptions[0]);
  const [discountCode, setDiscountCode] = useState("");
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountMessage, setDiscountMessage] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscountPreview | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const [discordError, setDiscordError] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "join">("signin");
  const checkoutPackages = packages.length > 0 ? packages : liveTradingPackages;
  const activePackage = checkoutPackages[selectedPackage] ?? checkoutPackages[0];
  const payablePriceLabel = appliedDiscount?.discountedAmountLabel ?? activePackage.price;
  const formatCheckoutPrice = (priceLabel?: string | null) =>
    paymentMethod === "crypto"
      ? formatPriceForCurrency(priceLabel, "USD")
      : formatPrice(priceLabel);
  const customerEmail = user?.email ?? email;
  const billingName =
    String(user?.user_metadata?.full_name ?? "").trim() ||
    customerEmail.split("@")[0] ||
    "ZacTrades member";
  const needsDiscordConnection = Boolean(user) && !isStaff && !discordConnection?.userId;

  useEffect(() => {
    if (open) {
      setSelectedPackage(Math.min(initialPackageIndex, checkoutPackages.length - 1));
      setAppliedDiscount(null);
      setDiscountMessage("");
    }
  }, [checkoutPackages.length, initialPackageIndex, open]);

  useEffect(() => {
    if (open && user?.email) {
      setEmail(user.email);
    }
  }, [open, user?.email]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (isStaff) {
      setErrorMessage("Checkout is disabled for admin and moderator accounts.");
      return;
    }

    setErrorMessage("");

    if (needsDiscordConnection) {
      setErrorMessage(
        "Connect Discord before paying so we can invite you and assign the correct access role automatically.",
      );
      return;
    }

    if (!customerEmail) {
      setErrorMessage("Your account email is required before continuing.");
      return;
    }

    if (discountCode.trim() && !appliedDiscount) {
      setErrorMessage("Click Apply discount before paying so we can verify the code.");
      return;
    }

    if (!acceptedTerms) {
      setErrorMessage("Please accept the terms and policies before continuing.");
      return;
    }

    setLoading(true);

    if (mentorshipPlanSlug) {
      try {
        const result = await startMentorshipCheckout({
          data: {
            accessToken: session?.access_token ?? "",
            planSlug: mentorshipPlanSlug,
            customerEmail,
            cardholderName: billingName,
            paymentMethod,
            currency,
            cryptoAsset: paymentMethod === "crypto" ? cryptoOption.asset : undefined,
            cryptoNetwork: paymentMethod === "crypto" ? cryptoOption.network : undefined,
            discountCode: appliedDiscount?.code,
          },
        });

        if (result.ok && result.status === "already_paid") {
          setStatusTitle("Mentorship already active");
          setStatusDescription(result.message);
          setSuccess(true);
          return;
        }
        if (result.ok && result.status === "redirect_required" && result.checkoutUrl) {
          window.location.assign(result.checkoutUrl);
          return;
        }

        setErrorMessage(result.message);
      } catch (error) {
        console.error(error);
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to start mentorship checkout.",
        );
      } finally {
        setLoading(false);
      }

      return;
    }

    if (checkoutKind === "news") {
      try {
        const result = await startNewsSubscriptionCheckout({
          data: {
            accessToken: session?.access_token ?? "",
            customerEmail,
            cardholderName: billingName,
            paymentMethod,
            currency,
            cryptoAsset: paymentMethod === "crypto" ? cryptoOption.asset : undefined,
            cryptoNetwork: paymentMethod === "crypto" ? cryptoOption.network : undefined,
            discountCode: appliedDiscount?.code,
          },
        });

        if (result.ok && result.status === "already_paid") {
          setStatusTitle("News access already active");
          setStatusDescription(result.message);
          setSuccess(true);
          return;
        }
        if (result.ok && result.status === "redirect_required" && result.checkoutUrl) {
          window.location.assign(result.checkoutUrl);
          return;
        }

        setErrorMessage(result.message);
      } catch (error) {
        console.error(error);
        setErrorMessage(error instanceof Error ? error.message : "Unable to start news checkout.");
      } finally {
        setLoading(false);
      }

      return;
    }

    try {
      const result = await startLiveTradingCheckout({
        data: {
          accessToken: session?.access_token ?? "",
          packageSlug:
            (activePackage.slug as "one_month" | "three_months" | "six_months" | "twelve_months") ??
            "one_month",
          customerEmail,
          cardholderName: billingName,
          paymentMethod,
          currency,
          cryptoAsset: paymentMethod === "crypto" ? cryptoOption.asset : undefined,
          cryptoNetwork: paymentMethod === "crypto" ? cryptoOption.network : undefined,
          discountCode: appliedDiscount?.code,
        },
      });

      if (result.ok && result.status === "already_paid") {
        setStatusTitle("Live trading already active");
        setStatusDescription(result.message);
        setSuccess(true);
        return;
      }
      if (result.ok && result.status === "redirect_required" && result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }

      setErrorMessage(result.message);
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Unable to start live checkout.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSuccess(false);
    setStatusTitle("Checkout complete");
    setStatusDescription("");
    setErrorMessage("");
    setSelectedPackage(Math.min(initialPackageIndex, checkoutPackages.length - 1));
    setEmail("");
    setPaymentMethod("card");
    setCryptoOption(cryptoPaymentOptions[0]);
    setDiscountCode("");
    setDiscountLoading(false);
    setDiscountMessage("");
    setAppliedDiscount(null);
    setAcceptedTerms(false);
  };

  const handleDiscountInputChange = (value: string) => {
    setDiscountCode(value.toUpperCase().replace(/\s+/g, ""));
    setAppliedDiscount(null);
    setDiscountMessage("");
  };

  const handleApplyDiscount = async () => {
    if (!user) return;

    const code = discountCode.trim();
    if (!code) {
      setDiscountMessage("Enter a discount code first.");
      setAppliedDiscount(null);
      return;
    }

    setDiscountLoading(true);
    setDiscountMessage("");
    setErrorMessage("");

    try {
      const result = await previewDiscountCode({
        data: {
          accessToken: session?.access_token ?? "",
          checkoutKind: mentorshipPlanSlug ? "mentorship" : checkoutKind,
          packageSlug:
            !mentorshipPlanSlug && checkoutKind === "live"
              ? (activePackage.slug as
                  | "one_month"
                  | "three_months"
                  | "six_months"
                  | "twelve_months")
              : undefined,
          planSlug: mentorshipPlanSlug,
          discountCode: code,
        },
      });

      if (result.ok && result.status === "discount_applied") {
        setAppliedDiscount({
          code: result.code,
          originalAmountLabel: result.originalAmountLabel,
          discountAmountLabel: result.discountAmountLabel,
          discountedAmountLabel: result.discountedAmountLabel,
          message: result.message,
        });
        setDiscountCode(result.code);
        setDiscountMessage(result.message);
        return;
      }

      setAppliedDiscount(null);
      setDiscountMessage(result.message || "This discount code could not be applied.");
    } catch (error) {
      console.error(error);
      setAppliedDiscount(null);
      setDiscountMessage(error instanceof Error ? error.message : "Unable to apply discount code.");
    } finally {
      setDiscountLoading(false);
    }
  };

  const openAuth = (mode: "signin" | "join") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const handleConnectDiscord = async () => {
    if (!session?.access_token) return;

    setDiscordLoading(true);
    setDiscordError("");
    setErrorMessage("");

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

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          onOpenChange(v);
          if (!v) setTimeout(reset, 200);
        }}
      >
        <DialogContent className="glass-strong max-h-[calc(100dvh-1rem)] max-w-md grid-rows-[auto_minmax(0,1fr)] overflow-hidden border-border/60 p-0 sm:max-w-4xl">
          {success ? (
            <div className="p-8 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-bull/15 text-bull">
                <Check className="h-7 w-7" strokeWidth={3} />
              </div>
              <h3 className="mt-4 font-display text-2xl font-bold">{statusTitle}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{statusDescription}</p>
              <Button
                className="mt-6 w-full bg-[var(--gradient-primary)] glow-primary hover:opacity-90"
                onClick={() => onOpenChange(false)}
              >
                Continue
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader className="shrink-0 border-b border-border/60 p-5 pb-4 sm:px-6 sm:py-4">
                <DialogTitle className="font-display text-xl">Secure Checkout</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Encrypted Payment • Instant Premium Access
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 overflow-y-auto overscroll-contain sm:grid sm:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] sm:items-start sm:gap-5 sm:p-5 lg:p-6">
                <div className="px-5 pt-4 sm:px-0 sm:pt-0">
                  <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">
                          Plan
                        </div>
                        <div className="font-display text-base font-semibold">{planName}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {activePackage.duration} access
                        </div>
                      </div>
                      <div className="text-right">
                        {activePackage.badge && (
                          <div className="mb-1 inline-flex rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold">
                            {activePackage.badge}
                          </div>
                        )}
                        {appliedDiscount ? (
                          <div className="font-mono text-sm text-muted-foreground line-through">
                            {formatCheckoutPrice(appliedDiscount.originalAmountLabel)}
                          </div>
                        ) : activePackage.originalPrice ? (
                          <div className="font-mono text-xs font-semibold text-bull">
                            You save {formatCheckoutPrice(activePackage.originalPrice)}
                          </div>
                        ) : null}
                        <div className="font-mono text-2xl font-bold text-gradient-gold">
                          {formatCheckoutPrice(payablePriceLabel)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {checkoutPackages.map((option, index) => (
                        <button
                          key={option.duration}
                          type="button"
                          onClick={() => {
                            setSelectedPackage(index);
                            setAppliedDiscount(null);
                            setDiscountMessage("");
                          }}
                          className={`rounded-lg border p-3 text-left transition-all ${
                            selectedPackage === index
                              ? "border-gold/60 bg-gold/10 ring-1 ring-gold/30"
                              : "border-border/60 bg-background/40 hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold">{option.duration}</span>
                            {option.badge && (
                              <span className="rounded-full bg-bull/15 px-2 py-0.5 text-[10px] font-semibold text-bull">
                                {option.badge}
                              </span>
                            )}
                          </div>
                          <div className="mt-2">
                            {option.originalPrice && (
                              <span className="mb-0.5 block font-mono text-[11px] font-semibold text-bull">
                                You save {formatCheckoutPrice(option.originalPrice)}
                              </span>
                            )}
                            <span className="font-mono text-lg font-bold">
                              {formatCheckoutPrice(option.price)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                    <ul className="mt-3 grid gap-1.5">
                      {features.map((f) => (
                        <li
                          key={f}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                          <Check className="h-3 w-3 text-bull" strokeWidth={3} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {needsDiscordConnection ? (
                    <div className="mt-3 rounded-xl border border-[#5865f2]/40 bg-[#5865f2]/10 p-4 shadow-[0_0_34px_rgba(88,101,242,0.12)]">
                      <div className="flex items-start gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#5865f2]/20 text-[#c8ceff]">
                          <MessageCircle className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-sm font-semibold text-foreground">
                            Connect Discord to unlock checkout
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[#c8ceff]/90">
                            Payment opens only after Discord is connected, so your invite and paid
                            role can be assigned automatically after purchase.
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            className="mt-3 border-[#5865f2]/50 bg-[#5865f2]/20 text-[#dbe0ff] hover:bg-[#5865f2]/30"
                            variant="outline"
                            onClick={handleConnectDiscord}
                            disabled={discordLoading}
                          >
                            {discordLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MessageCircle className="h-4 w-4" />
                            )}
                            Connect Discord
                          </Button>
                          {discordError && (
                            <p className="mt-2 text-xs leading-5 text-destructive">
                              {discordError}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : user && !isStaff && discordConnection?.userId ? (
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-bull/25 bg-bull/10 p-3 text-xs font-medium text-bull">
                      <Check className="h-4 w-4" strokeWidth={3} />
                      Discord connected. Checkout is ready.
                    </div>
                  ) : null}
                </div>

                {!user ? (
                  <div className="p-5 sm:p-0">
                    <div className="rounded-xl border border-primary/30 bg-primary/10 p-5 text-center">
                      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-electric">
                        <Lock className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 font-display text-lg font-bold">Login required</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Please sign in or create an account before continuing to secure checkout.
                      </p>
                      <div className="mt-5 grid gap-2 sm:grid-cols-2">
                        <Button
                          type="button"
                          className="text-primary-foreground glow-primary hover:opacity-90"
                          style={{ background: "var(--gradient-primary)" }}
                          onClick={() => openAuth("signin")}
                        >
                          <LogIn className="h-4 w-4" />
                          Sign in
                        </Button>
                        <Button type="button" variant="outline" onClick={() => openAuth("join")}>
                          <UserPlus className="h-4 w-4" />
                          Create account
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : isStaff ? (
                  <div className="p-5 sm:p-0">
                    <StaffCheckoutNotice description="Admins and moderators cannot buy mentorship, coaching, live trading, or paid subscriptions from the client checkout. Use a regular member account to test purchases." />
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4 p-5 sm:p-0">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Label htmlFor="email" className="text-xs">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={email}
                          readOnly
                          aria-readonly="true"
                          placeholder="Account email"
                          className="mt-1 cursor-not-allowed bg-background/35 text-muted-foreground"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Label className="text-xs">Payment method</Label>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {[
                            { value: "card" as const, label: "Card", icon: CreditCard },
                            { value: "crypto" as const, label: "Crypto", icon: Wallet },
                          ].map((option) => {
                            const Icon = option.icon;
                            const active = paymentMethod === option.value;

                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setPaymentMethod(option.value)}
                                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
                                  active
                                    ? "border-gold/60 bg-gold/10 text-gold ring-1 ring-gold/30"
                                    : "border-border/60 bg-background/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {paymentMethod === "crypto" && (
                        <div className="sm:col-span-2 rounded-xl border border-gold/30 bg-gold/10 p-4">
                          <div className="mb-4 rounded-lg border border-primary/20 bg-background/45 px-4 py-3 text-center shadow-inner shadow-primary/5">
                            <p className="text-xs font-medium uppercase tracking-[0.28em] text-primary/80">
                              Pay in crypto with
                            </p>
                            <p className="mt-1 text-xl font-bold text-foreground">
                              <span className="text-primary">NOW</span>Payments
                            </p>
                          </div>
                          <p className="mt-3 text-xs leading-5 text-muted-foreground">
                            You will be redirected to NOWPayments. Choose or confirm the final coin
                            and network on their secure invoice page. Payment is confirmed only by a
                            verified NOWPayments IPN webhook.
                          </p>
                        </div>
                      )}

                      <div className="sm:col-span-2 rounded-xl border border-border/60 bg-background/35 p-3">
                        <Label htmlFor="discount-code" className="text-xs">
                          Discount code
                        </Label>
                        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                          <div className="relative">
                            <BadgePercent className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="discount-code"
                              value={discountCode}
                              onChange={(event) => handleDiscountInputChange(event.target.value)}
                              placeholder="Enter code"
                              className="bg-background/45 pl-9 uppercase"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={discountLoading || !discountCode.trim()}
                            onClick={handleApplyDiscount}
                            className="border-primary/40 bg-primary/10 text-primary hover:bg-primary/15"
                          >
                            {discountLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <BadgePercent className="h-4 w-4" />
                            )}
                            Apply
                          </Button>
                        </div>
                        {discountMessage && (
                          <p
                            className={`mt-2 text-xs leading-5 ${
                              appliedDiscount ? "text-bull" : "text-muted-foreground"
                            }`}
                          >
                            {discountMessage}
                          </p>
                        )}
                        {appliedDiscount && (
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-bull/30 bg-bull/10 px-3 py-2 text-xs text-bull">
                            <span>Discount applied: {appliedDiscount.code}</span>
                            <span>
                              -{formatCheckoutPrice(appliedDiscount.discountAmountLabel)} | Total{" "}
                              {formatCheckoutPrice(appliedDiscount.discountedAmountLabel)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {errorMessage && (
                      <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs leading-5 text-destructive">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        {errorMessage}
                      </div>
                    )}

                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-background/35 p-3 text-xs leading-5 text-muted-foreground">
                      <Checkbox
                        checked={acceptedTerms}
                        onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                        className="mt-0.5"
                        aria-label="Accept terms and policies"
                      />
                      <span>
                        I accept the{" "}
                        <a
                          href="/terms-of-service"
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-primary hover:text-primary/80"
                        >
                          Terms of Service
                        </a>
                        ,{" "}
                        <a
                          href="/privacy-policy"
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-primary hover:text-primary/80"
                        >
                          Privacy Policy
                        </a>
                        , and{" "}
                        <a
                          href="/refund-policy"
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-primary hover:text-primary/80"
                        >
                          Refund Policy
                        </a>
                        .
                      </span>
                    </label>

                    <div className="sticky bottom-0 -mx-5 mt-2 border-t border-border/60 bg-background/95 px-5 py-4 backdrop-blur-xl sm:static sm:mx-0 sm:border-t-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-0">
                      <Button
                        type="submit"
                        disabled={loading || !acceptedTerms || needsDiscordConnection}
                        size="lg"
                        className="h-auto min-h-12 w-full whitespace-normal px-4 py-3 text-center text-sm font-semibold leading-tight text-primary-foreground glow-primary hover:opacity-90 sm:text-base"
                        style={{ background: "var(--gradient-primary)" }}
                      >
                        <span className="block w-full">
                          {loading
                            ? "Processing…"
                            : needsDiscordConnection
                              ? "Connect Discord to Pay"
                              : paymentMethod === "crypto"
                                ? `Pay ${formatCheckoutPrice(payablePriceLabel)} with NOWPayments`
                                : `Pay ${formatCheckoutPrice(payablePriceLabel)} & Get Access`}
                        </span>
                      </Button>
                    </div>

                    {paymentMethod === "card" ? (
                      <div className="flex justify-center">
                        <img
                          src={payzoneSecureCheckoutImage}
                          alt="Ce site web est securise 3D Secure avec Payzone, Visa et Mastercard"
                          className="h-auto w-full max-w-[520px] rounded-xl border border-border/50 bg-white p-2 shadow-[0_18px_60px_-46px_hsl(var(--primary)/0.7)]"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="h-3.5 w-3.5 text-bull" />
                          Secured crypto checkout by NOWPayments
                        </span>
                      </div>
                    )}
                  </form>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <AuthDialog
        open={authOpen}
        mode={authMode}
        onOpenChange={setAuthOpen}
        onModeChange={setAuthMode}
      />
    </>
  );
}
