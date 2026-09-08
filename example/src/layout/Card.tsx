import type { ReactNode } from 'react';
import { View } from 'react-native';
import { styles } from './styles';

/** The white panel every non-list body screen sits in. */
export const Card = ({ children }: { children: ReactNode }) => (
  <View style={styles.card}>{children}</View>
);
