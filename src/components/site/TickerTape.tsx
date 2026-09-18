import { useEffect, useRef, useState } from "react";

const tradingViewSymbols = [
  { proName: "TVC:USOIL", title: "WTI" },
  { proName: "OANDA:XAUUSD", title: "Gold" },
  { proName: "FOREXCOM:NSXUSD", title: "Nasdaq 100" },
  { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
  { proName: "OANDA:EURUSD", title: "EURUSD" },
  { proName: "OANDA:GBPUSD", title: "GBPUSD" },
  { proName: "BITSTAMP:BTCUSD", title: "BTCUSD" },
  { proName: "BITSTAMP:ETHUSD", title: "ETHUSD" },
  { proName: "COINBASE:SOLUSD", title: "SOLUSD" },
];

const tradingViewConfig = {
  symbols: tradingViewSymbols,
  showSymbolLogo: true,
  isTransparent: true,
  displayMode: "adaptive",
  colorTheme: "dark",
  locale: "en",
};

export function TickerTape() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    container.appendChild(widget);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.textContent = JSON.stringify(tradingViewConfig);
    container.appendChild(script);

    const retryTimer = window.setTimeout(() => {
      const hasLoadedWidget = Boolean(container.querySelector("iframe"));
      if (!hasLoadedWidget) {
        setReloadKey((current) => current + 1);
      }
    }, 6000);

    return () => {
      window.clearTimeout(retryTimer);
      container.innerHTML = "";
    };
  }, [reloadKey]);

  return (
    <div className="relative overflow-hidden border-y border-border/40 bg-card/40 backdrop-blur">
      <div className="min-h-[46px]">
        <div
          key={reloadKey}
          ref={containerRef}
          className="tradingview-widget-container h-[46px] w-full"
        />
      </div>
    </div>
  );
}
