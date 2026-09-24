import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import Colors from '../../assets/commonCSS/Colors';
import FSize from '../../assets/commonCSS/FSize';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import Images from '../../assets/image';
import {healthVideoApi, HealthVideoApiError} from '../../services/healthVideoApi';
import {mobile_siteConfig} from '../../services/mobile-siteConfig';
import {useVendorCall} from '../../context/VendorCallContext';
import {
  formatTalkDuration,
  getVendorMissReasonMessage,
  getVendorStatusLabel,
  HealthAppointment,
  normalizeMeetingStatus,
} from '../../types/vendorCall';

type TabKey = 'upcoming' | 'history';

function sanitizeToken(value: string | null) {
  if (!value) {
    return null;
  }
  return value.replace(/^"+|"+$/g, '').trim();
}

function formatIstDateTime(value?: string | null) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getPatientName(item: HealthAppointment) {
  return (
    item.patientName ||
    item.patient_name ||
    item.user?.name ||
    item.client?.name ||
    `Appointment #${item.id}`
  );
}

function getAppointmentId(item: HealthAppointment) {
  return Number(item.id || item.appointmentId || item.appointment_id);
}

function getScheduledAt(item: HealthAppointment) {
  return (
    item.appointment_at ||
    item.appointmentAt ||
    item.scheduled_at ||
    item.startsAt ||
    item.window?.startsAt
  );
}

function isHistoryStatus(status?: string) {
  return ['completed', 'no_show', 'rejected', 'cancelled'].includes(
    String(status || ''),
  );
}

function canShowJoin(item: HealthAppointment) {
  if (item.window?.canJoin === true) {
    return true;
  }
  if (item.window?.canJoin === false) {
    return false;
  }
  if (item.window?.after || item.window?.before) {
    return false;
  }
  const status = normalizeMeetingStatus(item.status, item.legacyStatus);
  // Open window: Join from list/detail even after soft miss / for rejoin.
  return status === 'open' || status === 'waiting' || status === 'in_progress';
}

function getJoinHint(item: HealthAppointment) {
  if (item.window?.canJoin) {
    return null;
  }
  if (item.window?.before) {
    const starts = item.window?.startsAt || getScheduledAt(item);
    return starts ? `Starts at ${formatIstDateTime(starts)}` : 'Starts soon';
  }
  if (item.window?.after) {
    return 'Meeting time ended';
  }
  const status = normalizeMeetingStatus(item.status, item.legacyStatus);
  if (status === 'scheduled') {
    return `Starts at ${formatIstDateTime(getScheduledAt(item))}`;
  }
  if (isHistoryStatus(String(status))) {
    return null;
  }
  return null;
}

