import React from 'react';
import { Stack } from 'expo-router';

export default function ScoutingStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#050811' },
        headerTintColor: '#e5e7eb',
        contentStyle: { backgroundColor: '#050811' },
      }}
    />
  );
}

