import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Pressable,
  Animated,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getScoutingById, Scouting } from '../../../services/scouting.service';
import { applyToScouting } from '../../../services/application.service';

// ── Design tokens ──────────────────────────────────────────────────────────────
const ACCENT = '#C8F135';
const BG = '#080C14';
const SURFACE = '#0F1521';
const SURFACE2 = '#0A1020';
const BORDER = '#1C2535';
const TEXT_PRIMARY = '#F0F4FF';
const TEXT_MUTED = '#5A6A82';
const GREEN = '#22C55E';

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ label, icon }: { label: string; icon: string }) {
  return (
    <View style={shS.row}>
      <View style={shS.bar} />
      <Ionicons name={icon as any} size={13} color={ACCENT} style={{ marginRight: 6 }} />
      <Text style={shS.label}>{label}</Text>
    </View>
  );
}
const shS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  bar: { width: 3, height: 16, borderRadius: 2, backgroundColor: ACCENT, marginRight: 8 },
  label: { fontSize: 11, color: TEXT_MUTED, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
});

// ── Tag chip ───────────────────────────────────────────────────────────────────
function Tag({ label, icon, accent }: { label: string; icon?: string; accent?: boolean }) {
  return (
    <View style={[tagS.wrapper, accent && tagS.wrapperAccent]}>
      {icon && <Ionicons name={icon as any} size={11} color={accent ? ACCENT : TEXT_MUTED} style={{ marginRight: 5 }} />}
      <Text style={[tagS.label, accent && tagS.labelAccent]}>{label}</Text>
    </View>
  );
}
const tagS = StyleSheet.create({
  wrapper: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20,
    backgroundColor: SURFACE2, borderWidth: 1.5, borderColor: BORDER,
  },
  wrapperAccent: { backgroundColor: '#1C2C10', borderColor: '#2A3C10' },
  label: { fontSize: 12, color: TEXT_MUTED, fontWeight: '600' },
  labelAccent: { color: ACCENT },
});

// ── Requirement row ────────────────────────────────────────────────────────────
function ReqRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={rrS.row}>
      <View style={rrS.iconWrap}>
        <Ionicons name={icon as any} size={14} color={TEXT_MUTED} />
      </View>
      <Text style={rrS.label}>{label}</Text>
      <Text style={rrS.value}>{value}</Text>
    </View>
  );
}
const rrS = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  iconWrap: { width: 28, alignItems: 'center', marginRight: 12 },
  label: { flex: 1, fontSize: 13, color: TEXT_MUTED },
  value: { fontSize: 13, fontWeight: '600', color: TEXT_PRIMARY },
});

