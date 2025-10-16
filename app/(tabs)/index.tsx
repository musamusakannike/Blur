import { colors } from "@/lib/colors";
import React, { useState, useEffect } from "react";
import {
  useWindowDimensions,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { SceneMap, TabView } from "react-native-tab-view";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Posts } from "@/components/Posts";
import { Portal } from "@/components/Portal";
import { Groups } from "@/components/Groups";

const renderScene = SceneMap({
  posts: Posts,
  portal: Portal,
  groups: Groups,
});

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Index() {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "posts", title: "Posts" },
    { key: "portal", title: "Portal" },
    { key: "groups", title: "Groups" },
  ]);

  return (
    <View style={styles.container}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width }}
        renderTabBar={(props) => (
          <View style={styles.tabBarContainer}>
            <View style={styles.tabBarWrapper}>
              {props.navigationState.routes.map((route, i) => {
                const isActive = i === props.navigationState.index;
                return (
                  <TabBarItem
                    key={route.key}
                    route={route}
                    isActive={isActive}
                    onPress={() => setIndex(i)}
                  />
                );
              })}
            </View>
          </View>
        )}
      />
    </View>
  );
}

interface TabBarItemProps {
  route: { key: string; title: string };
  isActive: boolean;
  onPress: () => void;
}

function TabBarItem({ route, isActive, onPress }: TabBarItemProps) {
  const scale = useSharedValue(isActive ? 1.05 : 1);
  const opacity = useSharedValue(isActive ? 1 : 0.6);
  const translateY = useSharedValue(isActive ? -2 : 0);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1.05 : 1, {
      damping: 12,
      stiffness: 150,
    });
    opacity.value = withTiming(isActive ? 1 : 0.6, { duration: 200 });
    translateY.value = withSpring(isActive ? -2 : 0);
  }, [isActive, opacity, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    width: withTiming(isActive ? "100%" : "0%"),
    opacity: withTiming(isActive ? 1 : 0, { duration: 250 }),
  }));

  return (
    <AnimatedPressable onPress={onPress} style={[styles.tabItem, animatedStyle]}>
      <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
        {route.title}
      </Text>
      <Animated.View style={[styles.tabIndicator, indicatorStyle]} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  tabBarContainer: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tabBarWrapper: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabItem: {
    paddingTop: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "OpenSans_600SemiBold",
    color: colors.text.tertiary,
    letterSpacing: 0.4,
  },
  tabLabelActive: {
    color: colors.primary[500],
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "OpenSans_700Bold",
  },
  tabIndicator: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.primary[500],
    marginTop: 6,
    alignSelf: "center",
  },
});
