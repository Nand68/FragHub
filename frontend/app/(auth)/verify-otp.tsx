import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  TextInput as RNTextInput,
} from 'react-native';
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

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const { verifyOtp } = useAuth();

  const [email, setEmail] = useState(emailParam ?? '');
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);

  const inputRefs = useRef<(RNTextInput | null)[]>([]);
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Pulse animation on the shield icon
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const onPressIn = () =>
    Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () =>
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  const handleDigitChange = (text: string, index: number) => {
    // Handle paste of full OTP
    if (text.length > 1) {
      const pasted = text.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const next = Array(OTP_LENGTH).fill('');
      pasted.forEach((d, i) => { next[i] = d; });
      setDigits(next);
      const focusTarget = Math.min(pasted.length, OTP_LENGTH - 1);
      inputRefs.current[focusTarget]?.focus();
      return;
    }

    const clean = text.replace(/\D/g, '');
    const next = [...digits];
    next[index] = clean;
    setDigits(next);

    if (clean && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
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
    if (!email || otp.length < OTP_LENGTH) {
      Toast.show({ type: 'error', text1: 'Enter your email and the 6-digit code' });
      return;
    }
    try {
      setLoading(true);
      await verifyOtp({ email: email.trim().toLowerCase(), otp });
      Toast.show({
        type: 'success',
        text1: 'Email verified',
        text2: 'You can now log in to your account.',
      });
      router.replace('/login');
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Failed to verify OTP';
      Toast.show({ type: 'error', text1: message });
    } finally {
      setLoading(false);
    }
  };

  const filledCount = digits.filter(Boolean).length;
  const progress = filledCount / OTP_LENGTH;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Background glows */}
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoMark}>
            <View style={styles.logoInner} />
          </View>
          <Text style={styles.logoText}>FRAGHUB</Text>
        </View>

        {/* Shield icon with pulse */}
        <View style={styles.iconArea}>
          <Animated.View style={[styles.iconRing, { transform: [{ scale: pulse }] }]}>
            <LinearGradient
              colors={['#1C2C10', '#0F1521']}
              style={styles.iconGradient}
            >
              <Ionicons name="shield-checkmark" size={36} color={ACCENT} />
            </LinearGradient>
          </Animated.View>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Check your{'\n'}inbox.</Text>

          <Text style={styles.subtitle}>
            We sent a 6-digit code to
          </Text>

          {emailParam ? (
            <Text
              style={styles.emailHighlight}
              numberOfLines={2}
              ellipsizeMode="middle"
            >
              {emailParam}
            </Text>
          ) : (
            <Text style={styles.subtitle}>your email address.</Text>
          )}
        </View>

        {/* OTP Digit Boxes */}
        <View style={styles.otpRow}>
          {digits.map((digit, i) => {
            const isFocused = focusedIndex === i;
            const isFilled = !!digit;
            return (
              <View
                key={i}
                style={[
                  styles.digitBox,
                  isFocused && styles.digitBoxFocused,
                  isFilled && !isFocused && styles.digitBoxFilled,
                ]}
              >
                {isFocused && (
                  <LinearGradient
                    colors={['rgba(200,241,53,0.08)', 'transparent']}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <RNTextInput
                  ref={(ref) => { inputRefs.current[i] = ref; }}
                  value={digit}
                  onChangeText={(text) => handleDigitChange(text, i)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                  onFocus={() => setFocusedIndex(i)}
                  onBlur={() => setFocusedIndex(null)}
                  keyboardType="number-pad"
                  maxLength={OTP_LENGTH} // allows paste
                  style={[
                    styles.digitInput,
                    isFilled && styles.digitInputFilled,
                    isFocused && styles.digitInputFocused,
                  ]}
                  caretHidden
                  selectTextOnFocus
                />
              </View>
            );
          })}
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressLabel}>
          {filledCount === OTP_LENGTH ? 'Code complete' : `${filledCount} of ${OTP_LENGTH} digits`}
        </Text>

        {/* Email field (editable if no param) */}
        {!emailParam && (
          <View style={[iStyles.wrapper, emailFocused && iStyles.wrapperFocused, { marginTop: 24 }]}>
            <Ionicons
              name="mail-outline"
              size={16}
              color={emailFocused ? ACCENT : TEXT_MUTED}
              style={iStyles.leftIcon}
            />
            <TextInput
              label="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              style={iStyles.input}
              theme={{
                colors: {
                  primary: ACCENT,
                  onSurfaceVariant: TEXT_MUTED,
                  onSurface: TEXT_PRIMARY,
                  surface: 'transparent',
                  background: 'transparent',
                },
              }}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              textColor={TEXT_PRIMARY}
            />
          </View>
        )}

        {/* Submit */}
        <Animated.View style={{ transform: [{ scale: buttonScale }], marginTop: 32 }}>
          <Pressable
            onPress={onSubmit}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            disabled={loading}
          >
            <LinearGradient
              colors={
                loading
                  ? ['#3A4A1A', '#2A3A12']
                  : filledCount === OTP_LENGTH
                    ? ['#C8F135', '#96B827']
                    : ['#1C2535', '#1C2535']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButton}
            >
              {loading ? (
                <Text style={[styles.submitLabel, { color: TEXT_MUTED }]}>Verifying…</Text>
              ) : (
                <>
                  <Text
                    style={[
                      styles.submitLabel,
                      { color: filledCount === OTP_LENGTH ? '#080C14' : TEXT_MUTED },
                    ]}
                  >
                    Verify email
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={filledCount === OTP_LENGTH ? '#080C14' : TEXT_MUTED}
                    style={{ marginLeft: 8 }}
                  />
                </>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Resend + back */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.footerLink}>
            <Ionicons name="chevron-back" size={13} color={TEXT_MUTED} />
            <Text style={styles.footerLinkText}>Go back</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.footerLink}>
            <Ionicons name="refresh-outline" size={13} color={ACCENT} />
            <Text style={[styles.footerLinkText, { color: ACCENT }]}>Resend code</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── InputField wrapper styles (shared pattern) ────────────
const iStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingLeft: 14,
    overflow: 'hidden',
  },
  wrapperFocused: {
    borderColor: ACCENT,
    shadowColor: ACCENT,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  leftIcon: { marginRight: 4 },
  input: { flex: 1, backgroundColor: 'transparent', fontSize: 15 },
});

