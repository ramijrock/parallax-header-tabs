import { StyleSheet } from 'react-native';

/**
 * Shared body styles. Every panel draws from this one sheet, so a card on the
 * Overview tab and a row on the Housing tab cannot drift apart.
 */
export const styles = StyleSheet.create({
  // ── Rows: the plain list item, used by three panels ──────────────────────
  row: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 8,
    padding: 14,
    borderRadius: 10,
  },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  rowMeta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },

  // ── Cards ───────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 8,
    padding: 16,
    borderRadius: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#24595f',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  prose: { fontSize: 14, lineHeight: 21, color: '#4b5563' },

  // ── Stat tiles ──────────────────────────────────────────────────────────
  statRow: { flexDirection: 'row', marginHorizontal: 8, marginTop: 8 },
  stat: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  statValue: { fontSize: 20, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 11, color: '#9ca3af', marginTop: 4 },

  // ── Meters ──────────────────────────────────────────────────────────────
  meterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  meterLabel: { width: 82, fontSize: 13, color: '#4b5563' },
  meterTrack: {
    flex: 1,
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#eef0f2',
    overflow: 'hidden',
  },
  meterFill: { backgroundColor: '#24595f' },
  meterValue: { width: 38, textAlign: 'right', fontSize: 12, color: '#6b7280' },

  // ── Definition rows ─────────────────────────────────────────────────────
  defRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eef0f2',
  },
  defKey: { fontSize: 13, color: '#9ca3af' },
  defValue: { fontSize: 13, fontWeight: '600', color: '#111827' },

  // ── Misc ────────────────────────────────────────────────────────────────
  sectionNote: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 14,
    marginHorizontal: 16,
    textTransform: 'capitalize',
  },
});
