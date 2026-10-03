/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "en" | "fr";

const en = {
  "nav.liveTrading": "Live Trading",
  "nav.mentorship": "Mentorship",
  "nav.propfirms": "Propfirms",
  "nav.indicator": "Indicator",
  "nav.education": "Education",
  "nav.news": "News",
  "nav.admin": "Admin",
  "nav.signIn": "Sign in",
  "nav.joinNow": "Join Now",
  "nav.signOut": "Sign out",
  "nav.menu": "Menu",
  "nav.languageLabel": "Language",
  "nav.languageShort": "FR",
  "nav.languageButton": "Francais",

  "footer.tagline": "The professionals trading ecosystem for traders who refuse to stay average.",
  "footer.platform": "Platform",
  "footer.company": "Company",
  "footer.legal": "Legal",
  "footer.liveRoom": "Live Room",
  "footer.mentorship": "Mentorship",
  "footer.indicators": "Indicators",
  "footer.community": "Testimonials",
  "footer.about": "About",
  "footer.privacy": "Privacy Policy",
  "footer.terms": "Terms of Service",
  "footer.refund": "Refund Policy",
  "footer.disclosureTitle": "Disclosure",
  "footer.disclosureBody":
    "ZacTrades may receive compensation from partner links, promotions, or featured platforms. Any partnerships do not affect our educational content, market commentary, or community guidance.",
  "footer.disclaimerTitle": "Disclaimer",
  "footer.disclaimerBody":
    "Trading futures, forex, crypto, and other financial markets involves substantial risk. Content provided by ZacTrades is for education only and should not be considered financial, investment, tax, or legal advice.",
  "footer.risk":
    "Trading involves risk. Past performance does not guarantee future results. This is not financial advice.",

  "auth.joinTitle": "Join ZacTrades",
  "auth.signInTitle": "Sign in to ZacTrades",
  "auth.joinDescription":
    "Create your member profile to access mentorship, live sessions, and premium tools.",
  "auth.signInDescription": "Access your live room, signals dashboard, and mentorship portal.",
  "auth.forgotTitle": "Reset your password",
  "auth.forgotDescription": "Enter your account email and we will send you a secure reset link.",
  "auth.accountCreated": "Account created",
  "auth.checkEmailTitle": "Check your email",
  "auth.confirmationSentTo": "Confirmation sent to",
  "auth.welcomeBack": "Welcome back",
  "auth.signupConfirm":
    "Account created. Please open your email inbox and click the confirmation link before signing in.",
  "auth.signupReady": "Your account is ready. You can continue to your member area.",
  "auth.signInSuccess": "Welcome back. You are signed in and ready to continue.",
  "auth.failed": "Authentication failed.",
  "auth.fullName": "Full name",
  "auth.fullNamePlaceholder": "Your full name",
  "auth.phoneNumber": "Phone number",
  "auth.phoneNumberPlaceholder": "+1 555 000 0000",
  "auth.discordUsername": "Discord username",
  "auth.discordUsernamePlaceholder": "yourname#0000 or @yourname",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.forgotPassword": "Forgot password?",
  "auth.resetSent": "Password reset link sent. Check your email and follow the secure link.",
  "auth.sendResetLink": "Send Reset Link",
  "auth.backToSignIn": "Back to sign in",
  "auth.newPassword": "New password",
  "auth.confirmPassword": "Confirm password",
  "auth.passwordUpdated":
    "Your password has been updated. You are signed out now, please sign in with the new password.",
  "auth.passwordMismatch": "Passwords do not match.",
  "auth.includes": "Elite membership includes",
  "auth.includeLive": "Live trading room access",
  "auth.includeMentorship": "Mentorship sessions",
  "auth.includeIndicators": "Premium indicators",
  "auth.createAccount": "Create Member Account",
  "auth.signIn": "Sign In",
  "auth.continue": "Continue",
  "auth.alreadyMember": "Already a member? Sign in",
  "auth.newHere": "New here? Join now",
} as const;

export type TranslationKey = keyof typeof en;

