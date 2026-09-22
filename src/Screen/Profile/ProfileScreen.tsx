import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import React, {useState, useCallback} from 'react';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {launchImageLibrary, ImagePickerResponse, MediaType} from 'react-native-image-picker';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';
// @ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import Images from '../../assets/image';
import FSize from '../../assets/commonCSS/FSize';
import {getDataWithToken, postDataWithToken} from '../../services/mobile-api';
import {mobile_siteConfig} from '../../services/mobile-siteConfig';
import {clearAllAsyncStorage} from '../../services/CommonFunction';
import {useDispatch} from 'react-redux';

type MenuIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type MenuItem = {
  icon: MenuIconName;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  danger?: boolean;
};

const ProfileScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [vendorName, setVendorName] = useState('Ankur Pandit');
  const [vendorMobile, setVendorMobile] = useState('9888675676');
  const [vendorImage, setVendorImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllAsyncStorage();
              dispatch({
                type: 'CLEAR_USER_DETAILS',
              });
              (navigation as any).reset({
                index: 0,
                routes: [{name: 'EnterMobileNumber'}],
              });
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ],
      {cancelable: true},
    );
  };

  const getVendorProfile = async () => {
    try {
      setLoading(true);
      const res: any = await getDataWithToken({}, mobile_siteConfig.GET_USER_DETAILS);
      const data: any = await res.json();
      console.log('Vendor profile data in ProfileScreen:::::', data);

      if (data?.success && data?.vendorDetail) {
        if (data.vendorDetail.name) {
          setVendorName(data.vendorDetail.name);
        }
        if (data.vendorDetail.mobile) {
          setVendorMobile(data.vendorDetail.mobile);
        }
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

      const formData = new FormData();
      const imageFileName = imageUri.split('/').pop() || 'profile_image.jpg';
      const imageFileType = imageFileName.split('.').pop() || 'jpg';

      formData.append('profile_image', {
        uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
        type: `image/${imageFileType}`,
        name: imageFileName,
      } as any);

      console.log('Uploading profile image...');

      const result: any = await postDataWithToken(formData, mobile_siteConfig.COMPLETE_PROFILE);
      console.log('Profile image upload result:::::', result);

      if (result?.success === true || result?.status === 200) {
        setVendorImage(imageUri);
        setSelectedImage(null);
        Alert.alert('Success', 'Profile image updated successfully');
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
    }, []),
  );

  const renderMenuItem = (item: MenuItem, isLast: boolean) => (
    <TouchableOpacity
      key={item.title}
      style={[styles.menuItem, isLast && styles.menuItemLast]}
      onPress={item.onPress}
      activeOpacity={0.72}>
      <View style={[styles.menuIconWrap, {backgroundColor: item.iconBg}]}>
        <MaterialCommunityIcons name={item.icon} size={wp(5.6)} color={item.iconColor} />
      </View>
      <View style={styles.menuTextWrap}>
        <Text style={[styles.menuTitle, item.danger && styles.menuTitleDanger]}>{item.title}</Text>
        {!!item.subtitle && (
          <Text style={styles.menuSubtitle} numberOfLines={2}>
            {item.subtitle}
          </Text>
        )}
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={wp(6)}
        color={item.danger ? '#FCA5A5' : '#94A3B8'}
      />
    </TouchableOpacity>
  );

  const informationItems: MenuItem[] = [
    {
      icon: 'calendar-clock',
      iconColor: '#2563EB',
      iconBg: '#EEF4FF',
      title: 'Available Slots',
      subtitle: 'View and manage your consultation availability.',
      onPress: () => (navigation as any).navigate('AvailableSlotsScreen'),
    },
    {
      icon: 'wallet-outline',
      iconColor: '#0EA5E9',
      iconBg: '#E0F2FE',
      title: 'Credit',
      subtitle: 'Check your available credits and usage details.',
      onPress: () => (navigation as any).navigate('AddCredits'),
    },
    {
      icon: 'crown-outline',
      iconColor: '#7C3AED',
      iconBg: '#F3EEFF',
      title: 'Subscription',
      subtitle: 'Manage your active plans and renewals.',
      onPress: () => (navigation as any).navigate('SubscriptionScreen'),
    },
    {
      icon: 'headset',
      iconColor: '#D97706',
      iconBg: '#FFF6E8',
      title: 'Support',
      subtitle: 'Get help from our support team anytime.',
      onPress: () => (navigation as any).navigate('ChatSupportHome'),
    },
  ];

  const aboutItems: MenuItem[] = [
    {
      icon: 'shield-lock-outline',
      iconColor: '#2563EB',
      iconBg: '#EEF4FF',
      title: 'Privacy Policy',
      subtitle: 'Learn how we protect and use your data.',
      onPress: () => (navigation as any).navigate('WebView', {header: 'Privacy Policy'}),
    },
    {
      icon: 'file-document-outline',
      iconColor: '#0F766E',
      iconBg: '#ECFDF5',
      title: 'Terms & Conditions',
      subtitle: 'Understand the rules and guidelines of our platform.',
      onPress: () => (navigation as any).navigate('WebView', {header: 'Term & Condition'}),
    },
    {
      icon: 'cash-refund',
      iconColor: '#EA580C',
      iconBg: '#FFF7ED',
      title: 'Refund Policy',
      subtitle: 'Know how refunds work on our platform.',
      onPress: () => (navigation as any).navigate('WebView', {header: 'Refund Policy'}),
    },
    {
      icon: 'email-outline',
      iconColor: '#7C3AED',
      iconBg: '#F3EEFF',
      title: 'Contact Us',
      subtitle: 'Reach out for help or support anytime.',
      onPress: () => (navigation as any).navigate('WebView', {header: 'Contact Us'}),
    },
    {
      icon: 'help-circle-outline',
      iconColor: '#0284C7',
      iconBg: '#E0F2FE',
      title: 'FAQ',
      subtitle: 'Find quick answers to common questions.',
      onPress: () => (navigation as any).navigate('WebView', {header: 'FAQ'}),
    },
  ];

  const profileSource = selectedImage
    ? {uri: selectedImage}
    : vendorImage
      ? {uri: vendorImage}
      : Images.profileImage;

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
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your account</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          <TouchableOpacity
            style={styles.editIconBtn}
            onPress={() => (navigation as any).navigate('EditProfileScreen')}
            disabled={uploading}
            activeOpacity={0.8}>
            <MaterialCommunityIcons name="pencil-outline" size={wp(4.6)} color={Colors.sooprsblue} />
          </TouchableOpacity>

          <View style={styles.heroTopRow}>
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

            <View style={styles.heroInfo}>
              <Text style={styles.userName} numberOfLines={2}>
                {vendorName}
              </Text>
              <View style={styles.phoneRow}>
                <MaterialCommunityIcons name="phone-outline" size={wp(4.2)} color="#64748B" />
                <Text style={styles.phoneNumber}>{vendorMobile}</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <MaterialCommunityIcons name="check-decagram" size={wp(4.2)} color="#16A34A" />
                <Text style={styles.verifiedText}>Verified Partner</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <MaterialCommunityIcons name="account-cog-outline" size={wp(5.2)} color="#2563EB" />
            </View>
            <Text style={styles.sectionTitle}>Your Information</Text>
          </View>
          {informationItems.map((item, index) =>
            renderMenuItem(item, index === informationItems.length - 1),
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, {backgroundColor: '#ECFDF5'}]}>
              <MaterialCommunityIcons name="information-outline" size={wp(5.2)} color="#0F766E" />
            </View>
            <Text style={styles.sectionTitle}>About Sooprs</Text>
          </View>
          {aboutItems.map((item, index) =>
            renderMenuItem(item, index === aboutItems.length - 1),
          )}
        </View>

        <View style={styles.sectionCard}>
          {renderMenuItem(
            {
              icon: 'logout',
              iconColor: '#DC2626',
              iconBg: '#FEF2F2',
              title: 'Log out',
              subtitle: 'Sign out from this device',
              onPress: handleLogout,
              danger: true,
            },
            true,
          )}
        </View>

        <View style={styles.brandingContainer}>
          <Text style={styles.brandingText}>Sooprs</Text>
          <Text style={styles.versionText}>v4.131.3</Text>
        </View>
      </ScrollView>

      {loading && !vendorName ? (
        <View style={styles.fullLoader}>
          <ActivityIndicator size="large" color={Colors.sooprsblue} />
        </View>
      ) : null}
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    paddingBottom: hp(4),
  },
  heroCard: {
    backgroundColor: Colors.white,
    borderRadius: wp(4.5),
    padding: wp(4.4),
    paddingRight: wp(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
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
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: wp(3.6),
  },
  avatar: {
    width: wp(24),
    height: wp(24),
    borderRadius: wp(12),
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
  heroInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FSize.fs22,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: hp(3.2),
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.55),
    gap: wp(1.2),
  },
  phoneNumber: {
    fontSize: FSize.fs16,
    fontWeight: '600',
    color: '#475569',
  },
  verifiedBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.9),
    backgroundColor: '#ECFDF5',
    borderRadius: wp(5),
    paddingHorizontal: wp(2.6),
    paddingVertical: hp(0.45),
    gap: wp(1),
  },
  verifiedText: {
    fontSize: FSize.fs14,
    fontWeight: '700',
    color: '#16A34A',
  },
  editIconBtn: {
    position: 'absolute',
    top: wp(3.2),
    right: wp(3.2),
    width: wp(9.5),
    height: wp(9.5),
    borderRadius: wp(2.6),
    backgroundColor: '#EEF4FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: wp(4.5),
    paddingHorizontal: wp(3.6),
    paddingTop: hp(1.5),
    paddingBottom: hp(0.6),
    marginTop: hp(1.7),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(0.6),
    paddingHorizontal: wp(0.6),
  },
  sectionIcon: {
    width: wp(9.5),
    height: wp(9.5),
    borderRadius: wp(2.6),
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(2.4),
  },
  sectionTitle: {
    fontSize: FSize.fs18,
    fontWeight: '800',
    color: '#0F172A',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.55),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconWrap: {
    width: wp(11.5),
    height: wp(11.5),
    borderRadius: wp(3),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  menuTextWrap: {
    flex: 1,
    paddingRight: wp(2),
  },
  menuTitle: {
    fontSize: FSize.fs16,
    fontWeight: '800',
    color: '#0F172A',
  },
  menuTitleDanger: {
    color: '#DC2626',
  },
  menuSubtitle: {
    marginTop: hp(0.25),
    fontSize: FSize.fs14,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: hp(2.3),
  },
  brandingContainer: {
    alignItems: 'center',
    marginTop: hp(3.4),
    marginBottom: hp(1),
  },
  brandingText: {
    fontSize: FSize.fs28,
    fontWeight: '700',
    color: '#CBD5E1',
    letterSpacing: 0.4,
  },
  versionText: {
    fontSize: FSize.fs14,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: hp(0.3),
  },
  fullLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248,250,252,0.5)',
  },
});
