import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type ComponentRef,
} from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import type { ParallaxHeaderTheme, TabItem } from '../types';

export interface TabStripHandle {
  /** Centre a tab horizontally. Silently ignores a tab not yet laid out. */
  scrollToKey: (key: string) => void;
}

export interface TabStripProps {
  tabs: TabItem[];
  activeKey?: string;
  onSelect: (key: string) => void;
  theme: ParallaxHeaderTheme;
  height: number;
  /** Rendered before the strip — the overflow button, in practice. */
  leading?: React.ReactNode;
  /** Spread the tabs across the full width instead of scrolling them. */
  fill?: boolean;
  testID?: string;
}

const INDICATOR_HEIGHT = 2;
const SLIDE_DURATION = 240;

/**
 * Both the tab bar and the sub tab bar are this component. Sharing it is what
 * keeps the two from drifting apart — the original pair were copies, and the
 * sub tab bar ended up measuring its trailing gap against the *main* tab count.
 */
export const TabStrip = forwardRef<TabStripHandle, TabStripProps>(
  (
    { tabs, activeKey, onSelect, theme, height, leading, fill, testID },
    ref
  ) => {
    const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
    // Real geometry, captured as each tab lays out. Centring and the sliding
    // indicator both work off measured values, so they stay correct for any
    // font, locale or padding — a fixed per-tab width estimate cannot.
    const layouts = useRef<Record<string, { x: number; width: number }>>({});
    const viewportWidth = useRef(0);

    // The bar is one pixel wide and stretched to the active tab, so both the
    // slide and the resize are transforms and can run on the native driver.
    // That matters here: a tab press re-renders the body, and a JS-driven
    // animation would stutter behind that work.
    const translateX = useRef(new Animated.Value(0)).current;
    const scaleX = useRef(new Animated.Value(0)).current;
    // Stays 0 — invisible — until a measurement lands, so the bar never
    // flashes at the far left on the first frame.
    const placed = useRef(false);

    const moveIndicator = useCallback(
      (key: string | undefined, animated: boolean) => {
        const layout = key ? layouts.current[key] : undefined;
        if (!layout || layout.width <= 0) return;
        // A unit-wide bar scales about its own centre, so aim the centre at
        // the tab's centre rather than its left edge.
        const x = layout.x + layout.width / 2 - 0.5;
        // Only slide between two positions we have actually drawn. The first
        // placement, and any later relayout (rotation, a font change), snap.
        if (!animated || !placed.current) {
          placed.current = true;
          translateX.setValue(x);
          scaleX.setValue(layout.width);
          return;
        }
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: x,
            duration: SLIDE_DURATION,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(scaleX, {
            toValue: layout.width,
            duration: SLIDE_DURATION,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      },
      [scaleX, translateX]
    );

    useEffect(() => {
      moveIndicator(activeKey, true);
    }, [activeKey, moveIndicator, tabs]);

    const scrollToKey = useCallback((key: string) => {
      const layout = layouts.current[key];
      const viewport = viewportWidth.current;
      if (!layout || viewport <= 0) return;
      scrollRef.current?.scrollTo({
        x: Math.max(0, layout.x + layout.width / 2 - viewport / 2),
        animated: true,
      });
    }, []);

    useImperativeHandle(ref, () => ({ scrollToKey }), [scrollToKey]);

    const onViewportLayout = useCallback((event: LayoutChangeEvent) => {
      viewportWidth.current = event.nativeEvent.layout.width;
    }, []);

    // Built once per theme rather than per render, so the strip does not
    // allocate a fresh style object on every frame.
    const barStyle = useMemo(
      () => ({ backgroundColor: theme.indicator }),
      [theme.indicator]
    );

    return (
      <View
        style={[styles.row, { height, backgroundColor: theme.surface }]}
        testID={testID}
      >
        {leading}
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onLayout={onViewportLayout}
          contentContainerStyle={fill ? styles.fill : undefined}
          style={styles.flex}
        >
          {tabs.map((tab) => {
            const isActive = tab.key === activeKey;
            return (
              <TouchableOpacity
                // Keyed by identity, not position, so a reorder moves rows
                // instead of recycling the wrong one into place.
                key={tab.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={tab.title}
                onLayout={(event: LayoutChangeEvent) => {
                  const { x, width } = event.nativeEvent.layout;
                  layouts.current[tab.key] = { x, width };
                  // Measurements arrive after the effect above, and a tab can
                  // move without the selection changing, so the active tab
                  // re-aims the bar as it lands.
                  if (tab.key === activeKey) moveIndicator(tab.key, false);
                }}
                onPress={() => onSelect(tab.key)}
                style={[styles.tab, fill && styles.tabFill]}
              >
                {isActive ? (tab.activeIcon ?? tab.icon) : tab.icon}
                <Text
                  numberOfLines={1}
                  style={[
                    styles.label,
                    { color: isActive ? theme.activeText : theme.text },
                    (tab.activeIcon ?? tab.icon) ? styles.labelWithIcon : null,
                  ]}
                >
                  {tab.title}
                </Text>
              </TouchableOpacity>
            );
          })}
          {/* Inside the scrollable content, so it tracks the tabs when the
              strip is scrolled without any offset bookkeeping. */}
          <Animated.View
            pointerEvents="none"
            testID={testID ? `${testID}-indicator` : undefined}
            style={[
              styles.indicator,
              barStyle,
              { transform: [{ translateX }, { scaleX }] },
            ]}
          />
        </ScrollView>
      </View>
    );
  }
);

TabStrip.displayName = 'TabStrip';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch' },
  flex: { flex: 1 },
  fill: { flexGrow: 1 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: INDICATOR_HEIGHT,
  },
  tabFill: { flex: 1 },
  label: { fontSize: 14, fontWeight: '500' },
  labelWithIcon: { marginLeft: 6 },
  indicator: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 1,
    height: INDICATOR_HEIGHT,
  },
});
