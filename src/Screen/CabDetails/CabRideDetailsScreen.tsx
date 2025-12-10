import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Colors from '../../assets/commonCSS/Colors';
import { hp, wp } from '../../assets/commonCSS/GlobalCSS';
import FSize from '../../assets/commonCSS/FSize';
import Images from '../../assets/image';

const CabRideReviewScreen = () => {
  const navigation = useNavigation();

  // STATIC DUMMY DATA
  const pickupLocation = "Delhi";
  const pickupCity = "Delhi";
  const destinationLocation = "Manali";
  const destinationCity = "Manali";

  const tripDate = "15 December";
  const people = "4";
  const rating = 4.5;
  const reviews = 150;

  const carName = "Mahindra SUV";
  const seats = "4 Seats";
  const ac = "AC";

  const totalPrice = 5499;

  const amenities = ["AC", "Music System", "Charging Point"];
  const included = ["Driver charges", "Fuel charges", "Toll tax included"];
  const notIncluded = ["Parking charges", "Extra KM charges"];

  const [travellerName, setTravellerName] = useState("");
  const [travellerMobile, setTravellerMobile] = useState("");
  const [travellerEmail, setTravellerEmail] = useState("");

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image source={Images.backArrow} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review your ride</Text>
        <View style={{ width: wp(10) }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

        {/* TRIP CARD */}
        <View style={styles.tripCard}>
          <View style={styles.tripRow}>
            <View style={styles.timelineColumn}>
              <View style={styles.pickupDotOuter}>
                <View style={styles.pickupDotInner} />
              </View>

              <View style={styles.timelineLine} />

              <Image
                source={Images.locationIcon}
                style={styles.dropIcon}
                resizeMode="contain"
              />
            </View>

            <View style={styles.tripDetailsColumn}>
              <Text style={styles.labelText}>PICKUP</Text>
              <Text style={styles.locationTitle}>{pickupLocation}</Text>
              <Text style={styles.locationSubtitle}>{pickupCity}</Text>

              <View style={styles.separator} />

              <Text style={styles.labelText}>DROPOFF</Text>
              <Text style={styles.locationTitle}>{destinationLocation}</Text>
              <Text style={styles.locationSubtitle}>{destinationCity}</Text>
            </View>
          </View>

          <View style={styles.tripMetaRow}>
            <View style={styles.metaItem}>
              <View style={styles.metaIconContainer}>
                <Image
                  source={Images.CalenderIcon}
                  style={styles.metaIcon}
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text style={styles.metaLabel}>Date</Text>
                <Text style={styles.metaValue}>{tripDate}</Text>
              </View>
            </View>

            <View style={styles.metaItem}>
              <View style={styles.metaIconContainer}>
                <Image
                  source={Images.UserRoundIcon}
                  style={styles.metaIcon}
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text style={styles.metaLabel}>People</Text>
                <Text style={styles.metaValue}>{people}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* CAB CARD */}
        <View style={styles.cabCard}>
          <View style={styles.cabHeaderRow}>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>PREMIUM</Text>
            </View>

            <View style={styles.cabRatingRow}>
              <Image
                source={Images.starIcon}
                style={styles.cabStarIcon}
                resizeMode="contain"
              />
              <Text style={styles.cabRatingText}>{rating} ({reviews})</Text>
            </View>
          </View>

          <View style={styles.cabMainRow}>
            <View style={styles.cabTitleColumn}>
              <Text style={styles.cabName}>{carName}</Text>

              <View style={styles.cabFeaturesRow}>
                <View style={styles.cabFeatureItem}>
                  <Image
                    source={Images.UserRoundIcon}
                    style={styles.cabFeatureIcon}
                  />
                  <Text style={styles.cabFeatureText}>{seats}</Text>
                </View>

                <View style={styles.cabFeatureItem}>
                  <Image
                    source={Images.carIcon}
                    style={[styles.cabFeatureIcon, { tintColor: Colors.gray }]}
                  />
                  <Text style={styles.cabFeatureText}>{ac}</Text>
                </View>
              </View>
            </View>

            <Image
              source={Images.carIcon}
              style={styles.cabImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* AMENITIES */}
        <View style={styles.amenitiesSectionWrapper}>
          <Text style={styles.amenitiesTitle}>Amenities</Text>
          <View style={styles.amenitiesContainer}>
            {amenities.map((amenity, index) => (
              <View key={index} style={styles.amenityBox}>
                <View style={styles.amenityDot} />
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* INCLUSIONS */}
        <View style={styles.inclusionsSectionWrapper}>
          <Text style={styles.inclusionsTitle}>Inclusions</Text>
          <View style={styles.inclusionsSection}>
            {included.map((item, index) => (
              <View key={index} style={styles.inclusionRow}>
                <View style={styles.greenDot} />
                <Text style={styles.inclusionText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* EXCLUSIONS */}
        <View style={styles.exclusionsSectionWrapper}>
          <Text style={styles.exclusionsTitle}>Exclusions</Text>
          <View style={styles.exclusionsSection}>
            {notIncluded.map((item, index) => (
              <View key={index} style={styles.exclusionRow}>
                <View style={styles.redDot} />
                <Text style={styles.exclusionText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* TRAVELLER DETAILS */}
        <View style={styles.travellerSection}>
          <Text style={styles.travellerTitle}>Traveller Details</Text>

          <View style={styles.travellerCard}>
            <View style={styles.travellerHeaderRow}>
              <Text style={styles.travellerLabel}>Traveller</Text>
              <TouchableOpacity>
                <Text style={styles.travellerSaveText}>Save</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.travellerInputsRow}>
              <View style={styles.travellerInputBox}>
                <Text style={styles.travellerFieldLabel}>Full Name</Text>
                <TextInput
                  style={styles.travellerFieldInput}
                  value={travellerName}
                  onChangeText={setTravellerName}
                />
              </View>

              <View style={styles.travellerInputBox}>
                <Text style={styles.travellerFieldLabel}>Mobile No.</Text>
                <TextInput
                  style={styles.travellerFieldInput}
                  value={travellerMobile}
                  onChangeText={setTravellerMobile}
                />
              </View>
            </View>

            <View style={styles.travellerInputBoxFull}>
              <Text style={styles.travellerFieldLabel}>Email ID</Text>
              <TextInput
                style={styles.travellerFieldInput}
                value={travellerEmail}
                onChangeText={setTravellerEmail}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <View style={styles.paymentOptionsContainer}>
          <View style={styles.radioOuterPayment}>
            <View style={styles.radioInnerPayment} />
          </View>
          <Text style={styles.paymentOptionAmount}>₹ {totalPrice}</Text>
        </View>

        <TouchableOpacity
          style={styles.payButton}
          onPress={() => Alert.alert("Success", "Static payment completed")}
        >
          <Text style={styles.payButtonText}>Proceed to Pay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CabRideReviewScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: hp(3.5),
    paddingBottom: hp(1.5),
    paddingHorizontal: wp(4),
  },

  backButton: { width: wp(10), height: wp(10), justifyContent: 'center' },

  backIcon: { width: wp(6), height: wp(6), tintColor: Colors.black },

  headerTitle: {
    fontSize: FSize.fs18,
    fontWeight: '700',
    color: Colors.black,
  },

  scrollView: { flex: 1 },

  scrollContent: { paddingHorizontal: wp(4), paddingBottom: hp(18) },

  /* TRIP CARD */
  tripCard: {
    borderRadius: wp(3),
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    padding: wp(4),
    backgroundColor: '#F8F9FB',
    marginBottom: hp(2),
  },

  tripRow: { flexDirection: 'row' },

  timelineColumn: { alignItems: 'center', marginRight: wp(3) },

  pickupDotOuter: {
    width: wp(4.5),
    height: wp(4.5),
    borderRadius: wp(2.25),
    backgroundColor: Colors.sooprsblue,
    justifyContent: 'center',
    alignItems: 'center',
  },

  pickupDotInner: {
    width: wp(2.2),
    height: wp(2.2),
    borderRadius: wp(1.1),
    backgroundColor: Colors.white,
  },

  timelineLine: {
    width: 1,
    height: hp(5),
    backgroundColor: Colors.lightGrey,
    marginVertical: hp(0.5),
  },

  dropIcon: { width: wp(4), height: wp(4), tintColor: Colors.sooprsblue },

  tripDetailsColumn: { flex: 1 },

  labelText: { fontSize: FSize.fs11, color: Colors.gray, fontWeight: '600' },

  locationTitle: { fontSize: FSize.fs16, fontWeight: '700', color: Colors.black },

  locationSubtitle: { fontSize: FSize.fs13, color: Colors.gray, marginBottom: hp(1) },

  separator: { height: 1, backgroundColor: Colors.lightGrey, marginVertical: hp(1) },

  tripMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(1.5),
  },

  metaItem: { flexDirection: 'row', alignItems: 'center' },

  metaIconContainer: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(2),
    backgroundColor: '#E8F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(2),
  },

  metaIcon: { width: wp(4.5), height: wp(4.5), tintColor: Colors.sooprsblue },

  metaLabel: { fontSize: FSize.fs12, color: Colors.gray },

  metaValue: { fontSize: FSize.fs14, fontWeight: '700', color: Colors.black },

  /* CAB CARD */
  cabCard: {
    borderRadius: wp(3),
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    padding: wp(4),
    marginBottom: hp(2),
  },

  cabHeaderRow: { flexDirection: 'row', justifyContent: 'space-between' },

  premiumBadge: {
    backgroundColor: Colors.black,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.7),
    borderRadius: wp(2),
  },

  premiumText: { fontSize: FSize.fs11, color: Colors.white, fontWeight: '600' },

  cabRatingRow: { flexDirection: 'row', alignItems: 'center' },

  cabStarIcon: { width: wp(3.5), height: wp(3.5), tintColor: '#FFD700' },

  cabRatingText: { fontSize: FSize.fs12, color: Colors.black, marginLeft: wp(1) },

  cabMainRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: hp(1.5) },

  cabTitleColumn: { flex: 1 },

  cabName: { fontSize: FSize.fs18, fontWeight: '700', color: Colors.black },

  cabFeaturesRow: { flexDirection: 'row', marginTop: hp(0.5) },

  cabFeatureItem: { flexDirection: 'row', alignItems: 'center', marginRight: wp(4) },

  cabFeatureIcon: { width: wp(4), height: wp(4), marginRight: wp(1) },

  cabFeatureText: { fontSize: FSize.fs13, color: Colors.gray },

  cabImage: { width: wp(28), height: wp(15) },

  /* AMENITIES */
  amenitiesSectionWrapper: { marginBottom: hp(2) },

  amenitiesTitle: { fontSize: FSize.fs16, fontWeight: '700', marginBottom: hp(1) },

  amenitiesContainer: {
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    borderRadius: wp(3),
    padding: wp(3),
  },

  amenityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(0.8),
  },

  amenityDot: {
    width: wp(2),
    height: wp(2),
    borderRadius: wp(1),
    backgroundColor: Colors.sooprsblue,
    marginRight: wp(2),
  },

  amenityText: { fontSize: FSize.fs14, color: Colors.black },

  /* INCLUSIONS */
  inclusionsSectionWrapper: { marginBottom: hp(2) },

  inclusionsTitle: { fontSize: FSize.fs16, fontWeight: '700', marginBottom: hp(1) },

  inclusionsSection: {
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    borderRadius: wp(3),
    padding: wp(3),
  },

  inclusionRow: { flexDirection: 'row', alignItems: 'center', marginVertical: hp(0.5) },

  greenDot: {
    width: wp(2),
    height: wp(2),
    borderRadius: wp(1),
    backgroundColor: '#4CAF50',
    marginRight: wp(2.5),
  },

  inclusionText: { fontSize: FSize.fs14, color: Colors.black },

  /* EXCLUSIONS */
  exclusionsSectionWrapper: { marginBottom: hp(2) },

  exclusionsTitle: { fontSize: FSize.fs16, fontWeight: '700', marginBottom: hp(1) },

  exclusionsSection: {
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    borderRadius: wp(3),
    padding: wp(3),
  },

  exclusionRow: { flexDirection: 'row', alignItems: 'center', marginVertical: hp(0.5) },

  redDot: {
    width: wp(2),
    height: wp(2),
    borderRadius: wp(1),
    backgroundColor: '#F44336',
    marginRight: wp(2.5),
  },

  exclusionText: { fontSize: FSize.fs14, color: Colors.black },

  /* TRAVELLER */
  travellerSection: { marginBottom: hp(2) },

  travellerTitle: { fontSize: FSize.fs16, fontWeight: '700', marginBottom: hp(1) },

  travellerCard: {
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    borderRadius: wp(3),
    padding: wp(3),
  },

  travellerHeaderRow: { flexDirection: 'row', justifyContent: 'space-between' },

  travellerLabel: { fontSize: FSize.fs13, color: Colors.gray },

  travellerSaveText: {
    fontSize: FSize.fs13,
    color: Colors.sooprsblue,
    fontWeight: '600',
  },

  travellerInputsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: hp(1.5) },

  travellerInputBox: { width: '48%' },

  travellerFieldLabel: { fontSize: FSize.fs12, color: Colors.gray },

  travellerFieldInput: {
    borderRadius: wp(2),
    backgroundColor: '#F5F5F5',
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    marginTop: hp(0.5),
    fontSize: FSize.fs13,
  },

  travellerInputBoxFull: { marginTop: hp(1.5) },

  /* BOTTOM BAR */
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    borderTopWidth: 1,
    borderColor: Colors.lightGrey,
    backgroundColor: Colors.white,
  },

  paymentOptionsContainer: { flexDirection: 'row', alignItems: 'center' },

  radioOuterPayment: {
    width: wp(5),
    height: wp(5),
    borderRadius: wp(2.5),
    borderWidth: 2,
    borderColor: Colors.sooprsblue,
    marginRight: wp(2),
    justifyContent: 'center',
    alignItems: 'center',
  },

  radioInnerPayment: {
    width: wp(2.5),
    height: wp(2.5),
    borderRadius: wp(1.25),
    backgroundColor: Colors.sooprsblue,
  },

  paymentOptionAmount: {
    fontSize: FSize.fs17,
    fontWeight: '700',
    color: Colors.black,
  },

  payButton: {
    backgroundColor: Colors.sooprsblue,
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.4),
    borderRadius: wp(3),
  },

  payButtonText: {
    color: Colors.white,
    fontSize: FSize.fs16,
    fontWeight: '700',
  },
});
