import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { AppTabBar } from '@/components/AppTabBar';
import { BrokerStatusBar } from '@/screens/HomeScreen/BrokerStatusBar';
import { useTheme } from '@/theme';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs
        initialRouteName="performance"
        tabBar={(props) => <AppTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        <Tabs.Screen name="performance" options={{ title: 'Performance' }} />
        <Tabs.Screen name="position" options={{ title: 'Position' }} />
        <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
        <Tabs.Screen name="rules" options={{ title: 'Rules' }} />
      </Tabs>
      <BrokerStatusBar />
    </View>
  );
}
