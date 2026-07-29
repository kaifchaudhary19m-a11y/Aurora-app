import React from 'react';
import { View, Text } from 'react-native';
import { theme } from '../theme/theme';

export function Avatar({ label, color, size = 40 }: { label: string; color?: string; size?: number }) {
  const initials = (label || '?').slice(0, 2).toUpperCase();
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color || theme.accent, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: theme.border,
    }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.4 }}>{initials}</Text>
    </View>
  );
}
