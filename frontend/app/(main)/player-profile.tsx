import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    Animated, ScrollView, StyleSheet, View, TouchableOpacity, Linking,
    Image, ActivityIndicator, Dimensions, Modal,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getPublicProfile, PublicUserProfile } from '../../services/user.service';
import Toast from 'react-native-toast-message';

// ── Tokens ───────────────────────────────────────────  ─────────────────────────
const ACCENT = '#C8F135';
const BG = '#080C14';
const SURFACE = '#0F1521';
const SURFACE2 = '#0A1020';
const BORDER = '#1C2535';
const TEXT_PRIMARY = '#F0F4FF';
const TEXT_MUTED = '#5A6A82';
const GREEN = '#22C55E';
const BLUE = '#60C8FF';
const YELLOW = '#FACC15';
const ORANGE = '#F97316';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CLIP_COL = (SCREEN_WIDTH - 40 - 8) / 3;

// ── Helpers ───────────────────────────────────────────────────────────────────
const capitalize = (s?: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';
const formatEnum = (s?: string) => s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—';

// ── Sub-components ────────────────────────────────────────────────────────────
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
    row: { flexDirection: 'row', alignItems: 'center', marginVertical: 14, gap: 10 },
    line: { flex: 1, height: 1, backgroundColor: BORDER },
    text: { fontSize: 10, fontWeight: '700', color: TEXT_MUTED, letterSpacing: 1.2 },
});

function StatCard({ icon, value, label, color = ACCENT }: {
    icon: string; value: string | number; label: string; color?: string;
}) {
    return (
        <View style={[stS.card, { borderColor: color + '30' }]}>
            <Ionicons name={icon as any} size={18} color={color} />
            <Text style={[stS.value, { color }]}>{value}</Text>
            <Text style={stS.label}>{label}</Text>
        </View>
    );
}
const stS = StyleSheet.create({
    card: { flex: 1, backgroundColor: SURFACE2, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6 },
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
    row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: BORDER },
    iconBox: { width: 30, height: 30, borderRadius: 9, backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center' },
    label: { flex: 1, fontSize: 13, color: TEXT_MUTED, fontWeight: '500' },
    value: { fontSize: 13, color: TEXT_PRIMARY, fontWeight: '700', maxWidth: '55%', textAlign: 'right' },
});

function Tag({ label, color = ACCENT }: { label: string; color?: string }) {
    return (
        <View style={[tg.wrap, { backgroundColor: color + '15', borderColor: color + '40' }]}>
            <Text style={[tg.text, { color }]}>{label}</Text>
        </View>
    );
}
const tg = StyleSheet.create({
    wrap: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, marginRight: 6, marginBottom: 6 },
    text: { fontSize: 12, fontWeight: '700' },
});

