import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Pressable,
  Animated,
  RefreshControl,
} from 'react-native';
import { Text } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { getMyActiveScouting } from '../../services/scouting.service';
import {
  Applicant,
  getScoutingApplicants,
  selectApplicant,
  rejectApplicant,
} from '../../services/application.service';
import { useSocket } from '../../context/SocketContext';

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

// ── Helpers ────────────────────────────────────────────────────────────────────
type AppStatus = 'PENDING' | 'SELECTED' | 'REJECTED' | string;

function statusColor(status: AppStatus) {
  if (status === 'SELECTED') return GREEN;
  if (status === 'REJECTED') return RED;
  if (status === 'PENDING') return YELLOW;
  return TEXT_MUTED;
}

function statusIcon(status: AppStatus): string {
  if (status === 'SELECTED') return 'checkmark-circle';
  if (status === 'REJECTED') return 'close-circle';
  if (status === 'PENDING') return 'time';
  return 'ellipse-outline';
}

// ── Stat bubble ────────────────────────────────────────────────────────────────
function StatBubble({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <View style={sbS.wrapper}>
      <Ionicons name={icon as any} size={13} color={ACCENT} style={{ marginBottom: 4 }} />
      <Text style={sbS.value}>{value}</Text>
      <Text style={sbS.label}>{label}</Text>
    </View>
  );
}
const sbS = StyleSheet.create({
  wrapper: {
    flex: 1, backgroundColor: SURFACE2, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6,
  },
  value: { fontSize: 15, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.3 },
  label: { fontSize: 9, color: TEXT_MUTED, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 2 },
});

