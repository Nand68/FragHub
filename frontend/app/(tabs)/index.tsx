import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
    const { logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    return (
        <LinearGradient
            colors={['#0F172A', '#1E293B', '#0F172A']}
            style={styles.container}
        >
            <View style={styles.content}>
                <Text style={styles.title}>Welcome to FragHub!</Text>
                <Text style={styles.subtitle}>You're successfully logged in</Text>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
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
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#9CA3AF',
        marginBottom: 40,
        textAlign: 'center',
    },
    logoutButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#EF4444',
    },
    logoutText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '600',
    },
});
