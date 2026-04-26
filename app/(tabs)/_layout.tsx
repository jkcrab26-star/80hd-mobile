import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const ACCENT = '#7c6fff';
const DIM = '#555';
const BG = '#0a0a0a';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#111', borderTopColor: '#222' },
        tabBarActiveTintColor: ACCENT,
        tabBarInactiveTintColor: DIM,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dump"
        options={{
          title: 'Dump',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="create-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="today-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="coins"
        options={{
          title: '$80HD',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="diamond-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export { BG, ACCENT };
