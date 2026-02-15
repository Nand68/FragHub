import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseToast, ErrorToast, BaseToastProps } from 'react-native-toast-message';

export const toastConfig = {
    success: (props: BaseToastProps) => (
        <BaseToast
            {...props}
            style={styles.successToast}
            contentContainerStyle={styles.contentContainer}
            text1Style={styles.text1}
            text2Style={styles.text2}
            text2NumberOfLines={3}
        />
    ),
    error: (props: BaseToastProps) => (
        <ErrorToast
            {...props}
            style={styles.errorToast}
            contentContainerStyle={styles.contentContainer}
            text1Style={styles.text1}
            text2Style={styles.text2}
            text2NumberOfLines={3}
        />
    ),
    info: (props: BaseToastProps) => (
        <BaseToast
            {...props}
            style={styles.infoToast}
            contentContainerStyle={styles.contentContainer}
            text1Style={styles.text1}
            text2Style={styles.text2}
            text2NumberOfLines={3}
        />
    ),
};

const styles = StyleSheet.create({
    successToast: {
        borderLeftColor: '#10B981',
        borderLeftWidth: 6,
        backgroundColor: 'rgba(30, 41, 59, 0.98)',
        borderRadius: 12,
        height: 'auto',
        minHeight: 70,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    errorToast: {
        borderLeftColor: '#EF4444',
        borderLeftWidth: 6,
        backgroundColor: 'rgba(30, 41, 59, 0.98)',
        borderRadius: 12,
        height: 'auto',
        minHeight: 70,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    infoToast: {
        borderLeftColor: '#8B5CF6',
        borderLeftWidth: 6,
        backgroundColor: 'rgba(30, 41, 59, 0.98)',
        borderRadius: 12,
        height: 'auto',
        minHeight: 70,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    contentContainer: {
        paddingHorizontal: 16,
    },
    text1: {
        fontSize: 16,
        fontWeight: '700',
        color: '#F9FAFB',
        marginBottom: 4,
    },
    text2: {
        fontSize: 14,
        fontWeight: '400',
        color: '#D1D5DB',
        lineHeight: 20,
    },
});
