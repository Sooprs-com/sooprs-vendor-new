import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  KeyboardTypeOptions,
} from 'react-native';
import React, {useState, useCallback} from 'react';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {launchImageLibrary, ImagePickerResponse, MediaType} from 'react-native-image-picker';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';
// @ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import FSize from '../../assets/commonCSS/FSize';
import Images from '../../assets/image';
import {getDataWithToken, putDataWithTokenFormData} from '../../services/mobile-api';
import {mobile_siteConfig} from '../../services/mobile-siteConfig';
import Toast from 'react-native-toast-message';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type FieldConfig = {
  key: string;
  label: string;
  icon: IconName;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  editable?: boolean;
  maxLength?: number;
  multiline?: boolean;
  hint?: string;
};

type SectionConfig = {
  title: string;
  subtitle: string;
  icon: IconName;
  iconColor: string;
  iconBg: string;
  fields: FieldConfig[];
};

const EditProfileScreen = () => {
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [listingAbout, setListingAbout] = useState('');
  const [gstNo, setGstNo] = useState('');
  const [pan, setPan] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [city, setCity] = useState('');
  const [areaCode, setAreaCode] = useState('');
  const [country, setCountry] = useState('IN');
  const [address, setAddress] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const showAlert = (type: string, text1: string, text2: string) => {
    Toast.show({
      type: type,
      text1: text1,
      text2: text2,
      position: 'top',
    });
  };

  const getVendorProfile = async () => {
    try {
      setLoading(true);
      const res: any = await getDataWithToken({}, mobile_siteConfig.GET_USER_DETAILS);
      const data: any = await res.json();
      console.log('Vendor profile data in EditProfileScreen:::::', data);

      if (data?.success && data?.vendorDetail) {
        const vendor = data.vendorDetail;

        if (vendor.name) setName(vendor.name);
        if (vendor.email) setEmail(vendor.email);
        if (vendor.mobile) setMobile(vendor.mobile);
        if (vendor.organisation) setOrganisation(vendor.organisation);
        if (vendor.listing_about) setListingAbout(vendor.listing_about);
        if (vendor.gst_no) setGstNo(vendor.gst_no);
        if (vendor.pan) setPan(vendor.pan);
        if (vendor.category_id) setCategoryId(String(vendor.category_id));
        if (vendor.city) setCity(vendor.city);
        if (vendor.area_code) setAreaCode(vendor.area_code);
        if (vendor.country) setCountry(vendor.country);
        if (vendor.address) setAddress(vendor.address);
        if (vendor.image) setProfileImage(vendor.image);

        if (vendor.bank_details) {
          if (vendor.bank_details.account_holder_name) {
            setAccountHolderName(vendor.bank_details.account_holder_name);
          }
          if (vendor.bank_details.bank_name) {
            setBankName(vendor.bank_details.bank_name);
          }
          if (vendor.bank_details.account_no) {
            setAccountNo(vendor.bank_details.account_no);
          }
          if (vendor.bank_details.ifsc) {
            setIfsc(vendor.bank_details.ifsc);
          }
        }
      }
    } catch (error) {
      console.log('Error fetching vendor profile in EditProfileScreen:::::', error);
      showAlert('error', 'Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const requestStoragePermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const result = await request(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
        return result === RESULTS.GRANTED;
      } else {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true;
  };

  const pickProfileImage = async () => {
    try {
      const hasPermission = await requestStoragePermission();

      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please grant storage permission to select images.',
        );
        return;
      }

      const options = {
        mediaType: 'photo' as MediaType,
        quality: 0.8 as const,
        maxWidth: 2000,
        maxHeight: 2000,
      };

      launchImageLibrary(options, async (response: ImagePickerResponse) => {
        if (response.didCancel) {
          return;
        }

        if (response.errorMessage) {
          Alert.alert('Error', response.errorMessage);
          return;
        }

        if (response.assets && response.assets.length > 0) {
          const imageUri = response.assets[0].uri;
          if (imageUri) {
            setSelectedImage(imageUri);
          }
        }
      });
    } catch (error) {
      console.log('ImagePicker Exception: ', error);
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  const handleUpdateProfile = async () => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      if (name.trim()) formData.append('name', name.trim());
      if (email.trim()) formData.append('email', email.trim());
      if (organisation.trim()) formData.append('organisation', organisation.trim());
      if (listingAbout.trim()) formData.append('listing_about', listingAbout.trim());
      if (gstNo.trim()) formData.append('gst_no', gstNo.trim());
      if (pan.trim()) formData.append('pan', pan.trim());
      if (categoryId) formData.append('category_id', categoryId);
      if (city.trim()) formData.append('city', city.trim());
      if (areaCode.trim()) formData.append('area_code', areaCode.trim());
      if (country.trim()) formData.append('country', country.trim());
      if (address.trim()) formData.append('address', address.trim());
      if (accountHolderName.trim()) formData.append('account_holder_name', accountHolderName.trim());
      if (bankName.trim()) formData.append('bank_name', bankName.trim());
      if (accountNo.trim()) formData.append('account_no', accountNo.trim());
      if (ifsc.trim()) formData.append('ifsc', ifsc.trim());

      if (selectedImage) {
        const imageFileName = selectedImage.split('/').pop() || 'profile_image.jpg';
        const imageFileType = imageFileName.split('.').pop() || 'jpg';

        formData.append('profile_image', {
          uri: Platform.OS === 'android' ? selectedImage : selectedImage.replace('file://', ''),
          type: `image/${imageFileType}`,
          name: imageFileName,
        } as any);
      }

      console.log('Update Profile Payload:', formData);

      const result: any = await putDataWithTokenFormData(formData, mobile_siteConfig.UPDATE_PROFILE);
      console.log('Update Profile result:::::', result);

      if (result?.status === 400 || result?.status === 'error' || result?.success === false) {
        showAlert('error', 'Error', result?.msg || result?.message || 'Failed to update profile. Please try again.');
        setIsSubmitting(false);
        return;
      }

      if (result?.success === true) {
        showAlert('success', 'Success', result?.message || 'Profile updated successfully');

        if (selectedImage) {
          setProfileImage(selectedImage);
          setSelectedImage(null);
        }

        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        showAlert('error', 'Error', result?.msg || result?.message || 'Failed to update profile. Please try again.');
      }
    } catch (error: any) {
      console.log('Update Profile error:::::', error);
      showAlert('error', 'Error', error?.message || 'An error occurred while updating profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getVendorProfile();
    }, []),
  );

  const sections: SectionConfig[] = [
    {
      title: 'Personal Information',
      subtitle: 'How clients see you on Sooprs',
      icon: 'account-outline',
      iconColor: '#2563EB',
      iconBg: '#EEF4FF',
      fields: [
        {
          key: 'name',
          label: 'Full Name',
          icon: 'account-outline',
          value: name,
          onChangeText: setName,
          placeholder: 'Enter your full name',
          autoCapitalize: 'words',
        },
        {
          key: 'email',
          label: 'Email Address',
          icon: 'email-outline',
          value: email,
          onChangeText: setEmail,
          placeholder: 'Enter your email',
          keyboardType: 'email-address',
          autoCapitalize: 'none',
        },
        {
          key: 'mobile',
          label: 'Mobile Number',
          icon: 'phone-outline',
          value: mobile,
          placeholder: 'Mobile number',
          editable: false,
          hint: 'Mobile number cannot be changed',
        },
        {
          key: 'organisation',
          label: 'Organisation',
          icon: 'office-building-outline',
          value: organisation,
          onChangeText: setOrganisation,
          placeholder: 'Enter organisation name',
          autoCapitalize: 'words',
        },
        {
          key: 'listingAbout',
          label: 'About You',
          icon: 'text-box-outline',
          value: listingAbout,
          onChangeText: setListingAbout,
          placeholder: 'Write a short bio for your listing',
          multiline: true,
        },
      ],
    },
    {
      title: 'Business & Address',
      subtitle: 'Registration and location details',
      icon: 'file-document-outline',
      iconColor: '#0F766E',
      iconBg: '#ECFDF5',
      fields: [
        {
          key: 'gstNo',
          label: 'GST Number',
          icon: 'receipt-text-outline',
          value: gstNo,
          onChangeText: text => setGstNo(text.toUpperCase()),
          placeholder: '22AAAAA0000A1Z5',
          autoCapitalize: 'characters',
          maxLength: 15,
        },
        {
          key: 'pan',
          label: 'PAN',
          icon: 'card-account-details-outline',
          value: pan,
          onChangeText: text => setPan(text.toUpperCase()),
          placeholder: 'ABCDE1234F',
          autoCapitalize: 'characters',
          maxLength: 10,
        },
        {
          key: 'address',
          label: 'Address',
          icon: 'map-marker-outline',
          value: address,
          onChangeText: setAddress,
          placeholder: 'Enter your full address',
          autoCapitalize: 'words',
        },
        {
          key: 'city',
          label: 'City',
          icon: 'city-variant-outline',
          value: city,
          onChangeText: setCity,
          placeholder: 'Enter city',
          autoCapitalize: 'words',
        },
        {
          key: 'country',
          label: 'Country Code',
          icon: 'earth',
          value: country,
          onChangeText: text => setCountry(text.toUpperCase()),
          placeholder: 'IN',
          autoCapitalize: 'characters',
          maxLength: 2,
          hint: '2-letter country code, e.g. IN',
        },
        {
          key: 'areaCode',
          label: 'Pincode',
          icon: 'mailbox-outline',
          value: areaCode,
          onChangeText: setAreaCode,
          placeholder: 'Enter 6-digit pincode',
          keyboardType: 'numeric',
          maxLength: 6,
        },
      ],
    },
    {
      title: 'Bank Details',
      subtitle: 'Used for payouts — keep this accurate',
      icon: 'bank-outline',
      iconColor: '#7C3AED',
      iconBg: '#F3EEFF',
      fields: [
        {
          key: 'accountHolderName',
          label: 'Account Holder Name',
          icon: 'account-check-outline',
          value: accountHolderName,
          onChangeText: setAccountHolderName,
          placeholder: 'Name as per bank account',
          autoCapitalize: 'words',
        },
        {
          key: 'bankName',
          label: 'Bank Name',
          icon: 'bank-outline',
          value: bankName,
          onChangeText: setBankName,
          placeholder: 'Enter bank name',
          autoCapitalize: 'words',
        },
        {
          key: 'accountNo',
          label: 'Account Number',
          icon: 'numeric',
          value: accountNo,
          onChangeText: setAccountNo,
          placeholder: 'Enter account number',
          keyboardType: 'numeric',
        },
        {
          key: 'ifsc',
          label: 'IFSC Code',
          icon: 'barcode',
          value: ifsc,
          onChangeText: text => setIfsc(text.toUpperCase()),
          placeholder: 'SBIN0001234',
          autoCapitalize: 'characters',
          maxLength: 11,
        },
      ],
    },
  ];

  const profileSource = selectedImage
    ? {uri: selectedImage}
    : profileImage
      ? {uri: profileImage}
      : Images.profileImage;

  const renderField = (field: FieldConfig, isLast: boolean) => {
    const isFocused = focusedField === field.key;
    const isDisabled = field.editable === false;

    return (
      <View key={field.key} style={[styles.fieldWrap, isLast && styles.fieldWrapLast]}>
        <Text style={styles.label}>{field.label}</Text>
        <View
          style={[
            styles.inputBox,
            field.multiline && styles.inputBoxMultiline,
            isFocused && styles.inputBoxFocused,
            isDisabled && styles.inputBoxDisabled,
          ]}>
          <MaterialCommunityIcons
            name={field.icon}
            size={wp(5)}
            color={isFocused ? Colors.sooprsblue : isDisabled ? '#94A3B8' : '#64748B'}
            style={field.multiline ? styles.multilineIcon : undefined}
          />
          <TextInput
            placeholder={field.placeholder}
            placeholderTextColor="#94A3B8"
            style={[styles.input, field.multiline && styles.textArea, isDisabled && styles.disabledInput]}
            value={field.value}
            onChangeText={field.onChangeText}
            keyboardType={field.keyboardType}
            autoCapitalize={field.autoCapitalize}
            editable={!isDisabled}
            maxLength={field.maxLength}
            multiline={field.multiline}
            numberOfLines={field.multiline ? 4 : 1}
            onFocus={() => setFocusedField(field.key)}
            onBlur={() => setFocusedField(null)}
          />
          {isDisabled ? (
            <MaterialCommunityIcons name="lock-outline" size={wp(4.2)} color="#94A3B8" />
          ) : null}
        </View>
        {field.hint ? <Text style={styles.hintText}>{field.hint}</Text> : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={Platform.OS === 'android'}
      />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}>
          <Image source={Images.backArrow} style={styles.backIcon} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Text style={styles.headerSubtitle}>Keep your details up to date</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? hp(1) : 0}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.heroCard}>
            <View style={styles.avatarWrap}>
              {uploading ? (
                <View style={[styles.avatar, styles.avatarLoading]}>
                  <ActivityIndicator size="large" color={Colors.sooprsblue} />
                </View>
              ) : (
                <Image source={profileSource} style={styles.avatar} />
              )}
              <TouchableOpacity
                style={styles.cameraBtn}
                onPress={pickProfileImage}
                disabled={uploading}
                activeOpacity={0.8}>
                <MaterialCommunityIcons name="camera" size={wp(4.4)} color={Colors.white} />
              </TouchableOpacity>
            </View>

            <Text style={styles.heroName} numberOfLines={1}>
              {name || 'Your name'}
            </Text>
            {organisation ? (
              <Text style={styles.heroOrg} numberOfLines={1}>
                {organisation}
              </Text>
            ) : null}

            <TouchableOpacity
              style={styles.changePhotoBtn}
              onPress={pickProfileImage}
              disabled={uploading}
              activeOpacity={0.8}>
              <MaterialCommunityIcons name="image-edit-outline" size={wp(4.2)} color={Colors.sooprsblue} />
              <Text style={styles.changePhotoText}>
                {selectedImage ? 'Photo selected · Change' : 'Change photo'}
              </Text>
            </TouchableOpacity>
          </View>

          {sections.map(section => (
            <View key={section.title} style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, {backgroundColor: section.iconBg}]}>
                  <MaterialCommunityIcons
                    name={section.icon}
                    size={wp(5.2)}
                    color={section.iconColor}
                  />
                </View>
                <View style={styles.sectionHeaderText}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
                </View>
              </View>
              {section.fields.map((field, index) =>
                renderField(field, index === section.fields.length - 1),
              )}
              {section.title === 'Bank Details' ? (
                <View style={styles.secureNote}>
                  <MaterialCommunityIcons name="shield-lock-outline" size={wp(4.2)} color="#7C3AED" />
                  <Text style={styles.secureNoteText}>
                    Your bank details are used only for payouts and stay private.
                  </Text>
                </View>
              ) : null}
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.updateBtn, isSubmitting && styles.updateBtnDisabled]}
            onPress={handleUpdateProfile}
            disabled={isSubmitting || loading}
            activeOpacity={0.85}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <MaterialCommunityIcons name="check-circle-outline" size={wp(5.2)} color={Colors.white} />
            )}
            <Text style={styles.updateText}>
              {isSubmitting ? 'Saving changes...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {loading ? (
        <View style={styles.fullLoader}>
          <ActivityIndicator size="large" color={Colors.sooprsblue} />
          <Text style={styles.loaderText}>Loading profile...</Text>
        </View>
      ) : null}
    </View>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(2.5),
    paddingTop:
      Platform.OS === 'ios'
        ? hp(6.5)
        : (StatusBar.currentHeight || hp(3)) + hp(1.2),
    paddingBottom: hp(1.4),
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    padding: wp(2),
  },
  backIcon: {
    width: wp(8),
    height: wp(8),
    tintColor: '#0F172A',
  },
  headerTextWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FSize.fs22,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    marginTop: hp(0.12),
    fontSize: FSize.fs14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  headerSpacer: {
    width: wp(10),
  },
  scrollContent: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1.8),
    paddingBottom: hp(2),
  },
  heroCard: {
    backgroundColor: Colors.white,
    borderRadius: wp(4.5),
    paddingVertical: hp(2.4),
    paddingHorizontal: wp(4.4),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: hp(1.2),
  },
  avatar: {
    width: wp(26),
    height: wp(26),
    borderRadius: wp(13),
    backgroundColor: '#EEF4FF',
    borderWidth: 3,
    borderColor: '#DBEAFE',
  },
  avatarLoading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBtn: {
    position: 'absolute',
    right: -wp(0.6),
    bottom: -wp(0.4),
    width: wp(8.4),
    height: wp(8.4),
    borderRadius: wp(4.2),
    backgroundColor: Colors.sooprsblue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: Colors.white,
  },
  heroName: {
    fontSize: FSize.fs20,
    fontWeight: '800',
    color: '#0F172A',
  },
  heroOrg: {
    marginTop: hp(0.25),
    fontSize: FSize.fs13,
    fontWeight: '600',
    color: '#64748B',
  },
  changePhotoBtn: {
    marginTop: hp(1.2),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FF',
    borderRadius: wp(5),
    paddingHorizontal: wp(3.4),
    paddingVertical: hp(0.7),
    gap: wp(1.4),
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  changePhotoText: {
    fontSize: FSize.fs13,
    fontWeight: '700',
    color: Colors.sooprsblue,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: wp(4.5),
    paddingHorizontal: wp(4),
    paddingTop: hp(1.6),
    paddingBottom: hp(1.4),
    marginTop: hp(1.6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.4),
    paddingBottom: hp(1.2),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionIcon: {
    width: wp(10.5),
    height: wp(10.5),
    borderRadius: wp(3),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: FSize.fs16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    marginTop: hp(0.15),
    fontSize: FSize.fs12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  fieldWrap: {
    marginBottom: hp(1.4),
  },
  fieldWrapLast: {
    marginBottom: hp(0.4),
  },
  label: {
    fontSize: FSize.fs12,
    color: '#475569',
    fontWeight: '700',
    marginBottom: hp(0.55),
    letterSpacing: 0.2,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: wp(3),
    paddingHorizontal: wp(3.2),
    minHeight: hp(6.2),
    gap: wp(2.2),
  },
  inputBoxMultiline: {
    alignItems: 'flex-start',
    paddingTop: hp(1.2),
    minHeight: hp(12),
  },
  inputBoxFocused: {
    borderColor: Colors.sooprsblue,
    backgroundColor: '#F8FBFF',
  },
  inputBoxDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    fontSize: FSize.fs14,
    color: '#0F172A',
    fontWeight: '600',
    paddingVertical: Platform.OS === 'ios' ? hp(1.1) : hp(0.8),
  },
  disabledInput: {
    color: '#64748B',
  },
  textArea: {
    minHeight: hp(9),
    textAlignVertical: 'top',
  },
  multilineIcon: {
    marginTop: hp(0.2),
  },
  hintText: {
    marginTop: hp(0.45),
    fontSize: FSize.fs11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F3FF',
    borderRadius: wp(2.8),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    marginTop: hp(0.8),
    gap: wp(2),
  },
  secureNoteText: {
    flex: 1,
    fontSize: FSize.fs12,
    color: '#6D28D9',
    fontWeight: '600',
    lineHeight: hp(2.1),
  },
  footer: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
    paddingBottom: Platform.OS === 'ios' ? hp(2.6) : hp(1.6),
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  updateBtn: {
    backgroundColor: Colors.sooprsblue,
    paddingVertical: hp(1.7),
    borderRadius: wp(3.2),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: wp(2),
    ...Platform.select({
      ios: {
        shadowColor: Colors.sooprsblue,
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.28,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  updateBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.9,
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  updateText: {
    color: Colors.white,
    fontSize: FSize.fs15,
    fontWeight: '800',
  },
  fullLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248, 250, 252, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: hp(1),
    fontSize: FSize.fs13,
    fontWeight: '600',
    color: '#64748B',
  },
});
