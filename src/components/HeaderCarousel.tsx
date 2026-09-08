import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageProps,
  type ImageSourcePropType,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

/** A remote URL is accepted directly, so the common case needs no wrapper. */
export type CarouselImage = ImageSourcePropType | string;

export interface HeaderCarouselHandle {
  /** Slide to an image by position. Clamped to the ends. */
  scrollToIndex: (index: number, animated?: boolean) => void;
}

export interface HeaderCarouselProps {
  images: CarouselImage[];
  /** Fixed height. Omit to size from `style` — `StyleSheet.absoluteFill`, say. */
  height?: number;
  /** @default false */
  autoPlay?: boolean;
  /** Time each image is held, in ms. @default 4000 */
  interval?: number;
  /**
   * Wrap from the last image back to the first while auto-playing. The wrap
   * slides back through the run rather than jumping, so the list stays free of
   * cloned slides.
   * @default true
   */
  loop?: boolean;
  /** @default 0 */
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Dots, shown only when there is more than one image. @default true */
  showPagination?: boolean;
  /**
   * Most dots to draw at once. A longer run slides a window of this many
   * along, shrinking the dots at either end to show there is more that way.
   * @default 5
   */
  maxDots?: number;
  /**
   * The `3 / 12` pill beside the dots.
   * @default true once the images outnumber `maxDots`
   */
  showCounter?: boolean;
  /** @default 'rgba(255,255,255,0.45)' */
  dotColor?: string;
  /** @default '#ffffff' */
  activeDotColor?: string;
  /** Moves the dot row — default is bottom centre. */
  paginationStyle?: StyleProp<ViewStyle>;
  /** The counter pill. Its text takes `activeDotColor` unless overridden. */
  counterStyle?: StyleProp<ViewStyle>;
  counterTextStyle?: StyleProp<TextStyle>;
  /** @default 'cover' */
  resizeMode?: ImageProps['resizeMode'];
  /** Drawn above the images. Pass a scrim, a title, anything. */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const AUTOPLAY_INTERVAL = 4000;
const MAX_DOTS = 5;

const toSource = (image: CarouselImage): ImageSourcePropType =>
  typeof image === 'string' ? { uri: image } : image;

/**
 * A paging strip of images for the hero. It lives outside the vertical scroll
 * view — the hero always does — so its horizontal gestures never compete with
 * the body's vertical ones.
 *
 * Slide width comes from a measurement rather than `Dimensions`, so the paging
 * stays true inside a padded hero, on a split screen and after a rotation. The
 * window width is only the first guess, used until that measurement lands.
 */
export const HeaderCarousel = forwardRef<
  HeaderCarouselHandle,
  HeaderCarouselProps
>(
  (
    {
      images,
      height,
      autoPlay = false,
      interval = AUTOPLAY_INTERVAL,
      loop = true,
      initialIndex = 0,
      onIndexChange,
      showPagination = true,
      maxDots = MAX_DOTS,
      showCounter,
      dotColor = 'rgba(255,255,255,0.45)',
      activeDotColor = '#ffffff',
      paginationStyle,
      counterStyle,
      counterTextStyle,
      resizeMode = 'cover',
      children,
      style,
      testID,
    },
    ref
  ) => {
    const count = images.length;
    const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
    const [width, setWidth] = useState(() => Dimensions.get('window').width);
    const [index, setIndex] = useState(() =>
      Math.min(Math.max(initialIndex, 0), Math.max(count - 1, 0))
    );
    // Read by the autoplay timer, which must not be torn down and rebuilt on
    // every slide — that would restart the countdown mid-flight.
    const indexRef = useRef(index);
    // A drag suspends autoplay, so the timer never yanks an image out from
    // under a finger.
    const interacting = useRef(false);

    const goTo = useCallback(
      (next: number, animated = true) => {
        if (count === 0) return;
        const target = Math.min(Math.max(next, 0), count - 1);
        indexRef.current = target;
        setIndex(target);
        scrollRef.current?.scrollTo({ x: target * width, y: 0, animated });
      },
      [count, width]
    );

    useImperativeHandle(ref, () => ({ scrollToIndex: goTo }), [goTo]);

    // Reported on a settled slide only, so a caller is not woken for every
    // frame of a drag.
    const notify = useRef(onIndexChange);
    notify.current = onIndexChange;
    const mounted = useRef(false);
    useEffect(() => {
      if (!mounted.current) {
        mounted.current = true;
        return;
      }
      notify.current?.(index);
    }, [index]);

    const onMomentumScrollEnd = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (width <= 0) return;
        const next = Math.round(event.nativeEvent.contentOffset.x / width);
        if (next === indexRef.current) return;
        indexRef.current = next;
        setIndex(next);
      },
      [width]
    );

