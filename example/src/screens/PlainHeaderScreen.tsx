import { StyleSheet, View } from 'react-native';
import { HeroCopy } from './HeroCopy';
import { SpeciesFrame, type HeaderScreenProps } from './SpeciesFrame';

/**
 * No image and no `headerHeight`, so the hero is exactly as tall as its copy:
 * show the tag row and the header lengthens, and the bars, the collapse and the
 * body padding all follow from the new measurement.
 */
export const PlainHeaderScreen = ({ onBack }: HeaderScreenProps) => (
  <SpeciesFrame
    onBack={onBack}
    header={
      <View style={styles.hero}>
        <HeroCopy />
      </View>
    }
  />
);

const styles = StyleSheet.create({
  hero: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#24595f',
    // Room for the top strip above the copy, since there is no image to fill
    // it and nothing else pushes the copy clear of the controls.
    paddingTop: 64,
  },
});
