# @ramijd/parallax-header-tabs

A collapsing parallax header with a sticky tab bar, sub-tabs and an overflow
sheet — for **Expo and React Native CLI alike**.

No native modules, no config plugin, no babel plugin. The only peers are
`react` and `react-native`, so it drops into Expo Go and a bare CLI app the
same way.

```sh
npm install @ramijd/parallax-header-tabs
# or
yarn add @ramijd/parallax-header-tabs
```

## Quick start

```tsx
import { ParallaxHeader, type TabItem } from '@ramijd/parallax-header-tabs';

const tabs: TabItem[] = [
  { key: 'overview', title: 'Overview' },
  { key: 'population', title: 'Population' },
  { key: 'medical', title: 'Medical' },
];

export default function Screen() {
  const [active, setActive] = useState('overview');

  return (
    <ParallaxHeader
      title="Panthera tigris"
      header={<Hero />}
      headerHeight={280}
      tabs={tabs}
      activeTabKey={active}
      onTabChange={(tab) => setActive(tab.key)}
    >
      <Body tab={active} />
    </ParallaxHeader>
  );
}
```

## How the layout works

Everything derives from one number, so the pieces cannot disagree:

```
resting                      collapsed
┌────────────────┐           ┌────────────────┐
│                │           │  tab bar       │ ← stickyTopInset
│   hero         │  heroHeight
│                │           │  sub tab bar   │
├────────────────┤           ├────────────────┤
│  tab bar       │  tabBarHeight
├────────────────┤           │                │
│  sub tab bar   │           │   body         │
├────────────────┤           │                │
│  body          │           │                │
```

- `collapseDistance = heroHeight − stickyTopInset`
- both bars translate by exactly `−collapseDistance`, so they arrive together
- the body reserves `heroHeight + tabBarHeight + (subTabHeight)`
- the hero travels at `parallaxFactor` of the scroll, and the body — which is
  opaque — slides over it

Set `autoHeight` and the hero is measured instead: the configured
`headerHeight` becomes a floor, and every offset above follows the measured
value. That is the whole answer to "the tag row is clipped on tablets" — no
per-screen constants, and it works on phones too.

Leave `headerHeight` off as well and there is no floor: the hero is exactly
what its content measures. That is the one to use when the hero is a
`HeaderCarousel` under `absoluteFill` — it takes the content's height rather
than being stranded inside a default nobody chose.

Set a `headerHeight` taller than the hero content and give the hero's root
`flexGrow: 1`:

```tsx
<ParallaxHeader
  headerHeight={450}
  autoHeight
  header={
    <View style={{ flexGrow: 1, justifyContent: 'flex-end' }}>
      <HeaderCarousel images={gallery} style={StyleSheet.absoluteFill} />
      {/* … */}
    </View>
  }
/>
```

Flexbox stretches a child across but never down, so without it the root keeps
its own natural height: the carousel stops there and the rest of the 450 is
bare background. The 450 itself belongs in `headerHeight` and nowhere else —
the header floors the wrapper it measures with it, so `flexGrow` has the room
to grow into and the number is never repeated in a style. A `minHeight` of
your own is only for the no-`headerHeight` case above, where there is no floor
to inherit.

Use `flexGrow: 1` and not the `flex: 1` shorthand, which also sets
`flexBasis: 0`. With no `headerHeight` the hero is auto-height, so there is no
free space to grow back into and a `flex: 1` root collapses to its padding —
the header then measures far shorter than its content.

### A tab with nothing in it

Tell the header the body is empty and it draws the empty state in place of it,
centred in what is left of the screen below the bars. The hero, the tabs and
the collapse are untouched — it is the body that is empty, not the screen — and
because it sits inside the scroll view, pull to refresh still works on it.

```tsx
<ParallaxHeader
  tabs={tabs}
  activeTabKey={tab}
  onTabChange={(next) => setTab(next.key)}
  empty={rows.length === 0}
  emptyText="No data found"
>
  {rows.map((row) => (
    <Row key={row.id} {...row} />
  ))}
</ParallaxHeader>
```

Say `empty` outright whenever the body renders its own nothing — a
`<BodyScreen tab={tab} />` that returns `null` for a tab with no rows still
arrives here as one child, and nothing the header can read tells it what that
child will draw. Left unset, a body with no children at all counts as empty.

`renderEmpty` replaces the message with a view of your own — an illustration, a
"add the first record" button — and is handed the same space:

```tsx
renderEmpty={() => (
  <>
    <Text style={styles.emptyTitle}>No records yet</Text>
    <Button title="Add one" onPress={add} />
  </>
)}
```

