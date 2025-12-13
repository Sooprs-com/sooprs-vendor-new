import {
    ActivityIndicator,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
  } from 'react-native';
  import React, {useEffect, useState} from 'react';
  import LinearGradient from 'react-native-linear-gradient';
//   import {hp, wp} from '../assets/commonCSS/GlobalCSS';
//   import Colors from '../assets/commonCSS/Colors';
//   import FSize from '../assets/commonCSS/FSize';
//   import SubscriptionCard from './SubscriptionCard';
//   import {useSelector} from 'react-redux';
//   import {useSubscriptionApi} from './SubscriptionApis';
import Colors from '../../assets/commonCSS/Colors';
import { hp, wp } from '../../assets/commonCSS/GlobalCSS';
import FSize from '../../assets/commonCSS/FSize';
import SubscriptionCard from './SubscriptionCard';
import { useSubscriptionApi } from './SubscriptionApis';
//   import Toast from 'react-native-toast-message';
//   import NewHeader from '../components/NewHeader';
  
  const SubscriptionScreen = ({navigation}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [activeItem, setActiveItem] = useState(null);
  const [buttonLoader, setButtonLoader] = useState(false);
  const {createOrder, error, fetchPlans} = useSubscriptionApi();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
    useEffect(() => {
      const getplans = async () => {
        try {
          const data = await fetchPlans();
          console.log('Fetched plans data:', data);
          if (data && Array.isArray(data) && data.length > 0) {
            setPlans(data);
            setActiveItem(data[0]);
            console.log('Plans set successfully, count:', data.length);
          } else {
            console.warn('No plans found or empty array');
            setPlans([]);
            setActiveItem(null);
          }
        } catch (error) {
          console.error('Error in getplans:', error);
          setPlans([]);
          setActiveItem(null);
        } finally {
          setLoading(false);
        }
      };
      getplans();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const handlePayment = async () => {
      if (!activeItem) {
        return;
      }
      setButtonLoader(true);
      const calculateDiscount = (amount, benefit) => (amount * benefit) / 100;
      const amountAfterDiscount = (amount, discount) => amount - discount;
      const originalAmount =
        selectedTab === 0 ? activeItem?.month_price : activeItem?.year_price;
      const discountAmount = calculateDiscount(
        originalAmount,
        activeItem?.discount,
      );
      const finalAmount =
        amountAfterDiscount(originalAmount, discountAmount) * 100; 
      const planId = activeItem?.id;
      try {
        await createOrder(
          finalAmount,
          planId,
          amountAfterDiscount(originalAmount, discountAmount).toFixed(2),
        );
      } catch (error) {
        console.log('error', error);
        setLoading(false);
        setButtonLoader(false);
      } finally {
        setLoading(false);
        setButtonLoader(false);
      }
    };
    const GradientButton = () => {
      return (
        <LinearGradient
          colors={['#9747FF', '#0068FF']} // Gradient for glowing border
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.glowingBorder}>
          <TouchableOpacity
            onPress={handlePayment}
            style={{justifyContent: 'center', alignItems: 'center'}}
            disabled={buttonLoader}>
            {buttonLoader ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>Pay now</Text>
            )}
          </TouchableOpacity>
        </LinearGradient>
      );
    };
    const TopTab = ({item, index}) => {
      const gradientArray =
        selectedTab == index
          ? ['#9747FF', '#4446CC', '#000647']
          : ['#070A29', '#070A29'];
      return (
        <TouchableOpacity
          style={{marginHorizontal: 3}}
          onPress={() => setSelectedTab(index)}>
          <LinearGradient
            colors={gradientArray}
            start={{x: 0, y: 1}}
            end={{x: 1, y: 0}}
            style={styles.tabGradient}>
            <Text style={styles.tabText}>{item}</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    };
  
    if (loading)
      return (
        <ActivityIndicator
          color={Colors.sooprsDark}
          size={35}
          style={{marginTop: hp(10)}}
        />
      );
    return (
      <View style={styles.container}>
        {/* <StatusBar translucent backgroundColor={'transparent'} /> */}
        <LinearGradient
          colors={['#9747FF', '#4446CC', '#000647']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          locations={[0, 0.3, 1]}
          style={styles.gradient}>
          {/* Wrap Scrollable Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: hp(5)}} // Ensuring space at the bottom
          >
            <View style={styles.subcontainer}>
              <Text style={styles.subText}>Subscription Plans</Text>
              <Text style={styles.desText}>
                Fuel your professional journey with the perfect plan—unlock
                opportunities today!
              </Text>
            </View>
  
            {/* Tabs */}
            <View style={styles.tabContainer}>
              {['Monthly', 'Annually'].map((item, index) => (
                <TopTab key={index} item={item} index={index} />
              ))}
            </View>
  
            {/* Subscription Cards */}
            <SubscriptionCard
              data={plans}
              selectedTab={selectedTab}
              setActiveItem={setActiveItem}
            />
  
            {/* Privacy and Button Section */}
            <View style={styles.privacyView}>
              <Text style={{color: '#D9D9D999', textAlign: 'center'}}>
                By continuing you agree to our{' '}
                <Text style={styles.privacyText}>Terms of Use</Text> and
                acknowledge that you have read our{' '}
                <Text style={styles.privacyText}>Privacy Policy.</Text>
              </Text>
              <GradientButton />
              <Text
                onPress={() => navigation.goBack()}
                style={{
                  color: Colors.white,
                  textAlign: 'center',
                  textDecorationLine: 'underline',
                  fontWeight: '500',
                  fontSize: FSize.fs15,
                  marginTop: 10,
                }}>
                Skip
              </Text>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  };
  
  export default SubscriptionScreen;
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
      paddingTop:hp(5),
    },
    subcontainer: {width: wp(90), alignSelf: 'center'},
    subText: {
      color: Colors.white,
      fontSize: FSize.fs30,
      fontWeight: '500',
      textAlign: 'center',
      marginTop: hp(3),
    },
    desText: {color: Colors.white, textAlign: 'center', marginTop: 8},
    privacyText: {
      color: Colors.white,
      textDecorationLine: 'underline',
      fontSize: FSize.fs13,
    },
    privacyView: {
      width: wp(90),
      alignSelf: 'center',
      marginTop: hp(2),
      // position: 'absolute',
      // bottom: hp(4),
    },
    glowingBorder: {
      paddingVertical: 10,
      borderRadius: 10,
      // justifyContent: 'center',
      // alignItems: 'center',
      marginTop: hp(3),
    },
    buttonText: {
      color: Colors.white,
      fontWeight: 'bold',
      fontSize: 16,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: '#070A29',
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      padding: 8,
      borderRadius: 35,
      marginVertical: hp(2),
    },
    tabGradient: {
      paddingHorizontal: wp(6),
      paddingVertical: 10,
      borderRadius: 25,
    },
    tabText: {
      color: Colors.white,
      fontWeight: '500',
      fontSize: FSize.fs16,
    },
  });
  