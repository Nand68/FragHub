import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Pressable,
} from 'react-native';
import { Text } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import {
  Notification,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../services/notification.service';
import { useSocket } from '../../context/SocketContext';

// ── Design tokens ──────────────────────────────────────────────────────────────
const ACCENT = '#C8F135';
const BG = '#080C14';
const SURFACE = '#0F1521';
const SURFACE2 = '#0A1020';
const BORDER = '#1C2535';
const TEXT_PRIMARY = '#F0F4FF';
const TEXT_MUTED = '#5A6A82';

// ── Notification type config ───────────────────────────────────────────────────
type NotifStyle = { icon: string; color: string; bg: string; border: string };

function getNotifStyle(type: string): NotifStyle {
  const t = type?.toLowerCase() ?? '';
  if (t.includes('application') || t.includes('apply'))
    return { icon: 'paper-plane-outline', color: ACCENT, bg: '#1C2C10', border: '#2A3C10' };
  if (t.includes('scout') || t.includes('scouting'))
    return { icon: 'search-outline', color: '#60C8FF', bg: '#0A1828', border: '#1A3A60' };
  if (t.includes('select') || t.includes('accept'))
    return { icon: 'checkmark-circle-outline', color: '#22C55E', bg: '#0A1A0A', border: '#14532d' };
  if (t.includes('reject') || t.includes('deny'))
    return { icon: 'close-circle-outline', color: '#FF4D4D', bg: '#160808', border: '#4A1010' };
  if (t.includes('org') || t.includes('organization'))
    return { icon: 'business-outline', color: '#A78BFA', bg: '#130F1E', border: '#2A1F4A' };
  if (t.includes('profile'))
    return { icon: 'person-circle-outline', color: ACCENT, bg: '#1C2C10', border: '#2A3C10' };
  return { icon: 'notifications-outline', color: TEXT_MUTED, bg: SURFACE2, border: BORDER };
}

function fmtTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

// ── Notification item ──────────────────────────────────────────────────────────
function NotifItem({
  n,
  onPress,
}: {
  n: Notification;
  onPress: () => void;
}) {
  const style = getNotifStyle(n.type);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (n.isRead) return;
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.6, duration: 80, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Pressable onPress={handlePress} style={[
        niS.wrapper,
        !n.isRead && niS.wrapperUnread,
        !n.isRead && { borderLeftColor: style.color },
      ]}>
        {/* Icon */}
        <View style={[niS.iconWrap, { backgroundColor: style.bg, borderColor: style.border }]}>
          <Ionicons name={style.icon as any} size={18} color={style.color} />
        </View>

        {/* Content */}
        <View style={niS.body}>
          <View style={niS.topRow}>
            <Text style={niS.type}>{n.type?.replace(/_/g, ' ') ?? 'Notification'}</Text>
            <View style={niS.rightRow}>
              {(n as any).createdAt && (
                <Text style={niS.time}>{fmtTime((n as any).createdAt)}</Text>
              )}
              {!n.isRead && <View style={[niS.unreadDot, { backgroundColor: style.color }]} />}
            </View>
          </View>
          <Text style={niS.message} numberOfLines={3}>{n.message}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const niS = StyleSheet.create({
  wrapper: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: SURFACE, borderRadius: 16,
    borderWidth: 1.5, borderColor: BORDER,
    borderLeftWidth: 1.5,
    padding: 14, marginBottom: 10, gap: 12,
  },
  wrapperUnread: {
    backgroundColor: '#0C1320',
    borderLeftWidth: 3,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, flexShrink: 0,
  },
  body: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  type: { fontSize: 11, color: TEXT_MUTED, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', flex: 1 },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  time: { fontSize: 11, color: TEXT_MUTED },
  unreadDot: { width: 7, height: 7, borderRadius: 4 },
  message: { fontSize: 13, color: TEXT_PRIMARY, lineHeight: 19, fontWeight: '400' },
});

// ── Main screen ────────────────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const load = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message ?? 'Failed to load' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void load();
  }, []);

  // Real-time: new notification pushed from backend
  useEffect(() => {
    if (!socket) return;
    const handler = (notif: Notification) => {
      setNotifications((prev) => {
        const exists = prev.some((n) => n._id === notif._id);
        return exists ? prev : [notif, ...prev];
      });
    };
    socket.on('notification:new', handler);
    return () => { socket.off('notification:new', handler); };
  }, [socket]);

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  const onMarkRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch {
      // silent
    }
  };

  const onMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      Toast.show({ type: 'success', text1: 'All caught up!' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message ?? 'Failed' });
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const unread = notifications.filter((n) => !n.isRead);
  const read = notifications.filter((n) => n.isRead);

  return (
    <View style={styles.root}>
      <View style={styles.glowTop} pointerEvents="none" />

      <ScrollView
        style={styles.scroll}
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
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>Notifications</Text>
            <Text style={styles.pageSubtitle}>
              {unreadCount > 0 ? `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}` : 'All caught up ✓'}
            </Text>
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={onMarkAllRead}
              disabled={markingAll}
              style={[styles.markAllBtn, markingAll && { opacity: 0.5 }]}
              activeOpacity={0.75}
            >
              <Ionicons name="checkmark-done-outline" size={14} color={ACCENT} />
              <Text style={styles.markAllText}>{markingAll ? 'Marking…' : 'Mark all'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Unread count badge */}
        {unreadCount > 0 && (
          <View style={styles.unreadBanner}>
            <View style={styles.unreadBannerDot} />
            <Text style={styles.unreadBannerText}>{unreadCount} new notification{unreadCount !== 1 ? 's' : ''}</Text>
          </View>
        )}

        {loading ? (
          <LoadingSpinner message="Loading notifications…" />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="notifications-off-outline" size={32} color={TEXT_MUTED} />
            </View>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySubtitle}>Updates about your applications and scoutings will appear here.</Text>
          </View>
        ) : (
          <>
            {/* Unread group */}
            {unread.length > 0 && (
              <View style={styles.group}>
                {unread.map((n) => (
                  <NotifItem key={n._id} n={n} onPress={() => onMarkRead(n._id)} />
                ))}
              </View>
            )}

            {/* Read group */}
            {read.length > 0 && (
              <View style={styles.group}>
                {unread.length > 0 && (
                  <View style={styles.groupHeader}>
                    <View style={styles.groupDivider} />
                    <Text style={styles.groupLabel}>Earlier</Text>
                    <View style={styles.groupDivider} />
                  </View>
                )}
                {read.map((n) => (
                  <NotifItem key={n._id} n={n} onPress={() => { }} />
                ))}
              </View>
            )}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  glowTop: {
    position: 'absolute', top: -60, right: -60,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: ACCENT, opacity: 0.04,
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 32 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 20,
  },
  pageTitle: { fontSize: 26, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, color: TEXT_MUTED, marginTop: 4 },
  markAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1C2C10', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: '#2A3C10',
  },
  markAllText: { fontSize: 12, color: ACCENT, fontWeight: '700' },

  // Unread banner
  unreadBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1C2C10', borderRadius: 12,
    borderWidth: 1, borderColor: '#2A3C10',
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16,
  },
  unreadBannerDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: ACCENT },
  unreadBannerText: { fontSize: 13, color: ACCENT, fontWeight: '600' },

  // Groups
  group: { marginBottom: 8 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 6 },
  groupDivider: { flex: 1, height: 1, backgroundColor: BORDER },
  groupLabel: { fontSize: 11, color: TEXT_MUTED, fontWeight: '600', letterSpacing: 0.6 },

  // Empty
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: SURFACE, borderWidth: 1.5, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: TEXT_PRIMARY },
  emptySubtitle: { fontSize: 13, color: TEXT_MUTED, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
});