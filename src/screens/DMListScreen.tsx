import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { Avatar } from '../components/Avatar';
import { theme } from '../theme/theme';
import { formatDistanceToNowStrict } from 'date-fns';

export default function DMListScreen() {
  const nav = useNavigation<any>();
  const characters = useStore((s) => s.characters);
  const activePersona = useStore((s) => s.activePersona);
  const dmThreads = useStore((s) => s.dmThreads);

  const rows = characters.map((c) => {
    const key = `${activePersona?.id}:${c.id}`;
    const dms = dmThreads[key] || [];
    const last = dms[dms.length - 1];
    return { c, last, hasThread: dms.length > 0 };
  }).sort((a, b) => (b.last?.createdAt || 0) - (a.last?.createdAt || 0));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <Text style={{ color: theme.text, fontSize: 22, fontWeight: '800' }}>DMs</Text>
        <Text style={{ color: theme.textDim, fontSize: 12 }}>tap anyone to slide in. read receipts on.</Text>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.c.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => nav.navigate('DMThread', { characterId: item.c.id })}
            style={{ flexDirection: 'row', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: theme.border, alignItems: 'center' }}>
            <Avatar label={item.c.displayName} color={item.c.avatarColor} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.text, fontWeight: '700' }}>{item.c.displayName}</Text>
                {item.last ? <Text style={{ color: theme.textFaint, fontSize: 11 }}>{formatDistanceToNowStrict(item.last.createdAt)}</Text> : null}
              </View>
              <Text style={{ color: theme.textDim, fontSize: 13 }} numberOfLines={1}>
                {item.last ? item.last.text : `@${item.c.handle} · ${item.c.archetype}`}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
