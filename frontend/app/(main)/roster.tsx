import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Text } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  RosterPlayer,
  getRoster,
  removePlayerFromRoster,
} from '../../services/organization.service';
import { useSocket } from '../../context/SocketContext';

// ── Design tokens ──────────────────────────────────────────────────────────────
const ACCENT = '#C8F135';
const BG = '#080C14';
const SURFACE = '#0F1521';
const SURFACE2 = '#0A1020';
const BORDER = '#1C2535';
const TEXT_PRIMARY = '#F0F4FF';
const TEXT_MUTED = '#5A6A82';
const RED = '#FF4D4D';

// ── Avatar colors — cycle through for variety ──────────────────────────────────
const AVATAR_COLORS = ['#C8F135', '#60C8FF', '#F97316', '#A78BFA', '#34D399'];
const avatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

// ── Stat bubble ────────────────────────────────────────────────────────────────
function StatBubble({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <View style={sbS.wrapper}>
      <Ionicons name={icon as any} size={12} color={ACCENT} style={{ marginBottom: 3 }} />
      <Text style={sbS.value}>{value}</Text>
      <Text style={sbS.label}>{label}</Text>
    </View>
  );
}
const sbS = StyleSheet.create({
  wrapper: {
    flex: 1, backgroundColor: SURFACE2, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', paddingVertical: 9, paddingHorizontal: 4,
  },
  value: { fontSize: 14, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.3 },
  label: { fontSize: 9, color: TEXT_MUTED, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 2 },
});

