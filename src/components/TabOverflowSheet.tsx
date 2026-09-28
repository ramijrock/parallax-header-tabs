import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import type {
  ParallaxHeaderProps,
  ParallaxHeaderTheme,
  TabItem,
} from '../types';

export interface TabOverflowSheetProps {
  visible: boolean;
  onClose: () => void;
  tabs: TabItem[];
  activeKey?: string;
  onSelect: (key: string) => void;
  onTabsReorder?: (tabs: TabItem[]) => void;
  renderTabList?: ParallaxHeaderProps['renderTabList'];
  theme: ParallaxHeaderTheme;
  onFeedback?: () => void;
}

const ROW_GAP = 8;
const SHIFT_DURATION = 150;

const sameOrder = (a: TabItem[], b: TabItem[]) =>
  a.length === b.length && a.every((tab, index) => tab.key === b[index]?.key);

const reorder = (list: TabItem[], from: number, to: number) => {
  const next = list.slice();
  const [moved] = next.splice(from, 1);
  if (moved) next.splice(to, 0, moved);
  return next;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

interface DragHandleProps {
  index: number;
  count: number;
  title: string;
  color: string;
  /** Moves the row by one, for a screen reader, which cannot drag. */
  onStep: (from: number, to: number) => void;
  onStart: (index: number) => void;
  onMove: (dy: number) => void;
  onEnd: () => void;
}

/**
 * The grip a row is dragged by. Only the grip starts a drag, so the rest of
 * the row still takes a tap and the list still scrolls under a finger that
 * lands anywhere else.
 */
const DragHandle = ({
  index,
  count,
  title,
  color,
  onStep,
  onStart,
  onMove,
  onEnd,
}: DragHandleProps) => {
  // Read through a ref: the responder is built once, and the row's index
  // changes under it with every drop.
  const latest = useRef({ index, onStart, onMove, onEnd });
  latest.current = { index, onStart, onMove, onEnd };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      // Held to the end, so the scroll view cannot take the gesture over
      // halfway through a drag.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => latest.current.onStart(latest.current.index),
      onPanResponderMove: (_, gesture) => latest.current.onMove(gesture.dy),
      onPanResponderRelease: () => latest.current.onEnd(),
      onPanResponderTerminate: () => latest.current.onEnd(),
    })
  ).current;

  // A screen reader cannot drag, so the grip offers the same move as two
  // actions instead — nothing extra on screen, and the list stays reorderable
  // by VoiceOver and TalkBack.
  const actions = [
    ...(index > 0 ? [{ name: 'moveUp', label: 'Move up' }] : []),
    ...(index < count - 1 ? [{ name: 'moveDown', label: 'Move down' }] : []),
  ];

  return (
    <View
      {...responder.panHandlers}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Reorder ${title}`}
      accessibilityHint="Drag to move"
      accessibilityActions={actions}
      onAccessibilityAction={(event) => {
        const step = event.nativeEvent.actionName === 'moveUp' ? -1 : 1;
        onStep(index, index + step);
      }}
      style={styles.handle}
    >
      {/* Drawn rather than typeset, so no icon font is required. */}
      {[0, 1, 2].map((line) => (
        <View key={line} style={styles.gripLine}>
          <View style={[styles.gripDot, { backgroundColor: color }]} />
          <View style={[styles.gripDot, { backgroundColor: color }]} />
        </View>
      ))}
    </View>
  );
};

/**
 * Full tab list for when the strip is too crowded to scan.
 *
 * Built on React Native's own Modal, so nothing extra is needed to install
 * this package. Reordering, when enabled, is staged in a working copy and only
 * published on close — the visible bar never rearranges under the finger.
 * Rows are dragged by the grip on their left, on React Native's own
 * `PanResponder`, so the package stays free of a gesture dependency; a screen
 * reader moves them through the grip's accessibility actions. Hand
 * `renderTabList` your own list to replace all of it.
 */
export const TabOverflowSheet = ({
  visible,
  onClose,
  tabs,
  activeKey,
  onSelect,
  onTabsReorder,
  renderTabList,
  theme,
  onFeedback,
}: TabOverflowSheetProps) => {
  const reorderable = typeof onTabsReorder === 'function';
  const [draft, setDraft] = useState<TabItem[]>(tabs);

  // Re-seed whenever the sheet opens, so a staged order never outlives it.
  useEffect(() => {
    if (visible) setDraft(tabs);
  }, [visible, tabs]);

  const commit = useCallback(
    (next: TabItem[]) => {
      if (!reorderable || sameOrder(next, tabs)) return;
      onTabsReorder?.(next);
    },
    [reorderable, tabs, onTabsReorder]
  );

  const close = useCallback(() => {
    commit(draft);
    onClose();
  }, [commit, draft, onClose]);

  const select = useCallback(
    (tab: TabItem) => {
      onSelect(tab.key);
      onClose();
    },
    [onSelect, onClose]
  );

  const move = useCallback(
    (from: number, to: number) => {
      if (to < 0 || to >= draft.length) return;
      onFeedback?.();
      setDraft((prev) => reorder(prev, from, to));
    },
    [draft.length, onFeedback]
  );

  // ── Drag and drop ──────────────────────────────────────────────────────
  // The lifted row follows the finger; the rows it passes step aside by one
  // row. Nothing is reordered until the drop, so a drag is one state change
  // rather than one per row crossed.
  const draftRef = useRef(draft);
  draftRef.current = draft;
  // Every row is one line tall, so one measurement spaces them all.
  const rowHeight = useRef(0);
  const drag = useRef<{ from: number; hover: number } | null>(null);
  const dragY = useRef(new Animated.Value(0)).current;
  const shifts = useRef(new Map<string, Animated.Value>()).current;
  const [draggingKey, setDraggingKey] = useState<string | null>(null);

  const shiftFor = useCallback(
    (key: string) => {
      let value = shifts.get(key);
      if (!value) {
        value = new Animated.Value(0);
        shifts.set(key, value);
      }
      return value;
    },
    [shifts]
  );

  const onRowLayout = useCallback((event: LayoutChangeEvent) => {
    rowHeight.current = event.nativeEvent.layout.height + ROW_GAP;
  }, []);

  const startDrag = useCallback(
    (index: number) => {
      const tab = draftRef.current[index];
      if (!tab || rowHeight.current <= 0) return;
      drag.current = { from: index, hover: index };
      dragY.setValue(0);
      setDraggingKey(tab.key);
      onFeedback?.();
    },
    [dragY, onFeedback]
  );

  const moveDrag = useCallback(
    (dy: number) => {
      const current = drag.current;
      const height = rowHeight.current;
      if (!current || height <= 0) return;
      const list = draftRef.current;
      // Held inside the list, so a row cannot be dragged off either end.
      const y = clamp(
        dy,
        -current.from * height,
        (list.length - 1 - current.from) * height
      );
      dragY.setValue(y);

      const hover = clamp(
        current.from + Math.round(y / height),
        0,
        list.length - 1
      );
      if (hover === current.hover) return;
      current.hover = hover;
      onFeedback?.();
      list.forEach((tab, index) => {
        if (index === current.from) return;
        const toValue =
          index > current.from && index <= hover
            ? -height
            : index < current.from && index >= hover
              ? height
              : 0;
        Animated.timing(shiftFor(tab.key), {
          toValue,
          duration: SHIFT_DURATION,
          useNativeDriver: false,
        }).start();
      });
    },
    [dragY, onFeedback, shiftFor]
  );

  const endDrag = useCallback(() => {
    const current = drag.current;
    drag.current = null;
    if (!current) return;
    if (current.hover !== current.from) {
      setDraft((prev) => reorder(prev, current.from, current.hover));
    }
    setDraggingKey(null);
  }, []);

  // Zeroed only once the drop has rendered. By then no row is bound to these
  // values any more, so the reset cannot pull a row back to its old place for
  // a frame before the new order lands.
  useLayoutEffect(() => {
    if (draggingKey !== null) return;
    dragY.setValue(0);
    shifts.forEach((value) => {
      value.stopAnimation();
      value.setValue(0);
    });
  }, [draggingKey, dragY, shifts]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <Pressable style={styles.backdrop} onPress={close}>
        {/* Swallow taps inside the card so only the backdrop dismisses. */}
        <Pressable
          style={[styles.card, { backgroundColor: theme.overlay }]}
          onPress={() => {}}
        >
          {renderTabList ? (
            renderTabList({
              tabs: draft,
              activeKey,
              select,
              commit: setDraft,
              close,
            })
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              scrollEnabled={draggingKey === null}
            >
              {draft.map((tab, index) => {
                const isActive = tab.key === activeKey;
                const isDragged = tab.key === draggingKey;
                return (
                  <Animated.View
                    key={tab.key}
                    onLayout={index === 0 ? onRowLayout : undefined}
                    style={[
                      styles.row,
                      // Moved only while a drag is live; at rest a row has no
                      // transform at all, so a drop cannot leave one behind.
                      draggingKey === null
                        ? null
                        : {
                            transform: [
                              {
                                translateY: isDragged
                                  ? dragY
                                  : shiftFor(tab.key),
                              },
                            ],
                          },
                      isDragged
                        ? [styles.rowLifted, { backgroundColor: theme.overlay }]
                        : null,
                    ]}
                  >
                    {reorderable ? (
                      <DragHandle
                        index={index}
                        count={draft.length}
                        title={tab.title}
                        color={theme.text}
                        onStep={move}
                        onStart={startDrag}
                        onMove={moveDrag}
                        onEnd={endDrag}
                      />
                    ) : null}
                    <TouchableOpacity
                      accessibilityRole="menuitem"
                      accessibilityState={{ selected: isActive }}
                      onPress={() => select(tab)}
                      style={[styles.item, { borderColor: theme.border }]}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.itemText,
                          { color: isActive ? theme.activeText : theme.text },
                        ]}
                      >
                        {tab.title}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxHeight: '60%',
    borderRadius: 12,
    padding: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: ROW_GAP },
  // Over the rows it passes, and opaque, so they do not show through it.
  rowLifted: { zIndex: 1, elevation: 4, borderRadius: 8 },
  handle: { paddingRight: 10, paddingVertical: 8, justifyContent: 'center' },
  gripLine: { flexDirection: 'row', marginVertical: 1.5 },
  gripDot: { width: 3, height: 3, borderRadius: 1.5, marginHorizontal: 1.5 },
  item: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  itemText: { fontSize: 15, fontWeight: '500' },
});
