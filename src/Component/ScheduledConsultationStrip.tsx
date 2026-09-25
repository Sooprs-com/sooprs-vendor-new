import React, {useMemo} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {hp, wp} from '../assets/commonCSS/GlobalCSS';
import FSize from '../assets/commonCSS/FSize';
import {fFamily} from '../assets/commonCSS/fFamily';

export type ScheduledConsultationData = {
  kind?: string;
  label?: string;
  appointment?: {
    id?: number;
    appointmentDate?: string;
    appointmentTime?: string;
    appointmentAt?: string;
    status?: string;
    duration?: number;
    timezoneLabel?: string;
    window?: {
      canJoin?: boolean;
      before?: boolean;
      after?: boolean;
      open?: boolean;
      remainingSeconds?: number;
    };
    /** User-app shape */
    vendor?: {
      id?: number;
      name?: string;
      image?: string;
    };
    /** Vendor-app shape from get-vendor-profile */
    patient?: {
      id?: number;
      name?: string;
      image?: string;
    };
    package?: {
      id?: number;
      name?: string;
    };
  } | null;
} | null;

type Props = {
  data: ScheduledConsultationData;
  onPress?: () => void;
  onJoinPress?: () => void;
};

const UPCOMING_STATUSES = new Set([
  'scheduled',
  'open',
  'waiting',
  'in_progress',
  'confirmed',
  'booked',
]);

const PAST_STATUSES = new Set([
  'completed',
  'cancelled',
  'canceled',
  'missed',
  'expired',
  'no_show',
]);

