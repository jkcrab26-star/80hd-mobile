import type { Task, BoxSlot } from './types';

export interface AiBoxingResult {
  id: string;
  box: BoxSlot;
  estimatedMinutes: number;
}

export async function aiBoxTasks(tasks: Task[]): Promise<AiBoxingResult[]> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

  if (!apiKey) {
    const boxes: BoxSlot[] = ['AM', 'PM', 'Evening'];
    return tasks.map((t, i) => ({ id: t.id, box: boxes[i % 3], estimatedMinutes: 30 }));
  }

  const prompt = `You are a scheduling assistant for 80HD, an ADHD time-boxing app.
Given a list of tasks, assign each to: AM (morning, high-focus), PM (afternoon, admin/meetings), or Evening (light wind-down).
Also estimate minutes: 15, 30, 60, or 90.

Tasks:
${tasks.map((t, i) => `${i + 1}. [${t.id}] ${t.title}`).join('\n')}

Respond ONLY with valid JSON, no markdown:
[{"id":"<task-id>","box":"AM"|"PM"|"Evening","estimatedMinutes":15|30|60|90}, ...]`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    const text: string = data.content?.[0]?.text ?? '[]';
    return JSON.parse(text) as AiBoxingResult[];
  } catch {
    const boxes: BoxSlot[] = ['AM', 'PM', 'Evening'];
    return tasks.map((t, i) => ({ id: t.id, box: boxes[i % 3], estimatedMinutes: 30 }));
  }
}
