import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Pressable,
  RefreshControl,
} from 'react-native';
import { Text } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import {
  Application,
  ApplicationStatus,
  getMyApplications,
  withdrawApplication,
  reapplyToScouting,
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
const GREY = '#4B5563';
const ORANGE = '#F97316';

// ── Helpers ────────────────────────────────────────────────────────────────────
function statusColor(status: ApplicationStatus): string {
  if (status === 'SELECTED') return GREEN;
  if (status === 'REJECTED') return RED;
  if (status === 'PENDING') return YELLOW;
  return GREY;
}

function statusIcon(status: ApplicationStatus): string {
  if (status === 'SELECTED') return 'checkmark-circle';
  if (status === 'REJECTED') return 'close-circle';
  if (status === 'PENDING') return 'time';
  if (status === 'WITHDRAWN') return 'arrow-undo-circle-outline';
  return 'remove-circle-outline';
}

function statusLabel(status: ApplicationStatus): string {
  if (status === 'SELECTED') return 'Selected!';
  if (status === 'REJECTED') return 'Rejected';
  if (status === 'PENDING') return 'Pending';
  if (status === 'WITHDRAWN') return 'Withdrawn';
  return 'Withdrawn';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Summary bar ────────────────────────────────────────────────────────────────
function SummaryBar({ applications }: { applications: Application[] }) {
  const pending = applications.filter((a) => a.status === 'PENDING').length;
  const selected = applications.filter((a) => a.status === 'SELECTED').length;
  const rejected = applications.filter((a) => a.status === 'REJECTED').length;

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

// ── Application card ───────────────────────────────────────────────────────────
function ApplicationCard({
  app, busyId, onWithdraw, onReapply,
}: {
  app: Application;
  busyId: string | null;
  onWithdraw: (id: string) => void;
  onReapply: (app: Application) => void;
}) {
  const color = statusColor(app.status);
  const icon = statusIcon(app.status);
  const isBusy = busyId === app._id;
  const isPending = app.status === 'PENDING';
  const isSelected = app.status === 'SELECTED';
  const isWithdrawn = app.status === 'WITHDRAWN';

  return (
    <View style={[
      cardS.wrapper,
      isSelected && cardS.wrapperSelected,
      !isPending && !isSelected && { opacity: 0.7 },
    ]}>
      {/* Selected glow strip */}
      {isSelected && <View style={cardS.selectedStrip} />}

      {/* Header */}
      <View style={cardS.header}>
        {/* Org avatar */}
        <View style={[cardS.avatar, { borderColor: color + '55' }]}>
          <Text style={[cardS.avatarText, { color }]}>
            {app.organizationId.organization_name.slice(0, 2).toUpperCase()}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={cardS.orgName} numberOfLines={1}>
            {app.organizationId.organization_name}
          </Text>
          <View style={cardS.dateRow}>
            <Ionicons name="calendar-outline" size={11} color={TEXT_MUTED} style={{ marginRight: 4 }} />
            <Text style={cardS.dateText}>Applied {formatDate(app.appliedAt)}</Text>
          </View>
        </View>

        {/* Status badge */}
        <View style={[cardS.statusBadge, { borderColor: color + '55', backgroundColor: color + '12' }]}>
          <Ionicons name={icon as any} size={12} color={color} style={{ marginRight: 4 }} />
          <Text style={[cardS.statusText, { color }]}>{statusLabel(app.status)}</Text>
        </View>
      </View>

      {/* Selected celebration message */}
      {isSelected && (
        <View style={cardS.selectedBanner}>
          <Ionicons name="trophy-outline" size={14} color={ACCENT} />
          <Text style={cardS.selectedBannerText}>
            Congratulations! The organization selected your profile.
          </Text>
        </View>
      )}

      {/* Withdraw — pending only */}
      {isPending && (
        <TouchableOpacity
          onPress={() => onWithdraw(app._id)}
          disabled={busyId !== null}
          activeOpacity={0.8}
          style={[cardS.withdrawBtn, busyId !== null && { opacity: 0.5 }]}
        >
          <Ionicons name="arrow-undo-outline" size={13} color={ORANGE} style={{ marginRight: 6 }} />
          <Text style={cardS.withdrawLabel}>
            {isBusy ? 'Withdrawing…' : 'Withdraw application'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Reapply — withdrawn only */}
      {isWithdrawn && (
        <TouchableOpacity
          onPress={() => onReapply(app)}
          disabled={busyId !== null}
          activeOpacity={0.8}
          style={[cardS.reapplyBtn, busyId !== null && { opacity: 0.5 }]}
        >
          <Ionicons name="refresh-outline" size={13} color={ACCENT} style={{ marginRight: 6 }} />
          <Text style={cardS.reapplyLabel}>
            {isBusy ? 'Reapplying…' : 'Reapply to scouting'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const cardS = StyleSheet.create({
  wrapper: {
    backgroundColor: SURFACE, borderRadius: 20,
    borderWidth: 1.5, borderColor: BORDER,
    padding: 16, marginBottom: 12, overflow: 'hidden',
  },
  wrapperSelected: { borderColor: '#2A3C10', backgroundColor: '#0C1810' },
  selectedStrip: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: 3, backgroundColor: ACCENT,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: SURFACE2, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '800' },
  orgName: { fontSize: 15, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.3 },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  dateText: { fontSize: 11, color: TEXT_MUTED },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  selectedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1C2C10', borderRadius: 10,
    borderWidth: 1, borderColor: '#2A3C10',
    paddingHorizontal: 12, paddingVertical: 10,
    marginTop: 14,
  },
  selectedBannerText: { fontSize: 12, color: TEXT_MUTED, flex: 1, lineHeight: 17 },
  withdrawBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 14, paddingVertical: 11, borderRadius: 12,
    backgroundColor: '#160808', borderWidth: 1.5, borderColor: '#4A2010',
  },
  withdrawLabel: { fontSize: 13, fontWeight: '700', color: ORANGE },
  reapplyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 14, paddingVertical: 11, borderRadius: 12,
    backgroundColor: '#111A08', borderWidth: 1.5, borderColor: '#3A5510',
  },
  reapplyLabel: { fontSize: 13, fontWeight: '700', color: ACCENT },
});

// ── Main screen ────────────────────────────────────────────────────────────────
export default function ApplicationsScreen() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reapplyBusyId, setReapplyBusyId] = useState<string | null>(null);

  const loadApplications = useCallback(async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) setLoading(true);
      const data = await getMyApplications();
      setApplications(data);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error?.response?.data?.message ?? 'Failed to load applications' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void loadApplications(); }, [loadApplications]);

  const onRefresh = () => {
    setRefreshing(true);
    void loadApplications({ silent: true });
  };

  // Real-time: org selected or rejected this player's application
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;
    const handler = ({ applicationId, status }: { applicationId: string; status: string }) => {
      setApplications((prev) =>
        prev.map((a) =>
          a._id === applicationId
            ? { ...a, status: status as ApplicationStatus }
            : a
        )
      );
    };
    socket.on('application:updated', handler);
    return () => { socket.off('application:updated', handler); };
  }, [socket]);

  const onWithdraw = async (id: string) => {
    try {
      setBusyId(id);
      await withdrawApplication(id);
      setApplications((prev) =>
        prev.map((a) => a._id === id ? { ...a, status: 'WITHDRAWN' as ApplicationStatus } : a)
      );
      Toast.show({ type: 'success', text1: 'Application withdrawn' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error?.response?.data?.message ?? 'Failed to withdraw' });
    } finally {
      setBusyId(null);
    }
  };

  const onReapply = async (app: Application) => {
    try {
      setReapplyBusyId(app._id);
      await reapplyToScouting(app.scoutingId._id);
      setApplications((prev) =>
        prev.map((a) => a._id === app._id ? { ...a, status: 'PENDING' as ApplicationStatus } : a)
      );
      Toast.show({ type: 'success', text1: 'Reapplied successfully!' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error?.response?.data?.message ?? 'Failed to reapply' });
    } finally {
      setReapplyBusyId(null);
    }
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
            <Text style={styles.pageTitle}>My Applications</Text>
            <Text style={styles.pageSubtitle}>Track all your scouting submissions</Text>
          </View>
          {!loading && applications.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{applications.length}</Text>
            </View>
          )}
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <Ionicons name="hourglass-outline" size={36} color={TEXT_MUTED} />
            <Text style={styles.infoText}>Loading applications…</Text>
          </View>
        ) : applications.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="send-outline" size={30} color={TEXT_MUTED} />
            </View>
            <Text style={styles.emptyTitle}>No applications yet</Text>
            <Text style={styles.emptyBody}>
              Apply to active scoutings to track your progress here.
            </Text>
          </View>
        ) : (
          <>
            <SummaryBar applications={applications} />
            {applications.map((app) => (
              <ApplicationCard
                key={app._id}
                app={app}
                busyId={reapplyBusyId ?? busyId}
                onWithdraw={onWithdraw}
                onReapply={onReapply}
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