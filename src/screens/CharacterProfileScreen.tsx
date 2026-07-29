import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { Avatar } from '../components/Avatar';
import { theme } from '../theme/theme';

export default function CharacterProfileScreen() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const id = route.params?.characterId;
  const c = useStore((s) => s.characters.find((x) => x.id === id));
  const p = useStore((s) => s.activePersona);
  if (!c || !p) return null;
  const r = c.relationships[p.id];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ alignItems: 'center' }}>
          <Avatar label={c.displayName} color={c.avatarColor} size={80} />
          <Text style={{ color: theme.text, fontSize: 22, fontWeight: '800', marginTop: 10 }}>{c.displayName}</Text>
          <Text style={{ color: theme.textDim }}>@{c.handle} · {c.archetype}</Text>
          <Text style={{ color: theme.text, marginTop: 10, textAlign: 'center' }}>{c.bio}</Text>
        </View>

        <View style={{ marginTop: 22, gap: 8 }}>
          <Info label="humour style" value={c.humourStyle} />
          <Info label="values" value={c.values.join(', ')} />
          <Info label="quirks" value={c.quirks.join(' · ')} />
          <Info label="taboos" value={c.taboos.join(' · ')} />
          <Info label="edge level" value={`${Math.round(c.edgeLevel * 100)}%`} />
          <Info label="running on" value={`${c.providerId} · ${c.model}`} />
        </View>

        <View style={{ marginTop: 22, padding: 14, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
          <Text style={{ color: theme.accent, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>your relationship</Text>
          <Text style={{ color: theme.text }}>status: <Text style={{ fontWeight: '700' }}>{r?.status ?? 'stranger'}</Text></Text>
          <Text style={{ color: theme.textDim, fontSize: 12, marginTop: 2 }}>affinity {r?.affinity ?? 0} · trust {r?.trust ?? 20} · drama {r?.drama ?? 0} · interactions {r?.interactions ?? 0}</Text>
          {r?.grudges?.length ? <Text style={{ color: theme.danger, marginTop: 8, fontSize: 12 }}>grudges: {r.grudges.slice(-3).join(' · ')}</Text> : null}
          {r?.fondMemories?.length ? <Text style={{ color: theme.accent2, marginTop: 4, fontSize: 12 }}>fond memories: {r.fondMemories.slice(-3).join(' · ')}</Text> : null}
        </View>

        <TouchableOpacity onPress={() => nav.navigate('DMThread', { characterId: c.id })}
          style={{ marginTop: 20, backgroundColor: theme.accent, borderRadius: 999, paddingVertical: 14, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '800' }}>message</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={{ color: theme.textFaint, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
      <Text style={{ color: theme.text }}>{value}</Text>
    </View>
  );
}
