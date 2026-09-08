import { StyleSheet, TouchableOpacity, View } from 'react-native';

export interface HeaderButtonProps {
  /** Which glyph to draw. Both are views, so no icon font is needed. */
  icon: 'back' | 'more';
  label: string;
  onPress: () => void;
}

/**
 * A control for the header's top strip. The dark disc is what keeps it legible
 * over a photo while the header is expanded and over the banner once it has
 * collapsed — the strip itself never moves.
 */
export const HeaderButton = ({ icon, label, onPress }: HeaderButtonProps) => (
  <TouchableOpacity
    accessibilityRole="button"
    accessibilityLabel={label}
    onPress={onPress}
    hitSlop={8}
    style={styles.button}
  >
    {icon === 'back' ? (
      // Two borders on a square, turned 45° — a chevron without an asset.
      <View style={styles.chevron} />
    ) : (
      <View style={styles.dots}>
        {[0, 1, 2].map((dot) => (
          <View key={dot} style={styles.dot} />
        ))}
      </View>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    width: 34,
    height: 34,
    marginHorizontal: 14,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17,24,39,0.45)',
  },
  chevron: {
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#fff',
    transform: [{ rotate: '45deg' }],
    // Optically centres the arm inside the disc.
    marginLeft: -3,
  },
  dots: { flexDirection: 'row', alignItems: 'center' },
  dot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    marginHorizontal: 1.5,
    backgroundColor: '#fff',
  },
});