// ── Applicant card ─────────────────────────────────────────────────────────────
function ApplicantCard({
  app, busyId, onSelect, onReject, onViewProfile,
}: {
  app: Applicant;
  busyId: string | null;
  onSelect: (id: string) => void;
  onReject: (id: string) => void;
  onViewProfile: (profileId: string, name: string) => void;
}) {
  const p = app.playerId as unknown as {
    name: string; game_id: string; kd_ratio: number;
    average_damage: number; roles: string[]; age: number; device: string;
  };

  const isBusy = busyId === app._id;
  const isAnyBusy = busyId !== null;
  const color = statusColor(app.status);
  const icon = statusIcon(app.status);
  const isPending = app.status === 'PENDING';

  return (
    <TouchableOpacity
      onPress={() => onViewProfile(String((app.playerId as any)?._id ?? app.playerId), p?.name ?? 'Player')}
      activeOpacity={0.95}
      style={[cardS.wrapper, !isPending && { opacity: 0.75 }]}
    >
      {/* View Profile hint */}
      <View style={cardS.viewHint}>
        <Ionicons name="eye-outline" size={11} color={TEXT_MUTED} style={{ marginRight: 4 }} />
        <Text style={cardS.viewHintText}>Tap to view full profile</Text>
      </View>

      {/* Header */}
      <View style={cardS.header}>
        {/* Avatar */}
        <View style={[cardS.avatar, { borderColor: color + '55' }]}>
          <Text style={cardS.avatarText}>
            {(p?.name ?? 'U').slice(0, 2).toUpperCase()}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={cardS.name}>{p?.name ?? 'Unknown player'}</Text>
          <Text style={cardS.gameId}>
            <Ionicons name="at-outline" size={11} color={TEXT_MUTED} /> {p?.game_id ?? '—'}
          </Text>
        </View>

        {/* Status badge */}
        <View style={[cardS.statusBadge, { borderColor: color + '55', backgroundColor: color + '12' }]}>
          <Ionicons name={icon as any} size={11} color={color} style={{ marginRight: 4 }} />
          <Text style={[cardS.statusText, { color }]}>{app.status}</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={cardS.statsRow}>
        <StatBubble icon="trending-up-outline" value={p?.kd_ratio ?? '—'} label="K/D" />
        <StatBubble icon="flash-outline" value={p?.average_damage ?? '—'} label="Damage" />
        <StatBubble icon="calendar-outline" value={p?.age ?? '—'} label="Age" />
        <StatBubble icon="phone-portrait-outline" value={p?.device ?? '—'} label="Device" />
      </View>

      {/* Roles */}
      {p?.roles?.length > 0 && (
        <View style={cardS.rolesRow}>
          {p.roles.map((r: string) => (
            <View key={r} style={cardS.roleTag}>
              <Text style={cardS.roleTagText}>{r}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions — only for pending */}
      {isPending && (
        <View style={cardS.actions}>
          {/* Select */}
          <Pressable
            onPress={() => onSelect(app._id)}
            disabled={isAnyBusy}
            style={{ flex: 1 }}
          >
            <LinearGradient
              colors={isBusy ? ['#3A4A1A', '#2A3A12'] : ['#C8F135', '#96B827']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={cardS.selectBtn}
            >
              <Ionicons name="checkmark" size={15} color={isBusy ? TEXT_MUTED : BG} style={{ marginRight: 6 }} />
              <Text style={[cardS.selectLabel, isBusy && { color: TEXT_MUTED }]}>
                {isBusy ? 'Selecting…' : 'Select'}
              </Text>
            </LinearGradient>
          </Pressable>

          {/* Reject */}
          <TouchableOpacity
            onPress={() => onReject(app._id)}
            disabled={isAnyBusy}
            style={[cardS.rejectBtn, isAnyBusy && { opacity: 0.5 }]}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={15} color={RED} style={{ marginRight: 6 }} />
            <Text style={cardS.rejectLabel}>{isBusy ? 'Rejecting…' : 'Reject'}</Text>
          </TouchableOpacity>
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
  viewHint: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 10,
  },
  viewHintText: { fontSize: 10, color: TEXT_MUTED, fontWeight: '500' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: SURFACE2, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '800', color: TEXT_MUTED },
  name: { fontSize: 15, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.3 },
  gameId: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  rolesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  roleTag: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER,
  },
  roleTagText: { fontSize: 11, color: TEXT_MUTED, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  selectBtn: { borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  selectLabel: { fontSize: 14, fontWeight: '800', color: BG },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#160808', borderRadius: 12, borderWidth: 1.5, borderColor: '#4A1010',
    paddingVertical: 12,
  },
  rejectLabel: { fontSize: 14, fontWeight: '700', color: RED },
});

// ── Summary bar ────────────────────────────────────────────────────────────────
function SummaryBar({ applicants }: { applicants: Applicant[] }) {
  const pending = applicants.filter((a) => a.status === 'PENDING').length;
  const selected = applicants.filter((a) => a.status === 'SELECTED').length;
  const rejected = applicants.filter((a) => a.status === 'REJECTED').length;

  return (
    <View style={sumS.wrapper}>
      <View style={sumS.item}>
        <Text style={[sumS.num, { color: YELLOW }]}>{pending}</Text>
        <Text style={sumS.label}>Pending</Text>
      </View>
      <View style={sumS.divider} />
      <View style={sumS.item}>
        <Text style={[sumS.num, { color: GREEN }]}>{selected}</Text>
        <Text style={sumS.label}>Selected</Text>
      </View>
      <View style={sumS.divider} />
      <View style={sumS.item}>
        <Text style={[sumS.num, { color: RED }]}>{rejected}</Text>
        <Text style={sumS.label}>Rejected</Text>
      </View>
    </View>
  );
}

const sumS = StyleSheet.create({
  wrapper: {
    flexDirection: 'row', backgroundColor: SURFACE,
    borderRadius: 16, borderWidth: 1.5, borderColor: BORDER,
    marginBottom: 24, overflow: 'hidden',
  },
  item: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  num: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  label: { fontSize: 10, color: TEXT_MUTED, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 3 },
  divider: { width: 1, backgroundColor: BORDER, marginVertical: 10 },
});

// ── Main screen ────────────────────────────────────────────────────────────────
export default function ApplicantsScreen() {
  const router = useRouter();
  const { socket } = useSocket();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [scoutingId, setScoutingId] = useState<string | null>(null);

  const loadApplicants = useCallback(async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) setLoading(true);
      const active = await getMyActiveScouting();
      if (!active) { setScoutingId(null); setApplicants([]); return; }
      setScoutingId(active._id);
      const data = await getScoutingApplicants(active._id);
      setApplicants(data);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message ?? 'Failed to load' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void loadApplicants(); }, [loadApplicants]);

  const onRefresh = () => {
    setRefreshing(true);
    void loadApplicants({ silent: true });
  };

  // Real-time: new applicant or withdrawn
  useEffect(() => {
    if (!socket) return;
    const onNew = (applicant: Applicant) => {
      setApplicants((prev) => {
        const exists = prev.some((a) => a._id === applicant._id);
        return exists ? prev : [applicant, ...prev];
      });
    };
    const onWithdrawn = ({ applicationId }: { applicationId: string }) => {
      setApplicants((prev) =>
        prev.map((a) => a._id === applicationId ? { ...a, status: 'WITHDRAWN' as const } : a)
      );
    };
    socket.on('applicant:new', onNew);
    socket.on('applicant:withdrawn', onWithdrawn);
    return () => {
      socket.off('applicant:new', onNew);
      socket.off('applicant:withdrawn', onWithdrawn);
    };
  }, [socket]);

  const onSelect = async (id: string) => {
    try {
      setBusyId(id);
      await selectApplicant(id);
      setApplicants((prev) => prev.map((a) => a._id === id ? { ...a, status: 'SELECTED' as const } : a));
      Toast.show({ type: 'success', text1: 'Player selected!' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message ?? 'Failed to select' });
    } finally {
      setBusyId(null);
    }
  };

  const onReject = async (id: string) => {
    try {
      setBusyId(id);
      await rejectApplicant(id);
      setApplicants((prev) => prev.map((a) => a._id === id ? { ...a, status: 'REJECTED' as const } : a));
      Toast.show({ type: 'success', text1: 'Application rejected' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message ?? 'Failed to reject' });
    } finally {
      setBusyId(null);
    }
  };

  const onViewProfile = (profileId: string, name: string) => {
    router.push({ pathname: '/player-profile' as any, params: { profileId, playerName: name } });
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
            <Text style={styles.pageTitle}>Applicants</Text>
            <Text style={styles.pageSubtitle}>Review and manage player applications</Text>
          </View>
          {!loading && scoutingId && applicants.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{applicants.length}</Text>
            </View>
          )}
        </View>

        {/* Loading */}
        {loading ? (
          <View style={styles.centerBox}>
            <Ionicons name="hourglass-outline" size={36} color={TEXT_MUTED} />
            <Text style={styles.infoText}>Loading applicants…</Text>
          </View>
        ) : !scoutingId ? (
          // No active scouting
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="megaphone-outline" size={32} color={TEXT_MUTED} />
            </View>
            <Text style={styles.emptyTitle}>No active scouting</Text>
            <Text style={styles.emptyBody}>
              Create an active scouting first to start receiving player applications.
            </Text>
          </View>
        ) : applicants.length === 0 ? (
          // Has scouting but no applicants yet
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="people-outline" size={32} color={TEXT_MUTED} />
            </View>
            <Text style={styles.emptyTitle}>No applicants yet</Text>
            <Text style={styles.emptyBody}>
              Players who apply to your scouting will appear here.
            </Text>
          </View>
        ) : (
          <>
            {/* Summary bar */}
            <SummaryBar applicants={applicants} />

            {/* Cards */}
            {applicants.map((app) => (
              <ApplicantCard
                key={app._id}
                app={app}
                busyId={busyId}
                onSelect={onSelect}
                onReject={onReject}
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

  emptyBox: {
    marginTop: 48, alignItems: 'center', paddingHorizontal: 20,
  },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 22, backgroundColor: SURFACE,
    borderWidth: 1.5, borderColor: BORDER, alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: TEXT_PRIMARY, marginBottom: 8, letterSpacing: -0.3 },
  emptyBody: { fontSize: 13, color: TEXT_MUTED, textAlign: 'center', lineHeight: 20 },
});