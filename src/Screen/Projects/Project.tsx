import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import React, {useState, useCallback} from 'react';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import Images from '../../assets/image';
import FSize from '../../assets/commonCSS/FSize';
import {getDataWithToken} from '../../services/mobile-api';
import {mobile_siteConfig} from '../../services/mobile-siteConfig';

interface ApiPackage {
  id: number;
  slug: string;
  name: string;
  short_description: string;
  long_description: string;
  category_id: number;
  category_name?: string;
  category?: string;
  vendor_id: number;
  thumbnail_image: string | null;
  other_images: string[] | null;
  included: string[];
  not_included: string[];
  policy: {
    refund: string;
    advance: string;
    cancellation: string;
  };
  amenities: string[];
  base_price: string;
  discount_price: string;
  location1: string;
  location2: string;
  status: number;
  created_at: string;
  updated_at: string;
}

const getCategoryMeta = (pkg: ApiPackage) => {
  const haystack = `${pkg.category_name || ''} ${pkg.category || ''} ${pkg.name || ''} ${pkg.short_description || ''}`.toLowerCase();

  if (/health|wellness|yoga|fitness|doctor|consult|ayurved/.test(haystack)) {
    return {label: pkg.category_name || pkg.category || 'Health & Wellness', icon: 'shield-check'};
  }
  if (/cab|taxi|ride|travel|tour/.test(haystack)) {
    return {label: pkg.category_name || pkg.category || 'Travel & Cabs', icon: 'car'};
  }
  if (/beauty|salon|spa/.test(haystack)) {
    return {label: pkg.category_name || pkg.category || 'Beauty & Spa', icon: 'spa'};
  }
  if (/edu|tutor|coach|learn/.test(haystack)) {
    return {label: pkg.category_name || pkg.category || 'Education', icon: 'school'};
  }

  if (pkg.category_name || pkg.category) {
    return {label: pkg.category_name || pkg.category || 'Service Package', icon: 'shield-check'};
  }

  if (pkg.location1 && pkg.location2) {
    return {label: `${pkg.location1} → ${pkg.location2}`, icon: 'map-marker'};
  }

  return {label: 'Service Package', icon: 'shield-check'};
};

