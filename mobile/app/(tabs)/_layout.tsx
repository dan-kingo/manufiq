import { Tabs } from 'expo-router';
import { Platform, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { useEffect } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

function TabBarIcon({ name, color, focused }: { name: any; color: string; focused: boolean }) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: withSpring(focused ? 1.4 : 1, { damping: 15, stiffness: 150 }) },
        { translateY: withSpring(focused ? -2 : 0, { damping: 15, stiffness: 150 }) },
      ],
    };
  });

  const iconColor = focused ? colors.primary : color;

  return (
    <Animated.View style={animatedStyle}>
      <MaterialCommunityIcons name={name} size={24} color={iconColor} />
    </Animated.View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom ?? 0;

  const baseHeight = Platform.OS === 'ios' ? 88 : 78;
  const basePaddingBottom = Platform.OS === 'ios' ? 24 : 12;

  const tabBarStyle = {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border + '80',
    marginBottom: 0,
    height: baseHeight + bottomInset,
    paddingBottom: basePaddingBottom + bottomInset,
    paddingTop: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarActiveBackgroundColor: colors.surface,
        tabBarInactiveBackgroundColor: colors.surface,
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="home" color={color} focused={focused} />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ color: focused ? colors.primary : colors.textMuted, fontSize: 12, fontWeight: '600', marginTop: 6 }}>Home</Text>
          )
        }}
      />
      <Tabs.Screen
        name="stock"
        options={{
          title: 'Stock',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="package-variant" color={color} focused={focused} />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ color: focused ? colors.primary : colors.textMuted, fontSize: 12, fontWeight: '600', marginTop: 6 }}>Stock</Text>
          )
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="qrcode-scan" color={color} focused={focused} />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ color: focused ? colors.primary : colors.textMuted, fontSize: 12, fontWeight: '600', marginTop: 6 }}>Scan</Text>
          )
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="chart-bar" color={color} focused={focused} />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ color: focused ? colors.primary : colors.textMuted, fontSize: 12, fontWeight: '600', marginTop: 6 }}>Reports</Text>
          )
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="cog" color={color} focused={focused} />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ color: focused ? colors.primary : colors.textMuted, fontSize: 12, fontWeight: '600', marginTop: 6 }}>Settings</Text>
          )
        }}
      />
    </Tabs>
  );
}
