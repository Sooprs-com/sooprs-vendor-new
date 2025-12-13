import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    LogBox,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
  } from 'react-native';
  import React, {useEffect, useState} from 'react';
//   import Colors from '../assets/commonCSS/Colors';
//   import {hp, wp} from '../assets/commonCSS/GlobalCSS';
//   import FSize from '../assets/commonCSS/FSize';
//   import Images from '../assets/image';
//   import ButtonNew from './ButtonNew';
//   import CInput from './CInput';
  import RazorpayCheckout from 'react-native-razorpay';
  import {useIsFocused} from '@react-navigation/native';
  import AsyncStorage from '@react-native-async-storage/async-storage';
//   import {mobile_siteConfig} from '../services/mobile-siteConfig';
  import {useWindowDimensions} from 'react-native';
  import {TabView, SceneMap} from 'react-native-tab-view';
//   import {postDataWithToken1} from '../services/mobile-api';
//   import {getDataFromAsyncStorage} from '../services/CommonFunction';
  import Toast from 'react-native-toast-message';
  import {useSelector} from 'react-redux';
//   import NewHeader from './NewHeader';
  import LinearGradient from 'react-native-linear-gradient';
import Colors from '../../assets/commonCSS/Colors';
import { hp, wp } from '../../assets/commonCSS/GlobalCSS';
import FSize from '../../assets/commonCSS/FSize';
import Images from '../../assets/image';
import CInput from '../../Component/CInput';
import { mobile_siteConfig } from '../../services/mobile-siteConfig';
import { getDataFromAsyncStorage } from '../../services/CommonFunction';
import { postDataWithToken1, getDataWithToken } from '../../services/mobile-api';
import NewHeader from '../../Component/NewHeader';
  
  const AddCredits = ({navigation, route}: {navigation: any; route: any}) => {
    const getUserDetails = useSelector(state => state?.getUserDetails);
    const {email, mobile, name} = getUserDetails;
    const layout = useWindowDimensions();
    const [index, setIndex] = useState(0);
    const [routes] = useState([
      {key: 'all', title: 'All'},
      {key: 'credited', title: 'Credited'},
      {key: 'debited', title: 'Debited'},
    ]);
    const [visible, setVisible] = useState(false);
    const [credits, setCredits] = useState('');
  
    const [cardDataLoading, setCardDataLoading] = useState(true);
    const [orderId, setOrderId] = useState('');
    const isFocused = useIsFocused();
    const [sampleAmount, setsampleAmount] = useState([50, 100, 150]); // these are nubmer of credits
    const [transactions, setTransactions] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [totalAmount, setTotalAmount] = useState(0);
    const [consumption, setConsuption] = useState(0);
  
    const openModal = () => setVisible(true);
    const closeModal = () => setVisible(false);
    useEffect(() => {
      const fetchData = async () => {
        try {
          await Promise.all([fetchWallet(), fetchTransactions()]);
        } catch (error) {
          console.error('Error during API calls:', error);
          setCardDataLoading(false);
        } finally {
          setCardDataLoading(false);
        }
      };
  
      if (isFocused) {
        fetchData();
      }
    }, [isFocused]);
    const calculateTransaction = (transactionArray: any[]) => {
      const debited = transactionArray
        ?.filter((item: any) => item.transaction_type === '0') // Filter for debit transactions
        ?.reduce((sum: number, item: any) => sum + Number(item.amount), 0);

      const credited = transactionArray
        ?.filter((item: any) => item.transaction_type === '1') // Filter for credit transactions
        ?.reduce((sum: number, item: any) => sum + Number(item.amount), 0);
      setTotalAmount(credited || 0);
      setConsuption(debited || 0);
    };
  
    const renderItems = ({item, index}: {item: any; index: number}) => {
      return (
        <View style={styles.card} key={index}>
          <View style={styles.transactionRow}>
            <Text style={styles.transText}>ID: {item?.transaction_id}</Text>
            <Text style={{color: Colors.gray}}>{item.transaction_date}</Text>
          </View>
          <Text style={styles.transactionRemark}>{item.remark}</Text>
          <View style={[styles.transactionRow, {marginTop: hp(1.5)}]}>
            <Text style={{color: Colors.gray}}>{''}</Text>
            <Text
              style={[
                styles.debitCreditText,
                {color: item?.transaction_type == '0' ? 'red' : 'green'},
              ]}>
              {item?.transaction_type == '0'
                ? item?.amount + ' Debit'
                : item?.amount + ' Credit'}
            </Text>
          </View>
        </View>
      );
    };

    const AllTab = () => {
      const allTransactions = transactions || [];
      return (
        <FlatList
          data={allTransactions}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          keyExtractor={(item, idx) => 
            item?.transaction_id?.toString() || 
            item?.updated_at?.toString() || 
            `all-${idx}`
          }
          renderItem={renderItems}
          contentContainerStyle={{
            padding: wp(4),
            paddingBottom: hp(5),
          }}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyMessage}>No transactions found !</Text>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.sooprsblue}
              colors={[Colors.sooprsblue, Colors.black]}
            />
          }
        />
      );
    };

    const CreditedTab = () => {
      const creditedTransactions = (transactions || []).filter(
        item => item.transaction_type === '1'
      );
      return (
        <FlatList
          data={creditedTransactions}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          keyExtractor={(item, idx) => 
            item?.transaction_id?.toString() || 
            item?.updated_at?.toString() || 
            `credited-${idx}`
          }
          renderItem={renderItems}
          contentContainerStyle={{
            padding: wp(4),
            paddingBottom: hp(5),
          }}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyMessage}>No credits found !</Text>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.sooprsblue}
              colors={[Colors.sooprsblue, Colors.black]}
            />
          }
        />
      );
    };

    const DebitedTab = () => {
      const debitedTransactions = (transactions || []).filter(
        item => item.transaction_type === '0'
      );
      return (
        <FlatList
          data={debitedTransactions}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          keyExtractor={(item, idx) => 
            item?.transaction_id?.toString() || 
            item?.updated_at?.toString() || 
            `debited-${idx}`
          }
          renderItem={renderItems}
          contentContainerStyle={{
            padding: wp(4),
            paddingBottom: hp(5),
          }}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyMessage}>No debits found !</Text>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.sooprsblue}
              colors={[Colors.sooprsblue, Colors.black]}
            />
          }
        />
      );
    };

    const renderScene = ({route}: {route: any}) => {
      switch (route.key) {
        case 'all':
          return <AllTab />;
        case 'credited':
          return <CreditedTab />;
        case 'debited':
          return <DebitedTab />;
        default:
          return null;
      }
    };

    const getUserId = async (): Promise<string | null> => {
      try {
        // Try AsyncStorage first (faster)
        let userId = await AsyncStorage.getItem(mobile_siteConfig.UID);
        if (userId) {
          // Remove quotes if present
          userId = userId.replace(/^"|"$/g, '').trim();
          if (userId && userId !== 'null' && userId !== 'undefined') {
            console.log('User ID from AsyncStorage:', userId);
            return userId;
          }
        }

        // Fetch from API if not in AsyncStorage or invalid
        console.log('Fetching user ID from API...');
        const res: any = await getDataWithToken({}, mobile_siteConfig.GET_USER_DETAILS);
        const data: any = await res.json();
        
        if (data?.success && data?.vendorDetail?.id) {
          const id = String(data.vendorDetail.id);
          // Store in AsyncStorage for future use
          await AsyncStorage.setItem(mobile_siteConfig.UID, id);
          console.log('User ID from API:', id);
          return id;
        }
        
        console.error('User ID not found in API response');
        return null;
      } catch (error) {
        console.error('Error getting user ID:', error);
        // Fallback to AsyncStorage if API call fails
        const cachedId = await AsyncStorage.getItem(mobile_siteConfig.UID);
        if (cachedId) {
          const cleanedId = cachedId.replace(/^"|"$/g, '').trim();
          if (cleanedId && cleanedId !== 'null' && cleanedId !== 'undefined') {
            return cleanedId;
          }
        }
        return null;
      }
    };
  
    const VeriftyOrderPayment = async (orderId, paymentId, sign, amount) => {
      closeModal();
      const userId = await getUserId();
  
      const payload = new FormData();
      payload.append('user_id', userId);
      payload.append('amount', amount);
      payload.append('payment_id', paymentId);
      payload.append('order_id', orderId);
      payload.append('signature', sign);
      try {
        setLoading(true);
        const res: any = await postDataWithToken1(
          payload,
          mobile_siteConfig.VERIFY_ORDER,
        );
        if (res?.status === 200) {
          setVisible(false);
          await fetchWallet();
          await fetchTransactions();
  
          Toast.show({
            type: 'success',
            text1: 'Credit Added',
            text2: 'Credit added successfully',
            position: 'top',
            visibilityTime: 2000,
            text1Style: {
              fontSize: 14,
              fontWeight: 'bold',
            },
            text2Style: {
              fontSize: 13,
            },
          });
        }
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Error in adding credit',
          position: 'top',
          visibilityTime: 2000,
          text1Style: {
            fontSize: 14,
            fontWeight: 'bold',
          },
          text2Style: {
            fontSize: 13,
          },
        });
  
        console.log('error', error);
      } finally {
        setLoading(false);
      }
    };
    const fetchWallet = async () => {
      try {
        // First, try to get wallet balance from GET_USER_DETAILS API (more reliable)
        try {
          const res: any = await getDataWithToken({}, mobile_siteConfig.GET_USER_DETAILS);
          const data: any = await res.json();
          console.log('User details API response for wallet:', data);
          
          if (data?.success && data?.stats?.wallet_balance !== undefined) {
            const walletBalance = String(data.stats.wallet_balance || 0);
            setCredits(walletBalance);
            console.log('Wallet balance from GET_USER_DETAILS:', walletBalance);
            return;
          }
        } catch (apiError) {
          console.log('Error fetching wallet from GET_USER_DETAILS, trying wallet_balance API:', apiError);
        }

        // Fallback to wallet_balance API if GET_USER_DETAILS doesn't have it
        const slug = getUserDetails?.slug;
        if (!slug) {
          console.error('User slug not found. Cannot fetch wallet balance.');
          // Try to get slug from API
          try {
            const res: any = await getDataWithToken({}, mobile_siteConfig.GET_USER_DETAILS);
            const data: any = await res.json();
            if (data?.success && data?.vendorDetail?.slug) {
              const formdata = new FormData();
              formdata.append('auth_user_slug', data.vendorDetail.slug);
              
              const response = await fetch(
                'https://sooprs.com/api2/public/index.php/wallet_balance',
                {
                  method: 'POST',
                  body: formdata,
                },
              );
              
              const walletRes = await response.json();
              console.log('Wallet balance API response:', walletRes);
              
              if (walletRes.status == 200) {
                const walletBalance = String(walletRes.msg?.wallet || walletRes.msg || 0);
                setCredits(walletBalance);
                console.log('Wallet balance from wallet_balance API:', walletBalance);
              } else {
                console.error('Error fetching wallet balance:', walletRes.msg);
                setCredits('0');
              }
            } else {
              setCredits('0');
            }
          } catch (error) {
            console.error('Error fetching wallet balance:', error);
            setCredits('0');
          }
          return;
        }

        const formdata = new FormData();
        formdata.append('auth_user_slug', slug);
        
        const response = await fetch(
          'https://sooprs.com/api2/public/index.php/wallet_balance',
          {
            method: 'POST',
            body: formdata,
          },
        );
        
        const res = await response.json();
        console.log('Wallet balance API response:', res);
        
        // Check if the response status is 200
        if (res.status == 200) {
          const walletBalance = String(res.msg?.wallet || res.msg || 0);
          setCredits(walletBalance);
          console.log('Wallet balance set to:', walletBalance);
        } else {
          console.error('Error fetching wallet balance:', res.msg);
          setCredits('0');
        }
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
        setCredits('0');
      } finally {
        setLoading(false);
      }
    };

    const fetchTransactions = async () => {
      const lead_id = await getUserId();
      console.log('lead_id:::::', lead_id);
      const formData = new FormData();

      if (!lead_id) {
        console.error('User ID is null. Cannot fetch transactions.');
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'User ID not found. Please login again.',
          position: 'top',
          visibilityTime: 3000,
        });
        return;
      }

      formData.append('user_id', lead_id);
      formData.append('data_value','2');
  
      try {
        const response = await fetch(
          'https://sooprs.com/api2/public/index.php/get_transactions',
          {
            method: 'POST',
            body: formData,
          },
        );
  
        const res = await response.json();

        console.log('transactions Response:::::', res);
  
        if (res.status === 200) {
          setTransactions(res.msg);
          calculateTransaction(res?.msg);
        } else {
          console.error('Error fetching transactions:', res.msg);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };
    const onRefresh = async () => {
      setRefreshing(true);
      await fetchWallet();
      await fetchTransactions();
      setRefreshing(false);
    };
    const PurchaseModal = () => {
      const [addcredit, setaddCredits] = useState('50');
      const [estimatedAmounts, setEstimatedAmount] = useState({
        USD: '10.00',
        INR: '850.00',
      });
      const addCredits = async () => {
        if (Number(addcredit) < 50) {
          Toast.show({
            type: 'info',
            text1: "Credits can't be less than 50.",
            position: 'top',
            visibilityTime: 2000,
            text1Style: {
              fontSize: 14,
              fontWeight: 'bold',
            },
            text2Style: {
              fontSize: 13,
            },
          });
          return;
        }
        setLoading(true);
        const numberOfCredits = parseFloat(addcredit);
        const conversionRate = 85;
        const amountPerCredit = 0.2; //(1/5)
        const amountInUSD = numberOfCredits * amountPerCredit;
        const amountInINR = amountInUSD * conversionRate;
        const amountInPaise = Number(amountInINR * 100);
        setEstimatedAmount({
          USD: amountInUSD.toFixed(2).toString(),
          INR: amountInINR.toFixed(2).toString(),
        });
        // Initialize FormData
        const formdata = new FormData();
        formdata.append('amount', amountInPaise.toString());
        try {
          const response = await fetch(
            'https://sooprs.com/create_razr_order.php',
            {
              method: 'POST',
              body: formdata,
            },
          );
  
          const res = await response.json();
          if (res.order_id) {
            setOrderId(res.order_id);
            //test key: rzp_test_eaw8FUWQWt0bHV
            const options = {
              description: 'Sooprs',
              image: 'https://sooprs.com/assets/images/sooprs_logo.png',
              currency: 'INR',
              key: 'rzp_live_0dVc0pFpUWFAqu',
              amount: amountInPaise,
              name: 'Sooprs.com',
              order_id: res?.order_id,
              prefill: {
                email: email,
                contact: mobile,
                name: name,
              },
              theme: {
                color: '#0077FF',
              },
            };
            RazorpayCheckout.open(options)
              .then(data => {
                if (data.razorpay_payment_id !== undefined) {
                  let orderId = data?.razorpay_order_id;
                  let paymentId = data?.razorpay_payment_id;
                  let sign = data?.razorpay_signature;
                  VeriftyOrderPayment(
                    orderId,
                    paymentId,
                    sign,
                    amountInUSD.toString(),
                  );
                }
              })
              .catch(error => {
                console.error('Razorpay error:', error);
                setLoading(false);
              });
          }
        } catch (error) {
          console.error('Error creating order:', error);
          setLoading(false);
        } finally {
          setLoading(false);
        }
      };
      return (
        <Modal
          visible={visible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeModal}>
          <TouchableWithoutFeedback onPress={closeModal}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <View style={styles.modalsec}>
                    <TouchableOpacity
                      onPress={closeModal}
                      style={styles.closeIconContainer}>
                      <Image
                        source={Images.crossIcon}
                        style={styles.crossIcon}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
  
                    <Text style={styles.modalTitle}>Add Credits</Text>
                  </View>
                  <CInput
                    title={`Amount (USD ≈ ${estimatedAmounts.USD} or INR ≈ ${estimatedAmounts.INR})`}
                    name="Enter number of credits"
                    newlabel={false}
                    style={undefined}
                    loggedIn={true}
                    customInputStyle={undefined}
                    setValue={(val: any) => {
                      setaddCredits(val);
                      const conversionRate = 85;
                      const amountPerCredit = 0.2; //(1/5)
                      const amountInUSD = val * amountPerCredit;
                      const amountInINR = amountInUSD * conversionRate;
                      setEstimatedAmount({
                        USD: amountInUSD.toFixed(2).toString(),
                        INR: amountInINR.toFixed(2).toString(),
                      });
                    }}
                    value={addcredit}
                    isPassword={false}
                    keyboardType={'number-pad'}
                  />
                  <View style={styles.conversion}>
                    <Text style={styles.convertText}>(US $1 = 1 Credit)</Text>
                  </View>
                  <View style={styles.or}>
                    <Text style={styles.orText}>Or</Text>
                  </View>
                  <View style={styles.sample}>
                    {sampleAmount.map((amount, index) => (
                      <TouchableOpacity
                        style={styles.amountSelection}
                        onPress={() => {
                          setaddCredits(amount.toString());
                          const conversionRate = 85;
                          const amountPerCredit = 0.2; //(1/5)
                          const amountInUSD = amount * amountPerCredit;
                          const amountInINR = amountInUSD * conversionRate;
                          setEstimatedAmount({
                            USD: amountInUSD.toFixed(2).toString(),
                            INR: amountInINR.toFixed(2).toString(),
                          });
                        }}>
                        <Text style={{color: Colors.black, fontWeight: '500'}}>
                          {amount}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
  
                  <TouchableOpacity onPress={addCredits} style={styles.submitBtn}>
                    {loading && visible ? (
                      <View>
                        <ActivityIndicator color={Colors.white} size={25} />
                      </View>
                    ) : (
                      <Text style={styles.submitText}>Add Credits</Text>
                    )}
                  </TouchableOpacity>
                  {getUserDetails?.is_company == '1' && (
                    <Text
                      style={{
                        color: Colors.black,
                        textAlign: 'center',
                        marginVertical: 8,
                      }}
                      onPress={() => {
                        closeModal();
                        navigation.navigate('SubscriptionScreen');
                      }}>
                      Want a discount?
                      <Text
                        style={{
                          color: Colors.sooprsblue,
                          textDecorationLine: 'underline',
                        }}>
                        {' '}
                        Subscribe Now
                      </Text>
                    </Text>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      );
    };
    return (
      <View style={styles.container}>
        {loading && (
          <View
            style={{
              position: 'absolute',
              alignSelf: 'center',
              bottom: hp(40),
              zIndex: 999,
            }}>
            <ActivityIndicator color={Colors.sooprsblue} size={25} />
          </View>
        )}
        <NewHeader 
          navigation={navigation} 
          header={'Credits'} 
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.creditContainer}>
          <LinearGradient
            colors={['#8794C2', '#363889', '#322679']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            locations={[0, 0.6, 1]}
            style={styles.gradient}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <View>
                <Text style={styles.atext}>Available Credits</Text>
                {cardDataLoading ? (
                  <ActivityIndicator
                    color={Colors.white}
                    style={{marginTop: 10}}
                  />
                ) : (
                  <Text style={styles.creditText}>{credits || 0}</Text>
                )}
              </View>
              <TouchableOpacity style={styles.addButton} onPress={openModal}>
                <Image
                  source={Images.add}
                  resizeMode="contain"
                  style={{height: 20, width: 20, marginRight: 7}}
                  tintColor={'#322679'}
                />
                <Text style={styles.addText}>Add</Text>
              </TouchableOpacity>
            </View>
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <View>
                <Text style={styles.atext}>Total Credited</Text>
                {cardDataLoading ? (
                  <ActivityIndicator
                    color={Colors.white}
                    style={{marginTop: 10}}
                  />
                ) : (
                  <Text style={[styles.creditText, {fontSize: FSize.fs20}]}>
                    {totalAmount}
                  </Text>
                )}
              </View>
              <View>
                <Text style={styles.atext}>Consumption</Text>
                {cardDataLoading ? (
                  <ActivityIndicator
                    color={Colors.white}
                    style={{marginTop: 10}}
                  />
                ) : (
                  <Text style={[styles.creditText, {fontSize: FSize.fs20}]}>
                    {consumption}
                  </Text>
                )}
              </View>
            </View>
          </LinearGradient>
          <LinearGradient
            colors={['#0068FFB2', '#0055A9B2']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            locations={[0, 0.8]}
            style={{
              height: '20%',
              backgroundColor: Colors.sooprsblue,
              width: '65%',
              borderRadius: 20,
              position: 'absolute',
              bottom: '8%',
              zIndex: -1,
            }}
          />
        </View>
        <View style={styles.tabViewContainer}>
          <TabView
            navigationState={{index, routes}}
            renderScene={renderScene}
            onIndexChange={setIndex}
            initialLayout={{width: layout.width}}
            renderTabBar={props => (
              <View style={styles.tabBar}>
                {props.navigationState.routes.map((route, i) => {
                  const isActive = i === index;
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setIndex(i)}
                      style={[
                        styles.tabItem,
                        isActive ? styles.activeTabItem : styles.inactiveTabItem,
                      ]}>
                      <Text
                        style={
                          isActive ? styles.activeTabText : styles.inactiveTabText
                        }>
                        {route.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          />
        </View>
        <PurchaseModal />
      </View>
    );
  };
  
  export default AddCredits;
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.white,
    },
    headerSection: {
      marginHorizontal: wp(5),
      marginVertical: hp(1),
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(2),
    },
    gradient: {
      justifyContent: 'space-between',
      // alignItems: 'center',
      width: '80%',
      height: '70%',
      borderRadius: 22,
      padding: 18,
    },
    creditContainer: {
      height: hp(28),
      width: wp(100),
      backgroundColor: '#002E5A',
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      color: '#fff',
      fontSize: 20,
      fontWeight: 'bold',
    },
    atext: {
      color: Colors.white,
      fontSize: FSize.fs16,
      fontWeight: '400',
    },
    addText: {
      color: '#322679',
      fontWeight: '500',
      fontSize: FSize.fs16,
    },
    addButton: {
      flexDirection: 'row',
      paddingHorizontal: wp(3),
      paddingVertical: 5,
      backgroundColor: Colors.white,
      alignSelf: 'flex-start',
      alignItems: 'center',
      borderRadius: 25,
    },
    backArrow: {
      width: wp(8),
      height: hp(8),
    },
    debitCreditText: {
      fontSize: FSize.fs17,
      fontWeight: '600',
    },
    headerTitle: {
      color: Colors.black,
      fontWeight: '500',
      fontSize: FSize.fs16,
    },
    card: {
      width: wp(90),
      borderWidth: 1.5,
      borderRadius: 12,
      marginBottom: 12,
      borderColor: Colors.lightgrey2,
      padding: 10,
      alignSelf: 'center',
    },
    transText: {color: Colors.gray, fontWeight: '500'},
    creditSection: {
      marginHorizontal: wp(5),
      marginVertical: hp(3),
    },
  
    creditsCard: {
      backgroundColor: Colors.black,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: wp(5),
      // paddingHorizontal: wp(5),
      paddingVertical: hp(4),
      gap: wp(3),
    },
  
    walletContainer: {
      backgroundColor: Colors.white,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: wp(10),
      paddingHorizontal: wp(5),
      paddingVertical: hp(3),
    },
  
    walletIcon: {
      width: wp(8),
      height: hp(3),
      tintColor: Colors.sooprsblue,
    },
  
    sample: {
      gap: hp(1),
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
  
    creditText: {
      color: Colors.white,
      fontSize: FSize.fs30,
      fontWeight: 'bold',
    },
  
    creditAmount: {
      color: Colors.white,
      fontWeight: '600',
      fontSize: FSize.fs22,
    },
  
    crossIconContainer: {
      marginLeft: wp(2),
    },
  
    crossIcon: {
      width: wp(4),
      height: hp(4),
    },
  
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: wp(80),
      backgroundColor: '#FFF',
      padding: wp(5),
      borderRadius: wp(2),
    },
    closeIconContainer: {
      alignSelf: 'flex-end',
    },
    modalTitle: {
      fontSize: FSize.fs18,
      fontWeight: 'bold',
      marginBottom: hp(2),
      color: Colors.black,
    },
    modalsec: {
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  
    labelText: {
      fontSize: FSize.fs14,
      marginVertical: hp(1),
      color: Colors.sooprsblue,
    },
  
    submitBtn: {
      marginTop: hp(3),
      backgroundColor: '#0077FF',
      padding: wp(3),
      alignItems: 'center',
      borderRadius: wp(2),
    },
    submitText: {
      color: '#FFFFFF',
      fontSize: FSize.fs16,
      fontWeight: 'bold',
    },
    conversion: {
      alignSelf: 'flex-end',
    },
  
    convertText: {
      fontWeight: '400',
      color: Colors.sooprsblue,
      fontSize: FSize.fs10,
    },
    or: {
      marginVertical: hp(1),
      alignSelf: 'center',
    },
    orText: {
      fontSize: FSize.fs16,
      color: Colors.gray,
      fontWeight: '500',
    },
  
    tabBar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      borderBottomWidth: 0, // Remove bottom border
      paddingHorizontal: wp(2), // Add horizontal padding for spacing
      paddingVertical: hp(1), // Add vertical padding for a cleaner layout
      backgroundColor: 'white',
      width: wp(95),
      alignSelf: 'center',
    },
    tabItem: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 10,
    },
    activeTabItem: {
      borderBottomWidth: 2,
      borderColor: Colors.sooprsblue,
      backgroundColor: Colors.lightgrey1,
    },
    inactiveTabItem: {
      backgroundColor: Colors.lightgrey1,
    },
    activeTabText: {
      color: Colors.sooprsblue,
      fontWeight: '500',
      fontSize: FSize.fs20,
    },
    inactiveTabText: {
      color: Colors.gray,
      fontWeight: '500',
      fontSize: FSize.fs16,
    },
  
    transactionCard: {
      padding: wp(4), // 16
      borderRadius: wp(2), // 8
      marginBottom: hp(2), // 12
      backgroundColor: '#f9f9f9', // Light gray background
      elevation: 2,
      borderColor: '#ddd',
      borderWidth: 1,
    },
    debitCard: {
      backgroundColor: Colors.white,
    },
    creditCard: {
      backgroundColor: Colors.white,
    },
    transactionRow: {flexDirection: 'row', justifyContent: 'space-between'},
    transactionRemark: {
      color: Colors.black,
      fontSize: FSize.fs17,
      marginTop: hp(1),
      fontWeight: '500',
    },
    transactionDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: hp(1),
    },
    transactionAmount: {
      fontSize: FSize.fs16,
      fontWeight: '600',
      color: '#0077FF',
    },
    transactionType: {
      fontSize: FSize.fs16, // Slightly smaller for transaction type
      color: 'red', // Gray for less emphasis compared to amount
      fontWeight: '500',
    },
    transactionId: {
      fontSize: FSize.fs12, // Smaller size for the transaction ID
      color: '#999', // Light gray for less emphasis
    },
    transactionDate: {
      fontSize: FSize.fs12, // Smaller font for date
      color: '#999',
    },
  
    emptyMessage: {
      textAlign: 'center',
      marginTop: hp(10),
      color: 'gray',
      fontSize: FSize.fs14,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: hp(40),
    },
    tabViewContainer: {
      flex: 1,
      marginTop: hp(1),
    },
    amountSelection: {
      borderWidth: 1.5,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderColor: Colors.sooprsblue,
      borderRadius: 6,
      width: '25%',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
  