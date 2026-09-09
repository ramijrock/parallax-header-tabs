import { useCallback, useMemo, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

/** Fallback hero height: no `headerHeight` given and nothing measured yet. */
export const DEFAULT_HEADER_HEIGHT = 300;

export interface HeaderMetricsInput {
  /** Omitted means "no opinion": a floor of zero once `autoHeight` measures. */
  headerHeight?: number;
  autoHeight: boolean;
  stickyTopInset: number;
  tabBarHeight: number;
  hasSubTabs: boolean;
  /** Height the collapsed banner occupies, or 0 when there is no banner. */
  bannerHeight: number;
}

export interface HeaderMetrics {
  /** Expanded hero height — the measured height when it exceeds the floor. */
  heroHeight: number;
  /**
   * Floor for the measured wrapper, so hero content fills a hero that is
   * taller than it. Deliberately the *configured* floor and never the current
   * `heroHeight`: feeding a measurement back in as a minimum would latch the
   * hero at its tallest and stop it shrinking again.
   */
  heroMinHeight: number;
  /**
   * How far the body scrolls before the tab bar pins. Everything else is a
   * function of this, which is what keeps the bars, the hero and the content
   * padding from ever disagreeing.
   */
  collapseDistance: number;
  /** Resting top of the tab bar, before any translation. */
  tabBarTop: number;
  /** Where the tab bar comes to rest — under the inset and the banner. */
  pinnedTop: number;
  /** Resting top of the sub tab bar. */
  subTabBarTop: number;
  /** Free space the body must leave for the hero and the bars. */
  contentPaddingTop: number;
  /**
   * Top of the clipped body viewport — where the tab bar comes to rest, so the
   * body is never drawn on the strip the banner keeps. Never below the content
   * itself, which keeps `bodyPaddingTop` from going negative.
   */
  bodyTop: number;
  /** `contentPaddingTop` less the space the viewport already starts past. */
  bodyPaddingTop: number;
  /** Wire to the hero wrapper's `onLayout` when `autoHeight` is on. */
  onHeaderLayout: (event: LayoutChangeEvent) => void;
}

/**
 * The single place any offset is worked out.
 *
 * Resting, the hero owns `[0, heroHeight]`, the tab bar sits directly beneath
 * it, and the sub tab bar beneath that. Collapsed, the tab bar rests at
 * `pinnedTop` — the sticky inset *plus* the banner, because the banner is
 * drawn over the same strip of screen and would otherwise hide the tabs
 * outright. Both bars translate by exactly `-collapseDistance`, so they
 * arrive together. The body reserves `contentPaddingTop`, which is the sum of
 * the three, so the first row of content clears the bars at rest and sits
 * flush under them once pinned.
 */
export const useHeaderMetrics = ({
  headerHeight,
  autoHeight,
  stickyTopInset,
  tabBarHeight,
  hasSubTabs,
  bannerHeight,
}: HeaderMetricsInput): HeaderMetrics => {
  const [measured, setMeasured] = useState<number | null>(null);

  const onHeaderLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (!autoHeight) return;
      const next = event.nativeEvent.layout.height;
      if (!(next > 0)) return;
      // Sub-pixel churn from a re-layout must not restart the render loop.
      setMeasured((prev) =>
        prev != null && Math.abs(prev - next) < 1 ? prev : next
      );
    },
    [autoHeight]
  );

  return useMemo(() => {
    // With `autoHeight` on, an omitted `headerHeight` is a floor of zero — the
    // hero is then whatever its content measures, so a hero-filling child (a
    // carousel under `absoluteFill`, say) is sized by the content too rather
    // than being stranded inside a 300pt default nobody asked for.
    const floor = headerHeight ?? (autoHeight ? 0 : DEFAULT_HEADER_HEIGHT);
    const configured = headerHeight ?? DEFAULT_HEADER_HEIGHT;
    const heroHeight =
      autoHeight && measured != null ? Math.max(floor, measured) : configured;
    const subTabHeight = hasSubTabs ? tabBarHeight : 0;
    const pinnedTop = stickyTopInset + bannerHeight;
    const contentPaddingTop = heroHeight + tabBarHeight + subTabHeight;
    const bodyTop = Math.min(pinnedTop, contentPaddingTop);

    return {
      heroHeight,
      heroMinHeight: floor,
      collapseDistance: Math.max(0, heroHeight - pinnedTop),
      tabBarTop: heroHeight,
      pinnedTop,
      subTabBarTop: heroHeight + tabBarHeight,
      contentPaddingTop,
      bodyTop,
      bodyPaddingTop: contentPaddingTop - bodyTop,
      onHeaderLayout,
    };
  }, [
    autoHeight,
    measured,
    headerHeight,
    stickyTopInset,
    tabBarHeight,
    hasSubTabs,
    bannerHeight,
    onHeaderLayout,
  ]);
};
