import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import { View } from 'react-native';

import { AddFab } from '@/components/ui/fab';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/hooks/use-t';

export default function TabsLayout() {
  const theme = useTheme();
  const { t } = useT();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabHome'),
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="money"
          options={{
            title: t('tabMoney'),
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="wealth"
          options={{
            title: t('tabWealth'),
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'pie-chart' : 'pie-chart-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="life"
          options={{
            title: t('tabLife'),
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'leaf' : 'leaf-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            title: t('coach'),
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      <AddFab />
    </View>
  );
}
