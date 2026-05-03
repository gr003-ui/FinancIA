"use client";
import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';

interface StaggerListProps {
  children: ReactNode | ReactNode[];
  className?: string;
  staggerDelay?: number;
}

const containerVariants: Variants = {
  hidden:  {},
  visible: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const itemVariants: Variants = {
  hidden:  { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: 'easeOut',
    },
  },
};

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

export default function StaggerList({
  children,
  className,
  staggerDelay = 0.07,
}: StaggerListProps) {
  const containerWithDelay: Variants = {
    hidden:  {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  return (
    <motion.div
      variants={containerWithDelay}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {Array.isArray(children) ? children : [children]}
    </motion.div>
  );
}