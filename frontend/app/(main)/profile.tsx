import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  Platform,
  TextInput as RNTextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Video, ResizeMode } from 'expo-av';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { uploadAvatar } from '../../services/user.service';
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
import { VideoItem, getMyVideos, deleteVideo as deleteVideoApi } from '../../services/video.service';

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

// ── Reusable: Floating-label field ─────────────────────────────────────────────
function Field({
  label, value, onChangeText, keyboardType, multiline, numberOfLines,
  focused, onFocus, onBlur, icon, secureTextEntry, placeholder, autoCapitalize,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  keyboardType?: any; multiline?: boolean; numberOfLines?: number;
  focused?: boolean; onFocus?: () => void; onBlur?: () => void;
  icon?: string; secureTextEntry?: boolean; placeholder?: string; autoCapitalize?: any;
}) {
  const hasValue = value !== '' && value !== undefined && value !== null;
  const floated = focused || hasValue;
  const labelAnim = useRef(new Animated.Value(floated ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(labelAnim, { toValue: floated ? 1 : 0, duration: 140, useNativeDriver: false }).start();
  }, [floated]);

  const labelTop = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 7] });
  const labelFontSize = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });
  const wrapperHeight = multiline ? (numberOfLines ? numberOfLines * 24 + 40 : 100) : 58;

  return (
    <View style={[fStyles.wrapper, focused && fStyles.wrapperFocused, { height: wrapperHeight }, multiline && fStyles.wrapperMulti]}>
      {icon && <Ionicons name={icon as any} size={16} color={focused ? ACCENT : TEXT_MUTED} style={[fStyles.icon, multiline && fStyles.iconMulti]} />}
      <View style={[fStyles.inputArea, multiline && fStyles.inputAreaMulti]}>
        <Animated.Text style={{ position: 'absolute', left: 0, top: labelTop, fontSize: labelFontSize, color: focused ? ACCENT : TEXT_MUTED, fontWeight: '500', zIndex: 1, pointerEvents: 'none' }} numberOfLines={1}>
          {label}
        </Animated.Text>
        <RNTextInput
          value={value} onChangeText={onChangeText} keyboardType={keyboardType}
          multiline={multiline} numberOfLines={numberOfLines} onFocus={onFocus} onBlur={onBlur}
          secureTextEntry={secureTextEntry} autoCapitalize={autoCapitalize ?? 'none'}
          placeholder={floated ? (placeholder ?? '') : ''} placeholderTextColor={TEXT_MUTED}
          style={[fStyles.nativeInput, multiline && fStyles.nativeInputMulti]}
          cursorColor={ACCENT} selectionColor="rgba(200, 241, 53, 0.4)"
        />
      </View>
    </View>
  );
}

