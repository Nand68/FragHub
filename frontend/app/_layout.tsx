import React from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import { paperDarkTheme } from '../constants/theme';
import { View, ActivityIndicator } from 'react-native';

function AuthGate() {
  const { user, initializing } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/welcome' as any);
    } else if (user && inAuthGroup) {
      router.replace('/home' as any);
    }
  }, [user, initializing, segments, router]);

  if (initializing) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#050811',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <PaperProvider theme={paperDarkTheme}>
      <AuthProvider>
        <SocketProvider>
          <StatusBar style="light" />
          <AuthGate />
          <Toast />
        </SocketProvider>
      </AuthProvider>
    </PaperProvider>
  );
}


