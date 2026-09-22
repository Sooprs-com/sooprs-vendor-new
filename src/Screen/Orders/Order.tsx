import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import React, {useCallback, useMemo, useState} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
// @ts-ignore
import Clipboard from '@react-native-clipboard/clipboard';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import Images from '../../assets/image';
import FSize from '../../assets/commonCSS/FSize';
import {getDataWithToken} from '../../services/mobile-api';
import {mobile_siteConfig} from '../../services/mobile-siteConfig';
// import {AGORA_CHANNEL_NAME} from '../VideoCall/agoraConfig';

type TabKey = 'ONGOING' | 'COMPLETED' | 'PENDING' | 'CANCELLED';

interface ApiOrder {
  order_id: number;
  order_id_generated: string;
  order_type: string;
  package_id: number;
  user_id: number;
  package_name: string;
  package_price: number;
  coupon_code: string | null;
  coupon_price: number;
  final_pay_amount: number;
  remening_amount: number;
  payment_order_id: string;
  order_status: 'CONFIRMED' | 'COMPLETED' | 'PENDING' | 'CANCELLED';
  payment_status: string;
  order_created_at: string;
  user_details: {
    name: string;
    email: string;
    mobile: string;
  };
  order_details?: {
    name: string;
    mobile: string;
    email: string;
    date: string;
  };
  trip_details?: {
    user_name: string;
    user_email: string;
    user_mobile: string;
    pickup_location: string;
    drop_location: string;
    starting_date: string;
    end_date: string | null;
    trip_type: string;
  };
}

const TABS: {key: TabKey; label: string}[] = [
  {key: 'ONGOING', label: 'Ongoing'},
  {key: 'PENDING', label: 'Pending'},
  {key: 'COMPLETED', label: 'Completed'},
  {key: 'CANCELLED', label: 'Cancelled'},
];

