import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
    return (
        <LinearGradient
            colors={['#0F172A', '#1E293B', '#0F172A']}
            style={styles.container}
        >
            <View style={styles.content}>
                <Text style={styles.title}>Profile</Text>
                <Text style={styles.subtitle}>Coming soon...</Text>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#F9FAFB',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#9CA3AF',
    },
});
