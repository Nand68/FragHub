import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    Platform,
    Pressable,
    StatusBar,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { useFocusEffect, useRouter } from 'expo-router';
import {
    VideoItem,
    getRandomVideos,
    uploadVideo,
    toggleLike,
} from '../../services/video.service';
import { useAuth } from '../../context/AuthContext';

// ── Tokens ───────────────────────────────────────────────────────────────────
const ACCENT = '#C8F135';
const BG = '#080C14';
const SURFACE = '#0F1521';
const SURFACE2 = '#0A1020';
const BORDER = '#1C2535';
const TEXT_PRIMARY = '#F0F4FF';
const TEXT_MUTED = '#5A6A82';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ITEM_HEIGHT = SCREEN_HEIGHT;

// ── Single reel card ──────────────────────────────────────────────────────────
const ReelCard = React.memo(function ReelCard({
    item,
    isActive,
    onLike,
    onPressUser,
}: {
    item: VideoItem;
    isActive: boolean;
    onLike: (id: string) => void;
    onPressUser: (userId: string) => void;
}) {
    const videoRef = useRef<Video>(null);
    const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
    const [liked, setLiked] = useState(false);
    const [localLikes, setLocalLikes] = useState(item.likes ?? 0);

    useEffect(() => {
        if (!videoRef.current) return;
        if (isActive) {
            videoRef.current.playAsync().catch(() => { });
        } else {
            videoRef.current.pauseAsync().catch(() => { });
            videoRef.current.setPositionAsync(0).catch(() => { });
        }
    }, [isActive]);

    const handleLike = useCallback(() => {
        const newLiked = !liked;
        setLiked(newLiked);
        setLocalLikes((prev) => prev + (newLiked ? 1 : -1));
        onLike(item._id);
    }, [liked, item._id, onLike]);

    const isLoaded = status && 'isLoaded' in status && status.isLoaded;
    const isBuffering = isActive && (!isLoaded || (isLoaded && !(status as any).isPlaying && !(status as any).positionMillis));

    const username = item.user?.email?.split('@')[0] ?? 'player';

    return (
        <View style={styles.card}>
            {/* Video — CONTAIN keeps proper aspect ratio, no zoom distortion */}
            <Video
                ref={videoRef}
                source={{ uri: item.videoUrl }}
                style={styles.videoFill}
                resizeMode={ResizeMode.CONTAIN}
                isLooping
                shouldPlay={false}
                onPlaybackStatusUpdate={setStatus}
                isMuted={false}
            />

            {/* Gradient overlays */}
            <LinearGradient
                colors={['rgba(8,12,20,0.55)', 'transparent']}
                style={styles.topOverlay}
                pointerEvents="none"
            />
            <LinearGradient
                colors={['transparent', 'rgba(8,12,20,0.92)']}
                style={styles.bottomOverlay}
                pointerEvents="none"
            />

            {/* Loading spinner */}
            {isBuffering && (
                <View style={styles.loaderWrap} pointerEvents="none">
                    <ActivityIndicator color={ACCENT} size="large" />
                </View>
            )}

            {/* Bottom info — left side */}
            <View style={styles.bottomInfo}>
                <TouchableOpacity
                    style={styles.userRow}
                    onPress={() => onPressUser(item.user?._id ?? item.userId)}
                    activeOpacity={0.8}
                >
                    {item.user?.avatarUrl ? (
                        <Image source={{ uri: item.user.avatarUrl }} style={styles.avatarImg} />
                    ) : (
                        <View style={styles.avatarCircle}>
                            <Ionicons name="person" size={14} color={ACCENT} />
                        </View>
                    )}
                    <Text style={styles.username}>@{item.user?.username ?? item.user?.email?.split('@')[0] ?? 'player'}</Text>
                </TouchableOpacity>
                {!!item.caption && (
                    <Text style={styles.caption} numberOfLines={2}>
                        {item.caption}
                    </Text>
                )}
                <View style={styles.statsRow}>
                    <Ionicons name="heart" size={13} color={TEXT_MUTED} />
                    <Text style={styles.statText}>{localLikes}</Text>
                    <View style={{ width: 12 }} />
                    <Ionicons name="time-outline" size={13} color={TEXT_MUTED} />
                    <Text style={styles.statText}>
                        {item.duration ? `${Math.round(item.duration)}s` : ''}
                    </Text>
                </View>
            </View>

            {/* Right actions — like & share only (FAB upload moved to header) */}
            <View style={styles.rightActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.8}>
                    <View style={[styles.actionBtnBg, liked && styles.actionBtnBgLiked]}>
                        <Ionicons
                            name={liked ? 'heart' : 'heart-outline'}
                            size={24}
                            color={liked ? '#FF4D6D' : TEXT_PRIMARY}
                        />
                    </View>
                    <Text style={[styles.actionLabel, liked && { color: '#FF4D6D' }]}>
                        {localLikes}
                    </Text>
                </TouchableOpacity>
                <View style={styles.actionBtn}>
                    <View style={styles.actionBtnBg}>
                        <Ionicons name="share-social-outline" size={22} color={TEXT_PRIMARY} />
                    </View>
                    <Text style={styles.actionLabel}>Share</Text>
                </View>
            </View>
        </View>
    );
});

