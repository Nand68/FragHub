import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        marginBottom: 24,
        paddingTop: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#F9FAFB',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#3B82F6',
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#D1D5DB',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        borderWidth: 1.5,
        borderColor: '#374151',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: '#F9FAFB',
    },
    textArea: {
        minHeight: 100,
        paddingTop: 14,
    },
    radioGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    radioButton: {
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        borderWidth: 1.5,
        borderColor: '#374151',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    radioButtonActive: {
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: '#3B82F6',
    },
    radioText: {
        fontSize: 14,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    radioTextActive: {
        color: '#3B82F6',
    },
    checkboxGroup: {
        gap: 8,
    },
    checkbox: {
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        borderWidth: 1.5,
        borderColor: '#374151',
        borderRadius: 10,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkboxActive: {
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderColor: '#3B82F6',
    },
    checkboxIcon: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#374151',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmark: {
        color: '#3B82F6',
        fontSize: 16,
        fontWeight: '700',
    },
    checkboxText: {
        fontSize: 14,
        color: '#9CA3AF',
        fontWeight: '500',
        flex: 1,
    },
    checkboxTextActive: {
        color: '#D1D5DB',
    },
    saveButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        marginTop: 24,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    bottomSpacer: {
        height: 40,
    },
});


export default styles;