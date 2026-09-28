import { createRef, forwardRef, useImperativeHandle } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ParallaxHeader } from '../ParallaxHeader';
import type { ParallaxHeaderHandle, TabItem } from '../types';

const tabs: TabItem[] = [
  { key: 'overview', title: 'Overview' },
  { key: 'population', title: 'Population' },
  { key: 'medical', title: 'Medical' },
];

const subTabs: TabItem[] = [
  { key: 'pending', title: 'Pending' },
  { key: 'approved', title: 'Approved' },
];

describe('ParallaxHeader', () => {
  it('renders the hero, the tabs and the body', () => {
    render(
      <ParallaxHeader header={<Text>Hero</Text>} tabs={tabs}>
        <Text>Body</Text>
      </ParallaxHeader>
    );
    expect(screen.getByText('Hero')).toBeTruthy();
    expect(screen.getByText('Body')).toBeTruthy();
    expect(screen.getByText('Overview')).toBeTruthy();
  });

  it('reports the tapped tab with its index', () => {
    const onTabChange = jest.fn();
    render(<ParallaxHeader tabs={tabs} onTabChange={onTabChange} />);
    fireEvent.press(screen.getByText('Medical'));
    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith(tabs[2], 2);
  });

  it('marks exactly one tab selected for assistive tech', () => {
    render(<ParallaxHeader tabs={tabs} defaultTabKey="population" />);
    const selected = screen
      .getAllByRole('tab')
      .filter((node) => node.props.accessibilityState?.selected);
    expect(selected).toHaveLength(1);
    expect(selected[0]?.props.accessibilityLabel).toBe('Population');
  });

  it('does not let a caller rebuilding tabs inline reset the selection', () => {
    const { rerender } = render(
      <ParallaxHeader tabs={tabs.map((t) => ({ ...t }))} />
    );
    fireEvent.press(screen.getByText('Medical'));
    // A fresh array of equal tabs, as an inline .map() in render would produce.
    rerender(<ParallaxHeader tabs={tabs.map((t) => ({ ...t }))} />);
    const selected = screen
      .getAllByRole('tab')
      .filter((node) => node.props.accessibilityState?.selected);
    expect(selected[0]?.props.accessibilityLabel).toBe('Medical');
  });

  it('renders sub tabs independently of the main tab count', () => {
    render(<ParallaxHeader tabs={tabs} subTabs={subTabs} />);
    expect(screen.getByText('Pending')).toBeTruthy();
    expect(screen.getByText('Approved')).toBeTruthy();
    expect(screen.getAllByRole('tab')).toHaveLength(
      tabs.length + subTabs.length
    );
  });

  it('keeps the two bars on separate selections', () => {
    const onTabChange = jest.fn();
    const onSubTabChange = jest.fn();
    render(
      <ParallaxHeader
        tabs={tabs}
        subTabs={subTabs}
        onTabChange={onTabChange}
        onSubTabChange={onSubTabChange}
      />
    );
    fireEvent.press(screen.getByText('Approved'));
    expect(onSubTabChange).toHaveBeenCalledWith(subTabs[1], 1);
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it('shows the overflow control only past the threshold', () => {
    const many = Array.from({ length: 6 }, (_, i) => ({
      key: `t${i}`,
      title: `Tab ${i}`,
    }));
    const { rerender } = render(<ParallaxHeader tabs={tabs} />);
    expect(screen.queryByLabelText('Show all tabs')).toBeNull();
    rerender(<ParallaxHeader tabs={many} />);
    expect(screen.getByLabelText('Show all tabs')).toBeTruthy();
  });

  it('publishes a reorder made in the overflow sheet', () => {
    const many = Array.from({ length: 6 }, (_, i) => ({
      key: `t${i}`,
      title: `Tab ${i}`,
    }));
    const onTabsReorder = jest.fn();
    render(<ParallaxHeader tabs={many} onTabsReorder={onTabsReorder} />);
    fireEvent.press(screen.getByLabelText('Show all tabs'));
    fireEvent(screen.getByLabelText('Reorder Tab 1'), 'accessibilityAction', {
      nativeEvent: { actionName: 'moveUp' },
    });
    // Staged while open, published on close — the visible bar never shuffles
    // under the finger.
    expect(onTabsReorder).not.toHaveBeenCalled();
    fireEvent(screen.getByLabelText('Reorder Tab 1'), 'accessibilityAction', {
      nativeEvent: { actionName: 'moveUp' },
    });
    expect(onTabsReorder).not.toHaveBeenCalled();
  });

  it('drives selection through the imperative handle', () => {
    const ref = createRef<ParallaxHeaderHandle>();
    const onTabChange = jest.fn();
    render(<ParallaxHeader ref={ref} tabs={tabs} onTabChange={onTabChange} />);
    ref.current?.setTab('population');
    expect(onTabChange).toHaveBeenCalledWith(tabs[1], 1);
    ref.current?.setTab('does-not-exist');
    expect(onTabChange).toHaveBeenCalledTimes(1);
  });

  it('leaves the pinned tab bar clear of the collapsed banner', () => {
    render(
      <ParallaxHeader
        testID="ph"
        title="Panthera tigris"
        headerHeight={300}
        stickyTopInset={44}
        tabBarHeight={48}
        bannerHeight={48}
        tabs={tabs}
      />
    );
    // Hidden from assistive tech by design, so it has to be asked for.
    const banner = screen.getByTestId('ph-banner', {
      includeHiddenElements: true,
    });
    // The banner owns [0, 92]; the bar rests at the foot of the hero and rises
    // only to 92, so the two no longer share a strip of screen. How far it
    // rises is `collapseDistance`, covered in the useHeaderMetrics tests.
    expect(banner.props.style.height).toBe(92);
    expect(screen.getByTestId('ph-tab-bar').props.style.top).toBe(300);
  });

  it('backs the banner with an opaque base, inset included', () => {
    render(
      <ParallaxHeader
        testID="ph"
        title="Panthera tigris"
        theme={{ background: '#f4f5f7' }}
        stickyTopInset={44}
        bannerHeight={48}
        header={<Text>Hero</Text>}
        tabs={tabs}
      />
    );
    const base = screen.getByTestId('ph-banner-base', {
      includeHiddenElements: true,
    });
    const style = StyleSheet.flatten(base.props.style);
    // The hero comes to rest behind this strip, and the fill over it is a
    // translucent scrim — or a blur — so without the base it shows through.
    expect(style.backgroundColor).toBe('#f4f5f7');
    // Absolute, so it covers the inset the banner only pads.
    expect(style.top).toBe(0);
    expect(style.bottom).toBe(0);
  });

  it('keeps the header controls above the banner and out of the hero', () => {
    render(
      <ParallaxHeader
        testID="ph"
        title="Panthera tigris"
        stickyTopInset={44}
        bannerHeight={48}
        header={<Text>Hero</Text>}
        headerLeft={<Text>Back</Text>}
        headerRight={<Text>More</Text>}
        tabs={tabs}
      />
    );
    // Outside the hero, so the parallax cannot carry them off screen, and
    // outside the banner, which is hidden from assistive tech and fades.
    expect(screen.getByText('Back')).toBeTruthy();
    expect(screen.getByText('More')).toBeTruthy();
    const chrome = screen.getByTestId('ph-chrome');
    const chromeStyle = StyleSheet.flatten(chrome.props.style);
    // The same strip the banner owns — inset plus banner — so the controls sit
    // on the collapsed title's line rather than over the tabs.
    expect(chromeStyle.height).toBe(92);
    expect(chromeStyle.paddingTop).toBe(44);
    expect(chrome.props.pointerEvents).toBe('box-none');
  });

  it('reports a press on a header control', () => {
    const onBack = jest.fn();
    render(
      <ParallaxHeader
        headerLeft={
          <Text accessibilityRole="button" onPress={onBack}>
            Back
          </Text>
        }
        tabs={tabs}
      />
    );
    fireEvent.press(screen.getByText('Back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('draws no top strip when neither control is given', () => {
    render(<ParallaxHeader testID="ph" title="Panthera tigris" tabs={tabs} />);
    expect(screen.queryByTestId('ph-chrome')).toBeNull();
  });

  it('omits the banner entirely when there is nothing to put in it', () => {
    render(<ParallaxHeader testID="ph" tabs={tabs} />);
    expect(
      screen.queryByTestId('ph-banner', { includeHiddenElements: true })
    ).toBeNull();
  });

  it('draws the empty state in place of a body with no data', () => {
    render(
      <ParallaxHeader testID="ph" tabs={tabs} empty>
        <Text>Body</Text>
      </ParallaxHeader>
    );
    expect(screen.getByText('No data found')).toBeTruthy();
    // In place of the body, not alongside it.
    expect(screen.queryByText('Body')).toBeNull();
    // The hero, the tabs and the rest of the header are untouched.
    expect(screen.getByText('Overview')).toBeTruthy();
  });

  it('takes a childless body at its word', () => {
    render(<ParallaxHeader testID="ph" tabs={tabs} />);
    expect(screen.getByTestId('ph-empty')).toBeTruthy();
  });

  it('says nothing about a body that renders its own nothing', () => {
    // One child, which happens to draw nothing: only the caller knows, so
    // `empty` is the way to say it and guessing here would be wrong.
    const Nothing = () => null;
    render(
      <ParallaxHeader testID="ph" tabs={tabs}>
        <Nothing />
      </ParallaxHeader>
    );
    expect(screen.queryByTestId('ph-empty')).toBeNull();
  });

  it('leaves a body with children alone', () => {
    render(
      <ParallaxHeader testID="ph" tabs={tabs}>
        <Text>Body</Text>
      </ParallaxHeader>
    );
    expect(screen.getByText('Body')).toBeTruthy();
    expect(screen.queryByTestId('ph-empty')).toBeNull();
  });

  it('takes a message of its own', () => {
    render(<ParallaxHeader tabs={tabs} empty emptyText="Nothing here yet" />);
    expect(screen.getByText('Nothing here yet')).toBeTruthy();
  });

  it('hands the whole empty state over to renderEmpty', () => {
    render(
      <ParallaxHeader
        tabs={tabs}
        empty
        emptyText="ignored"
        renderEmpty={() => <Text>Add the first record</Text>}
      />
    );
    expect(screen.getByText('Add the first record')).toBeTruthy();
    expect(screen.queryByText('ignored')).toBeNull();
  });

  it('fills the body below the bars with the empty state', () => {
    render(
      <ParallaxHeader
        testID="ph"
        tabs={tabs}
        headerHeight={300}
        tabBarHeight={48}
        empty
      />
    );
    const body = screen.getByTestId('ph-scroll').parent;
    fireEvent(body!, 'layout', {
      nativeEvent: { layout: { height: 800, width: 390, x: 0, y: 0 } },
    });
    // The viewport less the padding the hero and the bar reserve: 800 − 348.
    const style = StyleSheet.flatten(
      screen.getByTestId('ph-empty').props.style
    );
    expect(style.minHeight).toBe(452);
  });

  describe('renderScrollComponent', () => {
    /** Stands in for a list, and answers by offset as a list does. */
    const FakeList = forwardRef<{ scrollToOffset: jest.Mock }, object>(
      (_props, ref) => {
        useImperativeHandle(
          ref,
          () => ({ scrollToOffset: scrollToOffset }),
          []
        );
        return <View testID="fake-list" />;
      }
    );
    FakeList.displayName = 'FakeList';
    const scrollToOffset = jest.fn();
    beforeEach(() => scrollToOffset.mockClear());

    it('hands a list of your own the very props the built-in body gets', () => {
      const received: { paddingTop: number }[] = [];
      render(
        <ParallaxHeader
          testID="ph"
          tabs={tabs}
          headerHeight={300}
          tabBarHeight={48}
          renderScrollComponent={({ scrollProps }) => {
            received.push(scrollProps.contentContainerStyle);
            return (
              <Animated.FlatList
                {...scrollProps}
                data={['a', 'b']}
                keyExtractor={(item) => String(item)}
                renderItem={({ item }) => <Text>{String(item)}</Text>}
              />
            );
          }}
        />
      );
      // The space the hero and the bar reserve, unchanged by the swap.
      expect(received[0]?.paddingTop).toBe(348);
      expect(screen.getByText('a')).toBeTruthy();
      expect(screen.getByTestId('ph-scroll')).toBeTruthy();
    });

    it('gives out the empty state ready-sized for ListEmptyComponent', () => {
      render(
        <ParallaxHeader
          testID="ph"
          tabs={tabs}
          headerHeight={300}
          tabBarHeight={48}
          emptyText="Nothing here"
          renderScrollComponent={({ scrollProps, emptyComponent }) => (
            <Animated.FlatList
              {...scrollProps}
              data={[]}
              renderItem={() => null}
              ListEmptyComponent={emptyComponent}
            />
          )}
        />
      );
      // A list puts its own scaffolding between the scroller and the body,
      // so the clipped body is the nearest View above it either way.
      let body = screen.getByTestId('ph-scroll').parent;
      while (body && `${body.type}` !== 'View') body = body.parent;
      fireEvent(body!, 'layout', {
        nativeEvent: { layout: { height: 800, width: 390, x: 0, y: 0 } },
      });
      expect(screen.getByText('Nothing here')).toBeTruthy();
      const style = StyleSheet.flatten(
        screen.getByTestId('ph-empty').props.style
      );
      expect(style.minHeight).toBe(452);
    });

    it('scrolls a list by offset through the imperative handle', () => {
      const ref = createRef<ParallaxHeaderHandle>();
      render(
        <ParallaxHeader
          ref={ref}
          renderScrollComponent={({ scrollProps }) => (
            <FakeList ref={scrollProps.ref} />
          )}
        />
      );
      ref.current?.scrollTo(400);
      expect(scrollToOffset).toHaveBeenCalledWith({
        offset: 400,
        animated: true,
      });
      ref.current?.scrollToTop(false);
      expect(scrollToOffset).toHaveBeenLastCalledWith({
        offset: 0,
        animated: false,
      });
    });

    it('leaves children to the list once it owns the body', () => {
      render(
        <ParallaxHeader
          header={<Text>Hero</Text>}
          renderScrollComponent={() => <Text>List</Text>}
        >
          <Text>Body</Text>
        </ParallaxHeader>
      );
      expect(screen.getByText('Hero')).toBeTruthy();
      expect(screen.getByText('List')).toBeTruthy();
      expect(screen.queryByText('Body')).toBeNull();
    });
  });

  it('renders with no tabs at all', () => {
    render(
      <ParallaxHeader header={<Text>Hero</Text>}>
        <Text>Body</Text>
      </ParallaxHeader>
    );
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
    expect(screen.getByText('Body')).toBeTruthy();
  });
});
