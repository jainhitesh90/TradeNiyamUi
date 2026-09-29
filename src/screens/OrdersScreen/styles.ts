import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  error: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  empty: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 32,
  },
  dateHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    zIndex: 2,
    position: 'sticky',
    top: -1,
  },
  dateTitle: {
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: {
    flex: 1,
    gap: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 2,
  },
  symbol: {
    fontWeight: '500',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

export type OrdersScreenStyles = typeof styles;
