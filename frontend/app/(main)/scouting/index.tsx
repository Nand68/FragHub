import React, { useEffect, useState, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  Platform,
  TextInput as RNTextInput,
  RefreshControl,
} from 'react-native';
import { Text } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { EmptyState } from '../../../components/EmptyState';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import { fetchOrganization } from '../../../services/organization.service';
import {
  listActiveScoutings,
  getMyActiveScouting,
  createScouting,
  updateScouting,
  cancelScouting,
  Scouting,
  CreateScoutingPayload,
  SalaryType,
  ContractDuration,
} from '../../../services/scouting.service';
import { Device, Gender } from '../../../services/playerProfile.service';

// ── Design tokens ──────────────────────────────────────────────────────────────
const ACCENT = '#C8F135';
const BG = '#080C14';
const SURFACE = '#0F1521';
const SURFACE2 = '#0A1020';
const BORDER = '#1C2535';
const TEXT_PRIMARY = '#F0F4FF';
const TEXT_MUTED = '#5A6A82';
const GREEN = '#22C55E';
const RED = '#FF4D4D';

// ── Option lists ───────────────────────────────────────────────────────────────
type Option = { label: string; value: string; icon?: string };

const SALARY_OPTIONS: Option[] = [
  { label: 'Fixed Salary', value: 'fixed_salary', icon: 'cash-outline' },
  { label: 'Contract Based', value: 'contract_based', icon: 'document-text-outline' },
  { label: 'Prize Split', value: 'tournament_prize_split', icon: 'trophy-outline' },
  { label: 'Performance Based', value: 'performance_based', icon: 'trending-up-outline' },
  { label: 'Stipend', value: 'stipend_support', icon: 'wallet-outline' },
  { label: 'Unpaid Trial', value: 'unpaid_trial', icon: 'time-outline' },
];

const CONTRACT_OPTIONS: Option[] = [
  { label: 'No Contract', value: 'no_contract', icon: 'close-circle-outline' },
  { label: '3 Months', value: '3_months', icon: 'calendar-outline' },
  { label: '6 Months', value: '6_months', icon: 'calendar-outline' },
  { label: '1 Year', value: '1_year', icon: 'calendar-outline' },
];

const DEVICE_OPTIONS: Option[] = [
  { label: 'Mobile', value: 'mobile', icon: 'phone-portrait-outline' },
  { label: 'Tablet', value: 'tablet', icon: 'tablet-portrait-outline' },
];

const GENDER_OPTIONS: Option[] = [
  { label: 'Male', value: 'male', icon: 'male-outline' },
  { label: 'Female', value: 'female', icon: 'female-outline' },
  { label: 'Other', value: 'other', icon: 'person-outline' },
];

const ROLE_OPTIONS: Option[] = [
  { label: 'In-Game Leader (IGL)', value: 'IGL', icon: 'mic-outline' },
  { label: 'Entry Fragger', value: 'Entry Fragger', icon: 'flash-outline' },
  { label: 'Support', value: 'Support', icon: 'shield-half-outline' },
  { label: 'Sniper', value: 'Sniper', icon: 'locate-outline' },
  { label: 'DMR Player', value: 'DMR Player', icon: 'radio-outline' },
  { label: 'Rusher', value: 'Rusher', icon: 'rocket-outline' },
  { label: 'Anchor', value: 'Anchor', icon: 'anchor-outline' },
  { label: 'Flex / Rotator', value: 'Flex', icon: 'repeat-outline' },
  { label: 'Scout', value: 'Scout', icon: 'eye-outline' },
];

const MAP_OPTIONS: Option[] = [
  { label: 'Erangel', value: 'Erangel', icon: 'map-outline' },
  { label: 'Miramar', value: 'Miramar', icon: 'map-outline' },
  { label: 'Sanhok', value: 'Sanhok', icon: 'map-outline' },
  { label: 'Rondo', value: 'Rondo', icon: 'map-outline' },
  { label: 'Vikendi', value: 'Vikendi', icon: 'map-outline' },
  { label: 'Livik', value: 'Livik', icon: 'map-outline' },
  { label: 'Nusa', value: 'Nusa', icon: 'map-outline' },
  { label: 'Karakin', value: 'Karakin', icon: 'map-outline' },
];

const TOURNAMENT_OPTIONS: Option[] = [
  { label: 'BGIS', value: 'BGIS', icon: 'trophy-outline' },
  { label: 'PMPL', value: 'PMPL', icon: 'trophy-outline' },
  { label: 'PMCO', value: 'PMCO', icon: 'trophy-outline' },
  { label: 'Sky Esports', value: 'Sky Esports', icon: 'trophy-outline' },
  { label: 'Tier 1 — Pro League', value: 'Tier 1', icon: 'star-outline' },
  { label: 'Tier 2 — Challenger', value: 'Tier 2', icon: 'star-half-outline' },
  { label: 'Tier 3 — Open Circuit', value: 'Tier 3', icon: 'star-outline' },
  { label: 'GodLike Invitational', value: 'GodLike Invitational', icon: 'flame-outline' },
  { label: 'Nodwin Gaming Open', value: 'Nodwin Gaming Open', icon: 'game-controller-outline' },
  { label: 'ESL India Championship', value: 'ESL India', icon: 'medal-outline' },
];

