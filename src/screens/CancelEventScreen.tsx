import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { theme } from '../theme/theme';

export default function CancelEventScreen() {
  const route = useRoute<any>();
  const id = route.params?.eventId;
  const ev = useStore((s) => s.cancelEvents.find((x) => x.id === id));
  const characters = useStore((s) => s.characters);
  if (!ev) return null;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ color: theme.danger, fontSize: 22, fontWeight: '800' }}>🔥 cancelled</Text>
        <Text style={{ color: theme.text, marginTop: 8 }}>reason: {ev.reason}</Text>
        <Text style={{ color: theme.textDim, marginTop: 4 }}>severity {ev.severity} · outcome: {ev.resolvedOutcome ?? 'ongoing'}</Text>
        <Text style={{ color: theme.textDim, marginTop: 2 }}>follower loss: {ev.followerLossPct}%</Text>
        <Text style={{ color: theme.textDim, marginTop: 2 }}>aura hit: {ev.auraDelta}</Text>
        <Text style={{ color: theme.accent, marginTop: 20, textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 12 }}>participants</Text>
        {ev.participantCharacterIds.map((cid) => {
          const c = characters.find((x) => x.id === cid);
          if (!c) return null;
          return <Text key={cid} style={{ color: theme.text, marginTop: 4 }}>· @{c.handle} ({c.archetype})</Text>;
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
