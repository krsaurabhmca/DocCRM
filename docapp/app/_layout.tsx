import { useEffect, useState, createContext, useContext } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, View } from "react-native";

// 🔹 Auth Context for global state
const AuthContext = createContext<{
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  checkAuth: () => Promise<void>;
}>({
  isAuthenticated: false,
  setIsAuthenticated: () => {},
  checkAuth: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      setIsAuthenticated(!!token);
    } catch (e) {
      setIsAuthenticated(false);
    } finally {
      setIsReady(true);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === "login" || segments[0] === "signup";

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace("/login");
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to home if authenticated but trying to access login/signup
      router.replace("/");
    }
  }, [isAuthenticated, segments, isReady]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, checkAuth }}>
      <SafeAreaProvider>
        <Stack 
          screenOptions={{ 
            headerStyle: { backgroundColor: "#0284C7" },
            headerTintColor: "#FFFFFF",
            headerTitleStyle: { fontWeight: "700", fontSize: 18 },
            headerShadowVisible: false,
            headerBackTitleVisible: false,
          }} 
        />
      </SafeAreaProvider>
    </AuthContext.Provider>
  );
}
