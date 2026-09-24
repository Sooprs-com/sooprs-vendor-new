import React, {useCallback, useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  Linking,
} from 'react-native';
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
// @ts-ignore
import Clipboard from '@react-native-clipboard/clipboard';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import Images from '../../assets/image';
import FSize from '../../assets/commonCSS/FSize';
import {mobile_siteConfig} from '../../services/mobile-siteConfig';
import {getDataWithToken, PutDataWithToken} from '../../services/mobile-api';
import {healthVideoApi, HealthVideoApiError} from '../../services/healthVideoApi';
import {useVendorCall} from '../../context/VendorCallContext';
import {HealthAppointment} from '../../types/vendorCall';
import {
  canShowJoinNowForBooking,
  getAppointmentId,
  getOrderAppointmentId,
  resolveJoinAppointmentForOrder,
} from '../../services/bookingJoinHelper';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

interface OrderDetailsResponse {
  order_id: number;
  order_id_generated: string;
  order_type: string;
  order_status: OrderStatus;
  payment_status: string;
  order_created_at: string;
  appointment_id?: number;
  appointmentId?: number;
  can_join?: boolean;
  canJoin?: boolean;
  window?: {canJoin?: boolean; [key: string]: any};
  package: {
    name: string;
    thumbnail_image: string | null;
    location1: string;
    location2: string;
  };
  user_details: {
    name: string;
    email: string;
    mobile: string;
  };
  pricing: {
    package_price: number;
    coupon_code: string | null;
    coupon_discount: number;
    final_amount: number;
    remaining_amount: number;
    payment_order_id: string;
  };
  order_details: {
    name: string;
    mobile: string;
    email: string;
    date: string;
  };
  [key: string]: any;
}

function sanitizeToken(value: string | null) {
  if (!value) {
    return null;
  }
  return value.replace(/^"+|"+$/g, '').trim();
}

const orderStatusOptions: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'REJECTED',
  'CANCELLED',
  'COMPLETED',
];

const STATUS_STEPS: {key: OrderStatus; label: string; hint: string; icon: string}[] = [
  {key: 'PENDING', label: 'Received', hint: 'Order placed', icon: 'inbox-arrow-down'},
  {key: 'CONFIRMED', label: 'In Progress', hint: 'Being handled', icon: 'progress-clock'},
  {key: 'COMPLETED', label: 'Completed', hint: 'All done', icon: 'check-circle'},
];

