import React, { useEffect, useState } from 'react';
import {
    ScrollView, StyleSheet, View, TouchableOpacity, Linking,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { fetchPlayerProfileById, PlayerProfile } from '../../services/playerProfile.service';

// ── Design tokens ──────────────────────────────────────────────────────────────
const ACCENT = '#C8F135';
const BG = '#080C14';
const SURFACE = '#0F1521';
const SURFACE2 = '#0A1020';
const BORDER = '#1C2535';
const TEXT_PRIMARY = '#F0F4FF';
const TEXT_MUTED = '#5A6A82';
const GREEN = '#22C55E';
const RED = '#FF4D4D';
const YELLOW = '#FACC15';
const BLUE = '#60C8FF';
const PURPLE = '#A78BFA';
const ORANGE = '#F97316';

const AVATAR_PALETTE = [ACCENT, BLUE, ORANGE, PURPLE, '#34D399'];
const avatarColor = (name: string) =>
    AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];

// ── Helpers ────────────────────────────────────────────────────────────────────
function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatEnum(s?: string) {
    if (!s) return '—';
    return s.split('_').map(capitalize).join(' ');
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function SectionTitle({ label }: { label: string }) {
    return (
        <View style={sc.row}>
            <View style={sc.line} />
            <Text style={sc.text}>{label.toUpperCase()}</Text>
            <View style={sc.line} />
        </View>
    );
}
const sc = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 10 },
    line: { flex: 1, height: 1, backgroundColor: BORDER },
    text: { fontSize: 10, fontWeight: '700', color: TEXT_MUTED, letterSpacing: 1.2 },
});

function StatCard({ icon, value, label, color = ACCENT }: {
    icon: string; value: string | number; label: string; color?: string;
}) {
    return (
        <View style={[stS.card, { borderColor: color + '30' }]}>
            <Ionicons name={icon as any} size={16} color={color} style={{ marginBottom: 6 }} />
            <Text style={[stS.value, { color }]}>{value}</Text>
            <Text style={stS.label}>{label}</Text>
        </View>
    );
}
const stS = StyleSheet.create({
    card: {
        flex: 1, backgroundColor: SURFACE2, borderRadius: 14,
        borderWidth: 1.5, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6,
    },
    value: { fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
    label: { fontSize: 9, color: TEXT_MUTED, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 4 },
});

function InfoRow({ icon, label, value }: { icon: string; label: string; value?: string }) {
    if (!value) return null;
    return (
        <View style={ir.row}>
            <View style={ir.iconBox}>
                <Ionicons name={icon as any} size={14} color={ACCENT} />
            </View>
            <Text style={ir.label}>{label}</Text>
            <Text style={ir.value}>{value}</Text>
        </View>
    );
}
const ir = StyleSheet.create({
    row: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: BORDER,
    },
    iconBox: {
        width: 30, height: 30, borderRadius: 9, backgroundColor: SURFACE2,
        borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center',
    },
    label: { flex: 1, fontSize: 13, color: TEXT_MUTED, fontWeight: '500' },
    value: { fontSize: 13, color: TEXT_PRIMARY, fontWeight: '700', maxWidth: '55%', textAlign: 'right' },
});

function Tag({ label, color = ACCENT }: { label: string; color?: string }) {
    return (
        <View style={[tg.wrap, { borderColor: color + '55', backgroundColor: color + '12' }]}>
            <Text style={[tg.text, { color }]}>{label}</Text>
        </View>
    );
}
const tg = StyleSheet.create({
    wrap: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, marginRight: 6, marginBottom: 6 },
    text: { fontSize: 12, fontWeight: '700' },
});

