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
    <ScrollView showsVerticalScrollIndicator={false}>
      

      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <Text style={styles.helloText}>Hello Ankur</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity>
            <Image source={Images.bellIcon} style={styles.bellIcon} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('ProfileScreen' as never)}>
            <Image source={Images.profileImage} style={styles.profileImg} />
          </TouchableOpacity>
        </View>
      </View>


      <View style={styles.headerDivider} />


      {/* ================= STATS BOX ================= */}

      <View style={styles.statsRow}>

        {/* Earnings */}
        <View style={styles.statCard}>
          <Image source={Images.walletIcon} style={styles.statIcon} />
          <Text style={styles.statValue}>₹ 10,550</Text>
          <Text style={styles.statLabel}>Total Earnings</Text>
        </View>

        {/* Active Trips */}
        <View style={styles.statCard}>
          <Image source={Images.activeTripIcon} style={styles.statIcon} />
          <Text style={styles.statValue}>8</Text>
          <Text style={styles.statLabel}>Active Trips</Text>
        </View>

        {/* Rating */}
        <View style={styles.statCard}>
          <Image source={Images.ratingStar} style={styles.statIcon} />
          <Text style={styles.statValue}>4.9</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>


      {/* ================= ADD PACKAGE LISTING ================= */}
      <TouchableOpacity style={styles.addListingBtn}
          onPress={() => navigation.navigate("AddPackagesScreen")}
>
        <Text style={styles.addText}>+   Add New Package Listing</Text>
      </TouchableOpacity>


      {/* ================= REQUESTS TITLE ================= */}
      <Text style={styles.reqTitle}>Requests</Text>


      {/* ================= EACH REQUEST CARD ================= */}
      
      {Array(3).fill(0).map((_, i) => (
        <View key={i} style={styles.reqCard}>

          <Text style={styles.reqTitle2}>Delhi to Kanpur Sedan Cab</Text>

          <Text style={styles.reqDesc}>
            The customer wants to book an outstation cab for a Delhi to
            Mathura trip and is expecting a smooth ride, punctual driver,
            and a clean vehicle.
          </Text>
           <View style={styles.Desc}>

             <Text style={[styles.reqDesc, {marginTop: 10}]}>Pickup Date:</Text>
            <Text style={styles.reqDate}> 28 Dec 25</Text>
           </View>
         
          <View style={styles.reqBtnRow}>
            <TouchableOpacity style={styles.ignoreBtn}>
              <Text style={styles.ignoreText}>Ignore</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.acceptBtn}>
              <Text style={styles.acceptText}>Accept</Text>
            </TouchableOpacity>
          </View>

        </View>
      ))}

    </ScrollView>
  </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  /* ------------ HEADER ------------ */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    alignItems: 'center',
  },
  helloText: {
    fontSize: FSize.fs18,
    fontWeight: '700',
    color: Colors.black,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellIcon: {
    width: wp(5),
    height: wp(5),
    marginRight: wp(3),
     tintColor: Colors.yellow, 
   
  },
  profileImg: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(5),
  },
headerDivider: {
  width: '100%',
  height: hp(0.1),
  backgroundColor: Colors.lightgrey2,
  marginTop: hp(0.5),
},

  /* ------------ STATS ------------ */
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: wp(5),
    marginTop: hp(2),
  },

  statCard: {
    width: wp(28),
    backgroundColor: Colors.white,
    elevation: 3,
    borderRadius: wp(3),
    paddingVertical: hp(2),
    alignItems: 'center',
  },
  statIcon: {
    width: wp(8),
    height: wp(8),
    marginBottom: hp(1),
  },
  statValue: {
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: Colors.black,
  },
  statLabel: {
    fontSize: FSize.fs11,
    color: Colors.grey,
    marginTop: hp(0.3),
  },

  /* ------------ Add New Package Button ------------ */
  addListingBtn: {
    marginHorizontal: wp(5),
    marginTop: hp(2),
    paddingVertical: hp(1.8),
    borderWidth: 1.5,
    borderColor: Colors.sooprsblue,
    borderRadius: wp(3),
     borderStyle: 'dashed', 
    alignItems: 'center',
  },
  addText: {
    fontSize: FSize.fs13,
    color: Colors.sooprsblue,
    fontWeight: '600',
  },

  /* ------------ Request Section ------------ */
  reqTitle: {
    marginLeft: wp(5),
    marginTop: hp(2),
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: Colors.black,
  },

  /* ------------ Request Cards ------------ */
  reqCard: {
    marginHorizontal: wp(5),
    backgroundColor: Colors.white,
    elevation: 3,
    marginTop: hp(2),
    padding: wp(4),
    borderRadius: wp(3),
  },
  reqTitle2: {
    fontSize: FSize.fs15,
    fontWeight: '700',
    color: Colors.black,
  },
  Desc:{
     flexDirection: 'row',
    alignItems:'center',
    // marginTop: hp(1),
  },
  reqDesc: {
    fontSize: FSize.fs12,
    marginTop: hp(1),
    color: Colors.grey,
    lineHeight: hp(2.2),
  },
  reqDate: {
    marginTop: hp(1.4),
    fontSize: FSize.fs12,
    fontWeight: '500',
    color: Colors.darkGray,
  },

  reqBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(2),
  },
  ignoreBtn: {
    width: '48%',
    paddingVertical: hp(1.4),
    borderRadius: wp(3),
    borderWidth: 1,
    borderColor: Colors.grey,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  acceptBtn: {
    width: '48%',
    paddingVertical: hp(1.4),
    borderRadius: wp(3),
    backgroundColor: Colors.sooprsblue,
    alignItems: 'center',
  },
  ignoreText: {
    fontSize: FSize.fs13,
    color: Colors.grey,
    fontWeight: '600',
  },
  acceptText: {
    fontSize: FSize.fs13,
    color: Colors.white,
    fontWeight: '700',
  },
});
