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
} from 'react-native';
import { Text } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  PlayerProfile,
  UpsertPlayerProfileInput,
  fetchPlayerProfile,
  createPlayerProfile,
  updatePlayerProfile,
  Gender,
  Device,
  FingerSetup,
  PlayingStyle,
} from '../../services/playerProfile.service';

// ── Design tokens ──────────────────────────────────────────────────────────────
const ACCENT = '#C8F135';
const BG = '#080C14';
const SURFACE = '#0F1521';
const SURFACE2 = '#0A1020';
const BORDER = '#1C2535';
const TEXT_PRIMARY = '#F0F4FF';
const TEXT_MUTED = '#5A6A82';
const RED = '#FF4D4D';

// ── Data ───────────────────────────────────────────────────────────────────────
type Option = { label: string; value: string; icon?: string };

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
  { label: 'BGIS — Battlegrounds India Series', value: 'BGIS', icon: 'trophy-outline' },
  { label: 'Sky Esports Championship', value: 'Sky Esports', icon: 'trophy-outline' },
  { label: 'Tier 1 — Pro League', value: 'Tier 1', icon: 'star-outline' },
  { label: 'Tier 2 — Challenger', value: 'Tier 2', icon: 'star-half-outline' },
  { label: 'Tier 3 — Open Circuit', value: 'Tier 3', icon: 'star-outline' },
  { label: 'PMPL — PUBG Mobile Pro League', value: 'PMPL', icon: 'trophy-outline' },
  { label: 'PMCO — PUBG Mobile Club Open', value: 'PMCO', icon: 'trophy-outline' },
  { label: 'GodLike Invitational', value: 'GodLike Invitational', icon: 'flame-outline' },
  { label: 'Soul Invitational', value: 'Soul Invitational', icon: 'flame-outline' },
  { label: 'Nodwin Gaming Open', value: 'Nodwin Gaming Open', icon: 'game-controller-outline' },
  { label: 'ESL India Championship', value: 'ESL India', icon: 'medal-outline' },
  { label: 'Other (local / custom)', value: '__other__', icon: 'add-circle-outline' },
];

const GENDER_OPTIONS: Option[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
];

const DEVICE_OPTIONS: Option[] = [
  { label: 'Mobile', value: 'mobile', icon: 'phone-portrait-outline' },
  { label: 'Tablet', value: 'tablet', icon: 'tablet-portrait-outline' },
];

const FINGER_OPTIONS: Option[] = [
  { label: 'Thumb', value: 'thumb' },
  { label: '2 Finger', value: '2_finger' },
  { label: '3 Finger', value: '3_finger' },
  { label: '4 Finger', value: '4_finger' },
  { label: '5 Finger', value: '5_finger' },
  { label: '6 Finger', value: '6_finger' },
];

const STYLE_OPTIONS: Option[] = [
  { label: 'Aggressive', value: 'aggressive', icon: 'flame-outline' },
  { label: 'Balanced', value: 'balanced', icon: 'scale-outline' },
  { label: 'Defensive', value: 'defensive', icon: 'shield-outline' },
];

// ── Reusable: Custom floating-label field (no Paper TextInput) ─────────────────
function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  multiline,
  numberOfLines,
  focused,
  onFocus,
  onBlur,
  icon,
  secureTextEntry,
  placeholder,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: any;
  multiline?: boolean;
  numberOfLines?: number;
  focused?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  icon?: string;
  secureTextEntry?: boolean;
  placeholder?: string;
  autoCapitalize?: any;
}) {
  const hasValue = value !== '' && value !== undefined && value !== null;
  const floated = focused || hasValue;

  const labelAnim = useRef(new Animated.Value(floated ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: floated ? 1 : 0,
      duration: 140,
      useNativeDriver: false,
    }).start();
  }, [floated]);

  const labelTop = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 7] });
  const labelFontSize = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });
  const labelColor = focused ? ACCENT : TEXT_MUTED;

  const wrapperHeight = multiline
    ? numberOfLines ? numberOfLines * 24 + 40 : 100
    : 58;

  return (
    <View
      style={[
        fStyles.wrapper,
        focused && fStyles.wrapperFocused,
        { height: wrapperHeight },
        multiline && fStyles.wrapperMulti,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon as any}
          size={16}
          color={focused ? ACCENT : TEXT_MUTED}
          style={[fStyles.icon, multiline && fStyles.iconMulti]}
        />
      )}

      <View style={[fStyles.inputArea, multiline && fStyles.inputAreaMulti]}>
        {/* Floating label */}
        <Animated.Text
          style={{
            position: 'absolute',
            left: 0,
            top: labelTop,
            fontSize: labelFontSize,
            color: labelColor,
            fontWeight: '500',
            zIndex: 1,
            pointerEvents: 'none',
          }}
          numberOfLines={1}
        >
          {label}
        </Animated.Text>

        {/* Native RNTextInput — 100% color control, no Paper */}
        <RNTextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={onFocus}
          onBlur={onBlur}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize ?? 'none'}
          placeholder={floated ? (placeholder ?? '') : ''}
          placeholderTextColor={TEXT_MUTED}
          style={[
            fStyles.nativeInput,
            multiline && fStyles.nativeInputMulti,
          ]}
          cursorColor={ACCENT}
          selectionColor="rgba(200, 241, 53, 0.4)"
        />
      </View>
    </View>
  );
}

const fStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    marginBottom: 12,
    paddingLeft: 14,
    paddingRight: 14,
    overflow: 'hidden',
  },
  wrapperFocused: {
    borderColor: ACCENT,
    shadowColor: ACCENT,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  wrapperMulti: { alignItems: 'flex-start', paddingTop: 10, paddingBottom: 10 },
  icon: { marginRight: 10 },
  iconMulti: { marginTop: 2 },
  inputArea: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  inputAreaMulti: { justifyContent: 'flex-start' },
  nativeInput: {
    color: TEXT_PRIMARY,
    fontSize: 15,
    paddingTop: 20,
    paddingBottom: 6,

    // color: TEXT_PRIMARY,
    // fontSize: 15,
    // paddingTop: 20,
    // paddingBottom: 6,
    margin: 0,
    padding: 0,
    paddingLeft: 0,
  },
  nativeInputMulti: { paddingTop: 24, paddingBottom: 6, textAlignVertical: 'top', minHeight: 60 },
});

// ── Reusable: Section header ───────────────────────────────────────────────────
function SectionHeader({ label, icon }: { label: string; icon: string }) {
  return (
    <View style={shStyles.row}>
      <View style={shStyles.dot} />
      <Ionicons name={icon as any} size={13} color={ACCENT} style={{ marginRight: 6 }} />
      <Text style={shStyles.label}>{label}</Text>
    </View>
  );
}

const shStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 28 },
  dot: { width: 3, height: 18, borderRadius: 2, backgroundColor: ACCENT, marginRight: 8 },
  label: { fontSize: 11, color: TEXT_MUTED, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
});

// ── Reusable: Single-select pill row ──────────────────────────────────────────
function PillSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={psStyles.row}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value as T)}
            style={[psStyles.pill, active && psStyles.pillActive]}
            activeOpacity={0.75}
          >
            {opt.icon && (
              <Ionicons
                name={opt.icon as any}
                size={12}
                color={active ? BG : TEXT_MUTED}
                style={{ marginRight: 5 }}
              />
            )}
            <Text style={[psStyles.label, active && psStyles.labelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const psStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  pillActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  label: { fontSize: 12, color: TEXT_MUTED, fontWeight: '600' },
  labelActive: { color: BG },
});

