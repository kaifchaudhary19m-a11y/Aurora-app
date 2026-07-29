import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { sendDMWithReply } from '../services/interactions';
import { Avatar } from '../components/Avatar';
import { theme } from '../theme/theme';
import { format } from 'date-fns';

export default function DMThreadScreen() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const characterId = route.params?.characterId as string;
  const activePersona = useStore((s) => s.activePersona);
  const character = useStore((s) => s.characters.find((c) => c.id === characterId));
  const key = `${activePersona?.id}:${characterId}`;
  const thread = useStore((s) => s.dmThreads[key]) || [];
  const loadThread = useStore((s) => s.loadDMThread);
  const markRead = useStore((s) => s.markThreadRead);
  const settings = useStore((s) => s.settings);
  const typingKey = `typing:${activePersona?.id}:${characterId}`;
  const typing = useStore((s: any) => s[typingKey]);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => { loadThread(characterId); markRead(characterId); }, [characterId]);

  useEffect(() => { setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100); }, [thread.length, typing]);

  const send = async () => {
    if (!text.trim()) return;
    const t = text.trim(); setText('');
    try { await sendDMWithReply(characterId, t); }
    catch (e: any) { Alert.alert('couldn\'t send', String(e?.message || e)); }
  };

  if (!character || !activePersona) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['bottom']}>
      <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => nav.navigate('Character', { characterId: character.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Avatar label={character.displayName} color={character.avatarColor} size={36} />
          <View>
            <Text style={{ color: theme.text, fontWeight: '700' }}>{character.displayName}</Text>
            <Text style={{ color: theme.textFaint, fontSize: 12 }}>@{character.handle} · {character.relationships[activePersona.id]?.status ?? 'stranger'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          data={thread}
          keyExtractor={(d) => d.id}
          contentContainerStyle={{ padding: 12, gap: 6 }}
          renderItem={({ item }) => {
            const mine = item.fromType === 'persona';
            return (
              <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
                <View style={{ backgroundColor: mine ? theme.accent : theme.card, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderTopRightRadius: mine ? 4 : 18, borderTopLeftRadius: mine ? 18 : 4 }}>
                  <Text style={{ color: mine ? '#fff' : theme.text }}>{item.text}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 3, alignSelf: mine ? 'flex-end' : 'flex-start' }}>
                  <Text style={{ color: theme.textFaint, fontSize: 10 }}>{format(item.createdAt, 'HH:mm')}</Text>
                  {mine && settings.showReadReceipts ? (
                    <Text style={{ color: item.readByCharacter ? theme.accent2 : theme.textFaint, fontSize: 10 }}>
                      {item.readByCharacter ? '✓✓ read' : '✓ sent'}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          }}
        />

        {typing && settings.showTyping ? (
          <View style={{ paddingLeft: 16, paddingBottom: 4 }}>
            <Text style={{ color: theme.textDim, fontSize: 12, fontStyle: 'italic' }}>{character.displayName} is typing…</Text>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', padding: 10, gap: 8, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.bgAlt }}>
          <TextInput value={text} onChangeText={setText} placeholder="message…" placeholderTextColor={theme.textFaint}
            style={{ flex: 1, color: theme.text, backgroundColor: theme.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 }} />
          <TouchableOpacity onPress={send} disabled={!text.trim()}
            style={{ backgroundColor: text.trim() ? theme.accent : theme.cardAlt, borderRadius: 20, paddingHorizontal: 16, justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