// ── Main styles ───────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  glowTop: {
    position: 'absolute',
    top: -60,
    left: '50%',
    marginLeft: -160,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: ACCENT,
    opacity: 0.04,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -120,
    right: -100,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: '#1A6EFF',
    opacity: 0.05,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 48,
  },
  // Logo
  logoArea: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: ACCENT,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInner: { width: 10, height: 10, borderRadius: 3, backgroundColor: BG },
  logoText: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 4,
  },
  // Shield icon
  iconArea: { alignItems: 'center', marginBottom: 32 },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#1C2C10',
    overflow: 'hidden',
  },
  iconGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Header
  header: { marginBottom: 36, alignItems: 'center' },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: -0.8,
    lineHeight: 42,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 20,
  },
  emailHighlight: {
    color: ACCENT,
    fontWeight: '600',
  },
  // OTP row
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  digitBox: {
    flex: 1,
    aspectRatio: 0.85,
    borderRadius: 14,
    backgroundColor: SURFACE,
    borderWidth: 1.5,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  digitBoxFocused: {
    borderColor: ACCENT,
    shadowColor: ACCENT,
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  digitBoxFilled: {
    borderColor: '#2A3C10',
    backgroundColor: '#0F1A08',
  },
  digitInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_MUTED,
  },
  digitInputFilled: {
    color: ACCENT,
  },
  digitInputFocused: {
    color: TEXT_PRIMARY,
  },
  // Progress
  progressTrack: {
    marginTop: 16,
    height: 2,
    backgroundColor: BORDER,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ACCENT,
    borderRadius: 1,
  },
  progressLabel: {
    marginTop: 8,
    fontSize: 11,
    color: TEXT_MUTED,
    textAlign: 'right',
    letterSpacing: 0.3,
  },
  // Submit
  submitButton: {
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitLabel: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28,
    paddingHorizontal: 4,
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerLinkText: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
});