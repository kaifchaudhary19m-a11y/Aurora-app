import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { pingProvider } from '../llm/router';
import { Provider } from '../types';

export default function SettingsScreen() {
  const nav = useNavigation<any>();
  const settings = useStore((s) => s.settings);
  const save = useStore((s) => s.saveSettings);
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<Record<string, { ok: boolean; msg: string }>>({});

  const testAll = async () => {
    setTesting(true);
    setResults({});
    const providers = Object.values(settings.providers);
    for (const p of providers) {
      if (!p.enabled) continue;
      if (p.id !== 'ollama' && !p.apiKey) { setResults((r) => ({ ...r, [p.id]: { ok: false, msg: 'no api key' } })); continue; }
      const r = await pingProvider(p);
      setResults((rs) => ({ ...rs, [p.id]: r }));
    }
    setTesting(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Section title="LLM providers">
          <Text style={{ color: theme.textDim, fontSize: 12, marginBottom: 10 }}>
            Add keys for as many as you want. The router rotates through them automatically. Even one free key (e.g. Gemini) is enough — but multiple = never rate-limited.
          </Text>
          {(Object.values(settings.providers) as any[]).map((p) => (
            <TouchableOpacity key={p.id} onPress={() => nav.navigate('ProviderEdit', { providerId: p.id })}
              style={{ padding: 14, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: '700' }}>{p.label}</Text>
                  <Text style={{ color: theme.textFaint, fontSize: 12 }}>
                    {p.enabled ? (p.apiKey || p.id === 'ollama' ? '✓ configured' : '⚠ enabled but no key') : '○ disabled'}
                    {'  ·  '}{p.dailyCount} calls today
                    {results[p.id] ? (results[p.id].ok ? '   ✓ ok' : `   ✗ ${results[p.id].msg}`) : ''}
                  </Text>
                </View>
                <Text style={{ color: theme.accent }}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={testAll} disabled={testing}
            style={{ marginTop: 6, backgroundColor: testing ? theme.cardAlt : theme.accent2, borderRadius: 999, paddingVertical: 10, alignItems: 'center' }}>
            <Text style={{ color: '#000', fontWeight: '800' }}>{testing ? 'testing…' : 'test all providers'}</Text>
          </TouchableOpacity>
        </Section>

        <Section title="router">
          <Row label="strategy">
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['round_robin','least_used','pinned_only'] as const).map((s) => (
                <TouchableOpacity key={s} onPress={() => save({ routerStrategy: s })}
                  style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: settings.routerStrategy === s ? theme.accent : theme.border, backgroundColor: settings.routerStrategy === s ? theme.accent + '33' : 'transparent' }}>
                  <Text style={{ color: settings.routerStrategy === s ? theme.accent : theme.textDim, fontSize: 12 }}>{s.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Row>
        </Section>

        <Section title="world">
          <Row label="content rating">
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['chill','edgy','unhinged'] as const).map((s) => (
                <TouchableOpacity key={s} onPress={() => save({ contentRating: s })}
                  style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: settings.contentRating === s ? theme.accent : theme.border, backgroundColor: settings.contentRating === s ? theme.accent + '33' : 'transparent' }}>
                  <Text style={{ color: settings.contentRating === s ? theme.accent : theme.textDim, fontSize: 12 }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Row>
          <Row label="autopilot (characters post on their own)">
            <Switch value={settings.autopilot} onValueChange={(v) => save({ autopilot: v })} />
          </Row>
          <Row label="show read receipts">
            <Switch value={settings.showReadReceipts} onValueChange={(v) => save({ showReadReceipts: v })} />
          </Row>
          <Row label="show typing indicators">
            <Switch value={settings.showTyping} onValueChange={(v) => save({ showTyping: v })} />
          </Row>
        </Section>

        <Section title="about">
          <Text style={{ color: theme.textDim, fontSize: 12, lineHeight: 18 }}>
            Aurora is a solo, local social simulation. Nothing you post leaves your device (except calls to LLM APIs you choose). All monetization / paywalls are disabled. Enjoy.
          </Text>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: any) {
  return (
    <View style={{ marginBottom: 22 }}>
      <Text style={{ color: theme.accent, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>{title}</Text>
      {children}
    </View>
  );
}
function Row({ label, children }: any) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border }}>
      <Text style={{ color: theme.text, flex: 1 }}>{label}</Text>
      {children}
    </View>
  );
}
