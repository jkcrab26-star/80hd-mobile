import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../lib/theme';
import { useApp } from '../lib/AppContext';

const DEFAULT_MINUTES = 25;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function pulseColor(progress: number): string {
  // calm (purple) → amber → coral as time runs out
  if (progress > 0.5) return T.accent;
  if (progress > 0.2) return T.pm;
  return T.danger;
}

export default function FocusScreen() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const { state, completeTask } = useApp();

  const task = state?.tasks.find(t => t.id === taskId);
  const totalSeconds = (task?.estimatedMinutes ?? DEFAULT_MINUTES) * 60;

  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const progress = remaining / totalSeconds;
  const color = pulseColor(progress);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [running]);

  // Ambient pulse
  useEffect(() => {
    if (!running) return;
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]).start(({ finished }) => { if (finished) pulse(); });
    };
    pulse();
    return () => pulseAnim.stopAnimation();
  }, [running, pulseAnim]);

  const handleDone = useCallback(() => {
    if (taskId) completeTask(taskId);
    router.back();
  }, [taskId, completeTask]);

  const handleSnooze = useCallback(() => {
    router.back();
  }, []);

  const handleExit = useCallback(() => {
    router.back();
  }, []);

  if (!task) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.exitBtn} onPress={handleExit}>
          <Ionicons name="close" size={24} color={T.textDim} />
        </TouchableOpacity>
        <Text style={styles.notFound}>Task not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Not now — minimal, always accessible */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleExit} style={styles.notNowBtn}>
          <Text style={styles.notNowText}>Not now</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.center}>
        {/* Task title */}
        <Text style={styles.taskTitle} numberOfLines={3}>{task.title}</Text>

        {/* Timer ring */}
        <Animated.View style={[styles.timerRing, { borderColor: color, transform: [{ scale: running ? pulseAnim : 1 }] }]}>
          <Text style={[styles.timerText, { color }]}>{formatTime(remaining)}</Text>
          {remaining === 0 && <Text style={styles.timerDoneLabel}>Time's up</Text>}
        </Animated.View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlBtn, styles.playBtn, { borderColor: color }]}
            onPress={() => setRunning(r => !r)}
          >
            <Ionicons name={running ? 'pause' : 'play'} size={28} color={color} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.snoozeBtn} onPress={handleSnooze}>
          <Ionicons name="arrow-undo-outline" size={18} color={T.textDim} />
          <Text style={styles.snoozeBtnText}>Back to grid</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.doneBtn, { backgroundColor: color }]} onPress={handleDone}>
          <Ionicons name="checkmark" size={20} color="#000" />
          <Text style={styles.doneBtnText}>Done (+10 ⬡)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  notNowBtn: { paddingVertical: 8, paddingHorizontal: 4 },
  notNowText: { color: T.textDim, fontSize: 15 },
  exitBtn: { position: 'absolute', top: 48, right: 20, zIndex: 10 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 32,
  },
  taskTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: T.text,
    textAlign: 'center',
    lineHeight: 30,
  },
  timerRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: { fontSize: 44, fontWeight: '300', letterSpacing: 2 },
  timerDoneLabel: { fontSize: 13, color: T.textDim, marginTop: 4 },
  controls: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  controlBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {},
  notFound: { color: T.textDim, textAlign: 'center', fontSize: 16, marginTop: 80 },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  snoozeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.surface,
    borderRadius: T.radius,
    paddingVertical: 14,
    gap: 8,
  },
  snoozeBtnText: { color: T.textDim, fontSize: 15 },
  doneBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: T.radius,
    paddingVertical: 14,
    gap: 8,
  },
  doneBtnText: { color: '#000', fontSize: 15, fontWeight: '700' },
});