function formatSlotTime(time?: string): string {
  if (!time) return '';
  const [hStr, mStr = '00'] = String(time).split(':');
  let hours = Number(hStr);
  if (Number.isNaN(hours)) return String(time);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${String(mStr).padStart(2, '0')} ${suffix}`;
}

function formatSlotDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const dayPart = String(dateStr).includes('T')
      ? String(dateStr).split('T')[0]
      : String(dateStr).slice(0, 10);
    const [y, m, d] = dayPart.split('-').map(Number);
    if (!y || !m || !d) return dayPart;
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return String(dateStr);
  }
}

/** Show only for upcoming / joinable consultations (hide past completed "last"). */
export function shouldShowScheduledConsultationStrip(
  data: ScheduledConsultationData,
): boolean {
  const apt = data?.appointment;
  if (!apt) return false;
  if (!apt.id && !apt.appointmentAt && !apt.appointmentDate) return false;

  const kind = String(data?.kind || '').toLowerCase();
  const status = String(apt?.status || '').toLowerCase();
  const win = apt?.window;

  if (win?.canJoin || win?.open) return true;

  if (win?.after === true) return false;
  if (kind === 'last') return false;
  if (PAST_STATUSES.has(status) && win?.before !== true) return false;

  if (win?.before) return true;
  if (kind === 'next' || kind === 'upcoming' || kind === 'scheduled') {
    return true;
  }
  if (UPCOMING_STATUSES.has(status)) return true;

  if (apt.appointmentAt) {
    const at = new Date(apt.appointmentAt).getTime();
    if (!Number.isNaN(at) && at > Date.now()) return true;
  }

  return false;
}

const ScheduledConsultationStrip: React.FC<Props> = ({
  data,
  onPress,
  onJoinPress,
}) => {
  const apt = data?.appointment;
  const canJoin = apt?.window?.canJoin === true;

  const datePart = useMemo(
    () => formatSlotDate(apt?.appointmentDate || apt?.appointmentAt),
    [apt?.appointmentDate, apt?.appointmentAt],
  );
  const timePart = useMemo(
    () => formatSlotTime(apt?.appointmentTime),
    [apt?.appointmentTime],
  );

  const personImage = apt?.patient?.image || apt?.vendor?.image;

  const headline = canJoin
    ? 'Consultation ready'
    : data?.label || 'Upcoming consultation';

  if (!shouldShowScheduledConsultationStrip(data)) {
    return null;
  }

  const gradientColors = canJoin
    ? ['#E8F8F0', '#D4F1E4']
    : ['#E8F2FF', '#DCEBFF'];

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={canJoin && onJoinPress ? onJoinPress : onPress}
      disabled={!onPress && !(canJoin && onJoinPress)}
      style={styles.touchWrap}>
      <LinearGradient
        colors={gradientColors}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[styles.strip, canJoin && styles.stripJoin]}>
        <View style={[styles.avatarRing, canJoin && styles.avatarRingJoin]}>
          <View style={styles.avatarInner}>
            {personImage ? (
              <Image source={{uri: personImage}} style={styles.personImg} />
            ) : (
              <MaterialCommunityIcons
                name={canJoin ? 'video' : 'video-outline'}
                size={wp(4.2)}
                color={canJoin ? '#0D9F6E' : '#0077FF'}
              />
            )}
          </View>
        </View>

        <View style={styles.textCol}>
          <View style={styles.titleRow}>
            <View
              style={[
                styles.liveDot,
                canJoin ? styles.liveDotOn : styles.liveDotSoon,
              ]}
            />
            <Text
              style={[styles.title, canJoin && styles.titleJoin]}
              numberOfLines={1}>
              {headline}
            </Text>
          </View>
          {(datePart || timePart) && (
            <View style={styles.metaRow}>
              {!!datePart && (
                <View style={styles.metaChip}>
                  <MaterialCommunityIcons
                    name="calendar-month-outline"
                    size={wp(3.8)}
                    color="#4B6FA8"
                  />
                  <Text style={styles.metaText}>{datePart}</Text>
                </View>
              )}
              {!!timePart && (
                <View style={styles.metaChip}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={wp(3.8)}
                    color="#4B6FA8"
                  />
                  <Text style={styles.metaText}>{timePart}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {canJoin ? (
          <View style={styles.joinBtn}>
            <MaterialCommunityIcons name="video" size={wp(3.4)} color="#FFF" />
            <Text style={styles.joinBtnText}>Join</Text>
          </View>
        ) : (
          <View style={styles.chevronWrap}>
            <MaterialCommunityIcons
              name="chevron-right"
              size={wp(5)}
              color="#0077FF"
            />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchWrap: {
    marginHorizontal: wp(4),
    marginBottom: hp(1.1),
    borderRadius: 14,
    shadowColor: '#0077FF',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.15),
    paddingHorizontal: wp(3),
    minHeight: hp(7.2),
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 119, 255, 0.18)',
    overflow: 'hidden',
  },
  stripJoin: {
    borderColor: 'rgba(13, 159, 110, 0.28)',
    shadowColor: '#0D9F6E',
  },
  avatarRing: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(5.5),
    padding: 2.5,
    backgroundColor: 'rgba(0, 119, 255, 0.18)',
    marginRight: wp(2.8),
  },
  avatarRingJoin: {
    backgroundColor: 'rgba(13, 159, 110, 0.22)',
  },
  avatarInner: {
    flex: 1,
    borderRadius: wp(5),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  personImg: {
    width: '100%',
    height: '100%',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    marginRight: wp(2),
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  liveDotSoon: {
    backgroundColor: '#0077FF',
  },
  liveDotOn: {
    backgroundColor: '#0D9F6E',
  },
  title: {
    flex: 1,
    fontSize: FSize.fs12,
    fontFamily: fFamily.ibmBold,
    color: '#0B3A75',
    lineHeight: FSize.fs12 + 3,
  },
  titleJoin: {
    color: '#0A5C40',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: hp(0.55),
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    paddingHorizontal: wp(2.2),
    paddingVertical: hp(0.35),
    borderRadius: 999,
    gap: 5,
  },
  metaText: {
    fontSize: FSize.fs13,
    fontFamily: fFamily.ibmBold,
    color: '#2A4A78',
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D9F6E',
    paddingHorizontal: wp(3.2),
    paddingVertical: hp(0.7),
    borderRadius: 999,
    gap: 4,
  },
  joinBtnText: {
    fontSize: FSize.fs11,
    fontFamily: fFamily.ibmBold,
    color: '#FFF',
  },
  chevronWrap: {
    width: wp(7),
    height: wp(7),
    borderRadius: wp(3.5),
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ScheduledConsultationStrip;