### Controls that outlive the collapse

`headerLeft` and `headerRight` sit on the top strip — the band the collapsed
banner occupies, `stickyTopInset + bannerHeight` tall. They are drawn above
both the hero and the banner and never move, so a back button stays visible
and tappable whether the header is open or collapsed, while the banner fades
its centred title in underneath. Put them in the hero instead and the parallax
carries them off screen; put them in `renderBanner` and they only exist once
collapsed.

```tsx
<ParallaxHeader
  title="Panthera tigris"
  stickyTopInset={insets.top}
  headerLeft={<BackButton onPress={navigation.goBack} />}
  headerRight={<MoreButton onPress={openSheet} />}
/>
```

The gap between them is transparent to touches (`pointerEvents="box-none"`),
so the hero underneath still takes a swipe.

## Props

### Header

| Prop             | Type        | Default |                                                                          |
| ---------------- | ----------- | ------- | ------------------------------------------------------------------------ |
| `header`         | `ReactNode` | —       | Expanded hero content                                                    |
| `headerHeight`   | `number`    | `300`   | Hero height, or its floor with `autoHeight` — omit it there for no floor |
| `autoHeight`     | `boolean`   | `false` | Measure the hero and grow past `headerHeight`                            |
| `headerLeft`     | `ReactNode` | —       | Pinned left of the top strip — a back button                             |
| `headerRight`    | `ReactNode` | —       | Pinned right of the same strip — a "more" control                        |
| `parallaxFactor` | `number`    | `0.5`   | `0` pins the hero, `1` scrolls it at full speed                          |
| `stickyTopInset` | `number`    | `0`     | Where collapsed chrome rests — safe area + nav bar (see `/safe-area`)    |
| `tabBarHeight`   | `number`    | `48`    |                                                                          |

### Tabs

| Prop                                                                  | Type                   |                                             |
| --------------------------------------------------------------------- | ---------------------- | ------------------------------------------- |
| `tabs`                                                                | `TabItem[]`            | `{ key, title, icon?, activeIcon?, data? }` |
| `activeTabKey`                                                        | `string`               | Controlled selection                        |
| `defaultTabKey`                                                       | `string`               | Initial selection when uncontrolled         |
| `onTabChange`                                                         | `(tab, index) => void` |                                             |
| `subTabs` / `activeSubTabKey` / `defaultSubTabKey` / `onSubTabChange` |                        | Same shape, second row                      |

### Body and chrome

| Prop                       | Type                           |                                                                             |
| -------------------------- | ------------------------------ | --------------------------------------------------------------------------- |
| `children`                 | `ReactNode`                    | Scrolling body                                                              |
| `footer`                   | `ReactNode`                    | Pinned above the scroll view                                                |
| `empty`                    | `boolean`                      | Draw the empty state instead of the body                                    |
| `emptyText`                | `string`                       | Its message, `No data found` by default                                     |
| `renderEmpty`              | `() => ReactNode`              | Replaces the empty state entirely                                           |
| `renderScrollComponent`    | render prop                    | Own the body's scroller — a `FlatList` that really virtualises              |
| `title`                    | `string`                       | Shown in the collapsed banner                                               |
| `bannerHeight`             | `number`                       | Banner height, `48` by default. The pinned tab bar sits directly beneath it |
| `renderBanner`             | `() => ReactNode`              | Replaces the banner body                                                    |
| `BannerBackground`         | `ComponentType`                | Pass Expo's `BlurView` for frosted glass                                    |
| `onBannerVisibilityChange` | `(visible) => void`            | Fires on the crossing only                                                  |
| `theme`                    | `Partial<ParallaxHeaderTheme>` |                                                                             |

### Scrolling

| Prop                       | Type                  | Default |                                         |
| -------------------------- | --------------------- | ------- | --------------------------------------- |
| `onEndReached`             | `() => void`          | —       | Once per approach, drag **or** momentum |
| `onEndReachedThreshold`    | `number`              | `120`   | px from the bottom                      |
| `refreshing` / `onRefresh` |                       |         | Pull to refresh, both platforms         |
| `onScroll`                 | `(y: number) => void` |         |                                         |

### Overflow sheet

| Prop                | Type             | Default |                                            |
| ------------------- | ---------------- | ------- | ------------------------------------------ |
| `overflowThreshold` | `number`         | `4`     | Show the list button past this many tabs   |
| `onTabsReorder`     | `(tabs) => void` | —       | Enables reordering; published on close     |
| `renderTabList`     | render prop      | —       | Swap in your own list — drag and drop, say |

