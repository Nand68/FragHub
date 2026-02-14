import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { OTPInput } from '../../../components/ui/OTPInput';
import { Button } from '../../../components/ui/Button';
import { authService } from '../../../services/auth.service';
import { styles } from './styles';

export default function VerifyOTPScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const email = params.email as string;

    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [countdown]);

    useEffect(() => {
        if (otp.length === 6) {
            handleVerify();
        }
    }, [otp]);

    const handleVerify = async () => {
        if (otp.length !== 6) {
            setError('Please enter complete OTP');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await authService.verifyOTP({ email, otp });
            Alert.alert('Success', 'Email verified! Please login.', [
                { text: 'OK', onPress: () => router.replace('/(auth)/login') }
            ]);
        } catch (error: any) {
            setError(error.response?.data?.message || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResendLoading(true);
        setError('');
        try {
            await authService.resendOTP(email);
            Alert.alert('Success', 'OTP sent successfully!');
            setCountdown(60);
            setCanResend(false);
        } catch (error: any) {
            Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to resend OTP. Please try again.'
            );
        } finally {
            setResendLoading(false);
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
                        <Text style={styles.title}>Verify Email</Text>
                        <Text style={styles.subtitle}>
                            Enter the 6-digit code sent to{'\n'}
                            <Text style={styles.email}>{email}</Text>
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <OTPInput value={otp} onChange={setOtp} error={error} />

                        <Button
                            title="Verify OTP"
                            onPress={handleVerify}
                            loading={loading}
                            style={styles.verifyButton}
                        />

                        <View style={styles.resendContainer}>
                            {canResend ? (
                                <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
                                    <Text style={styles.resendText}>
                                        {resendLoading ? 'Sending...' : 'Resend OTP'}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <Text style={styles.countdownText}>
                                    Resend OTP in {countdown}s
                                </Text>
                            )}
                        </View>

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