const HealthAppointmentsScreen = () => {
  const navigation = useNavigation();
  const {joinCall, lastClientRated} = useVendorCall();
  const [tab, setTab] = useState<TabKey>('upcoming');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [appointments, setAppointments] = useState<HealthAppointment[]>([]);

  const loadAppointments = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const rawToken = await AsyncStorage.getItem(
        mobile_siteConfig.MOB_ACCESS_TOKEN_KEY,
      );
      const token = sanitizeToken(rawToken);
      if (!token) {
        setAppointments([]);
        return;
      }
      const res = await healthVideoApi.listAppointments(token);
      const list = (res?.data || res || []) as HealthAppointment[];
      const normalized = (Array.isArray(list) ? list : []).map(item => ({
        ...item,
        id: getAppointmentId(item),
        status: normalizeMeetingStatus(item.status, item.legacyStatus),
      }));
      setAppointments(normalized);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to load appointments',
        text2: error?.message || 'Please try again',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [loadAppointments]),
  );

  useEffect(() => {
    if (!lastClientRated?.at) {
      return;
    }
    loadAppointments(true);
  }, [lastClientRated, loadAppointments]);

  const upcoming = useMemo(
    () =>
      appointments.filter(
        item => !isHistoryStatus(String(item.status)),
      ),
    [appointments],
  );

  const history = useMemo(
    () =>
      appointments.filter(item => isHistoryStatus(String(item.status))),
    [appointments],
  );

  const data = tab === 'upcoming' ? upcoming : history;

  const handleJoin = async (item: HealthAppointment) => {
    const appointmentId = getAppointmentId(item);
    if (!appointmentId || joiningId) {
      return;
    }
    setJoiningId(appointmentId);
    try {
      // Refresh window check when possible
      const rawToken = await AsyncStorage.getItem(
        mobile_siteConfig.MOB_ACCESS_TOKEN_KEY,
      );
      const token = sanitizeToken(rawToken);
      if (token) {
        try {
          const detail = await healthVideoApi.getAppointment(
            token,
            appointmentId,
          );
          const detailData = (detail?.data || detail) as HealthAppointment;
          if (detailData?.window?.canJoin === false) {
            if (detailData.window?.before) {
              Toast.show({
                type: 'info',
                text1: 'Not started yet',
                text2: getJoinHint(detailData) || 'Meeting window not open',
              });
              return;
            }
            if (detailData.window?.after) {
              Toast.show({
                type: 'info',
                text1: 'Meeting time ended',
                text2: 'Join is no longer available',
              });
              return;
            }
          }
        } catch {
          // Fall through to join-room — server will enforce window
        }
      }

      await joinCall(appointmentId);
    } catch (error: any) {
      const code = error instanceof HealthVideoApiError ? error.code : undefined;
      Toast.show({
        type: 'error',
        text1:
          code === 'JOIN_NOT_OPEN'
            ? 'Meeting not started'
            : code === 'JOIN_CLOSED'
              ? 'Meeting time ended'
              : 'Join failed',
        text2: error?.message || 'Could not join consultation',
      });
    } finally {
      setJoiningId(null);
    }
  };

  const renderCard = ({item}: {item: HealthAppointment}) => {
    const status = String(item.status || '');
    const showJoin = canShowJoin(item);
    const hint = getJoinHint(item);
    const meeting = item.meeting || {};
    const endReason = meeting.endReason || item.endReason;
    const missMessage = getVendorMissReasonMessage(endReason, status);
    const talkDuration = meeting.talkDurationSeconds;
    const patientJoined = !!(meeting.userJoinedAt || meeting.patientJoinedAt);
    const vendorJoined = !!(meeting.vendorJoinedAt || meeting.doctorJoinedAt);
    const durationLabel =
      status === 'completed' && talkDuration && talkDuration > 0
        ? formatTalkDuration(talkDuration)
        : '—';
    const appointmentId = getAppointmentId(item);

    return (
      <View style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            (navigation as any).navigate('HealthAppointmentDetailScreen', {
              appointmentId,
            })
          }>
          <View style={styles.cardHeader}>
            <Text style={styles.patientName} numberOfLines={1}>
              {getPatientName(item)}
            </Text>
            <View style={styles.statusChip}>
              <Text style={styles.statusText}>
                {getVendorStatusLabel(status)}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <MaterialCommunityIcons
              name="calendar-clock"
              size={wp(4)}
              color="#64748B"
            />
            <Text style={styles.metaText}>
              {formatIstDateTime(getScheduledAt(item))}
              {item.duration_minutes || item.durationMinutes
                ? ` · ${item.duration_minutes || item.durationMinutes} min`
                : ''}
            </Text>
          </View>

          {isHistoryStatus(status) ? (
            <View style={styles.historyBlock}>
              <Text style={styles.historyLine}>
                Patient joined: {patientJoined ? 'Yes' : 'No'}
              </Text>
              <Text style={styles.historyLine}>
                You joined: {vendorJoined ? 'Yes' : 'No'}
              </Text>
              <Text style={styles.historyLine}>
                Talk duration: {durationLabel}
              </Text>
              {missMessage ? (
                <Text style={styles.missReason}>{missMessage}</Text>
              ) : null}
              {status === 'completed' && talkDuration && talkDuration > 0 ? (
                <Text style={styles.completedLine}>
                  Completed · {formatTalkDuration(talkDuration)}
                </Text>
              ) : null}
              {item.clientRating &&
              (item.clientRating.status === 'submitted' ||
                Number(item.clientRating.rating) > 0) ? (
                <Text style={styles.ratingDone}>
                  Patient rated {Math.round(Number(item.clientRating.rating))}/5
                </Text>
              ) : item.ratingStatus === 'pending' ||
                (status === 'completed' && item.ratingStatus !== 'submitted') ? (
                <Text style={styles.ratingDone}>Not rated yet</Text>
              ) : null}
            </View>
          ) : null}

          {hint ? <Text style={styles.hintText}>{hint}</Text> : null}
        </TouchableOpacity>

        {showJoin ? (
          <TouchableOpacity
            style={styles.joinBtn}
            activeOpacity={0.85}
            disabled={joiningId === appointmentId}
            onPress={() => handleJoin(item)}>
            {joiningId === appointmentId ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="video"
                  size={wp(4.5)}
                  color={Colors.white}
                />
                <Text style={styles.joinText}>Join</Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Image source={Images.backArrow} style={styles.backArrowIcon} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Health Consultations</Text>
          <Text style={styles.headerSubtitle}>Join meetings in the open window</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'upcoming' && styles.tabActive]}
          onPress={() => setTab('upcoming')}>
          <Text
            style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>
            Upcoming ({upcoming.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'history' && styles.tabActive]}
          onPress={() => setTab('history')}>
          <Text
            style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
            History ({history.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.sooprsblue} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => String(getAppointmentId(item))}
          renderItem={renderCard}
          contentContainerStyle={
            data.length === 0 ? styles.emptyContainer : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadAppointments(true)}
              tintColor={Colors.sooprsblue}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <MaterialCommunityIcons
                name="calendar-blank-outline"
                size={wp(12)}
                color="#94A3B8"
              />
              <Text style={styles.emptyTitle}>
                {tab === 'upcoming' ? 'No upcoming consultations' : 'No history yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {tab === 'upcoming'
                  ? 'When a window opens, Join will appear here'
                  : 'Completed and missed consultations show here'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default HealthAppointmentsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: wp(3),
  },
  backButton: {
    padding: wp(1),
  },
  backArrowIcon: {
    width: wp(5),
    height: wp(5),
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: FSize.fs18,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: FSize.fs12,
    color: '#64748B',
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: wp(4),
    marginTop: hp(1.5),
    backgroundColor: '#E2E8F0',
    borderRadius: wp(2.5),
    padding: wp(1),
  },
  tab: {
    flex: 1,
    paddingVertical: hp(1.1),
    borderRadius: wp(2),
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: FSize.fs13,
    color: '#64748B',
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.sooprsblue,
  },
  listContent: {
    padding: wp(4),
    paddingBottom: hp(4),
  },
  emptyContainer: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(8),
  },
  emptyTitle: {
    marginTop: hp(1.5),
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubtitle: {
    marginTop: hp(0.6),
    fontSize: FSize.fs13,
    color: '#64748B',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp(3),
    padding: wp(4),
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: wp(2),
  },
  patientName: {
    flex: 1,
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusChip: {
    backgroundColor: '#EEF4FF',
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.4),
    borderRadius: wp(2),
  },
  statusText: {
    fontSize: FSize.fs11,
    color: Colors.sooprsblue,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    marginTop: hp(1),
  },
  metaText: {
    flex: 1,
    fontSize: FSize.fs13,
    color: '#64748B',
  },
  historyBlock: {
    marginTop: hp(1.2),
    backgroundColor: '#F8FAFC',
    borderRadius: wp(2),
    padding: wp(3),
    gap: hp(0.4),
  },
  historyLine: {
    fontSize: FSize.fs13,
    color: '#334155',
  },
  missReason: {
    marginTop: hp(0.4),
    fontSize: FSize.fs13,
    color: '#DC2626',
    fontWeight: '600',
  },
  completedLine: {
    marginTop: hp(0.4),
    fontSize: FSize.fs13,
    color: '#16A34A',
    fontWeight: '600',
  },
  ratingDone: {
    fontSize: FSize.fs12,
    color: '#64748B',
  },
  hintText: {
    marginTop: hp(1),
    fontSize: FSize.fs13,
    color: '#D97706',
    fontWeight: '600',
  },
  joinBtn: {
    marginTop: hp(1.5),
    backgroundColor: '#22C55E',
    borderRadius: wp(2.5),
    paddingVertical: hp(1.4),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
  },
  joinText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FSize.fs15,
  },
});