// ── Player card ────────────────────────────────────────────────────────────────
function PlayerCard({
  player, removingId, onRemove, onViewProfile,
}: {
  player: any;
  removingId: string | null;
  onRemove: (id: string) => void;
  onViewProfile: (id: string, name: string) => void;
}) {
  const color = avatarColor(player.name ?? 'A');
  const isBusy = removingId === player._id;
  const isAnyBusy = removingId !== null;

  return (
    <TouchableOpacity
      onPress={() => onViewProfile(player._id, player.name ?? 'Player')}
      activeOpacity={0.92}
      style={cardS.wrapper}
    >
      {/* View hint */}
      <View style={cardS.viewHint}>
        <Ionicons name="eye-outline" size={11} color={TEXT_MUTED} style={{ marginRight: 4 }} />
        <Text style={cardS.viewHintText}>Tap to view full profile</Text>
      </View>
      {/* Header row */}
      <View style={cardS.header}>
        <View style={[cardS.avatar, { borderColor: color + '55', backgroundColor: color + '14' }]}>
          <Text style={[cardS.avatarText, { color }]}>
            {(player.name ?? 'U').slice(0, 2).toUpperCase()}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={cardS.name}>{player.name}</Text>
          <Text style={cardS.gameId}>
            <Ionicons name="at-outline" size={11} color={TEXT_MUTED} /> {player.game_id}
          </Text>
        </View>

        {/* Remove button */}
        <TouchableOpacity
          onPress={() => onRemove(player._id)}
          disabled={isAnyBusy}
          activeOpacity={0.8}
          style={[cardS.removeBtn, isAnyBusy && { opacity: 0.4 }]}
        >
          <Ionicons name={isBusy ? 'hourglass-outline' : 'person-remove-outline'} size={14} color={RED} />
          <Text style={cardS.removeBtnText}>{isBusy ? '…' : 'Remove'}</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={cardS.statsRow}>
        <StatBubble icon="trending-up-outline" value={player.kd_ratio ?? '—'} label="K/D" />
        <StatBubble icon="flash-outline" value={player.average_damage ?? '—'} label="Damage" />
        {player.device && (
          <StatBubble icon="phone-portrait-outline" value={player.device} label="Device" />
        )}
        {player.years_experience != null && (
          <StatBubble icon="time-outline" value={`${player.years_experience}y`} label="Exp." />
        )}
      </View>

      {/* Roles */}
      {player.roles?.length > 0 && (
        <View style={cardS.rolesRow}>
          {player.roles.map((r: any) => (
            <View key={r} style={cardS.roleTag}>
              <Text style={cardS.roleTagText}>{r}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const cardS = StyleSheet.create({
  wrapper: {
    backgroundColor: SURFACE, borderRadius: 20,
    borderWidth: 1.5, borderColor: BORDER,
    padding: 16, marginBottom: 12, overflow: 'hidden',
  },
  viewHint: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  viewHintText: { fontSize: 10, color: TEXT_MUTED, fontWeight: '500' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar: {
    width: 46, height: 46, borderRadius: 14,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '800' },
  name: { fontSize: 15, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.3 },
  gameId: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
  removeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#160808', borderRadius: 10,
    borderWidth: 1.5, borderColor: '#4A1010',
    paddingHorizontal: 11, paddingVertical: 7,
  },
  removeBtnText: { fontSize: 12, fontWeight: '700', color: RED },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  rolesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  roleTag: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER,
  },
  roleTagText: { fontSize: 11, color: TEXT_MUTED, fontWeight: '600' },
});

// ── Roster summary strip ───────────────────────────────────────────────────────
function RosterStrip({ count }: { count: number }) {
  return (
    <View style={stripS.wrapper}>
      <View style={stripS.left}>
        <Ionicons name="people-outline" size={16} color={ACCENT} />
        <Text style={stripS.label}>Active roster</Text>
      </View>
      <View style={stripS.badge}>
        <Text style={stripS.badgeText}>{count} player{count !== 1 ? 's' : ''}</Text>
      </View>
    </View>
  );
}

const stripS = StyleSheet.create({
  wrapper: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1C2C10', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#2A3C10',
    paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 13, fontWeight: '700', color: TEXT_PRIMARY },
  badge: {
    backgroundColor: ACCENT, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  badgeText: { fontSize: 12, fontWeight: '800', color: BG },
});

// ── Main screen ────────────────────────────────────────────────────────────────
export default function RosterScreen() {
  const router = useRouter();
  const { socket } = useSocket();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadRoster = useCallback(async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) setLoading(true);
      const data = await getRoster();
      setPlayers(data);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message ?? 'Failed to load roster' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void loadRoster(); }, [loadRoster]);

  const onRefresh = () => {
    setRefreshing(true);
    void loadRoster({ silent: true });
  };

  // Real-time: player added to or removed from roster
  useEffect(() => {
    if (!socket) return;
    const handler = ({ action, player, playerId }: { action: 'add' | 'remove'; player?: any; playerId?: string }) => {
      if (action === 'add' && player) {
        setPlayers((prev) => {
          const exists = prev.some((p) => p._id === player._id);
          return exists ? prev : [...prev, player];
        });
      } else if (action === 'remove' && playerId) {
        setPlayers((prev) => prev.filter((p) => p._id !== playerId));
      }
    };
    socket.on('roster:updated', handler);
    return () => { socket.off('roster:updated', handler); };
  }, [socket]);

  const onRemove = async (playerId: string) => {
    try {
      setRemovingId(playerId);
      await removePlayerFromRoster(playerId);
      setPlayers((prev) => prev.filter((p) => p._id !== playerId));
      Toast.show({ type: 'success', text1: 'Player removed from roster' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message ?? 'Failed to remove' });
    } finally {
      setRemovingId(null);
    }
  };

  const onViewProfile = (id: string, name: string) => {
    router.push({ pathname: '/player-profile' as any, params: { profileId: id, playerName: name } });
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
        {/* Page header */}
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>Roster</Text>
            <Text style={styles.pageSubtitle}>Players currently in your organization</Text>
          </View>
          {!loading && players.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{players.length}</Text>
            </View>
          )}
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <Ionicons name="hourglass-outline" size={36} color={TEXT_MUTED} />
            <Text style={styles.infoText}>Loading roster…</Text>
          </View>
        ) : players.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="people-outline" size={30} color={TEXT_MUTED} />
            </View>
            <Text style={styles.emptyTitle}>Roster is empty</Text>
            <Text style={styles.emptyBody}>
              Select applicants from your active scouting to add players to your roster.
            </Text>
          </View>
        ) : (
          <>
            <RosterStrip count={players.length} />
            {players.map((player) => (
              <PlayerCard
                key={player._id}
                player={player}
                removingId={removingId}
                onRemove={onRemove}
                onViewProfile={onViewProfile}
              />
            ))}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  glowTop: { position: 'absolute', top: -60, right: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: ACCENT, opacity: 0.04 },
  glowBottom: { position: 'absolute', bottom: -80, left: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: '#1A6EFF', opacity: 0.05 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 32 },

  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, color: TEXT_MUTED, marginTop: 3 },
  countBadge: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#1C2C10',
    borderWidth: 1.5, borderColor: '#2A3C10', alignItems: 'center', justifyContent: 'center',
  },
  countText: { fontSize: 15, fontWeight: '800', color: ACCENT },

  centerBox: { alignItems: 'center', paddingTop: 80, gap: 12 },
  infoText: { color: TEXT_MUTED, fontSize: 14 },

  emptyBox: { marginTop: 48, alignItems: 'center', paddingHorizontal: 20 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 22, backgroundColor: SURFACE,
    borderWidth: 1.5, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: TEXT_PRIMARY, marginBottom: 8, letterSpacing: -0.3 },
  emptyBody: { fontSize: 13, color: TEXT_MUTED, textAlign: 'center', lineHeight: 20 },
});