import type { ReactNode, ComponentType } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/** A tab in the sticky bar. `key` identifies it — never the array index. */
export interface TabItem {
  key: string;
  title: string;
  /** Rendered left of the title. Any node, so the package needs no icon library. */
  icon?: ReactNode;
  /** Used instead of `icon` while the tab is active. Falls back to `icon`. */
  activeIcon?: ReactNode;
  /** Free-form payload handed back to your callbacks untouched. */
  data?: unknown;
}

export interface ParallaxHeaderTheme {
  /** Page background behind the scrolling body. */
  background: string;
  /** Tab bar and sub tab bar background. */
  surface: string;
  /** Inactive tab label. */
  text: string;
  /** Active tab label. */
  activeText: string;
  /** Underline that slides to the active tab. */
  indicator: string;
  /** Hairline under the bars. */
  border: string;
  /** Collapsed banner label. */
  bannerText: string;
  /** Collapsed banner fill, used when no `BannerBackground` is supplied. */
  bannerBackground: string;
  /** Overflow sheet fill. */
  overlay: string;
}

/** Props for a caller-supplied background behind the collapsed banner. */
export interface BannerBackgroundProps {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

export interface ParallaxHeaderHandle {
  /** Select a tab by key. No-op for an unknown key. */
  setTab: (key: string) => void;
  /** Select a sub tab by key. No-op for an unknown key. */
  setSubTab: (key: string) => void;
  /** Bring a tab into view without changing the selection. */
  scrollToTab: (key: string) => void;
  scrollTo: (y: number, animated?: boolean) => void;
  scrollToTop: (animated?: boolean) => void;
}

export interface ParallaxHeaderProps {
  // ── Header ──────────────────────────────────────────────────────────────
  /**
   * The expanded hero content. Give its root `flexGrow: 1` if you set a
   * `headerHeight` taller than the content itself — flexbox stretches a child
   * across, never down, so a natural-height root leaves the rest of the hero
   * bare and a child under `absoluteFill` (a `HeaderCarousel`) stops at the
   * content's height rather than the hero's.
   *
   * `flexGrow: 1`, not `flex: 1`: the shorthand also sets `flexBasis: 0`, and
   * with no `headerHeight` there is no free space to grow back into, so the
   * hero collapses to its padding instead of measuring its content.
   */
  header?: ReactNode;
  /**
   * Expanded hero height. With `autoHeight` this is a floor, not a fixed size
   * — and omitting it there means no floor at all: the hero is exactly what
   * its content measures, so a hero-filling child (a `HeaderCarousel` under
   * `absoluteFill`) is sized by the content too.
   * @default 300, and no floor with `autoHeight`
   */
  headerHeight?: number;
  /**
   * Measure the hero and grow past `headerHeight` when its content is taller
   * (an extra row of tags, a long title, a wide tablet). Every offset derives
   * from the resulting height, so nothing needs compensating by hand.
   * @default false
   */
  autoHeight?: boolean;
  /**
   * Pinned to the left of the top strip — a back button belongs here. Drawn
   * above the hero and above the collapsed banner and never moves, so it
   * stays hit-testable and legible in both states. The banner's title is
   * centred and untouched by it.
   */
  headerLeft?: ReactNode;
  /** The same strip, right-hand side — an overflow or "more" control. */
  headerRight?: ReactNode;
  /**
   * How much slower than the scroll the hero moves. 0 pins it, 1 scrolls it
   * away at full speed.
   * @default 0.5
   */
  parallaxFactor?: number;
  /**
   * Where the tab bar comes to rest once collapsed — set this to your safe
   * area top plus any fixed nav bar.
   * @default 0
   */
  stickyTopInset?: number;
  /** @default 48 */
  tabBarHeight?: number;

  // ── Tabs ────────────────────────────────────────────────────────────────
  tabs?: TabItem[];
  /** Controlled selection. Omit to let the component own it. */
  activeTabKey?: string;
  /** Initial selection when uncontrolled. Defaults to the first tab. */
  defaultTabKey?: string;
  onTabChange?: (tab: TabItem, index: number) => void;

  subTabs?: TabItem[];
  activeSubTabKey?: string;
  defaultSubTabKey?: string;
  onSubTabChange?: (tab: TabItem, index: number) => void;

  // ── Body ────────────────────────────────────────────────────────────────
  children?: ReactNode;
  /** Pinned to the bottom of the screen, above the scroll view. */
  footer?: ReactNode;
  /**
   * Draw the empty state instead of the body. Say it outright whenever the
   * body renders its own nothing — a screen component that returns `null` for
   * a tab with no rows still arrives here as one child, and no amount of
   * looking at `children` can see inside it. Left unset, a body with no
   * children at all is taken at its word and counts as empty.
   */
  empty?: boolean;
  /**
   * Message for the built-in empty state.
   * @default 'No data found'
   */
  emptyText?: string;
  /** Replaces the built-in empty state entirely. */
  renderEmpty?: () => ReactNode;

  // ── Collapsed banner ────────────────────────────────────────────────────
  /** Shown in the banner once the header has collapsed. */
  title?: string;
  /**
   * Height of the collapsed banner. The tab bar pins directly beneath it, so
   * raising this pushes the pinned tabs down rather than letting the banner
   * cover them. Ignored when there is no `title` and no `renderBanner`.
   * @default 48
   */
  bannerHeight?: number;
  /** Replaces the default banner body entirely. */
  renderBanner?: () => ReactNode;
  /**
   * Drawn behind the banner. Pass Expo's `BlurView` for frosted glass, or
   * leave unset for a solid fill — that keeps the package free of any Expo
   * dependency.
   */
  BannerBackground?: ComponentType<BannerBackgroundProps>;
  onBannerVisibilityChange?: (visible: boolean) => void;

  // ── Scrolling ───────────────────────────────────────────────────────────
  /** Fires once per approach to the bottom, on drag end as well as momentum. */
  onEndReached?: () => void;
  /** Distance from the bottom that counts as reaching it, in px. @default 120 */
  onEndReachedThreshold?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Raw scroll offset, every frame. */
  onScroll?: (y: number) => void;

  // ── Overflow sheet ──────────────────────────────────────────────────────
  /** Show the overflow button once there are more tabs than this. @default 4 */
  overflowThreshold?: number;
  /**
   * Enables reordering in the overflow sheet and receives the new order.
   * Omit to make the sheet selection-only.
   */
  onTabsReorder?: (tabs: TabItem[]) => void;
  /**
   * Replaces the sheet's list. Supply this to plug in a drag-and-drop list
   * (react-native-draggable-flatlist, say) without the package depending on
   * one. Call `select` to pick a tab and `commit` to publish a new order.
   */
  renderTabList?: (args: {
    tabs: TabItem[];
    activeKey?: string;
    select: (tab: TabItem) => void;
    commit: (tabs: TabItem[]) => void;
    close: () => void;
  }) => ReactNode;

  // ── Misc ────────────────────────────────────────────────────────────────
  theme?: Partial<ParallaxHeaderTheme>;
  style?: StyleProp<ViewStyle>;
  /** Called before a haptic-worthy interaction. Wire to expo-haptics if wanted. */
  onFeedback?: () => void;
  testID?: string;
}
