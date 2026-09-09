import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import {
  ParallaxHeader,
  type ParallaxHeaderHandle,
  type TabItem,
} from '@ramijd/parallax-header-tabs';
import { BodyScreen, HeaderButton, isBodyEmpty } from '../layout';
import { INITIAL_TABS, SUB_TABS, THEME } from './demoData';

/** What the launcher hands every header screen. */
export interface HeaderScreenProps {
  onBack: () => void;
}

export interface SpeciesFrameProps extends HeaderScreenProps {
  /** The hero — the only thing the three screens disagree about. */
  header: ReactNode;
  /** Left off by the screens that let the hero measure itself. */
  headerHeight?: number;
}

/**
 * Everything the three header screens share: the tabs, the body screens, the
 * sticky banner, the top-strip controls and the scroll-to-top footer. Each
 * screen supplies its own hero and, if it wants one, a height for it.
 */
export const SpeciesFrame = ({
  header,
  headerHeight,
  onBack,
}: SpeciesFrameProps) => {
  const ref = useRef<ParallaxHeaderHandle>(null);
  const [tabs, setTabs] = useState(INITIAL_TABS);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSubTab, setActiveSubTab] = useState('pending');
  const [rows, setRows] = useState(20);
  const [refreshing, setRefreshing] = useState(false);

  const onEndReached = useCallback(() => {
    // Every other body screen is a fixed length, so only this one pages.
    if (activeTab !== 'population') return;
    setRows((n) => Math.min(n + 20, 120));
  }, [activeTab]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  }, []);

  const onTabChange = useCallback((tab: TabItem) => {
    setActiveTab(tab.key);
    // The scroll offset is shared by every body screen, so a short one opened
    // after a long scroll would otherwise start below its own content.
    ref.current?.scrollToTop(false);
  }, []);

  return (
    <ParallaxHeader
      ref={ref}
      theme={THEME}
      title="Panthera tigris"
      headerHeight={headerHeight}
      autoHeight
      parallaxFactor={0.5}
      stickyTopInset={0}
      tabs={tabs}
      activeTabKey={activeTab}
      onTabChange={onTabChange}
      subTabs={activeTab === 'medical' ? SUB_TABS : undefined}
      activeSubTabKey={activeSubTab}
      onSubTabChange={(tab) => setActiveSubTab(tab.key)}
      onTabsReorder={setTabs}
      // The "Incidents" tab has no data set behind it, so the header draws its
      // own empty state in place of the body — centred in what is left of the
      // screen below the bars, and still pullable to refresh. `emptyText`
      // changes the message; `renderEmpty` replaces the whole thing.
      empty={isBodyEmpty(activeTab)}
      onEndReached={onEndReached}
      refreshing={refreshing}
      onRefresh={onRefresh}
      // Pinned to the top strip: both stay put and stay tappable while the
      // hero collapses, and the banner fades its title in underneath them.
      headerLeft={<HeaderButton icon="back" label="Go back" onPress={onBack} />}
      headerRight={
        <HeaderButton
          icon="more"
          label="More options"
          onPress={() => Alert.alert('More', 'Would open an action sheet.')}
        />
      }
      header={header}
      footer={
        <TouchableOpacity
          style={styles.fab}
          onPress={() => ref.current?.scrollToTop()}
        >
          <Text style={styles.fabText}>Top</Text>
        </TouchableOpacity>
      }
    >
      {/* The body is plain `children` — one screen per tab, all of them in
          `src/layout`. */}
      <BodyScreen tab={activeTab} subTab={activeSubTab} rows={rows} />
    </ParallaxHeader>
  );
};

const styles = StyleSheet.create({
  fab: {
    alignSelf: 'flex-end',
    margin: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#24595f',
  },
  fabText: { color: '#fff', fontWeight: '600' },
});
