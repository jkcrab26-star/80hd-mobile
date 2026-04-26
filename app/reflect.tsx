import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../lib/theme';
import { useApp } from '../lib/AppContext';
import { todayISO } from '../lib/storage';

const QUESTIONS = [
  { key: 'q1', prompt: 'What did you actually get done today?', placeholder: 'Even small things count…' },
  { key: 'q2', prompt: 'What got in the way?', placeholder: 'Be honest — no judgment here.' },
  { key: 'q3', prompt: 'One thing to carry into tomorrow?', placeholder: 'Just one.' },
] as const;

export default function ReflectScreen() {
  const { state, saveReflection } = useApp();
  const [answers, setAnswers] = useState({ q1: '', q2: '', q3: '' });
  const inputRefs = [useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null)];

  const existing = state?.reflections.find(r => r.date === todayISO());
  const alreadyDone = !!existing;

  function handleSubmit() {
    if (!answers.q1.trim()) return;
    saveReflection(answers.q1, answers.q2, answers.q3);
    router.back();
  }

  function handleSkip() {
    router.back();
  }

  if (alreadyDone) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleSkip}>
            <Ionicons name="close" size={22} color={T.textDim} />
          </TouchableOpacity>
        </View>
        <View style={styles.doneState}>
          <Text style={styles.doneIcon}>✅</Text>
          <Text style={styles.doneTitle}>Already reflected today</Text>
          <View style={styles.doneAnswers}>
            {QUESTIONS.map((q, i) => (
              <View key={q.key} style={styles.doneRow}>
                <Text style={styles.doneQ}>{q.prompt}</Text>
                <Text style={styles.doneA}>{existing[q.key] || '—'}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={handleSkip}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={20}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>End of day</Text>
          <Text style={styles.subtitle}>3 quick questions. No grades.</Text>

          {QUESTIONS.map((q, i) => (
            <View key={q.key} style={styles.questionBlock}>
              <Text style={styles.questionNum}>0{i + 1}</Text>
              <Text style={styles.questionText}>{q.prompt}</Text>
              <TextInput
                ref={inputRefs[i]}
                style={styles.input}
                placeholder={q.placeholder}
                placeholderTextColor={T.textDim}
                value={answers[q.key]}
                onChangeText={v => setAnswers(prev => ({ ...prev, [q.key]: v }))}
                multiline
                returnKeyType={i < 2 ? 'next' : 'done'}
                onSubmitEditing={() => {
                  if (i < 2) inputRefs[i + 1].current?.focus();
                  else handleSubmit();
                }}
                blurOnSubmit={i === 2}
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.submitBtn, !answers.q1.trim() && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!answers.q1.trim()}
          >
            <Ionicons name="moon" size={18} color="#000" style={{ marginRight: 8 }} />
            <Text style={styles.submitBtnText}>Done for today</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  skipText: { color: T.textDim, fontSize: 15 },
  scroll: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8 },
  title: { fontSize: 26, fontWeight: '700', color: T.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: T.textDim, marginBottom: 32 },
  questionBlock: { marginBottom: 28 },
  questionNum: {
    fontSize: 11,
    color: T.accent,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  questionText: { fontSize: 17, fontWeight: '600', color: T.text, marginBottom: 10, lineHeight: 24 },
  input: {
    backgroundColor: T.surface,
    borderRadius: T.radius,
    borderWidth: 1,
    borderColor: T.border,
    color: T.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: T.accent,
    borderRadius: T.radius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  // Already-reflected state
  doneState: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  doneIcon: { fontSize: 36, marginBottom: 12 },
  doneTitle: { fontSize: 20, fontWeight: '700', color: T.text, marginBottom: 20 },
  doneAnswers: { gap: 16 },
  doneRow: {
    backgroundColor: T.surface,
    borderRadius: T.radius,
    padding: 14,
  },
  doneQ: { fontSize: 12, color: T.textDim, marginBottom: 6 },
  doneA: { fontSize: 14, color: T.text, lineHeight: 20 },
  closeBtn: {
    marginTop: 28,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: T.surface,
    borderRadius: T.radius,
  },
  closeBtnText: { color: T.textDim, fontSize: 15 },
});
