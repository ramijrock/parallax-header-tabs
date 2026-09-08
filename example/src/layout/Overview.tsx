import { Text, View } from 'react-native';
import { Card } from './Card';
import { styles } from './styles';

const STATS = [
  { label: 'Wild adults', value: '3,900' },
  { label: 'Range states', value: '13' },
  { label: 'Trend', value: '+6%' },
];

export const Overview = () => (
  <>
    <View style={styles.statRow}>
      {STATS.map((stat) => (
        <View key={stat.label} style={styles.stat}>
          <Text style={styles.statValue}>{stat.value}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
      ))}
    </View>
    <Card>
      <Text style={styles.cardTitle}>Field note</Text>
      <Text style={styles.prose}>
        The Bengal tiger carries the largest wild population of any subspecies,
        concentrated in India with smaller ranges in Bangladesh, Nepal and
        Bhutan. Every tab here renders a different screen — switch between them
        and the body changes outright.
      </Text>
    </Card>
  </>
);
