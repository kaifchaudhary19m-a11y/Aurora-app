import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { theme } from '../theme/theme';
import { useNavigation } from '@react-navigation/native';

export default function FandomsScreen() {
  const nav = useNavigation<any>();
  const fandoms = useStore((s) => s.fandoms);
  const activePersona = useStore((s) => s.activePersona);
  const joinFandom = useStore((s) => s.joinFandom);
  const leaveFandom = useStore((s) => s.leaveFandom);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <Text style={{ color: theme.text, fontSize: 22, fontWeight: '800' }}>fandoms</Text>
        <Text style={{ color: theme.textDim, fontSize: 12 }}>join communities. each one has its own vibe & follower pool.</Text>
      </View>
      <FlatList
        data={fandoms}
        keyExtractor={(f) => f.id}
        renderItem={({ item }) => {
          const joined = !!activePersona?.fandomIds.includes(item.id);
          return (
            <TouchableOpacity onPress={() => nav.navigate('FandomDetail', { fandomId: item.id })}
              style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: item.color + '33', borderWidth: 1, borderColor: item.color, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: item.color, fontWeight: '900' }}>✦</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: '700' }}>{item.name}</Text>
                <Text style={{ color: theme.textDim, fontSize: 12 }}>{item.description}</Text>
                <Text style={{ color: theme.textFaint, fontSize: 11, marginTop: 2 }}>{item.memberCount.toLocaleString()} members</Text>
              </View>
              <TouchableOpacity onPress={() => joined ? leaveFandom(item.id) : joinFandom(item.id)}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: joined ? theme.cardAlt : theme.accent }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{joined ? 'joined' : 'join'}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}
