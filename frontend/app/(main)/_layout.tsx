import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function MainLayout() {
  const { user } = useAuth();
  const isOrg = user?.role?.toLowerCase() === 'organization';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#020617',
          borderTopColor: '#1f2937',
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      {/* Hidden redirect — must be declared so Expo Router knows about it, but not shown */}
      <Tabs.Screen
        name="index"
        options={{ href: null }}
      />

      {/* Hidden screen — full player profile viewer */}
      <Tabs.Screen
        name="player-profile"
        options={{ href: null }}
      />

      {/* Shared tabs — visible to all roles */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="scouting"
        options={{
          title: 'Scouting',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="target-account" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bell-outline" color={color} size={size} />
          ),
        }}
      />

      {/* Organization-only tabs — hidden for players */}
      <Tabs.Screen
        name="applicants"
        options={
          isOrg
            ? {
              title: 'Applicants',
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="account-search-outline" color={color} size={size} />
              ),
            }
            : { href: null }
        }
      />
      <Tabs.Screen
        name="roster"
        options={
          isOrg
            ? {
              title: 'Roster',
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="account-group-outline" color={color} size={size} />
              ),
            }
            : { href: null }
        }
      />

      {/* Player-only tabs — hidden for organizations */}
      <Tabs.Screen
        name="applications"
        options={
          !isOrg
            ? {
              title: 'Applications',
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="clipboard-list-outline" color={color} size={size} />
              ),
            }
            : { href: null }
        }
      />
      <Tabs.Screen
        name="my-organization"
        options={
          !isOrg
            ? {
              title: 'My Team',
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="shield-account-outline" color={color} size={size} />
              ),
            }
            : { href: null }
        }
      />
      <Tabs.Screen
        name="profile"
        options={
          !isOrg
            ? {
              title: 'Profile',
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="account-circle-outline" color={color} size={size} />
              ),
            }
            : { href: null }
        }
      />
    </Tabs>
  );
}
