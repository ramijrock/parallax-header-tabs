import { Text, View } from 'react-native';
import { Card } from './Card';
import { styles } from './styles';

const TAXONOMY: [string, string][] = [
  ['Kingdom', 'Animalia'],
  ['Order', 'Carnivora'],
  ['Family', 'Felidae'],
  ['Genus', 'Panthera'],
  ['Species', 'P. tigris'],
];

export const Taxonomy = () => (
  <Card>
    {TAXONOMY.map(([rank, name]) => (
      <View key={rank} style={styles.defRow}>
        <Text style={styles.defKey}>{rank}</Text>
        <Text style={styles.defValue}>{name}</Text>
      </View>
    ))}
  </Card>
);