const defaultForm: CreateScoutingPayload = {
  organization_name: '',
  country: '',
  salary_type: 'fixed_salary',
  contract_duration: 'no_contract',
  device_provided: false,
  bootcamp_required: false,
  required_roles: [],
  allowed_devices: ['mobile'],
  allowed_genders: ['male', 'female'],
  ban_history_allowed: false,
  players_required: 1,
};

// ── Custom floating-label Field ────────────────────────────────────────────────
function Field({
  label, value, onChangeText, keyboardType, multiline, numberOfLines,
  focused, onFocus, onBlur, icon, secureTextEntry, autoCapitalize, disabled,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  keyboardType?: any; multiline?: boolean; numberOfLines?: number;
  focused?: boolean; onFocus?: () => void; onBlur?: () => void;
  icon?: string; secureTextEntry?: boolean; autoCapitalize?: any; disabled?: boolean;
}) {
  const hasValue = value !== '' && value !== undefined && value !== null;
  const floated = focused || hasValue;
  const labelAnim = useRef(new Animated.Value(floated ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(labelAnim, { toValue: floated ? 1 : 0, duration: 140, useNativeDriver: false }).start();
  }, [floated]);

  const labelTop = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 7] });
  const labelFontSize = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });
  const labelColor = focused ? ACCENT : TEXT_MUTED;
  const wrapperHeight = multiline ? (numberOfLines ? numberOfLines * 22 + 52 : 110) : 58;

  return (
    <View style={[
      fieldS.wrapper,
      focused && fieldS.wrapperFocused,
      disabled && fieldS.wrapperDisabled,
      { height: wrapperHeight },
      multiline && fieldS.wrapperMulti,
    ]}>
      {icon && (
        <Ionicons name={icon as any} size={16}
          color={disabled ? BORDER : focused ? ACCENT : TEXT_MUTED}
          style={[fieldS.icon, multiline && fieldS.iconMulti]}
        />
      )}
      <View style={[fieldS.inputArea, multiline && fieldS.inputAreaMulti]}>
        <Animated.Text style={{
          position: 'absolute', left: 0, top: labelTop,
          fontSize: labelFontSize, color: disabled ? BORDER : labelColor,
          fontWeight: '500', zIndex: 1,
        }} numberOfLines={1}>{label}</Animated.Text>
        <RNTextInput
          value={value} onChangeText={onChangeText} keyboardType={keyboardType}
          multiline={multiline} numberOfLines={numberOfLines}
          onFocus={onFocus} onBlur={onBlur} secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize ?? 'none'} editable={!disabled}
          placeholder="" placeholderTextColor={TEXT_MUTED}
          style={[fieldS.nativeInput, multiline && fieldS.nativeInputMulti, disabled && { color: TEXT_MUTED }]}
          cursorColor={ACCENT} selectionColor="rgba(200, 241, 53, 0.4)"
        />
      </View>
    </View>
  );
}

const fieldS = StyleSheet.create({
  wrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE,
    borderRadius: 14, borderWidth: 1.5, borderColor: BORDER,
    marginBottom: 12, paddingLeft: 14, paddingRight: 14, overflow: 'hidden',
  },
  wrapperFocused: {
    borderColor: ACCENT, shadowColor: ACCENT, shadowOpacity: 0.15,
    shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4,
  },
  wrapperDisabled: { borderColor: BORDER, backgroundColor: SURFACE2, opacity: 0.6 },
  wrapperMulti: { alignItems: 'flex-start', paddingTop: 10, paddingBottom: 10 },
  icon: { marginRight: 10 },
  iconMulti: { marginTop: 2 },
  inputArea: { flex: 1, justifyContent: 'center', position: 'relative' },
  inputAreaMulti: { justifyContent: 'flex-start' },
  nativeInput: { color: TEXT_PRIMARY, fontSize: 15, paddingTop: 20, paddingBottom: 6, margin: 0, padding: 0 },
  nativeInputMulti: { paddingTop: 24, paddingBottom: 6, textAlignVertical: 'top', minHeight: 60, margin: 0, padding: 0 },
});

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ label, icon }: { label: string; icon: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, marginTop: 24 }}>
      <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: ACCENT, marginRight: 8 }} />
      <Ionicons name={icon as any} size={13} color={ACCENT} style={{ marginRight: 6 }} />
      <Text style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' }}>
        {label}
      </Text>
    </View>
  );
}

