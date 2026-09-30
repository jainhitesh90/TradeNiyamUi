import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 12,
  },
  banner: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  error: {
    marginBottom: 4,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopy: {
    flex: 1,
    gap: 2,
    minWidth: 120,
  },
  cancel: {
    position: 'absolute',
    top: -10,
    right: -10,
    zIndex: 2,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  valueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  valueBox: {
    width: 64,
    height: 36,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    paddingVertical: 0,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    outlineStyle: 'solid',
    outlineWidth: 1,
  },
  value: {
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
  },
  fieldError: {
    textAlign: 'right',
  },
  deleteAll: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export type RulesScreenStyles = typeof styles;
