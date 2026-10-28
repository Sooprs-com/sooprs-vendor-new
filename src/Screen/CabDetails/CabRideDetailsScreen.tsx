import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Animated,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Colors from '../../assets/commonCSS/Colors';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import FSize from '../../assets/commonCSS/FSize';
import {fFamily} from '../../assets/commonCSS/fFamily';
import Images from '../../assets/image';
import {getDataWithToken} from '../../services/mobile-api';
import {mobile_siteConfig} from '../../services/mobile-siteConfig';
import FormattedDescription from '../../Component/FormattedDescription';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const MAX_DESCRIPTION_LINES = 5;
const MAX_VISIBLE_POINTS = 4;
const CARD_GAP = wp(2.5);
const CARD_WIDTH = (SCREEN_WIDTH - wp(8) - CARD_GAP) / 2;
const BACK_ICON_SIZE = wp(6);

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function getInclusionIcon(label: string): string {
  const t = String(label || '').toLowerCase();
  if (t.includes('video') || t.includes('call') || t.includes('online')) {
    return 'video-outline';
  }
  if (t.includes('one on one') || t.includes('1:1') || t.includes('one-on-one')) {
    return 'account-outline';
  }
  if (t.includes('session') || t.includes('consult')) {
    return 'account-outline';
  }
  if (t.includes('yoga') || t.includes('meditat')) {
    return 'meditation';
  }
  if (t.includes('spa') || t.includes('massage')) {
    return 'spa-outline';
  }
  if (
    t.includes('food') ||
    t.includes('meal') ||
    t.includes('diet') ||
    t.includes('breakfast') ||
    t.includes('lunch') ||
    t.includes('dinner')
  ) {
    return 'food-outline';
  }
  if (t.includes('hotel') || t.includes('stay') || t.includes('accommodation')) {
    return 'bed-outline';
  }
  if (t.includes('transport') || t.includes('cab') || t.includes('car')) {
    return 'car-outline';
  }
  if (t.includes('photo')) {
    return 'camera-outline';
  }
  if (t.includes('decor') || t.includes('flower')) {
    return 'flower-outline';
  }
  if (t.includes('wifi')) {
    return 'wifi';
  }
  if (t.includes('guide')) {
    return 'account-tie-outline';
  }
  if (t.includes('sound') || t.includes('music') || t.includes('dj')) {
    return 'music-note-outline';
  }
  return 'check-circle-outline';
}

function toDisplayText(value: any): string {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'object') {
    const text =
      value.text ||
      value.title ||
      value.name ||
      value.description ||
      value.policy ||
      value.value;
    if (text != null && typeof text !== 'object') {
      return String(text);
    }
  }
  return '';
}

function formatRupee(amount: number | string) {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!Number.isFinite(value)) {
    return '₹0';
  }
  return `₹${value.toLocaleString('en-IN')}`;
}

function normalizePolicy(policy: any): string[] {
  if (Array.isArray(policy)) {
    return policy.map(item => toDisplayText(item)).filter(Boolean);
  }
  if (policy && typeof policy === 'object') {
    return Object.values(policy)
      .map(item => toDisplayText(item))
      .filter(Boolean);
  }
  return [];
}