### Ref

```ts
ref.current?.setTab('medical');
ref.current?.setSubTab('approved');
ref.current?.scrollToTab('medical'); // centre it, keep the selection
ref.current?.scrollTo(400);
ref.current?.scrollToTop();
```

## Header carousel

`HeaderCarousel` slides through several images inside the hero. It is a plain
component, so it composes with anything else you put there — pass a scrim or a
title as children and they ride above the images.

Hand it a single image and it stops being a carousel: the picture is drawn on
its own, with no scroll container, no dots, no counter and no autoplay, so
nothing invites a swipe that would do nothing. The same code path therefore
serves a gallery and a lone photo.

```tsx
import { HeaderCarousel, ParallaxHeader } from '@ramijd/parallax-header-tabs';

<ParallaxHeader
  headerHeight={280}
  header={
    <View style={{ flexGrow: 1, justifyContent: 'flex-end' }}>
      <HeaderCarousel
        images={[uriA, uriB, require('./local.jpg')]}
        style={StyleSheet.absoluteFill}
        autoPlay
      />
      <Text style={{ color: '#fff', padding: 20 }}>Panthera tigris</Text>
    </View>
  }
>
  {body}
</ParallaxHeader>;
```

| Prop                                | Type                                | Default           |                                                           |
| ----------------------------------- | ----------------------------------- | ----------------- | --------------------------------------------------------- |
| `images`                            | `(string \| ImageSourcePropType)[]` | —                 | A URL string is accepted as is                            |
| `height`                            | `number`                            | —                 | Omit to size from `style`                                 |
| `aspectRatio`                       | `number`                            | —                 | Size from the width, e.g. `16 / 9`; ignored with `height` |
| `autoPlay`                          | `boolean`                           | `false`           |                                                           |
| `interval`                          | `number`                            | `4000`            | ms each image is held                                     |
| `loop`                              | `boolean`                           | `true`            | Wrap from the last image back to the first                |
| `initialIndex`                      | `number`                            | `0`               |                                                           |
| `onIndexChange`                     | `(index) => void`                   | —                 | On a settled slide, not mid-drag                          |
| `showPagination`                    | `boolean`                           | `true`            | Dots, hidden for a single image                           |
| `maxDots`                           | `number`                            | `5`               | Longer runs slide a window of this many                   |
| `showCounter`                       | `boolean`                           | auto              | The `3 / 12` pill; on once the images outnumber `maxDots` |
| `dotColor` / `activeDotColor`       | `string`                            | white-ish / white |                                                           |
| `paginationStyle`                   | `ViewStyle`                         | —                 | Moves the dot row off the bottom centre                   |
| `counterStyle` / `counterTextStyle` | style                               | —                 | The pill and its label                                    |

### Letting the picture set the header height

Under `absoluteFill` the carousel is out of flow, so it reports no height of
its own: with `autoHeight` the header measures whatever copy is laid over the
images and crops them to that. Put the strip in flow with an `aspectRatio`
instead and the picture decides, uncropped, with no `headerHeight` anywhere:

```tsx
<ParallaxHeader
  autoHeight
  header={
    <View>
      <HeaderCarousel images={gallery} aspectRatio={3 / 2} autoPlay />
      {/* Absolute, so the copy rides over the picture and adds no height. */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <Text style={{ color: '#fff', padding: 20 }}>Panthera tigris</Text>
      </View>
    </View>
  }
>
  {body}
</ParallaxHeader>
```

| `resizeMode` | `ImageProps['resizeMode']` | `'cover'` | |
| `children` | `ReactNode` | — | Drawn over the images |

Slide width comes from a measurement rather than `Dimensions`, so paging stays
true in a padded hero, on a split screen and after a rotation. A drag suspends
autoplay until the finger lifts, and `ref.current?.scrollToIndex(2)` drives it
by hand.

Twelve images do not mean twelve dots. Past `maxDots` the row slides a window
along, centred on the current image and pinned at either end, and the dots at
an end with more beyond it are drawn small. The counter pill carries the real
position, so nothing is lost to the cap. Both sit bottom centre by default —
move them with `paginationStyle`:

```tsx
<HeaderCarousel
  images={gallery}
  maxDots={5}
  showCounter
  paginationStyle={{ bottom: 16, justifyContent: 'flex-end', paddingRight: 16 }}
/>
```

## A FlatList as the body

