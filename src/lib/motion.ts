import type { Transition, Variants } from "framer-motion";

export const motionEase = [0.22, 1, 0.36, 1] as const;

export const quickSpring: Transition = {
  type: "spring",
  stiffness: 360,
  damping: 30,
  mass: 0.8,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: motionEase },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.08,
    },
  },
};

export const pageTransition: Transition = {
  duration: 0.3,
  ease: motionEase,
};

export const pageVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: pageTransition },
  exit: { opacity: 0, transition: pageTransition },
};

export const mobileMenuVariants: Variants = {
  hidden: { opacity: 0, y: -8, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: quickSpring,
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.98,
    transition: { duration: 0.16, ease: motionEase },
  },
};
