import { StyleSheet, View } from 'react-native';
import { HeaderCarousel } from '@ramijd/parallax-header-tabs';
import { GALLERY } from './demoData';
import { HeroCopy } from './HeroCopy';
import { SpeciesFrame, type HeaderScreenProps } from './SpeciesFrame';

/**
 * A fixed 450pt hero with the carousel under `absoluteFill`. `headerHeight` is
 * the floor rather than the size: `autoHeight` still grows the hero if the copy
 * ever outruns 450. Out of flow, the images cannot report a height of their
 * own, so they are cropped to the hero — see `FittedImageHeaderScreen` for the
 * other way round.
 */
export const ImageHeaderScreen = ({ onBack }: HeaderScreenProps) => (
  <SpeciesFrame
    onBack={onBack}
    headerHeight={450}
    header={
      // `flexGrow` fills the 450 with the hero, which is what carries the
      // `absoluteFill` carousel down to the foot of the header. Never the
      // `flex: 1` shorthand — that sets `flexBasis: 0` too.
      <View style={styles.hero}>
        {/* Swipe it, or let it advance on its own. */}
        <HeaderCarousel
          images={GALLERY}
          style={StyleSheet.absoluteFill}
          autoPlay
          interval={3500}
          // Five dots at most; a longer run slides a window and the pill keeps
          // the real position readable.
          maxDots={5}
          showCounter
          paginationStyle={styles.dots}
        />
        <View style={styles.scrim} pointerEvents="none" />
        <HeroCopy />
      </View>
    }
  />
);

const styles = StyleSheet.create({
  hero: { flexGrow: 1, minHeight: 280, justifyContent: 'flex-end' },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  // Bottom right, clear of the hero copy on the left.
  dots: { bottom: 16, justifyContent: 'flex-end', paddingRight: 16 },
});
