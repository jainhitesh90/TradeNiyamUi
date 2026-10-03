import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  title: {
    marginBottom: 20,
  },
  error: {
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cell: {
    width: '47%',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  logo: {
    width: 56,
    height: 56,
    resizeMode: 'contain',
  },
  locked: {
    opacity: 0.4,
  },
});
