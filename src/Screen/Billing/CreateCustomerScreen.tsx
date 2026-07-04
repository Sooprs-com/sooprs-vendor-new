import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {launchImageLibrary, ImagePickerResponse, MediaType} from 'react-native-image-picker';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import FSize from '../../assets/commonCSS/FSize';
import Images from '../../assets/image';
import Toast from 'react-native-toast-message';

export const BILLING_CUSTOMERS_KEY = '@sooprs_billing_customers';

export type Customer = {
  id: string;
  businessName: string;
  gstNumber?: string;
  pan?: string;
  address?: string;
  pincode?: string;
  state?: string;
  city?: string;
  country?: string;
  clientIndustry?: string;
  phone?: string;
  logoUri?: string;
};

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Retail',
  'Manufacturing',
  'Finance',
  'Education',
  'Real Estate',
  'Consulting',
  'Other',
];

const COUNTRIES = ['India', 'United States', 'United Kingdom', 'UAE', 'Singapore', 'Other'];

const CreateCustomerScreen = () => {
  const navigation = useNavigation<any>();
  const [businessName, setBusinessName] = useState('');
  const [clientIndustry, setClientIndustry] = useState('');
  const [country, setCountry] = useState('India');
  const [cityTown, setCityTown] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [pan, setPan] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [state, setState] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [basicOpen, setBasicOpen] = useState(true);
  const [taxOpen, setTaxOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [industryModalVisible, setIndustryModalVisible] = useState(false);
  const [countryModalVisible, setCountryModalVisible] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(BILLING_CUSTOMERS_KEY);
        if (raw) setCustomers(JSON.parse(raw));
      } catch (e) {
        console.log('Error loading customers:', e);
      }
    };
    load();
  }, []);

  const showToast = (type: string, text1: string, text2?: string) => {
    Toast.show({type, text1, text2: text2 || '', position: 'top'});
  };

  const handleUploadLogo = () => {
    launchImageLibrary(
      {mediaType: 'photo' as MediaType, quality: 0.8, maxWidth: 1080, maxHeight: 1080},
      (response: ImagePickerResponse) => {
        if (response.didCancel) return;
        if (response.errorMessage) {
          Alert.alert('Error', response.errorMessage);
          return;
        }
        if (response.assets?.[0]?.uri) setLogoUri(response.assets[0].uri);
      },
    );
  };

  const handleSubmit = async () => {
    const trimmedName = businessName.trim();
    if (!trimmedName) {
      showToast('error', 'Error', 'Please enter Business Name');
      return;
    }
    if (!country.trim()) {
      showToast('error', 'Error', 'Please select Country');
      return;
    }

    const newCustomer: Customer = {
      id: Date.now().toString(),
      businessName: trimmedName,
      country: country.trim(),
      ...(clientIndustry.trim() && {clientIndustry: clientIndustry.trim()}),
      ...(cityTown.trim() && {city: cityTown.trim()}),
      ...(gstNumber.trim() && {gstNumber: gstNumber.trim()}),
      ...(pan.trim() && {pan: pan.trim()}),
      ...(address.trim() && {address: address.trim()}),
      ...(pincode.trim() && {pincode: pincode.trim()}),
      ...(state.trim() && {state: state.trim()}),
      ...(phone.trim() && {phone: phone.trim()}),
      ...(logoUri && {logoUri}),
    };

    const updated = [newCustomer, ...customers];
    setCustomers(updated);
    try {
      await AsyncStorage.setItem(BILLING_CUSTOMERS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.log('Error saving customers:', e);
    }

    setBusinessName('');
    setClientIndustry('');
    setCountry('India');
    setCityTown('');
    setGstNumber('');
    setPan('');
    setAddress('');
    setPincode('');
    setState('');
    setPhone('');
    setLogoUri(null);

    showToast('success', 'Success', 'Customer added successfully');
  };

  const Chevron = ({up}: {up: boolean}) => (
    <Image
      source={Images.chevronRight}
      style={[styles.chevron, {transform: [{rotate: up ? '-90deg' : '90deg'}]}]}
      resizeMode="contain"
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
          <Image source={Images.backArrow} style={styles.backIcon} resizeMode="contain" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Customer</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Basic Information */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setBasicOpen(!basicOpen)}
          activeOpacity={0.8}>
          <Text style={styles.sectionHeaderText}>Basic Information</Text>
          <Chevron up={basicOpen} />
        </TouchableOpacity>
        {basicOpen && (
          <View style={styles.sectionBody}>
            <TouchableOpacity style={styles.uploadLogoBox} onPress={handleUploadLogo} activeOpacity={0.8}>
              {logoUri ? (
                <Image source={{uri: logoUri}} style={styles.logoPreview} resizeMode="cover" />
              ) : (
                <>
                  <Image source={Images.addIcon} style={styles.uploadPlusIcon} resizeMode="contain" />
                  <Text style={styles.uploadLogoText}>Upload Logo</Text>
                  <Text style={styles.uploadLogoHint}>JPG or PNG, Dimensions 1080×1080px and file size up to 20MB</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.label}>Business Name *</Text>
            <View style={styles.inputBox}>
              <TextInput
                placeholder="Business Name (Required)"
                placeholderTextColor={Colors.lightgrey2}
                style={styles.input}
                value={businessName}
                onChangeText={setBusinessName}
              />
            </View>

            <Text style={styles.label}>Client Industry</Text>
            <TouchableOpacity
              style={styles.inputBox}
              onPress={() => setIndustryModalVisible(true)}
              activeOpacity={0.8}>
              <Text style={[styles.input, !clientIndustry && styles.placeholderText]}>
                {clientIndustry || '-Select an Industry-'}
              </Text>
              <Image source={Images.Dropdown} style={styles.dropdownIcon} resizeMode="contain" />
            </TouchableOpacity>

            <Text style={styles.label}>Select Country *</Text>
            <TouchableOpacity
              style={styles.inputBox}
              onPress={() => setCountryModalVisible(true)}
              activeOpacity={0.8}>
              <Text style={styles.input}>{country}</Text>
              <Image source={Images.Dropdown} style={styles.dropdownIcon} resizeMode="contain" />
            </TouchableOpacity>

            <Text style={styles.label}>City/Town</Text>
            <View style={styles.inputBox}>
              <TextInput
                placeholder="City/Town Name"
                placeholderTextColor={Colors.lightgrey2}
                style={styles.input}
                value={cityTown}
                onChangeText={setCityTown}
              />
            </View>
          </View>
        )}

        {/* Tax Information (optional) */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setTaxOpen(!taxOpen)}
          activeOpacity={0.8}>
          <Text style={styles.sectionHeaderText}>Tax Information (optional)</Text>
          <Chevron up={taxOpen} />
        </TouchableOpacity>
        {taxOpen && (
          <View style={styles.sectionBody}>
            <Text style={styles.label}>GSTIN</Text>
            <View style={styles.inputBox}>
              <TextInput
                placeholder="Enter GST number"
                placeholderTextColor={Colors.lightgrey2}
                style={styles.input}
                value={gstNumber}
                onChangeText={setGstNumber}
                maxLength={15}
              />
            </View>
            <Text style={styles.label}>PAN</Text>
            <View style={styles.inputBox}>
              <TextInput
                placeholder="Enter PAN"
                placeholderTextColor={Colors.lightgrey2}
                style={styles.input}
                value={pan}
                onChangeText={setPan}
                maxLength={10}
              />
            </View>
          </View>
        )}

        {/* Address (optional) */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setAddressOpen(!addressOpen)}
          activeOpacity={0.8}>
          <Text style={styles.sectionHeaderText}>Address (optional)</Text>
          <Chevron up={addressOpen} />
        </TouchableOpacity>
        {addressOpen && (
          <View style={styles.sectionBody}>
            <Text style={styles.label}>Address</Text>
            <View style={styles.inputBox}>
              <TextInput
                placeholder="Enter address"
                placeholderTextColor={Colors.lightgrey2}
                style={[styles.input, styles.inputMultiline]}
                value={address}
                onChangeText={setAddress}
                multiline
              />
            </View>
            <Text style={styles.label}>Pincode</Text>
            <View style={styles.inputBox}>
              <TextInput
                placeholder="Enter pincode"
                placeholderTextColor={Colors.lightgrey2}
                style={styles.input}
                value={pincode}
                onChangeText={setPincode}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>
            <Text style={styles.label}>State</Text>
            <View style={styles.inputBox}>
              <TextInput
                placeholder="Enter state"
                placeholderTextColor={Colors.lightgrey2}
                style={styles.input}
                value={state}
                onChangeText={setState}
              />
            </View>
            <Text style={styles.label}>Phone</Text>
            <View style={styles.inputBox}>
              <TextInput
                placeholder="Enter phone number"
                placeholderTextColor={Colors.lightgrey2}
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.8}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={industryModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIndustryModalVisible(false)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Industry</Text>
            <FlatList
              data={INDUSTRIES}
              keyExtractor={item => item}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setClientIndustry(item);
                    setIndustryModalVisible(false);
                  }}>
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={countryModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCountryModalVisible(false)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <FlatList
              data={COUNTRIES}
              keyExtractor={item => item}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setCountry(item);
                    setCountryModalVisible(false);
                  }}>
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default CreateCustomerScreen;

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
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  backBtn: {
    padding: wp(1),
  },
  backIcon: {
    width: wp(8),
    height: wp(8),
    tintColor: Colors.black,
  },
  headerTitle: {
    fontSize: FSize.fs18,
    fontWeight: '700',
    color: Colors.black,
    flex: 1,
    marginLeft: wp(2),
  },
  headerRight: {
    width: wp(8),
  },
  scrollContent: {
    paddingBottom: hp(4),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(2),
    backgroundColor: Colors.lightgrey1,
    borderRadius: wp(2),
    marginBottom: hp(1),
  },
  sectionHeaderText: {
    fontSize: FSize.fs15,
    fontWeight: '600',
    color: Colors.black,
  },
  chevron: {
    width: wp(5),
    height: wp(5),
    tintColor: Colors.gray,
  },
  sectionBody: {
    marginBottom: hp(2),
    paddingLeft: wp(1),
  },
  uploadLogoBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.lightgrey2,
    borderRadius: wp(2),
    paddingVertical: hp(4),
    paddingHorizontal: wp(4),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2),
    minHeight: hp(18),
  },
  uploadPlusIcon: {
    width: wp(12),
    height: wp(12),
    tintColor: Colors.sooprsblue,
    marginBottom: hp(1),
  },
  logoPreview: {
    width: '100%',
    height: hp(16),
    borderRadius: wp(2),
  },
  uploadLogoText: {
    fontSize: FSize.fs14,
    fontWeight: '600',
    color: Colors.black,
  },
  uploadLogoHint: {
    fontSize: FSize.fs11,
    color: Colors.gray,
    marginTop: hp(0.5),
    textAlign: 'center',
  },
  label: {
    fontSize: FSize.fs13,
    color: Colors.gray,
    fontWeight: '600',
    marginBottom: hp(0.6),
    marginTop: hp(1.2),
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.lightgrey2,
    borderRadius: wp(2),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.2),
    marginBottom: hp(0.5),
  },
  input: {
    flex: 1,
    fontSize: FSize.fs14,
    color: Colors.black,
    paddingVertical: 0,
  },
  inputMultiline: {
    minHeight: hp(8),
    textAlignVertical: 'top',
  },
  placeholderText: {
    color: Colors.lightgrey2,
  },
  dropdownIcon: {
    width: wp(5),
    height: wp(5),
    marginLeft: wp(2),
    tintColor: Colors.gray,
  },
  submitBtn: {
    backgroundColor: Colors.sooprsblue,
    paddingVertical: hp(2),
    borderRadius: wp(3),
    alignItems: 'center',
    marginTop: hp(2),
    marginBottom: hp(3),
  },
  submitText: {
    color: Colors.white,
    fontSize: FSize.fs15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: wp(5),
  },
  modalBox: {
    backgroundColor: Colors.white,
    borderRadius: wp(3),
    maxHeight: hp(50),
    padding: wp(3),
  },
  modalTitle: {
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: hp(1),
  },
  modalItem: {
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(2),
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightgrey2,
  },
  modalItemText: {
    fontSize: FSize.fs14,
    color: Colors.black,
  },
});
