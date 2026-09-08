import { createRef } from 'react';
import { StyleSheet, Text } from 'react-native';
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
    fireEvent.press(screen.getByLabelText('Move Tab 1 up'));
    // Staged while open, published on close — the visible bar never shuffles
    // under the finger.
    expect(onTabsReorder).not.toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText('Move Tab 1 up'));
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
