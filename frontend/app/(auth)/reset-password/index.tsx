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
import { useRouter, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { OTPInput } from '../../../components/ui/OTPInput';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { authService } from '../../../services/auth.service';
import styles from './styles';

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
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Password reset successfully!',
            });
            setTimeout(() => router.replace('/(auth)/login'), 1500);
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || 'Failed to reset password. Please try again.',
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
                        <Text style={styles.title}>Reset Password</Text>
                        <Text style={styles.subtitle}>
                            Enter OTP and create a new password for{'\n'}
                            <Text style={styles.email}>{email}</Text>
                        </Text>
                    </View>

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
