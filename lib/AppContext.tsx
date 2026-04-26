import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { Task, AppState, BoxSlot } from './types';
import { loadState, saveState, todayISO } from './storage';
import { aiBoxTasks } from './ai';

const FREE_TASKS_PER_BOX = 5;
const COINS_PER_TASK = 10;

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function boxTaskCount(tasks: Task[], box: BoxSlot): number {
  return tasks.filter(t => t.box === box && t.status === 'open').length;
}

function updateStreak(state: AppState): AppState {
  const today = todayISO();
  const hadDoneToday = state.tasks.some(
    t => t.status === 'done' && t.completedAt?.startsWith(today)
  );
  if (!hadDoneToday) return state;
  const streak = { ...state.streak };
  if (streak.lastActiveDate === today) return state;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yiso = yesterday.toISOString().slice(0, 10);
  streak.currentStreak = streak.lastActiveDate === yiso ? streak.currentStreak + 1 : 1;
  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
  streak.lastActiveDate = today;
  return { ...state, streak };
}

interface AppContextValue {
  state: AppState | null;
  isBoxing: boolean;
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
  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      setState(s);
    });
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
      createdAt: new Date().toISOString(),
      scheduledDate: null,
    };
    setState(prev => prev ? { ...prev, tasks: [...prev.tasks, task] } : prev);
  }, []);

  const deleteTask = useCallback((id: string) => {
    setState(prev => prev ? { ...prev, tasks: prev.tasks.filter(t => t.id !== id) } : prev);
  }, []);

  const completeTask = useCallback((id: string) => {
    setState(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        tasks: prev.tasks.map(t =>
          t.id === id
            ? { ...t, status: 'done' as const, completedAt: new Date().toISOString() }
            : t
        ),
        coins: prev.coins + COINS_PER_TASK,
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
      state, isBoxing, addTask, deleteTask, completeTask,
      moveTask, setEstimate, boxAllWithAI, activatePro,
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
