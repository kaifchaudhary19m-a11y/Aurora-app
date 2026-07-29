import { useStore } from '../store/useStore';
import { characterAutopilotTick } from './interactions';

let started = false;
export function startBackgroundLoops() {
  if (started) return; started = true;

  // energy regen every 15s
  setInterval(() => useStore.getState().regenEnergy(), 15_000);

  // character autopilot posts
  const tick = async () => {
    try {
      const s = useStore.getState();
      if (s.settings.autopilot && s.activePersona) await characterAutopilotTick();
    } catch {}
    const jitter = 0.6 + Math.random() * 0.8;
    setTimeout(tick, useStore.getState().settings.autopilotIntervalMs * jitter);
  };
  setTimeout(tick, 8_000);
}
