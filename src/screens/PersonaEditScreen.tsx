import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme/theme';

const COLORS = ['#8b5cf6','#22d3ee','#f59e0b','#ef4444','#10b981','#ec4899','#f97316','#3b82f6'];

export default function PersonaEditScreen() {
  const nav = useNavigation<any>();
  const p = useStore((s) => s.activePersona)!;
  const update = useStore((s) => s.updatePersona);
  const create = useStore((s) => s.createPersona);

  const [displayName, setDisplayName] = useState(p.displayName);
  const [handle, setHandle] = useState(p.handle);
  const [bio, setBio] = useState(p.bio);
  const [color, setColor] = useState(p.avatarColor);

  const save = async () => {
    await update({ ...p, displayName, handle, bio, avatarColor: color });
    nav.goBack();
  };
  const newPersona = async () => {
    await create({ displayName: 'new persona', handle: 'new' });
    nav.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ color: theme.textDim, marginBottom: 6 }}>display name</Text>
        <TextInput value={displayName} onChangeText={setDisplayName} style={inp} />
        <Text style={{ color: theme.textDim, marginTop: 14, marginBottom: 6 }}>@handle</Text>
        <TextInput value={handle} onChangeText={setHandle} autoCapitalize="none" style={inp} />
        <Text style={{ color: theme.textDim, marginTop: 14, marginBottom: 6 }}>bio</Text>
        <TextInput value={bio} onChangeText={setBio} multiline style={{ ...inp, height: 90, textAlignVertical: 'top' }} />
        <Text style={{ color: theme.textDim, marginTop: 14, marginBottom: 6 }}>vibe color</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {COLORS.map((c) => (
            <TouchableOpacity key={c} onPress={() => setColor(c)}
              style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c, borderWidth: color === c ? 3 : 1, borderColor: color === c ? '#fff' : theme.border }} />
          ))}
        </View>
        <TouchableOpacity onPress={save} style={{ marginTop: 24, backgroundColor: theme.accent, borderRadius: 999, paddingVertical: 14, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '800' }}>save</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={newPersona} style={{ marginTop: 12, borderWidth: 1, borderColor: theme.border, borderRadius: 999, paddingVertical: 12, alignItems: 'center' }}>
          <Text style={{ color: theme.text }}>+ create another persona</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
const inp = { backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.border, color: theme.text, paddingHorizontal: 14, paddingVertical: 12 } as any;