// ── Reusable: Multi-select bottom sheet modal ──────────────────────────────────
function MultiSelectModal({
  visible,
  title,
  options,
  selected,
  onToggle,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }),
        Animated.timing(bgAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 400, duration: 180, useNativeDriver: true }),
        Animated.timing(bgAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={msStyles.overlay} onPress={onClose}>
        <Animated.View style={[msStyles.backdrop, { opacity: bgAnim }]} />
      </Pressable>
      <Animated.View style={[msStyles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={msStyles.handle} />

        {/* Header */}
        <View style={msStyles.header}>
          <Text style={msStyles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={msStyles.closeBtn}>
            <Ionicons name="checkmark" size={18} color={BG} />
          </TouchableOpacity>
        </View>

        <Text style={msStyles.hint}>{selected.length} selected</Text>

        {/* Options */}
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
          {options.map((opt) => {
            const isSelected = selected.includes(opt.value);
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => onToggle(opt.value)}
                style={[msStyles.option, isSelected && msStyles.optionSelected]}
                activeOpacity={0.75}
              >
                <View style={msStyles.optionLeft}>
                  {opt.icon && (
                    <View style={[msStyles.optionIconWrap, isSelected && msStyles.optionIconWrapActive]}>
                      <Ionicons name={opt.icon as any} size={14} color={isSelected ? BG : TEXT_MUTED} />
                    </View>
                  )}
                  <Text style={[msStyles.optionLabel, isSelected && msStyles.optionLabelActive]}>
                    {opt.label}
                  </Text>
                </View>
                <View style={[msStyles.check, isSelected && msStyles.checkActive]}>
                  {isSelected && <Ionicons name="checkmark" size={12} color={BG} />}
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 24 }} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const msStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0C1522',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.5,
    borderColor: BORDER,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    zIndex: 2,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: BORDER,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 17, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.3 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { fontSize: 12, color: TEXT_MUTED, marginBottom: 16 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: SURFACE,
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  optionSelected: { backgroundColor: '#1C2C10', borderColor: '#2A3C10' },
  optionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  optionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: SURFACE2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionIconWrapActive: { backgroundColor: ACCENT },
  optionLabel: { fontSize: 14, color: TEXT_MUTED, fontWeight: '500', flex: 1 },
  optionLabelActive: { color: TEXT_PRIMARY, fontWeight: '600' },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: { backgroundColor: ACCENT, borderColor: ACCENT },
});

// ── Reusable: Multi-select trigger button ──────────────────────────────────────
function MultiSelectTrigger({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected: string[];
  onPress: () => void;
  icon: string;
}) {
  const hasSelection = selected.length > 0;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[trigStyles.wrapper, hasSelection && trigStyles.wrapperActive]}
      activeOpacity={0.8}
    >
      <View style={trigStyles.left}>
        <Ionicons name={icon as any} size={16} color={hasSelection ? ACCENT : TEXT_MUTED} style={{ marginRight: 10 }} />
        {hasSelection ? (
          <View style={trigStyles.tagsWrap}>
            {selected.map((v) => (
              <View key={v} style={trigStyles.tag}>
                <Text style={trigStyles.tagText}>{v}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={trigStyles.placeholder}>{label}</Text>
        )}
      </View>
      <Ionicons name="chevron-down" size={16} color={TEXT_MUTED} />
    </TouchableOpacity>
  );
}

const trigStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 12,
    minHeight: 54,
  },
  wrapperActive: { borderColor: '#2A3C10' },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1, flexWrap: 'wrap' },
  placeholder: { fontSize: 15, color: TEXT_MUTED },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  tag: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#1C2C10',
    borderWidth: 1,
    borderColor: '#2A3C10',
  },
  tagText: { fontSize: 11, color: ACCENT, fontWeight: '600' },
});

// ── Toggle row for ban history ─────────────────────────────────────────────────
function BanToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity
      onPress={() => onChange(!value)}
      style={[btStyles.wrapper, value && btStyles.wrapperActive]}
      activeOpacity={0.8}
    >
      <View style={btStyles.left}>
        <View style={[btStyles.iconWrap, value && btStyles.iconWrapActive]}>
          <Ionicons name="warning-outline" size={16} color={value ? '#fff' : TEXT_MUTED} />
        </View>
        <View>
          <Text style={[btStyles.label, value && btStyles.labelActive]}>Previous ban history</Text>
          <Text style={btStyles.sub}>I have been banned in a previous account</Text>
        </View>
      </View>
      <View style={[btStyles.toggle, value && btStyles.toggleActive]}>
        <View style={[btStyles.thumb, value && btStyles.thumbActive]} />
      </View>
    </TouchableOpacity>
  );
}

const btStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 12,
  },
  wrapperActive: { borderColor: '#4A1010', backgroundColor: '#160808' },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: SURFACE2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconWrapActive: { backgroundColor: RED },
  label: { fontSize: 14, fontWeight: '600', color: TEXT_PRIMARY },
  labelActive: { color: RED },
  sub: { fontSize: 11, color: TEXT_MUTED, marginTop: 2 },
  toggle: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: BORDER,
    padding: 3,
    justifyContent: 'center',
  },
  toggleActive: { backgroundColor: RED },
  thumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: TEXT_MUTED,
    alignSelf: 'flex-start',
  },
  thumbActive: { backgroundColor: '#fff', alignSelf: 'flex-end' },
});

