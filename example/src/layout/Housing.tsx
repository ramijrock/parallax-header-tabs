import { Text, View } from 'react-native';
import { styles } from './styles';

const ENCLOSURES = [
  { name: 'Sundarbans A', detail: '2 adults · 1.4 ha · moated' },
  { name: 'Sundarbans B', detail: '1 adult · 0.9 ha · dry ditch' },
  { name: 'Quarantine 3', detail: 'empty · 0.3 ha · indoor' },
];

export const Housing = () => (
  <>
    {ENCLOSURES.map((enclosure) => (
      <View key={enclosure.name} style={styles.row}>
        <Text style={styles.rowTitle}>{enclosure.name}</Text>
        <Text style={styles.rowMeta}>{enclosure.detail}</Text>
      </View>
    ))}
  </>
);
