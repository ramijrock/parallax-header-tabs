import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { View } from 'react-native';
import { ParallaxHeader } from '../ParallaxHeader';
import type {
  ParallaxHeaderHandle,
  ParallaxHeaderTheme,
  TabItem,
} from '../types';

/**
 * Drop-in shim for the in-app ParallaxHeader this package replaces.
 *
 * It accepts the old prop names — including the screen-specific mode flags —
 * and maps them onto the derived layout model, so a screen can migrate by
 * changing one import and supplying its theme colours explicitly instead of
 * pulling them from a store.
 *
 * What it does NOT promise is pixel-identical output. The old component placed
 * each bar with a per-screen constant; here every offset derives from the hero
 * height, so a screen that leaned on one of those constants may sit a few
 * points differently. Check each screen once, then move it to the real API.
 */

/** The shape the old component's `tabContent` / `subtabContent` entries had. */
export interface LegacyTab {
  id?: string | number;
  title: string;
  screen?: string;
  isSelected?: boolean;
  icon?: ReactNode;
  iconActive?: ReactNode;
  iconNormal?: ReactNode;
  [key: string]: unknown;
}

export interface LegacyParallaxHeaderProps {
  headerContent?: ReactNode;
  tabContent?: LegacyTab[];
  children?: ReactNode;
  onTabSelect?: (item: LegacyTab) => void;
  onSubTabSelect?: (item: LegacyTab, index: number) => void;
  onTabReorderConfirm?: (tabs: LegacyTab[]) => void;
  titleText?: string;
  isProfile?: boolean;
  footerComponent?: ReactNode;
  isSubTab?: boolean;
  subtabContent?: LegacyTab[];
  onTouchEnd?: () => void;
  headerBackgroundColor?: string;
  bodyBackgroundColor?: string;
  onBannerVisibilityChange?: (visible: boolean) => void;
  headerHeightCheck?: boolean;
  customHeaderHeight?: number;
  customParallaxHeight?: number;
  minHeaderContentHeight?: number;
  isHideStats?: boolean | null;
  isAnimalMissing?: boolean;
  isReady?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /**
   * Colours the old component read from Redux. Pass your theme slice here —
   * the package itself stays free of any store.
   */
  themeColors?: Partial<ParallaxHeaderTheme>;
  onFeedback?: () => void;
}

export interface LegacyParallaxHeaderHandle {
  jumpToTab: (title: string) => void;
  scrollToTab: (title: string) => void;
  updateSubTabItems: (items: LegacyTab[]) => void;
  scrollTo: (offset: number) => void;
}

const keyOf = (tab: LegacyTab, index: number): string =>
  String(tab.screen ?? tab.id ?? index);

const toTabItems = (list: LegacyTab[]): TabItem[] =>
  list.map((tab, index) => ({
    key: keyOf(tab, index),
    title: tab.title,
    icon: tab.icon ?? tab.iconNormal,
    activeIcon: tab.iconActive,
    data: tab,
  }));

/**
 * Reproduces the old `stickyTabTop` chain so the bars land where each screen
 * expects. Clamped at zero — the old `-40` case pulled the bar off screen,
 * which the derived model has no way to express and no reason to.
 */
const legacyStickyInset = ({
  isProfile,
  headerHeightCheck,
  isHideStats,
  isAnimalMissing,
}: Pick<
  LegacyParallaxHeaderProps,
  'isProfile' | 'headerHeightCheck' | 'isHideStats' | 'isAnimalMissing'
>): number => {
  if (isProfile) return 180;
  if (headerHeightCheck) return 130 + (isAnimalMissing ? 40 : 0);
  if (headerHeightCheck === undefined) return isHideStats ? 0 : 100;
  return 100;
};

export const ParallaxHeaderCompat = forwardRef<
  LegacyParallaxHeaderHandle,
  LegacyParallaxHeaderProps
