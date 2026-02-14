import React, { useRef, useEffect, useState } from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';

interface OTPInputProps {
    length?: number;
    value: string;
    onChange: (otp: string) => void;
    error?: string;
}

export const OTPInput: React.FC<OTPInputProps> = ({
    length = 6,
    value,
    onChange,
    error,
}) => {
    const inputRefs = useRef<(TextInput | null)[]>([]);
    const [otp, setOtp] = useState<string[]>(Array(length).fill(''));

    useEffect(() => {
        // Update local state when value prop changes
        if (value) {
            setOtp(value.split('').concat(Array(length - value.length).fill('')));
        }
    }, [value, length]);

    const handleChange = (text: string, index: number) => {
        // Only allow numbers
        if (text && !/^\d+$/.test(text)) return;

        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        // Call parent onChange
        onChange(newOtp.join(''));

        // Auto-focus next input
        if (text && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                {Array(length)
                    .fill(0)
                    .map((_, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => {
                                inputRefs.current[index] = ref;
                            }}
                            style={[
                                styles.input,
                                otp[index] && styles.inputFilled,
                                error && styles.inputError,
                            ]}
                            value={otp[index]}
                            onChangeText={(text) => handleChange(text, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            keyboardType="number-pad"
                            maxLength={1}
                            selectTextOnFocus
                            autoFocus={index === 0}
                        />
                    ))}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    input: {
        flex: 1,
        height: 60,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '600',
        color: '#F9FAFB',
    },
    inputFilled: {
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
    },
    inputError: {
        borderColor: '#EF4444',
    },
    errorText: {
        fontSize: 13,
        color: '#EF4444',
        marginTop: 8,
        textAlign: 'center',
    },
});
