import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import React, {useState} from 'react';
import {hp, wp, GlobalCss} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import Images from '../../assets/image';
import FSize from '../../assets/commonCSS/FSize';

interface Order {
  id: string;
  orderId: string;
  time: string;
  status: 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  customerName: string;
  paymentMethod: string;
  pickupLocation: string;
  dropLocation: string;
  price: string;
  customerImage: any;
}

const Order = () => {
  const [activeTab, setActiveTab] = useState<'ONGOING' | 'COMPLETED' | 'CANCELLED'>('ONGOING');

  const [ongoingOrders] = useState<Order[]>([
    {
      id: '1',
      orderId: 'ORD-7829',
      time: '10:30 AM',
      status: 'ONGOING',
      customerName: 'Abhinav Pandey',
      paymentMethod: 'Cash',
      pickupLocation: 'Uttam Nagar, Delhi',
      dropLocation: 'Manali Mall Road',
      price: '₹5,700',
      customerImage: Images.profileImage,
    },
    {
      id: '2',
      orderId: 'ORD-7830',
      time: '11:45 AM',
      status: 'ONGOING',
      customerName: 'Abhinav Pandey',
      paymentMethod: 'Cash',
      pickupLocation: 'Uttam Nagar, Delhi',
      dropLocation: 'Manali Mall Road',
      price: '₹5,700',
      customerImage: Images.profileImage,
    },
  ]);

  const [completedOrders] = useState<Order[]>([]);
  const [cancelledOrders] = useState<Order[]>([]);

  const getOrdersByStatus = () => {
    switch (activeTab) {
      case 'ONGOING':
        return ongoingOrders;
      case 'COMPLETED':
        return completedOrders;
      case 'CANCELLED':
        return cancelledOrders;
      default:
        return ongoingOrders;
    }
  };

  const renderOrderCard = (order: Order) => (
    <View key={order.id} style={styles.orderCard}>
      {/* Top Row - Order ID, Time, Status Badge */}
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderIdText}>Order ID: {order.orderId}</Text>
          <Text style={styles.orderTimeText}>{order.time}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>

      {/* Customer Details */}
      <View style={styles.orderCustomerSection}>
        <Image source={order.customerImage} style={styles.orderCustomerImage} />
        <View style={styles.orderCustomerInfo}>
          <View style={styles.orderCustomerNameRow}>
            <Text style={styles.orderCustomerName}>{order.customerName}</Text>
            <TouchableOpacity style={styles.phoneButton}>
              <Image source={Images.phoneIcon} style={styles.orderPhoneIcon} />
            </TouchableOpacity>
          </View>
          <Text style={styles.paymentMethodText}>{order.paymentMethod}</Text>
        </View>
      </View>

      {/* Location Details */}
      <View style={styles.orderLocationSection}>
        <Text style={styles.orderLocationText}>
          Pickup: <Text style={styles.locationBold}>{order.pickupLocation}</Text>
        </Text>
        <Text style={styles.orderLocationText}>
          Drop: <Text style={styles.locationBold}>{order.dropLocation}</Text>
        </Text>
      </View>

      {/* Price and Navigate Button */}
      <View style={styles.orderFooter}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.orderPrice}>{order.price}</Text>
        </View>
        <TouchableOpacity style={styles.navigateButton}>
          <Image source={Images.sendIcon} style={styles.navigateIcon} />
          <Text style={styles.navigateButtonText}>Navigate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        {getOrdersByStatus().length > 0 ? (
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
    paddingTop: hp(3),
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
    alignItems: 'flex-start',
    marginBottom: hp(1.5),
  },
  orderIdText: {
    fontSize: FSize.fs13,
    fontWeight: '500',
    color: Colors.gray,
    marginBottom: hp(0.3),
  },
  orderTimeText: {
    fontSize: FSize.fs12,
    color: Colors.gray,
  },
  statusBadge: {
    backgroundColor: Colors.sooprsblue,
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.5),
    borderRadius: wp(2),
  },
  statusText: {
    fontSize: FSize.fs11,
    fontWeight: '700',
    color: Colors.white,
    textTransform: 'uppercase',
  },
  orderCustomerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  orderCustomerImage: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    marginRight: wp(3),
  },
  orderCustomerInfo: {
    flex: 1,
  },
  orderCustomerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(0.3),
  },
  orderCustomerName: {
    fontSize: FSize.fs15,
    fontWeight: '700',
    color: Colors.black,
  },
  phoneButton: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderPhoneIcon: {
    width: wp(5),
    height: wp(5),
    tintColor: '#4CAF50',
  },
  paymentMethodText: {
    fontSize: FSize.fs12,
    color: Colors.gray,
  },
  orderLocationSection: {
    marginBottom: hp(1.5),
  },
  orderLocationText: {
    fontSize: FSize.fs13,
    color: Colors.black,
    marginBottom: hp(0.3),
    fontWeight: '500',
  },
  locationBold: {
    fontWeight: '700',
    color: Colors.black,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: FSize.fs11,
    color: Colors.gray,
    marginBottom: hp(0.3),
  },
  orderPrice: {
    fontSize: FSize.fs18,
    fontWeight: '700',
    color: Colors.black,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sooprsblue,
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.2),
    borderRadius: wp(2.5),
  },
  navigateIcon: {
    width: wp(4),
    height: wp(4),
    marginRight: wp(1.5),
    tintColor: Colors.white,
  },
  navigateButtonText: {
    fontSize: FSize.fs13,
    fontWeight: '600',
    color: Colors.white,
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