>(
  (
    {
      headerContent,
      tabContent = [],
      children,
      onTabSelect,
      onSubTabSelect,
      onTabReorderConfirm,
      titleText,
      isProfile,
      footerComponent,
      isSubTab,
      subtabContent = [],
      onTouchEnd,
      headerBackgroundColor,
      bodyBackgroundColor,
      onBannerVisibilityChange,
      headerHeightCheck,
      customParallaxHeight,
      minHeaderContentHeight = 0,
      isHideStats,
      isAnimalMissing,
      isReady = true,
      refreshing,
      onRefresh,
      themeColors,
      onFeedback,
    },
    ref
  ) => {
    const inner = useRef<ParallaxHeaderHandle>(null);

    // The old component let a caller push new sub tabs through the ref.
    const [subTabOverride, setSubTabOverride] = useState<LegacyTab[] | null>(
      null
    );
    useEffect(() => setSubTabOverride(null), [subtabContent]);
    const activeSubSource = subTabOverride ?? subtabContent;

    const tabs = useMemo(() => toTabItems(tabContent), [tabContent]);
    const subTabs = useMemo(
      () => (isSubTab ? toTabItems(activeSubSource) : []),
      [isSubTab, activeSubSource]
    );

    // The old API carried selection on the items themselves. Honour that as a
    // controlled value — which is also what stops the two copies of the
    // selection from disagreeing, as they used to.
    const selectedIndex = tabContent.findIndex((tab) => tab.isSelected);
    const activeTabKey =
      selectedIndex >= 0
        ? keyOf(tabContent[selectedIndex]!, selectedIndex)
        : undefined;

    const subSelectedIndex = activeSubSource.findIndex((tab) => tab.isSelected);
    const activeSubTabKey =
      subSelectedIndex >= 0
        ? keyOf(activeSubSource[subSelectedIndex]!, subSelectedIndex)
        : undefined;

    const handleTabChange = useCallback(
      (tab: TabItem) => onTabSelect?.(tab.data as LegacyTab),
      [onTabSelect]
    );

    const handleSubTabChange = useCallback(
      (tab: TabItem, index: number) =>
        onSubTabSelect?.(tab.data as LegacyTab, index),
      [onSubTabSelect]
    );

    const handleReorder = useCallback(
      (next: TabItem[]) =>
        onTabReorderConfirm?.(next.map((tab) => tab.data as LegacyTab)),
      [onTabReorderConfirm]
    );

    const keyForTitle = useCallback(
      (title: string) => tabs.find((tab) => tab.title === title)?.key,
      [tabs]
    );

    useImperativeHandle(
      ref,
      () => ({
        jumpToTab: (title: string) => {
          const key = keyForTitle(title);
          if (key) inner.current?.setTab(key);
        },
        scrollToTab: (title: string) => {
          const key = keyForTitle(title);
          if (key) inner.current?.scrollToTab(key);
        },
        updateSubTabItems: (items: LegacyTab[]) => setSubTabOverride(items),
        scrollTo: (offset: number) => inner.current?.scrollTo(offset),
      }),
      [keyForTitle]
    );

    if (!isReady) return null;

    const theme = {
      ...(bodyBackgroundColor ? { background: bodyBackgroundColor } : null),
      ...themeColors,
    };

    return (
      <ParallaxHeader
        ref={inner}
        header={
          headerBackgroundColor ? (
            <View style={{ backgroundColor: headerBackgroundColor }}>
              {headerContent}
            </View>
          ) : (
            headerContent
          )
        }
        headerHeight={customParallaxHeight ?? 350}
        // The old pair of mechanisms for a taller-than-default header — the
        // `minHeaderContentHeight` prop and the useFitHeaderHeight hook — are
        // both just "measure it", which the core does on every device.
        autoHeight={minHeaderContentHeight > 0}
        stickyTopInset={legacyStickyInset({
          isProfile,
          headerHeightCheck,
          isHideStats,
          isAnimalMissing,
        })}
        tabs={tabs}
        activeTabKey={activeTabKey}
        onTabChange={handleTabChange}
        subTabs={subTabs}
        activeSubTabKey={activeSubTabKey}
        onSubTabChange={handleSubTabChange}
        onTabsReorder={onTabReorderConfirm ? handleReorder : undefined}
        title={titleText}
        onBannerVisibilityChange={onBannerVisibilityChange}
        onEndReached={onTouchEnd}
        refreshing={refreshing}
        onRefresh={onRefresh}
        footer={footerComponent}
        theme={theme}
        onFeedback={onFeedback}
      >
        {children}
      </ParallaxHeader>
    );
  }
);

ParallaxHeaderCompat.displayName = 'ParallaxHeaderCompat';

/** Matches the old default-export name, so an import swap is all it takes. */
export { ParallaxHeaderCompat as ParallaxHeader };
