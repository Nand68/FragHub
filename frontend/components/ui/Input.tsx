import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    icon?: keyof typeof Ionicons.glyphMap;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    icon,
    secureTextEntry,
    ...props
}) => {
    const [isSecure, setIsSecure] = useState(secureTextEntry);

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[styles.inputContainer, error && styles.inputError]}>
                {icon && (
                    <Ionicons name={icon} size={20} color="#9CA3AF" style={styles.icon} />
                )}
                <TextInput
                    {...props}
                    secureTextEntry={isSecure}
                    style={styles.input}
                    placeholderTextColor="#6B7280"
                />
                {secureTextEntry && (
                    <TouchableOpacity
                        onPress={() => setIsSecure(!isSecure)}
                        style={styles.eyeIcon}
                    >
                        <Ionicons
                            name={isSecure ? 'eye-off' : 'eye'}
                            size={20}
                            color="#9CA3AF"
                        />
                    </TouchableOpacity>
                )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F9FAFB',
        marginBottom: 8,
        letterSpacing: 0.3,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 16,
        height: 56,
    },
    inputError: {
        borderColor: '#EF4444',
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#F9FAFB',
        letterSpacing: 0.3,
    },
    eyeIcon: {
        padding: 4,
    },
    errorText: {
        fontSize: 13,
        color: '#EF4444',
        marginTop: 6,
        marginLeft: 4,
    },
});
