import { forwardRef, useContext } from 'react';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { ParallaxHeader as CoreParallaxHeader } from '../ParallaxHeader';
import type { ParallaxHeaderHandle, ParallaxHeaderProps } from '../types';

export * from '../index';

/**
 * `ParallaxHeader` with `stickyTopInset` defaulted to the safe area's top
 * inset, so the collapsed chrome clears the notch without being told to.
 *
 * A separate entry on purpose. The main one imports nothing native, and an
 * optional `require` of this package would not save it: stock Metro refuses
 * to bundle a module it cannot resolve, `try` or no `try`. Only a screen that
 * imports from here needs `react-native-safe-area-context` installed.
 *
 * The context is read directly rather than through `useSafeAreaInsets`, which
 * throws without a `SafeAreaProvider` above it. Here a missing provider is
 * only a missing inset: it falls back to 0, as the main entry does. An
 * explicit `stickyTopInset` always wins — pass 0 under a navigator's own
 * header, which already sits below the notch.
 */
export const ParallaxHeader = forwardRef<
  ParallaxHeaderHandle,
  ParallaxHeaderProps
>(({ stickyTopInset, ...props }, ref) => {
  const insets = useContext(SafeAreaInsetsContext);
  return (
    <CoreParallaxHeader
      ref={ref}
      {...props}
      stickyTopInset={stickyTopInset ?? insets?.top ?? 0}
    />
  );
});

ParallaxHeader.displayName = 'ParallaxHeader';
