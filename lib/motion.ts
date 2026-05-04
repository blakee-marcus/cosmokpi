import type { Variants } from 'motion/react';

export const tegEase = [0.2, 0, 0, 1] as const;

export const tegMotion = {
  duration: {
    fast: 0.12,
    base: 0.18,
    slow: 0.26,
  },
  ease: tegEase,
  distance: {
    xs: 4,
    sm: 8,
    md: 12,
  },
} as const;

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: tegMotion.distance.sm },
  visible: { opacity: 1, y: 0 },
};

export const panelIn: Variants = {
  hidden: { opacity: 0, y: tegMotion.distance.md, scale: 0.99 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export const listContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.035,
    },
  },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: tegMotion.distance.sm },
  visible: { opacity: 1, y: 0 },
};

export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const modalPanel: Variants = {
  hidden: { opacity: 0, y: tegMotion.distance.md, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1 },
};
