import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import FSize from '../../assets/commonCSS/FSize';
import Images from '../../assets/image';

const BillingScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={Images.backArrow} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Billing</Text>
      </View>

      <View style={styles.sectionDivider} />

      <Text style={styles.sectionTitle}>Choose an option</Text>
      <Text style={styles.sectionSubtitle}>
        Create customer or create invoice
      </Text>

      <TouchableOpacity
        style={styles.optionCard}
        onPress={() => navigation.navigate('CreateCustomer')}
        activeOpacity={0.8}>
        <View style={styles.optionIconContainer}>
          <Image source={Images.UserRoundIcon} style={styles.optionIcon} resizeMode="contain" />
        </View>
        <Text style={styles.optionTitle}>Create Customer</Text>
        <Text style={styles.optionSubtitle}>Add new customer details for billing</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionCard}
        onPress={() => navigation.navigate('CreateInvoice')}
        activeOpacity={0.8}>
        <View style={styles.optionIconContainer}>
          <Image source={Images.dollarIcon} style={styles.optionIcon} resizeMode="contain" />
        </View>
        <Text style={styles.optionTitle}>Create Invoice</Text>
        <Text style={styles.optionSubtitle}>Create new invoice for customer</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default BillingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: wp(5),
    paddingTop: hp(5),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  backIcon: {
    width: wp(8),
    height: wp(8),
    tintColor: Colors.black,
    marginRight: wp(3),
  },
  headerTitle: {
    fontSize: FSize.fs18,
    fontWeight: '700',
    color: Colors.black,
  },
  sectionDivider: {
    width: '100%',
    height: hp(0.1),
    backgroundColor: Colors.lightgrey2,
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: FSize.fs18,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: hp(0.5),
  },
  sectionSubtitle: {
    fontSize: FSize.fs12,
    color: Colors.gray,
    marginBottom: hp(2),
  },
  optionCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightgrey2,
    borderRadius: wp(3),
    padding: wp(4),
    marginBottom: hp(2),
  },
  optionIconContainer: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: Colors.sooprslight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  optionIcon: {
    width: wp(6),
    height: wp(6),
    // tintColor: Colors.sooprsblue,
  },
  optionTitle: {
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: hp(0.5),
  },
  optionSubtitle: {
    fontSize: FSize.fs13,
    color: Colors.gray,
  },
});
