import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import LinearGradient from 'react-native-linear-gradient';
import {useSelector} from 'react-redux';
import {hp, wp, GlobalCss} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import FSize from '../../assets/commonCSS/FSize';
import Images from '../../assets/image';
import {fFamily} from '../../assets/commonCSS/fFamily';

const ChatSupportHome = ({navigation}: {navigation: any}) => {
  const getUserDetails = useSelector((state: any) => state?.getUserDetails);
  const [userName, setUserName] = useState('');
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    if (getUserDetails) {
      setUserName(getUserDetails?.name || 'User');
      setProfileImage(getUserDetails?.image || null);
    }
  }, [getUserDetails]);

  // Support timings
  const callSupportTiming = '9:00 AM - 6:00 PM';
  const chatSupportTiming = '24/7 Available';
  const supportPhoneNumber = '+91 9289839496'; // You can change this

  const handleCallSupport = () => {
    Linking.openURL(`tel:${supportPhoneNumber}`).catch(err => {
      Alert.alert('Error', 'Unable to make a call. Please try again.');
      console.error('Error making call:', err);
    });
  };

  const handleChatSupport = () => {
    (navigation as any).navigate('ChatbotSupport');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.sooprsblue} />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#0077FF', '#3386DD', '#12B8F2']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Image 
            source={Images.backArrow} 
            style={[styles.backArrowIcon, {tintColor: Colors.white}]} 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={
                profileImage ? {uri: profileImage} : Images.defaultPicIcon
              }
              style={styles.profileImage}
              resizeMode="cover"
            />
            <View style={styles.profileImageBorder} />
          </View>
          <Text style={styles.userName}>{userName || 'User'}</Text>
          <Text style={styles.supportSubtitle}>How can we help you today?</Text>
        </View>

        {/* Call Support Card */}
        <TouchableOpacity
          style={styles.supportCard}
          onPress={handleCallSupport}
          activeOpacity={0.8}>
          <LinearGradient
            colors={['#FFFFFF', '#F8F9FF']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.cardGradient}>
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['#0077FF', '#3386DD']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.iconGradient}>
                  <Image
                    source={Images.phoneIcon}
                    style={styles.phoneIcon}
                    resizeMode="contain"
                  />
                </LinearGradient>
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>Call Support</Text>
                <View style={styles.timingContainer}>
                  <Image
                    source={Images.CalenderIcon}
                    style={styles.clockIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.timingText}>{callSupportTiming}</Text>
                </View>
              </View>
              <Image
                source={Images.chevronRight}
                style={styles.chevronIcon}
                resizeMode="contain"
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Chat Support Card */}
        <TouchableOpacity
          style={styles.supportCard}
          onPress={handleChatSupport}
          activeOpacity={0.8}>
          <LinearGradient
            colors={['#FFFFFF', '#F8F9FF']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.cardGradient}>
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['#12B8F2', '#3386DD']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.iconGradient}>
                  <Image
                    source={Images.chatIcon}
                    style={styles.chatIcon}
                    resizeMode="contain"
                  />
                </LinearGradient>
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>Chat Support</Text>
                <View style={styles.timingContainer}>
                  <Image
                    source={Images.CalenderIcon}
                    style={styles.clockIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.timingText}>{chatSupportTiming}</Text>
                </View>
              </View>
              <Image
                source={Images.chevronRight}
                style={styles.chevronIcon}
                resizeMode="contain"
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Additional Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Our support team is here to assist you with any questions or
            concerns you may have.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default ChatSupportHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingTop: hp(6),
    paddingBottom: hp(2),
    paddingHorizontal: wp(5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: wp(10),
    height: wp(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrowIcon: {
    width: wp(6),
    height: wp(6),
  },
  headerTitle: {
    fontSize: FSize.fs20,
    fontFamily: fFamily.ibmSemiBold,
    color: Colors.white,
  },
  placeholder: {
    width: wp(10),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(3),
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: hp(4),
    paddingHorizontal: wp(5),
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: hp(2),
  },
  profileImage: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(14),
    borderWidth: 4,
    borderColor: Colors.white,
  },
  profileImageBorder: {
    position: 'absolute',
    width: wp(32),
    height: wp(32),
    borderRadius: wp(16),
    borderWidth: 3,
    borderColor: Colors.sooprsblue,
    top: -wp(2),
    left: -wp(2),
    opacity: 0.3,
  },
  userName: {
    fontSize: FSize.fs22,
    fontFamily: fFamily.ibmSemiBold,
    color: Colors.black,
    marginBottom: hp(0.5),
  },
  supportSubtitle: {
    fontSize: FSize.fs14,
    fontFamily: fFamily.ibmRegular,
    color: Colors.gray,
  },
  supportCard: {
    marginHorizontal: wp(5),
    marginBottom: hp(2),
    borderRadius: hp(2),
    ...GlobalCss.shadowBox,
    elevation: 4,
  },
  cardGradient: {
    borderRadius: hp(2),
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(5),
  },
  iconContainer: {
    marginRight: wp(4),
  },
  iconGradient: {
    width: wp(14),
    height: wp(14),
    borderRadius: wp(7),
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneIcon: {
    width: wp(6),
    height: wp(6),
    tintColor: Colors.white,
  },
  chatIcon: {
    width: wp(6),
    height: wp(6),
    tintColor: Colors.white,
  },
  clockIcon: {
    width: wp(4),
    height: wp(4),
    tintColor: Colors.gray,
  },
  chevronIcon: {
    width: wp(5),
    height: wp(5),
    tintColor: Colors.gray,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: FSize.fs18,
    fontFamily: fFamily.ibmSemiBold,
    color: Colors.black,
    marginBottom: hp(1),
  },
  timingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timingText: {
    fontSize: FSize.fs13,
    fontFamily: fFamily.ibmRegular,
    color: Colors.gray,
    marginLeft: wp(2),
  },
  infoContainer: {
    marginHorizontal: wp(5),
    marginTop: hp(2),
    padding: wp(4),
    backgroundColor: Colors.lightgrey1,
    borderRadius: hp(1.5),
  },
  infoText: {
    fontSize: FSize.fs13,
    fontFamily: fFamily.ibmRegular,
    color: Colors.gray,
    lineHeight: hp(2.5),
    textAlign: 'center',
  },
});

