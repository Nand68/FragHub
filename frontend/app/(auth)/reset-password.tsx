import React, { useState, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { OTPInput } from '../../components/ui/OTPInput';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/auth.service';

export default function ResetPasswordScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const email = params.email as string;

    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{
        otp?: string;
        newPassword?: string;
        confirmPassword?: string;
    }>({});

    const getPasswordStrength = (pass: string) => {
        if (pass.length === 0) return { strength: 0, text: '', color: '#6B7280' };
        if (pass.length < 6) return { strength: 1, text: 'Weak', color: '#EF4444' };
        if (pass.length < 10) return { strength: 2, text: 'Medium', color: '#F59E0B' };
        return { strength: 3, text: 'Strong', color: '#10B981' };
    };

    const passwordStrength = getPasswordStrength(newPassword);

    const validate = () => {
        const newErrors: {
            otp?: string;
            newPassword?: string;
            confirmPassword?: string;
        } = {};

        if (otp.length !== 6) {
            newErrors.otp = 'Please enter complete OTP';
        }

        if (!newPassword) {
            newErrors.newPassword = 'Password is required';
        } else if (newPassword.length < 6) {
            newErrors.newPassword = 'Password must be at least 6 characters';
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleResetPassword = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            await authService.resetPassword({ email, otp, newPassword });
            Alert.alert('Success', 'Password reset successfully!', [
                { text: 'OK', onPress: () => router.replace('/(auth)/login') },
            ]);
        } catch (error: any) {
            Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to reset password. Please try again.'
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
                        <Text style={styles.title}>Reset Password</Text>
                        <Text style={styles.subtitle}>
                            Enter OTP and create a new password for{'\n'}
                            <Text style={styles.email}>{email}</Text>
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <OTPInput value={otp} onChange={setOtp} error={errors.otp} />

                        <Input
                            label="New Password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChangeText={(text) => {
                                setNewPassword(text);
                                setErrors({ ...errors, newPassword: undefined });
                            }}
                            secureTextEntry
                            icon="lock-closed"
                            error={errors.newPassword}
                        />

                        {/* Password Strength Indicator */}
                        {newPassword.length > 0 && (
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
                            placeholder="Confirm new password"
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
                            title="Reset Password"
                            onPress={handleResetPassword}
                            loading={loading}
                            style={styles.resetButton}
                        />

                        {/* Back */}
                        <View style={styles.backContainer}>
                            <TouchableOpacity onPress={() => router.back()}>
                                <Text style={styles.backText}>← Back</Text>
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
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#9CA3AF',
        letterSpacing: 0.2,
        lineHeight: 24,
    },
    email: {
        color: '#8B5CF6',
        fontWeight: '600',
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
    resetButton: {
        marginTop: 8,
    },
    backContainer: {
        marginTop: 32,
        alignItems: 'center',
    },
    backText: {
        color: '#9CA3AF',
        fontSize: 15,
        fontWeight: '600',
    },
});
