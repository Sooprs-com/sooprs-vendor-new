import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  RefreshControl,
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

function getStatusTone(status: string) {
  switch (status) {
    case 'open':
    case 'in_progress':
    case 'completed':
      return {bg: '#ECFDF5', text: '#15803D'};
    case 'waiting':
    case 'scheduled':
      return {bg: '#EEF4FF', text: Colors.sooprsblue};
    case 'no_show':
    case 'rejected':
    case 'cancelled':
      return {bg: '#FEF2F2', text: '#DC2626'};
    default:
      return {bg: '#F1F5F9', text: '#475569'};
  }
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

    const patientName = getPatientName(item);
    const statusTone = getStatusTone(status);
    const initial = patientName.trim().charAt(0).toUpperCase() || 'P';

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
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.cardTitleWrap}>
              <Text style={styles.patientName} numberOfLines={1}>
                {patientName}
              </Text>
              <View style={[styles.statusChip, {backgroundColor: statusTone.bg}]}>
                <Text style={[styles.statusText, {color: statusTone.text}]}>
                  {getVendorStatusLabel(status)}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={wp(6)}
              color="#CBD5E1"
            />
          </View>

          <View style={styles.metaRow}>
            <MaterialCommunityIcons
              name="calendar-clock"
              size={wp(4.8)}
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
                  size={wp(5.2)}
                  color={Colors.white}
                />
                <Text style={styles.joinText}>
                  {status === 'waiting' || status === 'in_progress'
                    ? 'Rejoin'
                    : 'Join'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={Platform.OS === 'android'}
      />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Image source={Images.backArrow} style={styles.backArrowIcon} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Health Consultations</Text>
          <Text style={styles.headerSubtitle}>Join meetings and view history</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabsWrap}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 'upcoming' && styles.tabActive]}
            onPress={() => setTab('upcoming')}
            activeOpacity={0.85}>
            <Text
              style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>
              Upcoming
            </Text>
            <View
              style={[
                styles.tabCount,
                tab === 'upcoming' && styles.tabCountActive,
              ]}>
              <Text
                style={[
                  styles.tabCountText,
                  tab === 'upcoming' && styles.tabCountTextActive,
                ]}>
                {upcoming.length}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'history' && styles.tabActive]}
            onPress={() => setTab('history')}
            activeOpacity={0.85}>
            <Text
              style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
              History
            </Text>
            <View
              style={[
                styles.tabCount,
                tab === 'history' && styles.tabCountActive,
              ]}>
              <Text
                style={[
                  styles.tabCountText,
                  tab === 'history' && styles.tabCountTextActive,
                ]}>
                {history.length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
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
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <MaterialCommunityIcons
                  name={tab === 'upcoming' ? 'calendar-clock' : 'history'}
                  size={wp(8)}
                  color={Colors.sooprsblue}
                />
              </View>
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
    </View>
  );
};

export default HealthAppointmentsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(2.5),
    paddingTop:
      Platform.OS === 'ios'
        ? hp(6.5)
        : (StatusBar.currentHeight || hp(3)) + hp(1.2),
    paddingBottom: hp(1.4),
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEF5',
  },
  backButton: {
    padding: wp(2),
  },
  backArrowIcon: {
    width: wp(7.2),
    height: wp(7.2),
    resizeMode: 'contain',
    tintColor: '#0F172A',
  },
  headerTextWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: wp(11),
  },
  headerTitle: {
    fontSize: FSize.fs24,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    marginTop: hp(0.2),
    fontSize: FSize.fs16,
    color: '#64748B',
    fontWeight: '600',
  },
  tabsWrap: {
    backgroundColor: Colors.white,
    paddingHorizontal: wp(4),
    paddingTop: hp(1.4),
    paddingBottom: hp(1.6),
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: wp(3),
    padding: wp(1),
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: hp(1.15),
    borderRadius: wp(2.4),
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1.6),
  },
  tabActive: {
    backgroundColor: Colors.white,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  tabText: {
    fontSize: FSize.fs16,
    color: '#64748B',
    fontWeight: '700',
  },
  tabTextActive: {
    color: Colors.sooprsblue,
  },
  tabCount: {
    minWidth: wp(6.4),
    height: wp(6.4),
    borderRadius: wp(3.2),
    paddingHorizontal: wp(1.6),
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCountActive: {
    backgroundColor: '#E8F1FF',
  },
  tabCountText: {
    fontSize: FSize.fs14,
    fontWeight: '800',
    color: '#64748B',
  },
  tabCountTextActive: {
    color: Colors.sooprsblue,
  },
  listContent: {
    padding: wp(4),
    paddingBottom: hp(4),
  },
  emptyContainer: {
    flexGrow: 1,
    padding: wp(4),
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(8),
  },
  emptyCard: {
    marginTop: hp(4),
    backgroundColor: Colors.white,
    borderRadius: wp(4),
    borderWidth: 1,
    borderColor: '#E8EEF5',
    alignItems: 'center',
    paddingHorizontal: wp(6),
    paddingVertical: hp(4),
  },
  emptyIconWrap: {
    width: wp(16),
    height: wp(16),
    borderRadius: wp(8),
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: hp(1.6),
    fontSize: FSize.fs18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: hp(0.6),
    fontSize: FSize.fs15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: hp(2.4),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp(4),
    padding: wp(4),
    marginBottom: hp(1.4),
    borderWidth: 1,
    borderColor: '#E8EEF5',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  avatar: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(5.5),
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FSize.fs18,
    fontWeight: '800',
    color: Colors.sooprsblue,
  },
  cardTitleWrap: {
    flex: 1,
  },
  patientName: {
    fontSize: FSize.fs18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginTop: hp(0.45),
    backgroundColor: '#EEF4FF',
    paddingHorizontal: wp(2.2),
    paddingVertical: hp(0.3),
    borderRadius: wp(4),
  },
  statusText: {
    fontSize: FSize.fs14,
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
    fontSize: FSize.fs15,
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
    fontSize: FSize.fs15,
    color: '#334155',
  },
  missReason: {
    marginTop: hp(0.4),
    fontSize: FSize.fs15,
    color: '#DC2626',
    fontWeight: '600',
  },
  completedLine: {
    marginTop: hp(0.4),
    fontSize: FSize.fs15,
    color: '#16A34A',
    fontWeight: '600',
  },
  ratingDone: {
    fontSize: FSize.fs14,
    color: '#64748B',
  },
  hintText: {
    marginTop: hp(1),
    fontSize: FSize.fs15,
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
    fontSize: FSize.fs17,
  },
});
