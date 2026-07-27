import { useEffect, useRef } from "react";

const tradingViewSymbols = [
  { proName: "FX:AUDUSD", title: "AUDUSD" },
  { proName: "TVC:USOIL", title: "WTI" },
  { proName: "FOREXCOM:NSXUSD", title: "Nasdaq 100" },
  { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
  { proName: "FX:EURUSD", title: "EURUSD" },
  { proName: "FX:GBPUSD", title: "GBPUSD" },
  { proName: "BITSTAMP:BTCUSD", title: "BTCUSD" },
  { proName: "BITSTAMP:ETHUSD", title: "ETHUSD" },
  { proName: "COINBASE:SOLUSD", title: "SOLUSD" },
];

export function TickerTape() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: tradingViewSymbols,
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme: "dark",
      locale: "en",
    });

    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, []);

  return (
    <div className="relative overflow-hidden border-y border-border/40 bg-card/40 backdrop-blur">
      <div className="min-h-[46px]">
        <div ref={containerRef} className="tradingview-widget-container h-[46px] w-full" />
      </div>
    </div>
  );
}
