import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { Provider } from '../types';
import { theme } from '../theme/theme';

const HELP: Record<Provider, { where: string; url: string }> = {
  gemini:      { where: 'aistudio.google.com/apikey', url: 'https://aistudio.google.com/apikey' },
  groq:        { where: 'console.groq.com/keys',     url: 'https://console.groq.com/keys' },
  cerebras:    { where: 'cloud.cerebras.ai',          url: 'https://cloud.cerebras.ai' },
  openrouter:  { where: 'openrouter.ai/keys',         url: 'https://openrouter.ai/keys' },
  mistral:     { where: 'console.mistral.ai/api-keys',url: 'https://console.mistral.ai/api-keys' },
  together:    { where: 'api.together.ai/settings/api-keys', url: 'https://api.together.ai/settings/api-keys' },
  ollama:      { where: 'run `ollama serve` on your PC, use its LAN IP:11434', url: 'https://ollama.com' },
  openai:      { where: 'platform.openai.com/api-keys', url: 'https://platform.openai.com/api-keys' },
  anthropic:   { where: 'console.anthropic.com/settings/keys', url: 'https://console.anthropic.com/settings/keys' },
};

export default function ProviderEditScreen() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const id = route.params?.providerId as Provider;
  const cfg = useStore((s) => s.settings.providers[id]);
  const setKey = useStore((s) => s.setProviderKey);
  const setEnabled = useStore((s) => s.setProviderEnabled);
  const setModel = useStore((s) => s.setProviderModel);
  const setBaseUrl = useStore((s) => s.setProviderBaseUrl);
  const [key, setKeyLocal] = useState(cfg.apiKey || '');
  const [baseUrl, setBaseUrlLocal] = useState(cfg.baseUrl || '');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ color: theme.text, fontSize: 22, fontWeight: '800' }}>{cfg.label}</Text>
        <TouchableOpacity onPress={() => Linking.openURL(HELP[id].url)}>
          <Text style={{ color: theme.accent2, marginTop: 4, fontSize: 12 }}>get a key: {HELP[id].where}  ↗</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22 }}>
          <Text style={{ color: theme.text }}>enabled</Text>
          <Switch value={cfg.enabled} onValueChange={(v) => setEnabled(id, v)} />
        </View>

        {id !== 'ollama' ? (
          <>
            <Text style={{ color: theme.textDim, marginTop: 14, marginBottom: 6 }}>api key</Text>
            <TextInput value={key} onChangeText={setKeyLocal} onBlur={() => setKey(id, key)}
              autoCapitalize="none" secureTextEntry
              placeholder="paste your key here" placeholderTextColor={theme.textFaint}
              style={inp} />
          </>
        ) : (
          <>
            <Text style={{ color: theme.textDim, marginTop: 14, marginBottom: 6 }}>ollama base URL (LAN)</Text>
            <TextInput value={baseUrl} onChangeText={setBaseUrlLocal} onBlur={() => setBaseUrl(id, baseUrl)}
              autoCapitalize="none"
              placeholder="http://192.168.1.10:11434" placeholderTextColor={theme.textFaint}
              style={inp} />
            <Text style={{ color: theme.textFaint, marginTop: 6, fontSize: 11 }}>Phone must be on same Wi-Fi. Start `ollama serve` on your PC.</Text>
          </>
        )}

        <Text style={{ color: theme.textDim, marginTop: 18, marginBottom: 8 }}>default model</Text>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {cfg.models.map((m) => (
            <TouchableOpacity key={m} onPress={() => setModel(id, m)}
              style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, backgroundColor: cfg.defaultModel === m ? theme.accent + '33' : theme.card, borderColor: cfg.defaultModel === m ? theme.accent : theme.border }}>
              <Text style={{ color: cfg.defaultModel === m ? theme.accent : theme.textDim, fontSize: 12 }}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ marginTop: 24, backgroundColor: theme.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.border }}>
          <Text style={{ color: theme.textDim, fontSize: 12 }}>calls today: {cfg.dailyCount}</Text>
          {cfg.cooldownUntil && cfg.cooldownUntil > Date.now() ? (
            <Text style={{ color: theme.warn, fontSize: 12, marginTop: 4 }}>cooling down for {Math.ceil((cfg.cooldownUntil - Date.now())/1000)}s (rate-limited)</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const inp = { backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.border, color: theme.text, paddingHorizontal: 14, paddingVertical: 12 } as any;
