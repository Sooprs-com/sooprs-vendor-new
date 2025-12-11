import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
// @ts-ignore
import Clipboard from '@react-native-clipboard/clipboard';
import { hp, wp, GlobalCss } from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import Images from '../../assets/image';
import FSize from '../../assets/commonCSS/FSize';
import { mobile_siteConfig } from '../../services/mobile-siteConfig';
import { getDataWithToken } from '../../services/mobile-api';

interface OrderDetailsResponse {
  order_id: number;
  order_id_generated: string;
  order_type: string;
  order_status: 'CONFIRMED' | 'COMPLETED' | 'PENDING' | 'CANCELLED';
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

const PackageDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const routeParams = route.params as { order_id: number };
  const [orderData, setOrderData] = useState<OrderDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${formattedMinutes}${ampm}`;
  };

  const formatOrderDate = (dateString: string) => {
    try {
      // Handle date format like "2025-12-09" or ISO format
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // If date parsing fails, return as is
        return dateString;
      }
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
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
        console.log("Order details", res);
        if (res?.success && res?.data) {
          setOrderData(res.data);
        }
      })
      .catch((err: any) => {
        console.log("error in order details", err);
        Alert.alert('Error', 'Failed to load order details');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    getOrderDetailsApi();
  }, []);

  const calculateDiscount = (packagePrice: number, couponDiscount: number) => {
    return couponDiscount;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return { bg: '#FFF3E0', border: '#FF9800', text: '#FF9800' };
      case 'COMPLETED':
        return { bg: '#E8F5E9', border: '#4CAF50', text: '#4CAF50' };
      case 'PENDING':
        return { bg: '#FFF3E0', border: '#FF9800', text: '#FF9800' };
      case 'CANCELLED':
        return { bg: '#FFEBEE', border: '#F44336', text: '#F44336' };
      default:
        return { bg: '#F5F5F5', border: '#9E9E9E', text: '#9E9E9E' };
    }
  };

  const getPaymentStatusColor = (status: string) => {
    if (status === 'PAID') {
      return { bg: '#E8F5E9', border: '#4CAF50', text: '#4CAF50' };
    }
    return { bg: '#FFF3E0', border: '#FF9800', text: '#FF9800' };
  };

  // Show loading state
  if (loading || !orderData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Image source={Images.backArrow} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Package Detail</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.sooprsblue} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasCoupon = orderData.pricing.coupon_code && orderData.pricing.coupon_code.trim() !== '';
  const discountAmount = calculateDiscount(orderData.pricing.package_price, orderData.pricing.coupon_discount);
  const statusColors = getStatusColor(orderData.order_status);
  const paymentStatusColors = getPaymentStatusColor(orderData.payment_status);

  // Get customer details from order_details
  const customerName = orderData.order_details?.name || orderData.user_details.name;
  const customerMobile = orderData.order_details?.mobile || orderData.user_details.mobile;
  const customerEmail = orderData.order_details?.email || orderData.user_details.email;

  // Get locations from package
  const pickupLocation = orderData.package?.location1 || null;
  const dropLocation = orderData.package?.location2 || null;

  // Get image URI helper function
  const getImageUri = (imagePath: string | null): any => {
    if (imagePath) {
      const baseUrl = mobile_siteConfig.BASE_URL.replace('/api/', '');
      return { uri: baseUrl + imagePath };
    }
    return Images.profileImage;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image source={Images.backArrow} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Package Detail</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Order Summary Card */}
        <View style={styles.card}>
          <View style={styles.orderIdRow}>
            <View style={styles.orderIdContainer}>
              <Text style={styles.orderIdLabel}>Order ID</Text>
              <View style={styles.orderIdValueContainer}>
                <Text style={styles.orderIdValue}>{orderData.order_id_generated}</Text>
                <TouchableOpacity 
                  onPress={() => copyToClipboard(orderData.order_id_generated, 'Order ID')}
                  style={styles.copyButton}>
                  {/* <Image source={Images.copyIcon} style={styles.copyIcon} /> */}
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.orderPlacedContainer}>
              <Text style={styles.orderPlacedLabel}>Order Placed</Text>
              <Text style={styles.orderPlacedValue}>{formatDate(orderData.order_created_at)}</Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Order Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColors.bg, borderColor: statusColors.border }]}>
                <Text style={[styles.statusText, { color: statusColors.text }]}>
                  {orderData.order_status === 'CONFIRMED' ? 'PROCESSING' : orderData.order_status}
                </Text>
              </View>
            </View>
            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Payment Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: paymentStatusColors.bg, borderColor: paymentStatusColors.border }]}>
                <Text style={[styles.statusText, { color: paymentStatusColors.text }]}>
                  ✓ {orderData.payment_status}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Package Details Section */}
        <Text style={styles.sectionTitle}>Package Details</Text>
        <View style={styles.card}>
          <View style={styles.packageDetailsRow}>
            <Image 
              source={getImageUri(orderData.package?.thumbnail_image)} 
              style={styles.packageImage} 
              resizeMode="cover"
            />
            <View style={styles.packageInfo}>
              <Text style={styles.packageName}>{orderData.package?.name}</Text>
              {pickupLocation && dropLocation && (
                <View style={styles.locationContainer}>
                  <View style={styles.locationRow}>
                    <Image source={Images.localIcon} style={styles.locationIcon} />
                    <Text style={styles.locationText}>{pickupLocation}</Text>
                  </View>
                  <View style={styles.locationRow}>
                    <Image source={Images.localIcon} style={styles.locationIcon} />
                    <Text style={styles.locationText}>{dropLocation}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Pricing Details Section */}
        <Text style={styles.sectionTitle}>Pricing Details</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Package Price:</Text>
            <Text style={styles.detailValue}>{formatPrice(orderData.pricing.package_price)}</Text>
          </View>
          
          {hasCoupon && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Coupon Code:</Text>
                <Text style={styles.detailValue}>{orderData.pricing.coupon_code}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Coupon Discount:</Text>
                <Text style={[styles.detailValue, styles.discountText]}>
                  -{formatPrice(orderData.pricing.coupon_discount)}
                </Text>
              </View>
            </>
          )}

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, styles.boldLabel]}>Final Amount:</Text>
            <Text style={[styles.detailValue, styles.boldValue]}>
              {formatPrice(orderData.pricing.final_amount)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Remaining Amount:</Text>
            <Text style={[styles.detailValue, styles.remainingText]}>
              {formatPrice(orderData.pricing.remaining_amount)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Order ID:</Text>
            <Text style={styles.detailValue}>{orderData.pricing.payment_order_id}</Text>
          </View>
        </View>

        {/* Order Details Section */}
        <Text style={styles.sectionTitle}>Order Details</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name:</Text>
            <Text style={styles.detailValue}>{customerName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mobile:</Text>
            <Text style={styles.detailValue}>{customerMobile}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{customerEmail}</Text>
          </View>
          {orderData.order_details?.date && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{formatOrderDate(orderData.order_details.date)}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PackageDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: hp(2),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightgrey2,
  },
  backButton: {
    padding: wp(2),
  },
  backIcon: {
    width: wp(6),
    height: wp(6),
    tintColor: Colors.black,
  },
  headerTitle: {
    fontSize: FSize.fs18,
    fontWeight: '700',
    color: Colors.black,
  },
  placeholder: {
    width: wp(10),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: wp(4),
    paddingBottom: hp(3),
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: wp(3),
    padding: wp(5),
    marginBottom: hp(2),
    ...GlobalCss.shadowBox,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
  },
  orderIdContainer: {
    flex: 1,
  },
  orderIdLabel: {
    fontSize: FSize.fs12,
    color: Colors.gray,
    marginBottom: hp(0.3),
  },
  orderIdValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderIdValue: {
    fontSize: FSize.fs14,
    fontWeight: '600',
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
  orderPlacedContainer: {
    alignItems: 'flex-end',
  },
  orderPlacedLabel: {
    fontSize: FSize.fs12,
    color: Colors.gray,
    marginBottom: hp(0.3),
  },
  orderPlacedValue: {
    fontSize: FSize.fs12,
    fontWeight: '600',
    color: Colors.black,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusContainer: {
    // flex: 1,
  },
  statusLabel: {
    fontSize: FSize.fs12,
    color: Colors.gray,
    marginBottom: hp(0.5),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.6),
    borderRadius: wp(2),
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: FSize.fs11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: hp(1),
    marginTop: hp(0.5),
  },
  packageDetailsRow: {
    flexDirection: 'row',
  },
  packageImage: {
    width: wp(25),
    height: wp(25),
    borderRadius: wp(2),
    marginRight: wp(4),
  },
  packageInfo: {
    flex: 1,
  },
  packageName: {
    fontSize: FSize.fs15,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: hp(1),
    lineHeight: hp(2.2),
  },
  locationContainer: {
    marginTop: hp(0.5),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(0.5),
  },
  locationIcon: {
    width: wp(4),
    height: wp(4),
    tintColor: Colors.sooprsblue,
    marginRight: wp(2),
  },
  locationText: {
    fontSize: FSize.fs13,
    color: Colors.black,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  detailLabel: {
    fontSize: FSize.fs13,
    color: Colors.black,
    flex: 1,
  },
  detailValue: {
    fontSize: FSize.fs13,
    color: Colors.black,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  boldLabel: {
    fontWeight: '700',
  },
  boldValue: {
    fontWeight: '700',
  },
  discountText: {
    color: '#4CAF50',
  },
  remainingText: {
    color: '#F44336',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: hp(2),
    fontSize: FSize.fs14,
    color: Colors.gray,
  },
});
