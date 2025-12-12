import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
} from 'react-native';
import React, {useState, useEffect, useCallback} from 'react';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {launchImageLibrary, ImagePickerResponse, MediaType} from 'react-native-image-picker';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import Images from '../../assets/image';
import FSize from '../../assets/commonCSS/FSize';
import {getDataWithToken, postDataWithToken} from '../../services/mobile-api';
import {mobile_siteConfig} from '../../services/mobile-siteConfig';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [vendorName, setVendorName] = useState('Ankur Pandit');
  const [vendorMobile, setVendorMobile] = useState('9888675676');
  const [vendorImage, setVendorImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const getVendorProfile = async () => {
    try {
      setLoading(true);
      const res: any = await getDataWithToken({}, mobile_siteConfig.GET_USER_DETAILS);
      const data: any = await res.json();
      console.log('Vendor profile data in ProfileScreen:::::', data);
      
      if (data?.success && data?.vendorDetail) {
        // Update name
        if (data.vendorDetail.name) {
          setVendorName(data.vendorDetail.name);
        }
        
        // Update mobile number
        if (data.vendorDetail.mobile) {
          setVendorMobile(data.vendorDetail.mobile);
        }
        
        // Update profile image
        if (data.vendorDetail.image) {
          setVendorImage(data.vendorDetail.image);
        }
      }
    } catch (error) {
      console.log('Error fetching vendor profile in ProfileScreen:::::', error);
    } finally {
      setLoading(false);
    }
  };

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
            // Upload image immediately after selection
            await uploadProfileImage(imageUri);
          }
        }
      });
    } catch (error) {
      console.log('ImagePicker Exception: ', error);
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  const uploadProfileImage = async (imageUri: string) => {
    try {
      setUploading(true);
      
      // Create FormData
      const formData = new FormData();
      const imageFileName = imageUri.split('/').pop() || 'profile_image.jpg';
      const imageFileType = imageFileName.split('.').pop() || 'jpg';
      
      formData.append('profile_image', {
        uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
        type: `image/${imageFileType}`,
        name: imageFileName,
      } as any);

      console.log('Uploading profile image...');
      
      // Use COMPLETE_PROFILE endpoint or create a new UPDATE_PROFILE endpoint
      // For now, using COMPLETE_PROFILE as it might support image updates
      const result: any = await postDataWithToken(formData, mobile_siteConfig.COMPLETE_PROFILE);
      console.log('Profile image upload result:::::', result);

      if (result?.success === true || result?.status === 200) {
        // Update local state with new image
        setVendorImage(imageUri);
        setSelectedImage(null);
        Alert.alert('Success', 'Profile image updated successfully');
        // Refresh profile data
        await getVendorProfile();
      } else {
        Alert.alert('Error', result?.msg || result?.message || 'Failed to upload image');
        setSelectedImage(null);
      }
    } catch (error: any) {
      console.log('Error uploading profile image:', error);
      Alert.alert('Error', error?.message || 'Failed to upload profile image');
      setSelectedImage(null);
    } finally {
      setUploading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getVendorProfile();
    }, [])
  );

  const renderSectionItem = (
    icon: any,
    title: string,
    subtitle: string,
    onPress?: () => void,
  ) => (
    <TouchableOpacity
      style={styles.sectionItem}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.sectionItemLeft}>
        <Image source={icon} style={styles.sectionIcon} />
        <View style={styles.sectionTextContainer}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Image source={Images.chevronRight} style={styles.chevronIcon} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Header with Back Arrow */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Image source={Images.backArrow} style={styles.backArrowIcon} />
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          {/* Profile Picture with Camera Overlay */}
          <View style={styles.profileImageContainer}>
            {uploading ? (
              <View style={[styles.profileImage, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={Colors.sooprsblue} />
              </View>
            ) : (
              <Image
                source={selectedImage ? {uri: selectedImage} : (vendorImage ? {uri: vendorImage} : Images.profileImage)}
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

          {/* Name */}
          <Text style={styles.userName}>{vendorName}</Text>

          {/* Phone Number */}
          <Text style={styles.phoneNumber}>{vendorMobile}</Text>

          {/* Verified Badge */}
          <View style={styles.verifiedBadge}>
            <View style={styles.checkIconContainer}>
              <Image source={Images.tickIcon} style={styles.checkIcon} />
            </View>
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        </View>
        

        {/* Stats Cards Row */}
        {/* <View style={styles.statsRow}>
         
          <View style={styles.statCard}>
            <Image source={Images.starIcon} style={[styles.statIcon, {tintColor: '#FFD700'}]} />
            <View style={styles.statTextContainer}>
              <Text style={styles.statValue}>4.9</Text>
              <Text style={styles.statLabel} numberOfLines={1}>Vendor Rating</Text>
            </View>
          </View>

         
          <View style={styles.statCard}>
            <Image source={Images.CalenderIcon} style={[styles.statIcon, {tintColor: Colors.sooprsblue}]} />
            <View style={styles.statTextContainer}>
              <Text style={styles.statValue}>2.5 Yrs</Text>
              <Text style={styles.statLabel} numberOfLines={1}>Experience</Text>
            </View>
          </View>

         
          <View style={styles.statCard}>
            <Image source={Images.projectsIcon} style={[styles.statIcon, {tintColor: '#9C27B0'}]} />
            <View style={styles.statTextContainer}>
              <Text style={styles.statValue}>15</Text>
              <Text style={styles.statLabel} numberOfLines={1}>Total Orders</Text>
            </View>
          </View>
        </View> */}

        {/* Your Information Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Your Information</Text>
          {renderSectionItem(
            Images.locationIcon,
            'Address book',
            'Manage your address here.',
          )}
        </View>

        {/* Payment and coupons Section */}
        <TouchableOpacity 
        onPress={() => navigation.navigate('AddCredits')}
        style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Payment and coupons</Text>
          {renderSectionItem(
            Images.walletIcon,
            'Wallet',
            'Manage your Wallet here.',
          )}
        </TouchableOpacity>

        {/* Other Information Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Other Information</Text>
          {renderSectionItem(
            Images.referIcon,
            'Share the app',
            'Share this app to someone else.',
          )}
          {renderSectionItem(
            Images.favoriteIcon,
            'About us',
            'About Us',
          )}
          {renderSectionItem(
            Images.shieldIcon,
            'Account privacy',
            'Read Privacy here.',
          )}
          {renderSectionItem(
            Images.logoutIcon,
            'Log out',
            'Log Out',
            () => {
              // Handle logout logic here
            },
          )}
        </View>

        {/* Bottom Branding */}
        <View style={styles.brandingContainer}>
          <Text style={styles.brandingText}>Sooprs</Text>
          <Text style={styles.versionText}>v4.131.3</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: hp(3),
  },
  scrollContent: {
    paddingBottom: hp(3),
  },
  header: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(1),
  },
  backButton: {
    width: wp(10),
    height: wp(10),
    justifyContent: 'center',
  },
  backArrowIcon: {
    width: wp(5),
    height: wp(5),
    tintColor: Colors.black,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: hp(2),
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: hp(1.5),
  },
  profileImage: {
    width: wp(25),
    height: wp(25),
    borderRadius: wp(12.5),
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.lightgrey1,
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
    // tintColor: Colors.,
    resizeMode: 'contain',
  },
  userName: {
    fontSize: FSize.fs20,
    fontWeight: '700',
    color: Colors.black,
    marginTop: hp(1),
  },
  phoneNumber: {
    fontSize: FSize.fs14,
    color: Colors.grey,
    marginTop: hp(0.5),
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.6),
    borderRadius: wp(10),
    backgroundColor: Colors.lightgreen,
    marginTop: hp(1),
  },
  checkIconContainer: {
    width: wp(5),
    height: wp(5),
    borderRadius: wp(3),
    backgroundColor: Colors.lightgreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(1.5),
  },
  checkIcon: {
    width: wp(3),
    height: wp(3),
    tintColor: '#4CAF50',
  },
  verifiedText: {
    fontSize: FSize.fs12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    marginTop: hp(3),
    marginBottom: hp(1),
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: wp(3),
    paddingVertical: hp(1.7),
    paddingHorizontal: wp(3),
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(0.5),
    borderWidth: 1,
    borderColor: "#f1f1f1",
  },
  statIcon: {
    width: wp(6),
    height: wp(6),
    marginRight: wp(2),
  },
  statTextContainer: {
    flex: 1,
    flexShrink: 1,
  },
  statValue: {
    fontSize: FSize.fs16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: hp(0.3),
  },
  statLabel: {
    fontSize: FSize.fs11,
    color: Colors.grey,
    fontWeight: '500',
    flexWrap: 'nowrap',
  },
  sectionContainer: {
    marginTop: hp(2),
    paddingHorizontal: wp(5),
  },
  sectionHeader: {
    fontSize: FSize.fs14,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: hp(1),
    marginTop: hp(1),
  },
  sectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightgrey2,
  },
  sectionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    width: wp(6),
    height: wp(6),
    marginRight: wp(3),
    tintColor: Colors.grey,
  },
  sectionTextContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: FSize.fs14,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: hp(0.3),
  },
  sectionSubtitle: {
    fontSize: FSize.fs12,
    color: Colors.grey,
  },
  chevronIcon: {
    width: wp(5),
    height: wp(5),
    tintColor: Colors.grey,
  },
  brandingContainer: {
    alignItems: 'center',
    marginTop: hp(4),
    marginBottom: hp(2),
  },
  brandingText: {
    fontSize: FSize.fs30,
    fontWeight: '400',
    color: Colors.lightgrey2,
    opacity: 0.5,
  },
  versionText: {
    fontSize: FSize.fs12,
    color: Colors.grey,
    marginTop: hp(0.5),
  },
});

