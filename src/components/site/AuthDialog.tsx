import { useState, type FormEvent } from "react";
import { AlertCircle, Check, Loader2, Lock, Mail, Phone, User } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { BrandLogo } from "@/components/site/BrandLogo";
import { useLanguage } from "@/lib/language";
import { useAuth } from "@/lib/use-auth";

type AuthMode = "signin" | "join";

type AuthDialogProps = {
  open: boolean;
  mode: AuthMode;
  onOpenChange: (open: boolean) => void;
  onModeChange: (mode: AuthMode) => void;
};

const countryCodes = [
  { id: "us", flag: "🇺🇸", code: "+1", country: "United States" },
  { id: "ca", flag: "🇨🇦", code: "+1", country: "Canada" },
  { id: "gb", flag: "🇬🇧", code: "+44", country: "United Kingdom" },
  { id: "ma", flag: "🇲🇦", code: "+212", country: "Morocco" },
  { id: "fr", flag: "🇫🇷", code: "+33", country: "France" },
  { id: "es", flag: "🇪🇸", code: "+34", country: "Spain" },
  { id: "de", flag: "🇩🇪", code: "+49", country: "Germany" },
  { id: "it", flag: "🇮🇹", code: "+39", country: "Italy" },
  { id: "ae", flag: "🇦🇪", code: "+971", country: "United Arab Emirates" },
  { id: "sa", flag: "🇸🇦", code: "+966", country: "Saudi Arabia" },
];

export function AuthDialog({ open, mode, onOpenChange, onModeChange }: AuthDialogProps) {
  const { signIn, signUp } = useAuth();
  const { t } = useLanguage();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState("us");

  const isJoin = mode === "join";
  const selectedCountry =
    countryCodes.find((country) => country.id === selectedCountryId) ?? countryCodes[0];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const fullName = String(formData.get("fullName") ?? "").trim();
    const localPhoneNumber = String(formData.get("phoneNumber") ?? "").trim();
    const countryCode = String(formData.get("countryCode") ?? selectedCountry.code).trim();
    const phoneNumber = localPhoneNumber ? `${countryCode} ${localPhoneNumber}` : "";

    try {
      if (isJoin) {
        const result = await signUp({ email, password, fullName, phoneNumber });
        setSuccessMessage(
          result.needsEmailConfirmation ? t("auth.signupConfirm") : t("auth.signupReady"),
        );
      } else {
        await signIn(email, password);
        setSuccessMessage(t("auth.signInSuccess"));
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("auth.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const resetState = () => {
    setSuccessMessage("");
    setErrorMessage("");
    setSubmitting(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value);
        if (!value) setTimeout(resetState, 200);
      }}
    >
      <DialogContent className="glass-strong max-h-[calc(100dvh-1rem)] max-w-md grid-rows-[auto_minmax(0,1fr)] overflow-hidden border-border/60 p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-border/60 p-5 pb-4 sm:p-6 sm:pb-4">
          <BrandLogo className="mb-3 h-20 w-20" />
          <DialogTitle className="font-display text-2xl">
            {isJoin ? t("auth.joinTitle") : t("auth.signInTitle")}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {isJoin ? t("auth.joinDescription") : t("auth.signInDescription")}
          </DialogDescription>
        </DialogHeader>

        {successMessage ? (
          <div className="min-h-0 overflow-y-auto overscroll-contain p-5 text-center sm:p-6">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-bull/15 text-bull">
              <Check className="h-7 w-7" strokeWidth={3} />
            </div>
            <h3 className="mt-4 font-display text-xl font-bold">
              {isJoin ? t("auth.accountCreated") : t("auth.welcomeBack")}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{successMessage}</p>
            <Button
              className="mt-6 w-full font-semibold text-primary-foreground glow-primary hover:opacity-90"
              style={{ background: "var(--gradient-primary)" }}
              onClick={() => onOpenChange(false)}
            >
              {t("auth.continue")}
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="min-h-0 space-y-4 overflow-y-auto overscroll-contain p-5 sm:p-6"
          >
            {isJoin && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="join-name" className="text-xs">
                    {t("auth.fullName")}
                  </Label>
                  <div className="relative mt-1">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="join-name"
                      name="fullName"
                      required
                      placeholder={t("auth.fullNamePlaceholder")}
                      className="bg-background/40 pl-9"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="join-phone" className="text-xs">
                    {t("auth.phoneNumber")}
                  </Label>
                  <div className="mt-1 flex overflow-hidden rounded-md border border-input bg-background/40 shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring">
                    <input type="hidden" name="countryCode" value={selectedCountry.code} />
                    <Select
                      value={selectedCountryId}
                      onValueChange={setSelectedCountryId}
                      disabled={submitting}
                    >
                      <SelectTrigger
                        aria-label="Choose country area code"
                        className="h-9 w-[6.75rem] shrink-0 rounded-none border-0 border-r border-border/60 bg-background/30 shadow-none focus:ring-0"
                      >
                        <span>
                          {selectedCountry.flag} {selectedCountry.code}
                        </span>
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {countryCodes.map((country) => (
                          <SelectItem key={country.id} value={country.id}>
                            {country.flag} {country.code} {country.country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="relative flex-1">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="join-phone"
                        name="phoneNumber"
                        type="tel"
                        required
                        placeholder="555 000 0000"
                        className="border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor={`${mode}-email`} className="text-xs">
                {t("auth.email")}
              </Label>
              <div className="relative mt-1">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={`${mode}-email`}
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="bg-background/40 pl-9"
                  disabled={submitting}
                />
              </div>
            </div>

            <div>
              <Label htmlFor={`${mode}-password`} className="text-xs">
                {t("auth.password")}
              </Label>
              <div className="relative mt-1">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={`${mode}-password`}
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="bg-background/40 pl-9"
                  disabled={submitting}
                />
              </div>
            </div>

            {isJoin && (
              <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                <div className="font-display text-sm font-semibold">{t("auth.includes")}</div>
                <ul className="mt-3 grid gap-2 text-xs text-muted-foreground">
                  {[
                    t("auth.includeLive"),
                    t("auth.includeMentorship"),
                    t("auth.includeIndicators"),
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-bull" strokeWidth={3} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full font-semibold text-primary-foreground glow-primary hover:opacity-90"
              style={{ background: "var(--gradient-primary)" }}
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isJoin ? t("auth.createAccount") : t("auth.signIn")}
            </Button>

            <button
              type="button"
              className="w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => {
                resetState();
                onModeChange(isJoin ? "signin" : "join");
              }}
              disabled={submitting}
            >
              {isJoin ? t("auth.alreadyMember") : t("auth.newHere")}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
