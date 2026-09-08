import { renderHook, act } from '@testing-library/react-native';
import { useHeaderMetrics } from '../useHeaderMetrics';

const layout = (height: number) =>
  ({ nativeEvent: { layout: { height, width: 0, x: 0, y: 0 } } }) as never;

const base = {
  headerHeight: 300,
  autoHeight: false,
  stickyTopInset: 0,
  tabBarHeight: 48,
  hasSubTabs: false,
  bannerHeight: 0,
};

describe('useHeaderMetrics', () => {
  it('derives every offset from the hero height', () => {
    const { result } = renderHook(() => useHeaderMetrics(base));
    expect(result.current.heroHeight).toBe(300);
    expect(result.current.collapseDistance).toBe(300);
    expect(result.current.tabBarTop).toBe(300);
    expect(result.current.subTabBarTop).toBe(348);
    expect(result.current.contentPaddingTop).toBe(348);
  });

  it('reserves a second bar only when there are sub tabs', () => {
    const { result } = renderHook(() =>
      useHeaderMetrics({ ...base, hasSubTabs: true })
    );
    expect(result.current.contentPaddingTop).toBe(396);
  });

  it('shortens the collapse by the sticky inset so the bar rests on it', () => {
    const { result } = renderHook(() =>
      useHeaderMetrics({ ...base, stickyTopInset: 100 })
    );
    // Resting top 300, travelling 200, coming to rest at exactly the inset.
    expect(result.current.collapseDistance).toBe(200);
    expect(result.current.tabBarTop - result.current.collapseDistance).toBe(
      100
    );
  });

  it('pins the tab bar below the banner, not underneath it', () => {
    const { result } = renderHook(() =>
      useHeaderMetrics({ ...base, stickyTopInset: 44, bannerHeight: 48 })
    );
    // The bar must come to rest clear of the banner — the two used to land on
    // the same strip of screen and the banner, drawn last, hid the tabs.
    expect(result.current.pinnedTop).toBe(92);
    expect(result.current.collapseDistance).toBe(208);
    expect(result.current.tabBarTop - result.current.collapseDistance).toBe(92);
  });

  it('never reports a negative collapse distance', () => {
    const { result } = renderHook(() =>
      useHeaderMetrics({ ...base, headerHeight: 40, stickyTopInset: 100 })
    );
    expect(result.current.collapseDistance).toBe(0);
  });

  it('ignores measurement unless autoHeight is on', () => {
    const { result } = renderHook(() => useHeaderMetrics(base));
    act(() => result.current.onHeaderLayout(layout(460)));
    expect(result.current.heroHeight).toBe(300);
  });

  it('grows to the measured height and carries it into every offset', () => {
    const { result } = renderHook(() =>
      useHeaderMetrics({ ...base, autoHeight: true })
    );
    act(() => result.current.onHeaderLayout(layout(460)));
    expect(result.current.heroHeight).toBe(460);
    expect(result.current.collapseDistance).toBe(460);
    expect(result.current.tabBarTop).toBe(460);
    expect(result.current.contentPaddingTop).toBe(508);
  });

  it('treats the configured height as a floor, not a target', () => {
    const { result } = renderHook(() =>
      useHeaderMetrics({ ...base, autoHeight: true })
    );
    act(() => result.current.onHeaderLayout(layout(120)));
    expect(result.current.heroHeight).toBe(300);
  });

  it('holds steady through sub-pixel re-layout', () => {
    const { result } = renderHook(() =>
      useHeaderMetrics({ ...base, autoHeight: true })
    );
    act(() => result.current.onHeaderLayout(layout(460)));
    const first = result.current;
    act(() => result.current.onHeaderLayout(layout(460.4)));
    expect(result.current.heroHeight).toBe(460);
    expect(result.current).toBe(first);
  });

  it('ignores a zero-height measurement', () => {
    const { result } = renderHook(() =>
      useHeaderMetrics({ ...base, autoHeight: true })
    );
    act(() => result.current.onHeaderLayout(layout(0)));
    expect(result.current.heroHeight).toBe(300);
  });
});
