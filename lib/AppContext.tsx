import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { Task, AppState, BoxSlot, EarnableBox, DailyEarnLedger } from './types';
import { loadState, saveState, todayISO } from './storage';
import { aiBoxTasks } from './ai';

// ─── Earn constants (spec §3) ──────────────────────────────────────────────
const FREE_TASKS_PER_BOX = 5;
const COINS_PER_TASK = 1;
const COINS_BOX_COMPLETE = 3;
const COINS_FULL_DAY = 10;
const COINS_STREAK_7 = 20;
const DAILY_CAP = 50;
const HOLD_MS = 30 * 60 * 1000; // 30-min anti-gaming hold before coins vest

const EARNABLE_BOXES: EarnableBox[] = ['AM', 'PM', 'Evening'];

// ─── Helpers ──────────────────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function boxTaskCount(tasks: Task[], box: BoxSlot): number {
  return tasks.filter(t => t.box === box && t.status === 'open').length;
}

function getOrCreateLedger(ledger: DailyEarnLedger | null): DailyEarnLedger {
  const today = todayISO();
  if (ledger?.date === today) return ledger;
  return { date: today, earned: 0, boxBonusAwarded: {}, fullDayBonusAwarded: false, streakBonusAwarded: false };
}

function capAdd(ledger: DailyEarnLedger, amount: number): { granted: number; ledger: DailyEarnLedger } {
  const room = Math.max(0, DAILY_CAP - ledger.earned);
  const granted = Math.min(amount, room);
  return { granted, ledger: { ...ledger, earned: ledger.earned + granted } };
}

// A box is "complete" when every task in it is done AND coins-vested (not pending).
// Pending tasks don't count toward box-complete bonuses until they vest.
function isBoxComplete(tasks: Task[], box: EarnableBox): boolean {
  const boxTasks = tasks.filter(t => t.box === box);
  return boxTasks.length > 0 && boxTasks.every(t => t.status === 'done' && !t.coinsPending);
}

// Resolve tasks whose 30-min hold has expired, awarding coins + box/day bonuses.
function resolvePendingCoins(state: AppState): AppState {
  const now = Date.now();
  const eligible = state.tasks.filter(
    t => t.coinsPending && t.completedAt && now - new Date(t.completedAt).getTime() >= HOLD_MS
  );
  if (eligible.length === 0) return state;

  let tasks = state.tasks;
  let coins = state.coins;
  let ledger = getOrCreateLedger(state.dailyEarn);

  // Award per-task coins
  for (const task of eligible) {
    const { granted, ledger: next } = capAdd(ledger, COINS_PER_TASK);
    coins += granted;
    ledger = next;
    tasks = tasks.map(t => t.id === task.id ? { ...t, coinsPending: false } : t);
    if (ledger.earned >= DAILY_CAP) break;
  }

  // Award box-completion bonuses for any boxes now fully vested
  for (const box of EARNABLE_BOXES) {
    if (!ledger.boxBonusAwarded[box] && isBoxComplete(tasks, box)) {
      const { granted, ledger: next } = capAdd(ledger, COINS_BOX_COMPLETE);
      coins += granted;
      ledger = { ...next, boxBonusAwarded: { ...next.boxBonusAwarded, [box]: true } };
    }
  }

  // Award full-day bonus if all 3 boxes are now complete
  if (!ledger.fullDayBonusAwarded && EARNABLE_BOXES.every(b => ledger.boxBonusAwarded[b])) {
    const { granted, ledger: next } = capAdd(ledger, COINS_FULL_DAY);
    coins += granted;
    ledger = { ...next, fullDayBonusAwarded: true };
  }

  return { ...state, tasks, coins, dailyEarn: ledger };
}

function applyStreakBonus(state: AppState): AppState {
  const ledger = getOrCreateLedger(state.dailyEarn);
  // Only award once per day, only on a 7-day (or 7+ multiple) streak newly achieved today
  if (ledger.streakBonusAwarded) return { ...state, dailyEarn: ledger };
  if (state.streak.currentStreak < 7 || state.streak.currentStreak % 7 !== 0) {
    return { ...state, dailyEarn: ledger };
  }
  if (state.streak.lastActiveDate !== todayISO()) return { ...state, dailyEarn: ledger };
  const { granted, ledger: next } = capAdd(ledger, COINS_STREAK_7);
  return { ...state, coins: state.coins + granted, dailyEarn: { ...next, streakBonusAwarded: true } };
}

function updateStreak(state: AppState): AppState {
  const today = todayISO();
  const hadDoneToday = state.tasks.some(t => t.status === 'done' && t.completedAt?.startsWith(today));
  if (!hadDoneToday) return state;
  const streak = { ...state.streak };
  if (streak.lastActiveDate === today) return applyStreakBonus(state);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yiso = yesterday.toISOString().slice(0, 10);
  streak.currentStreak = streak.lastActiveDate === yiso ? streak.currentStreak + 1 : 1;
  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
  streak.lastActiveDate = today;
  return applyStreakBonus({ ...state, streak });
}

