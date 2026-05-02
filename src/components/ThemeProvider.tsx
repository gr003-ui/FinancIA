"use client";
import { useEffect } from 'react';
import { useFinanceStore, AccentTheme } from '../store/useFinanceStore';

const THEMES: Record<AccentTheme, {
  accent: string;
  accentHover: string;
  accentMuted: string;
  accentText: string;
  accentBorder: string;
  accentShadow: string;
}> = {
  emerald: {
    accent:       '#10b981',
    accentHover:  '#34d399',
    accentMuted:  'rgba(16,185,129,0.1)',
    accentText:   '#34d399',
    accentBorder: 'rgba(16,185,129,0.3)',
    accentShadow: 'rgba(16,185,129,0.2)',
  },
  blue: {
    accent:       '#3b82f6',
    accentHover:  '#60a5fa',
    accentMuted:  'rgba(59,130,246,0.1)',
    accentText:   '#60a5fa',
    accentBorder: 'rgba(59,130,246,0.3)',
    accentShadow: 'rgba(59,130,246,0.2)',
  },
  purple: {
    accent:       '#8b5cf6',
    accentHover:  '#a78bfa',
    accentMuted:  'rgba(139,92,246,0.1)',
    accentText:   '#a78bfa',
    accentBorder: 'rgba(139,92,246,0.3)',
    accentShadow: 'rgba(139,92,246,0.2)',
  },
  rose: {
    accent:       '#f43f5e',
    accentHover:  '#fb7185',
    accentMuted:  'rgba(244,63,94,0.1)',
    accentText:   '#fb7185',
    accentBorder: 'rgba(244,63,94,0.3)',
    accentShadow: 'rgba(244,63,94,0.2)',
  },
  amber: {
    accent:       '#f59e0b',
    accentHover:  '#fbbf24',
    accentMuted:  'rgba(245,158,11,0.1)',
    accentText:   '#fbbf24',
    accentBorder: 'rgba(245,158,11,0.3)',
    accentShadow: 'rgba(245,158,11,0.2)',
  },
  cyan: {
    accent:       '#06b6d4',
    accentHover:  '#22d3ee',
    accentMuted:  'rgba(6,182,212,0.1)',
    accentText:   '#22d3ee',
    accentBorder: 'rgba(6,182,212,0.3)',
    accentShadow: 'rgba(6,182,212,0.2)',
  },
};

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { accentTheme } = useFinanceStore();

  useEffect(() => {
    const theme = THEMES[accentTheme];
    const root  = document.documentElement;
    root.style.setProperty('--accent',        theme.accent);
    root.style.setProperty('--accent-hover',  theme.accentHover);
    root.style.setProperty('--accent-muted',  theme.accentMuted);
    root.style.setProperty('--accent-text',   theme.accentText);
    root.style.setProperty('--accent-border', theme.accentBorder);
    root.style.setProperty('--accent-shadow', theme.accentShadow);
  }, [accentTheme]);

  return <>{children}</>;
}