// ── Main screen ────────────────────────────────────────────────────────────────
export default function ScoutingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [scouting, setScouting] = useState<Scouting | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getScoutingById(id);
        setScouting(data);
      } catch (error: any) {
        Toast.show({ type: 'error', text1: error?.response?.data?.message ?? 'Failed to load scouting' });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  const onApply = async () => {
    if (!id) return;
    try {
      setApplying(true);
      await applyToScouting(id);
      setApplied(true);
      Toast.show({ type: 'success', text1: 'Application sent!', text2: 'Your profile has been submitted.' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error?.response?.data?.message ?? 'Failed to apply' });
    } finally {
      setApplying(false);
    }
  };

  // ── Loading / not found ──────────────────────────────────────────────────────
  if (loading || !scouting) {
    return (
      <View style={styles.root}>
        <View style={styles.glowTop} pointerEvents="none" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Ionicons name={loading ? 'hourglass-outline' : 'alert-circle-outline'} size={40} color={TEXT_MUTED} />
          <Text style={{ color: TEXT_MUTED, fontSize: 14 }}>
            {loading ? 'Loading scouting…' : 'Scouting not found'}
          </Text>
        </View>
      </View>
    );
  }

  const ageRange =
    scouting.min_age || scouting.max_age
      ? `${scouting.min_age ?? 'Any'} – ${scouting.max_age ?? 'Any'}`
      : 'Any';

  return (
    <View style={styles.root}>
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={TEXT_MUTED} />
        </TouchableOpacity>

        {/* ── Hero card ─────────────────────────────────────────────────────── */}
        <View style={styles.heroCard}>
          <LinearGradient colors={['#1C2C10', '#0F1A08']} style={styles.heroGradient}>
            {/* Logo + status */}
            <View style={styles.heroTop}>
              <View style={styles.orgAvatar}>
                <Text style={styles.orgAvatarText}>
                  {scouting.organization_name.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>OPEN</Text>
              </View>
            </View>

            <Text style={styles.orgName}>{scouting.organization_name}</Text>
            <Text style={styles.orgCountry}>
              <Ionicons name="location-outline" size={12} color={TEXT_MUTED} /> {scouting.country}
            </Text>

            {/* Meta pills */}
            <View style={styles.metaRow}>
              <Tag icon="cash-outline" label={fmt(scouting.salary_type)} />
              <Tag icon="time-outline" label={fmt(scouting.contract_duration)} />
              <Tag icon="people-outline" label={`${scouting.players_required} spot${scouting.players_required !== 1 ? 's' : ''}`} accent />
            </View>
          </LinearGradient>
        </View>

        {/* ── About ─────────────────────────────────────────────────────────── */}
        {scouting.organization_description && (
          <View style={styles.section}>
            <SectionHeader label="About" icon="information-circle-outline" />
            <View style={styles.bodyCard}>
              <Text style={styles.bodyText}>{scouting.organization_description}</Text>
            </View>
          </View>
        )}

        {/* ── Roles ─────────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader label="Looking for" icon="people-outline" />
          <View style={styles.tagsWrap}>
            {scouting.required_roles.map((role) => (
              <Tag key={role} icon="person-outline" label={role} accent />
            ))}
          </View>
        </View>

        {/* ── Requirements ──────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader label="Requirements" icon="filter-outline" />
          <View style={styles.reqCard}>
            <ReqRow icon="phone-portrait-outline" label="Devices" value={scouting.allowed_devices.map(fmt).join(', ')} />
            <ReqRow icon="people-outline" label="Gender" value={scouting.allowed_genders.map(fmt).join(', ')} />
            <ReqRow icon="calendar-outline" label="Age range" value={ageRange} />
            <ReqRow icon="trending-up-outline" label="Min K/D ratio" value={scouting.min_kd_ratio != null ? String(scouting.min_kd_ratio) : 'Any'} />
            <ReqRow icon="flash-outline" label="Min avg. damage" value={scouting.min_average_damage != null ? String(scouting.min_average_damage) : 'Any'} />
            <View style={[rrS.row, { borderBottomWidth: 0 }]}>
              <View style={rrS.iconWrap}>
                <Ionicons name="warning-outline" size={14} color={TEXT_MUTED} />
              </View>
              <Text style={[rrS.label, { flex: 1 }]}>Ban history allowed</Text>
              <View style={[styles.banBadge, scouting.ban_history_allowed && styles.banBadgeYes]}>
                <Text style={[styles.banBadgeText, scouting.ban_history_allowed && styles.banBadgeTextYes]}>
                  {scouting.ban_history_allowed ? 'Yes' : 'No'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Perks ─────────────────────────────────────────────────────────── */}
        {(scouting.device_provided || scouting.bootcamp_required) && (
          <View style={styles.section}>
            <SectionHeader label="Perks & conditions" icon="star-outline" />
            <View style={styles.perksRow}>
              {scouting.device_provided && (
                <View style={styles.perkCard}>
                  <Ionicons name="phone-portrait-outline" size={20} color={ACCENT} />
                  <Text style={styles.perkLabel}>Device{'\n'}Provided</Text>
                </View>
              )}
              {scouting.bootcamp_required && (
                <View style={styles.perkCard}>
                  <Ionicons name="fitness-outline" size={20} color="#60C8FF" />
                  <Text style={[styles.perkLabel, { color: '#60C8FF' }]}>Bootcamp{'\n'}Required</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Maps ──────────────────────────────────────────────────────────── */}
        {scouting.preferred_maps_required && scouting.preferred_maps_required.length > 0 && (
          <View style={styles.section}>
            <SectionHeader label="Preferred maps" icon="map-outline" />
            <View style={styles.tagsWrap}>
              {scouting.preferred_maps_required.map((map) => (
                <Tag key={map} icon="map-outline" label={map} />
              ))}
            </View>
          </View>
        )}

        {/* ── Tournaments ───────────────────────────────────────────────────── */}
        {scouting.required_tournaments && scouting.required_tournaments.length > 0 && (
          <View style={styles.section}>
            <SectionHeader label="Required tournaments" icon="trophy-outline" />
            <View style={styles.tagsWrap}>
              {scouting.required_tournaments.map((t) => (
                <Tag key={t} icon="trophy-outline" label={t} accent />
              ))}
            </View>
          </View>
        )}

        {/* ── Salary range ──────────────────────────────────────────────────── */}
        {(scouting.salary_min_usd || scouting.salary_max_usd) && (
          <View style={styles.section}>
            <SectionHeader label="Compensation" icon="cash-outline" />
            <View style={styles.salaryCard}>
              <View style={styles.salaryCol}>
                <Text style={styles.salarySmall}>Minimum</Text>
                <Text style={styles.salaryNum}>
                  ${scouting.salary_min_usd?.toLocaleString() ?? '—'}
                </Text>
              </View>
              <View style={styles.salaryDivider} />
              <View style={styles.salaryCol}>
                <Text style={styles.salarySmall}>Maximum</Text>
                <Text style={styles.salaryNum}>
                  ${scouting.salary_max_usd?.toLocaleString() ?? '—'}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Sticky apply button ─────────────────────────────────────────────── */}
      <View style={styles.stickyBar}>
        <Animated.View style={{ flex: 1, transform: [{ scale: buttonScale }] }}>
          <Pressable
            onPress={onApply}
            disabled={applying || applied}
            onPressIn={() => Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start()}
            onPressOut={() => Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, speed: 30 }).start()}
          >
            <LinearGradient
              colors={
                applied ? ['#1C2C10', '#1C2C10']
                : applying ? ['#3A4A1A', '#2A3A12']
                : ['#C8F135', '#96B827']
              }
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.applyBtn}
            >
              {applied ? (
                <>
                  <Ionicons name="checkmark-circle" size={18} color={ACCENT} style={{ marginRight: 8 }} />
                  <Text style={[styles.applyLabel, { color: ACCENT }]}>Application sent!</Text>
                </>
              ) : applying ? (
                <Text style={[styles.applyLabel, { color: TEXT_MUTED }]}>Applying…</Text>
              ) : (
                <>
                  <Ionicons name="rocket-outline" size={18} color={BG} style={{ marginRight: 8 }} />
                  <Text style={styles.applyLabel}>Apply to scouting</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  glowTop: { position: 'absolute', top: -60, right: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: ACCENT, opacity: 0.04 },
  glowBottom: { position: 'absolute', bottom: -80, left: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: '#1A6EFF', opacity: 0.05 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 32 },

  // Back
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: SURFACE, borderWidth: 1.5, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },

  // Hero
  heroCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: '#2A3C10', marginBottom: 28 },
  heroGradient: { padding: 20 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  orgAvatar: {
    width: 52, height: 52, borderRadius: 15,
    backgroundColor: 'rgba(200,241,53,0.12)', borderWidth: 1.5, borderColor: ACCENT,
    alignItems: 'center', justifyContent: 'center',
  },
  orgAvatarText: { fontSize: 18, fontWeight: '800', color: ACCENT },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(34,197,94,0.08)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#14532d',
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN },
  statusText: { fontSize: 10, color: GREEN, fontWeight: '700', letterSpacing: 0.8 },
  orgName: { fontSize: 22, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.5, marginBottom: 5 },
  orgCountry: { fontSize: 13, color: TEXT_MUTED, marginBottom: 18 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  // Section
  section: { marginBottom: 28 },

  // Body card
  bodyCard: { backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER, padding: 16 },
  bodyText: { fontSize: 14, color: TEXT_MUTED, lineHeight: 22 },

  // Tags
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  // Requirements card
  reqCard: { backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER, paddingHorizontal: 16 },
  banBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    backgroundColor: 'rgba(255,77,77,0.08)', borderWidth: 1, borderColor: '#4A1010',
  },
  banBadgeYes: { backgroundColor: 'rgba(96,200,255,0.08)', borderColor: '#1A3A60' },
  banBadgeText: { fontSize: 12, fontWeight: '700', color: '#FF4D4D' },
  banBadgeTextYes: { color: '#60C8FF' },

  // Perks
  perksRow: { flexDirection: 'row', gap: 12 },
  perkCard: {
    flex: 1, backgroundColor: SURFACE, borderRadius: 14,
    borderWidth: 1.5, borderColor: BORDER, padding: 16,
    alignItems: 'center', gap: 10,
  },
  perkLabel: { fontSize: 12, color: ACCENT, fontWeight: '700', textAlign: 'center', lineHeight: 17 },

  // Salary
  salaryCard: {
    backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER,
    flexDirection: 'row', overflow: 'hidden',
  },
  salaryCol: { flex: 1, padding: 18, alignItems: 'center', gap: 6 },
  salaryDivider: { width: 1.5, backgroundColor: BORDER },
  salarySmall: { fontSize: 11, color: TEXT_MUTED, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase' },
  salaryNum: { fontSize: 22, fontWeight: '800', color: ACCENT, letterSpacing: -0.5 },

  // Sticky apply
  stickyBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32,
    backgroundColor: BG,
    borderTopWidth: 1, borderTopColor: BORDER,
  },
  applyBtn: {
    borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  applyLabel: { fontSize: 16, fontWeight: '800', color: BG, letterSpacing: 0.3 },
});