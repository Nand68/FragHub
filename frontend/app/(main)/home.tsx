import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Animated,
  Platform,
  TextInput as RNTextInput,
} from 'react-native';
import { Text } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import {
  Organization,
  fetchOrganization,
  createOrganization,
  updateOrganization,
} from '../../services/organization.service';

// ── Design tokens ──────────────────────────────────────────────────────────────
const ACCENT = '#C8F135';
const BG = '#080C14';
const SURFACE = '#0F1521';
const SURFACE2 = '#0A1020';
const BORDER = '#1C2535';
const TEXT_PRIMARY = '#F0F4FF';
const TEXT_MUTED = '#5A6A82';
const RED = '#FF4D4D';

// ── Custom floating-label Field ────────────────────────────────────────────────
function Field({
  label, value, onChangeText, keyboardType, multiline, numberOfLines,
  focused, onFocus, onBlur, icon, autoCapitalize,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  keyboardType?: any; multiline?: boolean; numberOfLines?: number;
  focused?: boolean; onFocus?: () => void; onBlur?: () => void;
  icon?: string; autoCapitalize?: any;
}) {
  const hasValue = value !== '' && value !== undefined && value !== null;
  const floated = focused || hasValue;
  const labelAnim = useRef(new Animated.Value(floated ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(labelAnim, { toValue: floated ? 1 : 0, duration: 140, useNativeDriver: false }).start();
  }, [floated]);

  const labelTop = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 7] });
  const labelFontSize = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });
  // For multiline: wrapper height = label area (28px) + lines + bottom padding
  const wrapperHeight = multiline
    ? (numberOfLines ? numberOfLines * 22 + 52 : 110)
    : 58;

  return (
    <View style={[
      fS.wrapper,
      focused && fS.wrapperFocused,
      { height: wrapperHeight },
      multiline && fS.wrapperMulti,
    ]}>
      {icon && (
        <Ionicons name={icon as any} size={16}
          color={focused ? ACCENT : TEXT_MUTED}
          style={[fS.icon, multiline && fS.iconMulti]}
        />
      )}
      <View style={[fS.inputArea, multiline && fS.inputAreaMulti]}>
        {/* Floating label — always sits at top */}
        <Animated.Text style={{
          position: 'absolute', left: 0, top: labelTop,
          fontSize: labelFontSize, color: focused ? ACCENT : TEXT_MUTED,
          fontWeight: '500', zIndex: 1,
        }} numberOfLines={1}>{label}</Animated.Text>

        {/* Input pushed below label via paddingTop */}
        <RNTextInput
          value={value} onChangeText={onChangeText} keyboardType={keyboardType}
          multiline={multiline} numberOfLines={numberOfLines}
          onFocus={onFocus} onBlur={onBlur}
          autoCapitalize={autoCapitalize ?? 'none'}
          placeholder="" placeholderTextColor={TEXT_MUTED}
          style={[
            fS.nativeInput,
            multiline && fS.nativeInputMulti,
          ]}
          cursorColor={ACCENT} selectionColor="rgba(200, 241, 53, 0.4)"
        />
      </View>
    </View>
  );
}

const fS = StyleSheet.create({
  wrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE,
    borderRadius: 14, borderWidth: 1.5, borderColor: BORDER,
    marginBottom: 12, paddingLeft: 14, paddingRight: 14, overflow: 'hidden',
  },
  wrapperFocused: {
    borderColor: ACCENT, shadowColor: ACCENT, shadowOpacity: 0.15,
    shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4,
  },
  // Multiline wrapper aligns children to top so label sits at the top edge
  wrapperMulti: { alignItems: 'flex-start', paddingTop: 10, paddingBottom: 10 },
  icon: { marginRight: 10 },
  // Multiline icon sits at the top, nudged down to align with label
  iconMulti: { marginTop: 2 },
  inputArea: { flex: 1, justifyContent: 'center', position: 'relative' },
  // Multiline input area: no centering, let it grow naturally
  inputAreaMulti: { justifyContent: 'flex-start' },
  // Single-line: paddingTop pushes text below the floated label
  nativeInput: { color: TEXT_PRIMARY, fontSize: 15, paddingTop: 20, paddingBottom: 6 },
  // Multiline: more paddingTop to clear the label, text grows downward
  nativeInputMulti: {
    paddingTop: 24,
    paddingBottom: 6,
    textAlignVertical: 'top',
    minHeight: 60,
  },
});

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ label, icon }: { label: string; icon: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, marginTop: 8 }}>
      <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: ACCENT, marginRight: 8 }} />
      <Ionicons name={icon as any} size={13} color={ACCENT} style={{ marginRight: 6 }} />
      <Text style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' }}>
        {label}
      </Text>
    </View>
  );
}

