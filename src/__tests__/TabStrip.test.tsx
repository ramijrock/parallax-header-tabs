import { Animated, StyleSheet } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { TabStrip, type TabStripProps } from '../components/TabStrip';
import { defaultTheme } from '../theme';
import type { TabItem } from '../types';

const tabs: TabItem[] = [
  { key: 'a', title: 'A' },
  { key: 'b', title: 'B' },
  { key: 'c', title: 'C' },
];

// The x/width the three tabs would report on a device.
const geometry: Record<string, { x: number; width: number }> = {
  a: { x: 0, width: 80 },
  b: { x: 80, width: 120 },
  c: { x: 200, width: 100 },
};

const props = (activeKey: string): TabStripProps => ({
  tabs,
  activeKey,
  onSelect: () => {},
  theme: defaultTheme,
  height: 48,
  testID: 'strip',
});

function layOut() {
  for (const tab of tabs) {
    fireEvent(screen.getByLabelText(tab.title), 'layout', {
      nativeEvent: { layout: { ...geometry[tab.key], y: 0, height: 48 } },
    });
  }
}

/** The bar is one pixel wide and scaled, so read back the span it covers. */
function indicatorSpan() {
  const style = StyleSheet.flatten(
    screen.getByTestId('strip-indicator').props.style
  );
  const [{ translateX }, { scaleX }] = style.transform as [
    { translateX: number },
    { scaleX: number },
  ];
  return { left: translateX + 0.5 - scaleX / 2, width: scaleX };
}

describe('TabStrip indicator', () => {
  it('is invisible until the tabs have been measured', () => {
    render(<TabStrip {...props('a')} />);
    expect(indicatorSpan().width).toBe(0);
  });

  it('snaps onto the active tab as it lays out', () => {
    const timing = jest.spyOn(Animated, 'timing');
    const { update } = render(<TabStrip {...props('b')} />);
    layOut();
    update(<TabStrip {...props('b')} />);

    expect(indicatorSpan()).toEqual({ left: 80, width: 120 });
    // The first placement must not animate in from the far left.
    expect(timing).not.toHaveBeenCalled();
    timing.mockRestore();
  });

  it('slides to the newly selected tab', () => {
    const timing = jest.spyOn(Animated, 'timing');
    const { update } = render(<TabStrip {...props('b')} />);
    layOut();
    timing.mockClear();

    update(<TabStrip {...props('c')} />);

    // Native driver, so the JS-side value cannot be read back under jest —
    // assert the targets instead: tab c's centre, stretched to its width.
    const targets = timing.mock.calls.map(([, config]) => config);
    expect(targets).toEqual([
      expect.objectContaining({ toValue: 249.5, useNativeDriver: true }),
      expect.objectContaining({ toValue: 100, useNativeDriver: true }),
    ]);
    timing.mockRestore();
  });
});
