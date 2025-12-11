import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import React, {useEffect, useState, useCallback} from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import {hp, wp, GlobalCss} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import Images from '../../assets/image';
import FSize from '../../assets/commonCSS/FSize';
import { getDataWithToken } from '../../services/mobile-api';
import { mobile_siteConfig } from '../../services/mobile-siteConfig';

interface ApiPackage {
  id: number;
  slug: string;
  name: string;
  short_description: string;
  long_description: string;
  category_id: number;
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

const Project = () => {
  const navigation = useNavigation();
  const [packages, setPackages] = useState<ApiPackage[]>([]);
  const [loading, setLoading] = useState(true);

  const getPackages = async () => {
    try {
      setLoading(true);
      const res: any = await getDataWithToken({}, mobile_siteConfig.GET_PACKAGES);
      const data: any = await res.json();
      console.log('Packages API data:::::', data);
      
      if (data?.success && data?.data && Array.isArray(data.data)) {
        setPackages(data.data);
      } else {
        console.log('Invalid packages response format');
        setPackages([]);
      }
    } catch (error) {
      console.log('Error fetching packages:::::', error);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate discount percentage
  const calculateDiscount = (basePrice: string, discountPrice: string): number => {
    const base = parseFloat(basePrice);
    const discount = parseFloat(discountPrice);
    if (base > 0) {
      return Math.round(((base - discount) / base) * 100);
    }
    return 0;
  };

  // Format price with Indian currency
  const formatPrice = (price: string): string => {
    const numPrice = parseFloat(price);
    return `₹${numPrice.toLocaleString('en-IN')}`;
  };

  // Get image URI
  const getImageUri = (thumbnailImage: string | null): any => {
    if (thumbnailImage) {
      return { uri: mobile_siteConfig.BASE_URL.replace('/api/', '') + thumbnailImage };
    }
    return Images.carIcon; // Default image
  };

  useFocusEffect(
    useCallback(() => {
      getPackages();
    }, [])
  );

  // const renderPackageCard = (pkg: Package) => (
  //   <View key={pkg.id} style={styles.packageCard}>
  //     {/* Left Side - Vehicle Image & Details */}
  //     <View style={styles.leftSection}>
  //       <View style={styles.imageContainer}>
  //         <Image source={pkg.vehicleImage} style={styles.vehicleImage} />
  //       </View>
  //       <View style={styles.detailsContainer}>
  //         <Text style={styles.vehicleName}>
  //           {pkg.vehicleName}, {pkg.vehicleType}
  //         </Text>
  //         <Text style={styles.routeText}>{pkg.route}</Text>
  //         <Text style={styles.featuresText}>
  //           {pkg.seats} seats • {pkg.features.join(' • ')}
  //         </Text>
  //       </View>
  //     </View>

  //     {/* Right Side - Pricing Information */}
  //     <View style={styles.rightSection}>
  //       <View style={{flexDirection: 'row', alignItems: 'center',gap: wp(1)}}>
  //       <View style={styles.discountTag}>
  //         <Text style={styles.discountText}>{pkg.discount}% off</Text>
  //       </View>
  //       <Text style={styles.originalPrice}>{pkg.originalPrice}</Text>
  //       </View>
  //       <Text style={styles.discountedPrice}>{pkg.discountedPrice}</Text>
  //       <View style={styles.additionalChargesContainer}>
  //         <Text style={styles.additionalChargesText}>
  //           +{pkg.additionalCharges}
  //         </Text>
  //         <Text style={styles.taxesText}>(Taxes & Charges)</Text>
  //       </View>
  //     </View>
  //   </View>
  // );


  const renderPackageCard = (pkg: ApiPackage) => {
    console.log("pkg Data",pkg);
    console.log("pkg.base_price",pkg.base_price);
    console.log("pkg.discount_price",pkg.discount_price);
    const discount = calculateDiscount(pkg.base_price, pkg.discount_price);
    console.log("discount",discount);
    const route = `${pkg.location1} to ${pkg.location2}`;
    const imageSource = getImageUri(pkg.thumbnail_image);
    
    return (
      <TouchableOpacity
        key={pkg.id}
        activeOpacity={0.8}
        onPress={() => (navigation as any).navigate("CabRideReviewScreen", { data: pkg })}
        style={styles.packageCard}
      >
        {/* Left Side - Package Image & Details */}
        <View style={styles.leftSection}>
          <View style={styles.imageContainer}>
            <Image source={imageSource} style={styles.vehicleImage} />
          </View>
          <View style={styles.detailsContainer}>
            <Text style={styles.vehicleName} numberOfLines={1}>
              {pkg.name}
            </Text>
            <Text style={styles.routeText} numberOfLines={1}>{route}</Text>
            <Text style={styles.featuresText} numberOfLines={1}>
              {pkg.amenities && pkg.amenities.length > 0 
                ? pkg.amenities.slice(0, 3).join(" • ")
                : 'No amenities'}
            </Text>
          </View>
        </View>

        {/* Right Side - Pricing */}
        <View style={styles.rightSection}>
          {discount > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: wp(1) }}>
              <View style={styles.discountTag}>
                <Text style={styles.discountText}>{discount}% off</Text>
              </View>
              <Text style={styles.originalPrice}>{formatPrice(pkg.base_price)}</Text>
            </View>
          )}
          <Text style={styles.discountedPrice}>{formatPrice(pkg.discount_price)}</Text>
          <Text style={styles.taxesText}>(Inclusive of all taxes)</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Packages</Text>
     <TouchableOpacity 
  style={styles.addButton}
  onPress={() => (navigation as any).navigate("AddPackagesScreen")}
>
  <View style={styles.plusRow}>
    <Text style={styles.plus}>+</Text>
    <Text style={styles.addText}>Add Packages</Text>
  </View>
</TouchableOpacity>


      </View>

      {/* Packages List */}
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
            <Text style={styles.emptySubtext}>Add your first package to get started</Text>
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
    backgroundColor: Colors.white,
    paddingTop: hp(3),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(6),
    paddingTop: hp(2),
    paddingBottom: hp(1.5),
    backgroundColor: Colors.white,
  },
  headerTitle: {
    fontSize: FSize.fs17,
    fontWeight: '600',
    color: Colors.black,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: wp(2.5),
    borderWidth: wp(.3),
    borderColor: Colors.sooprsblue,
    backgroundColor: Colors.white,
  },
  
plusRow: {
  flexDirection: "row",
  alignItems: "center",
},

plus: {
  fontSize: FSize.fs22,   
  fontWeight: '600',
  color: Colors.sooprsblue,
  marginRight: wp(2),

      
},

addText: {
  fontSize: FSize.fs14,
  fontWeight: '600',
  color: Colors.sooprsblue,
},

  addButtonText: {
    marginTop:hp(-1),
    fontSize: FSize.fs13,
    fontWeight: '600',
    color: Colors.sooprsblue,
    
  },
  scrollView: {
    flex: 1,
    borderTopWidth: hp(0.1),
    borderTopColor: Colors.lightgrey2,
  },
  scrollContent: {
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(3),
  },
  packageCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: wp(3),
    padding: wp(4),
    marginBottom: hp(1),
    borderWidth: wp(.2),
    borderColor: Colors.lightgrey2,
    // ...GlobalCss.shadowBox,
    // elevation: 2,
    // shadowColor: '#000',
    // shadowOffset: {width: 0, height: 2},
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
  },
  leftSection: {
    flexDirection: 'row',
    flex: 1,
    marginRight: wp(3),
  },
  imageContainer: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(2.5),
    backgroundColor: Colors.lightgrey1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  vehicleImage: {
    width: wp(16),
    height: wp(16),
    resizeMode: 'contain',
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  vehicleName: {
    fontSize: FSize.fs15,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: hp(0.3),
  },
  routeText: {
    fontSize: FSize.fs13,
    color: Colors.gray,
    marginBottom: hp(0.3),
  },
  featuresText: {
    fontSize: FSize.fs11,
    color: Colors.gray,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  discountTag: {
    backgroundColor: "#E8F0F8",
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: wp(1.5),
    marginBottom: hp(0.5),
  },
  discountText: {
    fontSize: FSize.fs9,
    fontWeight: '600',
    color: Colors.sooprsblue,
  },
  originalPrice: {
    fontSize: FSize.fs12,
    color: Colors.gray,
    textDecorationLine: 'line-through',
    marginBottom: hp(0.3),
  },
  discountedPrice: {
    fontSize: FSize.fs16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: hp(0.3),
  },
  additionalChargesContainer: {
    alignItems: 'flex-end',
  },
  additionalChargesText: {
    fontSize: FSize.fs11,
    color: Colors.gray,
  },
  taxesText: {
    fontSize: FSize.fs9,
    color: Colors.gray,
    marginTop: hp(0.1),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(10),
  },
  loadingText: {
    marginTop: hp(2),
    fontSize: FSize.fs14,
    color: Colors.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(10),
  },
  emptyText: {
    fontSize: FSize.fs16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: hp(1),
  },
  emptySubtext: {
    fontSize: FSize.fs14,
    color: Colors.gray,
  },
});