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
import { useAuth, UserRole } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const ACCENT = '#C8F135';       // electric lime
const ACCENT_DIM = '#8FAF1A';
const BG = '#080C14';
const SURFACE = '#0F1521';
const BORDER = '#1C2535';
const TEXT_PRIMARY = '#F0F4FF';
const TEXT_MUTED = '#5A6A82';

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('PLAYER');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const buttonScale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  };
  const onPressOut = () => {
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
  };

  const onSubmit = async () => {
    if (!email || !password || !confirmPassword) {
      Toast.show({ type: 'error', text1: 'All fields are required' });
      return;
    }
    if (password.length < 6) {
      Toast.show({ type: 'error', text1: 'Password must be at least 6 characters' });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Passwords do not match' });
      return;
    }

    try {
      setLoading(true);
      await signup({ email: email.trim().toLowerCase(), password, role });
      Toast.show({
        type: 'success',
        text1: 'OTP sent',
        text2: 'Check your email to verify your account.',
      });
      router.push({
        pathname: '/verify-otp',
        params: { email: email.trim().toLowerCase() },
      });
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Failed to sign up';
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
      {/* Background glow */}
      <View style={styles.glowTopRight} pointerEvents="none" />
      <View style={styles.glowBottomLeft} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo mark */}
        <View style={styles.logoArea}>
          <View style={styles.logoMark}>
            <View style={styles.logoInner} />
          </View>
          <Text style={styles.logoText}>FRAGHUB</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Choose your role and start competing.</Text>
        </View>

        {/* Role Switcher */}
        <View style={styles.roleSwitcher}>
          {(['PLAYER', 'ORGANIZATION'] as UserRole[]).map((r) => {
            const active = role === r;
            return (
              <Pressable
                key={r}
                onPress={() => setRole(r)}
                style={[styles.roleButton, active && styles.roleButtonActive]}
              >
                {active && (
                  <LinearGradient
                    colors={['#C8F135', '#8FAF1A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <Ionicons
                  name={r === 'PLAYER' ? 'person' : 'business'}
                  size={14}
                  color={active ? '#080C14' : TEXT_MUTED}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.roleLabel, active && styles.roleLabelActive]}>
                  {r === 'PLAYER' ? 'Player' : 'Organization'}
                </Text>
              </Pressable>
            );
          })}
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
          <InputField
            label="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            icon="shield-checkmark-outline"
            focused={focusedField === 'confirm'}
            onFocus={() => setFocusedField('confirm')}
            onBlur={() => setFocusedField(null)}
            rightIcon={showConfirm ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowConfirm((v) => !v)}
          />
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
                <Text style={styles.submitLabel}>Creating account…</Text>
              ) : (
                <>
                  <Text style={styles.submitLabel}>Sign up</Text>
                  <Ionicons name="arrow-forward" size={18} color="#080C14" style={{ marginLeft: 8 }} />
                </>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>already a member?</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Login link */}
        <TouchableOpacity onPress={() => router.push('/login')} style={styles.loginLink}>
          <Text style={styles.loginLinkText}>Log in to your account</Text>
          <Ionicons name="chevron-forward" size={14} color={ACCENT} />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --------------- InputField sub-component ---------------
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
          colors: {
            primary: ACCENT,
            onSurfaceVariant: TEXT_MUTED,
            onSurface: TEXT_PRIMARY,
            surface: 'transparent',
            background: 'transparent',
          },
          fonts: {
            bodyLarge: { fontFamily: 'System', fontSize: 15 },
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
  leftIcon: {
    marginRight: 4,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: 15,
  },
  rightIcon: {
    padding: 14,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  glowTopRight: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: '#C8F135',
    opacity: 0.04,
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -140,
    left: -120,
    width: 380,
    height: 380,
    borderRadius: 190,
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
    marginBottom: 48,
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
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: TEXT_MUTED,
    letterSpacing: 0.1,
  },
  // Role switcher
  roleSwitcher: {
    flexDirection: 'row',
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  roleButtonActive: {
    // gradient fills via LinearGradient
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MUTED,
    letterSpacing: 0.3,
  },
  roleLabelActive: {
    color: '#080C14',
  },
  // Form
  form: {
    gap: 0,
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
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 36,
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
    textTransform: 'lowercase',
  },
  // Login
  loginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 4,
  },
  loginLinkText: {
    fontSize: 14,
    color: ACCENT,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});