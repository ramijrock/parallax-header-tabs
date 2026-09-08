import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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

const sameOrder = (a: TabItem[], b: TabItem[]) =>
  a.length === b.length && a.every((tab, index) => tab.key === b[index]?.key);

/**
 * Full tab list for when the strip is too crowded to scan.
 *
 * Built on React Native's own Modal, so nothing extra is needed to install
 * this package. Reordering, when enabled, is staged in a working copy and only
 * published on close — the visible bar never rearranges under the finger. For
 * true drag and drop, hand `renderTabList` your own list; the package stays
 * free of a gesture dependency either way.
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
      setDraft((prev) => {
        const next = prev.slice();
        const [moved] = next.splice(from, 1);
        if (moved) next.splice(to, 0, moved);
        return next;
      });
    },
    [draft.length, onFeedback]
  );

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
            <ScrollView showsVerticalScrollIndicator={false}>
              {draft.map((tab, index) => {
                const isActive = tab.key === activeKey;
                return (
                  <View key={tab.key} style={styles.row}>
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
                    {reorderable ? (
                      <View style={styles.moveGroup}>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={`Move ${tab.title} up`}
                          disabled={index === 0}
                          onPress={() => move(index, index - 1)}
                          style={styles.moveButton}
                        >
                          <Text
                            style={[
                              styles.moveGlyph,
                              {
                                color: index === 0 ? theme.border : theme.text,
                              },
                            ]}
                          >
                            {'▲'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={`Move ${tab.title} down`}
                          disabled={index === draft.length - 1}
                          onPress={() => move(index, index + 1)}
                          style={styles.moveButton}
                        >
                          <Text
                            style={[
                              styles.moveGlyph,
                              {
                                color:
                                  index === draft.length - 1
                                    ? theme.border
                                    : theme.text,
                              },
                            ]}
                          >
                            {'▼'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
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
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  item: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  itemText: { fontSize: 15, fontWeight: '500' },
  moveGroup: { marginLeft: 8 },
  moveButton: { paddingHorizontal: 10, paddingVertical: 2 },
  moveGlyph: { fontSize: 12 },
});
