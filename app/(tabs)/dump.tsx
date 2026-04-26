import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../../lib/theme';
import { useApp } from '../../lib/AppContext';
import type { Task } from '../../lib/types';

export default function DumpScreen() {
  const { state, addTask, deleteTask, boxAllWithAI, isBoxing } = useApp();
  const [text, setText] = useState('');

  if (!state) return <View style={styles.container} />;

  const inbox = state.tasks.filter(t => t.box === 'inbox' && t.status === 'open');

  function handleAdd() {
    const trimmed = text.trim();
    if (!trimmed) return;
    addTask(trimmed);
    setText('');
  }

  function renderTask({ item }: { item: Task }) {
    return (
      <View style={styles.taskRow}>
        <Text style={styles.taskText} numberOfLines={2}>{item.title}</Text>
        <TouchableOpacity onPress={() => deleteTask(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={18} color={T.textDim} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Brain Dump</Text>
          {state.streak.currentStreak > 0 && (
            <View style={styles.streak}>
              <Text style={styles.streakText}>🔥 {state.streak.currentStreak}</Text>
            </View>
          )}
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="What's on your mind?"
            placeholderTextColor={T.textDim}
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
            blurOnSubmit={false}
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
            <Ionicons name="add" size={22} color={T.text} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={inbox}
          keyExtractor={t => t.id}
          renderItem={renderTask}
          contentContainerStyle={{ paddingBottom: 16 }}
          ListEmptyComponent={
            <Text style={styles.empty}>Nothing here yet — dump your tasks above.</Text>
          }
        />

        {inbox.length > 0 && (
          <View style={styles.boxBtnWrap}>
            <TouchableOpacity
              style={[styles.boxBtn, isBoxing && styles.btnDisabled]}
              onPress={boxAllWithAI}
              disabled={isBoxing}
            >
              {isBoxing ? (
                <ActivityIndicator color={T.text} size="small" />
              ) : (
                <Ionicons name="sparkles" size={18} color={T.text} style={{ marginRight: 8 }} />
              )}
              <Text style={styles.boxBtnText}>
                {isBoxing ? 'Boxing…' : `Box ${inbox.length} task${inbox.length !== 1 ? 's' : ''} with AI`}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
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
  streak: {
    backgroundColor: T.surface,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  streakText: { fontSize: 13, color: T.text },
  inputRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: T.surface,
    borderRadius: T.radius,
    borderWidth: 1,
    borderColor: T.border,
    color: T.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  addBtn: {
    backgroundColor: T.accent,
    borderRadius: T.radius,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: T.surface,
    borderRadius: T.radius,
    padding: 14,
    gap: 8,
  },
  taskText: { flex: 1, color: T.text, fontSize: 15 },
  empty: {
    textAlign: 'center',
    color: T.textDim,
    marginTop: 40,
    fontSize: 14,
    paddingHorizontal: 32,
  },
  boxBtnWrap: { padding: 16, paddingBottom: 8 },
  boxBtn: {
    backgroundColor: T.accent,
    borderRadius: T.radius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  btnDisabled: { opacity: 0.6 },
  boxBtnText: { color: T.text, fontSize: 16, fontWeight: '600' },
});
