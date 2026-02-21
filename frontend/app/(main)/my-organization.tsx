import React, { useEffect, useState, useCallback } from 'react';
import {
    ScrollView,
    StyleSheet,
    View,
    TouchableOpacity,
    RefreshControl,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    getMyOrganization,
    leaveOrganization,
    MyOrganizationData,
    Teammate,
} from '../../services/organization.service';

// ── Design tokens ──────────────────────────────────────────────────────────────
const ACCENT = '#C8F135';
const BG = '#080C14';
const SURFACE = '#0F1521';
const SURFACE2 = '#0A1020';
const BORDER = '#1C2535';
const TEXT_PRIMARY = '#F0F4FF';
const TEXT_MUTED = '#5A6A82';
const RED = '#FF4D4D';
const GREEN = '#22C55E';

const AVATAR_COLORS = ['#C8F135', '#60C8FF', '#F97316', '#A78BFA', '#34D399'];

// ── Avatar initials component ──────────────────────────────────────────────────
function Avatar({ name, index }: { name: string; index: number }) {
    const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
    const initials = name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    return (
        <View style={[avatarS.circle, { backgroundColor: color + '22', borderColor: color + '55' }]}>
            <Text style={[avatarS.text, { color }]}>{initials}</Text>
        </View>
    );
}
const avatarS = StyleSheet.create({
    circle: {
        width: 44, height: 44, borderRadius: 14,
        borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    },
    text: { fontSize: 15, fontWeight: '800' },
});

// ── Teammate card ──────────────────────────────────────────────────────────────
function TeammateCard({
    player, index, onPress,
}: { player: Teammate; index: number; onPress: () => void }) {
    return (
        <TouchableOpacity style={cardS.wrapper} onPress={onPress} activeOpacity={0.8}>
            <Avatar name={player.name} index={index} />
            <View style={cardS.info}>
                <Text style={cardS.name}>{player.name}</Text>
                <Text style={cardS.sub}>{player.game_id}</Text>
                <View style={cardS.rolesRow}>
                    {player.roles.slice(0, 2).map((r) => (
                        <View key={r} style={cardS.roleTag}>
                            <Text style={cardS.roleTagText}>{r}</Text>
                        </View>
                    ))}
                </View>
            </View>
            <View style={cardS.stats}>
                <View style={cardS.statItem}>
                    <Text style={cardS.statVal}>{player.kd_ratio?.toFixed(1) ?? '—'}</Text>
                    <Text style={cardS.statLbl}>K/D</Text>
                </View>
                <View style={[cardS.statItem, { marginLeft: 16 }]}>
                    <Text style={cardS.statVal}>{player.average_damage ?? '—'}</Text>
                    <Text style={cardS.statLbl}>DMG</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={TEXT_MUTED} style={{ marginLeft: 12 }} />
            </View>
        </TouchableOpacity>
    );
}
const cardS = StyleSheet.create({
    wrapper: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: SURFACE, borderRadius: 16,
        borderWidth: 1.5, borderColor: BORDER,
        padding: 14, marginBottom: 10,
    },
    info: { flex: 1, marginLeft: 12 },
    name: { fontSize: 15, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.3 },
    sub: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
    rolesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6 },
    roleTag: {
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
        backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER,
    },
    roleTagText: { fontSize: 10, color: TEXT_MUTED, fontWeight: '600' },
    stats: { flexDirection: 'row', alignItems: 'center' },
    statItem: { alignItems: 'center' },
    statVal: { fontSize: 13, fontWeight: '800', color: TEXT_PRIMARY },
    statLbl: { fontSize: 10, color: TEXT_MUTED, fontWeight: '600', marginTop: 1 },
});

// ── Org info banner ────────────────────────────────────────────────────────────
function OrgBanner({ org }: { org: MyOrganizationData['organization'] }) {
    return (
        <View style={orgS.banner}>
            <View style={orgS.iconWrap}>
                <Ionicons name="shield-checkmark" size={28} color={ACCENT} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={orgS.orgName}>{org.organization_name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
                    <Ionicons name="location-outline" size={12} color={TEXT_MUTED} />
                    <Text style={orgS.country}>{org.country}</Text>
                </View>
                {org.description ? (
                    <Text style={orgS.desc} numberOfLines={2}>{org.description}</Text>
                ) : null}
            </View>
            <View style={orgS.activeBadge}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN }} />
                <Text style={orgS.activeText}>ACTIVE</Text>
            </View>
        </View>
    );
}
const orgS = StyleSheet.create({
    banner: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#0C1A0A', borderRadius: 18,
        borderWidth: 1.5, borderColor: '#1C2C10', padding: 16, marginBottom: 20,
    },
    iconWrap: {
        width: 52, height: 52, borderRadius: 16,
        backgroundColor: '#1C2C10', alignItems: 'center', justifyContent: 'center',
    },
    orgName: { fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.4 },
    country: { fontSize: 12, color: TEXT_MUTED },
    desc: { fontSize: 12, color: TEXT_MUTED, marginTop: 4, lineHeight: 16 },
    activeBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 20,
        paddingHorizontal: 10, paddingVertical: 5,
        borderWidth: 1, borderColor: '#14532d',
        alignSelf: 'flex-start',
    },
    activeText: { fontSize: 10, color: GREEN, fontWeight: '700', letterSpacing: 0.8 },
});