// ── Action card ────────────────────────────────────────────────────────────────
function ActionCard({
  icon, iconBg, title, body, ctaLabel, ctaIcon, onPress, accent = false,
}: {
  icon: string; iconBg: string; title: string; body: string;
  ctaLabel: string; ctaIcon: string; onPress: () => void; accent?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 30 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start()}
        style={acS.wrapper}
      >
        <View style={acS.top}>
          <View style={[acS.iconWrap, { backgroundColor: iconBg }]}>
            <Ionicons name={icon as any} size={20} color={accent ? BG : TEXT_PRIMARY} />
          </View>
          <Ionicons name="chevron-forward" size={16} color={TEXT_MUTED} />
        </View>
        <Text style={acS.title}>{title}</Text>
        <Text style={acS.body}>{body}</Text>
        <View style={[acS.cta, accent && acS.ctaAccent]}>
          <Text style={[acS.ctaLabel, accent && acS.ctaLabelAccent]}>{ctaLabel}</Text>
          <Ionicons name={ctaIcon as any} size={13} color={accent ? BG : ACCENT} style={{ marginLeft: 6 }} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const acS = StyleSheet.create({
  wrapper: {
    backgroundColor: SURFACE, borderRadius: 20, padding: 18,
    borderWidth: 1.5, borderColor: BORDER,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  iconWrap: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.3, marginBottom: 6 },
  body: { fontSize: 13, color: TEXT_MUTED, lineHeight: 19, marginBottom: 16 },
  cta: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#1C2C10', borderWidth: 1, borderColor: '#2A3C10',
  },
  ctaAccent: { backgroundColor: ACCENT, borderColor: ACCENT },
  ctaLabel: { fontSize: 12, fontWeight: '700', color: ACCENT },
  ctaLabelAccent: { color: BG },
});

// ── Stat pill ──────────────────────────────────────────────────────────────────
function StatPill({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={spS.wrapper}>
      <View style={spS.iconWrap}>
        <Ionicons name={icon as any} size={14} color={ACCENT} />
      </View>
      <Text style={spS.value}>{value}</Text>
      <Text style={spS.label}>{label}</Text>
    </View>
  );
}

const spS = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER, padding: 14, alignItems: 'center', gap: 4 },
  iconWrap: { width: 32, height: 32, borderRadius: 9, backgroundColor: '#1C2C10', alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.5 },
  label: { fontSize: 10, color: TEXT_MUTED, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase' },
});

