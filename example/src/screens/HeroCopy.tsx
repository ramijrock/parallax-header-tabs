import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * The hero's copy, shared by all three screens. It owns the tag row, so
 * toggling it changes the hero's measured height — which is what `autoHeight`
 * follows on the screens that have no `headerHeight` floor.
 */
export const HeroCopy = () => {
  const [tagged, setTagged] = useState(false);

  return (
    <View style={styles.body}>
      <Text style={styles.kicker}>SPECIES</Text>
      <Text style={styles.title}>Panthera tigris</Text>
      <Text style={styles.sub}>Bengal tiger</Text>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => setTagged((t) => !t)}
        style={styles.toggle}
      >
        <Text style={styles.toggleText}>
          {tagged ? 'Hide tag row' : 'Show tag row'}
        </Text>
      </TouchableOpacity>
      {tagged ? (
        <View style={styles.tagRow}>
          {['Endangered', 'CITES I', 'Breeding'].map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  body: { padding: 20, paddingBottom: 28 },
  kicker: { color: '#e5e7eb', fontSize: 12, letterSpacing: 2 },
  title: { color: '#fff', fontSize: 26, fontWeight: '700', marginTop: 4 },
  sub: { color: '#e5e7eb', fontSize: 14, fontStyle: 'italic' },
  toggle: {
    marginTop: 14,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  toggleText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  tagRow: { flexDirection: 'row', marginTop: 14, flexWrap: 'wrap' },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: { color: '#fff', fontSize: 12 },
});
