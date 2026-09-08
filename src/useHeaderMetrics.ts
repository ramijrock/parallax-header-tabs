import { useCallback, useMemo, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

export interface HeaderMetricsInput {
  headerHeight: number;
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
    const heroHeight =
      autoHeight && measured != null
        ? Math.max(headerHeight, measured)
        : headerHeight;
    const subTabHeight = hasSubTabs ? tabBarHeight : 0;
    const pinnedTop = stickyTopInset + bannerHeight;

    return {
      heroHeight,
      collapseDistance: Math.max(0, heroHeight - pinnedTop),
      tabBarTop: heroHeight,
      pinnedTop,
      subTabBarTop: heroHeight + tabBarHeight,
      contentPaddingTop: heroHeight + tabBarHeight + subTabHeight,
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