// ─── Context ──────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState | null;
  isBoxing: boolean;
  showUpgrade: boolean;
  setShowUpgrade: (v: boolean) => void;
  addTask: (title: string) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  moveTask: (id: string, toBox: BoxSlot) => boolean;
  setEstimate: (id: string, minutes: number) => void;
  boxAllWithAI: () => Promise<void>;
  activatePro: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [isBoxing, setIsBoxing] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load + resolve any vested pending coins from previous sessions
  useEffect(() => {
    loadState().then(s => {
      const today = todayISO();
      if (s.lastResetDate !== today) {
        s = {
          ...s,
          tasks: s.tasks.map(t =>
            t.status === 'open' && t.box !== 'inbox' ? { ...t, box: 'inbox' } : t
          ),
          lastResetDate: today,
        };
      }
      setState(resolvePendingCoins(s));
    });
  }, []);

  // Periodic resolution while app is open (every 5 min)
  useEffect(() => {
    const id = setInterval(() => {
      setState(prev => prev ? resolvePendingCoins(prev) : prev);
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!state) return;
    if (saveRef.current) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => saveState(state), 300);
  }, [state]);

  const addTask = useCallback((title: string) => {
    const task: Task = {
      id: generateId(),
      title: title.trim(),
      estimatedMinutes: null,
      box: 'inbox',
      status: 'open',
      completedAt: null,
      coinsPending: false,
      createdAt: new Date().toISOString(),
      scheduledDate: null,
    };
    setState(prev => prev ? { ...prev, tasks: [...prev.tasks, task] } : prev);
  }, []);

  const deleteTask = useCallback((id: string) => {
    setState(prev => prev ? { ...prev, tasks: prev.tasks.filter(t => t.id !== id) } : prev);
  }, []);

  // Mark task done + coinsPending. Coins vest after 30-min hold (anti-gaming).
  const completeTask = useCallback((id: string) => {
    setState(prev => {
      if (!prev) return prev;
      const updated: AppState = {
        ...prev,
        tasks: prev.tasks.map(t =>
          t.id === id
            ? { ...t, status: 'done' as const, completedAt: new Date().toISOString(), coinsPending: true }
            : t
        ),
      };
      return updateStreak(updated);
    });
  }, []);

  const moveTask = useCallback((id: string, toBox: BoxSlot): boolean => {
    let allowed = true;
    setState(prev => {
      if (!prev) return prev;
      if (!prev.isPro && toBox !== 'inbox') {
        const count = boxTaskCount(prev.tasks, toBox);
        if (count >= FREE_TASKS_PER_BOX) {
          allowed = false;
          return prev;
        }
      }
      return { ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, box: toBox } : t) };
    });
    return allowed;
  }, []);

  const setEstimate = useCallback((id: string, minutes: number) => {
    setState(prev =>
      prev
        ? { ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, estimatedMinutes: minutes } : t) }
        : prev
    );
  }, []);

  const boxAllWithAI = useCallback(async () => {
    setState(prev => {
      if (!prev) return prev;
      const inbox = prev.tasks.filter(t => t.box === 'inbox' && t.status === 'open');
      if (inbox.length === 0) return prev;

      setIsBoxing(true);
      aiBoxTasks(inbox).then(results => {
        setState(prev2 => {
          if (!prev2) return prev2;
          const boxCounts: Record<string, number> = {
            AM: boxTaskCount(prev2.tasks, 'AM'),
            PM: boxTaskCount(prev2.tasks, 'PM'),
            Evening: boxTaskCount(prev2.tasks, 'Evening'),
          };
          const updatedTasks = prev2.tasks.map(t => {
            const r = results.find(r => r.id === t.id);
            if (!r) return t;
            const slot = r.box;
            if (!prev2.isPro && slot !== 'inbox') {
              if ((boxCounts[slot] ?? 0) >= FREE_TASKS_PER_BOX) return t;
              boxCounts[slot] = (boxCounts[slot] ?? 0) + 1;
            }
            return { ...t, box: slot, estimatedMinutes: r.estimatedMinutes };
          });
          return { ...prev2, tasks: updatedTasks };
        });
        setIsBoxing(false);
      });
      return prev;
    });
  }, []);

  const activatePro = useCallback(() => {
    setState(prev => prev ? { ...prev, isPro: true } : prev);
  }, []);

  return (
    <AppContext.Provider value={{
      state, isBoxing, showUpgrade, setShowUpgrade,
      addTask, deleteTask, completeTask, moveTask,
      setEstimate, boxAllWithAI, activatePro,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