`children` go inside the package's `ScrollView`, so a `FlatList` in there is a
list nested in a scroll view: React Native warns about it, and it is right to
— the outer view has no bounded height to virtualise against, so every row is
rendered and kept, and `windowSize`, `initialNumToRender` and
`removeClippedSubviews` all stop meaning anything. On a long list that is the
whole cost of the screen.

The fix is not to nest at all: make the list _be_ the scroller.
`renderScrollComponent` hands you the very props the built-in `ScrollView`
gets — spread them onto an `Animated.FlatList` and it drives the header
itself.

```tsx
import { Animated } from 'react-native';

<ParallaxHeader
  header={<Hero />}
  headerHeight={300}
  tabs={tabs}
  title="Panthera tigris"
  stickyTopInset={insets.top}
  onRefresh={refetch}
  refreshing={isRefetching}
  onEndReached={loadMore}
  renderScrollComponent={({ scrollProps, emptyComponent }) => (
    <Animated.FlatList
      {...scrollProps}
      data={rows}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <Row item={item} />}
      ListEmptyComponent={emptyComponent}
      windowSize={9}
      removeClippedSubviews
    />
  )}
/>;
```

Nothing about the layout changes, because nothing about the layout ever
depended on the scroller: the hero, the bars and the banner are absolutely
positioned **siblings** of it, never children. Only what scrolls is swapped.

Four things to keep:

- **`Animated.FlatList`**, not `FlatList`. `onScroll` is a native-driven
  `Animated.event`, and a plain component cannot take one.
- **spread, do not pick**. `contentContainerStyle` carries the space the hero
  and the bars reserve; drop it and the first row hides under them.
- **`ListEmptyComponent={emptyComponent}`** keeps the empty state you already
  had, sized to the space below the bars. `empty`, `emptyText` and
  `renderEmpty` all still feed it.
- **`children` is ignored** while this is set. The list owns the body.

`onEndReached`, `onRefresh`, `onScroll`, the banner and `ref.scrollToTop()`
all keep working — the ref reaches a list by offset and a scroll view by
point, whichever is behind it. The list's own `onEndReached` is yours to use
as well; the two do not collide.

A `SectionList` works the same way through `Animated.SectionList`, as does any
scrollable that takes `ScrollView` props — a `FlashList`, a reanimated list.

## A pager for the body

`react-native-pager-view` cannot go inside the body's scroll view either: it
needs a bounded height, and a vertical scroll view gives it none. It goes
where the list goes — as the scroller itself, one `Animated.FlatList` per
page.

Two things the package cannot do for you, because they are about pages it
knows nothing of:

1. **one ref per page**, so you can scroll each one. Spread `scrollProps`
   first and put your own `ref` after it.
2. **bring a page into step on arrival.** Every page shares one `scrollY`, so
   a page still at the top while the header is collapsed would jump. Clamp the
   others to `collapseDistance` when the page changes.

```tsx
const pages = tabs.map(() => useRef<FlatList<Row>>(null)); // or a ref map
const offset = useRef(0);

<ParallaxHeader
  tabs={tabs}
  activeTabKey={tabs[page].key}
  onTabChange={(_, index) => pagerRef.current?.setPage(index)}
  onScroll={(y) => (offset.current = y)}
  renderScrollComponent={({ scrollProps, collapseDistance }) => (
    <PagerView
      ref={pagerRef}
      style={StyleSheet.absoluteFill}
      initialPage={0}
      onPageSelected={(e) => {
        const next = e.nativeEvent.position;
        setPage(next);
        // Everything the reader has not scrolled past is shared: bring the
        // page they land on up to the same collapse, no further.
        const y = Math.min(offset.current, collapseDistance);
        pages.forEach((r, i) => {
          if (i !== next)
            r.current?.scrollToOffset({ offset: y, animated: false });
        });
      }}
    >
      {tabs.map((tab, i) => (
        <View key={tab.key} collapsable={false}>
          <Animated.FlatList
            {...scrollProps}
            ref={pages[i]}
            data={dataFor(tab.key)}
            renderItem={({ item }) => <Row item={item} />}
          />
        </View>
      ))}
    </PagerView>
  )}
/>;
```

`scrollProps.onScroll` is safe to put on every page at once — whichever page
is on screen is the only one moving, so the header follows the page in view.
Overriding `scrollProps.ref` is what costs you `ref.scrollTo()` and
`ref.scrollToTop()` on the header: with pages of your own to scroll, call
`scrollToOffset` on the page you mean instead.

Without a pager, none of this applies — tabs swap the list's `data` and the
scroll position is simply kept, which is what the example app does.

## Safe area insets