// ── Submit button ──────────────────────────────────────────────────────────────
function SubmitButton({ label, icon, onPress, loading: isLoading }: {
  label: string; icon: string; onPress: () => void; loading?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }], marginTop: 8 }}>
      <Pressable
        onPress={onPress} disabled={isLoading}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start()}
      >
        <LinearGradient
          colors={isLoading ? ['#3A4A1A', '#2A3A12'] : ['#C8F135', '#96B827']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={sbS.btn}
        >
          {isLoading ? (
            <Text style={[sbS.label, { color: TEXT_MUTED }]}>Saving…</Text>
          ) : (
            <>
              <Ionicons name={icon as any} size={17} color={BG} style={{ marginRight: 8 }} />
              <Text style={sbS.label}>{label}</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const sbS = StyleSheet.create({
  btn: { borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 16, fontWeight: '800', color: BG, letterSpacing: 0.3 },
});

// ── Main screen ────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const isOrg = user?.role?.toLowerCase() === 'organization';

  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ organization_name: '', country: '', description: '' });
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const f = (name: string) => ({
    focused: focusedField === name,
    onFocus: () => setFocusedField(name),
    onBlur: () => setFocusedField(null),
  });

  useEffect(() => {
    if (!isOrg) { setLoading(false); return; }
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchOrganization();
        setOrg(data);
        if (data) setForm({ organization_name: data.organization_name, country: data.country, description: data.description ?? '' });
      } catch (err: any) {
        Toast.show({ type: 'error', text1: err?.response?.data?.message ?? 'Failed to load' });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [isOrg]);

  const handleSaveOrg = async () => {
    if (!form.organization_name.trim() || !form.country.trim()) {
      Toast.show({ type: 'error', text1: 'Organization name and country are required' });
      return;
    }
    try {
      setSaving(true);
      const payload = {
        organization_name: form.organization_name.trim(),
        country: form.country.trim(),
        description: form.description.trim() || undefined,
      };
      const saved = org ? await updateOrganization(payload) : await createOrganization(payload);
      setOrg(saved);
      setEditing(false);
      Toast.show({ type: 'success', text1: org ? 'Organization updated' : 'Organization created!' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message ?? 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={styles.glowTop} pointerEvents="none" />
        <Ionicons name="hourglass-outline" size={36} color={TEXT_MUTED} />
        <Text style={{ color: TEXT_MUTED, marginTop: 12, fontSize: 14 }}>Loading…</Text>
      </View>
    );
  }

  // ── Org create / edit form ───────────────────────────────────────────────────
  if (isOrg && (!org || editing)) {
    return (
      <View style={styles.root}>
        <View style={styles.glowTop} pointerEvents="none" />
        <View style={styles.glowBottom} pointerEvents="none" />

        <KeyboardAwareScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          enableOnAndroid
          extraScrollHeight={Platform.OS === 'ios' ? 24 : 80}
        >
          {/* Header */}
          <View style={styles.pageHeader}>
            <View style={styles.logoRow}>
              <View style={styles.logoMark}><View style={styles.logoInner} /></View>
              <Text style={styles.logoText}>FRAGHUB</Text>
            </View>
          </View>

          <View style={{ marginBottom: 8 }}>
            <Text style={styles.pageTitle}>{org ? 'Edit organization' : 'Set up your\norganization.'}</Text>
            <Text style={styles.pageSubtitle}>
              {org ? 'Update your organization profile.' : 'Create your profile to start scouting players.'}
            </Text>
          </View>

          <SectionHeader label="Organization details" icon="business-outline" />

          <Field label="Organization name" value={form.organization_name}
            onChangeText={(v) => setForm(p => ({ ...p, organization_name: v }))}
            icon="business-outline" autoCapitalize="words" {...f('orgname')} />
          <Field label="Country" value={form.country}
            onChangeText={(v) => setForm(p => ({ ...p, country: v }))}
            icon="globe-outline" autoCapitalize="words" {...f('country')} />
          <Field label="Description (optional)" value={form.description}
            onChangeText={(v) => setForm(p => ({ ...p, description: v }))}
            multiline numberOfLines={3} icon="document-text-outline" {...f('desc')} />

          <SubmitButton
            label={org ? 'Update organization' : 'Create organization'}
            icon={org ? 'save-outline' : 'rocket-outline'}
            onPress={handleSaveOrg}
            loading={saving}
          />

          {org && (
            <TouchableOpacity onPress={() => setEditing(false)} style={styles.cancelLink}>
              <Text style={styles.cancelLinkText}>Discard changes</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </KeyboardAwareScrollView>
      </View>
    );
  }

  // ── Player dashboard ─────────────────────────────────────────────────────────
  if (!isOrg) {
    return (
      <View style={styles.root}>
        <View style={styles.glowTop} pointerEvents="none" />
        <View style={styles.glowBottom} pointerEvents="none" />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.pageHeader}>
            <View style={styles.logoRow}>
              <View style={styles.logoMark}><View style={styles.logoInner} /></View>
              <Text style={styles.logoText}>FRAGHUB</Text>
            </View>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={18} color={RED} />
            </TouchableOpacity>
          </View>

          {/* Greeting */}
          <View style={styles.greetingBox}>
            <Text style={styles.greetingLabel}>PLAYER DASHBOARD</Text>
            <Text style={styles.pageTitle}>Welcome back,{'\n'}
              <Text style={{ color: ACCENT }}>
                {user?.email?.split('@')[0] ?? 'Player'}.
              </Text>
            </Text>
            <Text style={styles.pageSubtitle}>Signed in as {user?.email}</Text>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatPill icon="flash-outline" value="—" label="K/D Ratio" />
            <StatPill icon="trophy-outline" value="—" label="Tournaments" />
            <StatPill icon="star-outline" label="Rank" value="—" />
          </View>

          {/* Action cards */}
          <View style={styles.cardsStack}>
            <ActionCard
              icon="person-circle-outline"
              iconBg="#1C2C10"
              title="Complete your profile"
              body="Fill in your in-game stats, roles, and maps so organizations can discover and scout you."
              ctaLabel="Go to Profile"
              ctaIcon="arrow-forward"
              onPress={() => router.push('/(main)/profile' as any)}
              accent
            />
            <ActionCard
              icon="search-outline"
              iconBg={SURFACE2}
              title="Browse scoutings"
              body="View active scoutings from verified organizations and apply for a spot."
              ctaLabel="View Scoutings"
              ctaIcon="arrow-forward"
              onPress={() => router.push('/(main)/scouting' as any)}
            />
          </View>

          {/* Logout */}
          <TouchableOpacity onPress={logout} style={styles.logoutRow}>
            <Ionicons name="log-out-outline" size={15} color={RED} />
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    );
  }

  // ── Org dashboard ────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.pageHeader}>
          <View style={styles.logoRow}>
            <View style={styles.logoMark}><View style={styles.logoInner} /></View>
            <Text style={styles.logoText}>FRAGHUB</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={18} color={RED} />
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <View style={styles.greetingBox}>
          <Text style={styles.greetingLabel}>ORGANIZATION DASHBOARD</Text>
          <Text style={styles.pageTitle}>
            {org!.organization_name}
          </Text>
          <Text style={styles.pageSubtitle}>
            <Ionicons name="location-outline" size={12} color={TEXT_MUTED} /> {org!.country}
            {org!.description ? `  ·  ${org!.description}` : ''}
          </Text>
        </View>

        {/* Org card */}
        <View style={styles.orgCard}>
          <LinearGradient colors={['#1C2C10', '#0F1A08']} style={styles.orgCardGradient}>
            <View style={styles.orgCardTop}>
              <View style={styles.orgAvatarWrap}>
                <Text style={styles.orgAvatarText}>
                  {org!.organization_name.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditing(true)} style={styles.editOrgBtn}>
                <Ionicons name="create-outline" size={14} color={ACCENT} />
                <Text style={styles.editOrgBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.orgCardName}>{org!.organization_name}</Text>
            <Text style={styles.orgCardMeta}>{org!.country}</Text>
            {org!.description ? (
              <Text style={styles.orgCardDesc}>{org!.description}</Text>
            ) : null}
          </LinearGradient>
        </View>

        {/* Action cards */}
        <View style={styles.cardsStack}>
          <ActionCard
            icon="megaphone-outline"
            iconBg={ACCENT}
            title="Launch scouting"
            body="Create an active scouting to receive applications from eligible players matching your requirements."
            ctaLabel="Go to Scouting"
            ctaIcon="arrow-forward"
            onPress={() => router.push('/(main)/scouting' as any)}
            accent
          />
        </View>

        {/* Logout */}
        <TouchableOpacity onPress={logout} style={styles.logoutRow}>
          <Ionicons name="log-out-outline" size={15} color={RED} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  glowTop: {
    position: 'absolute', top: -60, right: -60,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: ACCENT, opacity: 0.04,
  },
  glowBottom: {
    position: 'absolute', bottom: -80, left: -60,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: '#1A6EFF', opacity: 0.05,
  },
  content: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 32 },

  // Logo
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: { width: 28, height: 28, borderRadius: 8, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  logoInner: { width: 10, height: 10, borderRadius: 3, backgroundColor: BG },
  logoText: { color: TEXT_PRIMARY, fontSize: 16, fontWeight: '800', letterSpacing: 4 },

  // Greeting
  greetingBox: { marginBottom: 28 },
  greetingLabel: { fontSize: 10, color: TEXT_MUTED, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  pageTitle: { fontSize: 32, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.8, lineHeight: 38, marginBottom: 8 },
  pageSubtitle: { fontSize: 13, color: TEXT_MUTED, lineHeight: 19 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },

  // Cards
  cardsStack: { gap: 12, marginBottom: 24 },

  // Org card
  orgCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: '#2A3C10', marginBottom: 24 },
  orgCardGradient: { padding: 20 },
  orgCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  orgAvatarWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(200,241,53,0.15)', borderWidth: 1.5, borderColor: ACCENT,
    alignItems: 'center', justifyContent: 'center',
  },
  orgAvatarText: { fontSize: 16, fontWeight: '800', color: ACCENT },
  editOrgBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: 'rgba(200,241,53,0.1)', borderWidth: 1, borderColor: '#2A3C10',
  },
  editOrgBtnText: { fontSize: 12, color: ACCENT, fontWeight: '600' },
  orgCardName: { fontSize: 20, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.4, marginBottom: 4 },
  orgCardMeta: { fontSize: 12, color: TEXT_MUTED, marginBottom: 6 },
  orgCardDesc: { fontSize: 13, color: TEXT_MUTED, lineHeight: 19, marginTop: 4 },

  // Logout
  logoutBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#160808', borderWidth: 1.5, borderColor: '#4A1010',
    alignItems: 'center', justifyContent: 'center',
  },
  logoutRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12,
  },
  logoutText: { fontSize: 13, color: RED, fontWeight: '600' },

  // Cancel
  cancelLink: { alignItems: 'center', marginTop: 14, paddingVertical: 8 },
  cancelLinkText: { fontSize: 13, color: TEXT_MUTED, fontWeight: '500' },
});