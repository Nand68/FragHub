import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  ScrollView,
  Pressable,
  TextInput as RNTextInput,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Text, TextInput } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const ACCENT = '#C8F135';
const BG = '#080C14';
const SURFACE = '#0F1521';
const BORDER = '#1C2535';
const TEXT_PRIMARY = '#F0F4FF';
const TEXT_MUTED = '#5A6A82';
const OTP_LENGTH = 6;

// ── Password strength ─────────────────────────────────────
function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: BORDER };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: '#FF4D4D' };
  if (score <= 2) return { score: 2, label: 'Fair', color: '#FFA500' };
  if (score <= 3) return { score: 3, label: 'Good', color: '#60C8FF' };
  return { score: 4, label: 'Strong', color: ACCENT };
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState(emailParam ?? '');
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedOtp, setFocusedOtp] = useState<number | null>(null);
  const [pwFocused, setPwFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  const inputRefs = useRef<(RNTextInput | null)[]>([]);
  const buttonScale = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<KeyboardAwareScrollView>(null);
  const passwordFieldRef = useRef<View>(null);

  // Lock icon float
  const floatY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -7, duration: 1600, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const onPressIn = () =>
    Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () =>
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  // OTP handlers
  const handleDigitChange = (text: string, index: number) => {
    if (text.length > 1) {
      const pasted = text.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const next = Array(OTP_LENGTH).fill('');
      pasted.forEach((d, i) => { next[i] = d; });
      setDigits(next);
      inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
      return;
    }
    const clean = text.replace(/\D/g, '');
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const onSubmit = async () => {
    const otp = digits.join('');
    if (!email || otp.length < OTP_LENGTH || !newPassword) {
      Toast.show({ type: 'error', text1: 'All fields are required' });
      return;
    }
    if (newPassword.length < 6) {
      Toast.show({ type: 'error', text1: 'Password must be at least 6 characters' });
      return;
    }
    try {
      setLoading(true);
      await resetPassword({ email: email.trim().toLowerCase(), otp, newPassword });
      Toast.show({
        type: 'success',
        text1: 'Password updated',
        text2: 'You can now log in with your new password.',
      });
      router.replace('/login');
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Failed to reset password';
      Toast.show({ type: 'error', text1: message });
    } finally {
      setLoading(false);
    }
  };

  const filledDigits = digits.filter(Boolean).length;
  const strength = getStrength(newPassword);
  const isReady = filledDigits === OTP_LENGTH && newPassword.length >= 6 && !!email;

  const handlePasswordFocus = () => {
    setPwFocused(true);
    // Give the keyboard time to start appearing, then scroll the field into view
    setTimeout(() => {
      passwordFieldRef.current?.measureInWindow((x, y) => {
        scrollRef.current?.scrollToPosition(0, y - 120, true);
      });
    }, 100);
  };

  return (
    <View style={styles.root}>
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />

      <KeyboardAwareScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={Platform.OS === 'ios' ? 24 : 80}
        enableAutomaticScroll
      >
        {/* Logo row */}
        <View style={styles.logoArea}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color={TEXT_MUTED} />
          </TouchableOpacity>
          <View style={styles.logoMark}>
            <View style={styles.logoInner} />
          </View>
          <Text style={styles.logoText}>FRAGHUB</Text>
        </View>

        {/* Step indicator */}
        <View style={styles.stepsRow}>
          <StepPill number={1} label="Enter email" done />
          <View style={styles.stepConnector} />
          <StepPill number={2} label="Get code" active />
          <View style={styles.stepConnector} />
          <StepPill number={3} label="New password" active />
        </View>

        {/* Floating lock icon */}
        <View style={styles.iconArea}>
          <Animated.View style={{ transform: [{ translateY: floatY }] }}>
            <View style={styles.iconRing}>
              <LinearGradient colors={['#1C2C10', '#0F1521']} style={styles.iconGradient}>
                <Ionicons name="lock-open" size={36} color={ACCENT} />
              </LinearGradient>
            </View>
          </Animated.View>
          <View style={styles.orbitDot1} />
          <View style={styles.orbitDot2} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Choose a new{'\n'}password.</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code from your email, then set a fresh password.
          </Text>
        </View>

        {/* Email (if not prefilled) */}
        {!emailParam && (
          <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused, { marginBottom: 20 }]}>
            <Ionicons name="mail-outline" size={16} color={emailFocused ? ACCENT : TEXT_MUTED} style={styles.inputIcon} />
            <TextInput
              label="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              cursorColor={ACCENT}
              selectionColor="rgba(200, 241, 53, 0.4)"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              style={styles.input}
              theme={{
                colors: { primary: ACCENT, onSurfaceVariant: TEXT_MUTED, onSurface: TEXT_PRIMARY, surface: 'transparent', background: 'transparent' },
              }}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              textColor={TEXT_PRIMARY}
            />
          </View>
        )}

        {/* Section label */}
        <View style={styles.sectionLabel}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionText}>Reset code</Text>
        </View>

        {/* OTP digit boxes */}
        <View style={styles.otpRow}>
          {digits.map((digit, i) => {
            const isFocused = focusedOtp === i;
            const isFilled = !!digit;
            return (
              <View key={i} style={[styles.digitBox, isFocused && styles.digitBoxFocused, isFilled && !isFocused && styles.digitBoxFilled]}>
                {isFocused && (
                  <LinearGradient
                    colors={['rgba(200,241,53,0.08)', 'transparent']}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <RNTextInput
                  ref={(ref) => { inputRefs.current[i] = ref; }}
                  value={digit}
                  onChangeText={(t) => handleDigitChange(t, i)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                  onFocus={() => setFocusedOtp(i)}
                  onBlur={() => setFocusedOtp(null)}
                  keyboardType="number-pad"
                  maxLength={OTP_LENGTH}
                  style={[styles.digitInput, isFilled && styles.digitInputFilled, isFocused && styles.digitInputFocused]}
                  caretHidden
                  selectTextOnFocus
                />
              </View>
            );
          })}
        </View>

        {/* OTP progress */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(filledDigits / OTP_LENGTH) * 100}%` }]} />
        </View>
        <Text style={styles.progressLabel}>
          {filledDigits === OTP_LENGTH ? '✓ Code complete' : `${filledDigits} of ${OTP_LENGTH} digits`}
        </Text>

        {/* Section label */}
        <View ref={passwordFieldRef} style={[styles.sectionLabel, { marginTop: 24 }]}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionText}>New password</Text>
        </View>

        {/* Password field */}
        <View style={[styles.inputWrapper, pwFocused && styles.inputWrapperFocused]}>
          <Ionicons name="lock-closed-outline" size={16} color={pwFocused ? ACCENT : TEXT_MUTED} style={styles.inputIcon} />
          <TextInput
            label="New password"
            value={newPassword}
            cursorColor={ACCENT}          
            selectionColor="rgba(200, 241, 53, 0.4)"
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword}
            onFocus={handlePasswordFocus}
            onBlur={() => setPwFocused(false)}
            style={styles.input}
            theme={{
              colors: { primary: ACCENT, onSurfaceVariant: TEXT_MUTED, onSurface: TEXT_PRIMARY, surface: 'transparent', background: 'transparent' },
            }}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            textColor={TEXT_PRIMARY}
          />
          <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={TEXT_MUTED} />
          </TouchableOpacity>
        </View>

        {/* Strength meter */}
        {newPassword.length > 0 && (
          <View style={styles.strengthArea}>
            <View style={styles.strengthBars}>
              {[1, 2, 3, 4].map((n) => (
                <View
                  key={n}
                  style={[
                    styles.strengthBar,
                    { backgroundColor: n <= strength.score ? strength.color : BORDER },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
          </View>
        )}

        {/* Password rules */}
        <View style={styles.rulesRow}>
          <Rule met={newPassword.length >= 6} text="6+ characters" />
          <Rule met={/[A-Z]/.test(newPassword)} text="Uppercase" />
          <Rule met={/[0-9]/.test(newPassword)} text="Number" />
          <Rule met={/[^A-Za-z0-9]/.test(newPassword)} text="Symbol" />
        </View>

        {/* Submit */}
        <Animated.View style={{ transform: [{ scale: buttonScale }], marginTop: 28 }}>
          <Pressable onPress={onSubmit} onPressIn={onPressIn} onPressOut={onPressOut} disabled={loading}>
            <LinearGradient
              colors={
                loading ? ['#3A4A1A', '#2A3A12']
                  : isReady ? ['#C8F135', '#96B827']
                    : ['#1C2535', '#1C2535']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButton}
            >
              {loading ? (
                <Text style={[styles.submitLabel, { color: TEXT_MUTED }]}>Updating…</Text>
              ) : (
                <>
                  <Text style={[styles.submitLabel, { color: isReady ? '#080C14' : TEXT_MUTED }]}>
                    Update password
                  </Text>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={isReady ? '#080C14' : TEXT_MUTED}
                    style={{ marginLeft: 8 }}
                  />
                </>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Footer */}
        <TouchableOpacity onPress={() => router.replace('/login')} style={styles.footer}>
          <Ionicons name="arrow-back-outline" size={13} color={TEXT_MUTED} />
          <Text style={styles.footerText}>Back to login</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
}

// ── Rule chip ─────────────────────────────────────────────
function Rule({ met, text }: { met: boolean; text: string }) {
  return (
    <View style={[rStyles.chip, met && rStyles.chipMet]}>
      <Ionicons name={met ? 'checkmark' : 'remove'} size={10} color={met ? '#080C14' : TEXT_MUTED} />
      <Text style={[rStyles.label, met && rStyles.labelMet]}>{text}</Text>
    </View>
  );
}

const rStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipMet: { backgroundColor: '#1C2C10', borderColor: ACCENT },
  label: { fontSize: 10, color: TEXT_MUTED, fontWeight: '500' },
  labelMet: { color: ACCENT },
});

// ── StepPill ──────────────────────────────────────────────
function StepPill({ number, label, active, done }: { number: number; label: string; active?: boolean; done?: boolean }) {
  return (
    <View style={spStyles.wrapper}>
      <View style={[spStyles.dot, active && spStyles.dotActive, done && spStyles.dotDone]}>
        {done
          ? <Ionicons name="checkmark" size={11} color={BG} />
          : <Text style={[spStyles.num, active && spStyles.numActive]}>{number}</Text>
        }
      </View>
      <Text style={[spStyles.label, (active || done) && spStyles.labelActive]}>{label}</Text>
    </View>
  );
}

const spStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 4 },
  dot: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: SURFACE, borderWidth: 1.5, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  dotActive: { backgroundColor: '#1C2C10', borderColor: ACCENT },
  dotDone: { backgroundColor: ACCENT, borderColor: ACCENT },
  num: { fontSize: 11, fontWeight: '700', color: TEXT_MUTED },
  numActive: { color: ACCENT },
  label: { fontSize: 10, color: TEXT_MUTED, letterSpacing: 0.2 },
  labelActive: { color: TEXT_PRIMARY },
});

// ── Main styles ───────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  glowTop: {
    position: 'absolute', top: -60, right: -80,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: ACCENT, opacity: 0.04,
  },
  glowBottom: {
    position: 'absolute', bottom: -100, left: -80,
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: '#1A6EFF', opacity: 0.05,
  },
  scroll: { paddingHorizontal: 24, paddingTop: 72, paddingBottom: 48 },
  // Logo
  logoArea: { flexDirection: 'row', alignItems: 'center', marginBottom: 28, gap: 10 },
  backButton: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: SURFACE, borderWidth: 1.5, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center', marginRight: 4,
  },
  logoMark: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: ACCENT,
    alignItems: 'center', justifyContent: 'center',
  },
  logoInner: { width: 10, height: 10, borderRadius: 3, backgroundColor: BG },
  logoText: { color: TEXT_PRIMARY, fontSize: 16, fontWeight: '800', letterSpacing: 4 },
  // Steps
  stepsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  stepConnector: { flex: 1, height: 1, backgroundColor: BORDER, marginHorizontal: 8, marginBottom: 14 },
  // Icon
  iconArea: { alignItems: 'center', justifyContent: 'center', height: 100, marginBottom: 24 },
  iconRing: {
    width: 84, height: 84, borderRadius: 22,
    borderWidth: 1.5, borderColor: '#1C2C10', overflow: 'hidden',
  },
  iconGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  orbitDot1: {
    position: 'absolute', top: 8, right: 52,
    width: 7, height: 7, borderRadius: 4, backgroundColor: ACCENT, opacity: 0.45,
  },
  orbitDot2: {
    position: 'absolute', bottom: 10, left: 50,
    width: 5, height: 5, borderRadius: 3, backgroundColor: '#1A6EFF', opacity: 0.4,
  },
  // Header
  header: { marginBottom: 24 },
  title: { fontSize: 36, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.8, lineHeight: 40 },
  subtitle: { marginTop: 10, fontSize: 14, color: TEXT_MUTED, lineHeight: 20 },
  // Section label
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT },
  sectionText: { fontSize: 11, color: TEXT_MUTED, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  // OTP
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  digitBox: {
    flex: 1, aspectRatio: 0.85, borderRadius: 14,
    backgroundColor: SURFACE, borderWidth: 1.5, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  digitBoxFocused: {
    borderColor: ACCENT,
    shadowColor: ACCENT, shadowOpacity: 0.22, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 6,
  },
  digitBoxFilled: { borderColor: '#2A3C10', backgroundColor: '#0F1A08' },
  digitInput: { width: '100%', height: '100%', textAlign: 'center', fontSize: 22, fontWeight: '700', color: TEXT_MUTED },
  digitInputFilled: { color: ACCENT },
  digitInputFocused: { color: TEXT_PRIMARY },
  // Progress
  progressTrack: { marginTop: 14, height: 2, backgroundColor: BORDER, borderRadius: 1, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: ACCENT, borderRadius: 1 },
  progressLabel: { marginTop: 6, fontSize: 11, color: TEXT_MUTED, textAlign: 'right', letterSpacing: 0.3 },
  // Input shared
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER,
    paddingLeft: 14, overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderColor: ACCENT,
    shadowColor: ACCENT, shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4,
  },
  inputIcon: { marginRight: 4 },
  input: { flex: 1, backgroundColor: 'transparent', fontSize: 15 },
  eyeButton: { padding: 14 },
  // Strength
  strengthArea: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 },
  strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3, minWidth: 40, textAlign: 'right' },
  // Rules
  rulesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  // Submit
  submitButton: {
    borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  submitLabel: { fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },
  // Footer
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 28 },
  footerText: { fontSize: 13, color: TEXT_MUTED, fontWeight: '500' },
});