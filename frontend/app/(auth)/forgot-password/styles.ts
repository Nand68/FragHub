import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 100,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 50,
    },
    title: {
        fontSize: 36,
        fontWeight: '700',
        color: '#F9FAFB',
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#9CA3AF',
        letterSpacing: 0.2,
        lineHeight: 24,
    },
    form: {
        flex: 1,
    },
    sendButton: {
        marginTop: 16,
    },
    backContainer: {
        marginTop: 32,
        alignItems: 'center',
    },
    backText: {
        color: '#9CA3AF',
        fontSize: 15,
        fontWeight: '600',
    },
});
