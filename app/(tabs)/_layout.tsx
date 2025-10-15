import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '@/lib/colors';

function AnimatedTabIcon({
  name,
  size,
  color,
  isActive,
}: {
  name: string;
  size: number;
  color: string;
  isActive: boolean;
}) {
  const scale = useSharedValue(isActive ? 1.2 : 1);

  React.useEffect(() => {
    scale.value = withSpring(isActive ? 1.2 : 1, {
      damping: 10,
      mass: 1,
      stiffness: 100,
    });
  }, [isActive, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={name as any} size={size} color={color} />
    </Animated.View>
  );
}

export default function TabLayout() {
  const [activeTab, setActiveTab] = React.useState('index');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarItemStyle: styles.tabBarItem,
      }}
      screenListeners={{
        state: (e) => {
          const route = e.data.state.routes[e.data.state.index];
          setActiveTab(route.name);
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <AnimatedTabIcon
              name="home"
              size={size}
              color={color}
              isActive={activeTab === 'index'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          tabBarIcon: ({ color, size }) => (
            <View style={styles.centerIconContainer}>
              <Animated.View style={styles.createButtonGlow} />
              <View style={styles.createButton}>
                <Ionicons name="add" size={28} color="#ffffff" />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <AnimatedTabIcon
              name="person"
              size={size}
              color={color}
              isActive={activeTab === 'profile'}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background.secondary,
    borderTopWidth: 0,
    height: 80,
    paddingBottom: 16,
    paddingTop: 12,
    paddingHorizontal: 16,
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 24,
    marginHorizontal: 8,
    marginBottom: 8,
    overflow: 'hidden',
    backdropFilter: 'blur(20px)',
  },
  tabBarItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  centerIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary[500],
    opacity: 0.2,
  },
  createButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 15,
  },
});