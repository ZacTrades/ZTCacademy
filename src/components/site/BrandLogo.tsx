import { motion } from "framer-motion";

import logoUrl from "@/assets/zactrades-logo4-clean.png";
import { quickSpring } from "@/lib/motion";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
  animated?: boolean;
};

export function BrandLogo({
  className,
  imageClassName,
  wordmarkClassName,
  showWordmark = false,
  animated = true,
}: BrandLogoProps) {
  const Wrapper = animated ? motion.div : "div";

  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <Wrapper
        className="relative block h-full aspect-square shrink-0 overflow-visible bg-transparent"
        whileHover={animated ? { y: -1, scale: 1.02 } : undefined}
        whileTap={animated ? { scale: 0.98 } : undefined}
        transition={animated ? quickSpring : undefined}
      >
        <img
          src={logoUrl}
          alt="ZacTrades"
          width={1001}
          height={992}
          draggable={false}
          className={cn(
            "h-full w-full object-contain object-center select-none",
            "drop-shadow-[0_0_16px_hsl(var(--gold)/0.22)]",
            imageClassName,
          )}
        />
      </Wrapper>

      {showWordmark && (
        <span
          className={cn(
            "min-w-0 whitespace-nowrap font-display text-xl font-black leading-none tracking-tight",
            wordmarkClassName,
          )}
        >
          <span className="text-foreground drop-shadow-sm">Zac</span>
          <span className="text-gradient-gold">Trades</span>
        </span>
      )}
    </div>
  );
}
