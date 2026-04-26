import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppState } from './types';

const KEY = '@80hd:state';

const DEFAULT_STATE: AppState = {
  tasks: [],
  reflections: [],
  streak: { currentStreak: 0, longestStreak: 0, lastActiveDate: null },
  lastResetDate: null,
  isPro: false,
  coins: 0,
  dailyEarn: null,
};

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

export async function saveState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}