    const onLayout = useCallback((event: LayoutChangeEvent) => {
      const measured = event.nativeEvent.layout.width;
      if (measured > 0) setWidth(measured);
    }, []);

    // A width change moves every slide, so the current one is re-pinned rather
    // than left half off screen.
    useEffect(() => {
      scrollRef.current?.scrollTo({
        x: indexRef.current * width,
        y: 0,
        animated: false,
      });
    }, [width]);

    // A shorter list can strand the offset past the end.
    useEffect(() => {
      if (indexRef.current < count) return;
      goTo(count - 1, false);
    }, [count, goTo]);

    useEffect(() => {
      if (!autoPlay || count < 2 || width <= 0) return;
      const id = setInterval(() => {
        if (interacting.current) return;
        const next = indexRef.current + 1;
        if (next < count) goTo(next);
        else if (loop) goTo(0);
      }, interval);
      return () => clearInterval(id);
    }, [autoPlay, count, goTo, interval, loop, width]);

    // The dots a long run actually draws: a window of `maxDots` centred on the
    // current image, pinned once it reaches either end so it never runs past
    // the run.
    const dotWindow = useMemo(() => {
      if (count <= maxDots) return { start: 0, end: count };
      const start = Math.min(
        Math.max(index - Math.floor(maxDots / 2), 0),
        count - maxDots
      );
      return { start, end: start + maxDots };
    }, [count, index, maxDots]);

    const counting = showCounter ?? count > maxDots;

    return (
      <View
        style={[styles.root, height === undefined ? null : { height }, style]}
        onLayout={onLayout}
        testID={testID}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          scrollEnabled={count > 1}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onScrollBeginDrag={() => {
            interacting.current = true;
          }}
          onScrollEndDrag={() => {
            interacting.current = false;
          }}
          testID={testID ? `${testID}-strip` : undefined}
        >
          {images.map((image, position) => (
            // Keyed by position on purpose: the slides are positional, so a
            // changed list should swap sources in place rather than remount.
            <Image
              key={position}
              source={toSource(image)}
              resizeMode={resizeMode}
              style={[styles.image, { width }]}
            />
          ))}
        </ScrollView>

        {children ? (
          // Lets a scrim or a title sit over the images without swallowing the
          // swipe that reaches the uncovered part of the slide.
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {children}
          </View>
        ) : null}

        {showPagination && count > 1 ? (
          <View
            pointerEvents="none"
            style={[styles.pagination, paginationStyle]}
            testID={testID ? `${testID}-pagination` : undefined}
          >
            {images.slice(dotWindow.start, dotWindow.end).map((_, offset) => {
              const position = dotWindow.start + offset;
              const isActive = position === index;
              // The end dots of a window with more beyond it are drawn small,
              // which is the only cue left once the count is capped.
              const isEdge =
                (position === dotWindow.start && dotWindow.start > 0) ||
                (position === dotWindow.end - 1 && dotWindow.end < count);
              return (
                <View
                  key={position}
                  testID={testID ? `${testID}-dot-${position}` : undefined}
                  style={[
                    styles.dot,
                    isEdge ? styles.dotEdge : null,
                    isActive ? styles.dotActive : null,
                    { backgroundColor: isActive ? activeDotColor : dotColor },
                  ]}
                />
              );
            })}
            {counting ? (
              <View
                style={[styles.counter, counterStyle]}
                testID={testID ? `${testID}-counter` : undefined}
              >
                <Text
                  style={[
                    styles.counterText,
                    { color: activeDotColor },
                    counterTextStyle,
                  ]}
                >
                  {index + 1} / {count}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }
);

HeaderCarousel.displayName = 'HeaderCarousel';

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
  image: { height: '100%' },
  pagination: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 3 },
  dotEdge: { width: 4, height: 4, borderRadius: 2 },
  dotActive: { width: 18, height: 6, borderRadius: 3 },
  counter: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  counterText: { fontSize: 11, fontWeight: '600' },
});
