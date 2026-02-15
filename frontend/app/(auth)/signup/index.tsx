import React, { useState } from 'react';
import {
    View,
    Text,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { authService } from '../../../services/auth.service';
import styles from './styles';

export default function SignupScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<'player' | 'organisation'>('player');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{
        email?: string;
        password?: string;
        confirmPassword?: string;
    }>({});

    const getPasswordStrength = (pass: string) => {
        if (pass.length === 0) return { strength: 0, text: '', color: '#6B7280' };
        if (pass.length < 6) return { strength: 1, text: 'Weak', color: '#EF4444' };
        if (pass.length < 10) return { strength: 2, text: 'Medium', color: '#F59E0B' };
        return { strength: 3, text: 'Strong', color: '#10B981' };
    };

    const passwordStrength = getPasswordStrength(password);

    const validate = () => {
        const newErrors: {
            email?: string;
            password?: string;
            confirmPassword?: string;
        } = {};

        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSignup = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            await authService.signup({ email, password, role });
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Account created! Please check your email for OTP.',
            });
            router.push({
                pathname: '/(auth)/verify-otp',
                params: { email },
            });
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Signup Failed',
                text2: error.response?.data?.message || 'Something went wrong. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={['#0F172A', '#1E293B', '#0F172A']} style={styles.gradient}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join FragHub and start gaming</Text>
                    </View>

                    <View style={styles.form}>
                        <Input
                            label="Email"
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                setErrors({ ...errors, email: undefined });
                            }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            icon="mail"
                            error={errors.email}
                        />

                        <View style={styles.roleContainer}>
                            <Text style={styles.roleLabel}>I am a</Text>
                            <View style={styles.roleSelector}>
                                <TouchableOpacity
                                    style={[
                                        styles.roleButton,
                                        role === 'player' && styles.roleButtonActive,
                                    ]}
                                    onPress={() => setRole('player')}
                                >
                                    <Text
                                        style={[
                                            styles.roleButtonText,
                                            role === 'player' && styles.roleButtonTextActive,
                                        ]}
                                    >
                                        Player
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.roleButton,
                                        role === 'organisation' && styles.roleButtonActive,
                                    ]}
                                    onPress={() => setRole('organisation')}
                                >
                                    <Text
                                        style={[
                                            styles.roleButtonText,
                                            role === 'organisation' && styles.roleButtonTextActive,
                                        ]}
                                    >
                                        Organisation
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <Input
                            label="Password"
                            placeholder="Create a password"
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                setErrors({ ...errors, password: undefined });
                            }}
                            secureTextEntry
                            icon="lock-closed"
                            error={errors.password}
                        />

                        {password.length > 0 && (
                            <View style={styles.strengthContainer}>
                                <View style={styles.strengthBars}>
                                    {[1, 2, 3].map((bar) => (
                                        <View
                                            key={bar}
                                            style={[
                                                styles.strengthBar,
                                                bar <= passwordStrength.strength && {
                                                    backgroundColor: passwordStrength.color,
                                                },
                                            ]}
                                        />
                                    ))}
                                </View>
                                <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                                    {passwordStrength.text}
                                </Text>
                            </View>
                        )}

                        <Input
                            label="Confirm Password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChangeText={(text) => {
                                setConfirmPassword(text);
                                setErrors({ ...errors, confirmPassword: undefined });
                            }}
                            secureTextEntry
                            icon="lock-closed"
                            error={errors.confirmPassword}
                        />

                        <Button
                            title="Create Account"
                            onPress={handleSignup}
                            loading={loading}
                            style={styles.signupButton}
                        />

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                                <Text style={styles.loginLink}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}