const getPaymentMeta = (status: string) => {
  const value = (status || '').toUpperCase();
  if (value === 'PAID') {
    return {bg: '#ECFDF5', text: '#16A34A', dot: '#22C55E', label: 'Paid'};
  }
  if (value === 'UNPAID') {
    return {bg: '#FFF7ED', text: '#EA580C', dot: '#F97316', label: 'Unpaid'};
  }
  if (value === 'PARTIAL' || value === 'PARTIALLY_PAID') {
    return {bg: '#EEF4FF', text: '#2563EB', dot: '#3B82F6', label: 'Partial'};
  }
  return {bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8', label: status || 'Pending'};
};

const getEmptyMeta = (tab: TabKey) => {
  switch (tab) {
    case 'ONGOING':
      return {icon: 'progress-clock', title: 'No ongoing orders', subtitle: 'Confirmed bookings will appear here'};
    case 'PENDING':
      return {icon: 'clock-outline', title: 'No pending orders', subtitle: 'Awaiting confirmation will show up here'};
    case 'COMPLETED':
      return {icon: 'check-decagram-outline', title: 'No completed orders', subtitle: 'Finished bookings will be listed here'};
    default:
      return {icon: 'close-circle-outline', title: 'No cancelled orders', subtitle: 'Cancelled bookings will appear here'};
  }
};

const Order = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabKey>('ONGOING');
  const [allOrders, setAllOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const getAllOrders = async () => {
    try {
      setLoading(true);
      const res: any = await getDataWithToken({}, mobile_siteConfig.GET_ALL_ORDERS);
      const data: any = await res.json();
      if (data?.success && data?.data) {
        setAllOrders(data.data);
      } else {
        setAllOrders([]);
      }
    } catch (err) {
      console.log('error in all orders', err);
      setAllOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getAllOrders();
    }, []),
  );

  const tabCounts = useMemo(
    () => ({
      ONGOING: allOrders.filter(order => order.order_status === 'CONFIRMED').length,
      COMPLETED: allOrders.filter(order => order.order_status === 'COMPLETED').length,
      PENDING: allOrders.filter(order => order.order_status === 'PENDING').length,
      CANCELLED: allOrders.filter(order => order.order_status === 'CANCELLED').length,
    }),
    [allOrders],
  );

  const filteredOrders = useMemo(() => {
    switch (activeTab) {
      case 'ONGOING':
        return allOrders.filter(order => order.order_status === 'CONFIRMED');
      case 'COMPLETED':
        return allOrders.filter(order => order.order_status === 'COMPLETED');
      case 'PENDING':
        return allOrders.filter(order => order.order_status === 'PENDING');
      case 'CANCELLED':
        return allOrders.filter(order => order.order_status === 'CANCELLED');
      default:
        return [];
    }
  }, [activeTab, allOrders]);

  const formatDateTime = (dateString: string) => {
    if (!dateString) {
      return '';
    }
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

  const formatPrice = (price: number) => {
    return `₹${Number(price || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const calculateDiscount = (packagePrice: number, couponPrice: number, finalAmount: number) => {
    if (couponPrice > 0) {
      return packagePrice - finalAmount;
    }
    return 0;
  };

  // const handleJoinVideoCall = () => {
  //   (navigation as any).navigate('VideoCallScreen', {
  //     role: 'vendor',
  //     channelName: AGORA_CHANNEL_NAME,
  //     uid: 2,
  //   });
  // };

  const renderOrderCard = (order: ApiOrder) => {
    const discountAmount = calculateDiscount(
      order.package_price,
      order.coupon_price,
      order.final_pay_amount,
    );
    const hasCoupon = order.coupon_code && order.coupon_code.trim() !== '';
    const payment = getPaymentMeta(order.payment_status);
    const remaining = Number(order.remening_amount || 0);
    const customerName =
      order.user_details?.name ||
      order.order_details?.name ||
      order.trip_details?.user_name ||
      '';
    const pickup = order.trip_details?.pickup_location;
    const drop = order.trip_details?.drop_location;

    return (
      <View key={order.order_id.toString()} style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <TouchableOpacity
            style={styles.orderIdChip}
            activeOpacity={0.8}
            onPress={() => copyToClipboard(order.order_id_generated, 'Order ID')}>
            <MaterialCommunityIcons name="receipt-text-outline" size={wp(4.2)} color={Colors.sooprsblue} />
            <Text style={styles.orderIdText} numberOfLines={1}>
              {order.order_id_generated}
            </Text>
            <MaterialCommunityIcons name="content-copy" size={wp(3.8)} color="#94A3B8" />
          </TouchableOpacity>

          <View style={[styles.paymentStatusBadge, {backgroundColor: payment.bg}]}>
            <View style={[styles.statusDot, {backgroundColor: payment.dot}]} />
            <Text style={[styles.paymentStatusText, {color: payment.text}]}>{payment.label}</Text>
          </View>
        </View>

        <Text style={styles.packageTitle} numberOfLines={2}>
          {order.package_name}
        </Text>

        <View style={styles.metaRow}>
          {customerName ? (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="account-outline" size={wp(4.2)} color="#64748B" />
              <Text style={styles.metaText} numberOfLines={1}>
                {customerName}
              </Text>
            </View>
          ) : null}
          {order.order_created_at ? (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="calendar-clock" size={wp(4.2)} color="#64748B" />
              <Text style={styles.metaText} numberOfLines={1}>
                {formatDateTime(order.order_created_at)}
              </Text>
            </View>
          ) : null}
        </View>

        {pickup && drop ? (
          <View style={styles.routeChip}>
            <MaterialCommunityIcons name="map-marker-path" size={wp(4.2)} color="#3B82F6" />
            <Text style={styles.routeText} numberOfLines={1}>
              {pickup} → {drop}
            </Text>
          </View>
        ) : null}

        <View style={styles.pricingBox}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Package price</Text>
            <Text style={styles.priceValue}>{formatPrice(order.package_price)}</Text>
          </View>

          {hasCoupon ? (
            <View style={styles.couponRow}>
              <View style={styles.couponCodeContainer}>
                <MaterialCommunityIcons name="ticket-percent-outline" size={wp(4)} color={Colors.sooprsblue} />
                <Text style={styles.couponCodeText}>{order.coupon_code}</Text>
              </View>
              <Text style={styles.discountAmount}>- {formatPrice(discountAmount)}</Text>
            </View>
          ) : null}

          <View style={styles.pricingDivider} />

          <View style={styles.priceRow}>
            <Text style={styles.finalAmountLabel}>Final amount</Text>
            <Text style={styles.finalAmountValue}>{formatPrice(order.final_pay_amount)}</Text>
          </View>

          <View style={styles.priceRowLast}>
            <Text style={styles.remainingLabel}>Remaining</Text>
            <Text style={[styles.remainingValue, remaining > 0 ? styles.remainingDue : styles.remainingClear]}>
              {remaining > 0 ? formatPrice(remaining) : 'Fully paid'}
            </Text>
          </View>
        </View>

        {/* {order.order_status === 'CONFIRMED' && (
          <TouchableOpacity
            style={styles.videoCallButton}
            activeOpacity={0.85}
            onPress={handleJoinVideoCall}>
            <Image source={Images.callIcon} style={styles.videoCallIcon} />
            <Text style={styles.videoCallText}>Join Video Call</Text>
          </TouchableOpacity>
        )} */}

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.paymentOrderIdContainer}
            activeOpacity={0.8}
            onPress={() => copyToClipboard(order.payment_order_id, 'Payment Order ID')}>
            <MaterialCommunityIcons name="credit-card-outline" size={wp(4.2)} color="#94A3B8" />
            <Text style={styles.paymentOrderIdText} numberOfLines={1}>
              {order.payment_order_id}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewDetailsButton}
            activeOpacity={0.85}
            onPress={() =>
              (navigation as any).navigate('PackageDetailsScreen', {order_id: order.order_id})
            }>
            <Text style={styles.viewDetailsText}>View Details</Text>
            <MaterialCommunityIcons name="chevron-right" size={wp(4.6)} color={Colors.sooprsblue} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const emptyMeta = getEmptyMeta(activeTab);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Image source={Images.backArrow} style={styles.backArrowIcon} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>My Orders</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Track bookings, payments and status
            </Text>
          </View>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{allOrders.length}</Text>
        </View>
      </View>

      <View style={styles.tabWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContainer}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isActive && styles.activeTab]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.85}>
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab.label}</Text>
                <View style={[styles.tabCount, isActive && styles.tabCountActive]}>
                  <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                    {tabCounts[tab.key]}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={Colors.sooprsblue} />
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map(order => renderOrderCard(order))
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons name={emptyMeta.icon} size={wp(10)} color="#93C5FD" />
            </View>
            <Text style={styles.emptyText}>{emptyMeta.title}</Text>
            <Text style={styles.emptySubtext}>{emptyMeta.subtitle}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Order;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? hp(5) : 0,
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
    fontSize: FSize.fs18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: FSize.fs11,
    color: '#94A3B8',
    marginTop: hp(0.2),
    fontWeight: '500',
  },
  countBadge: {
    minWidth: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(2),
  },
  countBadgeText: {
    fontSize: FSize.fs12,
    fontWeight: '800',
    color: Colors.sooprsblue,
  },
  tabWrap: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3F8',
  },
  tabContainer: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(1.4),
    gap: wp(2),
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(3.2),
    paddingVertical: hp(0.85),
    borderRadius: wp(6),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E8EEF5',
    gap: wp(1.4),
  },
  activeTab: {
    backgroundColor: '#EEF4FF',
    borderColor: '#93C5FD',
  },
  tabText: {
    fontSize: FSize.fs12,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    fontWeight: '800',
    color: Colors.sooprsblue,
  },
  tabCount: {
    minWidth: wp(4.6),
    height: wp(4.6),
    borderRadius: wp(2.3),
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(1.2),
  },
  tabCountActive: {
    backgroundColor: Colors.sooprsblue,
  },
  tabCountText: {
    fontSize: FSize.fs9,
    fontWeight: '800',
    color: '#475569',
  },
  tabCountTextActive: {
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F7FAFF',
  },
  scrollContent: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1.8),
    paddingBottom: hp(4),
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: wp(4.5),
    padding: wp(4),
    marginBottom: hp(1.8),
    borderWidth: 1.2,
    borderColor: '#D7E6F8',
    shadowColor: '#1E40AF',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.2),
    gap: wp(2),
  },
  orderIdChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FBFF',
    borderRadius: wp(2.2),
    paddingHorizontal: wp(2.2),
    paddingVertical: hp(0.55),
    gap: wp(1.4),
    borderWidth: 1,
    borderColor: '#E8F1FB',
  },
  orderIdText: {
    flex: 1,
    fontSize: FSize.fs13,
    fontWeight: '700',
    color: '#0F172A',
  },
  paymentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(2.4),
    paddingVertical: hp(0.45),
    borderRadius: wp(4),
    gap: wp(1.2),
  },
  statusDot: {
    width: wp(1.7),
    height: wp(1.7),
    borderRadius: wp(0.85),
  },
  paymentStatusText: {
    fontSize: FSize.fs12,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  packageTitle: {
    fontSize: FSize.fs17,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: hp(2.7),
    marginBottom: hp(0.8),
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(3),
    marginBottom: hp(0.8),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    maxWidth: '100%',
  },
  metaText: {
    fontSize: FSize.fs13,
    color: '#64748B',
    fontWeight: '500',
    flexShrink: 1,
  },
  routeChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FF',
    borderRadius: wp(4),
    paddingHorizontal: wp(2.4),
    paddingVertical: hp(0.4),
    gap: wp(1.2),
    marginBottom: hp(1.2),
    maxWidth: '100%',
  },
  routeText: {
    fontSize: FSize.fs13,
    color: '#3B82F6',
    fontWeight: '700',
    flexShrink: 1,
  },
  pricingBox: {
    backgroundColor: '#F8FBFF',
    borderRadius: wp(3.2),
    paddingHorizontal: wp(3.2),
    paddingVertical: hp(1.2),
    borderWidth: 1,
    borderColor: '#E8F1FB',
    marginBottom: hp(1.4),
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(0.7),
  },
  priceRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: FSize.fs14,
    fontWeight: '500',
    color: '#64748B',
  },
  priceValue: {
    fontSize: FSize.fs14,
    fontWeight: '600',
    color: '#0F172A',
  },
  couponRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(0.7),
  },
  couponCodeContainer: {
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderStyle: 'dashed',
    borderRadius: wp(2),
    paddingHorizontal: wp(2.4),
    paddingVertical: hp(0.35),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    backgroundColor: Colors.white,
  },
  couponCodeText: {
    fontSize: FSize.fs13,
    fontWeight: '700',
    color: Colors.sooprsblue,
  },
  discountAmount: {
    fontSize: FSize.fs14,
    fontWeight: '700',
    color: '#16A34A',
  },
  pricingDivider: {
    height: 1,
    backgroundColor: '#E8F1FB',
    marginVertical: hp(0.7),
  },
  finalAmountLabel: {
    fontSize: FSize.fs15,
    fontWeight: '700',
    color: '#0F172A',
  },
  finalAmountValue: {
    fontSize: FSize.fs16,
    fontWeight: '800',
    color: '#0F172A',
  },
  remainingLabel: {
    fontSize: FSize.fs14,
    fontWeight: '500',
    color: '#64748B',
  },
  remainingValue: {
    fontSize: FSize.fs14,
    fontWeight: '700',
  },
  remainingDue: {
    color: '#EA580C',
  },
  remainingClear: {
    color: '#16A34A',
  },
  // videoCallButton: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   backgroundColor: '#059669',
  //   borderRadius: wp(2.5),
  //   paddingVertical: hp(1.2),
  //   marginBottom: hp(1.5),
  // },
  // videoCallIcon: {
  //   width: wp(4.5),
  //   height: wp(4.5),
  //   tintColor: Colors.white,
  //   marginRight: wp(2),
  // },
  // videoCallText: {
  //   fontSize: FSize.fs14,
  //   fontWeight: '700',
  //   color: Colors.white,
  // },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: wp(2),
    paddingTop: hp(0.4),
  },
  paymentOrderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: wp(1.2),
  },
  paymentOrderIdText: {
    flex: 1,
    fontSize: FSize.fs13,
    fontWeight: '500',
    color: '#94A3B8',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: wp(2.6),
    paddingVertical: hp(0.62),
    borderRadius: wp(5),
    borderWidth: 1.3,
    borderColor: '#93C5FD',
    gap: wp(0.2),
  },
  viewDetailsText: {
    fontSize: FSize.fs13,
    fontWeight: '700',
    color: Colors.sooprsblue,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(14),
  },
  emptyIconWrap: {
    width: wp(18),
    height: wp(18),
    borderRadius: wp(9),
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1.6),
  },
  emptyText: {
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: hp(0.6),
  },
  emptySubtext: {
    fontSize: FSize.fs13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: hp(1.4),
    fontSize: FSize.fs13,
    color: '#64748B',
    fontWeight: '500',
  },
});
