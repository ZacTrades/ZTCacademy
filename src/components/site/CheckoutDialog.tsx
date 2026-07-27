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
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthDialog } from "@/components/site/AuthDialog";
import { StaffCheckoutNotice } from "@/components/site/StaffCheckoutNotice";
import { liveTradingPackages, type CheckoutPackage } from "@/components/site/liveTradingPackages";
import {
  startLiveTradingCheckout,
  startMentorshipCheckout,
  startNewsSubscriptionCheckout,
} from "@/lib/payment-server";
import { useAuth } from "@/lib/use-auth";

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
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [statusTitle, setStatusTitle] = useState("Checkout complete");
  const [statusDescription, setStatusDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedPackage, setSelectedPackage] = useState(0);
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [cryptoOption, setCryptoOption] = useState(cryptoPaymentOptions[0]);
  const [cryptoReference, setCryptoReference] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "join">("signin");
  const checkoutPackages = packages.length > 0 ? packages : liveTradingPackages;
  const activePackage = checkoutPackages[selectedPackage] ?? checkoutPackages[0];
  const needsDiscordConnection =
    Boolean(user) &&
    !isStaff &&
    (Boolean(mentorshipPlanSlug) || checkoutKind === "news") &&
    !discordConnection?.userId;

  useEffect(() => {
    if (open) {
      setSelectedPackage(Math.min(initialPackageIndex, checkoutPackages.length - 1));
    }
  }, [checkoutPackages.length, initialPackageIndex, open]);

  useEffect(() => {
    if (open && user?.email) {
      setEmail(user.email);
    }
  }, [open, user?.email]);

  const formatCard = (v: string) =>
    v
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  const formatExp = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (isStaff) {
      setErrorMessage("Checkout is disabled for admin and moderator accounts.");
      return;
    }

    setErrorMessage("");
    setLoading(true);

    const cleanCard = card.replace(/\D/g, "");
    const paymentReference =
      paymentMethod === "card"
        ? cleanCard.slice(-4)
        : `${cryptoOption.label}${cryptoReference.trim() ? ` · ${cryptoReference.trim()}` : ""}`;

    if (paymentMethod === "card" && cleanCard.length < 12) {
      setErrorMessage("Enter a valid card number before continuing.");
      setLoading(false);
      return;
    }

    if (mentorshipPlanSlug) {
      try {
        const result = await startMentorshipCheckout({
          data: {
            accessToken: session?.access_token ?? "",
            planSlug: mentorshipPlanSlug,
            planName,
            packageDuration: activePackage.duration,
            amountLabel: activePackage.price,
            customerEmail: email,
            cardholderName: name,
            paymentMethod,
            paymentReference,
            cryptoAsset: paymentMethod === "crypto" ? cryptoOption.asset : undefined,
            cryptoNetwork: paymentMethod === "crypto" ? cryptoOption.network : undefined,
          },
        });

        if (result.ok && result.status === "already_paid") {
          setStatusTitle("Mentorship already active");
          setStatusDescription(result.message);
          setSuccess(true);
          return;
        }

        if (result.ok && result.status === "local_paid") {
          setStatusTitle("Checkout complete");
          setStatusDescription(result.message);
          setSuccess(true);
          return;
        }

        if (result.ok && result.status === "redirect_required" && result.checkoutUrl) {
          window.open(result.checkoutUrl, "_blank", "noopener,noreferrer");
          setStatusTitle("Secure checkout opened");
          setStatusDescription(
            "Complete payment in the new gateway tab. Your mentorship status will update after confirmation.",
          );
          setSuccess(true);
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
            amountLabel: activePackage.price,
            customerEmail: email,
            cardholderName: name,
            paymentMethod,
            paymentReference,
            cryptoAsset: paymentMethod === "crypto" ? cryptoOption.asset : undefined,
            cryptoNetwork: paymentMethod === "crypto" ? cryptoOption.network : undefined,
          },
        });

        if (result.ok && result.status === "already_paid") {
          setStatusTitle("News access already active");
          setStatusDescription(result.message);
          setSuccess(true);
          return;
        }

        if (result.ok && result.status === "local_paid") {
          setStatusTitle("News access unlocked");
          setStatusDescription(result.message);
          setSuccess(true);
          return;
        }

        if (result.ok && result.status === "redirect_required" && result.checkoutUrl) {
          window.open(result.checkoutUrl, "_blank", "noopener,noreferrer");
          setStatusTitle("Secure checkout opened");
          setStatusDescription(
            "Complete payment in the new gateway tab. Your news access will update after confirmation.",
          );
          setSuccess(true);
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
          packageDuration: activePackage.duration,
          amountLabel: activePackage.price,
          customerEmail: email,
          cardholderName: name,
          paymentMethod,
          paymentReference,
          cryptoAsset: paymentMethod === "crypto" ? cryptoOption.asset : undefined,
          cryptoNetwork: paymentMethod === "crypto" ? cryptoOption.network : undefined,
        },
      });

      if (result.ok && result.status === "already_paid") {
        setStatusTitle("Live trading already active");
        setStatusDescription(result.message);
        setSuccess(true);
        return;
      }

      if (result.ok && result.status === "local_paid") {
        setStatusTitle("Live trading unlocked");
        setStatusDescription(result.message);
        setSuccess(true);
        return;
      }

      if (result.ok && result.status === "redirect_required" && result.checkoutUrl) {
        window.open(result.checkoutUrl, "_blank", "noopener,noreferrer");
        setStatusTitle("Secure checkout opened");
        setStatusDescription(
          "Complete payment in the new gateway tab. Your live trading access will update after confirmation.",
        );
        setSuccess(true);
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
    setCard("");
    setExp("");
    setCvc("");
    setName("");
    setEmail("");
    setPaymentMethod("card");
    setCryptoOption(cryptoPaymentOptions[0]);
    setCryptoReference("");
  };

  const openAuth = (mode: "signin" | "join") => {
    setAuthMode(mode);
    setAuthOpen(true);
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
        <DialogContent className="glass-strong max-h-[calc(100dvh-1.5rem)] max-w-md grid-rows-[auto_minmax(0,1fr)] overflow-hidden border-border/60 p-0 sm:max-w-lg">
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
              <DialogHeader className="shrink-0 border-b border-border/60 p-6 pb-4">
                <DialogTitle className="font-display text-xl">Secure Checkout</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Encrypted payment · Cancel anytime
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 overflow-y-auto overscroll-contain">
                <div className="px-6 pt-4">
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
                      {activePackage.originalPrice && (
                        <div className="font-mono text-sm text-muted-foreground line-through">
                          {activePackage.originalPrice}
                        </div>
                      )}
                      <div className="font-mono text-2xl font-bold text-gradient-gold">
                        {activePackage.price}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {checkoutPackages.map((option, index) => (
                      <button
                        key={option.duration}
                        type="button"
                        onClick={() => setSelectedPackage(index)}
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
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="font-mono text-lg font-bold">{option.price}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <ul className="mt-3 grid gap-1.5">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="h-3 w-3 text-bull" strokeWidth={3} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                {needsDiscordConnection && (
                  <div className="mt-3 rounded-xl border border-[#5865f2]/35 bg-[#5865f2]/10 p-3 text-xs leading-5 text-[#c8ceff]">
                    Connect Discord from the header before paying if you want automatic server
                    invite and role access after checkout.
                  </div>
                )}
              </div>

              {!user ? (
                <div className="p-6">
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
                <div className="p-6">
                  <StaffCheckoutNotice description="Admins and moderators cannot buy mentorship, coaching, live trading, or paid subscriptions from the client checkout. Use a regular member account to test purchases." />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 p-6">
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
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="mt-1 bg-background/40"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="name" className="text-xs">
                        {paymentMethod === "card" ? "Cardholder name" : "Billing name"}
                      </Label>
                      <Input
                        id="name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={
                          paymentMethod === "card" ? "Full name on card" : "Billing full name"
                        }
                        className="mt-1 bg-background/40"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Label className="text-xs">Payment method</Label>
                      <div className="mt-1 grid grid-cols-2 gap-2">
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

                    {paymentMethod === "card" ? (
                      <>
                        <div className="sm:col-span-2">
                          <Label htmlFor="card" className="text-xs">
                            Card number
                          </Label>
                          <div className="relative mt-1">
                            <CreditCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="card"
                              required
                              inputMode="numeric"
                              value={card}
                              onChange={(e) => setCard(formatCard(e.target.value))}
                              placeholder="1234 5678 9012 3456"
                              className="bg-background/40 pl-9 font-mono tracking-wider"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="exp" className="text-xs">
                            Expiry
                          </Label>
                          <Input
                            id="exp"
                            required
                            inputMode="numeric"
                            value={exp}
                            onChange={(e) => setExp(formatExp(e.target.value))}
                            placeholder="MM/YY"
                            className="mt-1 bg-background/40 font-mono"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvc" className="text-xs">
                            CVC
                          </Label>
                          <div className="relative mt-1">
                            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="cvc"
                              required
                              inputMode="numeric"
                              maxLength={4}
                              value={cvc}
                              onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))}
                              placeholder="123"
                              className="bg-background/40 pl-9 font-mono"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="sm:col-span-2 rounded-xl border border-gold/30 bg-gold/10 p-4">
                        <Label htmlFor="crypto-network" className="text-xs">
                          Crypto asset / network
                        </Label>
                        <select
                          id="crypto-network"
                          value={`${cryptoOption.asset}:${cryptoOption.network}`}
                          onChange={(event) => {
                            const nextOption =
                              cryptoPaymentOptions.find(
                                (option) =>
                                  `${option.asset}:${option.network}` === event.target.value,
                              ) ?? cryptoPaymentOptions[0];
                            setCryptoOption(nextOption);
                          }}
                          className="mt-1 h-10 w-full rounded-md border border-border/60 bg-background/55 px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                        >
                          {cryptoPaymentOptions.map((option) => (
                            <option
                              key={`${option.asset}:${option.network}`}
                              value={`${option.asset}:${option.network}`}
                            >
                              {option.label}
                            </option>
                          ))}
                        </select>

                        <Label htmlFor="crypto-reference" className="mt-3 block text-xs">
                          Transaction reference optional
                        </Label>
                        <Input
                          id="crypto-reference"
                          value={cryptoReference}
                          onChange={(e) => setCryptoReference(e.target.value)}
                          placeholder="Transaction hash or gateway reference"
                          className="mt-1 bg-background/55 font-mono text-xs"
                        />
                        <p className="mt-3 text-xs leading-5 text-muted-foreground">
                          Crypto checkout will be routed through the secure payment gateway once it
                          is connected. In local test mode, this records crypto as the selected
                          payment method.
                        </p>
                      </div>
                    )}
                  </div>

                  {errorMessage && (
                    <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs leading-5 text-destructive">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      {errorMessage}
                    </div>
                  )}

                  <div className="sticky bottom-0 -mx-6 mt-2 border-t border-border/60 bg-background/95 px-6 py-4 backdrop-blur-xl">
                    <Button
                      type="submit"
                      disabled={loading}
                      size="lg"
                      className="h-auto min-h-12 w-full whitespace-normal px-4 py-3 text-center text-sm font-semibold leading-tight text-primary-foreground glow-primary hover:opacity-90 sm:text-base"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      <span className="block w-full">
                        {loading
                          ? "Processing…"
                          : paymentMethod === "crypto"
                            ? `Pay ${activePackage.price} with Crypto`
                            : `Pay ${activePackage.price} & Get Access`}
                      </span>
                    </Button>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-bull" />
                    {paymentMethod === "card"
                      ? "Secured with 256-bit SSL encryption · PCI DSS compliant"
                      : "Crypto checkout metadata is encrypted and recorded securely"}
                  </div>
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
