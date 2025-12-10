import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import React, {useEffect, useState, useCallback} from 'react';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {hp, wp, GlobalCss} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import Images from '../../assets/image';
import FSize from '../../assets/commonCSS/FSize';
import { getDataWithToken } from '../../services/mobile-api';
import { mobile_siteConfig } from '../../services/mobile-siteConfig';

const Home = () => {
  const navigation = useNavigation();
  const [userName, setUserName] = useState('Ankur');
  const [totalEarnings, setTotalEarnings] = useState('10,550');
  const [activeTrips, setActiveTrips] = useState(8);
  const [rating, setRating] = useState(4.9);

  const [leads] = useState([
    {
      id: '1',
      pickupLocation: 'Manali Hill Station',
      dropoffLocation: 'IGIT Airport',
      expiresIn: '15 m',
      estimatedDistance: '450 km',
      pickupDate: '28 Dec 25',
      pickupTime: '5:00 PM',
      vehicleType: 'SEDAN',
      customerName: 'Abhinav Pandey',
      customerRating: 4.9,
      customerPhone: '9777567656',
      customerImage: Images.profileImage,
      estimatedEarning: '₹4500',
    },
  ]);

  const [ongoingOrders] = useState([
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
  ]);

  const renderSummaryCard = (
    icon: any,
    value: string,
    label: string,
    iconColor: string,
  ) => (
    <View style={styles.summaryCard}>
      <Image source={icon} style={[styles.summaryIcon, {tintColor: iconColor}]} />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );

  const renderLeadCard = (lead: any) => (
    <View key={lead.id} style={styles.leadCard}>
      {/* Top Section - Route Info Left, Expiry Right */}
      <View style={styles.topSection}>
        <View style={styles.routeLeftSection}>
          <View style={styles.routeItem}>
            <View style={styles.pickupDot} />
            <View style={styles.routeTextContainer}>
              <Text style={styles.routeLabel}>PICKUP</Text>
              <Text style={styles.routeLocation}>{lead.pickupLocation}</Text>
            </View>
          </View>

          <View style={styles.dottedLineContainer}>
            <View style={styles.dottedLine} />
          </View>

          <View style={styles.routeItem}>
            <View style={styles.dropoffDot} />
            <View style={styles.routeTextContainer}>
              <Text style={styles.routeLabel}>DROPOFF</Text>
              <Text style={styles.routeLocation}>{lead.dropoffLocation}</Text>
            </View>
          </View>
        </View>

        <View style={styles.topRightSection}>
          <View style={styles.expiryContainer}>
            <Image source={Images.CalenderIcon} style={styles.clockIcon} />
            <Text style={styles.expiryText}>Exp: {lead.expiresIn}</Text>
          </View>
          <Text style={styles.distanceText}>
            Est. Distance: {lead.estimatedDistance}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Middle Section - Pickup Schedule Left, Vehicle Right */}
      <View style={styles.middleSection}>
        <View style={styles.scheduleLeftSection}>
          <Text style={styles.scheduleText}>
            Pickup Date: {lead.pickupDate}
          </Text>
          <Text style={styles.scheduleText}>Time: {lead.pickupTime}</Text>
        </View>

        <View style={styles.vehicleContainer}>
          <Image source={Images.carIcon} style={styles.carIcon} />
          <TouchableOpacity style={styles.vehicleButton}>
            <Text style={styles.vehicleButtonText}>{lead.vehicleType}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Customer Section - Profile Left, Phone Right */}
      <View style={styles.customerSection}>
        <View style={styles.customerLeftSection}>
          <Image source={lead.customerImage} style={styles.customerImage} />
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{lead.customerName}</Text>
            <View style={styles.ratingContainer}>
              <Image source={Images.starIcon} style={styles.starIcon} />
              <Text style={styles.ratingText}>{lead.customerRating}</Text>
            </View>
          </View>
        </View>

        <View style={styles.phoneSection}>
          <Text style={styles.phoneLabel}>Phone Number</Text>
          <Text style={styles.phoneNumber}>{lead.customerPhone}</Text>
        </View>
      </View>

      {/* Bottom Section - Earning Left, Buttons Right */}
      <View style={styles.footerContainer}>
        <View style={styles.earningContainer}>
          <Text style={styles.earningLabel}>Est. Earning</Text>
          <Text style={styles.earningAmount}>{lead.estimatedEarning}</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.ignoreButton}>
            <Text style={styles.ignoreButtonText}>Ignore</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptButton}>
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderOngoingOrderCard = (order: any) => (
    <View key={order.id} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderIdText}>Order ID: {order.orderId}</Text>
          <Text style={styles.orderTimeText}>{order.time}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>

      <View style={styles.orderCustomerSection}>
        <Image source={order.customerImage} style={styles.orderCustomerImage} />
        <View style={styles.orderCustomerInfo}>
          <View style={styles.orderCustomerNameRow}>
            <Text style={styles.orderCustomerName}>{order.customerName}</Text>
            <Image source={Images.phoneIcon} style={styles.orderPhoneIcon} />
          </View>
          <Text style={styles.paymentMethodText}>{order.paymentMethod}</Text>
        </View>
      </View>

      <View style={styles.orderLocationSection}>
        <Text style={styles.orderLocationText}>
          Pickup: {order.pickupLocation}
        </Text>
        <Text style={styles.orderLocationText}>
          Drop: {order.dropLocation}
        </Text>
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.orderPrice}>{order.price}</Text>
        <TouchableOpacity style={styles.navigateButton}>
          <Image source={Images.sendIcon} style={styles.navigateIcon} />
          <Text style={styles.navigateButtonText}>Navigate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getUserDetails = async () => {
    try {
      const res: any = await getDataWithToken({}, mobile_siteConfig.GET_USER_DETAILS);
      const data: any = await res.json();
      console.log('User details data:::::', data);
      
      // Check if profile is completed
      if (data?.success && data?.vendorDetail) {
        const isProfileCompleted = data.vendorDetail.is_profile_completed;
        
        // Update user name from API response
        if (data.vendorDetail.name) {
          setUserName(data.vendorDetail.name);
        }
        
        // If profile is not completed (0), replace with HomeVerification screen
        if (isProfileCompleted === 0) {
          (navigation as any).replace('HomeVerification');
        }
        // If profile is completed (1), stay on Home screen (already here)
      }
    } catch (err: any) {
      console.log('Error fetching user details:::::', err);
    }
  };

  // Check profile status when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      getUserDetails();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greetingText}>Hello {userName}</Text>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summaryCardsContainer}>
          {renderSummaryCard(
            Images.walletIcon,
            `₹ ${totalEarnings}`,
            'Total Earnings',
            Colors.sooprsblue,
          )}
          {renderSummaryCard(
            Images.carIcon,
            activeTrips.toString(),
            'Active Trips',
            Colors.sooprsblue,
          )}
          {renderSummaryCard(
            Images.starIcon,
            rating.toString(),
            'Rating',
            Colors.sooprsblue,
          )}
        </View>

        {/* Add New Package Listing Button */}
        <TouchableOpacity style={styles.addPackageButton}>
          <Image source={Images.addIcon} style={styles.addIcon} />
          <Text style={styles.addPackageText}>Add New Package Listing</Text>
        </TouchableOpacity>

        {/* My Leads Section */}
        <TouchableOpacity style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Leads ({leads.length})</Text>
          <Image source={Images.rigthArrowIcon} style={styles.arrowIcon} />
        </TouchableOpacity>

        {/* Lead Card */}
        {leads.map(lead => renderLeadCard(lead))}

        {/* My Ongoing Orders Section */}
        <TouchableOpacity style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            My Ongoing Orders ({ongoingOrders.length})
          </Text>
          <Image source={Images.rigthArrowIcon} style={styles.arrowIcon} />
        </TouchableOpacity>

        {/* Ongoing Order Card */}
        {ongoingOrders.map(order => renderOngoingOrderCard(order))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: hp(3),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(3),
    borderTopWidth: hp(0.1),
    borderTopColor: Colors.lightgrey2,
  },
  header: {
    paddingHorizontal: wp(6),
    paddingTop: hp(2),
    paddingBottom: hp(1.5),
    backgroundColor: Colors.white,
  },
  greetingText: {
    fontSize: FSize.fs14,
    fontWeight: '600',
    color: Colors.black,
  },
  summaryCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(1),
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: wp(3),
    padding: wp(3),
    alignItems: 'center',
    marginHorizontal: wp(1),
    ...GlobalCss.shadowBox,
    elevation: 2,
  },
  summaryIcon: {
    width: wp(8),
    height: wp(8),
    marginBottom: hp(0.5),
  },
  summaryValue: {
    fontSize: FSize.fs18,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: hp(0.3),
  },
  summaryLabel: {
    fontSize: FSize.fs11,
    color: Colors.gray,
    fontWeight: '500',
  },
  addPackageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: wp(4),
    marginTop: hp(2),
    marginBottom: hp(1),
    paddingVertical: hp(2),
    borderRadius: wp(3),
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.sooprsblue,
    backgroundColor: Colors.white,
  },
  addIcon: {
    width: wp(5),
    height: wp(5),
    marginRight: wp(2),
    tintColor: Colors.sooprsblue,
  },
  addPackageText: {
    fontSize: FSize.fs14,
    fontWeight: '600',
    color: Colors.sooprsblue,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(6),
    paddingTop: hp(2),
    paddingBottom: hp(1),
  },
  sectionTitle: {
    fontSize: FSize.fs18,
    fontWeight: '700',
    color: Colors.black,
  },
  arrowIcon: {
    width: wp(5),
    height: wp(5),
    tintColor: Colors.black,
  },
  // Lead Card Styles
  leadCard: {
    backgroundColor: Colors.white,
    borderRadius: wp(4),
    padding: wp(5),
    marginHorizontal: wp(4),
    marginBottom: hp(2),
    borderWidth: hp(0.1),
    borderColor: Colors.lightgrey2,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
  },
  routeLeftSection: {
    flex: 1,
    marginRight: wp(3),
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(0.5),
  },
  pickupDot: {
    width: wp(3.5),
    height: wp(3.5),
    borderRadius: wp(1.75),
    backgroundColor: '#4CAF50',
    marginTop: wp(0.8),
    marginRight: wp(2.5),
  },
  dropoffDot: {
    width: wp(3.5),
    height: wp(3.5),
    borderRadius: wp(1.75),
    backgroundColor: '#F44336',
    marginTop: wp(0.8),
    marginRight: wp(2.5),
  },
  routeTextContainer: {
    flex: 1,
  },
  routeLabel: {
    fontSize: FSize.fs10,
    fontWeight: '600',
    color: Colors.gray,
    marginBottom: hp(0.2),
    letterSpacing: 0.5,
  },
  routeLocation: {
    fontSize: FSize.fs15,
    fontWeight: '700',
    color: Colors.black,
    lineHeight: hp(2.2),
  },
  dottedLineContainer: {
    paddingLeft: wp(1.75),
    marginVertical: hp(0.3),
    height: hp(2.5),
    justifyContent: 'center',
  },
  dottedLine: {
    width: 2,
    height: hp(2.5),
    backgroundColor: Colors.lightgrey2,
    opacity: 0.5,
  },
  topRightSection: {
    alignItems: 'flex-end',
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(0.8),
  },
  clockIcon: {
    width: wp(4.5),
    height: wp(4.5),
    marginRight: wp(1.5),
    tintColor: 'rgba(210, 2, 80, 0.82)',
  },
  expiryText: {
    fontSize: FSize.fs13,
    fontWeight: '600',
    color: 'rgba(210, 2, 80, 0.82)',
  },
  distanceText: {
    fontSize: FSize.fs12,
    color: Colors.gray,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.lightgrey1,
  },
  middleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(0.2),
    marginTop: hp(1.5),
  },
  scheduleLeftSection: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  scheduleText: {
    fontSize: FSize.fs13,
    color: Colors.gray,
    fontWeight: '500',
    marginBottom: hp(0.5),
  },
  vehicleContainer: {
    alignItems: 'center',
    paddingVertical: hp(1),
    marginLeft: wp(2),
  },
  carIcon: {
    width: hp(15),
    height: hp(8),
    resizeMode: 'none',
  },
  vehicleButton: {
    backgroundColor: 'rgba(239, 246, 255, 0.3)',
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.2),
    borderRadius: wp(2.5),
    width: '100%',
  },
  vehicleButtonText: {
    fontSize: FSize.fs13,
    fontWeight: '700',
    color: Colors.sooprsblue,
    textAlign: 'center',
  },
  customerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    borderRadius: wp(2.5),
    backgroundColor: 'rgba(239, 246, 255, 1)',
    alignItems: 'flex-start',
    marginBottom: hp(1),
    marginTop: hp(1.5),
  },
  customerLeftSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  customerImage: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(7),
    marginRight: wp(3),
  },
  customerInfo: {
    justifyContent: 'center',
    flex: 1,
  },
  customerName: {
    fontSize: FSize.fs13,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: hp(0.4),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    width: wp(4),
    height: wp(4),
    marginRight: wp(1),
    tintColor: '#FFD700',
  },
  ratingText: {
    fontSize: FSize.fs12,
    fontWeight: '600',
    color: Colors.gray,
  },
  phoneSection: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginLeft: wp(3),
  },
  phoneLabel: {
    fontSize: FSize.fs11,
    color: Colors.gray,
    marginBottom: hp(0.2),
  },
  phoneNumber: {
    fontSize: FSize.fs12,
    fontWeight: '600',
    color: 'rgba(93, 93, 93, 1)',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(0.5),
  },
  earningContainer: {
    flex: 1,
  },
  earningLabel: {
    fontSize: FSize.fs12,
    color: Colors.gray,
    marginBottom: hp(0.3),
  },
  earningAmount: {
    fontSize: FSize.fs20,
    fontWeight: '600',
    color: Colors.black,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: wp(2.5),
  },
  ignoreButton: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.lightgrey2,
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.3),
    borderRadius: wp(2.5),
  },
  ignoreButtonText: {
    fontSize: FSize.fs14,
    fontWeight: '600',
    color: Colors.gray,
  },
  acceptButton: {
    backgroundColor: Colors.sooprsblue,
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.3),
    borderRadius: wp(2.5),
  },
  acceptButtonText: {
    fontSize: FSize.fs14,
    fontWeight: '600',
    color: Colors.white,
  },
  // Ongoing Order Card Styles
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: wp(4),
    padding: wp(5),
    marginHorizontal: wp(4),
    marginBottom: hp(2),
    borderWidth: hp(0.1),
    borderColor: Colors.lightgrey2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(1.5),
  },
  orderIdText: {
    fontSize: FSize.fs14,
    fontWeight: '700',
    color: Colors.black,
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
    borderRadius: wp(4),
  },
  statusText: {
    fontSize: FSize.fs11,
    fontWeight: '700',
    color: Colors.white,
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
    marginBottom: hp(0.3),
  },
  orderCustomerName: {
    fontSize: FSize.fs15,
    fontWeight: '700',
    color: Colors.black,
    marginRight: wp(2),
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
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    paddingVertical: hp(1),
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
});
