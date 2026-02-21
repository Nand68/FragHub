import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const ACCENT = '#C8F135';
const BG = '#080C14';
const SURFACE = '#0F1521';
const BORDER = '#1C2535';
const TEXT_PRIMARY = '#F0F4FF';
const TEXT_MUTED = '#5A6A82';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { requestReset } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [sent, setSent] = useState(false);

  const buttonScale = useRef(new Animated.Value(1)).current;

  // Floating key animation
  const floatY = useRef(new Animated.Value(0)).current;
  const floatRotate = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(floatY, { toValue: -8, duration: 1800, useNativeDriver: true }),
          Animated.timing(floatY, { toValue: 0, duration: 1800, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(floatRotate, { toValue: 1, duration: 3600, useNativeDriver: true }),
          Animated.timing(floatRotate, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  const rotation = floatRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-6deg', '6deg'],
  });

  const onPressIn = () =>
    Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () =>
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  const onSubmit = async () => {
    if (!email) {
      Toast.show({ type: 'error', text1: 'Email is required' });
      return;
    }
    try {
      setLoading(true);
      await requestReset({ email: email.trim().toLowerCase() });
      setSent(true);
      Toast.show({
        type: 'success',
        text1: 'OTP sent',
        text2: 'Check your email to reset your password.',
      });
      router.push({
        pathname: '/reset-password',
        params: { email: email.trim().toLowerCase() },
      });
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Failed to send reset OTP';
      Toast.show({ type: 'error', text1: message });
    } finally {
      setLoading(false);
    }
  };

  const isValid = email.includes('@') && email.includes('.');

  return (
    <KeyboardAwareScrollView
      style={styles.root}
      contentContainerStyle={{ flexGrow: 1 }}
      enableOnAndroid={true}
      extraScrollHeight={20}
      keyboardShouldPersistTaps="handled"
    >

      {/* Background glows */}
      < View style={styles.glowCenter} pointerEvents="none" />
      <View style={styles.glowBottomLeft} pointerEvents="none" />

      <View style={styles.scroll}>
        {/* Logo */}
        <View style={styles.logoArea}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color={TEXT_MUTED} />
          </TouchableOpacity>
          <View style={styles.logoMark}>
            <View style={styles.logoInner} />
          </View>
          <Text style={styles.logoText}>FRAGHUB</Text>
        </View>

        {/* Floating key icon */}
        <View style={styles.iconArea}>
          <Animated.View style={{ transform: [{ translateY: floatY }, { rotate: rotation }] }}>
            <View style={styles.iconRing}>
              <LinearGradient
                colors={['#1C2C10', '#0F1521']}
                style={styles.iconGradient}
              >
                <Ionicons name="key" size={38} color={ACCENT} />
              </LinearGradient>
            </View>
          </Animated.View>

          {/* Orbit dots */}
          <View style={styles.orbitDot1} />
          <View style={styles.orbitDot2} />
          <View style={styles.orbitDot3} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Forgot your{'\n'}password?</Text>
          <Text style={styles.subtitle}>
            No worries. Enter your email and we'll send a reset code right away.
          </Text>
        </View>

        {/* Steps hint */}
        <View style={styles.stepsRow}>
          <StepPill number={1} label="Enter email" active />
          <View style={styles.stepConnector} />
          <StepPill number={2} label="Get code" active={false} />
          <View style={styles.stepConnector} />
          <StepPill number={3} label="New password" active={false} />
        </View>

        {/* Email field */}
        <View style={[styles.inputWrapper, focused && styles.inputWrapperFocused]}>
          <Ionicons
            name="mail-outline"
            size={16}
            color={focused ? ACCENT : TEXT_MUTED}
            style={styles.inputIcon}
          />
          <TextInput
            label="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            cursorColor={ACCENT}
            selectionColor="rgba(200, 241, 53, 0.4)"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={styles.input}
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
          {isValid && (
            <View style={styles.validBadge}>
              <Ionicons name="checkmark" size={12} color={BG} />
            </View>
          )}
        </View>

        {/* Submit */}
        <Animated.View style={{ transform: [{ scale: buttonScale }], marginTop: 20 }}>
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
                  : isValid
                    ? ['#C8F135', '#96B827']
                    : ['#1C2535', '#1C2535']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButton}
            >
              {loading ? (
                <Text style={[styles.submitLabel, { color: TEXT_MUTED }]}>Sending…</Text>
              ) : (
                <>
                  <Text
                    style={[
                      styles.submitLabel,
                      { color: isValid ? '#080C14' : TEXT_MUTED },
                    ]}
                  >
                    Send reset code
                  </Text>
                  <Ionicons
                    name="send"
                    size={16}
                    color={isValid ? '#080C14' : TEXT_MUTED}
                    style={{ marginLeft: 8 }}
                  />
                </>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.push('/login')} style={styles.footerLink}>
            <Ionicons name="arrow-back-outline" size={13} color={TEXT_MUTED} />
            <Text style={styles.footerLinkText}>Back to login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/signup')} style={styles.footerLink}>
            <Text style={[styles.footerLinkText, { color: ACCENT }]}>Create account</Text>
            <Ionicons name="chevron-forward" size={13} color={ACCENT} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAwareScrollView >
  );
}

// ── StepPill ──────────────────────────────────────────────
function StepPill({ number, label, active }: { number: number; label: string; active: boolean }) {
  return (
    <View style={spStyles.wrapper}>
      <View style={[spStyles.dot, active && spStyles.dotActive]}>
        <Text style={[spStyles.num, active && spStyles.numActive]}>{number}</Text>
      </View>
      <Text style={[spStyles.label, active && spStyles.labelActive]}>{label}</Text>
    </View>
  );
}

const spStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 4 },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: SURFACE,
    borderWidth: 1.5,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    backgroundColor: '#1C2C10',
    borderColor: ACCENT,
  },
  num: { fontSize: 11, fontWeight: '700', color: TEXT_MUTED },
  numActive: { color: ACCENT },
  label: { fontSize: 10, color: TEXT_MUTED, letterSpacing: 0.2 },
  labelActive: { color: TEXT_PRIMARY },
});

// ── Main styles ───────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  glowCenter: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    left: '20%',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: ACCENT,
    opacity: 0.04,
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -100,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#1A6EFF',
    opacity: 0.05,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 48,
  },
  // Logo + back
  logoArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 44,
    gap: 10,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: SURFACE,
    borderWidth: 1.5,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: ACCENT,
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
  // Icon
  iconArea: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 110,
    marginBottom: 28,
  },
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
  // Orbit decorative dots
  orbitDot1: {
    position: 'absolute',
    top: 10,
    right: 60,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: ACCENT,
    opacity: 0.5,
  },
  orbitDot2: {
    position: 'absolute',
    bottom: 14,
    left: 56,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: ACCENT,
    opacity: 0.3,
  },
  orbitDot3: {
    position: 'absolute',
    top: 30,
    left: 48,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1A6EFF',
    opacity: 0.4,
  },
  // Header
  header: { marginBottom: 28 },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: -0.8,
    lineHeight: 42,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
    color: TEXT_MUTED,
    lineHeight: 21,
  },
  // Steps
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  stepConnector: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER,
    marginHorizontal: 8,
    marginBottom: 14,
  },
  // Input
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingLeft: 14,
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderColor: ACCENT,
    shadowColor: ACCENT,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  inputIcon: { marginRight: 4 },
  input: { flex: 1, backgroundColor: 'transparent', fontSize: 15 },
  validBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
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