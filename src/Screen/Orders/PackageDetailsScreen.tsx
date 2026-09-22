import React, {useEffect, useState} from 'react';
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
import {useNavigation, useRoute} from '@react-navigation/native';
// @ts-ignore
import Clipboard from '@react-native-clipboard/clipboard';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import Images from '../../assets/image';
import FSize from '../../assets/commonCSS/FSize';
import {mobile_siteConfig} from '../../services/mobile-siteConfig';
import {getDataWithToken, PutDataWithToken} from '../../services/mobile-api';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

interface OrderDetailsResponse {
  order_id: number;
  order_id_generated: string;
  order_type: string;
  order_status: OrderStatus;
  payment_status: string;
  order_created_at: string;
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
}

const orderStatusOptions: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'REJECTED',
  'CANCELLED',
  'COMPLETED',
];

const STATUS_STEPS: {key: OrderStatus; label: string}[] = [
  {key: 'PENDING', label: 'Pending'},
  {key: 'CONFIRMED', label: 'Processing'},
  {key: 'COMPLETED', label: 'Done'},
];

const getStatusMeta = (status: string) => {
  switch (status) {
    case 'CONFIRMED':
      return {bg: '#FFF7ED', border: '#FDBA74', text: '#EA580C', icon: 'progress-clock', label: 'Processing'};
    case 'COMPLETED':
      return {bg: '#ECFDF5', border: '#86EFAC', text: '#16A34A', icon: 'check-decagram', label: 'Completed'};
    case 'PENDING':
      return {bg: '#FEF3C7', border: '#FCD34D', text: '#D97706', icon: 'clock-outline', label: 'Pending'};
    case 'CANCELLED':
      return {bg: '#FEF2F2', border: '#FCA5A5', text: '#DC2626', icon: 'close-circle-outline', label: 'Cancelled'};
    case 'REJECTED':
      return {bg: '#FEF2F2', border: '#FCA5A5', text: '#DC2626', icon: 'cancel', label: 'Rejected'};
    default:
      return {bg: '#F1F5F9', border: '#CBD5E1', text: '#64748B', icon: 'help-circle-outline', label: status};
  }
};

