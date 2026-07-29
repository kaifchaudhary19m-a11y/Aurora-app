import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';
import { initDatabase } from './src/db/database';
import { useStore } from './src/store/useStore';
import { theme } from './src/theme/theme';
import { startBackgroundLoops } from './src/services/backgroundLoops';

export default function App() {
  const [ready, setReady] = useState(false);
  const hydrate = useStore((s) => s.hydrate);

  useEffect(() => {
    (async () => {
      await initDatabase();
      await hydrate();
      startBackgroundLoops();
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.accent} />
        <Text style={{ color: theme.textDim, marginTop: 12 }}>waking your world up…</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={{
        dark: true,
        colors: {
          primary: theme.accent,
          background: theme.bg,
          card: theme.card,
          text: theme.text,
          border: theme.border,
          notification: theme.accent,
        },
      } as any}>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
