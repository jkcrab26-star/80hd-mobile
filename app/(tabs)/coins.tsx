import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../../lib/theme';
import { useApp } from '../../lib/AppContext';
import type { EarnableBox } from '../../lib/types';

const DAILY_CAP = 50;

const REWARDS = [
  { cost: 50, label: 'Streak Shield (protect a broken streak)', icon: 'shield-checkmark-outline' },
  { cost: 100, label: 'Theme / skin pack', icon: 'color-palette-outline' },
  { cost: 200, label: 'Export data pack (full task history)', icon: 'download-outline' },
  { cost: 500, label: 'Unlock premium AI brain-sort', icon: 'sparkles-outline' },
];

const BOXES: { slot: EarnableBox; label: string; color: string }[] = [
  { slot: 'AM', label: 'Morning', color: T.am },
  { slot: 'PM', label: 'Afternoon', color: T.pm },
  { slot: 'Evening', label: 'Evening', color: T.eve },
];

export default function CoinsScreen() {
  const { state, setShowUpgrade } = useApp();

  if (!state) return <View style={styles.container} />;

  const { coins, dailyEarn, streak } = state;
  const today = new Date().toISOString().slice(0, 10);
  const todayEarned = dailyEarn?.date === today ? dailyEarn.earned : 0;
  const capPct = Math.min(1, todayEarned / DAILY_CAP);
  const nextMilestone = Math.ceil((streak.currentStreak + 1) / 7) * 7;
  const daysToMilestone = nextMilestone - streak.currentStreak;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>$80HD Coins</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Your Balance</Text>
          <Text style={styles.balanceAmount}>⬡ {coins}</Text>
          {todayEarned > 0 && (
            <Text style={styles.balanceSub}>+{todayEarned} today</Text>
          )}
        </View>

        {/* Today's earn progress */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Today's Earn</Text>
            <Text style={styles.capLabel}>{todayEarned} / {DAILY_CAP}</Text>
          </View>

          <View style={styles.capBarBg}>
            <View style={[styles.capBarFill, { width: `${Math.round(capPct * 100)}%` as any }]} />
          </View>

          {/* Box bonuses */}
          <View style={styles.bonusRow}>
            {BOXES.map(({ slot, label, color }) => {
              const awarded = !!dailyEarn?.boxBonusAwarded[slot];
              return (
                <View key={slot} style={[styles.bonusChip, awarded && { borderColor: color }]}>
                  <Text style={[styles.bonusChipLabel, awarded && { color }]}>{label}</Text>
                  <Text style={[styles.bonusChipAmt, awarded && { color }]}>
                    {awarded ? '+3 ✓' : '+3'}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Full-day + streak bonuses */}
          <View style={styles.milestoneRow}>
            <View style={[styles.milestonePill, dailyEarn?.fullDayBonusAwarded && styles.milestoneDone]}>
              <Ionicons
                name={dailyEarn?.fullDayBonusAwarded ? 'checkmark-circle' : 'ellipse-outline'}
                size={14}
                color={dailyEarn?.fullDayBonusAwarded ? T.am : T.textDim}
              />
              <Text style={[styles.milestoneTxt, dailyEarn?.fullDayBonusAwarded && styles.milestoneTxtDone]}>
                Full day +10
              </Text>
            </View>

            <View style={[styles.milestonePill, dailyEarn?.streakBonusAwarded && styles.milestoneDone]}>
              <Ionicons
                name={dailyEarn?.streakBonusAwarded ? 'flame' : 'flame-outline'}
                size={14}
                color={dailyEarn?.streakBonusAwarded ? T.danger : T.textDim}
              />
              <Text style={[styles.milestoneTxt, dailyEarn?.streakBonusAwarded && styles.milestoneTxtDone]}>
                {dailyEarn?.streakBonusAwarded
                  ? 'Streak +20 ✓'
                  : daysToMilestone === 0
                    ? 'Streak +20'
                    : `${daysToMilestone}d to +20`}
              </Text>
            </View>
          </View>
        </View>

        {/* Earn rules */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earn Rules</Text>
          {[
            { icon: 'checkmark-circle', color: T.am, text: 'Complete task', amt: '+1 ⬡', note: '(vests after 30 min)' },
            { icon: 'albums-outline', color: T.pm, text: 'Clear a time box', amt: '+3 ⬡', note: '' },
            { icon: 'sunny', color: T.coin, text: 'Clear all 3 boxes', amt: '+10 ⬡', note: '' },
            { icon: 'flame', color: T.danger, text: '7-day streak milestone', amt: '+20 ⬡', note: '' },
          ].map(r => (
            <View key={r.text} style={styles.ruleRow}>
              <Ionicons name={r.icon as any} size={18} color={r.color} />
              <Text style={styles.ruleText}>
                {r.text} → <Text style={styles.ruleAmt}>{r.amt}</Text>
                {r.note ? <Text style={styles.ruleNote}> {r.note}</Text> : null}
              </Text>
            </View>
          ))}
          <Text style={styles.capNote}>Daily cap: {DAILY_CAP} ⬡  ·  Pro earns at 2×</Text>
        </View>

        {/* Spend */}
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

        {/* On-chain teaser */}
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
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
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
  balanceAmount: { fontSize: 48, fontWeight: '800', color: T.coin, marginBottom: 4 },
  balanceSub: { fontSize: 13, color: T.textDim },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 13, color: T.textDim, textTransform: 'uppercase', letterSpacing: 0.8 },
  capLabel: { fontSize: 12, color: T.coin, fontWeight: '600' },
  capBarBg: { height: 6, backgroundColor: T.border, borderRadius: 3, marginBottom: 12, overflow: 'hidden' },
  capBarFill: { height: 6, backgroundColor: T.coin, borderRadius: 3 },
  bonusRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  bonusChip: {
    flex: 1,
    alignItems: 'center',
    borderRadius: T.radiusSm,
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 8,
    backgroundColor: T.surface,
  },
  bonusChipLabel: { fontSize: 11, color: T.textDim, marginBottom: 2 },
  bonusChipAmt: { fontSize: 13, fontWeight: '700', color: T.textDim },
  milestoneRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  milestonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: T.surface,
  },
  milestoneDone: { borderColor: T.am },
  milestoneTxt: { fontSize: 12, color: T.textDim },
  milestoneTxtDone: { color: T.text },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  ruleText: { color: T.textDim, fontSize: 13, flex: 1, lineHeight: 18 },
  ruleAmt: { color: T.coin, fontWeight: '700' },
  ruleNote: { color: T.textDim, fontSize: 11 },
  capNote: { fontSize: 11, color: T.textDim, marginTop: 2, fontStyle: 'italic' },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface,
    borderRadius: T.radiusSm,
    padding: 14,
    marginBottom: 8,
  },
  rewardLabel: { flex: 1, color: T.text, fontSize: 14 },
  rewardCost: { backgroundColor: T.border, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
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
