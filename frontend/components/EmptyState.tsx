import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../constants/theme';

type EmptyStateProps = {
  message: string;
  subtext?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  message,
  subtext,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="inbox"
        size={48}
        color={colors.textMuted}
      />
      <Text variant="bodyLarge" style={styles.message}>
        {message}
      </Text>
      {subtext && (
        <Text variant="bodySmall" style={styles.subtext}>
          {subtext}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button mode="outlined" onPress={onAction} style={styles.button}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  message: {
    color: colors.textMuted,
    marginTop: 16,
    textAlign: 'center',
  },
  subtext: {
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.8,
  },
  button: {
    marginTop: 16,
    borderRadius: 999,
    borderColor: colors.border,
  },
});
