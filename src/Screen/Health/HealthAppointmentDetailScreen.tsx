import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
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
  return null;
}

type RouteParams = {
  appointmentId: number;
};

const HealthAppointmentDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params || {}) as RouteParams;
  const appointmentId = Number(params.appointmentId);
  const {joinCall, lastClientRated} = useVendorCall();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining] = useState(false);
  const [item, setItem] = useState<HealthAppointment | null>(null);

  const loadDetail = useCallback(
    async (isRefresh = false) => {
      if (!appointmentId) {
        setItem(null);
        setLoading(false);
        return;
      }
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
          setItem(null);
          return;
        }
        const res = await healthVideoApi.getAppointment(token, appointmentId);
        const detail = (res?.data || res) as HealthAppointment;
        setItem({
          ...detail,
          id: Number(detail.id || detail.appointmentId || appointmentId),
          status: normalizeMeetingStatus(detail.status, detail.legacyStatus),
        });
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Failed to load appointment',
          text2: error?.message || 'Please try again',
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [appointmentId],
  );

  useFocusEffect(
    useCallback(() => {
      loadDetail();
    }, [loadDetail]),
  );

  useEffect(() => {
    if (
      !lastClientRated?.at ||
      !appointmentId ||
      Number(lastClientRated.appointmentId) !== appointmentId
    ) {
      return;
    }
    loadDetail(true);
  }, [lastClientRated, appointmentId, loadDetail]);

  const handleJoin = async () => {
    if (!item || joining) {
      return;
    }
    if (!canShowJoin(item)) {
      Toast.show({
        type: 'info',
        text1: item.window?.after ? 'Meeting time ended' : 'Starts later',
        text2: getJoinHint(item) || undefined,
      });
      return;
    }

    setJoining(true);
    try {
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
      loadDetail(true);
    } finally {
      setJoining(false);
    }
  };

  const status = String(item?.status || '');
  const meeting = item?.meeting || {};
  const endReason = meeting.endReason || item?.endReason;
  const missMessage = getVendorMissReasonMessage(endReason, status);
  const talkDuration = meeting.talkDurationSeconds;
  const patientJoined = !!(meeting.userJoinedAt || meeting.patientJoinedAt);
  const vendorJoined = !!(meeting.vendorJoinedAt || meeting.doctorJoinedAt);
  const showJoin = item ? canShowJoin(item) : false;
  const hint = item ? getJoinHint(item) : null;
  const durationLabel =
    status === 'completed' && talkDuration && talkDuration > 0
      ? formatTalkDuration(talkDuration)
      : '—';
  const clientRating = item?.clientRating;
  const showClientRating =
    !!clientRating &&
    typeof clientRating === 'object' &&
    (clientRating.status === 'submitted' || Number(clientRating.rating) > 0);
  const clientRatingValue = Math.min(
    5,
    Math.max(0, Math.round(Number(clientRating?.rating) || 0)),
  );
  const showNotRatedYet =
    !showClientRating &&
    (item?.ratingStatus === 'pending' ||
      (isHistoryStatus(status) && item?.ratingStatus !== 'submitted'));

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
          <Text style={styles.headerTitle}>Appointment</Text>
          <Text style={styles.headerSubtitle}>
            Join when window is open
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.sooprsblue} />
        </View>
      ) : !item ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Appointment not found</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadDetail(true)}
              tintColor={Colors.sooprsblue}
            />
          }>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.patientName}>{getPatientName(item)}</Text>
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

            {hint ? <Text style={styles.hintText}>{hint}</Text> : null}

            {showJoin ? (
              <TouchableOpacity
                style={styles.joinBtn}
                activeOpacity={0.85}
                disabled={joining}
                onPress={handleJoin}>
                {joining ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="video"
                      size={wp(4.5)}
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

          {(isHistoryStatus(status) ||
            meeting.userJoinedAt ||
            meeting.vendorJoinedAt ||
            talkDuration != null ||
            missMessage) && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>After call</Text>
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
              {showClientRating ? (
                <View style={styles.clientRatingBlock}>
                  <Text style={styles.clientRatingTitle}>Patient rating</Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map(value => (
                      <MaterialCommunityIcons
                        key={value}
                        name={
                          clientRatingValue >= value ? 'star' : 'star-outline'
                        }
                        size={wp(5)}
                        color={clientRatingValue >= value ? '#FBBF24' : '#CBD5E1'}
                      />
                    ))}
                    <Text style={styles.ratingScoreText}>
                      {clientRatingValue}/5
                    </Text>
                  </View>
                  {clientRating?.comment ? (
                    <Text style={styles.ratingCommentText}>
                      {clientRating.comment}
                    </Text>
                  ) : null}
                </View>
              ) : showNotRatedYet ? (
                <Text style={styles.ratingDone}>Not rated yet</Text>
              ) : null}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default HealthAppointmentDetailScreen;

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
  content: {
    padding: wp(4),
    paddingBottom: hp(4),
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(8),
  },
  emptyTitle: {
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: '#0F172A',
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
    fontSize: FSize.fs18,
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
    marginTop: hp(1.2),
  },
  metaText: {
    flex: 1,
    fontSize: FSize.fs13,
    color: '#64748B',
  },
  hintText: {
    marginTop: hp(1.2),
    fontSize: FSize.fs13,
    color: '#D97706',
    fontWeight: '600',
  },
  joinBtn: {
    marginTop: hp(2),
    backgroundColor: '#22C55E',
    borderRadius: wp(2.5),
    paddingVertical: hp(1.6),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
  },
  joinText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FSize.fs16,
  },
  sectionTitle: {
    fontSize: FSize.fs15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: hp(1),
  },
  historyLine: {
    fontSize: FSize.fs13,
    color: '#334155',
    marginBottom: hp(0.4),
  },
  missReason: {
    marginTop: hp(0.6),
    fontSize: FSize.fs13,
    color: '#DC2626',
    fontWeight: '600',
  },
  completedLine: {
    marginTop: hp(0.6),
    fontSize: FSize.fs13,
    color: '#16A34A',
    fontWeight: '600',
  },
  ratingDone: {
    marginTop: hp(0.6),
    fontSize: FSize.fs12,
    color: '#64748B',
  },
  clientRatingBlock: {
    marginTop: hp(1.2),
    paddingTop: hp(1),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  clientRatingTitle: {
    fontSize: FSize.fs13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: hp(0.6),
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  ratingScoreText: {
    marginLeft: wp(2),
    fontSize: FSize.fs13,
    fontWeight: '600',
    color: '#64748B',
  },
  ratingCommentText: {
    marginTop: hp(0.6),
    fontSize: FSize.fs13,
    color: '#475569',
  },
});
