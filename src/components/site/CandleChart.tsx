import { motion } from "framer-motion";
import { useMemo } from "react";

export function CandleChart({ count = 60, height = 220 }: { count?: number; height?: number }) {
  const candles = useMemo(() => {
    let price = 100;
    return Array.from({ length: count }, (_, i) => {
      const change = (Math.sin(i * 0.4) + Math.cos(i * 0.7)) * 4 + (Math.random() - 0.5) * 6;
      const open = price;
      price = Math.max(40, price + change);
      const close = price;
      const high = Math.max(open, close) + Math.random() * 4;
      const low = Math.min(open, close) - Math.random() * 4;
      return { open, close, high, low };
    });
  }, [count]);

  const allVals = candles.flatMap((c) => [c.high, c.low]);
  const min = Math.min(...allVals);
  const max = Math.max(...allVals);
  const range = max - min || 1;
  const width = 100;
  const candleW = width / count;

  const scale = (v: number) => height - ((v - min) / range) * height;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-full w-full">
      <defs>
        <linearGradient id="cg-bull" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.75 0.2 155)" />
          <stop offset="100%" stopColor="oklch(0.55 0.18 155)" />
        </linearGradient>
        <linearGradient id="cg-bear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.65 0.24 25)" />
          <stop offset="100%" stopColor="oklch(0.5 0.22 25)" />
        </linearGradient>
      </defs>
      {candles.map((c, i) => {
        const bull = c.close >= c.open;
        const x = i * candleW;
        const cx = x + candleW / 2;
        const wickTop = scale(c.high);
        const wickBot = scale(c.low);
        const bodyTop = scale(Math.max(c.open, c.close));
        const bodyBot = scale(Math.min(c.open, c.close));
        return (
          <motion.g
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.015, duration: 0.4 }}
          >
            <line
              x1={cx}
              x2={cx}
              y1={wickTop}
              y2={wickBot}
              stroke={bull ? "oklch(0.75 0.2 155)" : "oklch(0.65 0.24 25)"}
              strokeWidth={0.15}
            />
            <rect
              x={x + candleW * 0.15}
              y={bodyTop}
              width={candleW * 0.7}
              height={Math.max(0.4, bodyBot - bodyTop)}
              fill={bull ? "url(#cg-bull)" : "url(#cg-bear)"}
            />
          </motion.g>
        );
      })}
    </svg>
  );
}