// ── Main screen ────────────────────────────────────────────────────────────────
export default function MyOrganizationScreen() {
    const router = useRouter();
    const [data, setData] = useState<MyOrganizationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [leaving, setLeaving] = useState(false);

    const load = useCallback(async (opts?: { silent?: boolean }) => {
        try {
            if (!opts?.silent) setLoading(true);
            const result = await getMyOrganization();
            setData(result);
        } catch (err: any) {
            Toast.show({ type: 'error', text1: err?.response?.data?.message ?? 'Failed to load' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    const onRefresh = () => {
        setRefreshing(true);
        void load({ silent: true });
    };

    const onLeave = () => {
        Alert.alert(
            'Leave Organization',
            `Are you sure you want to leave ${data?.organization.organization_name ?? 'this organization'}? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLeaving(true);
                            await leaveOrganization();
                            setData(null);
                            Toast.show({ type: 'success', text1: 'You have left the organization' });
                        } catch (err: any) {
                            Toast.show({ type: 'error', text1: err?.response?.data?.message ?? 'Failed to leave' });
                        } finally {
                            setLeaving(false);
                        }
                    },
                },
            ]
        );
    };

    const onViewProfile = (teammate: Teammate) => {
        router.push({
            pathname: '/player-profile' as any,
            params: { profileId: teammate._id, playerName: teammate.name },
        });
    };

    return (
        <View style={styles.root}>
            <View style={styles.glowTop} pointerEvents="none" />
            <View style={styles.glowBottom} pointerEvents="none" />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={ACCENT}
                        colors={[ACCENT]}
                    />
                }
            >
                {/* Header */}
                <View style={styles.pageHeader}>
                    <View>
                        <Text style={styles.pageTitle}>My Team</Text>
                        <Text style={styles.pageSubtitle}>Your current organization</Text>
                    </View>
                    {data && (
                        <View style={styles.countBadge}>
                            <Text style={styles.countText}>{data.teammates.length}</Text>
                        </View>
                    )}
                </View>

                {loading ? (
                    <View style={styles.centerBox}>
                        <ActivityIndicator size="large" color={ACCENT} />
                    </View>
                ) : !data ? (
                    // Not in any org
                    <View style={styles.emptyBox}>
                        <View style={styles.emptyIconWrap}>
                            <Ionicons name="shield-outline" size={32} color={TEXT_MUTED} />
                        </View>
                        <Text style={styles.emptyTitle}>Not in a team yet</Text>
                        <Text style={styles.emptyBody}>
                            Apply to active scoutings and get selected by an organization to join a team.
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* Org info */}
                        <OrgBanner org={data.organization} />

                        {/* Section header */}
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionBar} />
                            <Ionicons name="people-outline" size={13} color={ACCENT} style={{ marginRight: 6 }} />
                            <Text style={styles.sectionLabel}>TEAMMATES  ({data.teammates.length})</Text>
                        </View>

                        {/* Teammate list */}
                        {data.teammates.length === 0 ? (
                            <Text style={styles.noTeammates}>No other players in the org yet.</Text>
                        ) : (
                            data.teammates.map((p, i) => (
                                <TeammateCard key={p._id} player={p} index={i} onPress={() => onViewProfile(p)} />
                            ))
                        )}

                        {/* Leave org button */}
                        <TouchableOpacity
                            style={[styles.leaveBtn, leaving && { opacity: 0.6 }]}
                            onPress={onLeave}
                            disabled={leaving}
                            activeOpacity={0.8}
                        >
                            {leaving ? (
                                <ActivityIndicator size="small" color={RED} />
                            ) : (
                                <>
                                    <Ionicons name="exit-outline" size={18} color={RED} />
                                    <Text style={styles.leaveBtnText}>Leave Organization</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </>
                )}

                <View style={{ height: 32 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    glowTop: { position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: ACCENT, opacity: 0.04 },
    glowBottom: { position: 'absolute', bottom: -80, left: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: '#1A6EFF', opacity: 0.05 },
    content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 32 },

    pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    pageTitle: { fontSize: 26, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.5 },
    pageSubtitle: { fontSize: 13, color: TEXT_MUTED, marginTop: 3 },
    countBadge: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: '#1C2C10', borderWidth: 1.5, borderColor: '#2A3C10',
        alignItems: 'center', justifyContent: 'center',
    },
    countText: { fontSize: 15, fontWeight: '800', color: ACCENT },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 4 },
    sectionBar: { width: 3, height: 16, borderRadius: 2, backgroundColor: ACCENT, marginRight: 8 },
    sectionLabel: { fontSize: 11, color: TEXT_MUTED, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },

    noTeammates: { fontSize: 13, color: TEXT_MUTED, textAlign: 'center', marginTop: 20 },

    centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
    emptyBox: { marginTop: 48, alignItems: 'center', paddingHorizontal: 20 },
    emptyIconWrap: {
        width: 72, height: 72, borderRadius: 22, backgroundColor: SURFACE,
        borderWidth: 1.5, borderColor: BORDER, alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    },
    emptyTitle: { fontSize: 17, fontWeight: '800', color: TEXT_PRIMARY, marginBottom: 8, letterSpacing: -0.3 },
    emptyBody: { fontSize: 13, color: TEXT_MUTED, textAlign: 'center', lineHeight: 20 },

    leaveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        marginTop: 24, paddingVertical: 15, borderRadius: 14,
        backgroundColor: '#160808', borderWidth: 1.5, borderColor: '#4A1010',
    },
    leaveBtnText: { fontSize: 15, fontWeight: '700', color: RED },
});
