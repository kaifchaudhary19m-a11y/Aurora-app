import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { Avatar } from '../components/Avatar';
import { theme } from '../theme/theme';

export default function FandomDetailScreen() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const fandomId = route.params?.fandomId;
  const fandom = useStore((s) => s.fandoms.find((f) => f.id === fandomId));
  const characters = useStore((s) => s.characters.filter((c) => c.fandomIds.includes(fandomId)));
  const activePersona = useStore((s) => s.activePersona);
  const joinFandom = useStore((s) => s.joinFandom);
  const leaveFandom = useStore((s) => s.leaveFandom);
  if (!fandom) return null;
  const joined = !!activePersona?.fandomIds.includes(fandom.id);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: fandom.color + '10' }}>
        <Text style={{ color: fandom.color, fontSize: 26, fontWeight: '800' }}>✦ {fandom.name}</Text>
        <Text style={{ color: theme.textDim, marginTop: 4 }}>{fandom.description}</Text>
        <Text style={{ color: theme.textFaint, marginTop: 6, fontSize: 12 }}>{fandom.memberCount.toLocaleString()} members</Text>
        <TouchableOpacity onPress={() => joined ? leaveFandom(fandom.id) : joinFandom(fandom.id)}
          style={{ marginTop: 12, backgroundColor: joined ? theme.cardAlt : fandom.color, borderRadius: 999, paddingVertical: 10, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '800' }}>{joined ? 'leave' : 'join'}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={characters}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={<Text style={{ color: theme.textDim, padding: 16, fontSize: 12 }}>notable members</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => nav.navigate('Character', { characterId: item.id })}
            style={{ flexDirection: 'row', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: theme.border, alignItems: 'center' }}>
            <Avatar label={item.displayName} color={item.avatarColor} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: '700' }}>{item.displayName}</Text>
              <Text style={{ color: theme.textFaint }}>@{item.handle} · {item.archetype}</Text>
              <Text style={{ color: theme.textDim, fontSize: 12 }} numberOfLines={1}>{item.bio}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