const CabRideReviewScreen = ({route}: any) => {
  const {data} = route.params || {};
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const carouselRef = useRef<FlatList>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [packageData, setPackageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const stickyHeaderAnim = useRef(new Animated.Value(0)).current;
  const [showAllInclusions, setShowAllInclusions] = useState(false);
  const [showAllExclusions, setShowAllExclusions] = useState(false);
  const [isIncludedExpanded, setIsIncludedExpanded] = useState(true);
  const [isExcludedExpanded, setIsExcludedExpanded] = useState(false);
  const [isFareBreakdownExpanded, setIsFareBreakdownExpanded] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [shouldShowDescriptionToggle, setShouldShowDescriptionToggle] = useState(false);

  const getImageUri = (imagePath: any): any => {
    if (typeof imagePath !== 'string' || !imagePath) {
      return Images.banner1;
    }
    if (imagePath.startsWith('http')) {
      return {uri: imagePath};
    }
    const baseUrl = mobile_siteConfig.BASE_URL.replace('/api/', '');
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return {uri: `${baseUrl}${path}`};
  };

  const getCarouselImages = () => {
    if (!packageData?.package) {
      return [Images.banner1];
    }
    const images: any[] = [];
    if (packageData.package.thumbnail_image) {
      images.push(getImageUri(packageData.package.thumbnail_image));
    }
    if (Array.isArray(packageData.package.other_images)) {
      packageData.package.other_images.forEach((img: string) => {
        images.push(getImageUri(img));
      });
    }
    return images.length > 0 ? images : [Images.banner1];
  };

  const packageDetails = () => {
    if (!data?.slug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getDataWithToken({}, mobile_siteConfig.GET_PACKAGE_DETAILS + data.slug)
      .then((res: any) => res.json())
      .then((res: any) => {
        if (res?.success && res?.package) {
          setPackageData({
            ...res,
            package: {
              ...res.package,
              policy: normalizePolicy(res.package.policy),
            },
          });
        }
      })
      .catch(() => undefined)
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    packageDetails();
  }, []);

  useEffect(() => {
    setShowFullDescription(false);
    setShowAllInclusions(false);
    setShowAllExclusions(false);
  }, [packageData?.package?.slug]);

  const onCarouselScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentImageIndex(slideIndex);
  };

  const renderCarouselItem = ({item}: any) => (
    <Image source={item} style={styles.carouselImage} resizeMode="cover" />
  );

  const openEdit = (pkg: any) => {
    (navigation as any).navigate('AddPackagesScreen', {
      packageData: pkg,
      isEditMode: true,
    });
  };

  if (loading || !packageData?.package) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
          activeOpacity={0.7}
          style={[styles.loaderBackButton, {top: insets.top + hp(1.5)}]}>
          <Image source={Images.backArrow} style={styles.backIcon} />
        </TouchableOpacity>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={Colors.sooprsblue} />
          <Text style={styles.loadingText}>Loading package details...</Text>
        </View>
      </View>
    );
  }

  const pkg = packageData.package;
  const carouselImages = getCarouselImages();
  const includedList = Array.isArray(pkg?.included) ? pkg.included : [];
  const excludedList = Array.isArray(pkg?.not_included) ? pkg.not_included : [];
  const inclusionsToShow = showAllInclusions
    ? includedList
    : includedList.slice(0, MAX_VISIBLE_POINTS);
  const exclusionsToShow = showAllExclusions
    ? excludedList
    : excludedList.slice(0, MAX_VISIBLE_POINTS);
  const locationText = [pkg?.location1, pkg?.location2].filter(Boolean).join(', ');
  const baseFareNumber =
    parseFloat(pkg?.fare_breakup?.base_price || pkg?.base_price || '0') || 0;
  const packageDiscountPrice =
    parseFloat(
      pkg?.fare_breakup?.discount_price || pkg?.discount_price || String(baseFareNumber),
    ) || 0;
  const packageDiscountValue = Math.max(0, baseFareNumber - packageDiscountPrice);
  const gstPercentRaw = pkg?.fare_breakup?.gst_percentage || '5';
  const gstPercentLabel = String(gstPercentRaw).includes('%')
    ? String(gstPercentRaw)
    : `${gstPercentRaw}%`;
  const gstAmountNumber = parseFloat(pkg?.fare_breakup?.gst_amount || '0') || 0;
  const totalAmount =
    parseFloat(pkg?.fare_breakup?.grand_total || pkg?.effective_price || '0') ||
    Math.max(0, packageDiscountPrice + gstAmountNumber);
  const hasFare =
    Boolean(pkg?.fare_breakup) || baseFareNumber > 0 || packageDiscountPrice > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <Animated.View
        pointerEvents={showStickyHeader ? 'auto' : 'none'}
        style={[
          styles.stickyHeader,
          {
            paddingTop: insets.top + hp(0.8),
            opacity: stickyHeaderAnim,
            transform: [
              {
                translateY: stickyHeaderAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-hp(20), 0],
                }),
              },
            ],
          },
        ]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
          style={styles.stickyBackButton}>
          <Image source={Images.backArrow} style={styles.stickyBackIcon} />
        </TouchableOpacity>
        <Text style={styles.stickyHeaderTitle} numberOfLines={1}>
          Details
        </Text>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {paddingBottom: hp(4) + insets.bottom},
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={event => {
          const y = event.nativeEvent.contentOffset.y;
          const shouldShow = y >= hp(32);
          if (shouldShow !== showStickyHeader) {
            setShowStickyHeader(shouldShow);
            Animated.timing(stickyHeaderAnim, {
              toValue: shouldShow ? 1 : 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
          }
        }}>
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
            keyExtractor={(_, index) => index.toString()}
          />

          <View style={[styles.headerOverlay, {paddingTop: insets.top + hp(1)}]} pointerEvents="box-none">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
              activeOpacity={0.7}
              style={styles.backButton}>
              <Image source={Images.backArrow} style={styles.backIcon} />
            </TouchableOpacity>
          </View>

          {carouselImages.length > 1 && (
            <View style={styles.carouselDots}>
              {carouselImages.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, index === currentImageIndex && styles.activeDot]}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.contentCard}>
          <View style={styles.titleRow}>
            <Text style={styles.serviceTitle} numberOfLines={2}>
              {toDisplayText(pkg?.name) || 'Package Name'}
            </Text>
            <TouchableOpacity
              style={styles.editButton}
              activeOpacity={0.8}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              onPress={() => openEdit(pkg)}>
              <Image source={Images.editButton} style={styles.editIcon} />
            </TouchableOpacity>
          </View>

          {locationText ? (
            <View style={styles.locationRow}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={wp(4.4)}
                color={Colors.sooprsblue}
              />
              <Text style={styles.locationText}>{locationText}</Text>
            </View>
          ) : null}

          <FormattedDescription
            value={pkg.long_description || pkg.short_description || ''}
            baseStyle={styles.description}
            fallback="No description available"
            collapsed={!showFullDescription}
            collapsedLines={MAX_DESCRIPTION_LINES}
            onOverflowChange={setShouldShowDescriptionToggle}
          />
          {shouldShowDescriptionToggle ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowFullDescription(prev => !prev)}
              style={styles.seeMoreButton}>
              <Text style={styles.seeMoreText}>
                {showFullDescription ? 'See less' : 'See more'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {includedList.length > 0 && (
            <View style={styles.sectionBlock}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsIncludedExpanded(prev => !prev)}
                style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, styles.sectionTitleInline]}>
                  What's Included
                </Text>
                <MaterialCommunityIcons
                  name={isIncludedExpanded ? 'chevron-up' : 'chevron-down'}
                  size={wp(6)}
                  color="#111827"
                />
              </TouchableOpacity>
              {isIncludedExpanded && (
                <>
                  <View style={styles.featureGrid}>
                    {inclusionsToShow.map((item: any, index: number) => (
                      <View key={`included-${index}`} style={styles.includeCard}>
                        <View style={styles.includeIconWrap}>
                          <MaterialCommunityIcons
                            name={getInclusionIcon(item) as any}
                            size={wp(5.2)}
                            color={Colors.sooprsblue}
                          />
                        </View>
                        <Text style={styles.includeCardText}>{toDisplayText(item)}</Text>
                      </View>
                    ))}
                  </View>
                  {includedList.length > MAX_VISIBLE_POINTS && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setShowAllInclusions(prev => !prev)}
                      style={[styles.viewAllOffersBtn, styles.sectionSeeMoreBtn]}>
                      <Text style={styles.viewAllOffersText}>
                        {showAllInclusions
                          ? 'Show less'
                          : `See more (+${includedList.length - MAX_VISIBLE_POINTS})`}
                      </Text>
                      <MaterialCommunityIcons
                        name={showAllInclusions ? 'chevron-up' : 'chevron-down'}
                        size={wp(4)}
                        color={Colors.sooprsblue}
                      />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          )}

          {excludedList.length > 0 && (
            <View style={styles.sectionBlock}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsExcludedExpanded(prev => !prev)}
                style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, styles.sectionTitleInline]}>
                  What's Excluded
                </Text>
                <MaterialCommunityIcons
                  name={isExcludedExpanded ? 'chevron-up' : 'chevron-down'}
                  size={wp(6)}
                  color="#111827"
                />
              </TouchableOpacity>
              {isExcludedExpanded && (
                <>
                  <View style={styles.featureGrid}>
                    {exclusionsToShow.map((item: any, index: number) => (
                      <View key={`excluded-${index}`} style={styles.excludeCard}>
                        <View style={styles.excludeIconWrap}>
                          <MaterialCommunityIcons
                            name="close-circle"
                            size={wp(5.4)}
                            color="#E53935"
                          />
                        </View>
                        <Text style={styles.excludeCardText}>{toDisplayText(item)}</Text>
                      </View>
                    ))}
                  </View>
                  {excludedList.length > MAX_VISIBLE_POINTS && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setShowAllExclusions(prev => !prev)}
                      style={[styles.viewAllOffersBtn, styles.sectionSeeMoreBtn]}>
                      <Text style={styles.viewAllOffersText}>
                        {showAllExclusions
                          ? 'Show less'
                          : `See more (+${excludedList.length - MAX_VISIBLE_POINTS})`}
                      </Text>
                      <MaterialCommunityIcons
                        name={showAllExclusions ? 'chevron-up' : 'chevron-down'}
                        size={wp(4)}
                        color={Colors.sooprsblue}
                      />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          )}

          {hasFare && (
            <View style={styles.sectionBlock}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setIsFareBreakdownExpanded(prev => !prev);
                }}
                style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, styles.sectionTitleInline]}>
                  Fare Breakdown
                </Text>
                <MaterialCommunityIcons
                  name={isFareBreakdownExpanded ? 'chevron-up' : 'chevron-down'}
                  size={wp(6)}
                  color="#111827"
                />
              </TouchableOpacity>
              <View style={styles.fareBreakupSection}>
                {isFareBreakdownExpanded && (
                  <>
                    <View style={styles.fareRow}>
                      <Text style={styles.fareLabel}>Base Fare</Text>
                      <Text style={styles.fareAmount}>{formatRupee(baseFareNumber)}</Text>
                    </View>
                    {packageDiscountValue > 0 && (
                      <View style={styles.fareRow}>
                        <Text style={styles.fareLabel}>Discount</Text>
                        <Text style={styles.fareDiscountAmount}>
                          - {formatRupee(packageDiscountValue)}
                        </Text>
                      </View>
                    )}
                    {gstAmountNumber > 0 && (
                      <View style={styles.fareRow}>
                        <Text style={styles.fareLabel}>GST Amount ({gstPercentLabel})</Text>
                        <Text style={styles.fareAmount}>{formatRupee(gstAmountNumber)}</Text>
                      </View>
                    )}
                  </>
                )}
                <View style={[styles.fareRow, isFareBreakdownExpanded && styles.totalFareRow]}>
                  <Text style={styles.totalFareLabel}>Total Amount</Text>
                  <Text style={styles.totalFareAmount}>{formatRupee(totalAmount)}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default CabRideReviewScreen;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.lightgrey1},
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderBackButton: {
    position: 'absolute',
    left: wp(4),
    zIndex: 10,
    width: wp(10),
    height: wp(10),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    elevation: 3,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 3.84,
    borderRadius: wp(5),
  },
  loadingText: {
    marginTop: hp(2),
    fontSize: FSize.fs14,
    color: Colors.gray,
    fontFamily: fFamily.ibmRegular,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: hp(1.5),
    paddingHorizontal: wp(4),
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 20,
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  stickyBackButton: {
    width: wp(10),
    height: wp(10),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: wp(3),
    marginRight: wp(3),
  },
  stickyBackIcon: {
    width: BACK_ICON_SIZE,
    height: BACK_ICON_SIZE,
    tintColor: Colors.black,
  },
  stickyHeaderTitle: {
    flex: 1,
    fontSize: FSize.fs18,
    color: Colors.black,
    fontFamily: fFamily.ibmBold,
  },
  scrollView: {flex: 1, backgroundColor: Colors.lightgrey1},
  scrollContent: {paddingBottom: hp(4)},
  carouselContainer: {
    width: SCREEN_WIDTH,
    height: hp(36),
    position: 'relative',
    backgroundColor: Colors.lightgrey1,
  },
  carouselImage: {
    width: SCREEN_WIDTH,
    height: hp(36),
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: hp(1),
    paddingHorizontal: wp(4),
    zIndex: 10,
  },
  backButton: {
    width: wp(10),
    height: wp(10),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    elevation: 3,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 3.84,
    borderRadius: wp(5),
  },
  backIcon: {
    width: BACK_ICON_SIZE,
    height: BACK_ICON_SIZE,
    tintColor: Colors.black,
  },
  editButton: {
    width: wp(11),
    height: wp(11),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: wp(5.5),
    marginLeft: wp(2),
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.22,
    shadowRadius: 4,
  },
  editIcon: {
    width: wp(8),
    height: wp(8),
  },
  carouselDots: {
    position: 'absolute',
    bottom: hp(5),
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
  contentCard: {
    backgroundColor: Colors.lightgrey1,
    borderTopLeftRadius: wp(4),
    borderTopRightRadius: wp(4),
    marginTop: -hp(3.2),
    paddingTop: hp(2),
    paddingHorizontal: wp(4),
    paddingBottom: hp(1.5),
    zIndex: 5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },
  serviceTitle: {
    flex: 1,
    fontSize: FSize.fs24,
    fontWeight: '700',
    color: Colors.black,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(0.7),
  },
  locationText: {
    marginLeft: wp(1),
    flex: 1,
    fontSize: FSize.fs16,
    color: '#4B5563',
    fontFamily: fFamily.ibmMedium,
  },
  description: {
    fontSize: FSize.fs17,
    color: Colors.black,
    lineHeight: hp(3.1),
  },
  seeMoreButton: {
    alignSelf: 'flex-end',
    marginTop: hp(0.4),
  },
  seeMoreText: {
    fontSize: FSize.fs14,
    color: Colors.sooprsblue,
    fontWeight: '600',
  },
  sectionBlock: {
    marginTop: hp(1.3),
  },
  sectionTitle: {
    fontSize: FSize.fs19,
    color: '#111827',
    fontWeight: '800',
    marginBottom: hp(0.8),
  },
  sectionTitleInline: {
    marginBottom: 0,
    flex: 1,
    paddingRight: wp(2),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(0.8),
  },
  viewAllOffersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionSeeMoreBtn: {
    alignSelf: 'flex-end',
    marginTop: hp(1),
  },
  viewAllOffersText: {
    fontSize: FSize.fs15,
    color: Colors.sooprsblue,
    fontFamily: fFamily.ibmSemiBold,
    marginRight: wp(0.5),
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  includeCard: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: wp(3.5),
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  includeIconWrap: {
    width: wp(8.5),
    height: wp(8.5),
    borderRadius: wp(2.2),
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(2.2),
  },
  includeCardText: {
    flex: 1,
    fontSize: FSize.fs15,
    color: '#1F2937',
    fontWeight: '700',
  },
  excludeCard: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: wp(3.5),
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5C6C6',
  },
  excludeIconWrap: {
    marginRight: wp(2),
  },
  excludeCardText: {
    flex: 1,
    fontSize: FSize.fs15,
    color: '#1F2937',
    fontWeight: '700',
  },
  fareBreakupSection: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp(3.5),
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1.2),
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: hp(0.7),
  },
  fareLabel: {
    fontSize: FSize.fs16,
    color: '#4B5563',
    fontWeight: '400',
    flex: 1,
    paddingRight: wp(2),
  },
  fareAmount: {
    fontSize: FSize.fs16,
    color: '#111827',
    fontWeight: '700',
  },
  fareDiscountAmount: {
    fontSize: FSize.fs16,
    color: '#E53935',
    fontWeight: '700',
  },
  totalFareRow: {
    marginTop: hp(0.6),
    paddingTop: hp(1),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalFareLabel: {
    fontSize: FSize.fs17,
    color: '#111827',
    fontWeight: '500',
  },
  totalFareAmount: {
    fontSize: FSize.fs18,
    color: '#111827',
    fontWeight: '800',
  },
});
