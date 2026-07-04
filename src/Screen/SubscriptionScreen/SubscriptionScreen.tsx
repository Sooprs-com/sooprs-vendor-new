import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Modal,
    Image,
  } from 'react-native';
  import React, {useEffect, useState} from 'react';
  import LinearGradient from 'react-native-linear-gradient';
import Colors from '../../assets/commonCSS/Colors';
import { hp, wp } from '../../assets/commonCSS/GlobalCSS';
import FSize from '../../assets/commonCSS/FSize';
import { useSubscriptionApi } from './SubscriptionApis';
import { fFamily } from '../../assets/commonCSS/fFamily';
import Images from '../../assets/image';
import { getDataWithToken } from '../../services/mobile-api';
import { mobile_siteConfig } from '../../services/mobile-siteConfig';
  
  const SubscriptionScreen = ({navigation}: any) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [activeItem, setActiveItem] = useState<any>(null);
  const [buttonLoader, setButtonLoader] = useState(false);
  const {createOrder, error, fetchPlans} = useSubscriptionApi();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  
  // New state variables for user details and current plan
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [userName, setUserName] = useState<string>('User');

  const getUserDetails = async () => {
    try {
      setLoadingUserDetails(true);
      const res: any = await getDataWithToken({}, mobile_siteConfig.GET_USER_DETAILS);
      const data: any = await res.json();
      console.log('User details data:::::', data);
      console.log('User membership data:::::', data?.membership?.plan?.plan_name);
      // console.log('User membership data:::::123', data?.membership?.plan?.plan_name==="Standard" ? Images.standardPlanIcon :userData?.membership?.plan?.plan_name==="Elite" ? Images.ElitePlanIcon : Images.starIcon);

      setUserData(data);
      // Check if profile is completed
      if (data?.success && data?.vendorDetail) {
        const isProfileCompleted = data.vendorDetail.is_profile_completed;
        
        // Set stats data
        if (data.stats) {
          setStatus(data.stats);
        }
        
        // Update user name from API response
       
        
        // Set profile image from API response
        if (data.vendorDetail.image) {
          setProfileImage(data.vendorDetail.image);
        }
        
        // Get category_id from vendor profile
        if (data.vendorDetail.category_id) {
          setCategoryId(String(data.vendorDetail.category_id));
        }
        
        // If profile is not completed (0), replace with HomeVerification screen
        if (isProfileCompleted === 0) {
          (navigation as any).replace('HomeVerification');
        }
        // If profile is completed (1), stay on Home screen (already here)
      }
    } catch (err: any) {
      console.log('Error fetching user details:::::', err);
      setUserName('User');
    } finally {
      setLoadingUserDetails(false);
    }
  };



    useEffect(() => {
      const initializeScreen = async () => {
        try {
          // Fetch both plans and user details in parallel
          const [plansData] = await Promise.all([
            fetchPlans(),
            getUserDetails()
          ]);
          
          console.log('Fetched plans data:', plansData);
          if (plansData && Array.isArray(plansData) && plansData.length > 0) {
            setPlans(plansData);
            setActiveItem(plansData[0]);
            console.log('Plans set successfully, count:', plansData.length);
          } else {
            console.warn('No plans found or empty array');
            setPlans([]);
            setActiveItem(null);
          }
        } catch (error) {
          console.error('Error in initialization:', error);
          setPlans([]);
          setActiveItem(null);
        } finally {
          setLoading(false);
        }
      };
      
      initializeScreen();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const handlePayment = async () => {
      if (!activeItem) {
        return;
      }
      setButtonLoader(true);
      const calculateDiscount = (amount: any, benefit: any) => (amount * benefit) / 100;
      const amountAfterDiscount = (amount: any, discount: any) => amount - discount;
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
          colors={['#9747FF', '#0068FF']}
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
    
    const PlanCard = ({plan}: any) => {
      const price = selectedTab === 0 ? plan?.month_price : plan?.year_price;
      const tags = plan?.description ?? [];
      
      return (
        <View style={styles.planCardContainer}>

          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: wp(1)}}>
          <Image source={Images.MultiStart} style={{width: hp(2.5), height: hp(2.5),marginTop: hp(1)}} />
          <Text style={{color: 'white', 
            fontWeight: '600', 
            fontSize: FSize.fs13,
            textAlign: 'center',
            marginTop: hp(1),
            }}>MOST POPULAR</Text>
            </View>
          <View style={styles.planCard}>
            <Text style={styles.planTitle}>{plan?.plan_name} PLAN</Text>
            
            {plan?.plan_description && (
              <Text style={styles.planDescription}>{plan?.plan_description}</Text>
            )}
            
            <Text style={styles.planPrice}>₹{price}/{selectedTab === 0 ? 'Monthly' : 'Annually'}</Text>
            
            {/* Crown Icon with Dividers */}
            <View style={styles.crownDividerContainer}>
              <View style={styles.dividerLine} />
              <View style={styles.crownIconCenter}>
                <Text style={{fontSize: 28}}>👑</Text>
              </View>
              <View style={styles.dividerLine} />
            </View>
            
            {/* Features List */}
            <View style={styles.featuresList}>
              {tags.map((tag: any, index: any) => (
                <View key={index} style={styles.featureItem}>
                  <Text style={styles.checkmark}>✓</Text>
                  <Text style={styles.featureText}>{tag}</Text>
                </View>
              ))}
            </View>
            
            {/* Subscribe Button */}
            <TouchableOpacity 
              style={styles.subscribeButton}
              onPress={handlePayment}>
              <Text style={styles.subscribeButtonText}>
                Subscribe to {plan?.plan_name.toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    };
    
    const SmallPlanCard = ({plan, onViewDetails,color,backgroundColor,topColor,mrpColor,DetailsColor}: any) => {
      const price = selectedTab === 0 ? plan?.month_price : plan?.year_price;
      
      return (
        <View style={styles.smallPlanCardContainer}>
          <View style={[styles.smallPlanCard, {backgroundColor:backgroundColor}]}>
           <LinearGradient 
           colors={color}
            start={{x: 0, y: 0}} 
            end={{x: 1, y: 1}} 
            style={{alignItems: 'center',
             backgroundColor:color,
             justifyContent: 'center',
             paddingVertical: hp(.5),
             width: '100%',
             borderRadius:hp(4),
             }}>
            <Text style={[styles.smallPlanTitle, {color:topColor}]}>{plan?.plan_name}</Text>
            </LinearGradient>
            <Text style={[styles.smallPlanPrice, {color:mrpColor}]}>₹{price}<Text style={{color:"rgba(138, 138, 138, 1)", fontSize: FSize.fs12, fontWeight: '400'}}>/{selectedTab === 0 ? 'month' : 'year'}</Text></Text>
            <TouchableOpacity 
              style={styles.viewDetailsButton}
              onPress={onViewDetails}>
              <Text style={[styles.viewDetailsButtonText, {color:DetailsColor}]} numberOfLines={1}>View Details </Text>
              <Image source={Images.chevronRight} style={{width:hp(1.5), height: hp(1.5), tintColor: DetailsColor}} />
            </TouchableOpacity>
          </View>
        </View>
      );
    };
    
    const PlanDetailModal = ({plan, visible, onClose}: any) => {
      const price = selectedTab === 0 ? plan?.month_price : plan?.year_price;
      const tags = plan?.description ?? [];
      
      return (
        <Modal
          visible={visible}
          transparent={true}
          animationType="fade"
          onRequestClose={onClose}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Close Button */}
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={onClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>{plan?.plan_name}</Text>
                
                {plan?.plan_description && (
                  <Text style={styles.modalDescription}>{plan?.plan_description}</Text>
                )}
                
                <Text style={styles.modalPrice}>₹{price}/{selectedTab === 0 ? 'Monthly' : 'Annually'}</Text>
                
                {/* Crown Icon with Dividers */}
                <View style={styles.crownDividerContainer}>
                  <View style={styles.dividerLine} />
                  <View style={styles.crownIconCenter}>
                    <Text style={{fontSize: 28}}>👑</Text>
                  </View>
                  <View style={styles.dividerLine} />
                </View>
                
                {/* Features List */}
                <View style={styles.featuresList}>
                  {tags.map((tag: any, index: any) => (
                    <View key={index} style={styles.featureItem}>
                      <Text style={styles.checkmark}>✓</Text>
                      <Text style={styles.featureText}>{tag}</Text>
                    </View>
                  ))}
                </View>
                
                {/* Subscribe Button */}
                <TouchableOpacity 
                  style={styles.subscribeButton}
                  onPress={handlePayment}>
                  <Text style={styles.subscribeButtonText}>
                    Subscribe to {plan?.plan_name.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
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
      <View style={{flex: 1}}>
      <LinearGradient
        colors={['#FFFFFF', '#D4E4FF']}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.gradientContainer}>
        <View style={styles.container}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
          
          {/* Header Pill */}
          <View style={styles.headerPill}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Image source={Images.backArrow} style={{width: 24, height: 24}} />
            </TouchableOpacity>
            <Text style={styles.headerPillText}>Subscription Plans</Text>
          </View>

          {/* Current Plan Section */}
          {loadingUserDetails ? (
            <View style={{
              padding: wp(4),
              borderRadius: hp(2),
              marginHorizontal: wp(2),
              backgroundColor: 'rgba(37, 98, 234, 0.1)',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: hp(8)
            }}>
              <ActivityIndicator color={Colors.sooprsDark} size="small" />
            </View>
          ) : (
            <LinearGradient 
              colors={['rgba(37, 98, 234, 1)', 'rgba(29, 78, 216, 1)']} 
              start={{x: 0, y: 0}} end={{x: 1, y: 1}}
              style={{
                padding: wp(4),
                borderRadius: hp(2), 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginHorizontal: wp(2),
              }}
            >
              <View>
                <Text style={{color: Colors.white, fontSize: FSize.fs13, fontWeight: '400'}}>CURRENT PLAN</Text>
                <View style={{flexDirection: 'row', alignItems: 'baseline', marginVertical: hp(0.5)}}>
                  <Text style={{color: Colors.white, fontSize: FSize.fs16, fontWeight: '700'}}>
                    {userData?.membership?.plan?.plan_name ? `${userData.membership.plan.plan_name} Plan` : 'No Active Plan'}
                  </Text>
                  {userData?.membership?.plan?.amount && userData?.membership?.plan?.plan_name ? (
                    <>
                      <Text style={{color: Colors.white, fontSize: FSize.fs14, fontWeight: '400', marginHorizontal: wp(1)}}>
                        /
                      </Text>
                      <Text style={{color: Colors.white, fontSize: FSize.fs12, fontWeight: '500'}}>
                        ₹{userData.membership.plan.amount}
                      </Text>
                    </>
                  ) : null}
                </View>
                <Text style={{color: Colors.white, fontSize: FSize.fs12, fontWeight: '400'}}>
                  {userData?.membership?.plan?.end_date ? 
                    `Renews on ${new Date(userData.membership.plan.end_date).toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}` : 
                    userData?.membership?.plan?.plan_name ? 'Active Subscription' : 'Subscribe to get started'
                  }
                </Text>
              </View>
        
              <View style={{
                backgroundColor: 'rgba(75, 115, 225, 1)',
                padding: wp(2),
                borderRadius: hp(2),
              }}>
                {userData?.membership?.plan?.plan_name === "STANDARD" ? (
                  <Image source={Images.standardPlanIcon} style={{width: hp(3.5), height: hp(3.5)}} />
                ) : userData?.membership?.plan?.plan_name === "ELITE" ? (
                  <Image source={Images.ElitePlanIcon} style={{width: hp(3.5), height: hp(3.5)}} />
                ) : (
                  <Text style={{fontSize: 28}}>👑</Text>
                )}
              </View>
            </LinearGradient>
          )}

          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tabButton, selectedTab === 0 && styles.tabButtonActive]}
              onPress={() => setSelectedTab(0)}>
              <Text style={[styles.tabButtonText, selectedTab === 0 && styles.tabButtonTextActive]}>Monthly</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, selectedTab === 1 && styles.tabButtonActive]}
              onPress={() => setSelectedTab(1)}>
              <Text style={[styles.tabButtonText, selectedTab === 1 && styles.tabButtonTextActive]}>Annually</Text>
            </TouchableOpacity>
          </View>
          
          {/* Plan Cards */}
          <View style={styles.plansContent}>
            {/* First Plan - Full Display */}
            {plans.length > 0 && (
              <PlanCard plan={plans[0]} />
            )}
            
            {/* Remaining Plans - Small Boxes */}
            {plans.length > 1 && (
              <>
                <Text style={styles.otherPlansTitle}>Other Plans</Text>
                <View style={styles.smallPlansGrid}>
                  {plans.slice(1,2).map((plan, index) => 
                  {
                    console.log('plan data', plan);
                  return (
                    <SmallPlanCard
                    topColor={'rgba(0, 0, 0, 1)'}
                    mrpColor={'rgba(0, 0, 0, 1)'}
                    DetailsColor={'rgba(78, 78, 78, 1))'}
                    color={['rgba(219, 234, 254, 1)', 'rgba(219, 234, 254, 1)']}
                    backgroundColor={'white'}
                      key={plan.id || index}
                      plan={plan}
                      onViewDetails={() => {
                        setSelectedPlan(plan);
                        setModalVisible(true);
                      }}
                    />
                  )})}

              {plans.slice(2,3).map((plan, index) => 
                  {
                    console.log('plan data', plan);
                  return (
                    <SmallPlanCard
                    topColor={'rgba(255, 255, 255, 1)'}
                    mrpColor={'rgba(255, 255, 255, 1)'}
                    DetailsColor={'rgba(236, 236, 236, 1)'}
                    color={['rgba(244, 196, 19, 1)', 'rgba(209, 147, 7, 1)']}
                    backgroundColor={'black'}
                      key={plan.id || index}
                      plan={plan}
                      onViewDetails={() => {
                        setSelectedPlan(plan);
                        setModalVisible(true);
                      }}
                    />
                  )})}
                </View>
              </>
            )}
          </View>
        </ScrollView>
        </View>
      </LinearGradient>
      
      {/* Modal for Plan Details */}
      {selectedPlan && (
        <PlanDetailModal
          plan={selectedPlan}
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
        />
      )}
      </View>
    );
  };
  
  export default SubscriptionScreen;
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    scrollContent: {
      paddingHorizontal: wp(4),
      paddingTop: hp(5),
      paddingBottom: hp(5),
    },
    headerPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(2),
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.8),
      borderRadius: 25,
      marginBottom: hp(2),
      // borderWidth: 1.5,
      // borderColor: '#636EFA',
    },
    headerPillText: {
      color: 'black',
      fontSize: FSize.fs18,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    mainTitle: {
      color: '#0F0F1E',
      fontSize: FSize.fs28,
      fontWeight: '900',
      textAlign: 'center',
      marginBottom: hp(2),
      lineHeight: 39,
      letterSpacing: -0.6,
    },
    tabsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: hp(2.3),
      gap: wp(2),
      marginBottom: hp(2),
      backgroundColor: 'white',
      paddingHorizontal: wp(2),
      paddingVertical: hp(1),
      borderRadius: 30,
      alignSelf: 'center',
      borderWidth: 1,
      borderColor: 'rgba(99, 110, 250, 0.15)',
    },
    tabButton: {
      paddingHorizontal: wp(7),
      paddingVertical: hp(1),
      borderRadius: 25,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    tabButtonActive: {
      backgroundColor: 'rgba(36, 97, 233, 1)',
      borderColor: 'rgba(36, 97, 233, 1)',
    },
    tabButtonText: {
      color: '#5A5A7A',
      fontSize: FSize.fs14,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    tabButtonTextActive: {
      color: Colors.white,
      fontWeight: '800',
      letterSpacing: 0.2,
    },
    plansContent: {
      marginTop: hp(0.5),
    },
    planCardContainer: {
      marginBottom: hp(1.5),
      // paddingTop:hp(1),
      backgroundColor:'rgba(36, 97, 233, 1)',
      borderRadius:28,
    },
    planCard: {
      backgroundColor: Colors.white,
      borderRadius: 28,
      marginTop: hp(.5),
      paddingHorizontal: wp(5),
      paddingVertical: hp(2),
      borderWidth: 1,
      borderColor: 'rgba(36, 97, 233, 1)',
      shadowColor: 'rgba(36, 97, 233, 1)',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 10,
      maxHeight: hp(40),
    },
    planTitle: {
      color: '#0F0F1E',
      fontSize: FSize.fs18,
      fontWeight: '900',
      textAlign: 'center',
      marginBottom: hp(0.3),
      letterSpacing: -0.3,
    },
    planDescription: {
      color: '#7A7A8E',
      fontSize: FSize.fs10,
      textAlign: 'center',
      marginBottom: hp(0.6),
      fontStyle: 'italic',
      lineHeight: 13,
      fontWeight: '500',
    },
    planPrice: {
      color: 'rgba(36, 97, 233, 1)',
      fontSize: FSize.fs20,
      fontWeight: '900',
      textAlign: 'center',
      marginBottom: hp(1),
      letterSpacing: 0.3,
    },
    crownDividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: hp(1.2),
      justifyContent: 'center',
    },
    dividerLine: {
      flex: 1,
      height: 1.5,
      backgroundColor: '#E8C547',
    },
    crownIconCenter: {
      marginHorizontal: wp(3),
      backgroundColor: '#FFF9E6',
      width: 42,
      height: 42,
      borderRadius: 21,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#E8C547',
    },
    featuresList: {
      marginVertical: hp(0.9),
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: hp(0.4),
    },
    checkmark: {
      color: 'rgba(36, 97, 233, 1)',
      fontSize: FSize.fs14,
      marginRight: wp(2),
      fontWeight: '900',
    },
    featureText: {
      color: '#3A3A4E',
      fontSize: FSize.fs14,
      flex: 1,
      fontWeight: '500',
      lineHeight: 14,
    },
    subscribeButton: {
      backgroundColor: 'rgba(36, 97, 233, 1)',
      paddingVertical: hp(1.4),
      borderRadius: 14,
      alignItems: 'center',
      marginTop: hp(0.8),
      shadowColor: 'rgba(36, 97, 233, 1)',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 6,
      borderWidth: 0,
    },
    subscribeButtonText: {
      color: Colors.white,
      fontWeight: '900',
      fontSize: FSize.fs13,
      letterSpacing: 0.4,
    },
    otherPlansTitle: {
      color: '#0F0F1E',
      fontSize: FSize.fs16,
      fontWeight: '900',
      marginTop: hp(0.8),
      marginBottom: hp(1.5),
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    smallPlansGrid: {
      flexDirection: 'row',
      gap: wp(1.5),
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginTop: hp(0.5),
    },
    smallPlanCardContainer: {
      width: '47%',
      marginBottom: hp(1.2),
    },
    smallPlanCard: {
      backgroundColor: Colors.white,
      borderRadius: 20,
      paddingVertical: hp(1),
      paddingHorizontal: wp(2),
      // padding: wp(4.5),
      borderWidth: 1,
      borderColor: Colors.lightgrey2,
      // shadowColor: 'rgba(36, 97, 233, 1)',
      // shadowOffset: { width: 0, height: 8 },
      // shadowOpacity: 0.14,
      // shadowRadius: 12,
      // elevation: 6,
      alignItems: 'center',
    },
    smallPlanTitle: {
      color: '#0F0F1E',
      fontSize: FSize.fs16,
      fontWeight: '900',
      // marginBottom: hp(0.8),
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    smallPlanPrice: {
      color: 'rgba(36, 97, 233, 1)',
      marginTop: hp(1),
      fontSize: FSize.fs18,
      fontWeight: '900',
      marginBottom: hp(1.2),
      letterSpacing: 0.2,
    },
    viewDetailsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: wp(1),
      // backgroundColor: '#1A1A2E',
      paddingVertical: hp(1.3),
      paddingHorizontal: wp(4),
      borderRadius: 14,
      // alignItems: 'center',
      // justifyContent: 'center',
      borderWidth: 0,
      // shadowColor: '#000',
      // shadowOffset: { width: 0, height: 6 },
      // shadowOpacity: 0.25,
      // shadowRadius: 10,
      // elevation: 6,
    },
    viewDetailsButtonText: {
      color: "rgba(78, 78, 78, 1)",
      fontWeight: '900',
      fontSize: FSize.fs13,
      letterSpacing: 0.4,
      flexWrap: 'nowrap',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: Colors.white,
      borderRadius: 28,
      paddingTop: hp(2),
      paddingBottom: hp(3),
      paddingHorizontal: wp(4),
      maxHeight: hp(80),
      width: wp(90),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 15 },
      shadowOpacity: 0.4,
      shadowRadius: 25,
      elevation: 20,
    },
    closeButton: {
      alignSelf: 'flex-end',
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: hp(1.5),
      marginRight: wp(1),
      backgroundColor: 'rgba(99, 110, 250, 0.12)',
      borderRadius: 20,
    },
    closeButtonText: {
      fontSize: FSize.fs24,
      color: 'rgba(36, 97, 233, 1)',
      fontWeight: 'bold',
    },
    modalTitle: {
      color: '#0F0F1E',
      fontSize: FSize.fs20,
      fontWeight: '900',
      textAlign: 'center',
      marginBottom: hp(0.5),
      letterSpacing: -0.3,
    },
    modalDescription: {
      color: '#7A7A8E',
      fontSize: FSize.fs11,
      textAlign: 'center',
      marginBottom: hp(1),
      fontStyle: 'italic',
      lineHeight: 15,
      fontWeight: '500',
    },
    modalPrice: {
      color: 'rgba(36, 97, 233, 1)',
      fontSize: FSize.fs22,
      fontWeight: '900',
      textAlign: 'center',
      marginBottom: hp(1.5),
      letterSpacing: 0.3,
    },
    glowingBorder: {
      paddingVertical: 10,
      borderRadius: 14,
      marginTop: hp(1.5),
      overflow: 'hidden',
      shadowColor: 'rgba(36, 97, 233, 1)',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
    },
    buttonText: {
      color: Colors.white,
      fontWeight: '900',
      fontSize: FSize.fs15,
      letterSpacing: 0.4,
    },
    gradientContainer: {
      flex: 1,
    },
  });
  