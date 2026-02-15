import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import styles from './styles';
import profileService, { UserProfile } from '../../services/profile.service';
import CountryDropdown from '../../components/CountryDropdown';
import { COUNTRIES } from '../../constants/countries';

const EXPERIENCE_OPTIONS = [
    'Tier 1 Scrims',
    'Tier 2 Scrims',
    'Tier 3 Scrims',
    'BGIS',
    'PMCO',
    'Skyesports Championship',
    'ESL Snapdragon',
    'Red Bull MEO',
    'Nodwin Invitational',
    'BMPS',
    'Local LAN Events',
    'Other',
];

const PREFERRED_MAPS = ['Erangel', 'Miramar', 'Sanhok', 'Livik', 'Rondo'];

export default function UserProfileScreen() {
    const router = useRouter();
    const { userRole } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const [formData, setFormData] = useState<Partial<UserProfile>>({
        age: undefined,
        gender: '',
        country: '',
        pubgUID: '',
        primaryRole: '',
        secondaryRole: '',
        experience: [],
        experienceOther: '',
        yearsOfExperience: undefined,
        achievements: '',
        previousOrganization: '',
        deviceType: '',
        fingerSetup: '',
        gyroscope: undefined,
        kdRatio: undefined,
        averageDamage: undefined,
        preferredMaps: [],
        playstyle: '',
        socialLinks: {
            instagram: '',
            twitter: '',
            youtube: '',
        },
        banHistory: undefined,
    });

    useEffect(() => {
        // Redirect organisation users
        if (userRole === 'organisation') {
            Toast.show({
                type: 'error',
                text1: 'Access Denied',
                text2: 'This feature is only available for players.',
            });
            setTimeout(() => router.back(), 1000);
            return;
        }
        loadProfile();
    }, [userRole]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const response = await profileService.getProfile();
            if (response.exists && response.data) {
                setFormData(response.data);
                setIsEditMode(true);
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to load profile',
            });
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const missing: string[] = [];

        if (!formData.age) missing.push('Age');
        if (!formData.gender) missing.push('Gender');
        if (!formData.country) missing.push('Country');
        if (!formData.pubgUID) {
            missing.push('PUBG UID');
        } else if (!/^\d{11}$/.test(formData.pubgUID)) {
            Toast.show({
                type: 'error',
                text1: 'Invalid PUBG UID',
                text2: 'PUBG UID must be exactly 11 digits',
            });
            return ['PUBG UID'];
        }
        if (!formData.primaryRole) missing.push('Primary Role');
        if (!formData.deviceType) missing.push('Device Type');
        if (formData.gyroscope === undefined || formData.gyroscope === null) missing.push('Gyroscope');
        if (!formData.fingerSetup) missing.push('Finger Setup');
        if (!formData.kdRatio && formData.kdRatio !== 0) missing.push('K/D Ratio');
        if (!formData.averageDamage && formData.averageDamage !== 0) missing.push('Average Damage');
        if (!formData.preferredMaps || formData.preferredMaps.length === 0) missing.push('Preferred Maps');
        if (!formData.playstyle) missing.push('Playstyle');
        if (formData.banHistory === undefined || formData.banHistory === null) missing.push('Ban History');

        return missing;
    };

    const handleSave = async () => {
        try {
            // Validate required fields
            const missingFields = validateForm();
            if (missingFields.length > 0) {
                Toast.show({
                    type: 'error',
                    text1: 'Missing Required Fields',
                    text2: `Please fill in: ${missingFields.join(', ')}`,
                    visibilityTime: 4000,
                });
                return;
            }

            setSaving(true);

            if (isEditMode) {
                await profileService.updateProfile(formData);
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Profile updated successfully!',
                });
            } else {
                await profileService.createProfile(formData);
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Profile created successfully!',
                });
                setIsEditMode(true);
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.errors
                ? error.response.data.errors.join('\n')
                : error.response?.data?.message || 'Failed to save profile';
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: errorMessage,
                visibilityTime: 4000,
            });
        } finally {
            setSaving(false);
        }
    };

    const toggleExperience = (option: string) => {
        const current = formData.experience || [];
        if (current.includes(option)) {
            setFormData({ ...formData, experience: current.filter(e => e !== option) });
        } else {
            setFormData({ ...formData, experience: [...current, option] });
        }
    };

    const toggleMap = (map: string) => {
        const current = formData.preferredMaps || [];
        if (current.includes(map)) {
            setFormData({ ...formData, preferredMaps: current.filter(m => m !== map) });
        } else {
            setFormData({ ...formData, preferredMaps: [...current, map] });
        }
    };

    if (loading) {
        return (
            <LinearGradient colors={['#0F172A', '#1E293B', '#0F172A']} style={styles.container}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#0F172A', '#1E293B', '#0F172A']} style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>
                        {isEditMode ? 'Edit Profile' : 'Create Profile'}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        Complete your player profile for tournaments
                    </Text>
                </View>

                {/* Basic Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Basic Information</Text>

                    <Text style={styles.label}>Age</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.age?.toString() || ''}
                        onChangeText={(text) => setFormData({ ...formData, age: parseInt(text) || undefined })}
                        keyboardType="number-pad"
                        placeholder="Enter your age"
                        placeholderTextColor="#6B7280"
                    />

                    <Text style={styles.label}>Gender</Text>
                    <View style={styles.radioGroup}>
                        {['Male', 'Female', 'Other', 'Prefer not to say'].map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={[
                                    styles.radioButton,
                                    formData.gender === option && styles.radioButtonActive,
                                ]}
                                onPress={() => setFormData({ ...formData, gender: option })}
                            >
                                <Text
                                    style={[
                                        styles.radioText,
                                        formData.gender === option && styles.radioTextActive,
                                    ]}
                                >
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Country</Text>
                    <CountryDropdown
                        value={formData.country || ''}
                        onSelect={(country) => setFormData({ ...formData, country })}
                        countries={COUNTRIES}
                    />
                </View>

                {/* Game Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Game Details</Text>

                    <Text style={styles.label}>PUBG UID / Profile ID</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.pubgUID}
                        onChangeText={(text) => setFormData({ ...formData, pubgUID: text })}
                        placeholder="Enter your 11-digit PUBG UID"
                        placeholderTextColor="#6B7280"
                        keyboardType="number-pad"
                        maxLength={11}
                    />

                    <Text style={styles.label}>Primary Role</Text>
                    <View style={styles.radioGroup}>
                        {['IGL', 'Assaulter', 'Support', 'Sniper', 'Entry Fragger'].map((role) => (
                            <TouchableOpacity
                                key={role}
                                style={[
                                    styles.radioButton,
                                    formData.primaryRole === role && styles.radioButtonActive,
                                ]}
                                onPress={() => setFormData({ ...formData, primaryRole: role })}
                            >
                                <Text
                                    style={[
                                        styles.radioText,
                                        formData.primaryRole === role && styles.radioTextActive,
                                    ]}
                                >
                                    {role}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Secondary Role (Optional)</Text>
                    <View style={styles.radioGroup}>
                        {['IGL', 'Assaulter', 'Support', 'Sniper', 'Entry Fragger', 'None'].map((role) => (
                            <TouchableOpacity
                                key={role}
                                style={[
                                    styles.radioButton,
                                    formData.secondaryRole === role && styles.radioButtonActive,
                                ]}
                                onPress={() => setFormData({ ...formData, secondaryRole: role })}
                            >
                                <Text
                                    style={[
                                        styles.radioText,
                                        formData.secondaryRole === role && styles.radioTextActive,
                                    ]}
                                >
                                    {role}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Device Type</Text>
                    <View style={styles.radioGroup}>
                        {['Mobile', 'iPad', 'PC'].map((device) => (
                            <TouchableOpacity
                                key={device}
                                style={[
                                    styles.radioButton,
                                    formData.deviceType === device && styles.radioButtonActive,
                                ]}
                                onPress={() => setFormData({ ...formData, deviceType: device })}
                            >
                                <Text
                                    style={[
                                        styles.radioText,
                                        formData.deviceType === device && styles.radioTextActive,
                                    ]}
                                >
                                    {device}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Finger Setup</Text>
                    <View style={styles.radioGroup}>
                        {['Thumb', '3 Finger', '4 Finger', '5 Finger'].map((setup) => (
                            <TouchableOpacity
                                key={setup}
                                style={[
                                    styles.radioButton,
                                    formData.fingerSetup === setup && styles.radioButtonActive,
                                ]}
                                onPress={() => setFormData({ ...formData, fingerSetup: setup })}
                            >
                                <Text
                                    style={[
                                        styles.radioText,
                                        formData.fingerSetup === setup && styles.radioTextActive,
                                    ]}
                                >
                                    {setup}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Gyroscope</Text>
                    <View style={styles.radioGroup}>
                        {[{ label: 'Yes', value: true }, { label: 'No', value: false }].map((option) => (
                            <TouchableOpacity
                                key={option.label}
                                style={[
                                    styles.radioButton,
                                    formData.gyroscope === option.value && styles.radioButtonActive,
                                ]}
                                onPress={() => setFormData({ ...formData, gyroscope: option.value })}
                            >
                                <Text
                                    style={[
                                        styles.radioText,
                                        formData.gyroscope === option.value && styles.radioTextActive,
                                    ]}
                                >
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>K/D Ratio</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.kdRatio?.toString() || ''}
                        onChangeText={(text) => setFormData({ ...formData, kdRatio: parseFloat(text) || undefined })}
                        keyboardType="decimal-pad"
                        placeholder="Enter your K/D ratio"
                        placeholderTextColor="#6B7280"
                    />

                    <Text style={styles.label}>Average Damage</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.averageDamage?.toString() || ''}
                        onChangeText={(text) => setFormData({ ...formData, averageDamage: parseFloat(text) || undefined })}
                        keyboardType="decimal-pad"
                        placeholder="Enter your average damage"
                        placeholderTextColor="#6B7280"
                    />
                </View>

                {/* Experience */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Experience</Text>
                    <Text style={styles.label}>Select all that apply (Optional)</Text>
                    <View style={styles.checkboxGroup}>
                        {EXPERIENCE_OPTIONS.map((exp) => (
                            <TouchableOpacity
                                key={exp}
                                style={[
                                    styles.checkbox,
                                    formData.experience?.includes(exp) && styles.checkboxActive,
                                ]}
                                onPress={() => toggleExperience(exp)}
                            >
                                <View style={styles.checkboxIcon}>
                                    {formData.experience?.includes(exp) && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </View>
                                <Text
                                    style={[
                                        styles.checkboxText,
                                        formData.experience?.includes(exp) && styles.checkboxTextActive,
                                    ]}
                                >
                                    {exp}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {formData.experience?.includes('Other') && (
                        <>
                            <Text style={styles.label}>Other Experience (Please specify)</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.experienceOther}
                                onChangeText={(text) => setFormData({ ...formData, experienceOther: text })}
                                placeholder="Specify other experience"
                                placeholderTextColor="#6B7280"
                            />
                        </>
                    )}

                    <Text style={styles.label}>Years of Competitive Experience (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.yearsOfExperience?.toString() || ''}
                        onChangeText={(text) => setFormData({ ...formData, yearsOfExperience: parseInt(text) || undefined })}
                        keyboardType="number-pad"
                        placeholder="Enter years of experience"
                        placeholderTextColor="#6B7280"
                    />
                </View>

                {/* Performance */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Performance</Text>

                    <Text style={styles.label}>Achievements (Optional)</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={formData.achievements}
                        onChangeText={(text) => setFormData({ ...formData, achievements: text })}
                        placeholder="List your achievements..."
                        placeholderTextColor="#6B7280"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />

                    <Text style={styles.label}>Previous Organization (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.previousOrganization}
                        onChangeText={(text) => setFormData({ ...formData, previousOrganization: text })}
                        placeholder="Enter previous organization"
                        placeholderTextColor="#6B7280"
                    />
                </View>

                {/* Preferences */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferences</Text>

                    <Text style={styles.label}>Preferred Maps</Text>
                    <View style={styles.checkboxGroup}>
                        {PREFERRED_MAPS.map((map) => (
                            <TouchableOpacity
                                key={map}
                                style={[
                                    styles.checkbox,
                                    formData.preferredMaps?.includes(map) && styles.checkboxActive,
                                ]}
                                onPress={() => toggleMap(map)}
                            >
                                <View style={styles.checkboxIcon}>
                                    {formData.preferredMaps?.includes(map) && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </View>
                                <Text
                                    style={[
                                        styles.checkboxText,
                                        formData.preferredMaps?.includes(map) && styles.checkboxTextActive,
                                    ]}
                                >
                                    {map}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Playstyle</Text>
                    <View style={styles.radioGroup}>
                        {['Aggressive', 'Passive', 'Balanced'].map((style) => (
                            <TouchableOpacity
                                key={style}
                                style={[
                                    styles.radioButton,
                                    formData.playstyle === style && styles.radioButtonActive,
                                ]}
                                onPress={() => setFormData({ ...formData, playstyle: style })}
                            >
                                <Text
                                    style={[
                                        styles.radioText,
                                        formData.playstyle === style && styles.radioTextActive,
                                    ]}
                                >
                                    {style}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Social Links */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Social Links (Optional)</Text>

                    <Text style={styles.label}>Instagram</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.socialLinks?.instagram}
                        onChangeText={(text) => setFormData({
                            ...formData,
                            socialLinks: { ...formData.socialLinks, instagram: text }
                        })}
                        placeholder="Instagram username"
                        placeholderTextColor="#6B7280"
                    />

                    <Text style={styles.label}>X (Twitter)</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.socialLinks?.twitter}
                        onChangeText={(text) => setFormData({
                            ...formData,
                            socialLinks: { ...formData.socialLinks, twitter: text }
                        })}
                        placeholder="X username"
                        placeholderTextColor="#6B7280"
                    />

                    <Text style={styles.label}>YouTube</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.socialLinks?.youtube}
                        onChangeText={(text) => setFormData({
                            ...formData,
                            socialLinks: { ...formData.socialLinks, youtube: text }
                        })}
                        placeholder="YouTube channel"
                        placeholderTextColor="#6B7280"
                    />
                </View>

                {/* Additional */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Additional Information</Text>

                    <Text style={styles.label}>Any Ban History?</Text>
                    <View style={styles.radioGroup}>
                        {[{ label: 'Yes', value: true }, { label: 'No', value: false }].map((option) => (
                            <TouchableOpacity
                                key={option.label}
                                style={[
                                    styles.radioButton,
                                    formData.banHistory === option.value && styles.radioButtonActive,
                                ]}
                                onPress={() => setFormData({ ...formData, banHistory: option.value })}
                            >
                                <Text
                                    style={[
                                        styles.radioText,
                                        formData.banHistory === option.value && styles.radioTextActive,
                                    ]}
                                >
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.saveButtonText}>
                            {isEditMode ? 'Update Profile' : 'Save Profile'}
                        </Text>
                    )}
                </TouchableOpacity>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </LinearGradient>
    );
}
