/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Currency = "USD" | "MAD";

const currencyStorageKey = "zactrades-session-currency";
const usdToMadRate = 10;

type CurrencyContextValue = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (priceLabel?: string | null) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function parseUsdPrice(label: string) {
  const match = label.match(/\$?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)/);

  if (!match) return null;

  const amount = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : null;
}

function formatMadAmount(amount: number) {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount)} MAD`;
}

export function formatPriceForCurrency(priceLabel: string | null | undefined, currency: Currency) {
  if (!priceLabel) return "";
  if (currency === "USD") return priceLabel;

  const monthlySuffix = priceLabel.match(/(\/[a-zA-Z]+)$/)?.[1] ?? "";
  const amount = parseUsdPrice(priceLabel);

  if (amount === null) return priceLabel;

  return `${formatMadAmount(amount * usdToMadRate)}${monthlySuffix}`;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD");

  useEffect(() => {
    const savedCurrency = window.sessionStorage.getItem(currencyStorageKey);
    if (savedCurrency === "USD" || savedCurrency === "MAD") {
      setCurrencyState(savedCurrency);
    }
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem(currencyStorageKey, currency);
  }, [currency]);

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency: setCurrencyState,
      formatPrice: (priceLabel) => formatPriceForCurrency(priceLabel, currency),
    }),
    [currency],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);

  if (!context) {
    throw new Error("useCurrency must be used inside CurrencyProvider");
  }

  return context;
}
