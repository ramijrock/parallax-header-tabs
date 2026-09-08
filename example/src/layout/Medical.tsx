import { Text, View } from 'react-native';
import { styles } from './styles';

/** Keyed by sub tab, so the second bar picks the list. */
const RECORDS: Record<string, { title: string; meta: string }[]> = {
  pending: [
    { title: 'Dental check — Rani', meta: 'due 12 Sep · vet Roy' },
    { title: 'Blood panel — Bagh', meta: 'due 15 Sep · external lab' },
  ],
  approved: [
    { title: 'Vaccination — Rani', meta: 'signed 02 Sep · vet Roy' },
    { title: 'Weight review — Bagh', meta: 'signed 28 Aug · vet Das' },
    { title: 'Claw trim — Mira', meta: 'signed 21 Aug · vet Roy' },
  ],
};

export const Medical = ({ subTab }: { subTab: string }) => {
  const records = RECORDS[subTab] ?? [];
  return (
    <>
      <Text style={styles.sectionNote}>
        {records.length} {subTab} record{records.length === 1 ? '' : 's'}
      </Text>
      {records.map((record) => (
        <View key={record.title} style={styles.row}>
          <Text style={styles.rowTitle}>{record.title}</Text>
          <Text style={styles.rowMeta}>{record.meta}</Text>
        </View>
      ))}
    </>
  );
};