const fStyles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER, marginBottom: 12, paddingLeft: 14, paddingRight: 14, overflow: 'hidden' },
  wrapperFocused: { borderColor: ACCENT, shadowColor: ACCENT, shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  wrapperMulti: { alignItems: 'flex-start', paddingTop: 10, paddingBottom: 10 },
  icon: { marginRight: 10 },
  iconMulti: { marginTop: 2 },
  inputArea: { flex: 1, justifyContent: 'center', position: 'relative' },
  inputAreaMulti: { justifyContent: 'flex-start' },
  nativeInput: { color: TEXT_PRIMARY, fontSize: 15, paddingTop: 20, paddingBottom: 6, margin: 0, padding: 0, paddingLeft: 0 },
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

// ── Reusable: Single-select pills ──────────────────────────────────────────────
function PillSelect<T extends string>({ options, value, onChange }: { options: Option[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={psStyles.row}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <TouchableOpacity key={opt.value} onPress={() => onChange(opt.value as T)} style={[psStyles.pill, active && psStyles.pillActive]} activeOpacity={0.75}>
            {opt.icon && <Ionicons name={opt.icon as any} size={12} color={active ? BG : TEXT_MUTED} style={{ marginRight: 5 }} />}
            <Text style={[psStyles.label, active && psStyles.labelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const psStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, backgroundColor: SURFACE, borderWidth: 1.5, borderColor: BORDER },
  pillActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  label: { fontSize: 12, color: TEXT_MUTED, fontWeight: '600' },
  labelActive: { color: BG },
});

// ── Reusable: Multi-select bottom sheet ───────────────────────────────────────
function MultiSelectModal({ visible, title, options, selected, onToggle, onClose }: {
  visible: boolean; title: string; options: Option[]; selected: string[];
  onToggle: (value: string) => void; onClose: () => void;
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
        <View style={msStyles.handle} />
        <View style={msStyles.header}>
          <Text style={msStyles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={msStyles.closeBtn}>
            <Ionicons name="checkmark" size={18} color={BG} />
          </TouchableOpacity>
        </View>
        <Text style={msStyles.hint}>{selected.length} selected</Text>
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
          {options.map((opt) => {
            const isSelected = selected.includes(opt.value);
            return (
              <TouchableOpacity key={opt.value} onPress={() => onToggle(opt.value)} style={[msStyles.option, isSelected && msStyles.optionSelected]} activeOpacity={0.75}>
                <View style={msStyles.optionLeft}>
                  {opt.icon && (
                    <View style={[msStyles.optionIconWrap, isSelected && msStyles.optionIconWrapActive]}>
                      <Ionicons name={opt.icon as any} size={14} color={isSelected ? BG : TEXT_MUTED} />
                    </View>
                  )}
                  <Text style={[msStyles.optionLabel, isSelected && msStyles.optionLabelActive]}>{opt.label}</Text>
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
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#0C1522', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1.5, borderColor: BORDER, paddingTop: 12, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 24, zIndex: 2 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 17, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.3 },
  closeBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: 12, color: TEXT_MUTED, marginBottom: 16 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 14, borderRadius: 12, marginBottom: 6, backgroundColor: SURFACE, borderWidth: 1.5, borderColor: BORDER },
  optionSelected: { backgroundColor: '#1C2C10', borderColor: '#2A3C10' },
  optionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  optionIconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  optionIconWrapActive: { backgroundColor: ACCENT },
  optionLabel: { fontSize: 14, color: TEXT_MUTED, fontWeight: '500', flex: 1 },
  optionLabelActive: { color: TEXT_PRIMARY, fontWeight: '600' },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  checkActive: { backgroundColor: ACCENT, borderColor: ACCENT },
});

// ── Reusable: Multi-select trigger ────────────────────────────────────────────
function MultiSelectTrigger({ label, selected, onPress, icon }: { label: string; selected: string[]; onPress: () => void; icon: string }) {
  const hasSelection = selected.length > 0;
  return (
    <TouchableOpacity onPress={onPress} style={[trigStyles.wrapper, hasSelection && trigStyles.wrapperActive]} activeOpacity={0.8}>
      <View style={trigStyles.left}>
        <Ionicons name={icon as any} size={16} color={hasSelection ? ACCENT : TEXT_MUTED} style={{ marginRight: 10 }} />
        {hasSelection ? (
          <View style={trigStyles.tagsWrap}>
            {selected.map((v) => (
              <View key={v} style={trigStyles.tag}><Text style={trigStyles.tagText}>{v}</Text></View>
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
  wrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 12, minHeight: 54 },
  wrapperActive: { borderColor: '#2A3C10' },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1, flexWrap: 'wrap' },
  placeholder: { fontSize: 15, color: TEXT_MUTED },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  tag: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, backgroundColor: '#1C2C10', borderWidth: 1, borderColor: '#2A3C10' },
  tagText: { fontSize: 11, color: ACCENT, fontWeight: '600' },
});

// ── Ban history toggle ─────────────────────────────────────────────────────────
function BanToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity onPress={() => onChange(!value)} style={[btStyles.wrapper, value && btStyles.wrapperActive]} activeOpacity={0.8}>
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
  wrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER, padding: 14, marginBottom: 12 },
  wrapperActive: { borderColor: '#4A1010', backgroundColor: '#160808' },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  iconWrapActive: { backgroundColor: RED },
  label: { fontSize: 14, fontWeight: '600', color: TEXT_PRIMARY },
  labelActive: { color: RED },
  sub: { fontSize: 11, color: TEXT_MUTED, marginTop: 2 },
  toggle: { width: 42, height: 24, borderRadius: 12, backgroundColor: BORDER, padding: 3, justifyContent: 'center' },
  toggleActive: { backgroundColor: RED },
  thumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: TEXT_MUTED, alignSelf: 'flex-start' },
  thumbActive: { backgroundColor: '#fff', alignSelf: 'flex-end' },
});

// ── Profile progress bar ───────────────────────────────────────────────────────
function ProfileProgress({ form, roles, maps }: { form: any; roles: string[]; maps: string[] }) {
  const fields = [form.name, form.country, form.game_id, form.age, roles.length > 0, maps.length > 0, form.bio, form.youtube_url || form.instagram_url];
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
        {pct < 50 ? 'Add more info to get noticed by organizations' : pct < 80 ? 'Looking good! Fill social & bio to stand out' : 'Great profile! Organizations can discover you easily.'}
      </Text>
    </View>
  );
}

const ppStyles = StyleSheet.create({
  wrapper: { backgroundColor: SURFACE, borderRadius: 16, borderWidth: 1.5, borderColor: BORDER, padding: 16, marginBottom: 8 },
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '600', color: TEXT_PRIMARY },
  pct: { fontSize: 13, fontWeight: '800', color: ACCENT },
  track: { height: 4, backgroundColor: BORDER, borderRadius: 2, overflow: 'hidden', marginBottom: 10 },
  fill: { height: '100%', backgroundColor: ACCENT, borderRadius: 2 },
  hint: { fontSize: 11, color: TEXT_MUTED, lineHeight: 16 },
});

// ── Styles (declared before function so no hoisting issues) ────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  glowTop: { position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: ACCENT, opacity: 0.04 },
  glowBottom: { position: 'absolute', bottom: -80, left: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: '#1A6EFF', opacity: 0.05 },
  // Tab bar
  tabBar: { flexDirection: 'row', backgroundColor: SURFACE, borderBottomWidth: 1, borderBottomColor: BORDER, paddingTop: Platform.OS === 'ios' ? 54 : 44 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: ACCENT },
  tabLabel: { fontSize: 13, fontWeight: '600', color: TEXT_MUTED },
  tabLabelActive: { color: ACCENT },
  tabBadge: { marginLeft: 6, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabBadgeText: { fontSize: 10, fontWeight: '800', color: BG },
  // Profile tab content
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, color: TEXT_MUTED, marginTop: 3 },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#1C2C10', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#2A3C10' },
  completedText: { fontSize: 12, color: ACCENT, fontWeight: '700' },
  orgBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0A1828', borderRadius: 12, borderWidth: 1, borderColor: '#1A3A60', padding: 12, marginBottom: 16 },
  orgBannerText: { fontSize: 12, color: '#60C8FF', flex: 1, lineHeight: 17 },
  loadingBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  loadingText: { color: TEXT_MUTED, fontSize: 14 },
  twoCol: { flexDirection: 'row', gap: 10 },
  fieldLabel: { fontSize: 12, color: TEXT_MUTED, fontWeight: '600', letterSpacing: 0.4, marginBottom: 8, marginTop: 2 },
  required: { color: ACCENT },
  otherTournamentBox: { backgroundColor: '#0C1820', borderRadius: 14, borderWidth: 1.5, borderColor: '#1A3A28', padding: 14, marginBottom: 12 },
  otherTournamentHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  otherTournamentTitle: { fontSize: 13, color: ACCENT, fontWeight: '700' },
  otherTournamentHint: { fontSize: 11, color: TEXT_MUTED, marginTop: -4, lineHeight: 16 },
  saveButton: { borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  saveLabel: { fontSize: 16, fontWeight: '800', color: BG, letterSpacing: 0.3 },
  // Clips tab
  clipsTabContainer: { flex: 1 },
  clipsTabHeader: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: SURFACE },
  clipsStatBox: { alignItems: 'center', gap: 4 },
  clipsStatNum: { fontSize: 20, fontWeight: '900', color: TEXT_PRIMARY },
  clipsStatLabel: { fontSize: 10, color: TEXT_MUTED, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  clipsLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20 },
  clipsLoadingText: { fontSize: 13, color: TEXT_MUTED },
  clipsEmpty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  clipsEmptyText: { fontSize: 15, fontWeight: '600', color: TEXT_PRIMARY },
  clipsEmptyHint: { fontSize: 12, color: TEXT_MUTED, textAlign: 'center', paddingHorizontal: 40 },
  clipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, padding: 4 },
  clipsGridPad: { padding: 4, paddingBottom: 80 },
  clipsHint: { fontSize: 11, color: TEXT_MUTED, textAlign: 'center', paddingVertical: 12, paddingBottom: 16 },
  // Preview modal
  previewBackdrop: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  previewVideo: { width: '100%', height: '100%' },
  previewActions: { position: 'absolute', top: 50, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, zIndex: 10 },
  previewClose: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  previewDelete: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(200,0,0,0.75)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  previewDeleteText: { fontSize: 13, color: '#fff', fontWeight: '700' },
  previewCaption: { position: 'absolute', bottom: 60, left: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 12, zIndex: 10 },
  previewCaptionText: { fontSize: 13, color: '#fff', lineHeight: 18 },
  // Avatar hero
  avatarHero: { alignItems: 'center', paddingTop: 20, paddingBottom: 12 },
  avatarOuter: { width: 96, height: 96, borderRadius: 48, borderWidth: 2.5, borderColor: ACCENT, overflow: 'visible', position: 'relative' },
  avatarImg: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: { width: 96, height: 96, borderRadius: 48, backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center' },
  avatarCamBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: BG },
  avatarUsername: { fontSize: 16, fontWeight: '800', color: TEXT_PRIMARY, marginTop: 10, letterSpacing: -0.3 },
  avatarChangeHint: { fontSize: 11, color: TEXT_MUTED, marginTop: 3 },
});

