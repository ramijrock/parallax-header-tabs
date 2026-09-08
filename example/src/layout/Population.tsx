import { Text, View } from 'react-native';
import { styles } from './styles';

/**
 * The only paging screen, so `onEndReached` has somewhere to page. The row
 * count is owned by the caller — the screen just draws what it is handed.
 */
export const Population = ({ rows }: { rows: number }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <View key={i} style={styles.row}>
        <Text style={styles.rowTitle}>Sighting {i + 1}</Text>
        <Text style={styles.rowMeta}>Scroll on to page in more</Text>
      </View>
    ))}
  </>
);
