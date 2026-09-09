import { StyleSheet, View } from 'react-native';
import { HeaderCarousel } from '@ramijd/parallax-header-tabs';
import { GALLERY, GALLERY_RATIO } from './demoData';
import { HeroCopy } from './HeroCopy';
import { SpeciesFrame, type HeaderScreenProps } from './SpeciesFrame';

export interface FittedImageHeaderScreenProps extends HeaderScreenProps {
  /**
   * Omit it — as the launcher does — and the picture decides: the carousel is
   * in flow with its `aspectRatio`, so it reports a real height, `autoHeight`
   * measures the image rather than the copy laid over it, and nothing is
   * cropped. Pass one and the same hero fills it instead.
   */
  headerHeight?: number;
}

/**
 * The two ways a picture and a hero can settle their height, on one screen.
 *
 * With a `headerHeight` the number wins: the header floors the wrapper it
 * measures, `flexGrow` takes the hero down to that floor, and the carousel
 * rides under `absoluteFill` to its foot — out of flow it reports no height of
 * its own, so a 3:2 image is cropped to fit. Without one there is no floor to
 * grow into, so the carousel goes back in flow with its ratio and sets the
 * height itself, uncropped.
 *
 * Everything else is common to both, which is the point: one hero, and the two
 * modes differ only in where the height comes from.
 */
export const FittedImageHeaderScreen = ({
  onBack,
  headerHeight,
}: FittedImageHeaderScreenProps) => {
  const filled = headerHeight !== undefined;

  return (
    <SpeciesFrame
      onBack={onBack}
      headerHeight={headerHeight}
      header={
        // Only grows when there is a floor to grow into. Left alone otherwise,
        // so the ratio's height is what the hero measures.
        <View style={filled ? styles.hero : undefined}>
          <HeaderCarousel
            images={GALLERY}
            // The one prop the two modes disagree about, and they cannot both
            // apply: `absoluteFill` leaves the strip unable to report a height,
            // which is exactly what a floored hero wants and what a hero that
            // has to measure itself cannot use.
            style={filled ? StyleSheet.absoluteFill : undefined}
            aspectRatio={filled ? undefined : GALLERY_RATIO}
            autoPlay
            interval={3500}
            maxDots={5}
            showCounter
            paginationStyle={styles.dots}
          />
          <View style={styles.scrim} pointerEvents="none" />
          {/* Absolute either way: at the foot of the filled hero, and over the
              picture when the ratio owns the height — where copy in flow would
              lengthen the hero and leave the images short of the bottom. */}
          <View style={styles.overlay}>
            <HeroCopy />
          </View>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  // `flexGrow` and nothing else: the floor is `headerHeight`, which the header
  // already puts on the wrapper it measures, so repeating the number here
  // would only be a second place to forget to change it. Never the `flex: 1`
  // shorthand either — that sets `flexBasis: 0`, and with no `headerHeight` at
  // all the hero would then measure zero instead of its content.
  hero: { flexGrow: 1 },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  overlay: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  // Bottom right, clear of the hero copy on the left.
  dots: { bottom: 16, justifyContent: 'flex-end', paddingRight: 16 },
});