// Grid cell styles
const gridStyles = StyleSheet.create({
  cell: { borderRadius: 8, overflow: 'hidden', backgroundColor: SURFACE2 },
  playBadge: { position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  duration: { position: 'absolute', bottom: 5, left: 6, fontSize: 9, color: '#fff', fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 } },
  likeBadge: { position: 'absolute', bottom: 5, right: 6, flexDirection: 'row', alignItems: 'center', gap: 2 },
  likeText: { fontSize: 9, color: '#fff', fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 } },
});

// ── Reusable: Collapsible Section ──────────────────────────────────────────────
function CollapsibleSection({
  title, icon, isExpanded, onToggle, children
}: {
  title: string; icon: string; isExpanded: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <View style={[csStyles.wrapper, isExpanded && csStyles.wrapperActive]}>
      <TouchableOpacity style={csStyles.header} onPress={onToggle} activeOpacity={0.8}>
        <View style={csStyles.headerLeft}>
          <View style={[csStyles.iconWrap, isExpanded && csStyles.iconWrapActive]}>
            <Ionicons name={icon as any} size={16} color={isExpanded ? BG : ACCENT} />
          </View>
          <Text style={[csStyles.title, isExpanded && csStyles.titleActive]}>{title}</Text>
        </View>
        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={isExpanded ? ACCENT : TEXT_MUTED} />
      </TouchableOpacity>
      {isExpanded && <View style={csStyles.content}>{children}</View>}
    </View>
  );
}

