import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import PostCard from '../components/PostCard';
import { createUserPost } from '../services/interactions';
import { theme } from '../theme/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ThreadScreen() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const postId = route.params?.postId as string;
  const feed = useStore((s) => s.feed);
  const threadsCache = useStore((s) => s.threadsCache);
  const loadReplies = useStore((s) => s.loadReplies);
  const likePost = useStore((s) => s.likePost);

  const [reply, setReply] = useState('');
  const parent = feed.find((x) => x.id === postId) || Object.values(threadsCache).flat().find((x) => x.id === postId);
  const replies = threadsCache[postId] || [];

  useEffect(() => { loadReplies(postId); }, [postId]);

  const send = async () => {
    if (!reply.trim() || !parent) return;
    try {
      await createUserPost(reply.trim(), parent.fandomId, parent.id);
      setReply('');
      loadReplies(postId);
    } catch (e: any) { Alert.alert('couldn\'t reply', String(e?.message || e)); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <FlatList
          data={replies}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={parent ? <PostCard post={parent} onLike={() => likePost(parent.id)} onOpenAuthor={() => parent.authorType === 'character' && nav.navigate('Character', { characterId: parent.authorId })} /> : null}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onLike={() => likePost(item.id)}
              onOpenAuthor={() => item.authorType === 'character' && nav.navigate('Character', { characterId: item.authorId })}
            />
          )}
        />
        <View style={{ flexDirection: 'row', padding: 10, gap: 8, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.bgAlt }}>
          <TextInput value={reply} onChangeText={setReply} placeholder="write a reply…" placeholderTextColor={theme.textFaint}
            style={{ flex: 1, color: theme.text, backgroundColor: theme.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 }} />
          <TouchableOpacity onPress={send} disabled={!reply.trim()}
            style={{ backgroundColor: reply.trim() ? theme.accent : theme.cardAlt, borderRadius: 20, paddingHorizontal: 16, justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>reply</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
