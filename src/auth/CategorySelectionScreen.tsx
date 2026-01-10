import React, {useEffect, useState, useMemo} from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import Colors from '../assets/commonCSS/Colors';
import FSize from '../assets/commonCSS/FSize';
import {hp, wp} from '../assets/commonCSS/GlobalCSS';
import Images from '../assets/image';
import {getDataWithToken, postData} from '../services/mobile-api';
import {mobile_siteConfig} from '../services/mobile-siteConfig';
import {storeDataToAsyncStorage} from '../services/CommonFunction';

type CategoryItem = {
  id: number;
  name: string;
  icon?: string;
  image?: string;
  color_code?: string;
};

const CategorySelectionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route?.params as {
    mobileNumber?: string;
    phoneNumber?: string;
    otp?: string;
  };
  const {mobileNumber, phoneNumber, otp} = params || {};

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState(false);

  const showToast = (type: string, text1: string, text2: string) => {
    Toast.show({
      type,
      text1,
      text2,
      position: 'top',
    });
  };

  const parseColor = (colorCode?: string) => {
    if (!colorCode) {
      return '#eaf3ff';
    }
    try {
      const parsed = JSON.parse(colorCode);
      console.log('parsed:::::', parsed);
      if (Array.isArray(parsed) && parsed[0]) {
        return parsed[0];
      }
    } catch (error) {
      return colorCode;
    }
    return colorCode ;
  };

  const getImageUrl = (item: CategoryItem) => {
    const path =item.image;
    if (!path) {
      return undefined;
    }
    if (path.startsWith('http')) {
      return path;
    }
    return `https://sooprs.com${path}`;
  };

  const handleProceed = () => {
    if (!selectedCategoryId || !selectedCategoryName) {
      showToast('error', 'Select category', 'Please choose a category first.');
      return;
    }
    // Call registration API directly
    handleRegister();
  };

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res: any = await getDataWithToken({}, mobile_siteConfig.GET_ALL_CATEGORIES);
      const data = await res.json();
      console.log('data:::::', data);
      if (data?.success && Array.isArray(data?.data)) {
        setCategories(data.data);
      } else {
        showToast('error', 'Error', 'Unable to fetch categories right now.');
      }
    } catch (error) {
      console.log('Error fetching categories::::', error);
      showToast('error', 'Error', 'Failed to load categories.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);


  const handleRegister = async () => {
    // Validation - Check if category is selected
    if (!selectedCategoryId) {
      showToast('error', 'Error', 'Please select a category');
      return;
    }

    let phone = mobileNumber || phoneNumber;
    if (!phone) {
      showToast('error', 'Error', 'Mobile number is missing');
      return;
    }
    
    // Remove +91 prefix if present
    phone = phone.replace(/\+91/g, '').replace(/\s/g, '');
    if (phone.startsWith('91') && phone.length === 12) {
      phone = phone.substring(2);
    }

    if (!otp) {
      showToast('error', 'Error', 'OTP is missing');
      return;
    }

    setIsRegistering(true);

    try {
      // Create FormData
      const formData = new FormData();
      
      // Append text fields - Static name "Partner", empty company_name and email
      formData.append('name', 'Partner');
      formData.append('company_name', '');
      formData.append('category_id', selectedCategoryId.toString());
      formData.append('mobile', phone);
      formData.append('otp', otp);

      console.log('Registration FormData:', formData);
      
      // Call registration API
      const result: any = await postData(formData, mobile_siteConfig.REGISTER_USER_NEW);
      console.log('Registration result:::::', result);

      // Check for error responses
      if (result?.status === 400 || result?.status === 'error' || (result?.success === false)) {
        showToast('error', 'Error', result?.msg || result?.message || 'Registration failed. Please try again.');
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

        // Show success message from API response
        showToast('success', 'Success', result?.message || 'Vendor registered successfully');
        
        // Navigate to BottomTab on success
        (navigation as any).reset({
          index: 0,
          routes: [{
            name: 'BottomTab',
            params: {
              user_id: result?.user_id,
              slug: result?.slug,
              user_type: result?.user_type,
              ...params,
            },
          }],
        });
      } else {
        showToast('error', 'Error', result?.msg || result?.message || 'Registration failed. Please try again.');
      }
    } catch (error: any) {
      console.log('Registration error:::::', error);
      showToast('error', 'Error', error?.message || 'An error occurred during registration. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const selectedCategory = useMemo(
    () => categories.find(item => item.id === selectedCategoryId),
    [categories, selectedCategoryId],
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <View style={styles.header}>
        {/* <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Image source={Images.backArrow} style={styles.backIcon} />
        </TouchableOpacity> */}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>What are you looking for?</Text>
        <Text style={styles.subtitle}>
          We can show you exactly what you want
        </Text>

        <View style={styles.gridWrapper}>
          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={Colors.sooprsblue} />
              <Text style={styles.loaderText}>Loading categories...</Text>
            </View>
          ) : categories.length === 0 ? (
            <View style={styles.loaderContainer}>
              <Text style={styles.loaderText}>No categories found</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {categories.map(item => {
                const isSelected = selectedCategoryId === item.id;
                const backgroundColor = parseColor(item.color_code);
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    style={[
                      styles.card,
                      {backgroundColor},
                      isSelected && styles.cardSelected,
                    ]}
                    onPress={() => {
                      setSelectedCategoryId(item.id);
                      setSelectedCategoryName(item.name);
                    }}>
                    {/* Checkmark Badge for Selected Item */}
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <Image
                          source={Images.checkblue}
                          style={styles.checkIcon}
                          resizeMode="contain"
                        />
                      </View>
                    )}
                    <View style={[
                      styles.cardIconWrapper,
                      isSelected && styles.cardIconWrapperSelected,
                    ]}>
                      {getImageUrl(item) ? (
                        <Image
                          source={{uri: getImageUrl(item)}}
                          style={styles.cardIcon}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.placeholderIcon} />
                      )}
                    </View>
                    <Text style={[
                      styles.cardTitle,
                      isSelected && styles.cardTitleSelected,
                    ]} numberOfLines={2}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {selectedCategory && (
        <View style={styles.proceedContainer}>
          <TouchableOpacity
            style={[styles.proceedButton, isRegistering && styles.proceedButtonDisabled]}
            activeOpacity={0.85}
            onPress={handleProceed}
            disabled={isRegistering}>
            {isRegistering ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.proceedText}>Proceed</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default CategorySelectionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingHorizontal: wp(4),
    paddingTop: hp(5),
    paddingBottom: hp(1),
  },
  backButton: {
    width: wp(10),
    height: wp(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: wp(8),
    height: wp(4),
    tintColor: Colors.black,
  },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(14),
  },
  title: {
    fontSize: FSize.fs22,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: hp(0.5),
  },
  subtitle: {
    fontSize: FSize.fs14,
    color: Colors.gray,
    marginBottom: hp(3),
  },
  gridWrapper: {
    // borderWidth: 1,
    borderColor: '#0b7ef4',
    borderRadius: wp(3),
    padding: wp(2),
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(6),
  },
  loaderText: {
    marginTop: hp(1),
    fontSize: FSize.fs14,
    color: Colors.gray,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    borderRadius: wp(4),
    paddingVertical: hp(2.5),
    paddingHorizontal: wp(3),
    marginBottom: hp(2.4),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    position: 'relative',
    overflow: 'visible',
  },
  cardSelected: {
    borderColor: Colors.sooprsblue,
    borderWidth: 2.5,
    shadowColor: Colors.sooprsblue,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
    elevation: 6,
    transform: [{scale: 1.02}],
  },
  checkBadge: {
    position: 'absolute',
    top: -wp(2.5),
    right: -wp(2.5),
    width: wp(7),
    height: wp(7),
    borderRadius: wp(3.5),
    backgroundColor: Colors.sooprsblue,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: Colors.sooprsblue,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  checkIcon: {
    width: wp(4),
    height: wp(4),
    tintColor: Colors.white,
  },
  cardIconWrapper: {
    width: wp(16),
    height: wp(16),
    borderRadius: wp(8),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    marginBottom: hp(1.2),
  },
  cardIconWrapperSelected: {
    borderWidth: 2,
    borderColor: Colors.sooprsblue,
  },
  cardIcon: {
    width: '90%',
    height: '90%',
  },
  placeholderIcon: {
    width: '60%',
    height: '60%',
    backgroundColor: '#d9d9d9',
    borderRadius: wp(3),
  },
  cardTitle: {
    fontSize: FSize.fs15,
    color: Colors.black,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: hp(2.4),
  },
  cardTitleSelected: {
    color: Colors.sooprsblue,
    fontWeight: '700',
  },
  proceedContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: wp(5),
    paddingBottom: hp(3),
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#ececec',
  },
  proceedButton: {
    backgroundColor: Colors.sooprsblue,
    borderRadius: wp(2),
    paddingVertical: hp(1.8),
    alignItems: 'center',
  },
  proceedButtonDisabled: {
    opacity: 0.7,
  },
  proceedText: {
    color: Colors.white,
    fontSize: FSize.fs16,
    fontWeight: '700',
  },
});

