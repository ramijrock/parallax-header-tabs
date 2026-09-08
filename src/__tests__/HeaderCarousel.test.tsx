import { createRef } from 'react';
import { Image, StyleSheet } from 'react-native';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import {
  HeaderCarousel,
  type HeaderCarouselHandle,
} from '../components/HeaderCarousel';

const images = ['a.jpg', 'b.jpg', 'c.jpg'];

/** The width the hero reports on a device. */
const WIDTH = 390;

function layOut() {
  fireEvent(screen.getByTestId('carousel'), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: WIDTH, height: 240 } },
  });
}

function settleAt(offset: number) {
  fireEvent(screen.getByTestId('carousel-strip'), 'momentumScrollEnd', {
    nativeEvent: { contentOffset: { x: offset, y: 0 } },
  });
}

/** The image each drawn dot stands for, in order. */
function dots() {
  return screen.queryAllByTestId(/^carousel-dot-\d+$/).map((dot) => ({
    index: Number(dot.props.testID.split('-').pop()),
    width: StyleSheet.flatten(dot.props.style).width as number,
  }));
}

/** The active dot is the wide one; an edge dot with more beyond it is small. */
function activeDot() {
  return dots().find((dot) => dot.width === 18)?.index ?? -1;
}

describe('HeaderCarousel', () => {
  it('renders one slide per image, sized to the measured width', () => {
    render(<HeaderCarousel images={images} testID="carousel" />);
    layOut();
    const slides = screen.UNSAFE_getAllByType(Image);
    expect(slides).toHaveLength(3);
    expect(slides.map((slide) => slide.props.style[1].width)).toEqual([
      WIDTH,
      WIDTH,
      WIDTH,
    ]);
  });

  it('follows a swipe with the dots and reports the new index', () => {
    const onIndexChange = jest.fn();
    render(
      <HeaderCarousel
        images={images}
        onIndexChange={onIndexChange}
        testID="carousel"
      />
    );
    layOut();
    expect(activeDot()).toBe(0);

    settleAt(WIDTH * 2);

    expect(activeDot()).toBe(2);
    expect(onIndexChange).toHaveBeenCalledWith(2);
    // Mounting is not a change.
    expect(onIndexChange).toHaveBeenCalledTimes(1);
  });

  it('caps the dots and slides the window along a long run', () => {
    const many = Array.from({ length: 12 }, (_, i) => `${i}.jpg`);
    render(<HeaderCarousel images={many} testID="carousel" />);
    layOut();

    // Pinned at the start: five dots, only the far one shrunk.
    expect(dots().map((dot) => dot.index)).toEqual([0, 1, 2, 3, 4]);
    expect(dots().map((dot) => dot.width)).toEqual([18, 6, 6, 6, 4]);

    settleAt(WIDTH * 6);

    // Centred on the current image, shrunk at both ends.
    expect(dots().map((dot) => dot.index)).toEqual([4, 5, 6, 7, 8]);
    expect(activeDot()).toBe(6);
    expect(dots().map((dot) => dot.width)).toEqual([4, 6, 18, 6, 4]);

    settleAt(WIDTH * 11);

    // Pinned at the end rather than running past it.
    expect(dots().map((dot) => dot.index)).toEqual([7, 8, 9, 10, 11]);
    expect(activeDot()).toBe(11);
  });

  it('counts the images once they outnumber the dots', () => {
    const { update } = render(
      <HeaderCarousel images={images} testID="carousel" />
    );
    layOut();
    expect(screen.queryByTestId('carousel-counter')).toBeNull();

    const many = Array.from({ length: 12 }, (_, i) => `${i}.jpg`);
    update(<HeaderCarousel images={many} testID="carousel" />);
    expect(screen.getByTestId('carousel-counter')).toHaveTextContent('1 / 12');

    settleAt(WIDTH * 6);
    expect(screen.getByTestId('carousel-counter')).toHaveTextContent('7 / 12');
  });

  it('hides the dots and locks scrolling for a single image', () => {
    render(<HeaderCarousel images={['only.jpg']} testID="carousel" />);
    expect(screen.queryByTestId('carousel-pagination')).toBeNull();
    expect(screen.getByTestId('carousel-strip').props.scrollEnabled).toBe(
      false
    );
  });

  it('advances on its own and wraps to the first image', () => {
    jest.useFakeTimers();
    const ref = createRef<HeaderCarouselHandle>();
    render(
      <HeaderCarousel
        ref={ref}
        images={images}
        autoPlay
        interval={1000}
        testID="carousel"
      />
    );
    layOut();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(activeDot()).toBe(1);

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    // Past the end, back to the start rather than off the edge.
    expect(activeDot()).toBe(0);
    jest.useRealTimers();
  });

  it('holds still while a finger is down', () => {
    jest.useFakeTimers();
    render(
      <HeaderCarousel
        images={images}
        autoPlay
        interval={1000}
        testID="carousel"
      />
    );
    layOut();
    fireEvent(screen.getByTestId('carousel-strip'), 'scrollBeginDrag');

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(activeDot()).toBe(0);
    jest.useRealTimers();
  });
});
