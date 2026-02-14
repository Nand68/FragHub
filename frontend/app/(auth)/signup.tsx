import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/auth.service';

export default function SignupScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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
            await authService.signup({ email, password });
            Alert.alert('Success', 'Account created! Please check your email for OTP.');
            router.push({
                pathname: '/(auth)/verify-otp',
                params: { email },
            });
        } catch (error: any) {
            Alert.alert(
                'Signup Failed',
                error.response?.data?.message || 'Something went wrong. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#0F172A', '#1E293B', '#0F172A']}
            style={styles.gradient}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join FragHub and start gaming</Text>
                    </View>

                    {/* Form */}
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

                        {/* Password Strength Indicator */}
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

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 80,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 40,
    },
    title: {
        fontSize: 36,
        fontWeight: '700',
        color: '#F9FAFB',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#9CA3AF',
        letterSpacing: 0.2,
    },
    form: {
        flex: 1,
    },
    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: -8,
        marginBottom: 16,
        gap: 12,
    },
    strengthBars: {
        flexDirection: 'row',
        gap: 4,
        flex: 1,
    },
    strengthBar: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    strengthText: {
        fontSize: 12,
        fontWeight: '600',
        minWidth: 60,
    },
    signupButton: {
        marginTop: 8,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 32,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    dividerText: {
        color: '#6B7280',
        fontSize: 14,
        marginHorizontal: 16,
        fontWeight: '500',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        color: '#9CA3AF',
        fontSize: 15,
    },
    loginLink: {
        color: '#8B5CF6',
        fontSize: 15,
        fontWeight: '700',
    },
});
