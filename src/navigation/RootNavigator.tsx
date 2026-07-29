import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import FeedScreen from '../screens/FeedScreen';
import ComposeScreen from '../screens/ComposeScreen';
import ThreadScreen from '../screens/ThreadScreen';
import FandomsScreen from '../screens/FandomsScreen';
import FandomDetailScreen from '../screens/FandomDetailScreen';
import DMListScreen from '../screens/DMListScreen';
import DMThreadScreen from '../screens/DMThreadScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PersonaEditScreen from '../screens/PersonaEditScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProviderEditScreen from '../screens/ProviderEditScreen';
import CharacterProfileScreen from '../screens/CharacterProfileScreen';
import CancelEventScreen from '../screens/CancelEventScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import { useStore } from '../store/useStore';
import { theme } from '../theme/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: focused ? theme.accent : theme.textDim, fontSize: 20 }}>{label}</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: theme.bgAlt, borderTopColor: theme.border, height: 62, paddingTop: 6, paddingBottom: 10 },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen name="Feed" component={FeedScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon label="⌂" focused={focused} /> }} />
      <Tab.Screen name="Fandoms" component={FandomsScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon label="✦" focused={focused} /> }} />
      <Tab.Screen name="Compose" component={ComposeScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon label="✎" focused={focused} /> }} />
      <Tab.Screen name="DMs" component={DMListScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon label="✉" focused={focused} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon label="●" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const activePersona = useStore((s) => s.activePersona);
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.bg }, headerTintColor: theme.text, contentStyle: { backgroundColor: theme.bg } }}>
      {!activePersona ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="Thread" component={ThreadScreen} options={{ title: 'thread' }} />
          <Stack.Screen name="FandomDetail" component={FandomDetailScreen} options={{ title: '' }} />
          <Stack.Screen name="DMThread" component={DMThreadScreen} options={{ title: '' }} />
          <Stack.Screen name="Character" component={CharacterProfileScreen} options={{ title: '' }} />
          <Stack.Screen name="PersonaEdit" component={PersonaEditScreen} options={{ title: 'edit persona' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'settings' }} />
          <Stack.Screen name="ProviderEdit" component={ProviderEditScreen} options={{ title: '' }} />
          <Stack.Screen name="CancelEvent" component={CancelEventScreen} options={{ title: 'canceled' }} />
        </>
      )}
    </Stack.Navigator>
  );
}