// ── Main screen ────────────────────────────────────────────────────────────────
export default function PlayerProfileScreen() {
    const { profileId, playerName } = useLocalSearchParams<{ profileId: string; playerName?: string }>();
    const router = useRouter();
    const [profile, setProfile] = useState<PlayerProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await fetchPlayerProfileById(profileId);
                setProfile(data);
            } catch (err: any) {
                Toast.show({ type: 'error', text1: err?.response?.data?.message ?? 'Failed to load profile' });
                router.back();
            } finally {
                setLoading(false);
            }
        };
        if (profileId) void load();
    }, [profileId]);

    const aColor = profile ? avatarColor(profile.name) : ACCENT;

    return (
        <View style={styles.root}>
            {/* Background glows */}
            <View style={[styles.glow, { top: -80, right: -80, backgroundColor: aColor, opacity: 0.05 }]} pointerEvents="none" />
            <View style={[styles.glow, { bottom: -80, left: -80, backgroundColor: BLUE, opacity: 0.04 }]} pointerEvents="none" />

            {/* Back button */}
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={20} color={TEXT_PRIMARY} />
            </TouchableOpacity>

            {loading ? (
                <View style={styles.center}>
                    <Ionicons name="hourglass-outline" size={40} color={TEXT_MUTED} />
                    <Text style={styles.loadingText}>Loading profile…</Text>
                </View>
            ) : profile ? (
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    {/* ── Hero ── */}
                    <View style={styles.hero}>
                        <View style={[styles.avatar, { borderColor: aColor + '55', backgroundColor: aColor + '18' }]}>
                            <Text style={[styles.avatarText, { color: aColor }]}>
                                {profile.name.slice(0, 2).toUpperCase()}
                            </Text>
                        </View>
                        <Text style={styles.heroName}>{profile.name}</Text>
                        <View style={styles.heroGameIdRow}>
                            <Ionicons name="at-outline" size={13} color={TEXT_MUTED} />
                            <Text style={styles.heroGameId}>{profile.game_id}</Text>
                        </View>
                        {/* Role tags */}
                        <View style={styles.heroTagsRow}>
                            {profile.roles?.map((r) => <Tag key={r} label={r} color={aColor} />)}
                        </View>
                        {/* Verified badge */}
                        {profile.stats_verified && (
                            <View style={styles.verifiedBadge}>
                                <Ionicons name="shield-checkmark" size={13} color={GREEN} style={{ marginRight: 5 }} />
                                <Text style={styles.verifiedText}>Stats Verified</Text>
                            </View>
                        )}
                    </View>

                    {/* ── Combat Stats ── */}
                    <SectionTitle label="Combat Stats" />
                    <View style={styles.statsRow}>
                        <StatCard icon="trending-up-outline" value={profile.kd_ratio} label="K/D Ratio" color={ACCENT} />
                        <StatCard icon="flash-outline" value={profile.average_damage} label="Avg Damage" color={YELLOW} />
                        <StatCard icon="time-outline" value={profile.years_experience ?? '—'} label="Yrs Exp" color={BLUE} />
                    </View>

                    {/* ── Player Info ── */}
                    <SectionTitle label="Player Info" />
                    <View style={styles.infoCard}>
                        <InfoRow icon="person-outline" label="Age" value={String(profile.age)} />
                        <InfoRow icon="male-female-outline" label="Gender" value={formatEnum(profile.gender)} />
                        <InfoRow icon="location-outline" label="Country" value={profile.country} />
                        <InfoRow icon="phone-portrait-outline" label="Device" value={formatEnum(profile.device)} />
                        <InfoRow icon="hand-left-outline" label="Finger Setup" value={formatEnum(profile.finger_setup)} />
                        <InfoRow icon="color-palette-outline" label="Playing Style" value={formatEnum(profile.playing_style)} />
                        {profile.ban_history && (
                            <View style={ir.row}>
                                <View style={ir.iconBox}>
                                    <Ionicons name="warning-outline" size={14} color={RED} />
                                </View>
                                <Text style={ir.label}>Ban History</Text>
                                <Text style={[ir.value, { color: RED }]}>Yes</Text>
                            </View>
                        )}
                    </View>

                    {/* ── Organization ── */}
                    {profile.currentOrganization && (
                        <>
                            <SectionTitle label="Current Org" />
                            <View style={styles.orgCard}>
                                <Ionicons name="business-outline" size={18} color={ACCENT} style={{ marginRight: 10 }} />
                                <Text style={styles.orgName}>{(profile.currentOrganization as any)?.organization_name ?? '—'}</Text>
                            </View>
                        </>
                    )}

                    {/* ── Maps ── */}
                    {profile.preferred_maps?.length > 0 && (
                        <>
                            <SectionTitle label="Preferred Maps" />
                            <View style={styles.tagsWrap}>
                                {profile.preferred_maps.map((m) => <Tag key={m} label={m} color={PURPLE} />)}
                            </View>
                        </>
                    )}

                    {/* ── Tournaments ── */}
                    {(profile.tournaments_played?.length ?? 0) > 0 && (
                        <>
                            <SectionTitle label="Tournaments" />
                            <View style={styles.tagsWrap}>
                                {profile.tournaments_played!.map((t) => <Tag key={t} label={t} color={ORANGE} />)}
                                {profile.other_tournament_name && <Tag label={profile.other_tournament_name} color={ORANGE} />}
                            </View>
                        </>
                    )}

                    {/* ── Previous Org ── */}
                    {profile.previous_organization && (
                        <>
                            <SectionTitle label="Previous Organization" />
                            <View style={styles.infoCard}>
                                <InfoRow icon="business-outline" label="Org" value={profile.previous_organization} />
                            </View>
                        </>
                    )}

                    {/* ── Bio ── */}
                    {profile.bio && (
                        <>
                            <SectionTitle label="About" />
                            <View style={styles.bioCard}>
                                <Text style={styles.bioText}>{profile.bio}</Text>
                            </View>
                        </>
                    )}

                    {/* ── Socials ── */}
                    {(profile.youtube_url || profile.instagram_url) && (
                        <>
                            <SectionTitle label="Socials" />
                            <View style={styles.socialsRow}>
                                {profile.youtube_url && (
                                    <TouchableOpacity
                                        onPress={() => Linking.openURL(profile.youtube_url!)}
                                        style={[styles.socialBtn, { borderColor: '#FF0000' + '55', backgroundColor: '#FF0000' + '12' }]}
                                        activeOpacity={0.8}
                                    >
                                        <MaterialCommunityIcons name="youtube" size={18} color="#FF0000" style={{ marginRight: 6 }} />
                                        <Text style={[styles.socialLabel, { color: '#FF0000' }]}>YouTube</Text>
                                    </TouchableOpacity>
                                )}
                                {profile.instagram_url && (
                                    <TouchableOpacity
                                        onPress={() => Linking.openURL(profile.instagram_url!)}
                                        style={[styles.socialBtn, { borderColor: '#E1306C' + '55', backgroundColor: '#E1306C' + '12' }]}
                                        activeOpacity={0.8}
                                    >
                                        <MaterialCommunityIcons name="instagram" size={18} color="#E1306C" style={{ marginRight: 6 }} />
                                        <Text style={[styles.socialLabel, { color: '#E1306C' }]}>Instagram</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </>
                    )}

                    <View style={{ height: 48 }} />
                </ScrollView>
            ) : null}
        </View>
    );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    glow: { position: 'absolute', width: 280, height: 280, borderRadius: 140 },
    backBtn: {
        position: 'absolute', top: 52, left: 20, zIndex: 10,
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: SURFACE, borderWidth: 1.5, borderColor: BORDER,
        alignItems: 'center', justifyContent: 'center',
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { color: TEXT_MUTED, fontSize: 14 },

    content: { paddingTop: 112, paddingHorizontal: 20, paddingBottom: 32 },

    // Hero
    hero: { alignItems: 'center', marginBottom: 4 },
    avatar: {
        width: 88, height: 88, borderRadius: 26,
        borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    },
    avatarText: { fontSize: 30, fontWeight: '900' },
    heroName: { fontSize: 24, fontWeight: '900', color: TEXT_PRIMARY, letterSpacing: -0.5, marginBottom: 4 },
    heroGameIdRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
    heroGameId: { fontSize: 14, color: TEXT_MUTED },
    heroTagsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 10 },
    verifiedBadge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#0C1E10', borderRadius: 20,
        borderWidth: 1, borderColor: GREEN + '40',
        paddingHorizontal: 12, paddingVertical: 5,
    },
    verifiedText: { fontSize: 11, fontWeight: '700', color: GREEN },

    // Stats row
    statsRow: { flexDirection: 'row', gap: 10 },

    // Info card
    infoCard: {
        backgroundColor: SURFACE, borderRadius: 18,
        borderWidth: 1.5, borderColor: BORDER, paddingHorizontal: 14, paddingTop: 2,
    },

    // Org card
    orgCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: SURFACE, borderRadius: 14,
        borderWidth: 1.5, borderColor: BORDER,
        paddingHorizontal: 16, paddingVertical: 14,
    },
    orgName: { fontSize: 15, fontWeight: '800', color: TEXT_PRIMARY },

    // Tags
    tagsWrap: { flexDirection: 'row', flexWrap: 'wrap' },

    // Bio
    bioCard: {
        backgroundColor: SURFACE, borderRadius: 14,
        borderWidth: 1.5, borderColor: BORDER,
        padding: 16,
    },
    bioText: { fontSize: 14, color: TEXT_MUTED, lineHeight: 22 },

    // Socials
    socialsRow: { flexDirection: 'row', gap: 10 },
    socialBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        borderRadius: 14, borderWidth: 1.5, paddingVertical: 13,
    },
    socialLabel: { fontSize: 14, fontWeight: '700' },
});
