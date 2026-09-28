import {
  Children,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type Ref,
} from 'react';
import {
  Animated,
  Easing,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { StickyBanner } from './components/StickyBanner';
import { TabOverflowSheet } from './components/TabOverflowSheet';
import { TabStrip, type TabStripHandle } from './components/TabStrip';
import { useTheme } from './theme';
import { useHeaderMetrics } from './useHeaderMetrics';
import { useTabs } from './useTabs';
import type {
  ParallaxHeaderHandle,
  ParallaxHeaderProps,
  ParallaxScrollProps,
  TabItem,
} from './types';

const BANNER_DURATION = 220;
const EMPTY: TabItem[] = [];

/**
 * What the body's scroller might answer to. A `ScrollView` takes a point, a
 * `VirtualizedList` an offset, and `renderScrollComponent` decides which of
 * the two is behind the ref.
 */
interface ScrollableNode {
  scrollTo?: (options: { y?: number; animated?: boolean }) => void;
  scrollToOffset?: (options: { offset: number; animated?: boolean }) => void;
}

export const ParallaxHeader = forwardRef<
  ParallaxHeaderHandle,
  ParallaxHeaderProps
>(
  (
    {
      header,
      headerHeight,
      autoHeight = false,
      headerLeft,
      headerRight,
      parallaxFactor = 0.5,
      stickyTopInset = 0,
      tabBarHeight = 48,
      bannerHeight = 48,

      tabs = EMPTY,
      activeTabKey,
      defaultTabKey,
      onTabChange,

      subTabs = EMPTY,
      activeSubTabKey,
      defaultSubTabKey,
      onSubTabChange,

      children,
      footer,
      empty,
      emptyText = 'No data found',
      renderEmpty,
      renderScrollComponent,

      title,
      renderBanner,
      BannerBackground,
      onBannerVisibilityChange,

      onEndReached,
      onEndReachedThreshold = 120,
      refreshing = false,
      onRefresh,
      onScroll,

      overflowThreshold = 4,
      onTabsReorder,
      renderTabList,

      theme: themeOverrides,
      style,
      onFeedback,
      testID,
    },
    ref
  ) => {
    const theme = useTheme(themeOverrides);
    const hasTabs = tabs.length > 0;
    const hasSubTabs = subTabs.length > 0;
    // An empty banner is not worth a strip of screen: with nothing to put in
    // it, it reserves no space and is not drawn at all.
    const hasBanner = Boolean(title || renderBanner);

    const metrics = useHeaderMetrics({
      headerHeight,
      autoHeight,
      stickyTopInset,
      tabBarHeight,
      hasSubTabs,
      bannerHeight: hasBanner ? bannerHeight : 0,
    });

    const mainTabs = useTabs(tabs, activeTabKey, defaultTabKey, onTabChange);
    const subTabState = useTabs(
      subTabs,
      activeSubTabKey,
      defaultSubTabKey,
      onSubTabChange
    );

    const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
    const tabStripRef = useRef<TabStripHandle>(null);
    const scrollY = useRef(new Animated.Value(0)).current;
    const bannerProgress = useRef(new Animated.Value(0)).current;

    const [sheetVisible, setSheetVisible] = useState(false);
    const openSheet = useCallback(() => {
      onFeedback?.();
      setSheetVisible(true);
    }, [onFeedback]);
    const closeSheet = useCallback(() => setSheetVisible(false), []);

    // Nothing to draw is a state of its own, not a blank page. `empty` is the
    // caller's word for it, and has to be: a body that renders its own nothing
    // — a screen component returning `null` for a tab with no rows — still
    // arrives here as one child. Unset, a childless body is taken at its word.
    const isEmpty = empty ?? Children.toArray(children).length === 0;

    // The empty state fills what is left of the body below the bars, so the
    // message sits in the middle of the space the rows would have had rather
    // than clinging to the top of it. Measured, because that space is the
    // viewport less the padding the hero and the bars reserve.
    const [bodyHeight, setBodyHeight] = useState(0);
    const onBodyLayout = useCallback((event: LayoutChangeEvent) => {
      const next = event.nativeEvent.layout.height;
      // Sub-pixel churn from a re-layout must not restart the render loop.
      setBodyHeight((prev) => (Math.abs(prev - next) < 1 ? prev : next));
    }, []);

    // Latched so each edge fires once: the banner only on a crossing, and
    // `onEndReached` only on a fresh approach to the bottom.
    const bannerShown = useRef(false);
    const endReached = useRef(false);

    const {
      collapseDistance,
      contentPaddingTop,
      tabBarTop,
      subTabBarTop,
      bodyTop,
      bodyPaddingTop,
    } = metrics;
    // An interpolation needs a rising input range even before the hero has
    // been measured, when the distance can legitimately be zero.
    const span = Math.max(1, collapseDistance);

    const heroTranslate = useMemo(
      () =>
        scrollY.interpolate({
          inputRange: [0, span],
          outputRange: [0, -span * parallaxFactor],
          extrapolate: 'clamp',
        }),
      [scrollY, span, parallaxFactor]
    );

    // The content's own travel, for anything drawn behind a scroller of your
    // own. Memoised: a fresh node every render would be a fresh native
    // animation every render.
    const contentTranslate = useMemo(
      () => Animated.multiply(scrollY, -1),
      [scrollY]
    );

    // Both bars share one translation, so they can never arrive out of step.
    const barTranslate = useMemo(
      () =>
        scrollY.interpolate({
          inputRange: [0, span],
          outputRange: [0, -span],
          extrapolate: 'clamp',
        }),
      [scrollY, span]
    );

    const setBanner = useCallback(
      (visible: boolean) => {
        if (bannerShown.current === visible) return;
        bannerShown.current = visible;
        Animated.timing(bannerProgress, {
          toValue: visible ? 1 : 0,
          duration: BANNER_DURATION,
          // A real curve. A constant here would hold the value flat for the
          // whole duration and then jump, which reads as a flicker.
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
        onBannerVisibilityChange?.(visible);
      },
      [bannerProgress, onBannerVisibilityChange]
    );

    const handleScroll = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, contentSize, layoutMeasurement } =
          event.nativeEvent;
        const y = contentOffset.y;
        onScroll?.(y);
        setBanner(y >= collapseDistance);

        if (!onEndReached) return;
        const distanceToEnd = contentSize.height - layoutMeasurement.height - y;
        if (distanceToEnd <= onEndReachedThreshold) {
          // Checked here rather than on momentum end, so a slow drag to the
          // bottom pages just as a flick does.
          if (!endReached.current && contentSize.height > 0) {
            endReached.current = true;
            onEndReached();
          }
        } else {
          endReached.current = false;
        }
      },
      [
        collapseDistance,
        onEndReached,
        onEndReachedThreshold,
        onScroll,
        setBanner,
      ]
    );

    const onScrollEvent = useMemo(
      () =>
        Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
          listener: handleScroll,
        }),
      [scrollY, handleScroll]
    );

    // Keep the selected tab in view. Runs after layout, so the strip has real
    // measurements to centre against.
    useEffect(() => {
      if (!mainTabs.activeKey) return;
      const key = mainTabs.activeKey;
      const frame = requestAnimationFrame(() =>
        tabStripRef.current?.scrollToKey(key)
      );
      return () => cancelAnimationFrame(frame);
    }, [mainTabs.activeKey, tabs]);

    // The body is a `ScrollView` by default and whatever `renderScrollComponent`
    // returns otherwise, and the two are scrolled by different methods. Asked
    // for an offset, take whichever the node actually has.
    const scrollToY = useCallback((y: number, animated: boolean) => {
      const node = scrollRef.current as ScrollableNode | null;
      if (!node) return;
      if (typeof node.scrollToOffset === 'function') {
        node.scrollToOffset({ offset: y, animated });
        return;
      }
      node.scrollTo?.({ y, animated });
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        setTab: mainTabs.select,
        setSubTab: subTabState.select,
        scrollToTab: (key: string) => tabStripRef.current?.scrollToKey(key),
        scrollTo: (y: number, animated = true) => scrollToY(y, animated),
        scrollToTop: (animated = true) => scrollToY(0, animated),
      }),
      [mainTabs.select, subTabState.select, scrollToY]
    );

    // Lifted out of the tree so `renderScrollComponent` can hand it straight to
    // a list's `ListEmptyComponent` — same element, same measurements.
    // Memoised, so a list is not handed a new empty state on every render.
    const emptyComponent = useMemo(
      () => (
        <View
          testID={testID ? `${testID}-empty` : undefined}
          style={[
            styles.empty,
            { minHeight: Math.max(0, bodyHeight - bodyPaddingTop) },
          ]}
        >
          {renderEmpty ? (
            renderEmpty()
          ) : (
            <Text style={[styles.emptyText, { color: theme.text }]}>
              {emptyText}
            </Text>
          )}
        </View>
      ),
      [testID, bodyHeight, bodyPaddingTop, renderEmpty, emptyText, theme.text]
    );

    // One object, spread onto the built-in scroller and onto yours alike, so
    // the two can never drift apart. Memoised, so the scroller only sees new
    // props when one of them has actually changed.
    const scrollProps = useMemo<ParallaxScrollProps>(
      () => ({
        ref: scrollRef as Ref<any>,
        testID: testID ? `${testID}-scroll` : undefined,
        onScroll: onScrollEvent,
        scrollEventThrottle: 16,
        keyboardShouldPersistTaps: 'handled',
        showsVerticalScrollIndicator: false,
        contentContainerStyle: { paddingTop: bodyPaddingTop },
        refreshControl: onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            progressViewOffset={bodyPaddingTop}
          />
        ) : undefined,
      }),
      [testID, onScrollEvent, bodyPaddingTop, onRefresh, refreshing]
    );

    // Memoised, as the tab strip it leads is: a fresh element here would
    // redraw the whole strip on every render.
    const hasOverflow = tabs.length > overflowThreshold;
    const overflowButton = useMemo(
      () =>
        hasOverflow ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Show all tabs"
            onPress={openSheet}
            style={styles.overflowButton}
          >
            {/* Drawn rather than typeset, so no icon font is required. */}
            {[0, 1, 2].map((line) => (
              <View
                key={line}
                style={[styles.overflowLine, { backgroundColor: theme.text }]}
              />
            ))}
          </TouchableOpacity>
        ) : null,
      [hasOverflow, openSheet, theme.text]
    );

    return (
      <View
        style={[styles.root, { backgroundColor: theme.background }, style]}
        testID={testID}
      >
        {/* The hero is painted first so the body scrolls over it — that is what
            lets it travel at its own pace without ever covering content. */}
        <Animated.View
          style={[
            styles.hero,
            {
              height: metrics.heroHeight,
              transform: [{ translateY: heroTranslate }],
            },
          ]}
        >
          {/* Measured at its natural height, but never shorter than the
              configured floor — so hero content that fills its parent (a
              carousel under `absoluteFill`) covers the whole hero rather than
              only the part its own content happens to occupy. */}
          <View
            onLayout={metrics.onHeaderLayout}
            collapsable={false}
            style={{ minHeight: metrics.heroMinHeight }}
          >
            {header}
          </View>
        </Animated.View>

        {/* Clipped to start where the bars come to rest, and given back in
            padding exactly what the clip takes, so every row lands on the same
            pixel as before. Past full collapse the body would otherwise carry
            on up into the banner's strip and show through it — the banner is a
            scrim over the hero by design, and a translucent fill or a
            `BannerBackground` blur let the passing content read straight
            through. Above this line only the hero is ever drawn. */}
        <View style={[styles.body, { top: bodyTop }]} onLayout={onBodyLayout}>
          {renderScrollComponent ? (
            <>
              {/* The built-in body occludes the hero with an opaque wrapper
                  around its children. A list cannot be wrapped like that
                  without breaking the virtualisation this path exists for, so
                  the same fill is drawn behind it instead and moved with the
                  content. It starts where the content does and is as tall as
                  the hero and the bars together, which is all it ever has to
                  cover: below that the root's own background is already
                  behind the rows. */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.backdrop,
                  {
                    top: bodyPaddingTop,
                    height: contentPaddingTop,
                    backgroundColor: theme.background,
                    transform: [{ translateY: contentTranslate }],
                  },
                ]}
              />
              {renderScrollComponent({
                scrollProps,
                emptyComponent,
                scrollY,
                collapseDistance,
                contentPaddingTop,
              })}
            </>
          ) : (
            <Animated.ScrollView {...scrollProps}>
              {/* Opaque, so it occludes the hero as it rises past it. */}
              <View style={{ backgroundColor: theme.background }}>
                {isEmpty ? emptyComponent : children}
              </View>
            </Animated.ScrollView>
          )}
        </View>

        {hasTabs ? (
          <Animated.View
            testID={testID ? `${testID}-tab-bar` : undefined}
            style={[
              styles.bar,
              {
                top: tabBarTop,
                borderBottomColor: theme.border,
                transform: [{ translateY: barTranslate }],
              },
            ]}
          >
            <TabStrip
              ref={tabStripRef}
              tabs={tabs}
              activeKey={mainTabs.activeKey}
              onSelect={mainTabs.select}
              theme={theme}
              height={tabBarHeight}
              leading={overflowButton}
              testID={testID ? `${testID}-tabs` : undefined}
            />
          </Animated.View>
        ) : null}

        {hasSubTabs ? (
          <Animated.View
            style={[
              styles.bar,
              {
                top: subTabBarTop,
                borderBottomColor: theme.border,
                transform: [{ translateY: barTranslate }],
              },
            ]}
          >
            <TabStrip
              tabs={subTabs}
              activeKey={subTabState.activeKey}
              onSelect={subTabState.select}
              theme={theme}
              height={tabBarHeight}
              fill={subTabs.length <= 3}
              testID={testID ? `${testID}-subtabs` : undefined}
            />
          </Animated.View>
        ) : null}

        {hasBanner ? (
          <StickyBanner
            progress={bannerProgress}
            height={bannerHeight}
            topInset={stickyTopInset}
            title={title}
            theme={theme}
            renderBanner={renderBanner}
            BannerBackground={BannerBackground}
            testID={testID ? `${testID}-banner` : undefined}
          />
        ) : null}

        {/* Painted after the banner, so the two share the top strip with the
            controls on top: the banner fades its centred title in underneath
            while these stay put and stay tappable. `box-none` keeps the gap
            between them transparent to touches. */}
        {headerLeft || headerRight ? (
          <View
            pointerEvents="box-none"
            testID={testID ? `${testID}-chrome` : undefined}
            style={[
              styles.chrome,
              {
                height: stickyTopInset + bannerHeight,
                paddingTop: stickyTopInset,
              },
            ]}
          >
            {/* Two slots always, so a lone `headerRight` is still on the right. */}
            <View pointerEvents="box-none" style={styles.chromeSlot}>
              {headerLeft}
            </View>
            <View
              pointerEvents="box-none"
              style={[styles.chromeSlot, styles.chromeSlotRight]}
            >
              {headerRight}
            </View>
          </View>
        ) : null}

        {footer ? <View style={styles.footer}>{footer}</View> : null}

        <TabOverflowSheet
          visible={sheetVisible}
          onClose={closeSheet}
          tabs={tabs}
          activeKey={mainTabs.activeKey}
          onSelect={mainTabs.select}
          onTabsReorder={onTabsReorder}
          renderTabList={renderTabList}
          theme={theme}
          onFeedback={onFeedback}
        />
      </View>
    );
  }
);

ParallaxHeader.displayName = 'ParallaxHeader';

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  hero: { position: 'absolute', top: 0, left: 0, right: 0 },
  // `top` comes from the metrics; the clip is what keeps the body off the
  // strip the pinned bars and the banner own.
  body: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  // Drawn before the scroller and so behind it. No `zIndex` — a negative one
  // is the quickest way to lose a view outright on Android.
  backdrop: { position: 'absolute', left: 0, right: 0 },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  // Inside the scroll view, so it still pulls to refresh and the header still
  // collapses over it if the hero is tall enough to leave room.
  empty: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontSize: 15, fontWeight: '500' },
  chrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chromeSlot: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  chromeSlotRight: { justifyContent: 'flex-end' },
  overflowButton: {
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  overflowLine: {
    width: 16,
    height: 1.5,
    borderRadius: 1,
    marginVertical: 1.5,
  },
});
