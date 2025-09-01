export type EngineConfig = {
  autoPlay: boolean;
  sceneDurationSec: number;        // per-scene duration
  deterministic: boolean;          // use seed to order "free" scenes
  allowSkipBackOnly: boolean;      // users can go back, not forward
  overlays: { showDots: boolean; showArrows: boolean };
  personalization: { askNameIfMissing: boolean };
  toneSchedule: "serious-to-snarky";
  seed?: string;
};

export const defaultEngineConfig: EngineConfig = {
  autoPlay: true,
  sceneDurationSec: 12,            // You said 10–15s → pick 12s default
  deterministic: true,
  allowSkipBackOnly: true,
  overlays: { showDots: true, showArrows: true },
  personalization: { askNameIfMissing: true },
  toneSchedule: "serious-to-snarky"
};