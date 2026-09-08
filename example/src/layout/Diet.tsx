import { Text, View } from 'react-native';
import { Card } from './Card';
import { styles } from './styles';

const DIET = [
  { prey: 'Chital', share: 0.42 },
  { prey: 'Sambar', share: 0.28 },
  { prey: 'Wild boar', share: 0.18 },
  { prey: 'Gaur', share: 0.12 },
];

export const Diet = () => (
  <Card>
    <Text style={styles.cardTitle}>Prey by share of kills</Text>
    {DIET.map(({ prey, share }) => (
      <View key={prey} style={styles.meterRow}>
        <Text style={styles.meterLabel}>{prey}</Text>
        {/* Two flex children rather than a percentage width — nothing to
            convert, and it stays honest at any track width. */}
        <View style={styles.meterTrack}>
          <View style={[styles.meterFill, { flex: share }]} />
          <View style={{ flex: 1 - share }} />
        </View>
        <Text style={styles.meterValue}>{Math.round(share * 100)}%</Text>
      </View>
    ))}
  </Card>
);
