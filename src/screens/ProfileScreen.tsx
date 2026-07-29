import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { useNavigation } from '@react-navigation/native';
import { Avatar } from '../components/Avatar';
import { theme } from '../theme/theme';

export default function ProfileScreen() {
  const nav = useNavigation<any>();
  const p = useStore((s) => s.activePersona);
  const cancelEvents = useStore((s) => s.cancelEvents);
  const personas = useStore((s) => s.personas);
  const setActive = useStore((s) => s.setActivePersona);

  if (!p) return null;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView>
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Avatar label={p.displayName} color={p.avatarColor} size={80} />
          <Text style={{ color: theme.text, fontSize: 22, fontWeight: '800', marginTop: 10 }}>{p.displayName}</Text>
          <Text style={{ color: theme.textDim }}>@{p.handle}</Text>
          <Text style={{ color: theme.text, marginTop: 10, textAlign: 'center' }}>{p.bio || '—'}</Text>

          <View style={{ flexDirection: 'row', gap: 18, marginTop: 18 }}>
            <Stat label="followers" value={p.followers} />
            <Stat label="aura" value={p.aura} color={theme.aura} />
            <Stat label="humour" value={p.humour} color={theme.humour} />
            <Stat label="controversy" value={p.controversy} color={theme.danger} />
          </View>

          <TouchableOpacity onPress={() => nav.navigate('PersonaEdit')}
            style={{ marginTop: 20, borderWidth: 1, borderColor: theme.border, borderRadius: 999, paddingHorizontal: 20, paddingVertical: 8 }}>
            <Text style={{ color: theme.text }}>edit persona</Text>
          </TouchableOpacity>
        </View>

        {personas.length > 1 ? (
          <View style={{ paddingHorizontal: 16 }}>
            <Text style={{ color: theme.textDim, marginBottom: 8 }}>switch persona</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {personas.map((x) => (
                <TouchableOpacity key={x.id} onPress={() => setActive(x.id)}
                  style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, backgroundColor: x.id === p.id ? theme.accent + '33' : theme.card, borderColor: x.id === p.id ? theme.accent : theme.border }}>
                  <Text style={{ color: theme.text }}>@{x.handle}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ padding: 16 }}>
          <Text style={{ color: theme.textDim, marginBottom: 8 }}>cancel history</Text>
          {cancelEvents.length === 0 ? (
            <Text style={{ color: theme.textFaint, fontSize: 12 }}>you have not been dragged. yet.</Text>
          ) : cancelEvents.map((e) => (
            <TouchableOpacity key={e.id} onPress={() => nav.navigate('CancelEvent', { eventId: e.id })}
              style={{ backgroundColor: theme.card, borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: theme.danger }}>
              <Text style={{ color: theme.text, fontWeight: '700' }}>🔥 {e.reason}</Text>
              <Text style={{ color: theme.textDim, fontSize: 12 }}>severity {e.severity} · {e.resolvedOutcome ?? 'ongoing'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: color || theme.text, fontSize: 18, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: theme.textDim, fontSize: 11 }}>{label}</Text>
    </View>
  );
}
