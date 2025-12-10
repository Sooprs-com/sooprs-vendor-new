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
import { useNavigation } from '@react-navigation/native';

import {hp, wp, GlobalCss} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import Images from '../../assets/image';
import FSize from '../../assets/commonCSS/FSize';

interface Package {
  id: string;
  vehicleImage: any;
  vehicleName: string;
  vehicleType: string;
  route: string;
  seats: number;
  features: string[];
  discount: number;
  originalPrice: string;
  discountedPrice: string;
  additionalCharges: string;
}

const Project = () => {
  const navigation = useNavigation();

  const [packages] = useState<Package[]>([
    {
      id: '1',
      vehicleImage: Images.carIcon,
      vehicleName: 'Mahindra',
      vehicleType: 'SUV',
      route: 'Delhi to Manali',
      seats: 4,
      features: ['AC'],
      discount: 14,
      originalPrice: '₹12,999',
      discountedPrice: '₹5,499',
      additionalCharges: '₹730',
    },
    {
      id: '2',
      vehicleImage: Images.carIcon,
      vehicleName: 'Mahindra',
      vehicleType: 'SUV',
      route: 'Delhi to Manali',
      seats: 4,
      features: ['AC'],
      discount: 14,
      originalPrice: '₹12,999',
      discountedPrice: '₹5,499',
      additionalCharges: '₹730',
    },
    {
      id: '3',
      vehicleImage: Images.carIcon,
      vehicleName: 'Mahindra',
      vehicleType: 'SUV',
      route: 'Delhi to Manali',
      seats: 4,
      features: ['AC'],
      discount: 14,
      originalPrice: '₹12,999',
      discountedPrice: '₹5,499',
      additionalCharges: '₹730',
    },
    {
      id: '4',
      vehicleImage: Images.carIcon,
      vehicleName: 'Mahindra',
      vehicleType: 'SUV',
      route: 'Delhi to Manali',
      seats: 4,
      features: ['AC'],
      discount: 14,
      originalPrice: '₹12,999',
      discountedPrice: '₹5,499',
      additionalCharges: '₹730',
    },
  ]);

  const renderPackageCard = (pkg: Package) => (
    <View key={pkg.id} style={styles.packageCard}>
      {/* Left Side - Vehicle Image & Details */}
      <View style={styles.leftSection}>
        <View style={styles.imageContainer}>
          <Image source={pkg.vehicleImage} style={styles.vehicleImage} />
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.vehicleName}>
            {pkg.vehicleName}, {pkg.vehicleType}
          </Text>
          <Text style={styles.routeText}>{pkg.route}</Text>
          <Text style={styles.featuresText}>
            {pkg.seats} seats • {pkg.features.join(' • ')}
          </Text>
        </View>
      </View>

      {/* Right Side - Pricing Information */}
      <View style={styles.rightSection}>
        <View style={{flexDirection: 'row', alignItems: 'center',gap: wp(1)}}>
        <View style={styles.discountTag}>
          <Text style={styles.discountText}>{pkg.discount}% off</Text>
        </View>
        <Text style={styles.originalPrice}>{pkg.originalPrice}</Text>
        </View>
        <Text style={styles.discountedPrice}>{pkg.discountedPrice}</Text>
        <View style={styles.additionalChargesContainer}>
          <Text style={styles.additionalChargesText}>
            +{pkg.additionalCharges}
          </Text>
          <Text style={styles.taxesText}>(Taxes & Charges)</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Packages</Text>
        {/* <TouchableOpacity style={styles.addButton}>
          <Image source={Images.addIcon} style={styles.addIcon} />
          <Text style={styles.addButtonText}>Add Packages</Text>
        </TouchableOpacity> */}
        <TouchableOpacity 
  style={styles.addButton}
  onPress={() => navigation.navigate("AddPackagesScreen")}
>
  <Image source={Images.addIcon} style={styles.addIcon} />
  <Text style={styles.addButtonText}>Add Packages</Text>
</TouchableOpacity>

      </View>

      {/* Packages List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {packages.map(pkg => renderPackageCard(pkg))}
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
  addIcon: {
    width: wp(4),
    height: wp(4),
    marginRight: wp(1.5),
    tintColor: Colors.sooprsblue,
  },
  addButtonText: {
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
});