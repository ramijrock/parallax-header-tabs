import { StyleSheet, View } from 'react-native';
import { HeaderCarousel } from '@ramijd/parallax-header-tabs';
import { GALLERY, GALLERY_RATIO } from './demoData';
import { HeroCopy } from './HeroCopy';
import { SpeciesFrame, type HeaderScreenProps } from './SpeciesFrame';

/**
 * The picture sets the height. No `headerHeight` at all: the carousel is in
 * flow with an `aspectRatio`, so it reports a real height, `autoHeight`
 * measures the image rather than the copy laid over it, and nothing is
 * cropped.
 */
export const FittedImageHeaderScreen = ({ onBack }: HeaderScreenProps) => (
  <SpeciesFrame
    onBack={onBack}
    header={
      <View>
        <HeaderCarousel
          images={GALLERY}
          aspectRatio={GALLERY_RATIO}
          autoPlay
          interval={3500}
          maxDots={5}
          showCounter
          paginationStyle={styles.dots}
        />
        <View style={styles.scrim} pointerEvents="none" />
        {/* Absolute, so the copy rides over the picture without lengthening
            the hero — the ratio alone decides how tall the header is. */}
        <View style={styles.overlay}>
          <HeroCopy />
        </View>
      </View>
    }
  />
);

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  overlay: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  dots: { bottom: 16, justifyContent: 'flex-end', paddingRight: 16 },
});
