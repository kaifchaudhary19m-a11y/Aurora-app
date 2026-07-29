import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { createUserPost } from '../services/interactions';
import { theme } from '../theme/theme';

export default function ComposeScreen() {
  const nav = useNavigation<any>();
  const fandoms = useStore((s) => s.fandoms);
  const activePersona = useStore((s) => s.activePersona);
  const [text, setText] = useState('');
  const [fandomId, setFandomId] = useState<string | undefined>(undefined);
  const [posting, setPosting] = useState(false);

  const post = async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      await createUserPost(text.trim(), fandomId);
      setText('');
      nav.navigate('Feed');
    } catch (e: any) {
      Alert.alert('couldn\'t post', String(e?.message || e));
    } finally {
      setPosting(false);
    }
  };

  const joined = fandoms.filter((f) => activePersona?.fandomIds.includes(f.id));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700' }}>new post</Text>
          <TouchableOpacity onPress={post} disabled={!text.trim() || posting}
            style={{ backgroundColor: text.trim() ? theme.accent : theme.cardAlt, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999 }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>{posting ? '...' : 'post'}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <TextInput
            value={text} onChangeText={setText}
            placeholder="what are you thinking?" placeholderTextColor={theme.textFaint}
            multiline autoFocus
            style={{ color: theme.text, fontSize: 18, minHeight: 160, textAlignVertical: 'top' }} />
          <Text style={{ color: theme.textFaint, marginTop: 8, fontSize: 12 }}>{text.length}/500</Text>

          {joined.length ? (
            <>
              <Text style={{ color: theme.textDim, marginTop: 20, marginBottom: 8 }}>post to fandom (optional)</Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <TouchableOpacity onPress={() => setFandomId(undefined)}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, backgroundColor: !fandomId ? theme.accent + '33' : theme.card, borderColor: !fandomId ? theme.accent : theme.border }}>
                  <Text style={{ color: !fandomId ? theme.accent : theme.textDim, fontSize: 13 }}>public</Text>
                </TouchableOpacity>
                {joined.map((f) => {
                  const on = fandomId === f.id;
                  return (
                    <TouchableOpacity key={f.id} onPress={() => setFandomId(f.id)}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, backgroundColor: on ? f.color + '33' : theme.card, borderColor: on ? f.color : theme.border }}>
                      <Text style={{ color: on ? f.color : theme.textDim, fontSize: 13 }}>{f.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : null}

          <View style={{ marginTop: 26, backgroundColor: theme.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: theme.border }}>
            <Text style={{ color: theme.textDim, fontSize: 12, lineHeight: 18 }}>
              💡 how it feels here: your posts change your aura, humour, and controversy. characters actually read what you write. spicy takes get louder replies (and can trigger cancel storms). soft posts build affinity. everyone remembers.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
