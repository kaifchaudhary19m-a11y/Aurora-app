import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { formatDistanceToNowStrict } from 'date-fns';
import { Post } from '../types';
import { useStore } from '../store/useStore';
import { Avatar } from './Avatar';
import { theme } from '../theme/theme';

export default function PostCard({ post, onPress, onLike, onOpenAuthor }: {
  post: Post;
  onPress?: () => void;
  onLike?: () => void;
  onOpenAuthor?: () => void;
}) {
  const activePersona = useStore((s) => s.activePersona);
  const characters = useStore((s) => s.characters);
  const author = post.authorType === 'persona' ? activePersona : characters.find((c) => c.id === post.authorId);
  const handle = author ? (author as any).handle : '???';
  const displayName = author ? (author as any).displayName : '???';
  const color = (author as any)?.avatarColor;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}
      style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', gap: 12 }}>
      <TouchableOpacity onPress={onOpenAuthor}>
        <Avatar label={displayName} color={color} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: theme.text, fontWeight: '700' }}>{displayName}</Text>
          <Text style={{ color: theme.textFaint }}>@{handle}</Text>
          <Text style={{ color: theme.textFaint }}>· {formatDistanceToNowStrict(post.createdAt, { addSuffix: false })}</Text>
          {post.isCancelPost ? <Text style={{ color: theme.danger, marginLeft: 4, fontSize: 11 }}>🔥 cancel</Text> : null}
        </View>
        <Text style={{ color: theme.text, marginTop: 4, lineHeight: 20 }}>{post.text}</Text>
        <View style={{ flexDirection: 'row', gap: 26, marginTop: 10 }}>
          <Text style={{ color: theme.textDim, fontSize: 12 }}>💬 {post.replies}</Text>
          <Text style={{ color: theme.textDim, fontSize: 12 }}>🔁 {post.reposts}</Text>
          <TouchableOpacity onPress={onLike}><Text style={{ color: theme.textDim, fontSize: 12 }}>♡ {post.likes}</Text></TouchableOpacity>
          {(post.auraDelta || post.humourDelta || post.controversyDelta) ? (
            <Text style={{ color: theme.textFaint, fontSize: 11 }}>
              {post.auraDelta ? `✧${sign(post.auraDelta)} ` : ''}
              {post.humourDelta ? `☺${sign(post.humourDelta)} ` : ''}
              {post.controversyDelta ? `⚠${sign(post.controversyDelta)}` : ''}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}
function sign(n: number) { return n > 0 ? `+${n}` : `${n}`; }
