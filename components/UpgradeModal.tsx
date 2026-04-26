import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../lib/theme';

// Set these in .env as EXPO_PUBLIC_STRIPE_MONTHLY_LINK / EXPO_PUBLIC_STRIPE_ANNUAL_LINK
const MONTHLY_LINK = process.env.EXPO_PUBLIC_STRIPE_MONTHLY_LINK ?? '';
const ANNUAL_LINK = process.env.EXPO_PUBLIC_STRIPE_ANNUAL_LINK ?? '';

const PERKS = [
  'Unlimited tasks per time box',
  'Week & Month heat-map views',
  'AI Scope Lock on task cards',
  'Priority AI boxing (GPT-4 tier)',
  'Earn $80HD at 2× rate',
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onActivatePro: () => void;
}

export default function UpgradeModal({ visible, onClose, onActivatePro }: Props) {
  async function openStripe(link: string) {
    if (!link) {
      // Fallback for dev: simulate activation
      onActivatePro();
      return;
    }
    const result = await WebBrowser.openAuthSessionAsync(
      link,
      '80hd://pro-success'
    );
    // Stripe Payment Link redirects to success_url after payment.
    // We handle the deep-link in app/_layout.tsx; the modal stays open
    // until the deep-link fires. Close optimistically if user comes back.
    if (result.type === 'cancel' || result.type === 'dismiss') {
      onClose();
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.headerRow}>
          <Text style={styles.title}>Go Pro</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color={T.textDim} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sub}>Everything you need to actually finish your day.</Text>

        <View style={styles.perks}>
          {PERKS.map(p => (
            <View key={p} style={styles.perkRow}>
              <Ionicons name="checkmark-circle" size={18} color={T.accent} />
              <Text style={styles.perkText}>{p}</Text>
            </View>
          ))}
        </View>

        <View style={styles.plans}>
          <TouchableOpacity
            style={[styles.planBtn, styles.planBtnSecondary]}
            onPress={() => openStripe(MONTHLY_LINK)}
          >
            <Text style={styles.planPrice}>$9</Text>
            <Text style={styles.planPeriod}>/month</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.planBtn, styles.planBtnPrimary]}
            onPress={() => openStripe(ANNUAL_LINK)}
          >
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>BEST VALUE</Text>
            </View>
            <Text style={[styles.planPrice, { color: '#000' }]}>$79</Text>
            <Text style={[styles.planPeriod, { color: '#333' }]}>/year</Text>
            <Text style={styles.savingsText}>Save $29</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.legal}>
          Cancel anytime. Billed by Stripe. Manage in your account settings.
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: T.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '700', color: T.text },
  sub: { fontSize: 14, color: T.textDim, marginBottom: 20 },
  perks: { marginBottom: 24, gap: 10 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perkText: { color: T.text, fontSize: 14 },
  plans: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  planBtn: {
    flex: 1,
    borderRadius: T.radius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    position: 'relative',
  },
  planBtnSecondary: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
  },
  planBtnPrimary: {
    backgroundColor: T.accent,
  },
  planPrice: { fontSize: 28, fontWeight: '800', color: T.text },
  planPeriod: { fontSize: 13, color: T.textDim },
  savingsText: { fontSize: 11, color: '#000', fontWeight: '600', marginTop: 2 },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: T.coin,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  bestValueText: { fontSize: 9, fontWeight: '800', color: '#000', letterSpacing: 0.5 },
  legal: { fontSize: 11, color: T.textDim, textAlign: 'center', lineHeight: 16 },
});
