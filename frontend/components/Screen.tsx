import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  contentContainerStyle?: ViewStyle;
  style?: ViewStyle;
};

export function Screen({
  children,
  scroll = false,
  contentContainerStyle,
  style,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  const paddingStyle = {
    paddingTop: Math.max(insets.top + 24, 48),
    paddingBottom: insets.bottom + 24,
    paddingHorizontal: 20,
  };

  if (scroll) {
    return (
      <ScrollView
        style={[styles.base, style]}
        contentContainerStyle={[paddingStyle, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.base, paddingStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