const csStyles = StyleSheet.create({
  wrapper: { marginBottom: 12, backgroundColor: SURFACE, borderRadius: 16, borderWidth: 1.5, borderColor: BORDER, overflow: 'hidden' },
  wrapperActive: { borderColor: '#2A3C10' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  iconWrapActive: { backgroundColor: ACCENT },
  title: { fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY },
  titleActive: { color: ACCENT },
  content: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#1C2C10' },
});

// ── Main screen ────────────────────────────────────────────────────────────────
export default function PlayerProfileScreen() {
  const [existing, setExisting] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { user, updateAvatar } = useAuth();
  const isOrg = user?.role?.toLowerCase() === 'organization';

  const [activeTab, setActiveTab] = useState<'profile' | 'clips'>('clips');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string>('basic');

  const switchTab = (tab: 'profile' | 'clips') => setActiveTab(tab);

  const handleChangeAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Photo library permission required' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    try {
      setAvatarUploading(true);
      const newUrl = await uploadAvatar(
        asset.uri,
        asset.fileName ?? 'avatar.jpg',
        asset.mimeType ?? 'image/jpeg'
      );
      await updateAvatar(newUrl);
      Toast.show({ type: 'success', text1: 'Photo updated!' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err?.message ?? 'Upload failed' });
    } finally {
      setAvatarUploading(false);
    }
  };

  const [rolesModal, setRolesModal] = useState(false);
  const [mapsModal, setMapsModal] = useState(false);
  const [tournamentsModal, setTournamentsModal] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedMaps, setSelectedMaps] = useState<string[]>([]);
  const [selectedTournaments, setSelectedTournaments] = useState<string[]>([]);
  const [otherTournament, setOtherTournament] = useState('');
  const [otherTournamentFocused, setOtherTournamentFocused] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [form, setForm] = useState<UpsertPlayerProfileInput>({
    name: '', age: 18, gender: 'male', country: '', game_id: '',
    device: 'mobile', finger_setup: 'thumb', kd_ratio: 1, average_damage: 500,
    roles: [], playing_style: 'balanced', preferred_maps: [], ban_history: false,
  });

  const scrollRef = useRef<any>(null);

  // Clips
  const [myClips, setMyClips] = useState<VideoItem[]>([]);
  const [clipsLoading, setClipsLoading] = useState(false);
  const [previewClip, setPreviewClip] = useState<VideoItem | null>(null);

  const loadMyClips = useCallback(async () => {
    setClipsLoading(true);
    try {
      const clips = await getMyVideos();
      setMyClips(clips);
    } catch { } finally {
      setClipsLoading(false);
    }
  }, []);

  useEffect(() => { void loadMyClips(); }, [loadMyClips]);

  const handleDeleteClip = (clip: VideoItem) => {
    Alert.alert('Delete Clip', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteVideoApi(clip._id);
            setMyClips((prev) => prev.filter((c) => c._id !== clip._id));
            if (previewClip?._id === clip._id) setPreviewClip(null);
            Toast.show({ type: 'success', text1: 'Clip deleted' });
          } catch (err: any) {
            Toast.show({ type: 'error', text1: err?.response?.data?.message ?? 'Delete failed' });
          }
        },
      },
    ]);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const profile = await fetchPlayerProfile();
        if (profile) {
          setExisting(profile);
          setForm({
            name: profile.name, age: profile.age, gender: profile.gender,
            country: profile.country, game_id: profile.game_id, device: profile.device,
            finger_setup: profile.finger_setup, kd_ratio: profile.kd_ratio,
            average_damage: profile.average_damage, roles: profile.roles,
            playing_style: profile.playing_style, preferred_maps: profile.preferred_maps,
            ban_history: profile.ban_history, years_experience: profile.years_experience,
            youtube_url: profile.youtube_url, instagram_url: profile.instagram_url,
            tournaments_played: profile.tournaments_played,
            other_tournament_name: profile.other_tournament_name, bio: profile.bio,
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
            setSelectedTournaments((prev) => prev.includes('__other__') ? prev : [...prev, '__other__']);
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

  const toggleRole = (v: string) => setSelectedRoles((prev) => prev.includes(v) ? prev.filter((r) => r !== v) : [...prev, v]);
  const toggleMap = (v: string) => setSelectedMaps((prev) => prev.includes(v) ? prev.filter((mp) => mp !== v) : [...prev, v]);
  const toggleTournament = (v: string) => setSelectedTournaments((prev) => prev.includes(v) ? prev.filter((t) => t !== v) : [...prev, v]);
  const showOtherTournament = selectedTournaments.includes('__other__');

  const handleSave = async () => {
    if (!form.name || !form.country || !form.game_id) {
      Toast.show({ type: 'error', text1: 'Name, country and in-game ID are required' }); return;
    }
    if (!selectedRoles.length || !selectedMaps.length) {
      Toast.show({ type: 'error', text1: 'Select at least one role and one preferred map' }); return;
    }
    const payload: UpsertPlayerProfileInput = {
      ...form,
      age: Number(form.age), kd_ratio: Number(form.kd_ratio),
      average_damage: Number(form.average_damage),
      years_experience: form.years_experience ? Number(form.years_experience) : undefined,
      roles: selectedRoles, preferred_maps: selectedMaps,
      tournaments_played: selectedTournaments.filter((t) => t !== '__other__'),
      other_tournament_name: showOtherTournament && otherTournament.trim() ? otherTournament.trim() : undefined,
    };
    try {
      setSaving(true);
      const saved = existing ? await updatePlayerProfile(payload) : await createPlayerProfile(payload);
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

  // Clip grid cell
  const CLIP_COL_WIDTH = (Dimensions.get('window').width - 40 - 8) / 3;

  const renderClipItem = useCallback(({ item }: { item: VideoItem }) => (
    <TouchableOpacity
      style={[gridStyles.cell, { width: CLIP_COL_WIDTH, height: CLIP_COL_WIDTH * (16 / 9) }]}
      onPress={() => setPreviewClip(item)}
      onLongPress={() => handleDeleteClip(item)}
      activeOpacity={0.88}
    >
      <Image source={{ uri: item.thumbnailUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      <LinearGradient colors={['transparent', 'rgba(8,12,20,0.85)']} style={StyleSheet.absoluteFillObject} />
      <View style={gridStyles.playBadge}><Ionicons name="play" size={12} color="#fff" /></View>
      <Text style={gridStyles.duration}>{item.duration ? `${Math.round(item.duration)}s` : ''}</Text>
      <View style={gridStyles.likeBadge}>
        <Ionicons name="heart" size={9} color="#FF4D6D" />
        <Text style={gridStyles.likeText}>{item.likes ?? 0}</Text>
      </View>
    </TouchableOpacity>
  ), [CLIP_COL_WIDTH]);

  const clipsKeyExtractor = useCallback((item: VideoItem) => item._id, []);

  const totalLikes = myClips.reduce((sum, c) => sum + (c.likes ?? 0), 0);
  const totalViews = myClips.reduce((sum: number, c: any) => sum + (c.views ?? 0), 0);

  return (
    <View style={styles.root}>
      {/* Background glows */}
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />

      {/* ── Avatar Hero (Always visible at top) ── */}
      <View style={styles.avatarHero}>
        <TouchableOpacity onPress={handleChangeAvatar} activeOpacity={0.85} disabled={avatarUploading}>
          <View style={styles.avatarOuter}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name="person" size={36} color={ACCENT} />
              </View>
            )}
            <View style={styles.avatarCamBadge}>
              {avatarUploading
                ? <ActivityIndicator size="small" color={BG} />
                : <Ionicons name="camera" size={14} color={BG} />}
            </View>
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarUsername}>@{user?.username ?? ''}</Text>
        <Text style={styles.avatarChangeHint}>{isOrg ? 'Tap to change logo' : 'Tap to change photo'}</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'clips' && styles.tabBtnActive]} onPress={() => switchTab('clips')} activeOpacity={0.8}>
          <Ionicons name="play-circle-outline" size={15} color={activeTab === 'clips' ? ACCENT : TEXT_MUTED} />
          <Text style={[styles.tabLabel, activeTab === 'clips' && styles.tabLabelActive]}>  My Clips</Text>
          {myClips.length > 0 && (
            <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{myClips.length}</Text></View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'profile' && styles.tabBtnActive]} onPress={() => switchTab('profile')} activeOpacity={0.8}>
          <Ionicons name="person-outline" size={15} color={activeTab === 'profile' ? ACCENT : TEXT_MUTED} />
          <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>  {existing ? 'Edit Profile' : 'Setup Profile'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Profile Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <KeyboardAwareScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} extraScrollHeight={30}>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={ACCENT} />
              <Text style={styles.loadingText}>Loading your profile…</Text>
            </View>
          ) : (
            <>
              {/* Org banner */}
              {hasOrg && (
                <View style={[styles.orgBanner, { marginTop: 10 }]}>
                  <Ionicons name="shield-checkmark" size={20} color="#60C8FF" />
                  <Text style={styles.orgBannerText}>
                    You are part of <Text style={{ fontWeight: '800', color: '#fff' }}>{existing?.currentOrganization?.organization_name}</Text>.
                  </Text>
                </View>
              )}

              <ProfileProgress form={form} roles={selectedRoles} maps={selectedMaps} />

              <View style={{ height: 16 }} />

              {/* ── Accordion Sections ─── */}

              <CollapsibleSection
                title="Basic Information"
                icon="person-outline"
                isExpanded={expandedSection === 'basic'}
                onToggle={() => setExpandedSection(expandedSection === 'basic' ? '' : 'basic')}
              >
                <View style={{ height: 12 }} />
                <Field label="Full name" value={form.name ?? ''} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} icon="person-outline" autoCapitalize="words" {...f('name')} />
                <View style={styles.twoCol}>
                  <View style={{ flex: 1 }}>
                    <Field label="Age" value={String(form.age ?? '')} onChangeText={(v) => setForm((p) => ({ ...p, age: Number(v) }))} keyboardType="numeric" icon="calendar-outline" {...f('age')} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="Country" value={form.country ?? ''} onChangeText={(v) => setForm((p) => ({ ...p, country: v }))} icon="globe-outline" autoCapitalize="words" {...f('country')} />
                  </View>
                </View>
                <Text style={styles.fieldLabel}>Gender</Text>
                <PillSelect options={GENDER_OPTIONS} value={form.gender ?? 'male'} onChange={(v) => setForm((p) => ({ ...p, gender: v as Gender }))} />
              </CollapsibleSection>

              <CollapsibleSection
                title="Game Stats & Device"
                icon="game-controller-outline"
                isExpanded={expandedSection === 'stats'}
                onToggle={() => setExpandedSection(expandedSection === 'stats' ? '' : 'stats')}
              >
                <View style={{ height: 12 }} />
                <Field label="In-Game ID (PUBG UID)" value={form.game_id ?? ''} onChangeText={(v) => setForm((p) => ({ ...p, game_id: v }))} icon="finger-print-outline" {...f('game_id')} />
                <View style={styles.twoCol}>
                  <View style={{ flex: 1 }}>
                    <Field label="K/D Ratio" value={String(form.kd_ratio ?? '')} onChangeText={(v) => setForm((p) => ({ ...p, kd_ratio: Number(v) }))} keyboardType="decimal-pad" icon="trending-up-outline" {...f('kd')} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="Avg. Damage" value={String(form.average_damage ?? '')} onChangeText={(v) => setForm((p) => ({ ...p, average_damage: Number(v) }))} keyboardType="numeric" icon="flash-outline" {...f('dmg')} />
                  </View>
                </View>
                <Field label="Years of Experience" value={String(form.years_experience ?? '')} onChangeText={(v) => setForm((p) => ({ ...p, years_experience: Number(v) }))} keyboardType="numeric" icon="time-outline" {...f('yrs')} />

                <Text style={styles.fieldLabel}>Device</Text>
                <PillSelect options={DEVICE_OPTIONS} value={form.device ?? 'mobile'} onChange={(v) => setForm((p) => ({ ...p, device: v as Device }))} />
                <Text style={styles.fieldLabel}>Finger Setup</Text>
                <PillSelect options={FINGER_OPTIONS} value={form.finger_setup ?? 'thumb'} onChange={(v) => setForm((p) => ({ ...p, finger_setup: v as FingerSetup }))} />
                <Text style={styles.fieldLabel}>Playing Style</Text>
                <PillSelect options={STYLE_OPTIONS} value={form.playing_style ?? 'balanced'} onChange={(v) => setForm((p) => ({ ...p, playing_style: v as PlayingStyle }))} />
              </CollapsibleSection>

              <CollapsibleSection
                title="Roles & Maps"
                icon="map-outline"
                isExpanded={expandedSection === 'roles'}
                onToggle={() => setExpandedSection(expandedSection === 'roles' ? '' : 'roles')}
              >
                <View style={{ height: 12 }} />
                <Text style={styles.fieldLabel}>Roles <Text style={styles.required}>*</Text></Text>
                <MultiSelectTrigger label="Select your roles…" selected={selectedRoles} onPress={() => setRolesModal(true)} icon="shield-outline" />
                <Text style={styles.fieldLabel}>Preferred Maps <Text style={styles.required}>*</Text></Text>
                <MultiSelectTrigger label="Select preferred maps…" selected={selectedMaps} onPress={() => setMapsModal(true)} icon="map-outline" />
              </CollapsibleSection>

              <CollapsibleSection
                title="Tournament History"
                icon="trophy-outline"
                isExpanded={expandedSection === 'tournaments'}
                onToggle={() => setExpandedSection(expandedSection === 'tournaments' ? '' : 'tournaments')}
              >
                <View style={{ height: 12 }} />
                <MultiSelectTrigger label="Tournaments played…" selected={selectedTournaments.filter(t => t !== '__other__')} onPress={() => setTournamentsModal(true)} icon="trophy-outline" />
                {showOtherTournament && (
                  <View style={styles.otherTournamentBox}>
                    <View style={styles.otherTournamentHeader}>
                      <Ionicons name="add-circle-outline" size={16} color={ACCENT} />
                      <Text style={styles.otherTournamentTitle}>Other Tournament</Text>
                    </View>
                    <Text style={styles.otherTournamentHint}>Enter the name of the tournament</Text>
                    <Field label="Tournament name" value={otherTournament} onChangeText={setOtherTournament} focused={otherTournamentFocused} onFocus={() => setOtherTournamentFocused(true)} onBlur={() => setOtherTournamentFocused(false)} icon="trophy-outline" autoCapitalize="words" />
                  </View>
                )}
              </CollapsibleSection>

              <CollapsibleSection
                title="About & Social"
                icon="information-circle-outline"
                isExpanded={expandedSection === 'social'}
                onToggle={() => setExpandedSection(expandedSection === 'social' ? '' : 'social')}
              >
                <View style={{ height: 12 }} />
                <Field label="Bio" value={form.bio ?? ''} onChangeText={(v) => setForm((p) => ({ ...p, bio: v }))} multiline numberOfLines={4} {...f('bio')} />
                <Field label="YouTube URL" value={form.youtube_url ?? ''} onChangeText={(v) => setForm((p) => ({ ...p, youtube_url: v }))} icon="logo-youtube" {...f('yt')} />
                <Field label="Instagram URL" value={form.instagram_url ?? ''} onChangeText={(v) => setForm((p) => ({ ...p, instagram_url: v }))} icon="logo-instagram" {...f('ig')} />
                <Field label="Previous Organization" value={form.previous_organization ?? ''} onChangeText={(v) => setForm((p) => ({ ...p, previous_organization: v }))} icon="business-outline" autoCapitalize="words" {...f('org')} />
                <BanToggle value={form.ban_history ?? false} onChange={(v) => setForm((p) => ({ ...p, ban_history: v }))} />
              </CollapsibleSection>

              {/* Save */}
              <View style={{ marginTop: 24 }}>
                <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.85}>
                  <LinearGradient colors={['#C8F135', '#A8D020']} style={styles.saveButton}>
                    {saving ? <ActivityIndicator color={BG} /> : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color={BG} style={{ marginRight: 8 }} />
                        <Text style={styles.saveLabel}>{existing ? 'Update Profile' : 'Create Profile'}</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}
        </KeyboardAwareScrollView>
      )}

      {/* ── Clips Tab ───────────────────────────────────────────────────────── */}
      {activeTab === 'clips' && (
        <View style={styles.clipsTabContainer}>
          {/* Stats row */}
          <View style={styles.clipsTabHeader}>
            <View style={styles.clipsStatBox}>
              <Text style={styles.clipsStatNum}>{myClips.length}</Text>
              <Text style={styles.clipsStatLabel}>Clips</Text>
            </View>
            <View style={{ width: 1, backgroundColor: BORDER, height: 36, alignSelf: 'center' }} />
            <View style={styles.clipsStatBox}>
              <Text style={styles.clipsStatNum}>{totalLikes}</Text>
              <Text style={styles.clipsStatLabel}>Likes</Text>
            </View>
            <View style={{ width: 1, backgroundColor: BORDER, height: 36, alignSelf: 'center' }} />
            <View style={styles.clipsStatBox}>
              <Text style={styles.clipsStatNum}>{totalViews}</Text>
              <Text style={styles.clipsStatLabel}>Views</Text>
            </View>
          </View>

          {clipsLoading ? (
            <View style={styles.clipsLoadingRow}>
              <ActivityIndicator color={ACCENT} size="small" />
              <Text style={styles.clipsLoadingText}>Loading clips…</Text>
            </View>
          ) : myClips.length === 0 ? (
            <View style={styles.clipsEmpty}>
              <Ionicons name="film-outline" size={48} color={TEXT_MUTED} />
              <Text style={styles.clipsEmptyText}>No clips yet</Text>
              <Text style={styles.clipsEmptyHint}>Go to the Videos tab to upload your first clip!</Text>
            </View>
          ) : (
            <FlatList
              data={myClips}
              renderItem={renderClipItem}
              keyExtractor={clipsKeyExtractor}
              numColumns={3}
              columnWrapperStyle={styles.clipsGrid}
              contentContainerStyle={styles.clipsGridPad}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={<Text style={styles.clipsHint}>Long-press a clip to delete</Text>}
            />
          )}
        </View>
      )}

      {/* ── Clip Preview Modal ─────────────────────────────────────────────── */}
      <Modal visible={!!previewClip} transparent={false} animationType="fade" statusBarTranslucent onRequestClose={() => setPreviewClip(null)}>
        <View style={styles.previewBackdrop}>
          {previewClip && (
            <Video
              source={{ uri: previewClip.videoUrl }}
              style={styles.previewVideo}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              isLooping
              useNativeControls
            />
          )}
          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.previewClose} onPress={() => setPreviewClip(null)}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
            {previewClip && (
              <TouchableOpacity style={styles.previewDelete} onPress={() => handleDeleteClip(previewClip)}>
                <Ionicons name="trash-outline" size={16} color="#fff" />
                <Text style={styles.previewDeleteText}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
          {previewClip?.caption && (
            <View style={styles.previewCaption}>
              <Text style={styles.previewCaptionText}>{previewClip.caption}</Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Multi-select modals */}
      <MultiSelectModal visible={rolesModal} title="Select your roles" options={ROLE_OPTIONS} selected={selectedRoles} onToggle={toggleRole} onClose={() => setRolesModal(false)} />
      <MultiSelectModal visible={mapsModal} title="Preferred maps" options={MAP_OPTIONS} selected={selectedMaps} onToggle={toggleMap} onClose={() => setMapsModal(false)} />
      <MultiSelectModal visible={tournamentsModal} title="Tournaments played" options={TOURNAMENT_OPTIONS} selected={selectedTournaments} onToggle={toggleTournament} onClose={() => setTournamentsModal(false)} />
    </View>
  );
}