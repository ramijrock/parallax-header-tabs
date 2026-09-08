import { StyleSheet, View } from 'react-native';
import { HeaderCarousel } from '@ramijd/parallax-header-tabs';
import { GALLERY_RATIO, SOLO_IMAGE } from './demoData';
import { HeroCopy } from './HeroCopy';
import { SpeciesFrame, type HeaderScreenProps } from './SpeciesFrame';

/**
 * The same carousel, handed one image. It stops behaving like one: the picture
 * is drawn on its own with no scroll container, so there is nothing to swipe,
 * and the dots, the counter and autoplay are all withheld — asking for them
 * changes nothing. Sizing is unchanged, so the ratio still decides the header's
 * height and no `headerHeight` is needed.
 */
export const SoloImageHeaderScreen = ({ onBack }: HeaderScreenProps) => (
  <SpeciesFrame
    onBack={onBack}
    header={
      <View>
        <HeaderCarousel images={SOLO_IMAGE} aspectRatio={GALLERY_RATIO} />
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
});
