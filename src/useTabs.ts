import { useCallback, useEffect, useRef, useState } from 'react';
import type { TabItem } from './types';

export interface TabsState {
  activeKey: string | undefined;
  activeIndex: number;
  select: (key: string) => void;
}

/**
 * One source of truth for which tab is active.
 *
 * Pass `controlledKey` and the caller owns it outright; leave it off and the
 * component does, seeded from `defaultKey` or the first tab. Selection is
 * never written onto the tab objects, so a caller rebuilding its `tabs` array
 * inline on every render — the usual case — cannot clobber it, and there is no
 * second copy to fall out of step.
 */
export const useTabs = (
  tabs: TabItem[],
  controlledKey: string | undefined,
  defaultKey: string | undefined,
  onChange?: (tab: TabItem, index: number) => void
): TabsState => {
  const isControlled = controlledKey !== undefined;
  const [ownKey, setOwnKey] = useState<string | undefined>(
    () => defaultKey ?? tabs[0]?.key
  );

  // Keep an uncontrolled selection pointing at a tab that still exists — a
  // permission change or a filtered list can remove the active one.
  useEffect(() => {
    if (isControlled || tabs.length === 0) return;
    setOwnKey((prev) =>
      prev != null && tabs.some((tab) => tab.key === prev) ? prev : tabs[0]?.key
    );
  }, [isControlled, tabs]);

  const activeKey = isControlled ? controlledKey : ownKey;
  const activeIndex = tabs.findIndex((tab) => tab.key === activeKey);

  // Read through a ref so `select` stays referentially stable; it is handed to
  // memoised rows and to the imperative handle.
  const latest = useRef({ tabs, activeKey, isControlled, onChange });
  latest.current = { tabs, activeKey, isControlled, onChange };

  const select = useCallback((key: string) => {
    const {
      tabs: list,
      activeKey: current,
      isControlled: controlled,
      onChange: cb,
    } = latest.current;
    const index = list.findIndex((tab) => tab.key === key);
    if (index === -1 || key === current) return;
    if (!controlled) setOwnKey(key);
    cb?.(list[index]!, index);
  }, []);

  return { activeKey, activeIndex, select };
};
