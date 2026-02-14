import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
    TextInput,
    StyleSheet,
} from 'react-native';

interface CountryDropdownProps {
    value: string;
    onSelect: (country: string) => void;
    countries: string[];
}

export default function CountryDropdown({ value, onSelect, countries }: CountryDropdownProps) {
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCountries = countries.filter(country =>
        country.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (country: string) => {
        onSelect(country);
        setModalVisible(false);
        setSearchQuery('');
    };

    return (
        <View>
            <TouchableOpacity
                style={styles.selector}
                onPress={() => setModalVisible(true)}
            >
                <Text style={[styles.selectorText, !value && styles.placeholder]}>
                    {value || 'Select your country'}
                </Text>
                <Text style={styles.arrow}>▼</Text>
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Country</Text>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search country..."
                            placeholderTextColor="#6B7280"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />

                        <FlatList
                            data={filteredCountries}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.countryItem,
                                        item === value && styles.countryItemSelected,
                                    ]}
                                    onPress={() => handleSelect(item)}
                                >
                                    <Text
                                        style={[
                                            styles.countryText,
                                            item === value && styles.countryTextSelected,
                                        ]}
                                    >
                                        {item}
                                    </Text>
                                    {item === value && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    selector: {
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        borderWidth: 1.5,
        borderColor: '#374151',
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectorText: {
        fontSize: 16,
        color: '#F9FAFB',
    },
    placeholder: {
        color: '#6B7280',
    },
    arrow: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1E293B',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#F9FAFB',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeText: {
        color: '#EF4444',
        fontSize: 18,
        fontWeight: '700',
    },
    searchInput: {
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderWidth: 1.5,
        borderColor: '#374151',
        borderRadius: 12,
        padding: 14,
        margin: 16,
        fontSize: 16,
        color: '#F9FAFB',
    },
    countryItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    countryItemSelected: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
    countryText: {
        fontSize: 16,
        color: '#D1D5DB',
    },
    countryTextSelected: {
        color: '#3B82F6',
        fontWeight: '600',
    },
    checkmark: {
        color: '#3B82F6',
        fontSize: 18,
        fontWeight: '700',
    },
});
