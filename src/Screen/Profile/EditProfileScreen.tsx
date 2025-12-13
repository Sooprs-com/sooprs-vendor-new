import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Alert,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {launchImageLibrary, ImagePickerResponse, MediaType} from 'react-native-image-picker';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import FSize from '../../assets/commonCSS/FSize';
import Images from '../../assets/image';
import {getDataWithToken, postDataWithToken, putDataWithTokenFormData} from '../../services/mobile-api';
import {mobile_siteConfig} from '../../services/mobile-siteConfig';
import Toast from 'react-native-toast-message';

const EditProfileScreen = () => {
  const navigation = useNavigation();
  
  // State for all form fields
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
        
        // Fill all fields from vendorDetail
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
        
        // Fill bank details
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
      // Create FormData for multipart/form-data
      const formData = new FormData();
      
      // Add all text fields
      if (name.trim()) formData.append('name', name.trim());
      if (email.trim()) formData.append('email', email.trim());
      // Mobile number is read-only, not sent in update
      if (organisation.trim()) formData.append('organisation', organisation.trim());
      if (listingAbout.trim()) formData.append('listing_about', listingAbout.trim());
      if (gstNo.trim()) formData.append('gst_no', gstNo.trim());
      if (pan.trim()) formData.append('pan', pan.trim());
      // Always pass category_id from API response
      if (categoryId) formData.append('category_id', categoryId);
      if (city.trim()) formData.append('city', city.trim());
      if (areaCode.trim()) formData.append('area_code', areaCode.trim());
      if (country.trim()) formData.append('country', country.trim());
      if (address.trim()) formData.append('address', address.trim());
      if (accountHolderName.trim()) formData.append('account_holder_name', accountHolderName.trim());
      if (bankName.trim()) formData.append('bank_name', bankName.trim());
      if (accountNo.trim()) formData.append('account_no', accountNo.trim());
      if (ifsc.trim()) formData.append('ifsc', ifsc.trim());

      // Add profile image if selected
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

      // Success case
      if (result?.success === true) {
        showAlert('success', 'Success', result?.message || 'Profile updated successfully');
        
        // Update local state with new image if uploaded
        if (selectedImage) {
          setProfileImage(selectedImage);
          setSelectedImage(null);
        }
        
        // Navigate back after successful submission
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
    React.useCallback(() => {
      getVendorProfile();
    }, [])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.sooprsblue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image source={Images.backArrow} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        <View style={styles.sectionDivider} />

        {/* Profile Image Section */}
        <View style={styles.profileImageSection}>
          <View style={styles.profileImageContainer}>
            {uploading ? (
              <View style={[styles.profileImage, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={Colors.sooprsblue} />
              </View>
            ) : (
              <Image
                source={selectedImage ? {uri: selectedImage} : (profileImage ? {uri: profileImage} : Images.profileImage)}
                style={styles.profileImage}
              />
            )}
            <TouchableOpacity 
              style={styles.cameraIconContainer}
              onPress={pickProfileImage}
              disabled={uploading}>
              <Image source={Images.imageIcon} style={styles.cameraIcon} />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileImageLabel}>Profile Image</Text>
        </View>

        {/* Personal Information Section */}
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <Text style={styles.sectionSubtitle}>
          Update your personal details
        </Text>

        {/* Name */}
        <Text style={styles.label}>Name</Text>
        <View style={styles.inputBox}>
          <TextInput
            placeholder="Enter your name"
            placeholderTextColor={Colors.lightgrey2}
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputBox}>
          <TextInput
            placeholder="Enter your email"
            placeholderTextColor={Colors.lightgrey2}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Mobile */}
        <Text style={styles.label}>Mobile</Text>
        <View style={[styles.inputBox, styles.disabledInputBox]}>
          <TextInput
            placeholder="Enter your mobile number"
            placeholderTextColor={Colors.lightgrey2}
            style={[styles.input, styles.disabledInput]}
            value={mobile}
            editable={false}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        {/* Organisation */}
        <Text style={styles.label}>Organisation</Text>
        <View style={styles.inputBox}>
          <TextInput
            placeholder="Enter organisation name"
            placeholderTextColor={Colors.lightgrey2}
            style={styles.input}
            value={organisation}
            onChangeText={setOrganisation}
          />
        </View>

        {/* Listing About */}
        <Text style={styles.label}>Listing About</Text>
        <View style={styles.inputBox}>
          <TextInput
            placeholder="Enter about text"
            placeholderTextColor={Colors.lightgrey2}
            style={[styles.input, styles.textArea]}
            value={listingAbout}
            onChangeText={setListingAbout}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Registration Details Section */}
        <Text style={[styles.sectionTitle, {marginTop: hp(2)}]}>Registration Details</Text>
        <Text style={styles.sectionSubtitle}>
          Update your registration details
        </Text>

        {/* GST Number */}
        <Text style={styles.label}>GST Number</Text>
        <View style={styles.inputBox}>
          <TextInput
            placeholder="Enter GST number"
            placeholderTextColor={Colors.lightgrey2}
            style={styles.input}
            value={gstNo}
            onChangeText={setGstNo}
            maxLength={15}
          />
        </View>

        {/* PAN */}
        <Text style={styles.label}>PAN</Text>
        <View style={styles.inputBox}>
          <TextInput
            placeholder="Enter PAN number"
            placeholderTextColor={Colors.lightgrey2}
            style={styles.input}
            value={pan}
            onChangeText={setPan}
            maxLength={10}
          />
        </View>

        {/* Address */}
        <Text style={styles.label}>Address</Text>
        <View style={styles.inputBox}>
          <View style={styles.iconInputRow}>
            <Image source={Images.searchIcon} style={styles.inputIcon} />
            <TextInput
              placeholder="Enter your address"
              placeholderTextColor={Colors.lightgrey2}
              style={styles.inputWithIcon}
              value={address}
              onChangeText={setAddress}
            />
          </View>
        </View>

        {/* City */}
        <Text style={styles.label}>City</Text>
        <View style={styles.inputBox}>
          <TextInput
            placeholder="Enter city"
            placeholderTextColor={Colors.lightgrey2}
            style={styles.input}
            value={city}
            onChangeText={setCity}
          />
        </View>

        {/* Country */}
        <Text style={styles.label}>Country</Text>
        <View style={styles.inputBox}>
          <TextInput
            placeholder="Enter country code (e.g., IN)"
            placeholderTextColor={Colors.lightgrey2}
            style={styles.input}
            value={country}
            onChangeText={setCountry}
            maxLength={2}
          />
        </View>

        {/* Area Code (Pincode) */}
        <Text style={styles.label}>Area Code (Pincode)</Text>
        <View style={styles.inputBox}>
          <TextInput
            placeholder="Enter pincode"
            placeholderTextColor={Colors.lightgrey2}
            style={styles.input}
            value={areaCode}
            onChangeText={setAreaCode}
            keyboardType="numeric"
            maxLength={6}
          />
        </View>

        {/* Bank Details Section */}
        <Text style={[styles.sectionTitle, {marginTop: hp(2)}]}>Bank Details</Text>
        <Text style={styles.sectionSubtitle}>
          Update your bank details
        </Text>

        {/* Account Holder Name */}
        <Text style={styles.label}>Account Holder Name</Text>
        <View style={styles.inputBox}>
          <TextInput
            placeholder="Enter account holder name"
            placeholderTextColor={Colors.lightgrey2}
            style={styles.input}
            value={accountHolderName}
            onChangeText={setAccountHolderName}
          />
        </View>

        {/* Bank Name */}
        <Text style={styles.label}>Bank Name</Text>
        <View style={styles.inputBox}>
          <TextInput
            placeholder="Enter bank name"
            placeholderTextColor={Colors.lightgrey2}
            style={styles.input}
            value={bankName}
            onChangeText={setBankName}
          />
        </View>

        {/* Account Number */}
        <Text style={styles.label}>Account Number</Text>
        <View style={styles.inputBox}>
          <TextInput
            placeholder="Enter account number"
            placeholderTextColor={Colors.lightgrey2}
            style={styles.input}
            value={accountNo}
            onChangeText={setAccountNo}
            keyboardType="numeric"
          />
        </View>

        {/* IFSC Code */}
        <Text style={styles.label}>IFSC Code</Text>
        <View style={styles.inputBox}>
          <TextInput
            placeholder="Enter IFSC code"
            placeholderTextColor={Colors.lightgrey2}
            style={styles.input}
            value={ifsc}
            onChangeText={setIfsc}
            maxLength={11}
          />
        </View>

        {/* Update Button */}
        <TouchableOpacity 
          style={[styles.updateBtn, isSubmitting && styles.updateBtnDisabled]}
          onPress={handleUpdateProfile}
          disabled={isSubmitting}
          activeOpacity={0.8}>
          <Text style={styles.updateText}>
            {isSubmitting ? 'Updating...' : 'Update Profile'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: hp(2),
    paddingHorizontal: wp(5),
  },
  scrollContent: {
    paddingBottom: hp(3),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: hp(50),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(2),
    marginBottom: hp(1),
  },
  backIcon: {
    width: wp(5),
    height: wp(5),
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
  profileImageSection: {
    alignItems: 'center',
    marginBottom: hp(2),
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: hp(1),
  },
  profileImage: {
    width: wp(25),
    height: wp(25),
    borderRadius: wp(12.5),
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    backgroundColor: Colors.sooprsblue,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  cameraIcon: {
    width: wp(8),
    height: wp(8),
    resizeMode: 'contain',
  },
  profileImageLabel: {
    fontSize: FSize.fs12,
    color: Colors.grey,
  },
  sectionTitle: {
    fontSize: FSize.fs18,
    fontWeight: '700',
    color: Colors.black,
    marginTop: hp(1),
  },
  sectionSubtitle: {
    fontSize: FSize.fs12,
    color: Colors.gray,
    marginBottom: hp(2),
  },
  label: {
    fontSize: FSize.fs13,
    color: Colors.gray,
    fontWeight: '600',
    marginBottom: hp(0.6),
    marginTop: hp(1),
  },
  inputBox: {
    borderWidth: 1,
    borderColor: Colors.lightgrey2,
    borderRadius: wp(2),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.2),
    marginBottom: hp(1),
  },
  input: {
    fontSize: FSize.fs14,
    color: Colors.black,
  },
  disabledInputBox: {
    backgroundColor: Colors.lightgrey1 || '#f5f5f5',
    opacity: 0.7,
  },
  disabledInput: {
    color: Colors.grey,
  },
  textArea: {
    minHeight: hp(8),
    textAlignVertical: 'top',
  },
  iconInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    width: wp(5),
    height: wp(5),
    tintColor: Colors.gray,
    marginRight: wp(3),
  },
  inputWithIcon: {
    flex: 1,
    fontSize: FSize.fs14,
    color: Colors.black,
  },
  updateBtn: {
    backgroundColor: Colors.sooprsblue,
    paddingVertical: hp(2),
    borderRadius: wp(3),
    alignItems: 'center',
    marginTop: hp(3),
    marginBottom: hp(5),
  },
  updateBtnDisabled: {
    backgroundColor: Colors.gray,
    opacity: 0.6,
  },
  updateText: {
    color: Colors.white,
    fontSize: FSize.fs15,
    fontWeight: '700',
  },
});