const fr: Record<TranslationKey, string> = {
  "nav.liveTrading": "Trading en direct",
  "nav.mentorship": "Mentorat",
  "nav.propfirms": "Propfirms",
  "nav.indicator": "Indicateur",
  "nav.education": "Education",
  "nav.news": "News",
  "nav.admin": "Admin",
  "nav.signIn": "Connexion",
  "nav.joinNow": "Rejoindre",
  "nav.signOut": "Deconnexion",
  "nav.menu": "Menu",
  "nav.languageLabel": "Langue",
  "nav.languageShort": "EN",
  "nav.languageButton": "English",

  "footer.tagline": "L'ecosysteme de trading professionnel pour les traders qui refusent de rester moyens.",
  "footer.platform": "Plateforme",
  "footer.company": "Entreprise",
  "footer.legal": "Legal",
  "footer.liveRoom": "Salle live",
  "footer.mentorship": "Mentorat",
  "footer.indicators": "Indicateurs",
  "footer.community": "Testimonials",
  "footer.about": "A propos",
  "footer.privacy": "Politique de confidentialite",
  "footer.terms": "Conditions d'utilisation",
  "footer.refund": "Politique de remboursement",
  "footer.disclosureTitle": "Divulgation",
  "footer.disclosureBody":
    "ZacTrades peut recevoir une compensation via des liens partenaires, des promotions ou des plateformes mises en avant. Ces partenariats n'influencent pas notre contenu educatif, nos commentaires de marche ou notre accompagnement communautaire.",
  "footer.disclaimerTitle": "Avertissement",
  "footer.disclaimerBody":
    "Le trading des futures, du forex, des cryptomonnaies et d'autres marches financiers comporte un risque important. Le contenu de ZacTrades est fourni uniquement a des fins educatives et ne constitue pas un conseil financier, d'investissement, fiscal ou juridique.",
  "footer.risk":
    "Le trading comporte des risques. Les performances passees ne garantissent pas les resultats futurs. Ceci n'est pas un conseil financier.",

  "auth.joinTitle": "Rejoindre ZacTrades",
  "auth.signInTitle": "Connexion a ZacTrades",
  "auth.joinDescription":
    "Creez votre profil membre pour acceder au mentorat, aux sessions live et aux outils premium.",
  "auth.signInDescription":
    "Accedez a votre salle live, au tableau des signaux et au portail de mentorat.",
  "auth.forgotTitle": "Reinitialiser votre mot de passe",
  "auth.forgotDescription":
    "Entrez l'email de votre compte et nous vous enverrons un lien securise.",
  "auth.accountCreated": "Compte cree",
  "auth.checkEmailTitle": "Verifiez votre email",
  "auth.confirmationSentTo": "Confirmation envoyee a",
  "auth.welcomeBack": "Bon retour",
  "auth.signupConfirm":
    "Compte cree. Ouvrez votre boite email et cliquez sur le lien de confirmation avant de vous connecter.",
  "auth.signupReady": "Votre compte est pret. Vous pouvez continuer vers votre espace membre.",
  "auth.signInSuccess": "Bon retour. Vous etes connecte et pret a continuer.",
  "auth.failed": "Echec de l'authentification.",
  "auth.fullName": "Nom complet",
  "auth.fullNamePlaceholder": "Votre nom complet",
  "auth.phoneNumber": "Telephone",
  "auth.phoneNumberPlaceholder": "+33 6 00 00 00 00",
  "auth.discordUsername": "Pseudo Discord",
  "auth.discordUsernamePlaceholder": "votrenom#0000 ou @votrenom",
  "auth.email": "Email",
  "auth.password": "Mot de passe",
  "auth.forgotPassword": "Mot de passe oublie ?",
  "auth.resetSent": "Lien de reinitialisation envoye. Verifiez votre email.",
  "auth.sendResetLink": "Envoyer le lien",
  "auth.backToSignIn": "Retour a la connexion",
  "auth.newPassword": "Nouveau mot de passe",
  "auth.confirmPassword": "Confirmer le mot de passe",
  "auth.passwordUpdated":
    "Votre mot de passe a ete mis a jour. Vous etes deconnecte, connectez-vous avec le nouveau mot de passe.",
  "auth.passwordMismatch": "Les mots de passe ne correspondent pas.",
  "auth.includes": "L'abonnement elite inclut",
  "auth.includeLive": "Acces a la salle de trading live",
  "auth.includeMentorship": "Sessions de mentorat",
  "auth.includeIndicators": "Indicateurs premium",
  "auth.createAccount": "Creer un compte membre",
  "auth.signIn": "Se connecter",
  "auth.continue": "Continuer",
  "auth.alreadyMember": "Deja membre ? Connexion",
  "auth.newHere": "Nouveau ici ? Rejoindre",
};

const translations: Record<Language, Record<TranslationKey, string>> = {
  en,
  fr,
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("zactrades-language");
    if (savedLanguage === "en" || savedLanguage === "fr") {
      setLanguageState(savedLanguage);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem("zactrades-language", language);
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: setLanguageState,
      toggleLanguage: () => setLanguageState((current) => (current === "en" ? "fr" : "en")),
      t: (key) => translations[language][key] ?? translations.en[key],
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}
