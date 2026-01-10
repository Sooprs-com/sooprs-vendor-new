import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useIsFocused} from '@react-navigation/native';
import {hp, wp} from '../assets/commonCSS/GlobalCSS';
import Colors from '../assets/commonCSS/Colors';
import FSize from '../assets/commonCSS/FSize';
import Images from '../assets/image';
import {mobile_siteConfig} from '../services/mobile-siteConfig';
import {getDataWithToken} from '../services/mobile-api';
import {fFamily} from '../assets/commonCSS/fFamily';

type MenuItem = {
  id: string;
  title: string;
  icon: any;
  onPress: () => void;
};

type Section = {
  title: string;
  items: MenuItem[];
};

const DrawerMenuScreen = ({navigation}: {navigation: any}) => {
  const [userName, setUserName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    // Jab drawer focus me aaye tab latest user details fetch karo
    const fetchUserDetails = async () => {
      try {
        const res: any = await getDataWithToken({}, mobile_siteConfig.GET_USER_DETAILS);
        const data: any = await res.json();
        console.log('all-user-details res::::', data);

        if (data?.success && data?.vendorDetail) {
          const user = data.vendorDetail;
          console.log("user:::: Data", user);
          setUserName(user?.name || '');
          setPhoneNumber(
            user?.mobile ||
              user?.phone ||
              user?.phone_number ||
              '',
          );
          setProfileImage(user?.image || null);
        }
      } catch (e) {
        console.log('Error fetching user details for drawer:', e);
      }
    };

    if (isFocused) {
      fetchUserDetails();
    }
  }, [isFocused]);

  const sections: Section[] = [
    {
      title: 'Personal Information',
      items: [
        {
          id: '1',
          title: 'Profile',
          icon: Images.accountIcon,
          onPress: () => {
            navigation.closeDrawer();
            navigation.navigate('VendorHomeScreen', {
              screen: 'ProfileScreen',
            });
          },
        },
        {
          id: '2',
          title: 'Packages',
          icon: Images.phoneIcon1,
          onPress: () => {
            navigation.closeDrawer();
            navigation.navigate('VendorHomeScreen', {
              screen: 'PackagesScreen',
            });
          },
        },
        {
          id: '3',
          title: 'Booking',
          icon: Images.chat,
          onPress: () => {
            navigation.closeDrawer();
            navigation.navigate('VendorHomeScreen', {
              screen: 'BookingsScreen',
            });
          },
        },
        {
          id: '4',
          title: 'Credit',
          icon: Images.creditIcon,
          onPress: () => {
            navigation.closeDrawer();
            navigation.navigate('VendorHomeScreen', {
              screen: 'AddCredits',
            });
          },
        },
        // {
        //   id: '2',
        //   title: 'Subscription',
        //   icon: Images.locationIcon,
        //   onPress: () => {
        //     navigation.closeDrawer();
        //     navigation.navigate('VendorHomeScreen', {
        //       screen: 'SubscriptionScreen',
        //     });
        //   },
        // },
      ],
    },
    {
      title: 'Payment Method',
      items: [
        {
          id: '6',
          title: 'Bank Details',
          icon: Images.bankDetailsIcon,
          onPress: () => {
            navigation.closeDrawer();
            navigation.navigate('VendorHomeScreen', {
              screen: 'PaymentMethodScreen',
            });
          },
        },
      ],
    },
    {
      title: 'Legal',
      items: [
        // {
        //   id: '9',
        //   title: 'About Sooprs',
        //   icon: Images.aboutSooprsIcon,
        //   onPress: () => {
        //     navigation.closeDrawer();
        //     // Navigate to WebView screen
        //     navigation.navigate('VendorHomeScreen', {
        //       screen: 'WebView',
        //       params: {
        //         header: 'About Sooprs',
        //       },
        //     });
        //   },
        // },
        {
          id: '10',
          title: 'Terms & Conditions',
          icon: Images.drawerTerms,
          onPress: () => {
            navigation.closeDrawer();
            // Navigate to WebView screen
            navigation.navigate('VendorHomeScreen', {
              screen: 'WebView',
              params: {
                header: 'Term & Condition',
              },
            });
          },
        },
        {
          id: '11',
          title: 'Privacy Policy',
          icon: Images.drawerPrivacy,
          onPress: () => {
            navigation.closeDrawer();
            // Navigate to WebView screen
            navigation.navigate('VendorHomeScreen', {
              screen: 'WebView',
              params: {
                header: 'Privacy Policy',
              },
            });
          },
        },
        {
          id: '12',
          title: 'Refund Policy',
          icon: Images.shieldIcon,
          onPress: () => {
            navigation.closeDrawer();
            // Navigate to WebView screen
            navigation.navigate('VendorHomeScreen', {
              screen: 'WebView',
              params: {
                header: 'Refund Policy',
              },
            });
          },
        },
      ],
    },
  ];

  const ActionButton = ({
    image,
    title,
    badge,
    onPress,
  }: {
    image: any;
    title: string;
    badge?: number;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <View style={styles.actionButtonIconContainer}>
        <Image source={image} style={styles.actionButtonImage} resizeMode="contain" tintColor={Colors.sooprsblue} />
        {badge && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.actionButtonTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.sooprsblue} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Profile Header with Blue Background */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#3386DD', '#12B8F2']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.headerSection}>
            <View style={styles.profileHeader}>
              <View style={styles.profileImageContainer}>
                <Image
                  source={profileImage ? {uri: profileImage} : Images.defaultPicIcon}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{userName || 'User Name'}</Text>
                <Text style={styles.profilePhone}>{phoneNumber || 'Phone Number'}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <ActionButton
            image={Images.locationIcon}
            title="Subscription"
           onPress={() => {
              navigation.closeDrawer();
              navigation.navigate('VendorHomeScreen', {
                screen: 'SubscriptionScreen',
              });
            }}
            
            // onPress={() => {
            //   navigation.closeDrawer();
            //   navigation.navigate('VendorHomeScreen', {
            //     screen: 'ProfileScreen',
            //   });
            // }}

          />
          <ActionButton
            image={Images.supportUser}
            title="Support"
            onPress={() => {
              navigation.closeDrawer();
              navigation.navigate('VendorHomeScreen', {
                screen: 'ChatSupportHome',
              });
            }}
          />
          <ActionButton
            image={Images.notificationIcon}
            title="Notifications"
            onPress={() => {
              navigation.closeDrawer();
              navigation.navigate('VendorHomeScreen', {
                screen: 'NotificationScreen',
              });
            }}
          />
        </View>

        {/* Sections */}
        {sections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={item.onPress}>
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconContainer}>
                    {item.icon ? (
                      <Image
                        source={item.icon}
                        style={styles.menuIconImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.placeholderIcon} />
                    )}
                  </View>
                  <Text style={styles.menuItemText}>{item.title}</Text>
                </View>
                <Image
                  source={Images.chevronRight}
                  style={styles.chevronIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Bottom Branding */}
        <View style={styles.brandingContainer}>
          <Text style={styles.brandingText}>Sooprs</Text>
          <Text style={styles.versionText}>v4.131.3</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default DrawerMenuScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(2),
  },
  headerContainer: {
    paddingTop: hp(6),
    paddingBottom: hp(1.5),
    paddingHorizontal: wp(4),
  },
  headerSection: {
    width: '100%',
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    borderRadius: wp(4),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 7,
    elevation: 6,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    width: wp(12),
    height: hp(5.5),
    borderRadius: wp(8),
    borderWidth: 2,
    borderColor: Colors.white,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileInfo: {
    marginLeft: wp(3),
    flex: 1,
  },
  profileName: {
    fontSize: FSize.fs17,
    fontFamily: fFamily.ibmBold,
    color: Colors.white,
    marginBottom: hp(0.1),
  },
  profilePhone: {
    fontSize: FSize.fs15,
    fontFamily: fFamily.ibmRegular,
    color: Colors.white,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(3.8),
    gap: wp(1),
    marginBottom: hp(1.5),
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: wp(3),
    paddingVertical: hp(2),
    paddingHorizontal: wp(2),
    alignItems: 'center',
    marginHorizontal: wp(1),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonIconContainer: {
    position: 'relative',
    marginBottom: hp(1),
  },
  actionButtonImage: {
    width: wp(8),
    height: wp(8),
  },
  badge: {
    position: 'absolute',
    top: -wp(1),
    right: -wp(1),
    backgroundColor: Colors.black,
    borderRadius: wp(3),
    minWidth: wp(5),
    height: wp(5),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(1),
  },
  badgeText: {
    color: Colors.white,
    fontSize: FSize.fs10,
    fontWeight: '700',
  },
  actionButtonTitle: {
    fontSize: FSize.fs13,
    color: Colors.black,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: wp(3),
    padding: wp(3),
    marginHorizontal: wp(4),
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: '#f4f4f4',
  },
  sectionTitle: {
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: Colors.black,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1),
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: wp(7),
    height: wp(7),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  menuIconImage: {
    width: '80%',
    height: '80%',
    tintColor: '#7C7C7C',
  },
  placeholderIcon: {
    width: wp(7),
    height: wp(7),
    backgroundColor: '#7C7C7C',
    borderRadius: wp(3.5),
  },
  chevronIcon: {
    width: wp(5),
    height: wp(5),
    tintColor: Colors.sooprsblue,
  },
  menuItemText: {
    fontSize: FSize.fs17,
    color: Colors.black,
    fontWeight: '400',
    flex: 1,
  },
  brandingContainer: {
    alignItems: 'center',
    marginTop: hp(20),
    marginBottom: hp(2),
    paddingHorizontal: wp(4),
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
