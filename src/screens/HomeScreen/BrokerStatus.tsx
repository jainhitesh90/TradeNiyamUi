import { Pressable, View } from 'react-native';

import { CustomText } from '@/components';
import { styles } from '@/screens/HomeScreen/styles';
import { useTheme } from '@/theme';

type BrokerStatusProps = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function BrokerStatus({ message, actionLabel, onAction }: BrokerStatusProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={message}
      style={[styles.statusBar, { backgroundColor: colors.highlight, borderBottomColor: colors.highlightBorder }]}
    >
      <View style={[styles.statusDot, { backgroundColor: colors.danger }]} />
      <CustomText id="home-broker-status" variant="small" numberOfLines={1} style={[styles.statusMessage, { color: colors.onHighlight }]}>
        {message}
      </CustomText>
      {actionLabel && onAction ? (
        <Pressable
          testID="home-broker-connect"
          nativeID="home-broker-connect"
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={8}
          onPress={onAction}
        >
          <CustomText id="home-broker-connect-label" variant="link" style={[styles.statusAction, { color: colors.primary }]}>
            {actionLabel}
          </CustomText>
        </Pressable>
      ) : null}
    </View>
  );
}
