import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CHOICES, type HeroVariant } from './variants';

export interface LauncherProps {
  onPick: (variant: HeroVariant) => void;
}

/**
 * Entry screen. All three choices open the same tabs, body screens and
 * collapsing bars, so the only thing under comparison is the hero and how it
 * is sized.
 */
export const Launcher = ({ onPick }: LauncherProps) => (
  <View style={styles.root}>
    <Text style={styles.kicker}>PARALLAX HEADER TABS</Text>
    <Text style={styles.title}>Pick a header</Text>

    {CHOICES.map((choice) => (
      <TouchableOpacity
        key={choice.variant}
        accessibilityRole="button"
        onPress={() => onPick(choice.variant)}
        style={styles.choice}
      >
        <Text style={styles.choiceTitle}>{choice.title}</Text>
        <Text style={styles.choiceDetail}>{choice.detail}</Text>
      </TouchableOpacity>
    ))}

    <Text style={styles.footnote}>
      The back control on the top strip returns here — it stays put and stays
      tappable however far the header is collapsed.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20, justifyContent: 'center' },
  kicker: {
    color: '#9ca3af',
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '600',
  },
  title: { color: '#111827', fontSize: 28, fontWeight: '700', marginTop: 6 },
  choice: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginTop: 14,
  },
  choiceTitle: { color: '#24595f', fontSize: 17, fontWeight: '700' },
  choiceDetail: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  footnote: { color: '#9ca3af', fontSize: 12, lineHeight: 18, marginTop: 22 },
});
