import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Initialize Reanimated logger config BEFORE importing reanimated
import '@/src/reanimated-logger-setup';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ErrorBoundary } from '@/src/components/ui/ErrorBoundary';
import { LoadingScreen } from '@/src/components/ui/LoadingScreen';
import { AuthProvider } from '@/src/contexts/AuthContext';
import { OfflineProvider } from '@/src/contexts/OfflineContext';
import { initDB } from '@/src/db/index';
import { logger } from '@/src/utils/logger';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    'Manrope-Regular': Manrope_400Regular,
    'Manrope-Medium': Manrope_500Medium,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold': Manrope_700Bold,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
  });

  useEffect(() => {
    // Log app startup
    logger.general.appStart('1.0.0');

    // Initialize database
    const initTimer = logger.startTimer('DB initialization');
    initDB()
      .then(() => {
        initTimer();
        logger.db.initialized();
      })
      .catch((error) => {
        initTimer();
        logger.db.error('initialization', error.message);
      });
  }, []);

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <OfflineProvider>
          <AuthProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="auth/login" options={{ headerShown: false }} />
                <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
                <Stack.Screen name="course/[levelId]" options={{ headerShown: false }} />
                <Stack.Screen name="lesson/[lessonId]" options={{ headerShown: false }} />
                <Stack.Screen name="quiz/[quizId]" options={{ headerShown: false }} />
                <Stack.Screen name="jobs" options={{ headerShown: false }} />
                <Stack.Screen name="community" options={{ headerShown: false }} />
                <Stack.Screen name="profile" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              </Stack>
              <StatusBar style="auto" />
            </ThemeProvider>
          </AuthProvider>
        </OfflineProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
