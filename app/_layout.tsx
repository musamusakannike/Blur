import { colors } from "@/lib/colors";
import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useFonts,
  OpenSans_400Regular,
  OpenSans_600SemiBold,
  OpenSans_700Bold,
} from "@expo-google-fonts/open-sans";
import { AuthProvider } from "@/lib/auth";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    OpenSans_400Regular,
    OpenSans_600SemiBold,
    OpenSans_700Bold,
  });

  if (!fontsLoaded) {
    return null; // Or a custom splash/loading screen
  }

  return (
    <AuthProvider>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background.primary }}
      >
        <StatusBar backgroundColor={colors.background.primary} barStyle="light-content" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/register" />
          <Stack.Screen name="portal/[id]" />
          <Stack.Screen name="post/[id]" />
          <Stack.Screen name="group/[id]" />
        </Stack>
      </SafeAreaView>
    </AuthProvider>
  );
}