// ── Upload modal ──────────────────────────────────────────────────────────────
function UploadModal({
    visible,
    onClose,
    onUploaded,
}: {
    visible: boolean;
    onClose: () => void;
    onUploaded: () => void;
}) {
    const [step, setStep] = useState<'pick' | 'caption' | 'uploading'>('pick');
    const [pickedVideo, setPickedVideo] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [caption, setCaption] = useState('');

    const reset = () => {
        setStep('pick');
        setPickedVideo(null);
        setCaption('');
    };

    const handlePickVideo = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Please allow media library access.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: false,
            quality: 1,
        });
        if (!result.canceled && result.assets[0]) {
            setPickedVideo(result.assets[0]);
            setStep('caption');
        }
    };

    const handleUpload = async () => {
        if (!pickedVideo) return;
        setStep('uploading');
        try {
            const uri = pickedVideo.uri;
            const fileName = pickedVideo.fileName ?? `clip_${Date.now()}.mp4`;
            const mimeType = pickedVideo.mimeType ?? 'video/mp4';
            await uploadVideo(uri, fileName, mimeType, caption.trim() || undefined);
            Toast.show({ type: 'success', text1: '🎬 Clip uploaded!', text2: 'It will appear in the feed soon.' });
            onUploaded();
            reset();
            onClose();
        } catch (err: any) {
            setStep('caption');
            Toast.show({ type: 'error', text1: err?.response?.data?.message ?? 'Upload failed' });
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={modalStyles.backdrop}>
                <View style={modalStyles.sheet}>
                    {/* Handle */}
                    <View style={modalStyles.handle} />

                    {step === 'pick' && (
                        <>
                            <Text style={modalStyles.title}>Upload a Clip</Text>
                            <Text style={modalStyles.sub}>Share your gameplay moments with the community</Text>
                            <TouchableOpacity style={modalStyles.pickBtn} onPress={handlePickVideo} activeOpacity={0.85}>
                                <LinearGradient colors={[ACCENT, '#9BC713']} style={modalStyles.pickGrad}>
                                    <Ionicons name="videocam" size={28} color={BG} />
                                    <Text style={modalStyles.pickText}>Choose from Gallery</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
                                <Text style={modalStyles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {step === 'caption' && (
                        <>
                            <Text style={modalStyles.title}>Add a Caption</Text>
                            <View style={modalStyles.videoPreviewRow}>
                                <Ionicons name="film-outline" size={22} color={ACCENT} />
                                <Text style={modalStyles.videoName} numberOfLines={1}>
                                    {pickedVideo?.fileName ?? 'clip.mp4'}
                                </Text>
                            </View>
                            <View style={modalStyles.inputWrap}>
                                <TextInput
                                    style={modalStyles.input}
                                    placeholder="Describe your clip... (optional)"
                                    placeholderTextColor={TEXT_MUTED}
                                    value={caption}
                                    onChangeText={setCaption}
                                    multiline
                                    maxLength={500}
                                />
                            </View>
                            <Text style={modalStyles.charCount}>{caption.length}/500</Text>
                            <TouchableOpacity style={modalStyles.uploadBtn} onPress={handleUpload} activeOpacity={0.85}>
                                <LinearGradient colors={[ACCENT, '#9BC713']} style={modalStyles.pickGrad}>
                                    <Ionicons name="cloud-upload-outline" size={20} color={BG} />
                                    <Text style={modalStyles.pickText}>Upload Clip</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                            <TouchableOpacity style={modalStyles.cancelBtn} onPress={() => setStep('pick')}>
                                <Text style={modalStyles.cancelText}>Back</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {step === 'uploading' && (
                        <View style={modalStyles.uploadingWrap}>
                            <ActivityIndicator size="large" color={ACCENT} />
                            <Text style={modalStyles.uploadingText}>Uploading your clip…</Text>
                            <Text style={modalStyles.uploadingSub}>This may take a moment for large files</Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function VideosScreen() {
    const { user } = useAuth();
    const isOrg = user?.role?.toLowerCase() === 'organization';
    const router = useRouter();
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [uploadVisible, setUploadVisible] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const loadFeed = useCallback(async () => {
        try {
            const data = await getRandomVideos(15);
            setVideos(data);
        } catch (err: any) {
            Toast.show({ type: 'error', text1: err?.response?.data?.message ?? 'Failed to load feed' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Pause everything when screen loses focus
    useFocusEffect(
        useCallback(() => {
            loadFeed();
            return () => setActiveIndex(-1);
        }, [loadFeed])
    );

    const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index ?? 0);
        }
    }, []);

    // minimumViewTime prevents rapid start/stop when scrolling fast
    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 70,
        minimumViewTime: 150,
    }).current;

    const handleLike = useCallback(async (id: string) => {
        try {
            await toggleLike(id);
        } catch {
            // Local state already updated; silently ignore
        }
    }, []);

    const handlePressUser = useCallback((userId: string) => {
        router.push({ pathname: '/player-profile' as any, params: { profileId: userId } });
    }, [router]);

    const renderItem = useCallback(
        ({ item, index }: { item: VideoItem; index: number }) => (
            <ReelCard item={item} isActive={index === activeIndex} onLike={handleLike} onPressUser={handlePressUser} />
        ),
        [activeIndex, handleLike, handlePressUser]
    );

    const keyExtractor = useCallback((item: VideoItem) => item._id, []);

    if (loading) {
        return (
            <View style={styles.centerScreen}>
                <StatusBar barStyle="light-content" backgroundColor={BG} />
                <ActivityIndicator color={ACCENT} size="large" />
                <Text style={styles.loadingText}>Loading clips…</Text>
            </View>
        );
    }

    if (!loading && videos.length === 0) {
        return (
            <View style={styles.centerScreen}>
                <StatusBar barStyle="light-content" backgroundColor={BG} />
                <Ionicons name="film-outline" size={56} color={BORDER} />
                <Text style={styles.emptyTitle}>No clips yet</Text>
                <Text style={styles.emptySubtitle}>Be the first to upload a gameplay clip!</Text>
                {!isOrg && (
                    <TouchableOpacity
                        style={styles.emptyUploadBtn}
                        onPress={() => setUploadVisible(true)}
                        activeOpacity={0.85}
                    >
                        <LinearGradient colors={[ACCENT, '#9BC713']} style={styles.emptyUploadGrad}>
                            <Ionicons name="cloud-upload-outline" size={18} color={BG} />
                            <Text style={styles.emptyUploadText}>Upload Clip</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}
                <UploadModal
                    visible={uploadVisible}
                    onClose={() => setUploadVisible(false)}
                    onUploaded={loadFeed}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Header — upload (+) moved here so it never overlaps right-side action buttons */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Clips</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.refreshBtn}
                        onPress={async () => {
                            setRefreshing(true);
                            await loadFeed();
                        }}
                        activeOpacity={0.8}
                    >
                        {refreshing
                            ? <ActivityIndicator color={ACCENT} size="small" />
                            : <Ionicons name="refresh" size={18} color={TEXT_MUTED} />
                        }
                    </TouchableOpacity>
                    {/* Upload button — hidden for org accounts */}
                    {!isOrg && (
                        <TouchableOpacity
                            style={styles.uploadHeaderBtn}
                            onPress={() => setUploadVisible(true)}
                            activeOpacity={0.85}
                        >
                            <LinearGradient colors={[ACCENT, '#9BC713']} style={styles.uploadHeaderGrad}>
                                <Ionicons name="add" size={20} color={BG} />
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <FlatList
                ref={flatListRef}
                data={videos}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                pagingEnabled
                snapToInterval={ITEM_HEIGHT}
                snapToAlignment="start"
                decelerationRate="fast"
                showsVerticalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                getItemLayout={(_data, index) => ({
                    length: ITEM_HEIGHT,
                    offset: ITEM_HEIGHT * index,
                    index,
                })}
                onRefresh={() => {
                    setRefreshing(true);
                    loadFeed();
                }}
                refreshing={refreshing}
                // Performance: only render what's needed
                initialNumToRender={2}
                maxToRenderPerBatch={2}
                windowSize={3}
                removeClippedSubviews={Platform.OS === 'android'}
                updateCellsBatchingPeriod={50}
            />

            <UploadModal
                visible={uploadVisible}
                onClose={() => setUploadVisible(false)}
                onUploaded={loadFeed}
            />
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    centerScreen: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { color: TEXT_MUTED, fontSize: 14, marginTop: 8 },

    // Header
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 54 : 44,
        paddingBottom: 12,
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.5 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    refreshBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(15,21,33,0.85)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: BORDER,
    },
    uploadHeaderBtn: { borderRadius: 12 },
    uploadHeaderGrad: {
        width: 40,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: ACCENT,
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },

    // Reel card
    card: { width: SCREEN_WIDTH, height: ITEM_HEIGHT, backgroundColor: '#000' },
    // Video fills the card but CONTAIN keeps proper ratio (letterbox, no zoom)
    videoFill: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
    },
    topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 130, zIndex: 1 },
    bottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 280, zIndex: 1 },
    loaderWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 2 },

    // Bottom info (left side)
    bottomInfo: { position: 'absolute', bottom: 90, left: 16, right: 80, zIndex: 2 },
    userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    avatarCircle: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: SURFACE2, borderWidth: 1.5, borderColor: ACCENT,
        alignItems: 'center', justifyContent: 'center', marginRight: 8,
    },
    avatarImg: {
        width: 32, height: 32, borderRadius: 16,
        borderWidth: 1.5, borderColor: ACCENT, marginRight: 8,
    },
    username: { fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } },
    caption: { fontSize: 13, color: TEXT_PRIMARY, lineHeight: 18, marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } },
    statsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { fontSize: 12, color: TEXT_MUTED, marginLeft: 2 },

    // Right actions — properly spaced from edge so they never overlap content
    rightActions: {
        position: 'absolute', right: 14, bottom: 110, zIndex: 2,
        alignItems: 'center', gap: 18,
    },
    actionBtn: { alignItems: 'center', gap: 5 },
    actionBtnBg: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: 'rgba(15,21,33,0.7)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    actionBtnBgLiked: {
        backgroundColor: 'rgba(255,77,109,0.18)',
        borderColor: 'rgba(255,77,109,0.35)',
    },
    actionLabel: { fontSize: 11, color: TEXT_PRIMARY, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.7)', textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } },

    // Empty state
    emptyTitle: { fontSize: 22, fontWeight: '800', color: TEXT_PRIMARY },
    emptySubtitle: { fontSize: 14, color: TEXT_MUTED, textAlign: 'center', paddingHorizontal: 40 },
    emptyUploadBtn: { marginTop: 8 },
    emptyUploadGrad: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16,
    },
    emptyUploadText: { fontSize: 15, fontWeight: '700', color: BG },
});

const modalStyles = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: '#0C1522', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        borderTopWidth: 1.5, borderColor: BORDER,
        paddingTop: 12, paddingHorizontal: 24,
        paddingBottom: Platform.OS === 'ios' ? 42 : 32,
    },
    handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginBottom: 20 },
    title: { fontSize: 22, fontWeight: '800', color: TEXT_PRIMARY, marginBottom: 8 },
    sub: { fontSize: 14, color: TEXT_MUTED, marginBottom: 28, lineHeight: 20 },
    videoPreviewRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: SURFACE, borderRadius: 12, borderWidth: 1, borderColor: BORDER,
        padding: 14, marginBottom: 16,
    },
    videoName: { fontSize: 13, color: TEXT_PRIMARY, flex: 1 },
    inputWrap: {
        backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER, marginBottom: 6,
    },
    input: {
        color: TEXT_PRIMARY, fontSize: 14, padding: 14,
        minHeight: 80, textAlignVertical: 'top',
    },
    charCount: { fontSize: 11, color: TEXT_MUTED, textAlign: 'right', marginBottom: 20 },
    pickBtn: { marginBottom: 12 },
    pickGrad: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        paddingVertical: 16, borderRadius: 16,
    },
    pickText: { fontSize: 16, fontWeight: '800', color: BG },
    uploadBtn: { marginBottom: 12 },
    cancelBtn: { alignItems: 'center', paddingVertical: 10 },
    cancelText: { fontSize: 14, color: TEXT_MUTED },
    uploadingWrap: { alignItems: 'center', paddingVertical: 32, gap: 16 },
    uploadingText: { fontSize: 18, fontWeight: '700', color: TEXT_PRIMARY },
    uploadingSub: { fontSize: 13, color: TEXT_MUTED, textAlign: 'center' },
});
