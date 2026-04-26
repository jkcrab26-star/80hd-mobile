import { useState, useEffect, useCallback, useRef } from 'react';
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

export function useAppState() {
  const [state, setState] = useState<AppState | null>(null);
  const [isBoxing, setIsBoxing] = useState(false);
  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load state on mount
  useEffect(() => {
    loadState().then(s => {
      // Auto-reset: move yesterday's open tasks back to inbox
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

  // Debounced save on state change
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
    let blocked = false;
    setState(prev => {
      if (!prev) return prev;
      if (!prev.isPro && toBox !== 'inbox') {
        const count = boxTaskCount(prev.tasks, toBox);
        if (count >= FREE_TASKS_PER_BOX) {
          blocked = true;
          return prev;
        }
      }
      return {
        ...prev,
        tasks: prev.tasks.map(t => t.id === id ? { ...t, box: toBox } : t),
      };
    });
    return !blocked;
  }, []);

  const setEstimate = useCallback((id: string, minutes: number) => {
    setState(prev =>
      prev
        ? { ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, estimatedMinutes: minutes } : t) }
        : prev
    );
  }, []);

  const boxAllWithAI = useCallback(async () => {
    if (!state) return;
    const inbox = state.tasks.filter(t => t.box === 'inbox' && t.status === 'open');
    if (inbox.length === 0) return;
    setIsBoxing(true);
    try {
      const results = await aiBoxTasks(inbox);
      setState(prev => {
        if (!prev) return prev;
        const boxCounts: Record<string, number> = {
          AM: boxTaskCount(prev.tasks, 'AM'),
          PM: boxTaskCount(prev.tasks, 'PM'),
          Evening: boxTaskCount(prev.tasks, 'Evening'),
        };
        const updatedTasks = prev.tasks.map(t => {
          const r = results.find(r => r.id === t.id);
          if (!r) return t;
          const slot = r.box;
          if (!prev.isPro && slot !== 'inbox') {
            if ((boxCounts[slot] ?? 0) >= FREE_TASKS_PER_BOX) return t;
            boxCounts[slot] = (boxCounts[slot] ?? 0) + 1;
          }
          return { ...t, box: slot, estimatedMinutes: r.estimatedMinutes };
        });
        return { ...prev, tasks: updatedTasks };
      });
    } finally {
      setIsBoxing(false);
    }
  }, [state]);

  const activatePro = useCallback(() => {
    setState(prev => prev ? { ...prev, isPro: true } : prev);
  }, []);

  return {
    state,
    isBoxing,
    addTask,
    deleteTask,
    completeTask,
    moveTask,
    setEstimate,
    boxAllWithAI,
    activatePro,
    todayISO,
  };
}