// ── Single-select pill row ─────────────────────────────────────────────────────
function PillSelect({ options, value, onChange }: {
  options: Option[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <TouchableOpacity key={opt.value} onPress={() => onChange(opt.value)}
            style={[pillS.pill, active && pillS.pillActive]} activeOpacity={0.75}>
            {opt.icon && (
              <Ionicons name={opt.icon as any} size={12}
                color={active ? BG : TEXT_MUTED} style={{ marginRight: 5 }} />
            )}
            <Text style={[pillS.label, active && pillS.labelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const pillS = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13,
    paddingVertical: 8, borderRadius: 20, backgroundColor: SURFACE,
    borderWidth: 1.5, borderColor: BORDER,
  },
  pillActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  label: { fontSize: 12, color: TEXT_MUTED, fontWeight: '600' },
  labelActive: { color: BG },
});

// ── Multi-select pill row (inline) ─────────────────────────────────────────────
function MultiPill({ options, selected, onToggle }: {
  options: Option[]; selected: string[]; onToggle: (v: string) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <TouchableOpacity key={opt.value} onPress={() => onToggle(opt.value)}
            style={[pillS.pill, active && pillS.pillActive]} activeOpacity={0.75}>
            {opt.icon && (
              <Ionicons name={opt.icon as any} size={12}
                color={active ? BG : TEXT_MUTED} style={{ marginRight: 5 }} />
            )}
            <Text style={[pillS.label, active && pillS.labelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Bottom-sheet multi-select modal ───────────────────────────────────────────
function MultiSelectModal({ visible, title, options, selected, onToggle, onClose }: {
  visible: boolean; title: string; options: Option[];
  selected: string[]; onToggle: (v: string) => void; onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(500)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }),
        Animated.timing(bgAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 500, duration: 180, useNativeDriver: true }),
        Animated.timing(bgAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)', opacity: bgAnim }]} />
      </Pressable>
      <Animated.View style={[msS.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={msS.handle} />
        <View style={msS.header}>
          <Text style={msS.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={msS.doneBtn}>
            <Ionicons name="checkmark" size={16} color={BG} />
          </TouchableOpacity>
        </View>
        <Text style={msS.hint}>{selected.length} selected</Text>
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
          {options.map((opt) => {
            const isSel = selected.includes(opt.value);
            return (
              <TouchableOpacity key={opt.value} onPress={() => onToggle(opt.value)}
                style={[msS.option, isSel && msS.optionSel]} activeOpacity={0.75}>
                <View style={msS.optLeft}>
                  {opt.icon && (
                    <View style={[msS.optIcon, isSel && msS.optIconActive]}>
                      <Ionicons name={opt.icon as any} size={14} color={isSel ? BG : TEXT_MUTED} />
                    </View>
                  )}
                  <Text style={[msS.optLabel, isSel && msS.optLabelActive]}>{opt.label}</Text>
                </View>
                <View style={[msS.check, isSel && msS.checkActive]}>
                  {isSel && <Ionicons name="checkmark" size={11} color={BG} />}
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 20 }} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const msS = StyleSheet.create({
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#0C1522', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1.5, borderColor: BORDER,
    paddingTop: 12, paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24, zIndex: 2,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 17, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.3 },
  doneBtn: { width: 30, height: 30, borderRadius: 9, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: 12, color: TEXT_MUTED, marginBottom: 14 },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, marginBottom: 6,
    backgroundColor: SURFACE, borderWidth: 1.5, borderColor: BORDER,
  },
  optionSel: { backgroundColor: '#1C2C10', borderColor: '#2A3C10' },
  optLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  optIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  optIconActive: { backgroundColor: ACCENT },
  optLabel: { fontSize: 14, color: TEXT_MUTED, fontWeight: '500', flex: 1 },
  optLabelActive: { color: TEXT_PRIMARY, fontWeight: '600' },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  checkActive: { backgroundColor: ACCENT, borderColor: ACCENT },
});

// ── Multi-select trigger button ────────────────────────────────────────────────
function SelectTrigger({ label, selected, onPress, icon }: {
  label: string; selected: string[]; onPress: () => void; icon: string;
}) {
  const has = selected.length > 0;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}
      style={[trigS.wrapper, has && trigS.wrapperActive]}>
      <View style={trigS.left}>
        <Ionicons name={icon as any} size={16} color={has ? ACCENT : TEXT_MUTED} style={{ marginRight: 10 }} />
        {has ? (
          <View style={trigS.tagsWrap}>
            {selected.map((v) => (
              <View key={v} style={trigS.tag}>
                <Text style={trigS.tagText}>{v}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={trigS.placeholder}>{label}</Text>
        )}
      </View>
      <Ionicons name="chevron-down" size={16} color={TEXT_MUTED} />
    </TouchableOpacity>
  );
}

const trigS = StyleSheet.create({
  wrapper: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER,
    paddingHorizontal: 14, paddingVertical: 13, marginBottom: 12, minHeight: 54,
  },
  wrapperActive: { borderColor: '#2A3C10' },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1, flexWrap: 'wrap' },
  placeholder: { fontSize: 15, color: TEXT_MUTED },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, flex: 1 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: '#1C2C10', borderWidth: 1, borderColor: '#2A3C10' },
  tagText: { fontSize: 11, color: ACCENT, fontWeight: '600' },
});

// ── Toggle row ─────────────────────────────────────────────────────────────────
function ToggleRow({ label, sub, value, onChange, accent = ACCENT }: {
  label: string; sub?: string; value: boolean; onChange: (v: boolean) => void; accent?: string;
}) {
  return (
    <TouchableOpacity onPress={() => onChange(!value)} activeOpacity={0.8}
      style={[togS.wrapper, value && { borderColor: accent + '55', backgroundColor: accent + '08' }]}>
      <View style={{ flex: 1 }}>
        <Text style={[togS.label, value && { color: TEXT_PRIMARY }]}>{label}</Text>
        {sub && <Text style={togS.sub}>{sub}</Text>}
      </View>
      <View style={[togS.track, value && { backgroundColor: accent }]}>
        <View style={[togS.thumb, value && togS.thumbOn]} />
      </View>
    </TouchableOpacity>
  );
}

const togS = StyleSheet.create({
  wrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE,
    borderRadius: 14, borderWidth: 1.5, borderColor: BORDER, padding: 14, marginBottom: 10,
  },
  label: { fontSize: 14, fontWeight: '600', color: TEXT_MUTED },
  sub: { fontSize: 11, color: TEXT_MUTED, marginTop: 2 },
  track: { width: 42, height: 24, borderRadius: 12, backgroundColor: BORDER, padding: 3, marginLeft: 12 },
  thumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: TEXT_MUTED, alignSelf: 'flex-start' },
  thumbOn: { backgroundColor: '#fff', alignSelf: 'flex-end' },
});

// ── Scouting card (player view) ────────────────────────────────────────────────
function ScoutingCard({ s, onPress }: { s: Scouting; onPress: () => void }) {
  const salaryLabel = SALARY_OPTIONS.find(o => o.value === s.salary_type)?.label ?? s.salary_type;
  const contractLabel = CONTRACT_OPTIONS.find(o => o.value === s.contract_duration)?.label ?? s.contract_duration;

  return (
    <TouchableOpacity onPress={onPress} style={cardS.wrapper} activeOpacity={0.85}>
      {/* Top row */}
      <View style={cardS.header}>
        <View style={{ flex: 1 }}>
          <Text style={cardS.orgName}>{s.organization_name}</Text>
          <Text style={cardS.country}>
            <Ionicons name="location-outline" size={11} color={TEXT_MUTED} /> {s.country}
          </Text>
        </View>
        <View style={cardS.statusBadge}>
          <View style={cardS.statusDot} />
          <Text style={cardS.statusText}>OPEN</Text>
        </View>
      </View>

      {/* Roles */}
      <View style={cardS.rolesRow}>
        {s.required_roles.slice(0, 3).map((role) => (
          <View key={role} style={cardS.roleTag}>
            <Text style={cardS.roleTagText}>{role}</Text>
          </View>
        ))}
        {s.required_roles.length > 3 && (
          <View style={cardS.moreTag}>
            <Text style={cardS.moreTagText}>+{s.required_roles.length - 3}</Text>
          </View>
        )}
      </View>

      {/* Meta strip */}
      <View style={cardS.metaStrip}>
        <MetaPill icon="cash-outline" label={salaryLabel} />
        <MetaPill icon="time-outline" label={contractLabel} />
        <MetaPill icon="people-outline" label={`${s.players_required} spot${s.players_required !== 1 ? 's' : ''}`} />
      </View>

      {/* Arrow */}
      <View style={cardS.arrow}>
        <Ionicons name="arrow-forward" size={14} color={ACCENT} />
      </View>
    </TouchableOpacity>
  );
}

function MetaPill({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={cardS.metaPill}>
      <Ionicons name={icon as any} size={11} color={TEXT_MUTED} style={{ marginRight: 4 }} />
      <Text style={cardS.metaText}>{label}</Text>
    </View>
  );
}

const cardS = StyleSheet.create({
  wrapper: {
    backgroundColor: SURFACE, borderRadius: 18, padding: 16,
    borderWidth: 1.5, borderColor: BORDER, marginBottom: 12,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  orgName: { fontSize: 16, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.3 },
  country: { fontSize: 12, color: TEXT_MUTED, marginTop: 3 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(34,197,94,0.08)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#14532d',
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN },
  statusText: { fontSize: 10, color: GREEN, fontWeight: '700', letterSpacing: 0.8 },
  rolesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  roleTag: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER,
  },
  roleTagText: { fontSize: 11, color: TEXT_MUTED, fontWeight: '600' },
  moreTag: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    backgroundColor: '#1C2C10', borderWidth: 1, borderColor: '#2A3C10',
  },
  moreTagText: { fontSize: 11, color: ACCENT, fontWeight: '700' },
  metaStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, backgroundColor: SURFACE2,
    borderWidth: 1, borderColor: BORDER,
  },
  metaText: { fontSize: 11, color: TEXT_MUTED },
  arrow: {
    position: 'absolute', bottom: 16, right: 16,
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#1C2C10', alignItems: 'center', justifyContent: 'center',
  },
});

// ── Main screen ────────────────────────────────────────────────────────────────
export default function ScoutingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isOrg = user?.role?.toLowerCase() === 'organization';

  const [scoutings, setScoutings] = useState<Scouting[]>([]);
  const [myScouting, setMyScouting] = useState<Scouting | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateScoutingPayload>(defaultForm);
  const [playersText, setPlayersText] = useState('1'); // separate string state so user can freely edit

  // Multi-select state
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedMaps, setSelectedMaps] = useState<string[]>([]);
  const [selectedTournaments, setSelectedTournaments] = useState<string[]>([]);

  // Modal visibility
  const [rolesModal, setRolesModal] = useState(false);
  const [mapsModal, setMapsModal] = useState(false);
  const [tournamentsModal, setTournamentsModal] = useState(false);

  // Field focus
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const f = (name: string) => ({
    focused: focusedField === name,
    onFocus: () => setFocusedField(name),
    onBlur: () => setFocusedField(null),
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (isOrg) {
          const [active, org] = await Promise.all([getMyActiveScouting(), fetchOrganization()]);
          setMyScouting(active);
          if (!active && org) {
            setForm((prev) => ({ ...prev, organization_name: org.organization_name, country: org.country }));
          }
          if (active) {
            setForm({
              ...defaultForm,
              organization_name: active.organization_name,
              organization_description: active.organization_description,
              country: active.country,
              salary_type: active.salary_type,
              salary_min_usd: active.salary_min_usd,
              salary_max_usd: active.salary_max_usd,
              contract_duration: active.contract_duration,
              device_provided: active.device_provided,
              bootcamp_required: active.bootcamp_required,
              players_required: active.players_required,
              allowed_devices: active.allowed_devices ?? ['mobile'],
              allowed_genders: active.allowed_genders ?? ['male', 'female'],
            });
            setPlayersText(String(active.players_required ?? 1));
            setSelectedRoles(active.required_roles ?? []);
            setSelectedMaps(active.preferred_maps_required ?? []);
            setSelectedTournaments(active.required_tournaments ?? []);
          }
        } else {
          const data = await listActiveScoutings();
          setScoutings(data);
        }
      } catch (err: any) {
        Toast.show({ type: 'error', text1: err?.response?.data?.message ?? 'Failed to load' });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };
    void load();
  }, [isOrg]);

  // Pull-to-refresh handler (player only)
  const onRefresh = () => {
    setRefreshing(true);
    listActiveScoutings()
      .then((data) => setScoutings(data))
      .catch(() => { })
      .finally(() => setRefreshing(false));
  };

  // Real-time: new scouting posted (player view only)
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket || isOrg) return;
    const handler = (scouting: Scouting) => {
      setScoutings((prev) => {
        const exists = prev.some((s) => s._id === scouting._id);
        return exists ? prev : [scouting, ...prev];
      });
      Toast.show({ type: 'info', text1: '🆕 New scouting posted!', text2: scouting.organization_name, visibilityTime: 3000 });
    };
    socket.on('scouting:new', handler);
    return () => { socket.off('scouting:new', handler); };
  }, [socket, isOrg]);

  const handleCreateScouting = async () => {
    if (!form.organization_name?.trim() || !form.country?.trim()) {
      Toast.show({ type: 'error', text1: 'Organization name and country are required' });
      return;
    }
    if (!selectedRoles.length) {
      Toast.show({ type: 'error', text1: 'Select at least one required role' });
      return;
    }
    if (!form.allowed_devices.length || !form.allowed_genders.length) {
      Toast.show({ type: 'error', text1: 'Select at least one device and gender' });
      return;
    }

    const payload: CreateScoutingPayload = {
      ...form,
      organization_name: form.organization_name.trim(),
      organization_description: form.organization_description?.trim() || undefined,
      country: form.country.trim(),
      required_roles: selectedRoles,
      preferred_maps_required: selectedMaps.length ? selectedMaps : undefined,
      required_tournaments: selectedTournaments.length ? selectedTournaments : undefined,
    };

    try {
      setSaving(true);
      const created = await createScouting(payload);
      setMyScouting(created);
      setShowForm(false);
      Toast.show({ type: 'success', text1: 'Scouting created!' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message ?? 'Failed to create' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateScouting = async () => {
    if (!myScouting) return;
    try {
      setSaving(true);
      const updated = await updateScouting(myScouting._id, {
        organization_description: form.organization_description?.trim() || undefined,
        salary_min_usd: form.salary_min_usd,
        salary_max_usd: form.salary_max_usd,
        device_provided: form.device_provided,
        bootcamp_required: form.bootcamp_required,
        players_required: form.players_required,
        preferred_maps_required: selectedMaps.length ? selectedMaps : undefined,
        required_tournaments: selectedTournaments.length ? selectedTournaments : undefined,
      });
      setMyScouting(updated);
      setShowForm(false);
      Toast.show({ type: 'success', text1: 'Scouting updated!' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message ?? 'Failed to update' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelScouting = async () => {
    if (!myScouting) return;
    try {
      setCancelling(true);
      await cancelScouting(myScouting._id);
      setMyScouting(null);
      setShowForm(false);
      Toast.show({ type: 'success', text1: 'Scouting cancelled' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message ?? 'Failed to cancel' });
    } finally {
      setCancelling(false);
    }
  };

  const toggleDevice = (v: Device) => {
    const curr = form.allowed_devices;
    const next = curr.includes(v) ? curr.filter((d) => d !== v) : [...curr, v];
    if (next.length) setForm((prev) => ({ ...prev, allowed_devices: next }));
  };

  const toggleGender = (v: Gender) => {
    const curr = form.allowed_genders;
    const next = curr.includes(v) ? curr.filter((g) => g !== v) : [...curr, v];
    if (next.length) setForm((prev) => ({ ...prev, allowed_genders: next }));
  };

  // ── ORG VIEW ──────────────────────────────────────────────────────────────────
  if (isOrg) {
    return (
      <View style={{ flex: 1, backgroundColor: BG }}>
        <View style={styles.glowTop} pointerEvents="none" />
        <View style={styles.glowBottom} pointerEvents="none" />

        {/* Modals */}
        <MultiSelectModal visible={rolesModal} title="Required Roles" options={ROLE_OPTIONS}
          selected={selectedRoles} onToggle={(v) => setSelectedRoles(p => p.includes(v) ? p.filter(r => r !== v) : [...p, v])}
          onClose={() => setRolesModal(false)} />
        <MultiSelectModal visible={mapsModal} title="Required Maps" options={MAP_OPTIONS}
          selected={selectedMaps} onToggle={(v) => setSelectedMaps(p => p.includes(v) ? p.filter(m => m !== v) : [...p, v])}
          onClose={() => setMapsModal(false)} />
        <MultiSelectModal visible={tournamentsModal} title="Required Tournaments" options={TOURNAMENT_OPTIONS}
          selected={selectedTournaments} onToggle={(v) => setSelectedTournaments(p => p.includes(v) ? p.filter(t => t !== v) : [...p, v])}
          onClose={() => setTournamentsModal(false)} />

        <KeyboardAwareScrollView
          style={{ flex: 1 }} contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
          enableOnAndroid extraScrollHeight={Platform.OS === 'ios' ? 24 : 80} enableAutomaticScroll
        >
          {/* Header */}
          <View style={styles.pageHeader}>
            <View>
              <Text style={styles.pageTitle}>My Scouting</Text>
              <Text style={styles.pageSubtitle}>Manage your active player search</Text>
            </View>
            {myScouting && !showForm && (
              <View style={styles.activeDot}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN }} />
                <Text style={{ fontSize: 10, color: GREEN, fontWeight: '700' }}>ACTIVE</Text>
              </View>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <Ionicons name="search-outline" size={40} color={TEXT_MUTED} />
              <Text style={{ color: TEXT_MUTED, marginTop: 12 }}>Loading…</Text>
            </View>
          ) : myScouting && !showForm ? (
            // ── Active scouting card ────────────────────────────────────────────
            <View>
              <View style={orgS.activeCard}>
                <LinearGradient colors={['#1C2C10', '#0F1A08']} style={orgS.cardGradient}>
                  <View style={orgS.cardTop}>
                    <View>
                      <Text style={orgS.cardOrg}>{myScouting.organization_name}</Text>
                      <Text style={orgS.cardCountry}>
                        <Ionicons name="location-outline" size={11} color={TEXT_MUTED} /> {myScouting.country}
                      </Text>
                    </View>
                    <Text style={orgS.cardStatus}>LIVE</Text>
                  </View>

                  {/* Spots bar */}
                  <View style={orgS.spotsRow}>
                    <Text style={orgS.spotsLabel}>
                      {myScouting.selected_count} / {myScouting.players_required} spots filled
                    </Text>
                    <Text style={orgS.spotsPct}>
                      {Math.round((myScouting.selected_count / myScouting.players_required) * 100)}%
                    </Text>
                  </View>
                  <View style={orgS.spotsTrack}>
                    <View style={[orgS.spotsFill, { width: `${Math.min(100, (myScouting.selected_count / myScouting.players_required) * 100)}%` as any }]} />
                  </View>

                  {/* Roles */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
                    {(myScouting.required_roles ?? []).map(r => (
                      <View key={r} style={orgS.roleChip}>
                        <Text style={orgS.roleChipText}>{r}</Text>
                      </View>
                    ))}
                  </View>
                </LinearGradient>
              </View>

              {/* Actions */}
              <View style={orgS.actionsRow}>
                <TouchableOpacity onPress={() => setShowForm(true)} style={orgS.editBtn} activeOpacity={0.8}>
                  <Ionicons name="create-outline" size={16} color={TEXT_PRIMARY} />
                  <Text style={orgS.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCancelScouting} disabled={cancelling}
                  style={orgS.cancelBtn} activeOpacity={0.8}>
                  <Ionicons name="close-circle-outline" size={16} color={RED} />
                  <Text style={orgS.cancelBtnText}>{cancelling ? 'Cancelling…' : 'Cancel scouting'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // ── Create / Edit form ──────────────────────────────────────────────
            <View>
              {!myScouting && (
                <View style={styles.newBanner}>
                  <Ionicons name="megaphone-outline" size={14} color={ACCENT} />
                  <Text style={styles.newBannerText}>Create a new scouting to find players for your roster</Text>
                </View>
              )}

              <SectionHeader label="Organization" icon="business-outline" />
              <Field label="Organization name" value={form.organization_name ?? ''} onChangeText={(v) => setForm(p => ({ ...p, organization_name: v }))}
                icon="business-outline" disabled={!!myScouting} {...f('orgname')} />
              <Field label="Country" value={form.country ?? ''} onChangeText={(v) => setForm(p => ({ ...p, country: v }))}
                icon="globe-outline" disabled={!!myScouting} {...f('country')} />
              <Field label="Description (optional)" value={form.organization_description ?? ''} onChangeText={(v) => setForm(p => ({ ...p, organization_description: v }))}
                multiline numberOfLines={3} icon="document-text-outline" {...f('desc')} />

              <SectionHeader label="Compensation" icon="cash-outline" />
              <Text style={styles.fieldLabel}>Salary type</Text>
              <PillSelect options={SALARY_OPTIONS} value={form.salary_type}
                onChange={(v) => setForm(p => ({ ...p, salary_type: v as SalaryType }))} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Field label="Min USD" value={form.salary_min_usd ? String(form.salary_min_usd) : ''}
                    onChangeText={(v) => setForm(p => ({ ...p, salary_min_usd: v ? Number(v) : undefined }))}
                    keyboardType="number-pad" icon="arrow-down-outline" {...f('salmin')} />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Max USD" value={form.salary_max_usd ? String(form.salary_max_usd) : ''}
                    onChangeText={(v) => setForm(p => ({ ...p, salary_max_usd: v ? Number(v) : undefined }))}
                    keyboardType="number-pad" icon="arrow-up-outline" {...f('salmax')} />
                </View>
              </View>

              <SectionHeader label="Contract & Roster" icon="document-text-outline" />
              <Text style={styles.fieldLabel}>Contract duration</Text>
              <PillSelect options={CONTRACT_OPTIONS} value={form.contract_duration}
                onChange={(v) => setForm(p => ({ ...p, contract_duration: v as ContractDuration }))} />
              <Field
                label="Players required"
                value={playersText}
                onChangeText={(v) => {
                  // Allow free typing including empty string so user can backspace and retype
                  if (/^\d*$/.test(v)) setPlayersText(v);
                }}
                onFocus={() => setFocusedField('players')}
                onBlur={() => {
                  setFocusedField(null);
                  // Clamp and commit to form only on blur
                  const parsed = Math.max(1, parseInt(playersText, 10) || 1);
                  setPlayersText(String(parsed));
                  setForm(p => ({ ...p, players_required: parsed }));
                }}
                focused={focusedField === 'players'}
                keyboardType="number-pad"
                icon="people-outline"
              />

              <SectionHeader label="Player Requirements" icon="filter-outline" />
              <Text style={styles.fieldLabel}>Required roles <Text style={{ color: ACCENT }}>*</Text></Text>
              <SelectTrigger label="Select required roles…" selected={selectedRoles} onPress={() => setRolesModal(true)} icon="people-outline" />

              {!myScouting && (
                <>
                  <Text style={styles.fieldLabel}>Allowed devices</Text>
                  <MultiPill options={DEVICE_OPTIONS} selected={form.allowed_devices} onToggle={(v) => toggleDevice(v as Device)} />
                  <Text style={styles.fieldLabel}>Allowed genders</Text>
                  <MultiPill options={GENDER_OPTIONS} selected={form.allowed_genders} onToggle={(v) => toggleGender(v as Gender)} />
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Field label="Min age" value={form.min_age ? String(form.min_age) : ''}
                        onChangeText={(v) => setForm(p => ({ ...p, min_age: v ? Number(v) : undefined }))}
                        keyboardType="number-pad" icon="person-outline" {...f('minage')} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field label="Max age" value={form.max_age ? String(form.max_age) : ''}
                        onChangeText={(v) => setForm(p => ({ ...p, max_age: v ? Number(v) : undefined }))}
                        keyboardType="number-pad" icon="person-outline" {...f('maxage')} />
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Field label="Min K/D" value={form.min_kd_ratio ? String(form.min_kd_ratio) : ''}
                        onChangeText={(v) => setForm(p => ({ ...p, min_kd_ratio: v ? Number(v) : undefined }))}
                        keyboardType="decimal-pad" icon="trending-up-outline" {...f('kd')} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field label="Min damage" value={form.min_average_damage ? String(form.min_average_damage) : ''}
                        onChangeText={(v) => setForm(p => ({ ...p, min_average_damage: v ? Number(v) : undefined }))}
                        keyboardType="number-pad" icon="flash-outline" {...f('dmg')} />
                    </View>
                  </View>
                </>
              )}

              <Text style={styles.fieldLabel}>Preferred maps</Text>
              <SelectTrigger label="Select preferred maps…" selected={selectedMaps} onPress={() => setMapsModal(true)} icon="map-outline" />

              <Text style={styles.fieldLabel}>Required tournaments</Text>
              <SelectTrigger label="Select required tournaments…" selected={selectedTournaments} onPress={() => setTournamentsModal(true)} icon="trophy-outline" />

              <SectionHeader label="Perks & Conditions" icon="star-outline" />
              <ToggleRow label="Device provided" sub="Organization will provide a gaming device" value={form.device_provided}
                onChange={(v) => setForm(p => ({ ...p, device_provided: v }))} />
              <ToggleRow label="Bootcamp required" sub="Player must attend physical or online bootcamp" value={form.bootcamp_required}
                onChange={(v) => setForm(p => ({ ...p, bootcamp_required: v }))} />
              {!myScouting && (
                <ToggleRow label="Ban history allowed" sub="Players with prior bans can still apply" value={form.ban_history_allowed ?? false}
                  onChange={(v) => setForm(p => ({ ...p, ban_history_allowed: v }))} accent="#60C8FF" />
              )}

              {/* Submit */}
              <View style={{ marginTop: 20 }}>
                <Pressable onPress={myScouting ? handleUpdateScouting : handleCreateScouting} disabled={saving}>
                  <LinearGradient
                    colors={saving ? ['#3A4A1A', '#2A3A12'] : ['#C8F135', '#96B827']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.submitBtn}
                  >
                    {saving ? (
                      <Text style={[styles.submitLabel, { color: TEXT_MUTED }]}>
                        {myScouting ? 'Updating…' : 'Creating…'}
                      </Text>
                    ) : (
                      <>
                        <Ionicons name={myScouting ? 'save-outline' : 'rocket-outline'} size={18} color={BG} style={{ marginRight: 8 }} />
                        <Text style={styles.submitLabel}>
                          {myScouting ? 'Update scouting' : 'Launch scouting'}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>

                {myScouting && showForm && (
                  <TouchableOpacity onPress={() => setShowForm(false)} style={styles.cancelLink}>
                    <Text style={styles.cancelLinkText}>Discard changes</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ height: 40 }} />
            </View>
          )}
        </KeyboardAwareScrollView>
      </View>
    );
  }

  // ── PLAYER VIEW ───────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ACCENT}
            colors={[ACCENT]}
          />
        }
      >
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>Active Scoutings</Text>
            <Text style={styles.pageSubtitle}>Browse open opportunities</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{scoutings.length}</Text>
          </View>
        </View>

        {loading ? (
          <LoadingSpinner message="Loading scoutings…" />
        ) : scoutings.length === 0 ? (
          <EmptyState message="No active scoutings right now" subtext="Check back soon for new opportunities." />
        ) : (
          scoutings.map((s) => (
            <ScoutingCard key={s._id} s={s} onPress={() => router.push(`/scouting/${s._id}` as never)} />
          ))
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ── Org-specific styles ────────────────────────────────────────────────────────
const orgS = StyleSheet.create({
  activeCard: { borderRadius: 18, overflow: 'hidden', marginBottom: 16, borderWidth: 1.5, borderColor: '#2A3C10' },
  cardGradient: { padding: 18 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardOrg: { fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.4 },
  cardCountry: { fontSize: 12, color: TEXT_MUTED, marginTop: 4 },
  cardStatus: {
    fontSize: 10, fontWeight: '800', color: ACCENT, letterSpacing: 1.5,
    borderWidth: 1, borderColor: ACCENT, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3
  },
  spotsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  spotsLabel: { fontSize: 12, color: TEXT_MUTED },
  spotsPct: { fontSize: 12, color: ACCENT, fontWeight: '700' },
  spotsTrack: { height: 4, backgroundColor: '#1C2C10', borderRadius: 2, overflow: 'hidden' },
  spotsFill: { height: '100%', backgroundColor: ACCENT, borderRadius: 2 },
  roleChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(200,241,53,0.1)', borderWidth: 1, borderColor: '#2A3C10' },
  roleChipText: { fontSize: 11, color: ACCENT, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  editBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER, paddingVertical: 13,
  },
  editBtnText: { fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY },
  cancelBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#160808', borderRadius: 14, borderWidth: 1.5, borderColor: '#4A1010', paddingVertical: 13,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: RED },
});

// ── Shared styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  glowTop: { position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: ACCENT, opacity: 0.04 },
  glowBottom: { position: 'absolute', bottom: -80, left: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: '#1A6EFF', opacity: 0.05 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 32 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, color: TEXT_MUTED, marginTop: 3 },
  activeDot: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#14532d' },
  countBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1C2C10', borderWidth: 1.5, borderColor: '#2A3C10', alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 15, fontWeight: '800', color: ACCENT },
  newBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1C2C10', borderRadius: 12, borderWidth: 1, borderColor: '#2A3C10', padding: 12, marginBottom: 4 },
  newBannerText: { fontSize: 12, color: TEXT_MUTED, flex: 1, lineHeight: 17 },
  fieldLabel: { fontSize: 12, color: TEXT_MUTED, fontWeight: '600', letterSpacing: 0.4, marginBottom: 8, marginTop: 2 },
  loadingBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  submitLabel: { fontSize: 16, fontWeight: '800', color: BG, letterSpacing: 0.3 },
  cancelLink: { alignItems: 'center', marginTop: 16, paddingVertical: 8 },
  cancelLinkText: { fontSize: 13, color: TEXT_MUTED, fontWeight: '500' },
});