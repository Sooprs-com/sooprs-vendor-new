import React, { useState, useRef, useEffect } from 'react';
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
  FlatList,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Colors from '../../assets/commonCSS/Colors';
import { hp, wp } from '../../assets/commonCSS/GlobalCSS';
import FSize from '../../assets/commonCSS/FSize';
import Images from '../../assets/image';
import { getDataWithToken } from '../../services/mobile-api';
import { mobile_siteConfig } from '../../services/mobile-siteConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CabRideReviewScreen = ({route}: any) => {
  const { data } = route.params;
  const navigation = useNavigation();
  const carouselRef = useRef<FlatList>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [packageData, setPackageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const toggleAnim = useRef(new Animated.Value(1)).current;

  // Get image URI helper function
  const getImageUri = (imagePath: string | null): any => {
    if (imagePath) {
      const baseUrl = mobile_siteConfig.BASE_URL.replace('/api/', '');
      return { uri: baseUrl + imagePath };
    }
    return Images.profileImage; // Default image
  };

  // Get carousel images from package data
  const getCarouselImages = () => {
    if (!packageData?.package) return [Images.profileImage];
    
    const images = [];
    if (packageData.package.thumbnail_image) {
      images.push(getImageUri(packageData.package.thumbnail_image));
    }
    if (packageData.package.other_images && Array.isArray(packageData.package.other_images)) {
      packageData.package.other_images.forEach((img: string) => {
        images.push(getImageUri(img));
      });
    }
    return images.length > 0 ? images : [Images.profileImage];
  };

  const packageDetails = () => {
    setLoading(true);
    getDataWithToken({}, mobile_siteConfig.GET_PACKAGE_DETAILS + data.slug)
      .then((res: any) => res.json())
      .then((res: any) => {
        console.log("Package details", res);
        if (res?.success && res?.package) {
          setPackageData(res);
          // Set initial status (1 = active, 0 = inactive)
          const status = res.package.status;
          const initialActive = status === 1 || status === '1' || status === true;
          setIsActive(initialActive);
          // Set initial animation value
          toggleAnim.setValue(initialActive ? 1 : 0);
        }
      })
      .catch((err: any) => {
        console.log("error in package details", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };


  useEffect(() => {
    packageDetails();
  }, []);


  const onCarouselScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentImageIndex(slideIndex);
  };


  const renderCarouselItem = ({ item }: any) => (
    <Image 
      source={item} 
      style={styles.carouselImage} 
      resizeMode="cover"
      defaultSource={Images.profileImage}
    />
  );

  // Show loading state
  if (loading || !packageData?.package) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.sooprsblue} />
        <Text style={styles.loadingText}>Loading package details...</Text>
      </View>
    );
  }

  const pkg = packageData.package;
  const carouselImages = getCarouselImages();



  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* IMAGE CAROUSEL */}
        <View style={styles.carouselContainer}>
          <FlatList
            ref={carouselRef}
            data={carouselImages}
            renderItem={renderCarouselItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onCarouselScroll}
            scrollEventThrottle={16}
            keyExtractor={(item, index) => index.toString()}
          />
          
          {/* HEADER OVERLAY */}
          <View style={styles.headerOverlay}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Image source={Images.backArrow} style={styles.backIcon} />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => {
                console.log('Edit button clicked - Package data:', pkg);
                console.log('Package ID:', pkg?.id || pkg?.package_id);
                (navigation as any).navigate('AddPackagesScreen', { 
                  packageData: pkg,
                  isEditMode: true 
                });
              }}>
              <Image source={Images.editButton} style={styles.editIcon} />
            </TouchableOpacity>
            {/* <TouchableOpacity style={styles.shareButton}>
              <Image source={Images.referIcon} style={styles.shareIcon} />
            </TouchableOpacity> */}
          </View>

          {/* CAROUSEL DOTS */}
          <View style={styles.carouselDots}>
            {carouselImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentImageIndex && styles.activeDot,
                ]}
              />
            ))}
          </View>

          {/* RATING OVERLAY */}
          <View style={styles.ratingOverlay}>
            <Image source={Images.starIcon} style={styles.ratingStarIcon} />
            <Text style={styles.ratingValue}>4.9</Text>
          </View>
        </View>

        {/* WHITE CONTENT CARD */}
        <View style={styles.contentCard}>
          <View style={styles.titleRow}>
            <Text style={styles.serviceTitle}>{pkg.name || 'Package Name'}</Text>
            {/* STATUS TOGGLE */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                const newActive = !isActive;
                setIsActive(newActive);
                Animated.spring(toggleAnim, {
                  toValue: newActive ? 1 : 0,
                  useNativeDriver: true,
                  tension: 100,
                  friction: 8,
                }).start();
              }}
              style={[
                styles.statusToggle,
                {
                  backgroundColor: isActive ? Colors.sooprsblue : '#F44336',
                }
              ]}>
              <Text style={styles.statusToggleText}>
                {isActive ? 'Active' : 'Inactive'}
              </Text>
              <Animated.View
                style={[
                  styles.statusToggleKnob,
                  {
                    transform: [
                      {
                        translateX: toggleAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-wp(20), 0], // Move from left (inactive) to right (active)
                        }),
                      },
                    ],
                  },
                ]}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.locationRow}>
            <Image source={Images.locationIcon} style={styles.locationIcon} />
            <Text style={styles.locationText}>{pkg.location1 || 'Location'}</Text>
          </View>

          <Text style={styles.description}>
            {pkg.long_description || pkg.short_description || 'No description available'}
          </Text>
        </View>

        {/* AMENITIES */}
        {pkg.amenities && pkg.amenities.length > 0 && (
          <View style={styles.amenitiesSectionWrapper}>
            <Text style={styles.amenitiesTitle}>Amenities</Text>
            <View style={styles.amenitiesContainer}>
              {pkg.amenities.map((amenity: string, index: number) => (
                <View key={index} style={styles.amenityBox}>
                  <View style={styles.amenityDot} />
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* INCLUSIONS */}
        {pkg.included && pkg.included.length > 0 && (
          <View style={styles.inclusionsSectionWrapper}>
            <Text style={styles.inclusionsTitle}>Inclusions</Text>
            <View style={styles.inclusionsSection}>
              {pkg.included.map((item: string, index: number) => (
                <View key={index} style={styles.inclusionRow}>
                  <View style={styles.greenDot} />
                  <Text style={styles.inclusionText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* EXCLUSIONS */}
        {pkg.not_included && pkg.not_included.length > 0 && (
          <View style={styles.exclusionsSectionWrapper}>
            <Text style={styles.exclusionsTitle}>Exclusions</Text>
            <View style={styles.exclusionsSection}>
              {pkg.not_included.map((item: string, index: number) => (
                <View key={index} style={styles.exclusionRow}>
                  <View style={styles.redDot} />
                  <Text style={styles.exclusionText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* BOOKING POLICY */}
        {pkg.policy && pkg.policy.length > 0 && (
          <View style={styles.policySectionWrapper}>
            <Text style={styles.policyTitle}>Booking Policy</Text>
            <View style={styles.policySection}>
              {pkg.policy.map((policyItem: string, index: number) => {
                // Parse policy item to extract label and value
                console.log("policyItem",policyItem);
                  return (
                    <View key={index} style={styles.policyRow}>
                      <Text style={styles.grayBullet}>•</Text>
                      <Text style={styles.policyText}>{policyItem}</Text>
                    </View>
                  );

              })}
            </View>
          </View>
        )}

        {/* FARE BREAKUP */}
        {pkg.fare_breakup && (
          <View style={styles.fareBreakupSectionWrapper}>
            <Text style={styles.fareBreakupTitle}>Fare Breakup</Text>
            <View style={styles.fareBreakupSection}>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Base Fare:</Text>
                <Text style={styles.fareAmount}>
                  ₹{parseFloat(pkg.fare_breakup.base_price || 0).toLocaleString('en-IN')}
                </Text>
              </View>
              {pkg.fare_breakup.discount_price && (
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Discount Price:</Text>
                  <Text style={styles.fareAmount}>
                    ₹{parseFloat(pkg.fare_breakup.discount_price).toLocaleString('en-IN')}
                  </Text>
                </View>
              )}
              {pkg.fare_breakup.gst_amount && (
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>GST Amount ({pkg.fare_breakup.gst_percentage || '5%'}):</Text>
                  <Text style={styles.fareAmount}>
                    ₹{parseFloat(pkg.fare_breakup.gst_amount).toLocaleString('en-IN')}
                  </Text>
                </View>
              )}
              <View style={[styles.fareRow, styles.totalFareRow]}>
                <Text style={styles.totalFareLabel}>To Pay:</Text>
                <Text style={styles.totalFareAmount}>
                  ₹{parseFloat(pkg.fare_breakup.grand_total || pkg.effective_price || 0).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* TRAVELLER DETAILS */}
        {/* <View style={styles.travellerSection}>
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
        </View> */}
      </ScrollView>

      {/* BOTTOM BAR */}
      {/* <View style={styles.bottomBar}>
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
      </View> */}
    </View>
  );
};

export default CabRideReviewScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },

  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: hp(2),
    fontSize: FSize.fs14,
    color: Colors.gray,
  },

  scrollView: { flex: 1, backgroundColor: "rgba(255, 255, 255, 1)"},

  scrollContent: { paddingBottom: hp(18) },

  /* CAROUSEL */
  carouselContainer: {
    width: SCREEN_WIDTH,
    height: hp(35),
    position: 'relative',
  },

  carouselImage: {
    width: SCREEN_WIDTH,
    height: hp(35),
  },

  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: hp(6),
    paddingBottom: hp(2),
    paddingHorizontal: wp(4),
    zIndex: 10,
  },

  backButton: {
    width: wp(10),
    height: wp(10),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: wp(5),
  },

  backIcon: {
    width: wp(6),
    height: wp(6),
    tintColor: Colors.white,
  },

  shareButton: {
    width: wp(10),
    height: wp(10),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: wp(5),
  },

  shareIcon: {
    width: wp(5),
    height: wp(5),
    tintColor: Colors.white,
  },

  editButton: {
    width: wp(10),
    height: wp(10),
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor:Colors.sooprsblue,
    borderRadius: wp(5),
    marginRight: wp(2),
  },

  editIcon: {
    width: wp(8),
    height: wp(8),
    // tintColor: Colors.white,
  },

  carouselDots: {
    position: 'absolute',
    bottom: hp(6),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  dot: {
    width: wp(2),
    height: wp(2),
    borderRadius: wp(1),
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: wp(1),
  },

  activeDot: {
    backgroundColor: Colors.white,
    width: wp(4),
  },

  ratingOverlay: {
    position: 'absolute',
    bottom: hp(6),
    right: wp(4),
    backgroundColor: 'rgba(1, 123, 78, 1)',
    paddingHorizontal: wp(2),
    paddingVertical: hp(.2),
    borderRadius: wp(2),
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },

  ratingText: {
    fontSize: FSize.fs11,
    color: Colors.white,
    fontWeight: '600',
    marginRight: wp(1),
  },

  ratingStarIcon: {
    width: wp(3),
    height: wp(3),
    tintColor: 'white',
    marginRight: wp(1),
  },

  ratingValue: {
    fontSize: FSize.fs12,
    color: Colors.white,
    fontWeight: '700',
  },

  /* STATUS TOGGLE */
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: wp(10),
    width: wp(27),
    height: hp(5),
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  statusToggleText: {
    fontSize: FSize.fs13,
    color: Colors.white,
    fontWeight: '700',
    letterSpacing: 0.5,
    zIndex: 1,
    flex: 1,
    textAlign: 'center',
  },

  statusToggleKnob: {
    width: wp(5.5),
    height: wp(5.5),
    borderRadius: wp(2.75),
    backgroundColor: Colors.white,
    position: 'absolute',
    right: wp(1),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 2,
  },

  /* CONTENT CARD */
  contentCard: {
    backgroundColor: "rgba(255, 255, 255, 1)",
    borderTopLeftRadius: wp(6),
    borderTopRightRadius: wp(6),
    marginTop: -hp(3),
    paddingTop: hp(3),
    paddingHorizontal: wp(4),
    paddingBottom: hp(2),
    zIndex: 5,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },

  serviceTitle: {
    fontSize: FSize.fs24,
    fontWeight: '700',
    color: Colors.black,
    flex: 1,
  },

  shareButtonCard: {
    width: wp(8),
    height: wp(8),
    justifyContent: 'center',
    alignItems: 'center',
  },

  shareIconCard: {
    width: wp(5),
    height: wp(5),
    tintColor: Colors.gray,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },

  locationIcon: {
    width: wp(4),
    height: wp(4),
    tintColor: Colors.sooprsblue,
    marginRight: wp(1.5),
  },

  locationText: {
    fontSize: FSize.fs14,
    color: Colors.gray,
  },

  description: {
    fontSize: FSize.fs14,
    color: Colors.black,
    lineHeight: hp(2.5),
  },

  /* AMENITIES */
  amenitiesSectionWrapper: { marginBottom: hp(2), paddingHorizontal: wp(4),backgroundColor: "rgba(255, 255, 255, 1)"},

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
  inclusionsSectionWrapper: { marginBottom: hp(2), paddingHorizontal: wp(4), backgroundColor: "rgba(255, 255, 255, 1)"},

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
  exclusionsSectionWrapper: { marginBottom: hp(2), paddingHorizontal: wp(4), backgroundColor: "rgba(255, 255, 255, 1)"},

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

  /* POLICY */
  policySectionWrapper: { marginBottom: hp(2), paddingHorizontal: wp(4), backgroundColor: "rgba(255, 255, 255, 1)" },

  policyTitle: { fontSize: FSize.fs16, fontWeight: '700', marginBottom: hp(1) },

  policySection: {
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    borderRadius: wp(3),
    padding: wp(3),
  },

  policyRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: hp(0.5) },

  policyItemRow: {
    flexDirection: 'row',
    marginVertical: hp(0.8),
    alignItems: 'flex-start',
  },

  policyLabel: {
    fontSize: FSize.fs14,
    color: Colors.black,
    fontWeight: '600',
    marginRight: wp(1),
  },

  policyValue: {
    fontSize: FSize.fs14,
    color: Colors.black,
    flex: 1,
  },

  grayBullet: {
    fontSize: FSize.fs20,
    color: Colors.gray,
    marginRight: wp(2),
    lineHeight: hp(2),
  },

  policyText: { fontSize: FSize.fs14, color: Colors.black, flex: 1, lineHeight: hp(2.2) },

  /* FARE BREAKUP */
  fareBreakupSectionWrapper: { marginBottom: hp(2), paddingHorizontal: wp(4), backgroundColor: "rgba(255, 255, 255, 1)" },

  fareBreakupTitle: { fontSize: FSize.fs16, fontWeight: '700', marginBottom: hp(1) },

  fareBreakupSection: {
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    borderRadius: wp(3),
    padding: wp(3),
  },

  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: hp(0.8),
  },

  fareLabel: {
    fontSize: FSize.fs14,
    color: Colors.black,
  },

  fareAmount: {
    fontSize: FSize.fs14,
    color: Colors.black,
    fontWeight: '600',
  },

  totalFareRow: {
    marginTop: hp(1),
    paddingTop: hp(1),
    borderTopWidth: 1,
    borderTopColor: Colors.lightGrey,
  },

  totalFareLabel: {
    fontSize: FSize.fs16,
    color: Colors.black,
    fontWeight: '700',
  },

  totalFareAmount: {
    fontSize: FSize.fs18,
    color: Colors.black,
    fontWeight: '700',
  },

  /* TRAVELLER */
  travellerSection: { marginBottom: hp(2), paddingHorizontal: wp(4) },

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
