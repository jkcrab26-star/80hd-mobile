import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../../lib/theme';
import { useApp } from '../../lib/AppContext';

const REWARDS = [
  { cost: 50, label: 'Streak Shield (protect a broken streak)', icon: 'shield-checkmark-outline' },
  { cost: 100, label: 'Theme / skin pack', icon: 'color-palette-outline' },
  { cost: 200, label: 'Export data pack (full task history)', icon: 'download-outline' },
  { cost: 500, label: 'Unlock premium AI brain-sort', icon: 'sparkles-outline' },
];

export default function CoinsScreen() {
  const { state, setShowUpgrade } = useApp();

  if (!state) return <View style={styles.container} />;

  const coins = state.coins;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>$80HD Coins</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Balance card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Your Balance</Text>
          <Text style={styles.balanceAmount}>⬡ {coins}</Text>
          <Text style={styles.balanceSub}>Coins vest 30 min after task completion · 50 $80HD daily cap</Text>
        </View>

        {/* How it works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Earn</Text>
          <View style={styles.infoRow}>
            <Ionicons name="checkmark-circle" size={20} color={T.am} />
            <Text style={styles.infoText}>Complete any task → +1 $80HD</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="sunny" size={20} color={T.am} />
            <Text style={styles.infoText}>Finish full Morning box → +3 $80HD</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="partly-sunny" size={20} color={T.pm} />
            <Text style={styles.infoText}>Finish full Afternoon box → +3 $80HD</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="moon" size={20} color={T.eve} />
            <Text style={styles.infoText}>Finish full Evening box → +3 $80HD</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="trophy" size={20} color={T.coin} />
            <Text style={styles.infoText}>Complete all 3 boxes in a day → +10 $80HD</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="flame" size={20} color={T.danger} />
            <Text style={styles.infoText}>7-day streak → +20 $80HD</Text>
          </View>
        </View>

        {/* Rewards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spend Coins</Text>
          {REWARDS.map(r => (
            <View key={r.label} style={styles.rewardRow}>
              <Ionicons name={r.icon as any} size={20} color={T.accent} style={{ marginRight: 12 }} />
              <Text style={styles.rewardLabel}>{r.label}</Text>
              <View style={[styles.rewardCost, coins >= r.cost && styles.rewardCostActive]}>
                <Text style={[styles.rewardCostText, coins >= r.cost && styles.rewardCostTextActive]}>
                  ⬡ {r.cost}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Token future */}
        <View style={styles.tokenCard}>
          <Text style={styles.tokenTitle}>Coming: On-chain $80HD</Text>
          <Text style={styles.tokenBody}>
            Your in-app coins are being designed as a real crypto token on Base.
            Early users will receive a genesis allocation.
          </Text>
          <View style={styles.tokenBadge}>
            <Text style={styles.tokenBadgeText}>Waitlist active</Text>
          </View>
        </View>

        {!state.isPro && (
          <TouchableOpacity style={styles.proBtn} onPress={() => setShowUpgrade(true)}>
            <Ionicons name="star" size={18} color="#000" style={{ marginRight: 8 }} />
            <Text style={styles.proBtnText}>Unlock Pro — earn 2× coins</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '700', color: T.text },
  balanceCard: {
    margin: 16,
    backgroundColor: '#1a1200',
    borderRadius: T.radius,
    borderWidth: 1,
    borderColor: '#3a2800',
    padding: 24,
    alignItems: 'center',
  },
  balanceLabel: { fontSize: 13, color: T.coin, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  balanceAmount: { fontSize: 48, fontWeight: '800', color: T.coin, marginBottom: 8 },
  balanceSub: { fontSize: 13, color: T.textDim, textAlign: 'center' },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 13, color: T.textDim, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  infoText: { color: T.text, fontSize: 14 },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface,
    borderRadius: T.radiusSm,
    padding: 14,
    marginBottom: 8,
  },
  rewardLabel: { flex: 1, color: T.text, fontSize: 14 },
  rewardCost: {
    backgroundColor: T.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rewardCostActive: { backgroundColor: '#2a1f00' },
  rewardCostText: { fontSize: 12, color: T.textDim, fontWeight: '600' },
  rewardCostTextActive: { color: T.coin },
  tokenCard: {
    marginHorizontal: 16,
    backgroundColor: T.surface,
    borderRadius: T.radius,
    borderWidth: 1,
    borderColor: T.accentDim,
    padding: 20,
  },
  tokenTitle: { fontSize: 15, fontWeight: '700', color: T.accent, marginBottom: 8 },
  tokenBody: { fontSize: 13, color: T.textDim, lineHeight: 20, marginBottom: 12 },
  tokenBadge: {
    backgroundColor: T.accentDim,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  tokenBadgeText: { fontSize: 12, color: T.accent, fontWeight: '600' },
  proBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: T.accent,
    borderRadius: T.radius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  proBtnText: { color: '#000', fontSize: 15, fontWeight: '700' },
});
