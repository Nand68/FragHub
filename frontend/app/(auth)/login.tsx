import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
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

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const buttonScale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () =>
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  const onSubmit = async () => {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Email and password are required' });
      return;
    }
    try {
      setLoading(true);
      await login({ email: email.trim().toLowerCase(), password });
      Toast.show({ type: 'success', text1: 'Welcome back' });
      router.replace('/home' as any);
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Failed to log in';
      Toast.show({ type: 'error', text1: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Background glows */}
      <View style={styles.glowTopLeft} pointerEvents="none" />
      <View style={styles.glowBottomRight} pointerEvents="none" />

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

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome{'\n'}back.</Text>
          <Text style={styles.subtitle}>Sign in to continue competing.</Text>
        </View>

        {/* Fields */}
        <View style={styles.form}>
          <InputField
            label="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail-outline"
            focused={focusedField === 'email'}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
          />
          <InputField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            icon="lock-closed-outline"
            focused={focusedField === 'password'}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowPassword((v) => !v)}
          />

          {/* Forgot password */}
          <TouchableOpacity
            onPress={() => router.push('/forgot-password')}
            style={styles.forgotWrapper}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {/* Submit button */}
        <Animated.View style={{ transform: [{ scale: buttonScale }], marginTop: 28 }}>
          <Pressable
            onPress={onSubmit}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#3A4A1A', '#2A3A12'] : ['#C8F135', '#96B827']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButton}
            >
              {loading ? (
                <Text style={styles.submitLabel}>Signing in…</Text>
              ) : (
                <>
                  <Text style={styles.submitLabel}>Continue</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color="#080C14"
                    style={{ marginLeft: 8 }}
                  />
                </>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Stats strip — decorative social proof */}
        <View style={styles.statsStrip}>
          <StatPill icon="people-outline" label="12k+ players" />
          <View style={styles.statsDot} />
          <StatPill icon="trophy-outline" label="500+ tournaments" />
          <View style={styles.statsDot} />
          <StatPill icon="flash-outline" label="Live matches" />
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>new here?</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Signup link */}
        <TouchableOpacity
          onPress={() => router.push('/signup')}
          style={styles.signupLink}
        >
          <Text style={styles.signupLinkText}>Create an account</Text>
          <Ionicons name="chevron-forward" size={14} color={ACCENT} />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── StatPill ──────────────────────────────────────────────
function StatPill({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={pillStyles.wrapper}>
      <Ionicons name={icon as any} size={11} color={TEXT_MUTED} style={{ marginRight: 4 }} />
      <Text style={pillStyles.label}>{label}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    color: TEXT_MUTED,
    letterSpacing: 0.2,
  },
});

// ── InputField ────────────────────────────────────────────
type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  icon: string;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  rightIcon?: string;
  onRightIconPress?: () => void;
};

function InputField({
  label,
  value,
  onChangeText,
  icon,
  focused,
  onFocus,
  onBlur,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  rightIcon,
  onRightIconPress,
}: InputFieldProps) {
  return (
    <View style={[iStyles.wrapper, focused && iStyles.wrapperFocused]}>
      <Ionicons
        name={icon as any}
        size={16}
        color={focused ? ACCENT : TEXT_MUTED}
        style={iStyles.leftIcon}
      />
      <TextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={onFocus}
        cursorColor={ACCENT}          
        selectionColor="rgba(200, 241, 53, 0.4)"
        onBlur={onBlur}
        style={iStyles.input}
        theme={{
          dark: true,
          colors: {
            primary: ACCENT,
            onSurfaceVariant: TEXT_MUTED,
            onSurface: TEXT_PRIMARY,
            surface: SURFACE,
            background: SURFACE,
            surfaceVariant: SURFACE,
            outline: 'transparent',
          },
        }}
        underlineColor="transparent"
        activeUnderlineColor="transparent"
        textColor={TEXT_PRIMARY}
        placeholderTextColor={TEXT_MUTED}
      />
      {rightIcon && (
        <TouchableOpacity onPress={onRightIconPress} style={iStyles.rightIcon}>
          <Ionicons name={rightIcon as any} size={18} color={TEXT_MUTED} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const iStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    marginBottom: 12,
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
  rightIcon: { padding: 14 },
});

// ── Main styles ───────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  glowTopLeft: {
    position: 'absolute',
    top: -80,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#C8F135',
    opacity: 0.045,
  },
  glowBottomRight: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: '#1A6EFF',
    opacity: 0.05,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 48,
  },
  // Logo
  logoArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 56,
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: ACCENT,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInner: {
    width: 10,
    height: 10,
    borderRadius: 3,
    backgroundColor: BG,
  },
  logoText: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 4,
  },
  // Header
  header: {
    marginBottom: 36,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: -1,
    lineHeight: 46,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 15,
    color: TEXT_MUTED,
    letterSpacing: 0.1,
  },
  // Form
  form: {},
  forgotWrapper: {
    alignSelf: 'flex-end',
    marginTop: 2,
    marginBottom: 4,
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 13,
    color: ACCENT,
    fontWeight: '500',
    letterSpacing: 0.2,
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
    color: '#080C14',
    letterSpacing: 0.4,
  },
  // Stats strip
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    gap: 10,
  },
  statsDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: BORDER,
  },
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER,
  },
  dividerText: {
    fontSize: 12,
    color: TEXT_MUTED,
    letterSpacing: 0.5,
  },
  // Signup link
  signupLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 4,
  },
  signupLinkText: {
    fontSize: 14,
    color: ACCENT,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});