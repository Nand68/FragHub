import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 80,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 40,
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
    email: {
        color: '#8B5CF6',
        fontWeight: '600',
    },
    form: {
        flex: 1,
    },
    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: -8,
        marginBottom: 16,
        gap: 12,
    },
    strengthBars: {
        flexDirection: 'row',
        gap: 4,
        flex: 1,
    },
    strengthBar: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    strengthText: {
        fontSize: 12,
        fontWeight: '600',
        minWidth: 60,
    },
    resetButton: {
        marginTop: 8,
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

export default styles;
