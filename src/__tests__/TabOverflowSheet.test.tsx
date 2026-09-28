import { Modal } from 'react-native';
import { act, render, screen, fireEvent } from '@testing-library/react-native';
import { TabOverflowSheet } from '../components/TabOverflowSheet';
import { defaultTheme } from '../theme';
import type { TabItem } from '../types';

const tabs: TabItem[] = Array.from({ length: 4 }, (_, i) => ({
  key: `t${i}`,
  title: `Tab ${i}`,
}));

/** A row is 44 tall plus the 8 between rows: one step of a drag. */
const ROW = 44;
const STEP = ROW + 8;

function renderSheet(onTabsReorder = jest.fn(), onClose = jest.fn()) {
  const utils = render(
    <TabOverflowSheet
      visible
      onClose={onClose}
      tabs={tabs}
      onSelect={() => {}}
      onTabsReorder={onTabsReorder}
      theme={defaultTheme}
    />
  );
  return { ...utils, onTabsReorder, onClose };
}

function handleOf(title: string) {
  return screen.getByLabelText(`Reorder ${title}`);
}

/** Every row is spaced by the first one's height. */
function layOutRows() {
  let node = screen.getByText('Tab 0').parent;
  while (node && !node.props.onLayout) node = node.parent;
  fireEvent(node!, 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 300, height: ROW } },
  });
}

/** What PanResponder reads a gesture from: one finger, start and now. */
function touch(startY: number, currentY: number) {
  const record = {
    touchActive: true,
    startPageX: 0,
    startPageY: startY,
    startTimeStamp: 0,
    currentPageX: 0,
    currentPageY: currentY,
    currentTimeStamp: 1,
    previousPageX: 0,
    previousPageY: startY,
    previousTimeStamp: 0,
  };
  return {
    nativeEvent: { touches: [{}], changedTouches: [{}] },
    persist: () => {},
    touchHistory: {
      numberActiveTouches: 1,
      indexOfSingleActiveTouch: 0,
      mostRecentTimeStamp: 1,
      touchBank: [record],
    },
  };
}

function dragBy(title: string, dy: number) {
  const handle = handleOf(title);
  fireEvent(handle, 'responderGrant', touch(0, 0));
  fireEvent(handle, 'responderMove', touch(0, dy));
  fireEvent(handle, 'responderRelease', touch(0, dy));
}

function order() {
  return screen.getAllByText(/^Tab \d$/).map((node) => node.props.children);
}

describe('TabOverflowSheet drag and drop', () => {
  beforeEach(() => {
    renderSheet();
    layOutRows();
  });

  it('drops a row where it is let go', () => {
    dragBy('Tab 0', STEP * 2);
    expect(order()).toEqual(['Tab 1', 'Tab 2', 'Tab 0', 'Tab 3']);
  });

  it('moves a row up as readily as down', () => {
    dragBy('Tab 3', -STEP);
    expect(order()).toEqual(['Tab 0', 'Tab 1', 'Tab 3', 'Tab 2']);
  });

  it('holds a row inside the list past either end', () => {
    dragBy('Tab 1', STEP * 10);
    expect(order()).toEqual(['Tab 0', 'Tab 2', 'Tab 3', 'Tab 1']);
  });

  it('leaves the order alone for a drag shorter than half a row', () => {
    dragBy('Tab 1', STEP * 0.4);
    expect(order()).toEqual(['Tab 0', 'Tab 1', 'Tab 2', 'Tab 3']);
  });
});

describe('TabOverflowSheet with a screen reader', () => {
  it('moves a row through the grip, which a screen reader cannot drag', () => {
    renderSheet();
    fireEvent(handleOf('Tab 1'), 'accessibilityAction', {
      nativeEvent: { actionName: 'moveUp' },
    });
    expect(order()).toEqual(['Tab 1', 'Tab 0', 'Tab 2', 'Tab 3']);
    fireEvent(handleOf('Tab 1'), 'accessibilityAction', {
      nativeEvent: { actionName: 'moveDown' },
    });
    expect(order()).toEqual(['Tab 0', 'Tab 1', 'Tab 2', 'Tab 3']);
  });

  it('offers only the moves a row can make', () => {
    renderSheet();
    const names = (title: string) =>
      handleOf(title).props.accessibilityActions.map(
        (action: { name: string }) => action.name
      );
    expect(names('Tab 0')).toEqual(['moveDown']);
    expect(names('Tab 3')).toEqual(['moveUp']);
  });
});

describe('TabOverflowSheet reorder publishing', () => {
  it('publishes a dragged order on close, not on the drop', () => {
    const { onTabsReorder } = renderSheet();
    layOutRows();
    dragBy('Tab 0', STEP);
    expect(onTabsReorder).not.toHaveBeenCalled();

    act(() => screen.UNSAFE_getByType(Modal).props.onRequestClose());
    expect(
      onTabsReorder.mock.calls[0][0].map((tab: TabItem) => tab.key)
    ).toEqual(['t1', 't0', 't2', 't3']);
  });
});
