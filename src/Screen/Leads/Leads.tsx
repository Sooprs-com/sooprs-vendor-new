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

interface Lead {
  id: string;
  pickupLocation: string;
  dropoffLocation: string;
  expiresIn: string;
  estimatedDistance: string;
  pickupDate: string;
  pickupTime: string;
  vehicleType: string;
  customerName: string;
  customerRating: number;
  customerPhone: string;
  customerImage: any;
  estimatedEarning: string;
}

const Leads = () => {
  const [leads] = useState<Lead[]>([
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
    {
      id: '2',
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
    {
      id: '3',
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

  const handleAccept = (leadId: string) => {
    console.log('Accept lead:', leadId);
    // Handle accept logic
  };

  const handleIgnore = (leadId: string) => {
    console.log('Ignore lead:', leadId);
    // Handle ignore logic
  };

  const renderLeadCard = (lead: Lead) => (
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

        {/* Right Side - Expiry and Distance */}
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

      {/* Divider Line */}
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

      {/* Divider Line */}
      {/* <View style={styles.divider} /> */}

      {/* Customer Section - Profile Left, Phone Right */}
      <View style={styles.customerSection}>
        {/* Left Side - Customer Profile */}
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

        {/* Right Side - Phone Number */}
        <View style={styles.phoneSection}>
          <Text style={styles.phoneLabel}>Phone Number</Text>
          <Text style={styles.phoneNumber}>{lead.customerPhone}</Text>
        </View>
      </View>

      {/* Divider Line */}
      {/* <View style={styles.divider} /> */}

      {/* Bottom Section - Earning Left, Buttons Right */}
      <View style={styles.footerContainer}>
        {/* Left Side - Earning */}
        <View style={styles.earningContainer}>
          <Text style={styles.earningLabel}>Est. Earning</Text>
          <Text style={styles.earningAmount}>{lead.estimatedEarning}</Text>
        </View>

        {/* Right Side - Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.ignoreButton}
            onPress={() => handleIgnore(lead.id)}>
            <Text style={styles.ignoreButtonText}>Ignore</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAccept(lead.id)}>
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Leads ({leads.length})</Text>
        <TouchableOpacity>
          <Image source={Images.searchIcon} style={styles.searchIcon} />
        </TouchableOpacity>
      </View>

      {/* Leads List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {leads.map(lead => renderLeadCard(lead))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Leads;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(6),
    paddingTop: hp(6),
    // paddingBottom: hp(2),
    paddingBottom: hp(2),
    backgroundColor: Colors.white,
  },
  headerTitle: {
    fontSize: FSize.fs18,
    fontWeight: '600',
    color: Colors.black,
  },
  searchIcon: {
    width: wp(6),
    height: wp(6),
    tintColor: Colors.black,
  },
  scrollView: {
    flex: 1,
    borderTopWidth:hp(.1),
    borderTopColor:Colors.lightgrey2,
    backgroundColor:Colors.white,
  },
  scrollContent: {
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(2),
  },
  leadCard: {
    backgroundColor: Colors.white,
    borderRadius: wp(4),
    padding: wp(5),
    marginBottom: hp(2),
    // ...GlobalCss.shadowBox,
    borderWidth:hp(.1),
    borderColor:Colors.lightgrey2,
    // elevation: 3,
    // shadowColor: '#000',
    // shadowOffset: {width: 0, height: 2},
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
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
    // marginVertical: hp(1.5),
  },
  middleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(.2),
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
    // width: wp(28),
    marginLeft: wp(2),
  },
  carIcon: {
    width: hp(15),
    height: hp(8),
    resizeMode:"none",
    // marginBottom: hp(1),
  },
  vehicleButton: {
    backgroundColor: "rgba(239, 246, 255, 0.3)",
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
    backgroundColor:"rgba(239, 246, 255, 1)",
    alignItems: 'flex-start',
    marginBottom: hp(1),
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
    color: "rgba(93, 93, 93, 1)",
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
});