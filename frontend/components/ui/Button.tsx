import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
    textStyle,
}) => {
    const isDisabled = disabled || loading;

    if (variant === 'primary') {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={isDisabled}
                activeOpacity={0.8}
                style={[styles.container, style]}
            >
                <LinearGradient
                    colors={isDisabled ? ['#4B5563', '#374151'] : ['#8B5CF6', '#6366F1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <Text style={[styles.text, styles.primaryText, textStyle]}>
                            {title}
                        </Text>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    if (variant === 'outline') {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={isDisabled}
                activeOpacity={0.8}
                style={[styles.container, styles.outlineContainer, isDisabled && styles.disabled, style]}
            >
                {loading ? (
                    <ActivityIndicator color="#8B5CF6" size="small" />
                ) : (
                    <Text style={[styles.text, styles.outlineText, textStyle]}>
                        {title}
                    </Text>
                )}
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.8}
            style={[styles.container, styles.secondaryContainer, isDisabled && styles.disabled, style]}
        >
            {loading ? (
                <ActivityIndicator color="#E5E7EB" size="small" />
            ) : (
                <Text style={[styles.text, styles.secondaryText, textStyle]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 56,
        borderRadius: 12,
        overflow: 'hidden',
        marginVertical: 8,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    secondaryContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    outlineContainer: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: 'rgba(139, 92, 246, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabled: {
        opacity: 0.5,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    primaryText: {
        color: '#FFFFFF',
    },
    secondaryText: {
        color: '#E5E7EB',
    },
    outlineText: {
        color: '#8B5CF6',
    },
});
