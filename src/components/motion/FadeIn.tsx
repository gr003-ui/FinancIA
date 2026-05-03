"use client";
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
}

const directionMap = {
  up:    { y: 20, x: 0  },
  down:  { y: -20, x: 0  },
  left:  { y: 0,  x: 20  },
  right: { y: 0,  x: -20 },
  none:  { y: 0,  x: 0   },
};

export default function FadeIn({
  children,
  delay     = 0,
  duration  = 0.4,
  direction = 'up',
  className,
}: FadeInProps) {
  const { x, y } = directionMap[direction];
  return (
    <motion.div
      initial={{ opacity: 0, x, y }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}