const Project = () => {
  const navigation = useNavigation();
  const [packages, setPackages] = useState<ApiPackage[]>([]);
  const [loading, setLoading] = useState(true);

  const getPackages = async () => {
    try {
      setLoading(true);
      const res: any = await getDataWithToken({}, mobile_siteConfig.GET_PACKAGES);
      const data: any = await res.json();

      if (data?.success && data?.data && Array.isArray(data.data)) {
        setPackages(data.data);
      } else {
        setPackages([]);
      }
    } catch (error) {
      console.log('Error fetching packages:::::', error);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscount = (basePrice: string, discountPrice: string): number => {
    const base = parseFloat(basePrice);
    const discount = parseFloat(discountPrice);
    if (base > 0 && discount > 0 && discount < base) {
      return Math.round(((base - discount) / base) * 100);
    }
    return 0;
  };

  const formatPrice = (price: string): string => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) {
      return '₹0';
    }
    return `₹${numPrice.toLocaleString('en-IN')}`;
  };

  const getImageUri = (thumbnailImage: string | null): any => {
    if (thumbnailImage) {
      if (thumbnailImage.startsWith('http')) {
        return {uri: thumbnailImage};
      }
      return {uri: mobile_siteConfig.BASE_URL.replace('/api/', '') + thumbnailImage};
    }
    return Images.carIcon;
  };

  const goToAddPackage = () => {
    (navigation as any).navigate('AddPackagesScreen');
  };

  useFocusEffect(
    useCallback(() => {
      getPackages();
    }, []),
  );

  const renderPackageCard = (pkg: ApiPackage) => {
    const discount = calculateDiscount(pkg.base_price, pkg.discount_price);
    const hasImage = !!pkg.thumbnail_image;
    const imageSource = getImageUri(pkg.thumbnail_image);
    const isActive = Number(pkg.status) === 1;
    const sellingPrice = pkg.discount_price || pkg.base_price;
    const category = getCategoryMeta(pkg);

    return (
      <TouchableOpacity
        key={pkg.id}
        activeOpacity={0.88}
        onPress={() => (navigation as any).navigate('CabRideReviewScreen', {data: pkg})}
        style={styles.packageCard}>
        <View style={styles.imageWrap}>
          <Image
            source={imageSource}
            style={[styles.packageImage, !hasImage && styles.packageImageFallback]}
            resizeMode={hasImage ? 'cover' : 'contain'}
          />
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>{discount}% OFF</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.titleRow}>
            <Text style={styles.packageName} numberOfLines={2}>
              {pkg.name}
            </Text>
            <View style={[styles.statusPill, isActive ? styles.statusActive : styles.statusInactive]}>
              <View style={[styles.statusDot, isActive ? styles.statusDotActive : styles.statusDotInactive]} />
              <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextInactive]}>
                {isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          <View style={styles.categoryChip}>
            <MaterialCommunityIcons name={category.icon} size={wp(3.8)} color="#3B82F6" />
            <Text style={styles.categoryChipText} numberOfLines={1}>
              {category.label}
            </Text>
          </View>

          {pkg.short_description ? (
            <Text style={styles.shortDesc} numberOfLines={2}>
              {pkg.short_description}
            </Text>
          ) : null}

          <View style={styles.priceRow}>
            <View style={styles.priceBlock}>
              <Text style={styles.priceLabel}>Starting at</Text>
              <View style={styles.priceValueRow}>
                <Text style={styles.sellingPrice}>{formatPrice(sellingPrice)}</Text>
                {discount > 0 ? (
                  <Text style={styles.originalPrice}>{formatPrice(pkg.base_price)}</Text>
                ) : null}
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => (navigation as any).navigate('CabRideReviewScreen', {data: pkg})}
              style={styles.viewCta}>
              <Text style={styles.viewCtaText}>View Details</Text>
              <MaterialCommunityIcons name="chevron-right" size={wp(4.5)} color={Colors.sooprsblue} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
            <Text style={styles.headerTitle}>My Packages</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Manage and track your all packages
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={goToAddPackage} activeOpacity={0.85}>
          <MaterialCommunityIcons name="plus" size={wp(4.4)} color={Colors.white} />
          <Text style={styles.addText}>Add Packages</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.sooprsblue} />
            <Text style={styles.loadingText}>Loading packages...</Text>
          </View>
        ) : packages.length > 0 ? (
          packages.map(pkg => renderPackageCard(pkg))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No packages found</Text>
            <Text style={styles.emptySubtext}>Add your first package from Add Packages</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Project;

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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(3.4),
    paddingVertical: hp(1.05),
    borderRadius: wp(3),
    backgroundColor: Colors.sooprsblue,
    gap: wp(1),
    shadowColor: Colors.sooprsblue,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  addText: {
    fontSize: FSize.fs13,
    fontWeight: '700',
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F7FAFF',
  },
  scrollContent: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1.6),
    paddingBottom: hp(4),
  },
  packageCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: wp(4.5),
    overflow: 'hidden',
    marginBottom: hp(1.8),
    borderWidth: 1.2,
    borderColor: '#D7E6F8',
    padding: wp(2.2),
    shadowColor: '#1E40AF',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  imageWrap: {
    width: wp(28),
    minHeight: wp(36),
    alignSelf: 'stretch',
    borderRadius: wp(3.4),
    overflow: 'hidden',
    backgroundColor: '#EAF4FF',
  },
  packageImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  packageImageFallback: {
    top: wp(6),
    bottom: wp(6),
    left: wp(4),
    right: wp(4),
    width: 'auto',
    height: 'auto',
  },
  discountBadge: {
    position: 'absolute',
    left: wp(1.8),
    top: hp(0.9),
    backgroundColor: '#FF5A1F',
    paddingHorizontal: wp(2.2),
    paddingVertical: hp(0.32),
    borderRadius: wp(1.6),
  },
  discountBadgeText: {
    fontSize: FSize.fs11,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.2,
  },
  cardBody: {
    flex: 1,
    paddingLeft: wp(3),
    paddingRight: wp(0.6),
    paddingVertical: hp(0.2),
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(1.4),
  },
  packageName: {
    flex: 1,
    fontSize: FSize.fs16,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: hp(2.6),
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(1.8),
    paddingVertical: hp(0.28),
    borderRadius: wp(4),
    gap: wp(1),
    marginTop: hp(0.15),
  },
  statusActive: {
    backgroundColor: '#ECFDF5',
  },
  statusInactive: {
    backgroundColor: '#F1F5F9',
  },
  statusDot: {
    width: wp(1.7),
    height: wp(1.7),
    borderRadius: wp(0.85),
  },
  statusDotActive: {
    backgroundColor: '#22C55E',
  },
  statusDotInactive: {
    backgroundColor: '#94A3B8',
  },
  statusText: {
    fontSize: FSize.fs11,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#16A34A',
  },
  statusTextInactive: {
    color: '#64748B',
  },
  categoryChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FF',
    borderRadius: wp(4),
    paddingHorizontal: wp(2.2),
    paddingVertical: hp(0.35),
    gap: wp(1),
    marginTop: hp(0.7),
    maxWidth: '100%',
  },
  categoryChipText: {
    fontSize: FSize.fs12,
    color: '#3B82F6',
    fontWeight: '700',
    flexShrink: 1,
  },
  shortDesc: {
    fontSize: FSize.fs13,
    color: '#64748B',
    marginTop: hp(0.7),
    lineHeight: hp(2.2),
    fontWeight: '400',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: hp(1.1),
    paddingTop: hp(0.9),
    borderTopWidth: 1,
    borderTopColor: '#EEF3F8',
  },
  priceBlock: {
    flex: 1,
    marginRight: wp(1.6),
  },
  priceLabel: {
    fontSize: FSize.fs11,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: hp(0.12),
  },
  priceValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: wp(1.5),
  },
  sellingPrice: {
    fontSize: FSize.fs18,
    fontWeight: '800',
    color: '#0F172A',
  },
  originalPrice: {
    fontSize: FSize.fs13,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  viewCta: {
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
  viewCtaText: {
    fontSize: FSize.fs13,
    fontWeight: '700',
    color: Colors.sooprsblue,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(16),
  },
  loadingText: {
    marginTop: hp(1.4),
    fontSize: FSize.fs13,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(12),
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
});
