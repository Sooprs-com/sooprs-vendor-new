import React, {useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useDispatch} from 'react-redux';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import Images from '../../assets/image';
import Colors from '../../assets/commonCSS/Colors';
import {getDataFromAsyncStorage} from '../../services/CommonFunction';
import {mobile_siteConfig} from '../../services/mobile-siteConfig';
import {getDataWithToken} from '../../services/mobile-api';
import FSize from '../../assets/commonCSS/FSize';

interface SplashScreenProps {
  navigation: any;
}

const SplashScreen: React.FC<SplashScreenProps> = ({navigation}) => {
  const dispatch = useDispatch();

  const checkLoginStatus = useCallback(async () => {
    try {
      const isLogin = await getDataFromAsyncStorage(mobile_siteConfig.IS_LOGIN);
      const token = await getDataFromAsyncStorage(mobile_siteConfig.MOB_ACCESS_TOKEN_KEY);
      
      if (isLogin === 'TRUE' && token) {
        // Initialize user details in Redux store
        const email = await getDataFromAsyncStorage(mobile_siteConfig.EMAIL);
        const slug = await getDataFromAsyncStorage(mobile_siteConfig.SLUG);
        
        try {
          const res: any = await getDataWithToken({}, mobile_siteConfig.GET_USER_DETAILS);
          const data: any = await res.json();
          
          if (data?.success && data?.vendorDetail) {
            dispatch({
              type: 'SET_USER_DETAILS',
              payload: {
                email: data.vendorDetail.email || email || '',
                mobile: data.vendorDetail.mobile || '',
                name: data.vendorDetail.name || '',
                slug: data.vendorDetail.slug || slug || '',
                is_company: data.vendorDetail.is_company || '0',
              },
            });
          } else {
            // Fallback to AsyncStorage values
            dispatch({
              type: 'SET_USER_DETAILS',
              payload: {
                email: email || '',
                mobile: '',
                name: '',
                slug: slug || '',
                is_company: '0',
              },
            });
          }
        } catch (error) {
          console.log('Error fetching user details from API:', error);
          // Fallback to AsyncStorage values
          dispatch({
            type: 'SET_USER_DETAILS',
            payload: {
              email: email || '',
              mobile: '',
              name: '',
              slug: slug || '',
              is_company: '0',
            },
          });
        }
        
        // Navigate to Authentication stack with BottomTab as target
        navigation.replace('Authentication', {screen: 'BottomTab'});
      } else {
        // Navigate to Authentication stack with EnterMobileNumber as target
        navigation.replace('Authentication', {screen: 'EnterMobileNumber'});
      }
    } catch (error) {
      console.log('Error checking login status:', error);
      navigation.replace('Authentication', {screen: 'EnterMobileNumber'});
    }
  }, [dispatch, navigation]);

  useEffect(() => {
    // Navigate after 2-3 seconds
    const timer = setTimeout(() => {
      checkLoginStatus();
    }, 2500);

    return () => clearTimeout(timer);
  }, [checkLoginStatus]);

  return (
    <LinearGradient
      colors={['#92BFFF', '#FFFFFF']}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}>
      <StatusBar barStyle="dark-content" backgroundColor="#92BFFF" />
      
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image
              source={Images.splashLogo1}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          
        </View>

        {/* Tagline */}
        <Text style={styles.tagline}>India's Most Trusted Service Marketplace</Text>

        {/* Gradient Line */}
        <View style={styles.gradientLineContainer}>
          <LinearGradient
            colors={['#92BFFF00', '#92BFFFE0', '#92BFFFFF', '#7AA8E6', '#7AA8E6', '#92BFFFFF', '#92BFFFE0', '#92BFFF00']}
            locations={[0, 0.25, 0.35, 0.42, 0.58, 0.65, 0.75, 1]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.gradientLine}
          />
        </View>

        {/* App Name */}
        <Text style={styles.appName}>SOOPRS PARTNER APP</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(4),
    justifyContent: 'center',
  },
  logoCircle: {
    width: wp(70),
    height: hp(10),
    borderRadius: wp(9),
    // backgroundColor: '#DEE8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(2),
  },
  logoImage: {
    width: "100%",
    height:"100%",
  },
  textContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sooprsBanner: {
    backgroundColor: Colors.sooprsDark,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    borderRadius: hp(0.8),
    marginBottom: hp(0.3),
  },
  sooprsText: {
    fontSize: hp(4.5),
    fontWeight: 'bold',
    color: Colors.white,
    letterSpacing: wp(0.3),
  },
  partnerBanner: {
    backgroundColor: Colors.sooprsDark,
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(0.6),
    borderRadius: hp(0.6),
    alignSelf: 'flex-start',
    marginLeft: wp(1),
  },
  partnerText: {
    fontSize: hp(2.2),
    fontWeight: '600',
    color: Colors.white,
  },
  tagline: {
    fontSize: FSize.fs14,
    color: "#353535",
    // marginTop: hp(.5),
    fontWeight: '400',
    textAlign: 'center',
    paddingHorizontal: wp(10),
    marginBottom: hp(2),
  },
  gradientLineContainer: {
    width: '70%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: hp(2),
    height: hp(0.2),
  },
  gradientLine: {
    width: '100%',
    height: hp(0.2),
    borderRadius: hp(0.2),
  },
  appName: {
    fontSize: FSize.fs15,
    color: "#353535",
    marginTop: hp(2),
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: wp(0.5),
  },
});

export default SplashScreen;

