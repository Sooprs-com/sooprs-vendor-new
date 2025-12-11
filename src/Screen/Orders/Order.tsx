import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import { useNavigation } from '@react-navigation/native';
// @ts-ignore
import Clipboard from '@react-native-clipboard/clipboard';
import {hp, wp, GlobalCss} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import Images from '../../assets/image';
import FSize from '../../assets/commonCSS/FSize';
import { getDataWithToken } from '../../services/mobile-api';
import { mobile_siteConfig } from '../../services/mobile-siteConfig';

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

const Order = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'ONGOING' | 'COMPLETED' | 'PENDING' | 'CANCELLED'>('ONGOING');
  const [allOrders, setAllOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const getAllOrders = () => {
    setLoading(true);
    getDataWithToken({}, mobile_siteConfig.GET_ALL_ORDERS)
      .then((res: any) => res.json())
      .then((res: any) => {
        console.log("All orders", res);
        if (res.success && res.data) {
          setAllOrders(res.data);
        }
        setLoading(false);
      })
      .catch((err: any) => {
        console.log("error in all orders", err);
        setLoading(false);
      });
  };
  
  useEffect(() => {
    getAllOrders();
  }, []);

  const getOrdersByStatus = () => {
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
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  const renderOrderCard = (order: ApiOrder) => {
    const discountAmount = calculateDiscount(order.package_price, order.coupon_price, order.final_pay_amount);
    const hasCoupon = order.coupon_code && order.coupon_code.trim() !== '';

    return (
      <View key={order.order_id.toString()} style={styles.orderCard}>
        {/* Top Header - Order ID with Copy Icon and Payment Status Badge */}
        <View style={styles.orderHeader}>
          <View style={styles.orderIdContainer}>
            <Text style={styles.orderIdText}>Order ID: {order.order_id_generated}</Text>
            <TouchableOpacity 
              onPress={() => copyToClipboard(order.order_id_generated, 'Order ID')}
              style={styles.copyButton}>
              {/* <Image source={Images.copyIcon} style={styles.copyIcon} /> */}
            </TouchableOpacity>
          </View>
          <View style={[
            styles.paymentStatusBadge,
            order.payment_status === 'PAID' && { backgroundColor: '#4CAF50' },
            order.payment_status === 'UNPAID' && { backgroundColor: '#FF9800' },
          ]}>
            <Text style={styles.paymentStatusText}>✓ {order.payment_status}</Text>
          </View>
        </View>

        {/* Package Title */}
        <Text style={styles.packageTitle}>{order.package_name}</Text>

        {/* Pricing Details Section */}
        <View style={styles.pricingSection}>
          {/* Package Price */}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Package Price:</Text>
            <Text style={styles.priceValue}>{formatPrice(order.package_price)}</Text>
          </View>

          {/* Coupon/Discount Section */}
          {hasCoupon && (
            <View style={styles.couponRow}>
              <View style={styles.couponCodeContainer}>
                <Text style={styles.couponCodeText}>{order.coupon_code}</Text>
              </View>
              <Text style={styles.discountAmount}>- {formatPrice(discountAmount)}</Text>
            </View>
          )}
        </View>

        {/* Financial Summary */}
        <View style={styles.financialSummary}>
          <View style={styles.priceRow}>
            <Text style={styles.finalAmountLabel}>Final Amount:</Text>
            <Text style={styles.finalAmountValue}>{formatPrice(order.final_pay_amount)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.remainingLabel}>Remaining Amount:</Text>
            <Text style={styles.remainingValue}>{formatPrice(order.remening_amount)}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Bottom Footer - Payment Order ID and View Details */}
        <View style={styles.footer}>
          <View style={styles.paymentOrderIdContainer}>
            <Text style={styles.paymentOrderIdText}>Payment Order ID: {order.payment_order_id}</Text>
            <TouchableOpacity 
              onPress={() => copyToClipboard(order.payment_order_id, 'Payment Order ID')}
              style={styles.copyButton}>
              {/* <Image source={Images.copyIcon} style={styles.copyIcon} /> */}
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.viewDetailsButton}
            onPress={() => (navigation as any).navigate('PackageDetailsScreen', { order_id: order.order_id })}>
            <Text style={styles.viewDetailsText}>View Details</Text>
            {/* <Image source={Images.chevRight} style={styles.chevRightIcon} /> */}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ONGOING' && styles.activeTab]}
          onPress={() => setActiveTab('ONGOING')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'ONGOING' && styles.activeTabText,
            ]}>
            Ongoing
          </Text>
          {activeTab === 'ONGOING' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'PENDING' && styles.activeTab]}
          onPress={() => setActiveTab('PENDING')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'PENDING' && styles.activeTabText,
            ]}>
            Pending
          </Text>
          {activeTab === 'PENDING' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'COMPLETED' && styles.activeTab]}
          onPress={() => setActiveTab('COMPLETED')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'COMPLETED' && styles.activeTabText,
            ]}>
            Completed
          </Text>
          {activeTab === 'COMPLETED' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'CANCELLED' && styles.activeTab]}
          onPress={() => setActiveTab('CANCELLED')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'CANCELLED' && styles.activeTabText,
            ]}>
            Cancelled
          </Text>
          {activeTab === 'CANCELLED' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Loading orders...</Text>
          </View>
        ) : getOrdersByStatus().length > 0 ? (
          getOrdersByStatus().map(order => renderOrderCard(order))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No {activeTab.toLowerCase()} orders</Text>
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
    backgroundColor: Colors.white,
    paddingTop: hp(2),
  },
  header: {
    paddingHorizontal: wp(6),
    paddingTop: hp(2),
    paddingBottom: hp(1.5),
    backgroundColor: Colors.white,
  },
  headerTitle: {
    fontSize: FSize.fs20,
    fontWeight: '700',
    color: Colors.black,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderTopWidth: wp(.2),
    borderTopColor: Colors.lightgrey2,
    paddingHorizontal: wp(6),
    borderBottomWidth: wp(.2),
    borderBottomColor: Colors.lightgrey2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: hp(1.5),
    position: 'relative',
  },
  activeTab: {
    // Active tab styling
  },
  tabText: {
    fontSize: FSize.fs14,
    fontWeight: '500',
    color: Colors.gray,
  },
  activeTabText: {
    fontWeight: '700',
    color: Colors.black,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.sooprsblue,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(3),
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: wp(3),
    padding: wp(5),
    marginBottom: hp(2),
    ...GlobalCss.shadowBox,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderIdText: {
    fontSize: FSize.fs13,
    fontWeight: '500',
    color: Colors.black,
  },
  copyButton: {
    marginLeft: wp(2),
    padding: wp(1),
  },
  copyIcon: {
    width: wp(4),
    height: wp(4),
    tintColor: Colors.sooprsblue,
  },
  paymentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.6),
    borderRadius: wp(2),
  },
  paymentStatusText: {
    fontSize: FSize.fs11,
    fontWeight: '700',
    color: Colors.white,
    textTransform: 'uppercase',
  },
  packageTitle: {
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: hp(1.5),
    lineHeight: hp(2.2),
  },
  pricingSection: {
    marginBottom: hp(1.5),
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(0.8),
  },
  priceLabel: {
    fontSize: FSize.fs13,
    fontWeight: '500',
    color: Colors.black,
  },
  priceValue: {
    fontSize: FSize.fs13,
    fontWeight: '500',
    color: Colors.black,
  },
  couponRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(0.5),
  },
  couponCodeContainer: {
    borderWidth: 1,
    borderColor: Colors.sooprsblue,
    borderStyle: 'dashed',
    borderRadius: wp(2),
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponCodeText: {
    fontSize: FSize.fs12,
    fontWeight: '600',
    color: Colors.sooprsblue,
  },
  discountAmount: {
    fontSize: FSize.fs13,
    fontWeight: '600',
    color: '#4CAF50',
  },
  financialSummary: {
    marginBottom: hp(1.5),
  },
  finalAmountLabel: {
    fontSize: FSize.fs14,
    fontWeight: '700',
    color: Colors.black,
  },
  finalAmountValue: {
    fontSize: FSize.fs14,
    fontWeight: '700',
    color: Colors.black,
  },
  remainingLabel: {
    fontSize: FSize.fs13,
    fontWeight: '500',
    color: Colors.black,
  },
  remainingValue: {
    fontSize: FSize.fs13,
    fontWeight: '500',
    color: Colors.black,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.lightgrey2,
    marginVertical: hp(1.5),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentOrderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentOrderIdText: {
    fontSize: FSize.fs12,
    fontWeight: '500',
    color: Colors.black,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: FSize.fs13,
    fontWeight: '600',
    color: Colors.sooprsblue,
    marginRight: wp(1),
  },
  chevRightIcon: {
    width: wp(3),
    height: wp(3),
    tintColor: Colors.sooprsblue,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(10),
  },
  emptyText: {
    fontSize: FSize.fs14,
    color: Colors.gray,
  },
});