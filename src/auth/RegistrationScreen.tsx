import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
  Platform,
  KeyboardAvoidingView,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {launchImageLibrary, ImagePickerResponse, MediaType} from 'react-native-image-picker';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {hp, wp} from '../assets/commonCSS/GlobalCSS';
import Colors from '../assets/commonCSS/Colors';
import FSize from '../assets/commonCSS/FSize';
import Images from '../assets/image';
import { getDataWithToken, postData } from '../services/mobile-api';
import { mobile_siteConfig } from '../services/mobile-siteConfig';
import Toast from 'react-native-toast-message';
import { storeDataToAsyncStorage } from '../services/CommonFunction';

const RegistrationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route?.params as {mobileNumber?: string; phoneNumber?: string; otp?: string} | undefined;
  const {mobileNumber, phoneNumber, otp} = params || {};

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [category, setCategory] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(phoneNumber || mobileNumber || '');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const requestStoragePermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        // Android 13+ (API 33+)
        const result = await request(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
        return result === RESULTS.GRANTED;
      } else {
        // Android 12 and below
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true; // iOS permissions are handled automatically
  };

  const handleImagePicker = async () => {
    try {
      // Request permission first
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
        maxWidth: 1000,
        maxHeight: 1000,
      };

      launchImageLibrary(options, (response: ImagePickerResponse) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorMessage) {
          Alert.alert('Error', response.errorMessage);
        } else if (response.assets && response.assets.length > 0) {
          const imageUri = response.assets[0].uri;
          if (imageUri) {
            setSelectedImage(imageUri);
          }
        }
      });
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  const showAlert = (type: string, text1: string, text2: string) => {
    Toast.show({
      type: type,
      text1: text1,
      text2: text2,
      position: 'top',
    });
  };

  const handleRegister = async () => {
    // Validation
    if (!name.trim()) {
      showAlert('error', 'Error', 'Please enter your name');
      return;
    }

    if (!company.trim()) {
      showAlert('error', 'Error', 'Please enter company name');
      return;
    }

    if (!categoryId) {
      showAlert('error', 'Error', 'Please select a category');
      return;
    }

    let phone = mobileNumber || phoneNumber;
    if (!phone) {
      showAlert('error', 'Error', 'Mobile number is missing');
      return;
    }
    
    // Remove +91 prefix if present
    phone = phone.replace(/\+91/g, '').replace(/\s/g, '');
    if (phone.startsWith('91') && phone.length === 12) {
      phone = phone.substring(2);
    }

    if (!otp) {
      showAlert('error', 'Error', 'OTP is missing');
      return;
    }

    setIsRegistering(true);

    try {
      // Create FormData
      const formData = new FormData();
      
      // Append text fields
      formData.append('name', name.trim());
      formData.append('company_name', company.trim());
      formData.append('category_id', categoryId.toString());
      formData.append('mobile', phone);
      formData.append('otp', otp);
      
      // Append email if provided
      if (email.trim()) {
        formData.append('email', email.trim());
      }

      // Append image if selected
      if (selectedImage) {
        const imageUri = selectedImage;
        const imageName = imageUri.split('/').pop() || 'profile_image.jpg';
        const imageType = 'image/jpeg';
        
        formData.append('profile_image', {
          uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
          type: imageType,
          name: imageName,
        } as any);
      }

      console.log('Registration FormData:', formData);
      
      // Call registration API
      const result: any = await postData(formData, mobile_siteConfig.REGISTER_USER_NEW);
      console.log('Registration result:::::', result);

      // Check for error responses
      if (result?.status === 400 || result?.status === 'error' || (result?.success === false)) {
        showAlert('error', 'Error', result?.msg || result?.message || 'Registration failed. Please try again.');
        setIsRegistering(false);
        return;
      }

      // Check if registration was successful based on actual API response structure
      if (result?.success === true && result?.token) {
        // Store token and set login status
        await storeDataToAsyncStorage(mobile_siteConfig.MOB_ACCESS_TOKEN_KEY, result.token);
        await storeDataToAsyncStorage(mobile_siteConfig.IS_LOGIN, 'TRUE');
        
        // Store user_id from response
        if (result?.user_id) {
          await storeDataToAsyncStorage(mobile_siteConfig.UID, result.user_id.toString());
        }
        
        // Store slug from response
        if (result?.slug) {
          await storeDataToAsyncStorage(mobile_siteConfig.SLUG, result.slug);
        }
        
        // Store email if provided in form (response email might be null)
        if (email.trim()) {
          await storeDataToAsyncStorage(mobile_siteConfig.EMAIL, email.trim());
        }

        // Show success message from API response
        showAlert('success', 'Success', result?.message || 'Vendor registered successfully');
        
        // Navigate to BottomTab on success
        (navigation as any).navigate('BottomTab', { 
          email: email.trim() || result?.email || '', 
          user_id: result?.user_id,
          slug: result?.slug,
          user_type: result?.user_type,
          ...params 
        });
      } else {
        showAlert('error', 'Error', result?.msg || result?.message || 'Registration failed. Please try again.');
      }
    } catch (error: any) {
      console.log('Registration error:::::', error);
      showAlert('error', 'Error', error?.message || 'An error occurred during registration. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  }

  const getAllCategories = async () => {
    try {
      setLoadingCategories(true);
      const res: any = await getDataWithToken({}, mobile_siteConfig.GET_ALL_CATEGORIES);
      const data = await res.json();
      console.log('Categories data:::::', data);
      
      if (data.success && data.data && Array.isArray(data.data)) {
        setCategories(data.data);
      } else {
        console.log('Invalid categories response format');
      }
    } catch (error) {
      console.log('error:::::', error);
    } finally {
      setLoadingCategories(false);
    }
  };
  useEffect(() => {
    getAllCategories();
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#2C2C2C" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {/* Header with Back Button */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}>
              <Image source={Images.backArrow} style={styles.backIcon} />
            </TouchableOpacity>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Fill up your details</Text>
            <Text style={styles.subtitle}>Appear on your Sooprs profile</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Name Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g"
                  placeholderTextColor="#BCBCBC"
                />
              </View>
            </View>

            {/* Company Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Company</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={company}
                  onChangeText={setCompany}
                  placeholder="e.g"
                  placeholderTextColor="#BCBCBC"
                />
              </View>
            </View>

            {/* Category Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.inputWrapper}>
                <Image source={Images.searchIcon} style={styles.searchIcon} />
                <TextInput
                  style={styles.inputWithIcon}
                  value={category}
                  onChangeText={setCategory}
                  placeholder="e.g Website Development"
                  placeholderTextColor="#BCBCBC"
                  editable={false}
                />
                <TouchableOpacity
                  onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                  activeOpacity={0.7}>
                  <Image source={Images.Dropdown} style={styles.dropdownIcon} />
                </TouchableOpacity>
              </View>
              {isDropdownOpen && (
                <View style={styles.dropdownList}>
                  {loadingCategories ? (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.loadingText}>Loading categories...</Text>
                    </View>
                  ) : categories.length > 0 ? (
                    <ScrollView
                      nestedScrollEnabled={true}
                      style={styles.dropdownScrollView}
                      showsVerticalScrollIndicator={true}>
                      {categories.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.dropdownItem,
                            categoryId === item.id && styles.dropdownItemSelected,
                          ]}
                          onPress={() => {
                            setCategory(item.name);
                            setCategoryId(item.id);
                            setIsDropdownOpen(false);
                          }}
                          activeOpacity={0.7}>
                          <Text
                            style={[
                              styles.dropdownItemText,
                              categoryId === item.id && styles.dropdownItemTextSelected,
                            ]}>
                            {item.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.loadingText}>No categories available</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Upload Profile/Logo */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Upload Profile/Logo</Text>
              <TouchableOpacity
                style={styles.uploadBox}
                activeOpacity={0.7}
                onPress={handleImagePicker}>
                {selectedImage ? (
                  <Image
                    source={{uri: selectedImage}}
                    style={styles.selectedImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.uploadIconContainer}>
                    <Text style={styles.plusIcon}>+</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Email Field (Optional) */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Email (optional)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  placeholder="e.g"
                  placeholderTextColor="#BCBCBC"
                />
              </View>
            </View>

            {/* Phone Number Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="e.g"
                  placeholderTextColor="#BCBCBC"
                  editable={false}
                />
              </View>
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleRegister}
            activeOpacity={0.8}
            disabled={isRegistering}>
            <Text style={styles.continueButtonText}>
              {isRegistering ? 'Registering...' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default RegistrationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    // backgroundColor: '#2C2C2C',
  },
  scrollContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: wp(8),
    borderTopRightRadius: wp(8),
    paddingTop: hp(2),
    paddingBottom: hp(6),
    marginTop: hp(2),
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
    borderBottomWidth: hp(0.1),
    borderBottomColor: Colors.lightgrey2,
  },
  backButton: {
    padding: wp(2),
  },
  backIcon: {
    width: hp(3),
    height: hp(3),
    tintColor: Colors.black,
  },
  titleSection: {
    marginBottom: hp(1),
    paddingHorizontal: wp(4), 
  },
  title: {
    fontSize: FSize.fs28,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: hp(1),
  },
  subtitle: {
    fontSize: FSize.fs14,
    color: Colors.gray,
    lineHeight: hp(2.5),
  },
  formContainer: {
    marginBottom: hp(3),
    paddingHorizontal: wp(4), 

  },
  fieldContainer: {
    marginBottom: hp(1),
  },
  label: {
    fontSize: FSize.fs15,
    color: Colors.black,
    marginBottom: hp(1),
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.lightgrey2,
    borderRadius: wp(2),
    paddingHorizontal: wp(3),
    backgroundColor: Colors.white,
    minHeight: hp(6),
  },
  input: {
    flex: 1,
    fontSize: FSize.fs16,
    color: Colors.black,
    paddingVertical: hp(1.5),
  },
  inputWithIcon: {
    flex: 1,
    fontSize: FSize.fs16,
    color: Colors.black,
    paddingVertical: hp(1.5),
    marginLeft: wp(2),
  },
  searchIcon: {
    width: wp(5),
    height: wp(5),
    tintColor: Colors.gray,
  },
  dropdownIcon: {
    width: wp(4),
    height: wp(4),
    resizeMode: 'contain',
    tintColor: Colors.gray,
    // marginLeft: wp(2),
  },
  dropdownList: {
    marginTop: hp(0.5),
    borderWidth: 1,
    borderColor: Colors.lightgrey2,
    borderRadius: wp(2),
    backgroundColor: Colors.white,
    maxHeight: hp(25),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownScrollView: {
    maxHeight: hp(25),
  },
  dropdownItem: {
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightgrey2,
  },
  dropdownItemSelected: {
    backgroundColor: Colors.sooprsblue + '10',
  },
  dropdownItemText: {
    fontSize: FSize.fs16,
    color: Colors.black,
  },
  dropdownItemTextSelected: {
    color: Colors.sooprsblue,
    fontWeight: '600',
  },
  uploadBox: {
    width: '22%',
    height: hp(10),
    borderWidth: 2,
    borderColor: Colors.sooprsblue,
    borderStyle: 'dashed',
    borderRadius: wp(3),
    // backgroundColor: Colors.lightgrey1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(1),
  },
  uploadIconContainer: {
    width: wp(15),
    height: wp(15),
    borderRadius: wp(7.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    fontSize: hp(5),
    color: Colors.sooprsblue,
    fontWeight: '300',
    lineHeight: wp(15),
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: wp(3),
  },
  continueButton: {
    backgroundColor: Colors.sooprsblue,
    borderRadius: wp(2),
    marginHorizontal: wp(4), 
    paddingVertical: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(.5),
    marginBottom: hp(2),
  },
  continueButtonText: {
    color: Colors.white,
    fontSize: FSize.fs16,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FSize.fs14,
    color: Colors.gray,
  },
});