const getStatusMeta = (status: string) => {
  switch (status) {
    case 'CONFIRMED':
      return {bg: '#EEF4FF', border: '#BFDBFE', text: Colors.sooprsblue, icon: 'progress-clock', label: 'In Progress'};
    case 'COMPLETED':
      return {bg: '#ECFDF5', border: '#A7F3D0', text: '#16A34A', icon: 'check-decagram', label: 'Completed'};
    case 'PENDING':
      return {bg: '#FFF7ED', border: '#FED7AA', text: '#EA580C', icon: 'inbox-arrow-down', label: 'Received'};
    case 'CANCELLED':
      return {bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', icon: 'close-circle-outline', label: 'Cancelled'};
    case 'REJECTED':
      return {bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', icon: 'cancel', label: 'Rejected'};
    default:
      return {bg: '#F5F5F5', border: '#E5E5E5', text: '#525252', icon: 'help-circle-outline', label: status};
  }
};

const getPaymentMeta = (status: string) => {
  const value = (status || '').toUpperCase();
  if (value === 'PAID') {
    return {bg: '#F5F5F5', border: '#E5E5E5', text: '#171717', icon: 'check-circle', label: 'Paid'};
  }
  if (value === 'UNPAID') {
    return {bg: '#F5F5F5', border: '#E5E5E5', text: '#525252', icon: 'alert-circle-outline', label: 'Unpaid'};
  }
  if (value === 'PARTIAL' || value === 'PARTIALLY_PAID') {
    return {bg: '#F5F5F5', border: '#E5E5E5', text: '#404040', icon: 'progress-check', label: 'Partial'};
  }
  return {bg: '#F5F5F5', border: '#E5E5E5', text: '#525252', icon: 'clock-outline', label: status || 'Pending'};
};

const getInitials = (name: string) => {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) {
    return 'C';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const getActiveStepIndex = (status: OrderStatus) => {
  if (status === 'COMPLETED') {
    return 2;
  }
  if (status === 'CONFIRMED') {
    return 1;
  }
  if (status === 'PENDING') {
    return 0;
  }
  return -1;
};

const PackageDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const routeParams = route.params as {order_id: number};
  const {joinCall, lastClientRated} = useVendorCall();
  const [orderData, setOrderData] = useState<OrderDetailsResponse | null>(null);
  const [joinAppointment, setJoinAppointment] = useState<HealthAppointment | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const formatPrice = (price: number) => {
    return `₹${Number(price || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} · ${formattedHours}:${minutes} ${ampm}`;
  };

  const formatOrderDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch (error) {
      return dateString;
    }
  };

  const formatDurationSeconds = (seconds: number | null | undefined) => {
    if (seconds === null || seconds === undefined || Number.isNaN(Number(seconds))) {
      return '—';
    }
    const total = Math.max(0, Math.floor(Number(seconds)));
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hrs > 0) {
      return `${hrs} hr ${mins} min ${secs} sec`;
    }
    if (mins > 0) {
      return `${mins} min ${secs} sec`;
    }
    return `${secs} sec`;
  };

  const formatYesNo = (value: boolean | null | undefined) => {
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    return '—';
  };

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const getOrderDetailsApi = async () => {
    setLoading(true);
    try {
      const rawToken = await AsyncStorage.getItem(
        mobile_siteConfig.MOB_ACCESS_TOKEN_KEY,
      );
      const token = sanitizeToken(rawToken);

      const orderRes: any = await getDataWithToken(
        {},
        mobile_siteConfig.GET_ORDER_DETAILS + routeParams.order_id,
      );
      const orderJson: any = await orderRes.json();
      console.log('Order Details API Response:', JSON.stringify(orderJson, null, 2));
      const orderPayload = orderJson?.success ? orderJson.data : null;
      setOrderData(orderPayload);

      if (!orderPayload || !token) {
        setJoinAppointment(null);
        return;
      }

      let appointments: HealthAppointment[] = [];
      try {
        const listRes = await healthVideoApi.listAppointments(token);
        const list = (listRes?.data || listRes || []) as HealthAppointment[];
        appointments = Array.isArray(list) ? list : [];
      } catch {
        appointments = [];
      }

      let linked = resolveJoinAppointmentForOrder(orderPayload, appointments);
      const appointmentId =
        getAppointmentId(linked) || getOrderAppointmentId(orderPayload);

      if (appointmentId) {
        try {
          const detailRes = await healthVideoApi.getAppointment(
            token,
            appointmentId,
          );
          const detail = (detailRes?.data || detailRes) as HealthAppointment;
          linked = {
            ...detail,
            id: Number(detail.id || detail.appointmentId || appointmentId),
          };
        } catch {
          // Keep list-resolved appointment
        }
      }

      setJoinAppointment(linked);
    } catch {
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getOrderDetailsApi();
    }, [routeParams.order_id]),
  );

  useEffect(() => {
    if (!lastClientRated?.at) {
      return;
    }
    const matchesOrder =
      lastClientRated.orderId != null &&
      Number(lastClientRated.orderId) === Number(routeParams.order_id);
    const matchesAppointment =
      lastClientRated.appointmentId != null &&
      (Number(lastClientRated.appointmentId) ===
        Number(getOrderAppointmentId(orderData)) ||
        Number(lastClientRated.appointmentId) ===
          Number(getAppointmentId(joinAppointment)));
    if (matchesOrder || matchesAppointment) {
      getOrderDetailsApi();
    }
  }, [lastClientRated]);

  const handleJoinNow = async () => {
    if (joining || !orderData) {
      return;
    }
    const appointmentId =
      getAppointmentId(joinAppointment) || getOrderAppointmentId(orderData);
    if (!appointmentId) {
      Toast.show({
        type: 'info',
        text1: 'Join not available',
        text2: 'No open consultation linked to this booking',
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
      getOrderDetailsApi();
    } finally {
      setJoining(false);
    }
  };

  const handleStatusClick = () => {
    setSelectedStatus(orderData?.order_status || null);
    setModalVisible(true);
  };

  const handleStatusSelect = (status: OrderStatus) => {
    setSelectedStatus(status);
  };

  const handleSubmitStatus = () => {
    if (!selectedStatus) {
      Alert.alert('Error', 'Please select a status');
      return;
    }

    if (selectedStatus === orderData?.order_status) {
      Alert.alert('Info', 'Status is already set to ' + selectedStatus);
      setModalVisible(false);
      return;
    }

    setSubmitting(true);

    PutDataWithToken(
      {order_status: selectedStatus},
      `user/vendor/update-order-status-vendor/${routeParams.order_id}`,
    )
      .then((res: any) => {
        if (res?.success) {
          Alert.alert('Success', 'Order status updated successfully');
          setModalVisible(false);
          getOrderDetailsApi();
        } else {
          Alert.alert('Error', res?.message || 'Failed to update order status');
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Failed to update order status');
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedStatus(null);
  };

  const getImageUri = (imagePath: string | null): any => {
    if (imagePath) {
      const baseUrl = mobile_siteConfig.BASE_URL.replace('/api/', '');
      return {uri: baseUrl + imagePath};
    }
    return null;
  };

  const handleCall = (mobile: string) => {
    const cleaned = String(mobile).replace(/[^0-9+]/g, '');
    if (!cleaned) {
      Alert.alert('Error', 'Mobile number not available');
      return;
    }
    Linking.openURL(`tel:${cleaned}`).catch(() => {
      Alert.alert('Error', 'Unable to open dialer');
    });
  };

  const handleWhatsApp = (mobile: string) => {
    const cleaned = String(mobile).replace(/[^0-9]/g, '');
    if (!cleaned) {
      Alert.alert('Error', 'Mobile number not available');
      return;
    }
    const phone = cleaned.length === 10 ? `91${cleaned}` : cleaned;
    Linking.openURL(`whatsapp://send?phone=${phone}`).catch(() => {
      Linking.openURL(`https://wa.me/${phone}`).catch(() => {
        Alert.alert('Error', 'Unable to open WhatsApp');
      });
    });
  };

  const renderChromeHeader = (orderId?: string) => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          activeOpacity={0.8}>
          <Image source={Images.backArrow} style={styles.backArrowIcon} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Order Details</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {orderId || 'Booking overview'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderModal = () => (
    <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={handleCloseModal}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Update order status</Text>
          <Text style={styles.modalSubtitle}>Select a new status for this booking</Text>

          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            {orderStatusOptions.map(status => {
              const isSelected = selectedStatus === status;
              const meta = getStatusMeta(status);
              return (
                <TouchableOpacity
                  key={status}
                  style={[styles.statusOption, isSelected && {backgroundColor: meta.bg, borderColor: meta.border}]}
                  onPress={() => handleStatusSelect(status)}
                  activeOpacity={0.85}>
                  <View style={styles.statusOptionLeft}>
                    <View style={[styles.statusOptionIcon, {backgroundColor: meta.bg}]}>
                      <MaterialCommunityIcons name={meta.icon} size={wp(5)} color={meta.text} />
                    </View>
                    <Text style={[styles.statusOptionText, isSelected && {color: meta.text}]}>{meta.label}</Text>
                  </View>
                  {isSelected ? (
                    <View style={[styles.checkmark, {backgroundColor: meta.text}]}>
                      <MaterialCommunityIcons name="check" size={wp(3.8)} color={Colors.white} />
                    </View>
                  ) : (
                    <View style={styles.unchecked} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.modalButtonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCloseModal}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, (submitting || !selectedStatus) && styles.submitButtonDisabled]}
              onPress={handleSubmitStatus}
              disabled={submitting || !selectedStatus}>
              {submitting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Update status</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading || !orderData) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        {renderChromeHeader()}
        <View style={styles.sheet}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#404040" />
            <Text style={styles.loadingText}>Loading order details...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const hasCoupon = orderData.pricing.coupon_code && orderData.pricing.coupon_code.trim() !== '';
  const remaining = Number(orderData.pricing.remaining_amount || 0);
  const statusMeta = getStatusMeta(orderData.order_status);
  const paymentMeta = getPaymentMeta(orderData.payment_status);
  const customerName = orderData.order_details?.name || orderData.user_details.name;
  const customerMobile = orderData.order_details?.mobile || orderData.user_details.mobile;
  const customerEmail = orderData.order_details?.email || orderData.user_details.email;
  // const pickupLocation = orderData.package?.location1 || null;
  // const dropLocation = orderData.package?.location2 || null;
  const packageImage = getImageUri(orderData.package?.thumbnail_image);
  const activeStep = getActiveStepIndex(orderData.order_status);
  const isClosedStatus = orderData.order_status === 'CANCELLED' || orderData.order_status === 'REJECTED';
  const showJoinNow = canShowJoinNowForBooking(orderData, joinAppointment);

  // Meeting details — show only when API returns meeting data
  const meeting = orderData?.slot_booking?.appointment?.meeting;
  const showMeeting = !!meeting && typeof meeting === 'object';

  // Client rating — read-only patient rating from API
  const clientRating =
    orderData?.slot_booking?.appointment?.clientRating ??
    joinAppointment?.clientRating;
  const ratingStatus =
    orderData?.slot_booking?.appointment?.ratingStatus ??
    joinAppointment?.ratingStatus;
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
    (ratingStatus === 'pending' ||
      (showMeeting && (clientRating == null || ratingStatus !== 'submitted')));

  const getTalkDurationSeconds = () => {
    if (
      meeting?.talkDurationSeconds !== null &&
      meeting?.talkDurationSeconds !== undefined &&
      Number(meeting.talkDurationSeconds) > 0
    ) {
      return Number(meeting.talkDurationSeconds);
    }
    if (meeting?.talkStartedAt && meeting?.talkEndedAt) {
      const start = new Date(meeting.talkStartedAt).getTime();
      const end = new Date(meeting.talkEndedAt).getTime();
      if (!Number.isNaN(start) && !Number.isNaN(end) && end >= start) {
        return Math.floor((end - start) / 1000);
      }
    }
    return meeting?.talkDurationSeconds ?? null;
  };

  const meetingRows = showMeeting
    ? [
        {
          label: 'Talk Started',
          value: meeting?.talkStartedAt ? formatDate(meeting.talkStartedAt) : '—',
        },
        {
          label: 'Talk Ended',
          value: meeting?.talkEndedAt ? formatDate(meeting.talkEndedAt) : '—',
        },
        {
          label: 'Talk Duration',
          value: formatDurationSeconds(getTalkDurationSeconds()),
        },
        {
          label: 'Waiting Duration',
          value: formatDurationSeconds(meeting?.waitingDurationSeconds),
        },
        {
          label: 'Client Connected',
          value: formatDurationSeconds(meeting?.clientConnectedDurationSeconds),
        },
        {
          label: 'Vendor Connected',
          value: formatDurationSeconds(meeting?.vendorConnectedDurationSeconds),
        },
        {
          label: 'User Joined',
          value: formatYesNo(meeting?.userJoined),
        },
        {
          label: 'Vendor Joined',
          value: formatYesNo(meeting?.vendorJoined),
        },
        {
          label: 'Both Joined',
          value: formatYesNo(meeting?.bothJoined),
        },
      ]
    : [];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {renderChromeHeader(orderData.order_id_generated)}

      <View style={styles.sheet}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.coverWrap}>
            {packageImage ? (
              <Image source={packageImage} style={styles.coverImage} resizeMode="cover" />
            ) : (
              <View style={styles.coverPlaceholder}>
                <MaterialCommunityIcons name="package-variant-closed" size={wp(14)} color="#A3A3A3" />
              </View>
            )}
          </View>

          <View style={styles.packageInfo}>
            <Text style={styles.coverTitle} numberOfLines={2}>
              {orderData.package?.name || 'Package'}
            </Text>
            <View style={styles.coverMeta}>
              <MaterialCommunityIcons name="calendar-clock" size={wp(3.8)} color="#737373" />
              <Text style={styles.coverMetaText}>{formatDate(orderData.order_created_at)}</Text>
            </View>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{statusMeta.label}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{paymentMeta.label}</Text>
              </View>
            </View>
          </View>

          {showJoinNow ? (
            <TouchableOpacity
              style={styles.joinNowButton}
              activeOpacity={0.88}
              disabled={joining}
              onPress={handleJoinNow}>
              {joining ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <MaterialCommunityIcons name="video" size={wp(5)} color={Colors.white} />
                  <Text style={styles.joinNowText}>Join Now</Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}

          <View style={styles.statsRow}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleStatusClick}
              style={styles.statCard}>
              <Text style={styles.statLabel}>Order status</Text>
              <Text style={styles.statValue} numberOfLines={1}>
                {statusMeta.label}
              </Text>
              <Text style={styles.statHint}>Tap to change</Text>
            </TouchableOpacity>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Payment</Text>
              <Text style={styles.statValue} numberOfLines={1}>
                {paymentMeta.label}
              </Text>
              <Text style={styles.statHint}>{remaining > 0 ? 'Balance pending' : 'Settled'}</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Order progress</Text>
              <TouchableOpacity onPress={handleStatusClick} activeOpacity={0.8}>
                <Text style={styles.sectionAction}>Update</Text>
              </TouchableOpacity>
            </View>

            {isClosedStatus ? (
              <View style={[styles.closedBanner, {backgroundColor: statusMeta.bg, borderColor: statusMeta.border}]}>
                <MaterialCommunityIcons name={statusMeta.icon} size={wp(5.4)} color={statusMeta.text} />
                <View style={styles.closedBannerText}>
                  <Text style={[styles.closedBannerTitle, {color: statusMeta.text}]}>{statusMeta.label}</Text>
                  <Text style={styles.closedBannerHint}>This booking is no longer in progress</Text>
                </View>
              </View>
            ) : (
              <View style={styles.timeline}>
                {STATUS_STEPS.map((step, index) => {
                  const isDone = activeStep >= index;
                  const isCurrent = activeStep === index;
                  return (
                    <View key={step.key} style={styles.timelineStep}>
                      <View style={styles.timelineTrack}>
                        <View
                          style={[
                            styles.timelineDot,
                            isDone && styles.timelineDotDone,
                            isCurrent && styles.timelineDotCurrent,
                          ]}>
                          {isDone && !isCurrent ? (
                            <MaterialCommunityIcons name="check" size={wp(3.4)} color={Colors.white} />
                          ) : (
                            <MaterialCommunityIcons
                              name={step.icon as any}
                              size={wp(3.6)}
                              color={isCurrent ? Colors.white : '#94A3B8'}
                            />
                          )}
                        </View>
                        {index < STATUS_STEPS.length - 1 ? (
                          <View style={[styles.timelineLine, activeStep > index && styles.timelineLineDone]} />
                        ) : null}
                      </View>
                      <Text
                        style={[
                          styles.timelineLabel,
                          isDone && styles.timelineLabelDone,
                          isCurrent && styles.timelineLabelCurrent,
                        ]}>
                        {step.label}
                      </Text>
                      <Text
                        style={[
                          styles.timelineHint,
                          isCurrent && styles.timelineHintCurrent,
                        ]}>
                        {step.hint}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* {(pickupLocation || dropLocation) && (
            <View style={styles.routeCard}>
              <View style={styles.routeBody}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Trip route</Text>
                </View>
                {pickupLocation ? (
                  <View style={styles.routeRow}>
                    <View style={styles.routeDotCol}>
                      <View style={styles.routeDotOuter}>
                        <View style={styles.routeDot} />
                      </View>
                      {dropLocation ? <View style={styles.routeLine} /> : null}
                    </View>
                    <View style={styles.routeTextWrap}>
                      <Text style={styles.routeLabel}>PICKUP</Text>
                      <Text style={styles.routeValue}>{pickupLocation}</Text>
                    </View>
                  </View>
                ) : null}
                {dropLocation ? (
                  <View style={styles.routeRow}>
                    <View style={styles.routeDotCol}>
                      <View style={styles.routeDotOuter}>
                        <View style={[styles.routeDot, styles.routeDotDrop]} />
                      </View>
                    </View>
                    <View style={styles.routeTextWrap}>
                      <Text style={styles.routeLabel}>DROP</Text>
                      <Text style={styles.routeValue}>{dropLocation}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          )} */}

          <View style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, {marginBottom: hp(1)}]}>Price breakdown</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Package price</Text>
              <Text style={styles.priceValue}>{formatPrice(orderData.pricing.package_price)}</Text>
            </View>
            {hasCoupon ? (
              <View style={styles.couponRow}>
                <View style={styles.couponChip}>
                  <MaterialCommunityIcons name="ticket-percent-outline" size={wp(4.2)} color="#525252" />
                  <Text style={styles.couponCode}>{orderData.pricing.coupon_code}</Text>
                </View>
                <Text style={styles.discountValue}>-{formatPrice(orderData.pricing.coupon_discount)}</Text>
              </View>
            ) : (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Discount</Text>
                <Text style={styles.priceMuted}>No coupon</Text>
              </View>
            )}
            <View style={styles.totalBar}>
              <Text style={styles.totalBarLabel}>Payable total</Text>
              <Text style={styles.totalBarValue}>{formatPrice(orderData.pricing.final_amount)}</Text>
            </View>
            {orderData.pricing.payment_order_id ? (
              <TouchableOpacity
                style={styles.paymentIdRow}
                activeOpacity={0.8}
                onPress={() => copyToClipboard(orderData.pricing.payment_order_id, 'Payment Order ID')}>
                <MaterialCommunityIcons name="credit-card-outline" size={wp(4.6)} color="#737373" />
                <Text style={styles.paymentIdText} numberOfLines={1}>
                  {orderData.pricing.payment_order_id}
                </Text>
                <MaterialCommunityIcons name="content-copy" size={wp(4)} color="#A3A3A3" />
              </TouchableOpacity>
            ) : null}
          </View>

          {showMeeting ? (
            <View style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, {marginBottom: hp(1)}]}>Meeting details</Text>
              {meetingRows.map((row, index) => (
                <View
                  key={row.label}
                  style={[
                    styles.meetingRow,
                    index === meetingRows.length - 1 && styles.meetingRowLast,
                  ]}>
                  <Text style={styles.meetingLabel}>{row.label}</Text>
                  <Text style={styles.meetingValue}>{row.value}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {showClientRating ? (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Client rating</Text>
                <View style={styles.ratingStatusChip}>
                  <Text style={styles.ratingStatusText}>
                    {clientRating?.status === 'submitted' ? 'Submitted' : 'Rated'}
                  </Text>
                </View>
              </View>
              <View style={styles.ratingStarsRow}>
                {[1, 2, 3, 4, 5].map(value => (
                  <MaterialCommunityIcons
                    key={value}
                    name={clientRatingValue >= value ? 'star' : 'star-outline'}
                    size={wp(6)}
                    color={clientRatingValue >= value ? '#FBBF24' : '#D4D4D4'}
                  />
                ))}
                <Text style={styles.ratingScoreText}>
                  {clientRatingValue}/5
                </Text>
              </View>
              {clientRating?.comment ? (
                <View style={styles.ratingCommentBox}>
                  <Text style={styles.ratingCommentLabel}>Comment</Text>
                  <Text style={styles.ratingCommentText}>
                    {clientRating.comment}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : showNotRatedYet ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Client rating</Text>
              <Text style={styles.notRatedText}>Not rated yet</Text>
            </View>
          ) : null}

          <View style={styles.customerCard}>
            <Text style={styles.customerSectionTitle}>Customer details</Text>
            <View style={styles.customerTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(customerName)}</Text>
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{customerName || 'Customer'}</Text>
                {orderData.order_details?.date ? (
                  <Text style={styles.customerBooking}>
                    Booked for {formatOrderDate(orderData.order_details.date)}
                  </Text>
                ) : (
                  <Text style={styles.customerBooking}>Booking customer</Text>
                )}
              </View>
            </View>

            {(customerMobile || customerEmail) ? (
              <View style={styles.customerContactBox}>
                {customerMobile ? (
                  <View style={styles.customerContactRow}>
                    <View style={styles.customerContactIcon}>
                      <MaterialCommunityIcons name="phone-outline" size={wp(4.4)} color={Colors.sooprsblue} />
                    </View>
                    <View style={styles.customerContactTextWrap}>
                      <Text style={styles.customerContactLabel}>Mobile</Text>
                      <Text style={styles.customerContactValue}>{customerMobile}</Text>
                    </View>
                  </View>
                ) : null}
                {customerMobile && customerEmail ? <View style={styles.customerContactDivider} /> : null}
                {customerEmail ? (
                  <View style={styles.customerContactRow}>
                    <View style={styles.customerContactIcon}>
                      <MaterialCommunityIcons name="email-outline" size={wp(4.4)} color={Colors.sooprsblue} />
                    </View>
                    <View style={styles.customerContactTextWrap}>
                      <Text style={styles.customerContactLabel}>Email</Text>
                      <Text style={styles.customerContactValue} numberOfLines={2}>
                        {customerEmail}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        </ScrollView>

        {customerMobile ? (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.whatsappBtn}
              onPress={() => handleWhatsApp(customerMobile)}
              activeOpacity={0.85}>
              <MaterialCommunityIcons name="whatsapp" size={wp(5.4)} color="#16A34A" />
              <Text style={styles.whatsappText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => handleCall(customerMobile)}
              activeOpacity={0.85}>
              <MaterialCommunityIcons name="phone" size={wp(5.4)} color={Colors.white} />
              <Text style={styles.callText}>Call now</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {renderModal()}
    </SafeAreaView>
  );
};

export default PackageDetailsScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 0 : hp(4),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingTop: hp(1.2),
    paddingBottom: hp(1.6),
    backgroundColor: Colors.white,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: wp(2),
  },
  backButton: {
    marginRight: wp(2.4),
    padding: wp(0.6),
  },
  backArrowIcon: {
    width: wp(7.6),
    height: wp(7.6),
    tintColor: '#0F172A',
    resizeMode: 'contain',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FSize.fs22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: FSize.fs14,
    color: '#94A3B8',
    marginTop: hp(0.2),
    fontWeight: '500',
  },
  sheet: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
    paddingBottom: hp(12),
  },
  coverWrap: {
    height: hp(19),
    borderRadius: wp(2.5),
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
  },
  packageInfo: {
    marginTop: hp(0.9),
  },
  coverTitle: {
    fontSize: FSize.fs20,
    fontWeight: '700',
    color: '#171717',
    letterSpacing: -0.2,
    lineHeight: hp(2.9),
  },
  coverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.2),
    marginTop: hp(0.35),
  },
  coverMetaText: {
    fontSize: FSize.fs14,
    fontWeight: '500',
    color: '#737373',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(1.6),
    marginTop: hp(0.7),
  },
  badge: {
    backgroundColor: '#F0F0F0',
    borderRadius: wp(1.5),
    paddingHorizontal: wp(2.4),
    paddingVertical: hp(0.35),
  },
  badgeText: {
    fontSize: FSize.fs13,
    fontWeight: '600',
    color: '#525252',
  },
  joinNowButton: {
    marginTop: hp(1),
    backgroundColor: '#171717',
    borderRadius: wp(2.5),
    paddingVertical: hp(1.3),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    minHeight: hp(5),
  },
  joinNowText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FSize.fs17,
  },
  statsRow: {
    flexDirection: 'row',
    gap: wp(2.2),
    marginTop: hp(1),
  },
  statCard: {
    flex: 1,
    borderRadius: wp(2.5),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.1),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  statLabel: {
    fontSize: FSize.fs13,
    color: '#737373',
    fontWeight: '600',
  },
  statValue: {
    marginTop: hp(0.25),
    fontSize: FSize.fs17,
    fontWeight: '700',
    color: '#171717',
  },
  statHint: {
    marginTop: hp(0.2),
    fontSize: FSize.fs12,
    color: '#A3A3A3',
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: wp(2.5),
    paddingHorizontal: wp(3.4),
    paddingVertical: hp(1.3),
    marginTop: hp(1),
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },
  sectionTitle: {
    fontSize: FSize.fs17,
    fontWeight: '700',
    color: '#171717',
    letterSpacing: -0.2,
  },
  sectionAction: {
    fontSize: FSize.fs15,
    fontWeight: '600',
    color: Colors.sooprsblue,
  },
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: wp(2.5),
    paddingHorizontal: wp(2),
    paddingVertical: hp(1.2),
  },
  timelineStep: {
    flex: 1,
    alignItems: 'center',
  },
  timelineTrack: {
    width: '100%',
    alignItems: 'center',
    marginBottom: hp(0.55),
  },
  timelineDot: {
    width: wp(7.2),
    height: wp(7.2),
    borderRadius: wp(3.6),
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineDotDone: {
    backgroundColor: Colors.sooprsblue,
  },
  timelineDotCurrent: {
    backgroundColor: Colors.sooprsblue,
    borderWidth: 3,
    borderColor: '#BFDBFE',
  },
  timelineLine: {
    position: 'absolute',
    top: wp(3.4),
    left: '50%',
    width: '100%',
    height: 2.5,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
  },
  timelineLineDone: {
    backgroundColor: Colors.sooprsblue,
  },
  timelineLabel: {
    fontSize: FSize.fs14,
    fontWeight: '700',
    color: '#94A3B8',
    textAlign: 'center',
  },
  timelineLabelDone: {
    color: '#334155',
  },
  timelineLabelCurrent: {
    color: Colors.sooprsblue,
  },
  timelineHint: {
    marginTop: hp(0.15),
    fontSize: FSize.fs12,
    fontWeight: '500',
    color: '#CBD5E1',
    textAlign: 'center',
  },
  timelineHintCurrent: {
    color: '#64748B',
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2.4),
    borderRadius: wp(2.5),
    padding: wp(2.8),
    borderWidth: 1,
  },
  closedBannerText: {
    flex: 1,
  },
  closedBannerTitle: {
    fontSize: FSize.fs17,
    fontWeight: '700',
  },
  closedBannerHint: {
    marginTop: hp(0.12),
    fontSize: FSize.fs14,
    color: '#737373',
    fontWeight: '500',
  },
  routeCard: {
    marginTop: hp(1),
    backgroundColor: Colors.white,
    borderRadius: wp(2.5),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  routeBody: {
    flex: 1,
    paddingHorizontal: wp(3.4),
    paddingTop: hp(1.2),
    paddingBottom: wp(1.6),
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: hp(4.4),
  },
  routeDotCol: {
    width: wp(6),
    alignItems: 'center',
    marginRight: wp(2.4),
    paddingTop: hp(0.2),
  },
  routeDotOuter: {
    width: wp(4),
    height: wp(4),
    borderRadius: wp(2),
    borderWidth: 2,
    borderColor: '#A3A3A3',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  routeDot: {
    width: wp(1.6),
    height: wp(1.6),
    borderRadius: wp(0.8),
    backgroundColor: '#525252',
  },
  routeDotDrop: {
    backgroundColor: '#171717',
  },
  routeLine: {
    width: 2,
    flex: 1,
    minHeight: hp(2.6),
    backgroundColor: '#E5E5E5',
    marginTop: hp(0.3),
  },
  routeTextWrap: {
    flex: 1,
    paddingBottom: hp(1),
  },
  routeLabel: {
    fontSize: FSize.fs12,
    color: '#A3A3A3',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  routeValue: {
    marginTop: hp(0.2),
    fontSize: FSize.fs16,
    fontWeight: '600',
    color: '#171717',
    lineHeight: hp(2.4),
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(0.7),
  },
  priceLabel: {
    fontSize: FSize.fs15,
    color: '#737373',
    fontWeight: '500',
  },
  priceValue: {
    fontSize: FSize.fs15,
    fontWeight: '600',
    color: '#171717',
  },
  priceMuted: {
    fontSize: FSize.fs14,
    fontWeight: '500',
    color: '#A3A3A3',
  },
  couponRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(0.8),
  },
  couponChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.4),
    backgroundColor: '#F5F5F5',
    borderRadius: wp(1.5),
    paddingHorizontal: wp(2.2),
    paddingVertical: hp(0.35),
  },
  couponCode: {
    fontSize: FSize.fs14,
    fontWeight: '600',
    color: '#404040',
  },
  discountValue: {
    fontSize: FSize.fs15,
    fontWeight: '600',
    color: '#404040',
  },
  totalBar: {
    marginTop: hp(0.2),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: wp(2),
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.95),
  },
  totalBarLabel: {
    fontSize: FSize.fs15,
    fontWeight: '600',
    color: '#525252',
  },
  totalBarValue: {
    fontSize: FSize.fs19,
    fontWeight: '700',
    color: '#171717',
  },
  paymentIdRow: {
    marginTop: hp(0.9),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.6),
    backgroundColor: '#FAFAFA',
    borderRadius: wp(2),
    paddingHorizontal: wp(2.6),
    paddingVertical: hp(0.85),
  },
  paymentIdText: {
    flex: 1,
    fontSize: FSize.fs14,
    fontWeight: '500',
    color: '#737373',
  },
  meetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: hp(0.65),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  meetingRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  meetingLabel: {
    fontSize: FSize.fs14,
    color: '#737373',
    fontWeight: '500',
    flex: 1,
    marginRight: wp(3),
  },
  meetingValue: {
    fontSize: FSize.fs14,
    fontWeight: '600',
    color: '#171717',
    flex: 1.2,
    textAlign: 'right',
  },
  ratingStatusChip: {
    backgroundColor: '#ECFDF5',
    borderRadius: wp(1.5),
    paddingHorizontal: wp(2.4),
    paddingVertical: hp(0.35),
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  ratingStatusText: {
    fontSize: FSize.fs12,
    fontWeight: '600',
    color: '#16A34A',
  },
  ratingStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    marginBottom: hp(0.4),
  },
  ratingScoreText: {
    marginLeft: wp(2),
    fontSize: FSize.fs15,
    fontWeight: '700',
    color: '#171717',
  },
  ratingCommentBox: {
    marginTop: hp(1),
    backgroundColor: '#F8FAFC',
    borderRadius: wp(2),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
  },
  ratingCommentLabel: {
    fontSize: FSize.fs12,
    fontWeight: '600',
    color: '#737373',
    marginBottom: hp(0.35),
  },
  ratingCommentText: {
    fontSize: FSize.fs14,
    fontWeight: '500',
    color: '#171717',
    lineHeight: hp(2.2),
  },
  notRatedText: {
    marginTop: hp(0.8),
    fontSize: FSize.fs13,
    color: '#737373',
  },
  customerCard: {
    marginTop: hp(1),
    borderRadius: wp(2.5),
    paddingHorizontal: wp(3.4),
    paddingVertical: hp(1.4),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  customerSectionTitle: {
    fontSize: FSize.fs17,
    fontWeight: '700',
    color: '#171717',
    letterSpacing: -0.2,
    marginBottom: hp(1.1),
  },
  customerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    marginBottom: hp(1.1),
  },
  avatar: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF4FF',
  },
  avatarText: {
    fontSize: FSize.fs15,
    fontWeight: '700',
    color: Colors.sooprsblue,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: FSize.fs18,
    fontWeight: '700',
    color: '#171717',
    letterSpacing: -0.2,
  },
  customerBooking: {
    marginTop: hp(0.2),
    fontSize: FSize.fs13,
    fontWeight: '500',
    color: '#737373',
  },
  customerContactBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: wp(2.2),
    borderWidth: 1,
    borderColor: '#E8EEF5',
    paddingVertical: hp(0.3),
    paddingHorizontal: wp(2.5),
  },
  customerContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1),
  },
  customerContactIcon: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(2.2),
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(2.8),
  },
  customerContactTextWrap: {
    flex: 1,
  },
  customerContactLabel: {
    fontSize: FSize.fs12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: hp(0.15),
  },
  customerContactValue: {
    fontSize: FSize.fs15,
    fontWeight: '600',
    color: '#0F172A',
  },
  customerContactDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginLeft: wp(11.8),
  },
  footer: {
    flexDirection: 'row',
    gap: wp(2.6),
    paddingHorizontal: wp(4),
    paddingTop: hp(1.2),
    paddingBottom: Platform.OS === 'ios' ? hp(2.8) : hp(1.6),
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F7',
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1.6),
    borderWidth: 1.2,
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
    borderRadius: wp(2.5),
    paddingVertical: hp(1.45),
  },
  whatsappText: {
    fontSize: FSize.fs15,
    fontWeight: '700',
    color: '#16A34A',
  },
  callBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1.6),
    backgroundColor: Colors.sooprsblue,
    borderRadius: wp(2.5),
    paddingVertical: hp(1.45),
  },
  callText: {
    fontSize: FSize.fs15,
    fontWeight: '700',
    color: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: hp(1.4),
    fontSize: FSize.fs15,
    color: '#737373',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: wp(5),
    borderTopRightRadius: wp(5),
    paddingHorizontal: wp(5),
    paddingTop: hp(1.2),
    paddingBottom: Platform.OS === 'ios' ? hp(4) : hp(3),
    maxHeight: hp(78),
  },
  modalHandle: {
    alignSelf: 'center',
    width: wp(12),
    height: hp(0.5),
    borderRadius: wp(1),
    backgroundColor: '#E5E5E5',
    marginBottom: hp(1.6),
  },
  modalTitle: {
    fontSize: FSize.fs18,
    fontWeight: '700',
    color: '#171717',
    textAlign: 'center',
  },
  modalSubtitle: {
    marginTop: hp(0.5),
    fontSize: FSize.fs14,
    color: '#737373',
    textAlign: 'center',
    fontWeight: '500',
  },
  modalScrollView: {
    maxHeight: hp(42),
    marginTop: hp(1.6),
  },
  statusOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(3.2),
    marginBottom: hp(1),
    borderRadius: wp(2.5),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: Colors.white,
  },
  statusOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2.4),
  },
  statusOptionIcon: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(2.4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOptionText: {
    fontSize: FSize.fs15,
    color: '#171717',
    fontWeight: '600',
  },
  checkmark: {
    width: wp(6.4),
    height: wp(6.4),
    borderRadius: wp(3.2),
    justifyContent: 'center',
    alignItems: 'center',
  },
  unchecked: {
    width: wp(6.4),
    height: wp(6.4),
    borderRadius: wp(3.2),
    borderWidth: 1.4,
    borderColor: '#D4D4D4',
  },
  modalButtonRow: {
    flexDirection: 'row',
    marginTop: hp(1.2),
    gap: wp(3),
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: hp(1.55),
    borderRadius: wp(2.5),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: FSize.fs15,
    color: '#737373',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1.3,
    backgroundColor: '#171717',
    paddingVertical: hp(1.55),
    borderRadius: wp(2.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: FSize.fs15,
    fontWeight: '700',
  },
});
