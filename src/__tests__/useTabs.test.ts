import { renderHook, act } from '@testing-library/react-native';
import { useTabs, type TabsState } from '../useTabs';
import type { TabItem } from '../types';

const tabs: TabItem[] = [
  { key: 'a', title: 'A' },
  { key: 'b', title: 'B' },
  { key: 'c', title: 'C' },
];

describe('useTabs', () => {
  it('defaults to the first tab', () => {
    const { result } = renderHook(() => useTabs(tabs, undefined, undefined));
    expect(result.current.activeKey).toBe('a');
    expect(result.current.activeIndex).toBe(0);
  });

  it('honours defaultKey', () => {
    const { result } = renderHook(() => useTabs(tabs, undefined, 'b'));
    expect(result.current.activeKey).toBe('b');
  });

  it('selects and reports the tab with its index', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useTabs(tabs, undefined, undefined, onChange)
    );
    act(() => result.current.select('c'));
    expect(result.current.activeKey).toBe('c');
    expect(onChange).toHaveBeenCalledWith(tabs[2], 2);
  });

  it('ignores an unknown key', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useTabs(tabs, undefined, undefined, onChange)
    );
    act(() => result.current.select('nope'));
    expect(result.current.activeKey).toBe('a');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not re-report the tab already active', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useTabs(tabs, undefined, undefined, onChange)
    );
    act(() => result.current.select('a'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('leaves state alone when controlled, but still reports', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useTabs(tabs, 'b', undefined, onChange)
    );
    act(() => result.current.select('c'));
    // The caller owns the value, so it has not moved until they move it.
    expect(result.current.activeKey).toBe('b');
    expect(onChange).toHaveBeenCalledWith(tabs[2], 2);
  });

  it('survives the caller rebuilding the array every render', () => {
    const { result, rerender } = renderHook<TabsState, { list: TabItem[] }>(
      ({ list }) => useTabs(list, undefined, undefined),
      { initialProps: { list: [...tabs] } }
    );
    act(() => result.current.select('c'));
    // A fresh array of equal tabs — exactly what an inline .map() produces.
    rerender({ list: tabs.map((tab) => ({ ...tab })) });
    expect(result.current.activeKey).toBe('c');
  });

  it('falls back to the first tab when the active one disappears', () => {
    const { result, rerender } = renderHook<TabsState, { list: TabItem[] }>(
      ({ list }) => useTabs(list, undefined, undefined),
      { initialProps: { list: tabs } }
    );
    act(() => result.current.select('c'));
    rerender({ list: [tabs[0]!, tabs[1]!] });
    expect(result.current.activeKey).toBe('a');
  });

  it('keeps select referentially stable across renders', () => {
    const { result, rerender } = renderHook<TabsState, { list: TabItem[] }>(
      ({ list }) => useTabs(list, undefined, undefined),
      { initialProps: { list: tabs } }
    );
    const first = result.current.select;
    rerender({ list: tabs.map((tab) => ({ ...tab })) });
    expect(result.current.select).toBe(first);
  });
});
