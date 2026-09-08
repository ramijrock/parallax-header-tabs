import { useCallback, useRef, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  HeaderCarousel,
  ParallaxHeader,
  type ParallaxHeaderHandle,
  type TabItem,
} from '@ramijd/parallax-header-tabs';
import { BodyScreen } from './layout';

const THEME = {
  background: '#f4f5f7',
  surface: '#ffffff',
  text: '#6b7280',
  activeText: '#24595f',
  indicator: '#24595f',
  bannerBackground: 'rgba(17,24,39,0.92)',
};

const INITIAL_TABS: TabItem[] = [
  { key: 'overview', title: 'Overview' },
  { key: 'population', title: 'Population' },
  { key: 'housing', title: 'Housing' },
  { key: 'medical', title: 'Medical' },
  { key: 'diet', title: 'Diet' },
  { key: 'taxonomy', title: 'Taxonomy' },
];

const SUB_TABS: TabItem[] = [
  { key: 'pending', title: 'Pending' },
  { key: 'approved', title: 'Approved' },
];

const GALLERY = [
  'https://picsum.photos/id/1074/900/600',
  'https://picsum.photos/id/1025/900/600',
  'https://picsum.photos/id/1062/900/600',
  'https://picsum.photos/id/1084/900/600',
];

export default function App() {
  const ref = useRef<ParallaxHeaderHandle>(null);
  const [tabs, setTabs] = useState(INITIAL_TABS);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSubTab, setActiveSubTab] = useState('pending');
  const [rows, setRows] = useState(20);
  const [refreshing, setRefreshing] = useState(false);
  const [tagged, setTagged] = useState(false);

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
    <SafeAreaView style={styles.flex}>
      <ParallaxHeader
        ref={ref}
        theme={THEME}
        title="Panthera tigris"
        headerHeight={280}
        // Grows past 450 when the hero content outruns it — every offset follows.
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
        onEndReached={onEndReached}
        refreshing={refreshing}
        onRefresh={onRefresh}
        header={
          <View style={styles.hero}>
            {/* Swipe it, or let it advance on its own. */}
            <HeaderCarousel
              images={GALLERY}
              style={StyleSheet.absoluteFill}
              autoPlay
              interval={3500}
              // Five dots at most; a longer run slides a window and the pill
              // keeps the real position readable.
              maxDots={5}
              showCounter
              paginationStyle={styles.heroDots}
            />
            <View style={styles.heroScrim} pointerEvents="none" />
            <View style={styles.heroBody}>
              <Text style={styles.heroKicker}>SPECIES</Text>
              <Text style={styles.heroTitle}>Panthera tigris</Text>
              <Text style={styles.heroSub}>Bengal tiger</Text>
              <TouchableOpacity
                onPress={() => setTagged((t) => !t)}
                style={styles.toggle}
              >
                <Text style={styles.toggleText}>
                  {tagged ? 'Hide tag row' : 'Show tag row'}
                </Text>
              </TouchableOpacity>
              {tagged ? (
                <View style={styles.tagRow}>
                  {['Endangered', 'CITES I', 'Breeding'].map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        }
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f4f5f7' },
  // `flex: 1` is what makes the hero fill a `headerHeight` taller than its own
  // content — without it the carousel stops at the content's height and the
  // rest of the hero is bare background. `minHeight` still floors it when
  // `headerHeight` is left off and `autoHeight` sizes from the content.
  hero: { flex: 1, minHeight: 280, justifyContent: 'flex-end' },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  heroBody: { padding: 20, paddingBottom: 28 },
  heroKicker: { color: '#e5e7eb', fontSize: 12, letterSpacing: 2 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '700', marginTop: 4 },
  heroSub: { color: '#e5e7eb', fontSize: 14, fontStyle: 'italic' },
  // Bottom right, clear of the hero copy on the left.
  heroDots: { bottom: 16, justifyContent: 'flex-end', paddingRight: 16 },
  toggle: {
    marginTop: 14,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  toggleText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  tagRow: { flexDirection: 'row', marginTop: 14, flexWrap: 'wrap' },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: { color: '#fff', fontSize: 12 },
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
