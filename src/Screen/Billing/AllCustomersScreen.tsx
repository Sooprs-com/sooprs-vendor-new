import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  FlatList,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import FSize from '../../assets/commonCSS/FSize';
import Images from '../../assets/image';
import type {Customer} from './CreateCustomerScreen';
import {BILLING_CUSTOMERS_KEY} from './CreateCustomerScreen';

const AllCustomersScreen = () => {
  const navigation = useNavigation<any>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCustomers = async () => {
    try {
      const raw = await AsyncStorage.getItem(BILLING_CUSTOMERS_KEY);
      const list: Customer[] = raw ? JSON.parse(raw) : [];
      setCustomers(list);
    } catch (e) {
      console.log('Error loading customers:', e);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, []),
  );

  const onCreateInvoice = (customer: Customer) => {
    navigation.navigate('CreateInvoice', {customer});
  };

  const renderItem = ({item}: {item: Customer}) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.customerName}>{item.businessName}</Text>
        {item.gstNumber ? (
          <Text style={styles.detail}>GST: {item.gstNumber}</Text>
        ) : null}
        {(item.address || item.city || item.state || item.pincode) && (
          <Text style={styles.detail} numberOfLines={2}>
            {[item.address, item.city, item.state, item.pincode].filter(Boolean).join(', ')}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.createInvoiceBtn}
        onPress={() => onCreateInvoice(item)}
        activeOpacity={0.8}>
        <Image source={Images.dollarIcon} style={styles.invoiceIcon} resizeMode="contain" />
        <Text style={styles.createInvoiceText}>Create Invoice</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={Images.backArrow} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Customers</Text>
      </View>

      <View style={styles.sectionDivider} />

      {loading ? (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Loading...</Text>
        </View>
      ) : customers.length === 0 ? (
        <View style={styles.placeholder}>
          <Image source={Images.UserRoundIcon} style={styles.emptyIcon} resizeMode="contain" />
          <Text style={styles.emptyTitle}>No customers yet</Text>
          <Text style={styles.emptySubtitle}>
            Add customers from Create Customer in Billing menu
          </Text>
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default AllCustomersScreen;

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
  listContent: {
    paddingBottom: hp(4),
  },
  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightgrey2,
    borderRadius: wp(3),
    padding: wp(4),
    marginBottom: hp(2),
  },
  cardContent: {
    marginBottom: hp(1.5),
  },
  customerName: {
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: hp(0.5),
  },
  detail: {
    fontSize: FSize.fs13,
    color: Colors.gray,
    marginTop: hp(0.3),
  },
  createInvoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.sooprsblue,
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(3),
    borderRadius: wp(2),
    gap: wp(2),
  },
  invoiceIcon: {
    width: wp(5),
    height: wp(5),
    tintColor: Colors.white,
  },
  createInvoiceText: {
    fontSize: FSize.fs14,
    fontWeight: '600',
    color: Colors.white,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  placeholderText: {
    fontSize: FSize.fs14,
    color: Colors.gray,
  },
  emptyIcon: {
    width: wp(18),
    height: wp(18),
    tintColor: Colors.lightgrey2,
    marginBottom: hp(2),
  },
  emptyTitle: {
    fontSize: FSize.fs18,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: hp(0.5),
  },
  emptySubtitle: {
    fontSize: FSize.fs14,
    color: Colors.gray,
    textAlign: 'center',
  },
});
