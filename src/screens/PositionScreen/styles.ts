import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 12,
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
    paddingBottom: 24,
  },
  totalCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalCopy: {
    alignItems: 'center',
    gap: 4,
  },
  totalLabel: {
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
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
  rightSpacer: {
    height: 16,
  },
  symbol: {
    fontWeight: '700',
  },
  pnl: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
});

export type PositionScreenStyles = typeof styles;
