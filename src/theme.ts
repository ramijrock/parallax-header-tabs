import { useMemo } from 'react';
import type { ParallaxHeaderTheme } from './types';

/**
 * Neutral defaults. Every colour is overridable, so the package carries no
 * opinion about your design system and no dependency on a store.
 */
export const defaultTheme: ParallaxHeaderTheme = {
  background: '#ffffff',
  surface: '#ffffff',
  text: '#6b7280',
  activeText: '#111827',
  indicator: '#111827',
  border: 'rgba(0,0,0,0.08)',
  bannerText: '#ffffff',
  bannerBackground: 'rgba(0,0,0,0.55)',
  overlay: '#ffffff',
};

export const useTheme = (
  overrides?: Partial<ParallaxHeaderTheme>
): ParallaxHeaderTheme =>
  useMemo(
    () => (overrides ? { ...defaultTheme, ...overrides } : defaultTheme),
    [overrides]
  );
