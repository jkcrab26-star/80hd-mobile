import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { T } from '../../lib/theme';
import { useApp } from '../../lib/AppContext';
import type { BoxSlot, Task } from '../../lib/types';
import { todayISO } from '../../lib/storage';

const BOXES: { slot: BoxSlot; label: string; color: string; icon: string }[] = [
  { slot: 'AM', label: 'Morning', color: T.am, icon: 'sunny-outline' },
  { slot: 'PM', label: 'Afternoon', color: T.pm, icon: 'partly-sunny-outline' },
  { slot: 'Evening', label: 'Evening', color: T.eve, icon: 'moon-outline' },
];

function TaskCard({
  task,
  color,
  onComplete,
  onFocus,
}: {
  task: Task;
  color: string;
  onComplete: () => void;
  onFocus: () => void;
}) {
  const done = task.status === 'done';
  return (
    <View style={[styles.taskCard, done && styles.taskDone]}>
      <TouchableOpacity
        style={[styles.checkbox, done && { backgroundColor: color, borderColor: color }]}
        onPress={onComplete}
        disabled={done}
      >
        {done && <Ionicons name="checkmark" size={14} color="#000" />}
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <Text style={[styles.taskTitle, done && styles.taskTitleDone]} numberOfLines={2}>
          {task.title}
        </Text>
        {task.estimatedMinutes && (
          <Text style={styles.taskMeta}>{task.estimatedMinutes} min</Text>
        )}
      </View>

      {done && task.coinsPending && (
        <View style={styles.pendingDot} />
      )}
      {!done && (
        <TouchableOpacity onPress={onFocus} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="timer-outline" size={20} color={color} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function TodayScreen() {
  const { state, completeTask } = useApp();

  if (!state) return <View style={styles.container} />;

  const today = todayISO();
  const todayTasks = state.tasks.filter(
    t => t.status === 'open' || t.completedAt?.startsWith(today)
  );

  const doneTodayCount = todayTasks.filter(t => t.status === 'done').length;
  const totalToday = todayTasks.filter(t => t.box !== 'inbox').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Today</Text>
        <View style={styles.headerRight}>
          {state.coins > 0 && (
            <View style={styles.coinBadge}>
              <Text style={styles.coinText}>⬡ {state.coins}</Text>
            </View>
          )}
          {totalToday > 0 && (
            <View style={styles.progressBadge}>
              <Text style={styles.progressText}>{doneTodayCount}/{totalToday}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {BOXES.map(({ slot, label, color, icon }) => {
          const boxTasks = todayTasks.filter(t => t.box === slot);
          return (
            <View key={slot} style={styles.boxSection}>
              <View style={styles.boxHeader}>
                <Ionicons name={icon as any} size={16} color={color} style={{ marginRight: 6 }} />
                <Text style={[styles.boxLabel, { color }]}>{label}</Text>
                <Text style={styles.boxCount}>{boxTasks.filter(t => t.status === 'open').length}</Text>
              </View>

              {boxTasks.length === 0 ? (
                <Text style={styles.boxEmpty}>Nothing boxed for {label.toLowerCase()} yet</Text>
              ) : (
                boxTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    color={color}
                    onComplete={() => completeTask(task.id)}
                    onFocus={() =>
                      router.push({ pathname: '/focus', params: { taskId: task.id } })
                    }
                  />
                ))
              )}
            </View>
          );
        })}

        {todayTasks.filter(t => t.box !== 'inbox').length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📥</Text>
            <Text style={styles.emptyTitle}>No tasks boxed yet</Text>
            <Text style={styles.emptyBody}>Go to Brain Dump, add your tasks, and tap "Box with AI"</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '700', color: T.text },
  headerRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  coinBadge: {
    backgroundColor: '#2a1f00',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  coinText: { fontSize: 13, color: T.coin, fontWeight: '600' },
  progressBadge: {
    backgroundColor: T.surface,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  progressText: { fontSize: 13, color: T.textDim },
  boxSection: { marginBottom: 4 },
  boxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  boxLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  boxCount: { fontSize: 12, color: T.textDim, marginLeft: 6 },
  boxEmpty: {
    color: T.textDim,
    fontSize: 13,
    paddingHorizontal: 20,
    paddingBottom: 8,
    fontStyle: 'italic',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: T.surface,
    borderRadius: T.radius,
    padding: 14,
    gap: 12,
  },
  taskDone: { opacity: 0.5 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitle: { color: T.text, fontSize: 15, lineHeight: 20 },
  taskTitleDone: { textDecorationLine: 'line-through', color: T.textDim },
  taskMeta: { color: T.textDim, fontSize: 12, marginTop: 2 },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: T.text, marginBottom: 8 },
  emptyBody: { fontSize: 14, color: T.textDim, textAlign: 'center', lineHeight: 20 },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.coin,
    opacity: 0.7,
  },
});