// ── Clip grid cell ────────────────────────────────────────────────────────────
function ClipCell({ item, onPress }: { item: any; onPress: () => void }) {
    return (
        <TouchableOpacity
            style={{ width: CLIP_COL, aspectRatio: 9 / 16, borderRadius: 10, overflow: 'hidden', backgroundColor: SURFACE2, marginBottom: 4 }}
            onPress={onPress}
            activeOpacity={0.88}
        >
            <Image source={{ uri: item.thumbnailUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            <LinearGradient colors={['transparent', 'rgba(8,12,20,0.9)']} style={StyleSheet.absoluteFillObject} />
            {/* Play icon */}
            <View style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="play" size={12} color="#fff" />
            </View>
            {/* Duration */}
            <Text style={{ position: 'absolute', bottom: 6, left: 7, fontSize: 9, color: '#fff', fontWeight: '700' }}>
                {item.duration ? `${Math.round(item.duration)}s` : ''}
            </Text>
            {/* Likes */}
            <View style={{ position: 'absolute', bottom: 6, right: 7, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Ionicons name="heart" size={9} color="#FF4D6D" />
                <Text style={{ fontSize: 9, color: '#fff', fontWeight: '700' }}>{item.likes ?? 0}</Text>
            </View>
        </TouchableOpacity>
    );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
function TabBar({ active, onChange }: { active: 'clips' | 'info'; onChange: (t: 'clips' | 'info') => void }) {
    const slideAnim = useRef(new Animated.Value(active === 'clips' ? 0 : 1)).current;
    useEffect(() => {
        Animated.spring(slideAnim, { toValue: active === 'clips' ? 0 : 1, useNativeDriver: false, damping: 20, stiffness: 200 }).start();
    }, [active]);
    const left = slideAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '50%'] });

    return (
        <View style={tabS.container}>
            <Animated.View style={[tabS.slider, { left }]} />
            <TouchableOpacity style={tabS.tab} onPress={() => onChange('clips')} activeOpacity={0.8}>
                <Ionicons name="film-outline" size={14} color={active === 'clips' ? BG : TEXT_MUTED} style={{ marginRight: 5 }} />
                <Text style={[tabS.label, active === 'clips' && tabS.labelActive]}>Clips</Text>
            </TouchableOpacity>
            <TouchableOpacity style={tabS.tab} onPress={() => onChange('info')} activeOpacity={0.8}>
                <Ionicons name="person-outline" size={14} color={active === 'info' ? BG : TEXT_MUTED} style={{ marginRight: 5 }} />
                <Text style={[tabS.label, active === 'info' && tabS.labelActive]}>Player Info</Text>
            </TouchableOpacity>
        </View>
    );
}
const tabS = StyleSheet.create({
    container: {
        flexDirection: 'row', backgroundColor: SURFACE2, borderRadius: 14,
        borderWidth: 1.5, borderColor: BORDER, padding: 4, position: 'relative', overflow: 'hidden',
        marginHorizontal: 20, marginBottom: 16,
    },
    slider: {
        position: 'absolute', top: 4, bottom: 4, width: '50%',
        backgroundColor: ACCENT, borderRadius: 10,
    },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, zIndex: 1 },
    label: { fontSize: 13, fontWeight: '700', color: TEXT_MUTED },
    labelActive: { color: BG },
});

// ── Clips tab content ─────────────────────────────────────────────────────────
function ClipsTab({ vids, onOpenClip }: { vids: any[]; onOpenClip: (v: any) => void }) {
    if (vids.length === 0) {
        return (
            <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                    <Ionicons name="film-outline" size={28} color={TEXT_MUTED} />
                </View>
                <Text style={styles.emptyTitle}>No clips yet</Text>
                <Text style={styles.emptyBody}>This player hasn't uploaded any clips.</Text>
            </View>
        );
    }
    const totalLikes = vids.reduce((s: number, v: any) => s + (v.likes ?? 0), 0);
    return (
        <View style={{ paddingHorizontal: 20 }}>
            {/* Stats strip */}
            <View style={clipTabS.statsStrip}>
                <View style={clipTabS.statItem}>
                    <Text style={clipTabS.statNum}>{vids.length}</Text>
                    <Text style={clipTabS.statLbl}>All Clips</Text>
                </View>
                <View style={clipTabS.divider} />
                <View style={clipTabS.statItem}>
                    <Text style={clipTabS.statNum}>{totalLikes}</Text>
                    <Text style={clipTabS.statLbl}>Total Likes</Text>
                </View>
                <View style={clipTabS.divider} />
                <View style={clipTabS.statItem}>
                    <Text style={clipTabS.statNum}>
                        {vids.length ? (totalLikes / vids.length).toFixed(1) : '0'}
                    </Text>
                    <Text style={clipTabS.statLbl}>Avg Likes</Text>
                </View>
            </View>
            {/* Section label */}
            <View style={clipTabS.sectionRow}>
                <View style={clipTabS.sectionBar} />
                <Ionicons name="film-outline" size={12} color={ACCENT} style={{ marginRight: 5 }} />
                <Text style={clipTabS.sectionLabel}>ALL CLIPS ({vids.length})</Text>
            </View>
            {/* Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {vids.map((v: any) => (
                    <ClipCell key={v._id} item={v} onPress={() => onOpenClip(v)} />
                ))}
            </View>
        </View>
    );
}
const clipTabS = StyleSheet.create({
    statsStrip: {
        flexDirection: 'row', backgroundColor: SURFACE, borderRadius: 14,
        borderWidth: 1.5, borderColor: BORDER, marginBottom: 12, overflow: 'hidden',
    },
    statItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
    statNum: { fontSize: 18, fontWeight: '900', color: TEXT_PRIMARY, letterSpacing: -0.5 },
    statLbl: { fontSize: 9, color: TEXT_MUTED, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 3 },
    divider: { width: 1, backgroundColor: BORDER, marginVertical: 8 },
    sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    sectionBar: { width: 3, height: 13, borderRadius: 2, backgroundColor: ACCENT, marginRight: 7 },
    sectionLabel: { fontSize: 10, color: TEXT_MUTED, fontWeight: '700', letterSpacing: 1.3 },
});

// ── Player Info tab content ───────────────────────────────────────────────────
function InfoTab({ prof, u }: { prof: any; u: any }) {
    if (!prof) {
        return (
            <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                    <Ionicons name="person-outline" size={28} color={TEXT_MUTED} />
                </View>
                <Text style={styles.emptyTitle}>No profile yet</Text>
                <Text style={styles.emptyBody}>This player hasn't filled in their profile information.</Text>
            </View>
        );
    }
    return (
        <View style={{ paddingHorizontal: 20 }}>
            {/* Key stats */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                <StatCard icon="trending-up-outline" value={prof.kd_ratio?.toFixed(2) ?? '—'} label="K/D Ratio" color={ACCENT} />
                <StatCard icon="flash-outline" value={prof.average_damage ?? '—'} label="Avg Damage" color={ORANGE} />
                <StatCard icon="time-outline" value={prof.years_experience ? `${prof.years_experience}yr` : '—'} label="Exp." color={BLUE} />
            </View>

            {/* Bio */}
            {prof.bio && (
                <View style={infoS.bioBox}>
                    <Ionicons name="chatbubble-ellipses-outline" size={14} color={ACCENT} style={{ marginBottom: 6 }} />
                    <Text style={infoS.bioText}>{prof.bio}</Text>
                </View>
            )}

            {/* Basic info */}
            <SectionTitle label="Profile Info" />
            <InfoRow icon="globe-outline" label="Country" value={capitalize(prof.country)} />
            <InfoRow icon="calendar-outline" label="Age" value={prof.age ? `${prof.age} years` : undefined} />
            <InfoRow icon="person-outline" label="Gender" value={formatEnum(prof.gender)} />
            <InfoRow icon="phone-portrait-outline" label="Device" value={capitalize(prof.device)} />
            <InfoRow icon="hand-left-outline" label="Finger Setup" value={formatEnum(prof.finger_setup)} />
            <InfoRow icon="shield-outline" label="Playing Style" value={capitalize(prof.playing_style)} />

            {/* Roles */}
            {prof.roles?.length > 0 && (
                <>
                    <SectionTitle label="Roles" />
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                        {prof.roles.map((r: string) => <Tag key={r} label={r} color={ACCENT} />)}
                    </View>
                </>
            )}

            {/* Maps */}
            {prof.preferred_maps?.length > 0 && (
                <>
                    <SectionTitle label="Preferred Maps" />
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                        {prof.preferred_maps.map((m: string) => <Tag key={m} label={m} color={BLUE} />)}
                    </View>
                </>
            )}

            {/* Tournaments */}
            {prof.tournaments_played?.length > 0 && (
                <>
                    <SectionTitle label="Tournaments" />
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                        {prof.tournaments_played.map((t: string) => <Tag key={t} label={t} color={YELLOW} />)}
                    </View>
                </>
            )}

            {/* Socials */}
            {(prof.youtube_url || prof.instagram_url) && (
                <>
                    <SectionTitle label="Socials" />
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        {prof.youtube_url && (
                            <TouchableOpacity style={[infoS.socialBtn, { borderColor: '#FF000050' }]} onPress={() => Linking.openURL(prof.youtube_url!)}>
                                <Ionicons name="logo-youtube" size={18} color="#FF0000" />
                                <Text style={[infoS.socialLabel, { color: '#FF0000' }]}>YouTube</Text>
                            </TouchableOpacity>
                        )}
                        {prof.instagram_url && (
                            <TouchableOpacity style={[infoS.socialBtn, { borderColor: '#E1306C50' }]} onPress={() => Linking.openURL(prof.instagram_url!)}>
                                <Ionicons name="logo-instagram" size={18} color="#E1306C" />
                                <Text style={[infoS.socialLabel, { color: '#E1306C' }]}>Instagram</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </>
            )}
        </View>
    );
}
const infoS = StyleSheet.create({
    bioBox: { backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1, borderColor: BORDER, padding: 14, marginBottom: 4 },
    bioText: { fontSize: 13, color: TEXT_MUTED, lineHeight: 20 },
    socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, borderWidth: 1.5, paddingVertical: 13, backgroundColor: SURFACE },
    socialLabel: { fontSize: 14, fontWeight: '700' },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function PlayerProfileScreen() {
    const params = useLocalSearchParams<{ profileId: string; playerName?: string }>();
    const router = useRouter();

    const [data, setData] = useState<PublicUserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [previewVideo, setPreviewVideo] = useState<any | null>(null);
    const [activeTab, setActiveTab] = useState<'clips' | 'info'>('clips');

    const load = useCallback(async () => {
        if (!params.profileId) return;
        try {
            setLoading(true);
            const result = await getPublicProfile(params.profileId);
            setData(result);
        } catch (err: any) {
            Toast.show({ type: 'error', text1: err?.response?.data?.message ?? 'Failed to load profile' });
        } finally {
            setLoading(false);
        }
    }, [params.profileId]);

    useEffect(() => { void load(); }, [load]);

    const prof = data?.playerProfile;
    const vids = data?.videos ?? [];
    const u = data?.user;

    if (loading) {
        return (
            <View style={styles.root}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color={TEXT_PRIMARY} />
                </TouchableOpacity>
                <View style={styles.loadingCenter}>
                    <ActivityIndicator color={ACCENT} size="large" />
                    <Text style={styles.loadingText}>Loading profile…</Text>
                </View>
            </View>
        );
    }

    if (!data) {
        return (
            <View style={styles.root}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color={TEXT_PRIMARY} />
                </TouchableOpacity>
                <View style={styles.loadingCenter}>
                    <Ionicons name="person-outline" size={48} color={BORDER} />
                    <Text style={{ color: TEXT_MUTED, marginTop: 12 }}>Profile not found</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.root}>
            {/* Glows */}
            <View style={[styles.glow, { top: -80, right: -80, backgroundColor: ACCENT, opacity: 0.05 }]} />
            <View style={[styles.glow, { bottom: -100, left: -80, backgroundColor: BLUE, opacity: 0.04 }]} />

            {/* Back button */}
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={22} color={TEXT_PRIMARY} />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

                {/* ── Hero section ── */}
                <LinearGradient
                    colors={['#0C1910', '#080C14']}
                    style={styles.hero}
                >
                    {/* Avatar */}
                    {u?.avatarUrl ? (
                        <Image source={{ uri: u.avatarUrl }} style={styles.heroAvatar} />
                    ) : (
                        <View style={styles.heroAvatarFallback}>
                            <Text style={styles.heroAvatarInitial}>{(u?.username ?? '?')[0].toUpperCase()}</Text>
                        </View>
                    )}

                    {/* Name & badge */}
                    <Text style={styles.heroUsername}>@{u?.username ?? '—'}</Text>
                    {u?.role && (
                        <View style={styles.roleBadge}>
                            <Ionicons name={u.role === 'player' ? 'person' : 'business'} size={12} color={ACCENT} />
                            <Text style={styles.roleBadgeText}>{capitalize(u.role)}</Text>
                        </View>
                    )}
                    {prof && (
                        <Text style={styles.heroGameId}>🎮 {prof.game_id}</Text>
                    )}

                    {/* Quick stats */}
                    <View style={styles.heroQuickStats}>
                        <View style={styles.heroStatItem}>
                            <Text style={styles.heroStatNum}>{vids.length}</Text>
                            <Text style={styles.heroStatLbl}>Clips</Text>
                        </View>
                        <View style={styles.heroStatDiv} />
                        <View style={styles.heroStatItem}>
                            <Text style={styles.heroStatNum}>{vids.reduce((s, v) => s + (v.likes ?? 0), 0)}</Text>
                            <Text style={styles.heroStatLbl}>Likes</Text>
                        </View>
                        {prof && (
                            <>
                                <View style={styles.heroStatDiv} />
                                <View style={styles.heroStatItem}>
                                    <Text style={styles.heroStatNum}>{prof.kd_ratio?.toFixed(1) ?? '—'}</Text>
                                    <Text style={styles.heroStatLbl}>K/D</Text>
                                </View>
                                <View style={styles.heroStatDiv} />
                                <View style={styles.heroStatItem}>
                                    <Text style={styles.heroStatNum}>{prof.average_damage ?? '—'}</Text>
                                    <Text style={styles.heroStatLbl}>DMG</Text>
                                </View>
                            </>
                        )}
                    </View>
                </LinearGradient>

                {/* ── Tab bar ── */}
                <TabBar active={activeTab} onChange={setActiveTab} />

                {/* ── Tab content ── */}
                {activeTab === 'clips' ? (
                    <ClipsTab vids={vids} onOpenClip={setPreviewVideo} />
                ) : (
                    <InfoTab prof={prof} u={u} />
                )}
            </ScrollView>

            {/* ── Video preview modal ── */}
            <Modal visible={!!previewVideo} transparent={false} animationType="fade" statusBarTranslucent onRequestClose={() => setPreviewVideo(null)}>
                <View style={{ flex: 1, backgroundColor: '#000' }}>
                    {previewVideo && (
                        <Video
                            source={{ uri: previewVideo.videoUrl }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode={ResizeMode.CONTAIN}
                            shouldPlay
                            isLooping
                            useNativeControls
                        />
                    )}
                    <TouchableOpacity
                        style={{ position: 'absolute', top: 50, left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}
                        onPress={() => setPreviewVideo(null)}
                    >
                        <Ionicons name="close" size={20} color="#fff" />
                    </TouchableOpacity>
                    {previewVideo?.caption ? (
                        <View style={{ position: 'absolute', bottom: 60, left: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 12 }}>
                            <Text style={{ fontSize: 13, color: '#fff', lineHeight: 18 }}>{previewVideo.caption}</Text>
                        </View>
                    ) : null}
                </View>
            </Modal>
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    glow: { position: 'absolute', width: 280, height: 280, borderRadius: 140 },
    backBtn: {
        position: 'absolute', top: 52, left: 20, zIndex: 10,
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: 'rgba(15,21,33,0.9)', borderWidth: 1, borderColor: BORDER,
        alignItems: 'center', justifyContent: 'center',
    },
    loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { color: TEXT_MUTED, fontSize: 14 },

    // Hero
    hero: {
        alignItems: 'center', paddingTop: 72, paddingBottom: 20,
        paddingHorizontal: 20, marginBottom: 12,
    },
    heroAvatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2.5, borderColor: ACCENT },
    heroAvatarFallback: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: SURFACE2,
        borderWidth: 2.5, borderColor: ACCENT, alignItems: 'center', justifyContent: 'center',
    },
    heroAvatarInitial: { fontSize: 28, fontWeight: '900', color: ACCENT },
    heroUsername: { fontSize: 22, fontWeight: '900', color: TEXT_PRIMARY, marginTop: 12, letterSpacing: -0.5 },
    heroGameId: { fontSize: 13, color: TEXT_MUTED, marginTop: 4 },
    roleBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: '#1C2C10', borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 5,
        borderWidth: 1, borderColor: '#2A3C10', marginTop: 6,
    },
    roleBadgeText: { fontSize: 11, color: ACCENT, fontWeight: '700' },
    heroQuickStats: {
        flexDirection: 'row', alignItems: 'center', marginTop: 18,
        backgroundColor: 'rgba(15,21,33,0.8)', borderRadius: 16,
        borderWidth: 1, borderColor: BORDER,
        paddingVertical: 12, paddingHorizontal: 16, alignSelf: 'stretch',
    },
    heroStatItem: { flex: 1, alignItems: 'center', gap: 3 },
    heroStatNum: { fontSize: 16, fontWeight: '900', color: TEXT_PRIMARY },
    heroStatLbl: { fontSize: 9, color: TEXT_MUTED, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    heroStatDiv: { width: 1, height: 28, backgroundColor: BORDER },

    // Empty state
    emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 20 },
    emptyIcon: {
        width: 64, height: 64, borderRadius: 20, backgroundColor: SURFACE,
        borderWidth: 1.5, borderColor: BORDER, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    },
    emptyTitle: { fontSize: 16, fontWeight: '800', color: TEXT_PRIMARY, marginBottom: 6 },
    emptyBody: { fontSize: 13, color: TEXT_MUTED, textAlign: 'center', lineHeight: 19 },
});