`stickyTopInset` is yours to pass, so the main entry imports nothing native.
If the app already has
[`react-native-safe-area-context`](https://github.com/AppAndFlow/react-native-safe-area-context)
— Expo Router and React Navigation both bring it — import from `/safe-area`
instead and the inset is filled in for you:

```tsx
import { ParallaxHeader } from '@ramijd/parallax-header-tabs/safe-area';

<ParallaxHeader title="Panthera tigris" header={<Hero />} tabs={tabs} />;
```

It is the same component with one default changed: `stickyTopInset` becomes
the safe area's top inset. Everything else the main entry exports is
re-exported, so one import line covers the screen.

- **An explicit `stickyTopInset` still wins.** Under a navigator's own header,
  which already clears the notch, pass `stickyTopInset={0}`; with a fixed nav
  bar of your own, pass `insets.top + navBarHeight`.
- **No `SafeAreaProvider`, no crash.** The inset falls back to `0`, as it
  would from the main entry.
- **Why a separate entry.** An optional `require` inside `try` would not keep
  the main entry safe: stock Metro, unlike Expo's, refuses to bundle a module
  it cannot resolve. Only screens that import from `/safe-area` need the
  package installed; it is an optional peer.

## Bringing your own blur, icons and gestures

The package stays Expo-neutral by taking components rather than importing them.

```tsx
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

<ParallaxHeader
  BannerBackground={(p) => <BlurView intensity={80} tint="dark" {...p} />}
  onFeedback={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
  tabs={[
    {
      key: 'medical',
      title: 'Medical',
      icon: <Ionicons name="medkit" size={16} />,
    },
  ]}
/>;
```

Drag-and-drop reordering, if you want it, plugs into `renderTabList` — so
`react-native-draggable-flatlist` stays your dependency, not the package's.

## Migrating from the in-app ParallaxHeader

`@ramijd/parallax-header-tabs/compat` accepts the old prop names, mode flags
and title-based ref included:

```tsx
// before
import { ParallaxHeader } from '../../components/ParallaxHeader/ParallaxHeader';
// after
import { ParallaxHeader } from '@ramijd/parallax-header-tabs/compat';
```

Two things it needs from you, because the package has no store:

- pass your theme slice as `themeColors`
- pass `refreshing` / `onRefresh` instead of relying on a Redux refresh flag

The compat layer is a bridge, not a promise of pixel parity. The old component
placed each bar with a per-screen constant; here every offset derives from the
hero height. Check a screen once, then move it to the real API.

## What this fixes

Carried over from the component it replaces:

|                                |                                                                                                                                                                                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tabs hidden once pinned        | The banner and the pinned tab bar both came to rest at `stickyTopInset`, and the banner — drawn last — covered the tabs outright. The bar now pins at `stickyTopInset + bannerHeight`, and with no `title` and no `renderBanner` the banner reserves nothing and is not drawn at all. |
| Banner never faded             | `easing: () => 0.2` held the value flat for the full duration, then snapped. Now a real curve.                                                                                                                                                                                        |
| Doubled tab callbacks          | An identical `useEffect` appeared twice, so every trigger fired both.                                                                                                                                                                                                                 |
| Sub-tab spacing                | The sub-tab row measured its trailing gap against the **main** tab count. One shared `TabStrip` now, so the two cannot diverge.                                                                                                                                                       |
| Selection fought itself        | Parent-supplied `isSelected` was overwritten from internal state, which is why an imperative `jumpToTab` was needed at all. Selection is now controlled or uncontrolled, never both.                                                                                                  |
| Pagination missed slow scrolls | `onEndReached` hung off `onMomentumScrollEnd`, so a slow drag to the bottom paged nothing. Checked on scroll now, latched to fire once per approach.                                                                                                                                  |
| Off-centre tabs                | Centring used a guessed per-tab width. Measured now, so it holds for any font, locale or padding.                                                                                                                                                                                     |
| Reorder recycled wrong rows    | Tabs were keyed by index while being drag-reorderable. Keyed by identity now.                                                                                                                                                                                                         |
| Crash on a missing callback    | `onTabSelect` was called bare. Every callback is optional.                                                                                                                                                                                                                            |
| Tablet header clipping         | Two competing mechanisms — a `minHeaderContentHeight` prop and a `useFitHeaderHeight` hook that hand-mirrored a five-branch offset. One `autoHeight` prop, all devices.                                                                                                               |

## Development

```sh
yarn                 # install
yarn test            # jest
yarn typecheck       # tsc
yarn lint            # eslint
yarn prepare         # build with bob
yarn example ios     # run the demo
yarn example android
yarn example web
```

## License

MIT
