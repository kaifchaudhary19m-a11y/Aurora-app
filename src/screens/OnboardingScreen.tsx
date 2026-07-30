import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { theme } from '../theme/theme';

const COLORS = ['#8b5cf6','#22d3ee','#f59e0b','#ef4444','#10b981','#ec4899','#f97316','#3b82f6'];

export default function OnboardingScreen() {
  const createPersona = useStore((s) => s.createPersona);
  const fandoms = useStore((s) => s.fandoms);
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  const create = async () => {
    if (!displayName.trim()) return;
    try {
    await createPersona({
      handle: handle || displayName.toLowerCase().replace(/\s+/g, ''),
      displayName, bio, avatarColor: color, fandomIds: selected,
    });

    } catch (e) {
      Alert.alert("Error creating persona", String(e && e.message ? e.message : e));
    }
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
          <Text style={{ color: theme.accent, fontSize: 32, fontWeight: '800' }}>aurora</Text>
          <Text style={{ color: theme.textDim, marginTop: 2 }}>be anyone. build your world.</Text>

          <Text style={{ color: theme.text, marginTop: 28, marginBottom: 8, fontSize: 14 }}>display name</Text>
          <TextInput value={displayName} onChangeText={setDisplayName} placeholder="e.g. juno" placeholderTextColor={theme.textFaint}
            style={inp} />

          <Text style={{ color: theme.text, marginTop: 18, marginBottom: 8, fontSize: 14 }}>@handle</Text>
          <TextInput value={handle} onChangeText={setHandle} autoCapitalize="none" placeholder="juno" placeholderTextColor={theme.textFaint} style={inp} />

          <Text style={{ color: theme.text, marginTop: 18, marginBottom: 8, fontSize: 14 }}>bio</Text>
          <TextInput value={bio} onChangeText={setBio} multiline placeholder="say something interesting" placeholderTextColor={theme.textFaint}
            style={{ ...inp, height: 80, textAlignVertical: 'top' }} />

          <Text style={{ color: theme.text, marginTop: 18, marginBottom: 8, fontSize: 14 }}>vibe color</Text>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            {COLORS.map((c) => (
              <TouchableOpacity key={c} onPress={() => setColor(c)}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c, borderWidth: color === c ? 3 : 1, borderColor: color === c ? '#fff' : theme.border }} />
            ))}
          </View>

          <Text style={{ color: theme.text, marginTop: 22, marginBottom: 8, fontSize: 14 }}>join some fandoms (optional)</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {fandoms.map((f) => {
              const on = selected.includes(f.id);
              return (
                <TouchableOpacity key={f.id} onPress={() => toggle(f.id)}
                  style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1,
                    backgroundColor: on ? f.color + '33' : theme.card, borderColor: on ? f.color : theme.border }}>
                  <Text style={{ color: on ? f.color : theme.textDim, fontSize: 13 }}>{f.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity onPress={create} disabled={!displayName.trim()}
            style={{ marginTop: 32, backgroundColor: displayName.trim() ? theme.accent : theme.cardAlt, borderRadius: 999, paddingVertical: 14, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>enter aurora →</Text>
          </TouchableOpacity>
          <Text style={{ color: theme.textFaint, marginTop: 12, textAlign: 'center', fontSize: 12 }}>
            add your free API keys in Settings after — the app works with even one.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const inp = { backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.border, color: theme.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 } as any;