const getPaymentMeta = (status: string) => {
  const value = (status || '').toUpperCase();
  if (value === 'PAID') {
    return {bg: '#ECFDF5', border: '#86EFAC', text: '#16A34A', icon: 'check-circle', label: 'Paid'};
  }
  if (value === 'UNPAID') {
    return {bg: '#FFF7ED', border: '#FDBA74', text: '#EA580C', icon: 'alert-circle-outline', label: 'Unpaid'};
  }
  if (value === 'PARTIAL' || value === 'PARTIALLY_PAID') {
    return {bg: '#EEF4FF', border: '#93C5FD', text: '#2563EB', icon: 'progress-check', label: 'Partial'};
  }
  return {bg: '#FFF7ED', border: '#FDBA74', text: '#EA580C', icon: 'clock-outline', label: status || 'Pending'};
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
  const [orderData, setOrderData] = useState<OrderDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
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

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const getOrderDetailsApi = () => {
    setLoading(true);
    getDataWithToken({}, mobile_siteConfig.GET_ORDER_DETAILS + routeParams.order_id)
      .then((res: any) => res.json())
      .then((res: any) => {
        if (res?.success && res?.data) {
          setOrderData(res.data);
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Failed to load order details');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    getOrderDetailsApi();
  }, []);

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
    Linking.openURL(`tel:${String(mobile).replace(/[^0-9+]/g, '')}`);
  };

  const handleWhatsApp = (mobile: string) => {
    const cleaned = String(mobile).replace(/[^0-9]/g, '');
    Linking.openURL(`whatsapp://send?phone=${cleaned}`).catch(() => {
      Linking.openURL(`https://wa.me/${cleaned}`);
    });
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const renderChromeHeader = (orderId?: string) => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} activeOpacity={0.8}>
        <Image source={Images.backArrow} style={styles.backIcon} />
      </TouchableOpacity>
      <View style={styles.headerTextWrap}>
        <Text style={styles.headerTitle}>Package Details</Text>
        {orderId ? (
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {orderId}
          </Text>
        ) : (
          <Text style={styles.headerSubtitle}>Booking overview</Text>
        )}
      </View>
      {orderId ? (
        <TouchableOpacity
          style={styles.headerBtn}
          activeOpacity={0.8}
          onPress={() => copyToClipboard(orderId, 'Order ID')}>
          <MaterialCommunityIcons name="content-copy" size={wp(4.6)} color="#FFFFFF" />
        </TouchableOpacity>
      ) : (
        <View style={styles.headerBtn} />
      )}
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
        <StatusBar barStyle="light-content" backgroundColor="#0B63E5" />
        {renderChromeHeader()}
        <View style={styles.sheet}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.sooprsblue} />
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
  const pickupLocation = orderData.package?.location1 || null;
  const dropLocation = orderData.package?.location2 || null;
  const packageImage = getImageUri(orderData.package?.thumbnail_image);
  const activeStep = getActiveStepIndex(orderData.order_status);
  const isClosedStatus = orderData.order_status === 'CANCELLED' || orderData.order_status === 'REJECTED';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B63E5" />
      {renderChromeHeader(orderData.order_id_generated)}

      <View style={styles.sheet}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, customerMobile ? styles.scrollContentWithFooter : null]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.coverWrap}>
            {packageImage ? (
              <Image source={packageImage} style={styles.coverImage} resizeMode="cover" />
            ) : (
              <LinearGradient colors={['#1D4ED8', '#2563EB', '#38BDF8']} style={styles.coverImage}>
                <View style={styles.coverBlobOne} />
                <View style={styles.coverBlobTwo} />
                <MaterialCommunityIcons name="package-variant-closed" size={wp(16)} color="rgba(255,255,255,0.92)" />
              </LinearGradient>
            )}
            <LinearGradient colors={['rgba(15,23,42,0.05)', 'rgba(15,23,42,0.78)']} style={styles.coverShade}>
              <View style={styles.coverChips}>
                <View style={styles.glassChip}>
                  <MaterialCommunityIcons name={statusMeta.icon} size={wp(3.6)} color="#FFFFFF" />
                  <Text style={styles.glassChipText}>{statusMeta.label}</Text>
                </View>
                <View style={styles.glassChip}>
                  <MaterialCommunityIcons name={paymentMeta.icon} size={wp(3.6)} color="#FFFFFF" />
                  <Text style={styles.glassChipText}>{paymentMeta.label}</Text>
                </View>
              </View>
              <Text style={styles.coverTitle} numberOfLines={2}>
                {orderData.package?.name || 'Package'}
              </Text>
              <View style={styles.coverMeta}>
                <MaterialCommunityIcons name="calendar-clock" size={wp(3.8)} color="#E2E8F0" />
                <Text style={styles.coverMetaText}>{formatDate(orderData.order_created_at)}</Text>
              </View>
            </LinearGradient>
          </View>

          <LinearGradient
            colors={['#0B63E5', '#2563EB', '#4F46E5']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.payHero}>
            <View style={styles.payHeroGlow} />
            <Text style={styles.payEyebrow}>TOTAL BILLED</Text>
            <Text style={styles.payAmount}>{formatPrice(orderData.pricing.final_amount)}</Text>
            <View style={styles.payHeroBottom}>
              <View style={styles.payHeroPill}>
                <View style={[styles.payDot, {backgroundColor: remaining > 0 ? '#FDBA74' : '#86EFAC'}]} />
                <Text style={styles.payHeroPillText}>
                  {remaining > 0 ? `${formatPrice(remaining)} due` : 'Fully paid'}
                </Text>
              </View>
              {hasCoupon ? (
                <View style={styles.payHeroPill}>
                  <MaterialCommunityIcons name="ticket-percent" size={wp(3.6)} color="#FFFFFF" />
                  <Text style={styles.payHeroPillText}>{orderData.pricing.coupon_code}</Text>
                </View>
              ) : null}
            </View>
          </LinearGradient>

          <View style={styles.statsRow}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleStatusClick}
              style={[styles.statCardWrap, styles.statShadowOrange]}>
              <LinearGradient colors={['#FFF4E5', '#FFFBF4']} style={styles.statCard}>
                <View style={[styles.statDecor, {backgroundColor: '#FDE68A'}]} />
                <View style={[styles.statIconInner, {backgroundColor: '#D97706'}]}>
                  <MaterialCommunityIcons name={statusMeta.icon} size={wp(4.8)} color={Colors.white} />
                </View>
                <Text style={styles.statLabel}>Order status</Text>
                <Text style={[styles.statValue, {color: '#92400E'}]} numberOfLines={1}>
                  {statusMeta.label}
                </Text>
                <Text style={styles.statHint}>Tap to change</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={[styles.statCardWrap, styles.statShadowGreen]}>
              <LinearGradient colors={['#E9FBF1', '#F7FFFB']} style={styles.statCard}>
                <View style={[styles.statDecor, {backgroundColor: '#BBF7D0'}]} />
                <View style={[styles.statIconInner, {backgroundColor: '#16A34A'}]}>
                  <MaterialCommunityIcons name={paymentMeta.icon} size={wp(4.8)} color={Colors.white} />
                </View>
                <Text style={styles.statLabel}>Payment</Text>
                <Text style={[styles.statValue, {color: '#166534'}]} numberOfLines={1}>
                  {paymentMeta.label}
                </Text>
                <Text style={styles.statHint}>{remaining > 0 ? 'Balance pending' : 'Settled'}</Text>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Progress</Text>
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
                            <MaterialCommunityIcons name="check" size={wp(3.2)} color={Colors.white} />
                          ) : (
                            <View style={styles.timelineInner} />
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
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {(pickupLocation || dropLocation) && (
            <View style={styles.routeCard}>
              <View style={styles.routeAccent} />
              <View style={styles.routeBody}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Trip route</Text>
                </View>
                {pickupLocation ? (
                  <View style={styles.routeRow}>
                    <View style={styles.routeDotCol}>
                      <View style={[styles.routeDotOuter, {borderColor: '#22C55E'}]}>
                        <View style={[styles.routeDot, {backgroundColor: '#22C55E'}]} />
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
                      <View style={[styles.routeDotOuter, {borderColor: '#EF4444'}]}>
                        <View style={[styles.routeDot, {backgroundColor: '#EF4444'}]} />
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
          )}

          <View style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, {marginBottom: hp(1.4)}]}>Price breakdown</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Package price</Text>
              <Text style={styles.priceValue}>{formatPrice(orderData.pricing.package_price)}</Text>
            </View>
            {hasCoupon ? (
              <View style={styles.couponRow}>
                <View style={styles.couponChip}>
                  <MaterialCommunityIcons name="ticket-percent-outline" size={wp(4.2)} color="#2563EB" />
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
                <MaterialCommunityIcons name="credit-card-outline" size={wp(4.6)} color="#64748B" />
                <Text style={styles.paymentIdText} numberOfLines={1}>
                  {orderData.pricing.payment_order_id}
                </Text>
                <MaterialCommunityIcons name="content-copy" size={wp(4)} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>

          <LinearGradient colors={['#EEF4FF', '#FFFFFF']} style={styles.customerCard}>
            <View style={styles.customerTop}>
              <LinearGradient colors={['#0077FF', '#4F46E5']} style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(customerName)}</Text>
              </LinearGradient>
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

            {customerMobile ? (
              <Text style={styles.customerDetail}>{customerMobile}</Text>
            ) : null}
            {customerEmail ? (
              <TouchableOpacity activeOpacity={0.8} onPress={() => handleEmail(customerEmail)}>
                <Text style={styles.customerEmail}>{customerEmail}</Text>
              </TouchableOpacity>
            ) : null}

            {customerMobile ? (
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={styles.quickBtn}
                  onPress={() => handleCall(customerMobile)}
                  activeOpacity={0.85}>
                  <View style={[styles.quickIcon, {backgroundColor: '#DBEAFE'}]}>
                    <MaterialCommunityIcons name="phone" size={wp(5)} color="#2563EB" />
                  </View>
                  <Text style={styles.quickLabel}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickBtn}
                  onPress={() => handleWhatsApp(customerMobile)}
                  activeOpacity={0.85}>
                  <View style={[styles.quickIcon, {backgroundColor: '#DCFCE7'}]}>
                    <MaterialCommunityIcons name="whatsapp" size={wp(5)} color="#16A34A" />
                  </View>
                  <Text style={styles.quickLabel}>WhatsApp</Text>
                </TouchableOpacity>
                {customerEmail ? (
                  <TouchableOpacity
                    style={styles.quickBtn}
                    onPress={() => handleEmail(customerEmail)}
                    activeOpacity={0.85}>
                    <View style={[styles.quickIcon, {backgroundColor: '#EDE9FE'}]}>
                      <MaterialCommunityIcons name="email-outline" size={wp(5)} color="#7C3AED" />
                    </View>
                    <Text style={styles.quickLabel}>Email</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </LinearGradient>
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
            <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(customerMobile)} activeOpacity={0.85}>
              <LinearGradient colors={['#0B63E5', '#4F46E5']} style={styles.callBtnGradient}>
                <MaterialCommunityIcons name="phone" size={wp(5.4)} color={Colors.white} />
                <Text style={styles.callText}>Call now</Text>
              </LinearGradient>
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
    backgroundColor: '#0B63E5',
    paddingTop: Platform.OS === 'ios' ? 0 : hp(4),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1.1),
  },
  headerBtn: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: wp(5.2),
    height: wp(5.2),
    tintColor: '#FFFFFF',
  },
  headerTextWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: wp(2),
  },
  headerTitle: {
    fontSize: FSize.fs17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    marginTop: hp(0.12),
    fontSize: FSize.fs11,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '600',
  },
  sheet: {
    flex: 1,
    backgroundColor: '#F3F6FB',
    borderTopLeftRadius: wp(7),
    borderTopRightRadius: wp(7),
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1.8),
    paddingBottom: hp(4),
  },
  scrollContentWithFooter: {
    paddingBottom: hp(12),
  },
  coverWrap: {
    height: hp(26),
    borderRadius: wp(5),
    overflow: 'hidden',
    backgroundColor: '#1D4ED8',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverBlobOne: {
    position: 'absolute',
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: 'rgba(255,255,255,0.12)',
    right: -wp(8),
    top: -hp(4),
  },
  coverBlobTwo: {
    position: 'absolute',
    width: wp(24),
    height: wp(24),
    borderRadius: wp(12),
    backgroundColor: 'rgba(255,255,255,0.1)',
    left: -wp(6),
    bottom: hp(2),
  },
  coverShade: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: wp(4),
  },
  coverChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(1.8),
    marginBottom: hp(0.9),
  },
  glassChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: wp(5),
    paddingHorizontal: wp(2.4),
    paddingVertical: hp(0.4),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  glassChipText: {
    fontSize: FSize.fs11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  coverTitle: {
    fontSize: FSize.fs20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    lineHeight: hp(3.1),
  },
  coverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.2),
    marginTop: hp(0.5),
  },
  coverMetaText: {
    fontSize: FSize.fs12,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  payHero: {
    marginTop: hp(1.6),
    borderRadius: wp(5),
    padding: wp(4.4),
    overflow: 'hidden',
  },
  payHeroGlow: {
    position: 'absolute',
    width: wp(32),
    height: wp(32),
    borderRadius: wp(16),
    backgroundColor: 'rgba(255,255,255,0.12)',
    right: -wp(8),
    top: -hp(3),
  },
  payEyebrow: {
    fontSize: FSize.fs10,
    fontWeight: '800',
    color: 'rgba(219,234,254,0.9)',
    letterSpacing: 1.2,
  },
  payAmount: {
    marginTop: hp(0.35),
    fontSize: FSize.fs28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  payHeroBottom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
    marginTop: hp(1.3),
  },
  payHeroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.2),
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: wp(5),
    paddingHorizontal: wp(2.6),
    paddingVertical: hp(0.45),
  },
  payDot: {
    width: wp(1.8),
    height: wp(1.8),
    borderRadius: wp(0.9),
  },
  payHeroPillText: {
    fontSize: FSize.fs12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: wp(2.6),
    marginTop: hp(1.6),
  },
  statCardWrap: {
    flex: 1,
    borderRadius: wp(4.5),
  },
  statShadowOrange: {
    shadowColor: '#D97706',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  statShadowGreen: {
    shadowColor: '#16A34A',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statCard: {
    borderRadius: wp(4.5),
    padding: wp(3.4),
    overflow: 'hidden',
    minHeight: hp(14.5),
  },
  statDecor: {
    position: 'absolute',
    width: wp(18),
    height: wp(18),
    borderRadius: wp(9),
    right: -wp(5),
    top: -hp(1.5),
    opacity: 0.55,
  },
  statIconInner: {
    width: wp(9.2),
    height: wp(9.2),
    borderRadius: wp(3),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    marginTop: hp(1.1),
    fontSize: FSize.fs11,
    color: '#64748B',
    fontWeight: '700',
  },
  statValue: {
    marginTop: hp(0.2),
    fontSize: FSize.fs16,
    fontWeight: '800',
  },
  statHint: {
    marginTop: hp(0.2),
    fontSize: FSize.fs10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: wp(4.5),
    padding: wp(4.2),
    marginTop: hp(1.6),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.4),
  },
  sectionTitle: {
    fontSize: FSize.fs16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  sectionAction: {
    fontSize: FSize.fs13,
    fontWeight: '800',
    color: '#0B63E5',
  },
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineStep: {
    flex: 1,
    alignItems: 'center',
  },
  timelineTrack: {
    width: '100%',
    alignItems: 'center',
    marginBottom: hp(0.7),
  },
  timelineDot: {
    width: wp(6.6),
    height: wp(6.6),
    borderRadius: wp(3.3),
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineDotDone: {
    backgroundColor: '#16A34A',
  },
  timelineDotCurrent: {
    backgroundColor: '#0B63E5',
  },
  timelineInner: {
    width: wp(2.2),
    height: wp(2.2),
    borderRadius: wp(1.1),
    backgroundColor: Colors.white,
  },
  timelineLine: {
    position: 'absolute',
    top: wp(3.1),
    left: '50%',
    width: '100%',
    height: 3,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
  },
  timelineLineDone: {
    backgroundColor: '#86EFAC',
  },
  timelineLabel: {
    fontSize: FSize.fs11,
    fontWeight: '700',
    color: '#94A3B8',
    textAlign: 'center',
  },
  timelineLabelDone: {
    color: '#16A34A',
  },
  timelineLabelCurrent: {
    color: '#0B63E5',
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2.6),
    borderRadius: wp(3.2),
    padding: wp(3.2),
    borderWidth: 1,
  },
  closedBannerText: {
    flex: 1,
  },
  closedBannerTitle: {
    fontSize: FSize.fs15,
    fontWeight: '800',
  },
  closedBannerHint: {
    marginTop: hp(0.15),
    fontSize: FSize.fs12,
    color: '#64748B',
    fontWeight: '500',
  },
  routeCard: {
    marginTop: hp(1.6),
    backgroundColor: Colors.white,
    borderRadius: wp(4.5),
    overflow: 'hidden',
    flexDirection: 'row',
  },
  routeAccent: {
    width: wp(1.6),
    backgroundColor: '#0B63E5',
  },
  routeBody: {
    flex: 1,
    padding: wp(4.2),
    paddingBottom: wp(2.4),
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: hp(5.2),
  },
  routeDotCol: {
    width: wp(6),
    alignItems: 'center',
    marginRight: wp(2.8),
    paddingTop: hp(0.25),
  },
  routeDotOuter: {
    width: wp(4.2),
    height: wp(4.2),
    borderRadius: wp(2.1),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  routeDot: {
    width: wp(1.8),
    height: wp(1.8),
    borderRadius: wp(0.9),
  },
  routeLine: {
    width: 2,
    flex: 1,
    minHeight: hp(3.4),
    backgroundColor: '#D6DEE8',
    marginTop: hp(0.4),
  },
  routeTextWrap: {
    flex: 1,
    paddingBottom: hp(1.4),
  },
  routeLabel: {
    fontSize: FSize.fs10,
    color: '#94A3B8',
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  routeValue: {
    marginTop: hp(0.25),
    fontSize: FSize.fs15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: hp(2.4),
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  priceLabel: {
    fontSize: FSize.fs14,
    color: '#64748B',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: FSize.fs15,
    fontWeight: '700',
    color: '#0F172A',
  },
  priceMuted: {
    fontSize: FSize.fs13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  couponRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.1),
  },
  couponChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.4),
    backgroundColor: '#EEF4FF',
    borderRadius: wp(2),
    paddingHorizontal: wp(2.4),
    paddingVertical: hp(0.45),
  },
  couponCode: {
    fontSize: FSize.fs13,
    fontWeight: '800',
    color: '#2563EB',
  },
  discountValue: {
    fontSize: FSize.fs15,
    fontWeight: '800',
    color: '#16A34A',
  },
  totalBar: {
    marginTop: hp(0.4),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0B63E5',
    borderRadius: wp(3),
    paddingHorizontal: wp(3.4),
    paddingVertical: hp(1.2),
  },
  totalBarLabel: {
    fontSize: FSize.fs14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.86)',
  },
  totalBarValue: {
    fontSize: FSize.fs18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  paymentIdRow: {
    marginTop: hp(1.2),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.8),
    backgroundColor: '#F8FAFC',
    borderRadius: wp(2.8),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.05),
  },
  paymentIdText: {
    flex: 1,
    fontSize: FSize.fs13,
    fontWeight: '600',
    color: '#64748B',
  },
  customerCard: {
    marginTop: hp(1.6),
    borderRadius: wp(4.5),
    padding: wp(4.2),
  },
  customerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    marginBottom: hp(1.1),
  },
  avatar: {
    width: wp(14),
    height: wp(14),
    borderRadius: wp(7),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FSize.fs16,
    fontWeight: '800',
    color: Colors.white,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: FSize.fs18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  customerBooking: {
    marginTop: hp(0.25),
    fontSize: FSize.fs12,
    fontWeight: '600',
    color: '#64748B',
  },
  customerDetail: {
    fontSize: FSize.fs14,
    fontWeight: '700',
    color: '#0F172A',
  },
  customerEmail: {
    marginTop: hp(0.25),
    fontSize: FSize.fs13,
    fontWeight: '600',
    color: '#2563EB',
  },
  quickActions: {
    flexDirection: 'row',
    marginTop: hp(1.6),
    gap: wp(2),
  },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
  },
  quickIcon: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    marginTop: hp(0.55),
    fontSize: FSize.fs11,
    fontWeight: '700',
    color: '#475569',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: wp(2.6),
    paddingHorizontal: wp(4),
    paddingTop: hp(1.2),
    paddingBottom: Platform.OS === 'ios' ? hp(3.2) : hp(1.8),
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
    borderRadius: wp(3.2),
    paddingVertical: hp(1.45),
  },
  whatsappText: {
    fontSize: FSize.fs14,
    fontWeight: '800',
    color: '#16A34A',
  },
  callBtn: {
    flex: 1.2,
    borderRadius: wp(3.2),
    overflow: 'hidden',
  },
  callBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1.6),
    paddingVertical: hp(1.45),
  },
  callText: {
    fontSize: FSize.fs14,
    fontWeight: '800',
    color: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: hp(1.6),
    fontSize: FSize.fs15,
    color: '#64748B',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: wp(6),
    borderTopRightRadius: wp(6),
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
    backgroundColor: '#E2E8F0',
    marginBottom: hp(1.6),
  },
  modalTitle: {
    fontSize: FSize.fs20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  modalSubtitle: {
    marginTop: hp(0.5),
    fontSize: FSize.fs14,
    color: '#64748B',
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
    borderRadius: wp(3.4),
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
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
    fontSize: FSize.fs16,
    color: '#0F172A',
    fontWeight: '700',
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
    borderColor: '#CBD5E1',
  },
  modalButtonRow: {
    flexDirection: 'row',
    marginTop: hp(1.2),
    gap: wp(3),
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: hp(1.55),
    borderRadius: wp(3),
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: FSize.fs15,
    color: '#64748B',
    fontWeight: '700',
  },
  submitButton: {
    flex: 1.3,
    backgroundColor: '#0B63E5',
    paddingVertical: hp(1.55),
    borderRadius: wp(3),
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: FSize.fs15,
    fontWeight: '800',
  },
});
