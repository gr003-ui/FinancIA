"use client";
import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatter?: (v: number) => string;
  className?: string;
}

export default function AnimatedNumber({
  value,
  duration  = 800,
  formatter = (v) => v.toLocaleString('es-AR'),
  className,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const startRef  = useRef(value);
  const frameRef  = useRef<number>(0);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    const from = startRef.current;
    const to   = value;
    if (from === to) return;

    startTime.current = null;

    const animate = (now: number) => {
      if (!startTime.current) startTime.current = now;
      const elapsed  = now - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased    = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
      else {
        setDisplay(to);
        startRef.current = to;
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return <span className={className}>{formatter(display)}</span>;
}