// ── Progress indicator ─────────────────────────────────────────────────────────
function ProfileProgress({ form, roles, maps }: { form: any; roles: string[]; maps: string[] }) {
  const fields = [
    form.name,
    form.country,
    form.game_id,
    form.age,
    roles.length > 0,
    maps.length > 0,
    form.bio,
    form.youtube_url || form.instagram_url,
  ];
  const filled = fields.filter(Boolean).length;
  const pct = Math.round((filled / fields.length) * 100);

  return (
    <View style={ppStyles.wrapper}>
      <View style={ppStyles.top}>
        <Text style={ppStyles.label}>Profile strength</Text>
        <Text style={ppStyles.pct}>{pct}%</Text>
      </View>
      <View style={ppStyles.track}>
        <View style={[ppStyles.fill, { width: `${pct}%` as any }]} />
      </View>
      <Text style={ppStyles.hint}>
        {pct < 50 ? 'Add more info to get noticed by organizations' :
         pct < 80 ? 'Looking good! Fill social & bio to stand out' :
         'Great profile! Organizations can discover you easily.'}
      </Text>
    </View>
  );
}

const ppStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 8,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '600', color: TEXT_PRIMARY },
  pct: { fontSize: 13, fontWeight: '800', color: ACCENT },
  track: { height: 4, backgroundColor: BORDER, borderRadius: 2, overflow: 'hidden', marginBottom: 10 },
  fill: { height: '100%', backgroundColor: ACCENT, borderRadius: 2 },
  hint: { fontSize: 11, color: TEXT_MUTED, lineHeight: 16 },
});

