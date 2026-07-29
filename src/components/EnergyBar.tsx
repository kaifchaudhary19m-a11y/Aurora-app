import React from 'react';
import { View, Text } from 'react-native';
import { useStore } from '../store/useStore';
import { theme } from '../theme/theme';

export default function EnergyBar() {
  const e = useStore((s) => s.energy);
  const pct = Math.max(0, Math.min(1, e.current / e.max));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 80, height: 8, backgroundColor: theme.cardAlt, borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: theme.energy }} />
      </View>
      <Text style={{ color: theme.textDim, fontSize: 12 }}>{e.current}/{e.max}⚡</Text>
    </View>
  );
}
