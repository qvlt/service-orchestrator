import type { Clock } from '../engine/types';

export const SystemClock: Clock = { now: () => Date.now() };