// ── Main screen ────────────────────────────────────────────────────────────────
export default function PlayerProfileScreen() {
  const [existing, setExisting] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Multi-select modal state
  const [rolesModal, setRolesModal] = useState(false);
  const [mapsModal, setMapsModal] = useState(false);
  const [tournamentsModal, setTournamentsModal] = useState(false);

  // Selected arrays
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedMaps, setSelectedMaps] = useState<string[]>([]);
  const [selectedTournaments, setSelectedTournaments] = useState<string[]>([]);
  const [otherTournament, setOtherTournament] = useState('');
  const [otherTournamentFocused, setOtherTournamentFocused] = useState(false);

  // Field focus state
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [form, setForm] = useState<UpsertPlayerProfileInput>({
    name: '',
    age: 18,
    gender: 'male',
    country: '',
    game_id: '',
    device: 'mobile',
    finger_setup: 'thumb',
    kd_ratio: 1,
    average_damage: 500,
    roles: [],
    playing_style: 'balanced',
    preferred_maps: [],
    ban_history: false,
  });

  const scrollRef = useRef<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const profile = await fetchPlayerProfile();
        if (profile) {
          setExisting(profile);
          setForm({
            name: profile.name,
            age: profile.age,
            gender: profile.gender,
            country: profile.country,
            game_id: profile.game_id,
            device: profile.device,
            finger_setup: profile.finger_setup,
            kd_ratio: profile.kd_ratio,
            average_damage: profile.average_damage,
            roles: profile.roles,
            playing_style: profile.playing_style,
            preferred_maps: profile.preferred_maps,
            ban_history: profile.ban_history,
            years_experience: profile.years_experience,
            youtube_url: profile.youtube_url,
            instagram_url: profile.instagram_url,
            tournaments_played: profile.tournaments_played,
            other_tournament_name: profile.other_tournament_name,
            bio: profile.bio,
            previous_organization: profile.previous_organization,
          });
          setSelectedRoles(profile.roles ?? []);
          setSelectedMaps(profile.preferred_maps ?? []);

          const knownTournamentValues = TOURNAMENT_OPTIONS.map((t) => t.value).filter(v => v !== '__other__');
          const played = profile.tournaments_played ?? [];
          const known = played.filter((t: string) => knownTournamentValues.includes(t));
          const other = played.filter((t: string) => !knownTournamentValues.includes(t));
          setSelectedTournaments(known.length > 0 ? [...known, ...(other.length > 0 ? ['__other__'] : [])] : []);
          setOtherTournament(other.join(', '));

          if (profile.other_tournament_name) {
            setOtherTournament(profile.other_tournament_name);
            if (!selectedTournaments.includes('__other__')) {
              setSelectedTournaments((prev) => [...prev, '__other__']);
            }
          }
        }
      } catch (error: any) {
        Toast.show({ type: 'error', text1: error?.response?.data?.message ?? 'Failed to load profile' });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const toggleRole = (v: string) =>
    setSelectedRoles((prev) => prev.includes(v) ? prev.filter((r) => r !== v) : [...prev, v]);

  const toggleMap = (v: string) =>
    setSelectedMaps((prev) => prev.includes(v) ? prev.filter((m) => m !== v) : [...prev, v]);

  const toggleTournament = (v: string) =>
    setSelectedTournaments((prev) => prev.includes(v) ? prev.filter((t) => t !== v) : [...prev, v]);

  const showOtherTournament = selectedTournaments.includes('__other__');

  const handleSave = async () => {
    if (!form.name || !form.country || !form.game_id) {
      Toast.show({ type: 'error', text1: 'Name, country and in-game ID are required' });
      return;
    }
    if (!selectedRoles.length || !selectedMaps.length) {
      Toast.show({ type: 'error', text1: 'Select at least one role and one preferred map' });
      return;
    }

    const knownTournaments = selectedTournaments
      .filter((t) => t !== '__other__');

    const payload: UpsertPlayerProfileInput = {
      ...form,
      age: Number(form.age),
      kd_ratio: Number(form.kd_ratio),
      average_damage: Number(form.average_damage),
      years_experience: form.years_experience ? Number(form.years_experience) : undefined,
      roles: selectedRoles,
      preferred_maps: selectedMaps,
      tournaments_played: knownTournaments,
      other_tournament_name: showOtherTournament && otherTournament.trim() ? otherTournament.trim() : undefined,
    };

    try {
      setSaving(true);
      const saved = existing
        ? await updatePlayerProfile(payload)
        : await createPlayerProfile(payload);
      setExisting(saved);
      Toast.show({ type: 'success', text1: 'Profile saved', text2: 'Your player profile is up to date.' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error?.response?.data?.message ?? 'Failed to save profile' });
    } finally {
      setSaving(false);
    }
  };

  const hasOrg = Boolean(existing?.currentOrganization);
  const f = (name: string) => ({ focused: focusedField === name, onFocus: () => setFocusedField(name), onBlur: () => setFocusedField(null) });

  return (
    <View style={styles.root}>
      {/* Glows */}
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />

      {/* Modals */}
      <MultiSelectModal
        visible={rolesModal}
        title="Select your roles"
        options={ROLE_OPTIONS}
        selected={selectedRoles}
        onToggle={toggleRole}
        onClose={() => setRolesModal(false)}
      />
      <MultiSelectModal
        visible={mapsModal}
        title="Preferred maps"
        options={MAP_OPTIONS}
        selected={selectedMaps}
        onToggle={toggleMap}
        onClose={() => setMapsModal(false)}
      />
      <MultiSelectModal
        visible={tournamentsModal}
        title="Tournaments played"
        options={TOURNAMENT_OPTIONS}
        selected={selectedTournaments}
        onToggle={toggleTournament}
        onClose={() => setTournamentsModal(false)}
      />

      <KeyboardAwareScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={Platform.OS === 'ios' ? 24 : 80}
        enableAutomaticScroll
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>Player Profile</Text>
            <Text style={styles.pageSubtitle}>Your scouting card for organizations</Text>
          </View>
          {existing?.profile_completed && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={ACCENT} />
              <Text style={styles.completedText}>Complete</Text>
            </View>
          )}
        </View>

        {hasOrg && (
          <View style={styles.orgBanner}>
            <Ionicons name="business-outline" size={14} color="#60C8FF" />
            <Text style={styles.orgBannerText}>
              You're in an organization. Some fields may be restricted.
            </Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingBox}>
            <Ionicons name="person-circle-outline" size={40} color={TEXT_MUTED} />
            <Text style={styles.loadingText}>Loading your profile…</Text>
          </View>
        ) : (
          <>
            {/* Progress */}
            <ProfileProgress form={form} roles={selectedRoles} maps={selectedMaps} />

            {/* ── BASICS ─────────────────────────────────── */}
            <SectionHeader label="Basics" icon="person-outline" />
            <Field label="Full name" value={form.name} onChangeText={(name) => setForm((f) => ({ ...f, name }))} icon="person-outline" {...f('name')} />
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Field label="Age" value={String(form.age ?? '')} onChangeText={(age) => setForm((f) => ({ ...f, age: Number(age) || 0 }))} keyboardType="number-pad" icon="calendar-outline" {...f('age')} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Country" value={form.country} onChangeText={(country) => setForm((f) => ({ ...f, country }))} icon="globe-outline" {...f('country')} />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Gender</Text>
            <PillSelect<Gender> options={GENDER_OPTIONS} value={form.gender} onChange={(gender) => setForm((f) => ({ ...f, gender }))} />

            {/* ── IN-GAME ────────────────────────────────── */}
            <SectionHeader label="In-Game Details" icon="game-controller-outline" />
            <Field label="In-game ID / Username" value={form.game_id} onChangeText={(game_id) => setForm((f) => ({ ...f, game_id }))} icon="at-outline" {...f('gameid')} />

            <Text style={styles.fieldLabel}>Device</Text>
            <PillSelect<Device> options={DEVICE_OPTIONS} value={form.device} onChange={(device) => setForm((f) => ({ ...f, device }))} />

            <Text style={styles.fieldLabel}>Finger setup</Text>
            <PillSelect<FingerSetup> options={FINGER_OPTIONS} value={form.finger_setup} onChange={(finger_setup) => setForm((f) => ({ ...f, finger_setup }))} />

            {/* ── STATS & ROLE ───────────────────────────── */}
            <SectionHeader label="Stats & Role" icon="bar-chart-outline" />
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Field label="K/D Ratio" value={String(form.kd_ratio ?? '')} onChangeText={(kd_ratio) => setForm((f) => ({ ...f, kd_ratio: Number(kd_ratio) || 0 }))} keyboardType="decimal-pad" icon="trending-up-outline" {...f('kd')} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Avg Damage" value={String(form.average_damage ?? '')} onChangeText={(average_damage) => setForm((f) => ({ ...f, average_damage: Number(average_damage) || 0 }))} keyboardType="decimal-pad" icon="flash-outline" {...f('dmg')} />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Playing style</Text>
            <PillSelect<PlayingStyle> options={STYLE_OPTIONS} value={form.playing_style} onChange={(playing_style) => setForm((f) => ({ ...f, playing_style }))} />

            <Text style={styles.fieldLabel}>Roles <Text style={styles.required}>*</Text></Text>
            <MultiSelectTrigger
              label="Select your roles…"
              selected={selectedRoles}
              onPress={() => setRolesModal(true)}
              icon="people-outline"
            />

            <Text style={styles.fieldLabel}>Preferred Maps <Text style={styles.required}>*</Text></Text>
            <MultiSelectTrigger
              label="Select preferred maps…"
              selected={selectedMaps}
              onPress={() => setMapsModal(true)}
              icon="map-outline"
            />

            {/* ── EXPERIENCE ────────────────────────────── */}
            <SectionHeader label="Experience" icon="trophy-outline" />
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Field label="Years exp." value={form.years_experience ? String(form.years_experience) : ''} onChangeText={(y) => setForm((f) => ({ ...f, years_experience: Number(y) || 0 }))} keyboardType="number-pad" icon="time-outline" {...f('exp')} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Previous org." value={form.previous_organization ?? ''} onChangeText={(previous_organization) => setForm((f) => ({ ...f, previous_organization }))} icon="business-outline" {...f('prevorg')} />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Tournaments played</Text>
            <MultiSelectTrigger
              label="Select tournaments…"
              selected={selectedTournaments.filter(t => t !== '__other__')}
              onPress={() => setTournamentsModal(true)}
              icon="trophy-outline"
            />

            {/* Other tournament input - shown when __other__ is selected */}
            {showOtherTournament && (
              <View style={styles.otherTournamentBox}>
                <View style={styles.otherTournamentHeader}>
                  <Ionicons name="add-circle-outline" size={14} color={ACCENT} />
                  <Text style={styles.otherTournamentTitle}>Local / Custom tournament</Text>
                </View>
                <Field
                  label="Tournament name(s), comma separated"
                  value={otherTournament}
                  onChangeText={setOtherTournament}
                  icon="pencil-outline"
                  focused={otherTournamentFocused}
                  onFocus={() => setOtherTournamentFocused(true)}
                  onBlur={() => setOtherTournamentFocused(false)}
                  placeholder="e.g. District Cup 2024, City LAN Finals"
                />
                <Text style={styles.otherTournamentHint}>
                  These will appear on your profile as custom tournaments.
                </Text>
              </View>
            )}

            {/* ── SOCIAL & BIO ───────────────────────────── */}
            <SectionHeader label="Social & Bio" icon="share-social-outline" />
            <Field label="YouTube channel URL" value={form.youtube_url ?? ''} onChangeText={(youtube_url) => setForm((f) => ({ ...f, youtube_url }))} icon="logo-youtube" autoCapitalize="none" {...f('yt')} />
            <Field label="Instagram profile URL" value={form.instagram_url ?? ''} onChangeText={(instagram_url) => setForm((f) => ({ ...f, instagram_url }))} icon="logo-instagram" autoCapitalize="none" {...f('ig')} />
            <Field label="Short bio" value={form.bio ?? ''} onChangeText={(bio) => setForm((f) => ({ ...f, bio }))} multiline numberOfLines={4} icon="document-text-outline" {...f('bio')} />

            {/* Ban history toggle */}
            <SectionHeader label="Account History" icon="shield-outline" />
            <BanToggle value={form.ban_history} onChange={(ban_history) => setForm((f) => ({ ...f, ban_history }))} />

            {/* Save button */}
            <View style={{ marginTop: 16 }}>
              <Pressable onPress={handleSave} disabled={saving}>
                <LinearGradient
                  colors={saving ? ['#3A4A1A', '#2A3A12'] : ['#C8F135', '#96B827']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveButton}
                >
                  {saving ? (
                    <Text style={[styles.saveLabel, { color: TEXT_MUTED }]}>Saving…</Text>
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={18} color={BG} style={{ marginRight: 8 }} />
                      <Text style={styles.saveLabel}>
                        {existing ? 'Update profile' : 'Create profile'}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>

            <View style={{ height: 40 }} />
          </>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

// ── Main styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  glowTop: {
    position: 'absolute', top: -60, right: -60,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: ACCENT, opacity: 0.04,
  },
  glowBottom: {
    position: 'absolute', bottom: -80, left: -60,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: '#1A6EFF', opacity: 0.05,
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 32 },

  // Page header
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pageTitle: { fontSize: 26, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, color: TEXT_MUTED, marginTop: 3 },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1C2C10',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#2A3C10',
  },
  completedText: { fontSize: 12, color: ACCENT, fontWeight: '700' },

  // Org banner
  orgBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0A1828',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1A3A60',
    padding: 12,
    marginBottom: 16,
  },
  orgBannerText: { fontSize: 12, color: '#60C8FF', flex: 1, lineHeight: 17 },

  // Loading
  loadingBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  loadingText: { color: TEXT_MUTED, fontSize: 14 },

  // Layout helpers
  twoCol: { flexDirection: 'row', gap: 10 },

  // Field labels
  fieldLabel: { fontSize: 12, color: TEXT_MUTED, fontWeight: '600', letterSpacing: 0.4, marginBottom: 8, marginTop: 2 },
  required: { color: ACCENT },

  // Other tournament box
  otherTournamentBox: {
    backgroundColor: '#0C1820',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#1A3A28',
    padding: 14,
    marginBottom: 12,
  },
  otherTournamentHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  otherTournamentTitle: { fontSize: 13, color: ACCENT, fontWeight: '700' },
  otherTournamentHint: { fontSize: 11, color: TEXT_MUTED, marginTop: -4, lineHeight: 16 },

  // Save button
  saveButton: {
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: { fontSize: 16, fontWeight: '800', color: BG, letterSpacing: 0.3 },
});