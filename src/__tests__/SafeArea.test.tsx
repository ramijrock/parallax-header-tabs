import { render, screen } from '@testing-library/react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { ParallaxHeader } from '../safe-area';

const insets = { top: 47, right: 0, bottom: 34, left: 0 };

/** The banner is the inset plus its own 48, so its height gives the inset. */
function bannerInset() {
  const banner = screen.getByTestId('ph-banner', {
    includeHiddenElements: true,
  });
  return banner.props.style.height - 48;
}

describe('ParallaxHeader from /safe-area', () => {
  it('rests the collapsed chrome under the safe area', () => {
    render(
      <SafeAreaInsetsContext.Provider value={insets}>
        <ParallaxHeader testID="ph" title="Panthera tigris" />
      </SafeAreaInsetsContext.Provider>
    );
    expect(bannerInset()).toBe(47);
  });

  it('lets an explicit stickyTopInset win, zero included', () => {
    render(
      <SafeAreaInsetsContext.Provider value={insets}>
        <ParallaxHeader
          testID="ph"
          title="Panthera tigris"
          stickyTopInset={0}
        />
      </SafeAreaInsetsContext.Provider>
    );
    expect(bannerInset()).toBe(0);
  });

  it('falls back to no inset without a provider, rather than throwing', () => {
    render(<ParallaxHeader testID="ph" title="Panthera tigris" />);
    expect(bannerInset()).toBe(0);
  });
});
