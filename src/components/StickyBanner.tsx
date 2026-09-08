import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import type { BannerBackgroundProps, ParallaxHeaderTheme } from '../types';

export interface StickyBannerProps {
  progress: Animated.Value;
  height: number;
  topInset: number;
  title?: string;
  theme: ParallaxHeaderTheme;
  renderBanner?: () => React.ReactNode;
  BannerBackground?: React.ComponentType<BannerBackgroundProps>;
  testID?: string;
}

/**
 * The condensed title that takes over once the hero has collapsed.
 *
 * `BannerBackground` is a component slot rather than a hard import so a frosted
 * look is available to Expo apps (pass `BlurView`) without the package
 * depending on anything Expo-only. Unset, it falls back to a solid fill.
 */
export const StickyBanner = ({
  progress,
  height,
  topInset,
  title,
  theme,
  renderBanner,
  BannerBackground,
  testID,
}: StickyBannerProps) => {
  const body = renderBanner ? (
    renderBanner()
  ) : (
    <Text numberOfLines={1} style={[styles.title, { color: theme.bannerText }]}>
      {title}
    </Text>
  );

  const inner = BannerBackground ? (
    <BannerBackground style={styles.fill}>
      <View style={styles.center}>{body}</View>
    </BannerBackground>
  ) : (
    <View style={[styles.center, { backgroundColor: theme.bannerBackground }]}>
      {body}
    </View>
  );

  return (
    <Animated.View
      testID={testID}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.container,
        {
          height: height + topInset,
          paddingTop: topInset,
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [-(height + topInset), 0],
                extrapolate: 'clamp',
              }),
            },
          ],
        },
      ]}
    >
      {inner}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0 },
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '600' },
});
