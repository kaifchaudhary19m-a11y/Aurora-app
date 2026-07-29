import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import PostCard from '../components/PostCard';
import EnergyBar from '../components/EnergyBar';
import { theme } from '../theme/theme';
import { useNavigation } from '@react-navigation/native';

export default function FeedScreen() {
  const nav = useNavigation<any>();
  const feed = useStore((s) => s.feed);
  const reloadFeed = useStore((s) => s.reloadFeed);
  const activePersona = useStore((s) => s.activePersona);
  const likePost = useStore((s) => s.likePost);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reloadFeed();
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <View>
          <Text style={{ color: theme.accent, fontSize: 22, fontWeight: '800' }}>aurora</Text>
          <Text style={{ color: theme.textDim, fontSize: 12 }}>@{activePersona?.handle}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <EnergyBar />
          <TouchableOpacity onPress={() => nav.navigate('Settings')}>
            <Text style={{ color: theme.textDim, fontSize: 20 }}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        ListEmptyComponent={
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={{ color: theme.textDim, textAlign: 'center' }}>your feed is empty. compose your first post ✎</Text>
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => nav.navigate('Thread', { postId: item.id })}
            onLike={() => likePost(item.id)}
            onOpenAuthor={() => item.authorType === 'character' && nav.navigate('Character', { characterId: item.authorId })}
          />
        )}
      />
    </SafeAreaView>
  );
}
