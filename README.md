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
    <View style={{ flexGrow: 1, minHeight: 280, justifyContent: 'flex-end' }}>
      <HeaderCarousel images={gallery} style={StyleSheet.absoluteFill} />
      {/* … */}
    </View>
  }
/>
```

Flexbox stretches a child across but never down, so without it the root keeps
its own natural height: the carousel stops there and the rest of the 450 is
bare background. `minHeight` still floors it for the no-`headerHeight` case
above.

Use `flexGrow: 1` and not the `flex: 1` shorthand, which also sets
`flexBasis: 0`. With no `headerHeight` the hero is auto-height, so there is no
free space to grow back into and a `flex: 1` root collapses to its padding —
the header then measures far shorter than its content.

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
| `stickyTopInset` | `number`    | `0`     | Where the collapsed chrome rests — your safe area + nav bar              |
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
    <View style={{ minHeight: 280, justifyContent: 'flex-end' }}>
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
