import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Animated,
  Image,
  Platform,
  Alert,
} from 'react-native';
import {hp, wp} from '../assets/commonCSS/GlobalCSS';
import Colors from '../assets/commonCSS/Colors';
import FSize from '../assets/commonCSS/FSize';
import Images from '../assets/image';
import SimData from 'react-native-sim-data';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {NativeModules} from 'react-native';
import {postData, postDataWithToken, postDataWithToken1} from '../services/mobile-api';

const {SimPhoneNumberModule} = NativeModules;

const EnterMobileNumber = ({navigation, route}: {navigation: any; route?: any}) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [showBottomSheet, setShowBottomSheet] = useState(true); // Show immediately on load
  const [simNumbers, setSimNumbers] = useState<Array<{id: number; label: string; number: string}>>([]);
  const [isLoadingSims, setIsLoadingSims] = useState(true); // Start with loading state
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current; // Start at 0 so modal is visible
  const backdropOpacity = useRef(new Animated.Value(1)).current; // Start visible

  // Detect SIM cards when screen loads
  useEffect(() => {
    console.log('EnterMobileNumber mounted');
    const detectSimCards = async () => {
      try {
        console.log('Starting SIM detection...');
        setIsLoadingSims(true);
        
        // Request permissions for Android
        if (Platform.OS === 'android') {
          // Request READ_PHONE_STATE permission
          const phoneStatePermission = PERMISSIONS.ANDROID.READ_PHONE_STATE;
          const phoneStateResult = await request(phoneStatePermission);
          
          if (phoneStateResult !== RESULTS.GRANTED) {
            console.log('READ_PHONE_STATE permission not granted');
            setShowBottomSheet(true); // Still show modal
            setIsLoadingSims(false);
            return;
          }
          
          // For Android 8.0+ (API 26+), also request READ_PHONE_NUMBERS
          try {
            const phoneNumbersPermission = PERMISSIONS.ANDROID.READ_PHONE_NUMBERS;
            const phoneNumbersResult = await request(phoneNumbersPermission);
            console.log('READ_PHONE_NUMBERS permission result:', phoneNumbersResult);
          } catch (error) {
            // READ_PHONE_NUMBERS might not be available on older Android versions
            console.log('READ_PHONE_NUMBERS permission not available:', error);
          }
        }
        
        const detectedSims: Array<{id: number; label: string; number: string}> = [];
        
        // console.log('=== SIM Detection Started ===');
        // console.log('Platform.OS:', Platform.OS);
        // console.log('SimPhoneNumberModule:', SimPhoneNumberModule);
        // console.log('SimPhoneNumberModule type:', typeof SimPhoneNumberModule);
        // console.log('SimPhoneNumberModule available:', !!SimPhoneNumberModule);
        
        // Try native module first (more reliable)
        if (Platform.OS === 'android') {
          // console.log('Platform is Android, checking SimPhoneNumberModule...');
          
          if (SimPhoneNumberModule) {
            // console.log('SimPhoneNumberModule is available!');
            // console.log('SimPhoneNumberModule methods:', Object.keys(SimPhoneNumberModule));
            
            try {
              console.log('Trying native SimPhoneNumberModule.getAllPhoneNumbers()...');
              
              // Check if getAllPhoneNumbers method exists
              if (SimPhoneNumberModule.getAllPhoneNumbers) {
                // console.log('getAllPhoneNumbers method exists, calling it...');
                const nativeSimData = await SimPhoneNumberModule.getAllPhoneNumbers();
                // console.log('Native module result:', JSON.stringify(nativeSimData, null, 2));
                // console.log('Native module result type:', typeof nativeSimData);
                // console.log('Is array?', Array.isArray(nativeSimData));
                
                if (nativeSimData) {
                  // Handle array response
                  if (Array.isArray(nativeSimData)) {
                    // console.log('Result is an array, length:', nativeSimData.length);
                    
                    if (nativeSimData.length > 0) {
                      nativeSimData.forEach((sim: any, index: number) => {
                        // console.log(`Processing SIM ${index}:`, JSON.stringify(sim));
                        const phoneNumber = sim?.phoneNumber || sim?.number || sim?.phone || sim;
                        // console.log(`Native SIM ${index} phoneNumber:`, phoneNumber, 'Type:', typeof phoneNumber);
                        
                        if (phoneNumber !== null && phoneNumber !== undefined && phoneNumber !== '') {
                          const phoneStr = String(phoneNumber).trim();
                          // console.log(`Phone string for SIM ${index}:`, phoneStr, 'Length:', phoneStr.length);
                          
                          if (phoneStr !== '' && phoneStr !== 'null' && phoneStr !== 'undefined' && phoneStr.length > 0) {
                            let formattedNumber = phoneStr.replace(/[^\d]/g, '');
                            // console.log(`Native SIM ${index} formatted:`, formattedNumber, 'Length:', formattedNumber.length);
                            
                            if (formattedNumber.length > 0) {
                              if (formattedNumber.length === 10 && !formattedNumber.startsWith('91')) {
                                formattedNumber = '91' + formattedNumber;
                              }
                              let displayNumber = '';
                              if (formattedNumber.length > 10) {
                                const countryCode = formattedNumber.slice(0, formattedNumber.length - 10);
                                const number = formattedNumber.slice(formattedNumber.length - 10);
                                displayNumber = `+${countryCode} ${number}`;
                              } else if (formattedNumber.length === 10) {
                                displayNumber = `+91 ${formattedNumber}`;
                              } else {
                                displayNumber = `+91 ${formattedNumber}`;
                              }
                              // console.log(`✅ Adding Native SIM ${index + 1}:`, displayNumber);
                              detectedSims.push({
                                id: sim.id || index + 1,
                                label: sim.label || `SIM ${index + 1}`,
                                number: displayNumber,
                              });
                            } else {
                              console.log(`❌ SIM ${index} formatted number is empty`);
                            }
                          } else {
                            console.log(`❌ SIM ${index} phone string is invalid`);
                          }
                        } else {
                          console.log(`❌ SIM ${index} phoneNumber is null/undefined/empty`);
                        }
                      });
                    } else {
                      console.log('Native module returned empty array');
                    }
                  } 
                  // Handle string response
                  else if (typeof nativeSimData === 'string' && nativeSimData.trim() !== '') {
                    console.log('Result is a string:', nativeSimData);
                    const phoneStr = nativeSimData.trim();
                    let formattedNumber = phoneStr.replace(/[^\d]/g, '');
                    if (formattedNumber.length > 0) {
                      if (formattedNumber.length === 10 && !formattedNumber.startsWith('91')) {
                        formattedNumber = '91' + formattedNumber;
                      }
                      let displayNumber = '';
                      if (formattedNumber.length > 10) {
                        const countryCode = formattedNumber.slice(0, formattedNumber.length - 10);
                        const number = formattedNumber.slice(formattedNumber.length - 10);
                        displayNumber = `+${countryCode} ${number}`;
                      } else if (formattedNumber.length === 10) {
                        displayNumber = `+91 ${formattedNumber}`;
                      } else {
                        displayNumber = `+91 ${formattedNumber}`;
                      }
                      console.log(`✅ Adding Native SIM from string:`, displayNumber);
                      detectedSims.push({
                        id: 1,
                        label: 'SIM 1',
                        number: displayNumber,
                      });
                    }
                  }
                  // Handle object response
                  else if (typeof nativeSimData === 'object') {
                    console.log('Result is an object:', nativeSimData);
                    const phoneNumber = (nativeSimData as any).phoneNumber || (nativeSimData as any).number || (nativeSimData as any).phone;
                    if (phoneNumber) {
                      const phoneStr = String(phoneNumber).trim();
                      if (phoneStr !== '' && phoneStr !== 'null' && phoneStr !== 'undefined') {
                        let formattedNumber = phoneStr.replace(/[^\d]/g, '');
                        if (formattedNumber.length > 0) {
                          if (formattedNumber.length === 10 && !formattedNumber.startsWith('91')) {
                            formattedNumber = '91' + formattedNumber;
                          }
                          let displayNumber = '';
                          if (formattedNumber.length > 10) {
                            const countryCode = formattedNumber.slice(0, formattedNumber.length - 10);
                            const number = formattedNumber.slice(formattedNumber.length - 10);
                            displayNumber = `+${countryCode} ${number}`;
                          } else if (formattedNumber.length === 10) {
                            displayNumber = `+91 ${formattedNumber}`;
                          } else {
                            displayNumber = `+91 ${formattedNumber}`;
                          }
                          console.log(`✅ Adding Native SIM from object:`, displayNumber);
                          detectedSims.push({
                            id: 1,
                            label: 'SIM 1',
                            number: displayNumber,
                          });
                        }
                      }
                    }
                  } else {
                    console.log('Native module returned unexpected type:', typeof nativeSimData);
                  }
                } else {
                  console.log('Native module returned null/undefined');
                }
              } else {
                console.log('❌ getAllPhoneNumbers method does not exist in SimPhoneNumberModule');
                console.log('Available methods:', Object.keys(SimPhoneNumberModule));
              }
            } catch (error) {
              console.log('❌ Error with native module:', error);
              console.log('Error message:', (error as any)?.message);
              console.log('Error stack:', (error as any)?.stack);
            }
          } else {
            console.log('❌ SimPhoneNumberModule is not available (undefined/null)');
          }
        } else {
          console.log('Platform is not Android, skipping native module');
        }
        
        // Fallback to react-native-sim-data if native module didn't work
        if (detectedSims.length === 0) {
          try {
            console.log('Trying react-native-sim-data as fallback...');
            const simData = await SimData.getSimInfo();
            console.log('SimData.getSimInfo result:', JSON.stringify(simData, null, 2));
            console.log('SimData type:', typeof simData);
            console.log('SimData keys:', simData ? Object.keys(simData) : 'null');
            
            if (simData) {
              // Log all properties to debug
              Object.keys(simData).forEach(key => {
                console.log(`SimData.${key}:`, (simData as any)[key], 'Type:', typeof (simData as any)[key]);
              });
              
              // Check for phoneNumber0, phoneNumber1, etc. (up to 4 SIMs)
              let simIndex = 0;
              while (simIndex < 4) {
                const phoneNumberKey = `phoneNumber${simIndex}`;
                const phoneNumber = (simData as any)[phoneNumberKey];
                console.log(`Checking ${phoneNumberKey}:`, phoneNumber, 'Type:', typeof phoneNumber);
                
                // More robust checking
                if (phoneNumber !== null && phoneNumber !== undefined && phoneNumber !== '') {
                  const phoneStr = String(phoneNumber).trim();
                  console.log(`Phone string for ${phoneNumberKey}:`, phoneStr, 'Length:', phoneStr.length);
                  
                  if (phoneStr !== '' && phoneStr !== 'null' && phoneStr !== 'undefined' && phoneStr.length > 0) {
                    let formattedNumber = phoneStr.replace(/[^\d]/g, '');
                    console.log(`Formatted number for ${phoneNumberKey}:`, formattedNumber, 'Length:', formattedNumber.length);
                    
                    // Only process if we have at least some digits
                    if (formattedNumber.length > 0) {
                      if (formattedNumber.length === 10 && !formattedNumber.startsWith('91')) {
                        formattedNumber = '91' + formattedNumber;
                      }
                      let displayNumber = '';
                      if (formattedNumber.length > 10) {
                        const countryCode = formattedNumber.slice(0, formattedNumber.length - 10);
                        const number = formattedNumber.slice(formattedNumber.length - 10);
                        displayNumber = `+${countryCode} ${number}`;
                      } else if (formattedNumber.length === 10) {
                        displayNumber = `+91 ${formattedNumber}`;
                      } else {
                        // Even if less than 10 digits, show it
                        displayNumber = `+91 ${formattedNumber}`;
                      }
                      
                      console.log(`Adding SIM ${simIndex + 1} with display number:`, displayNumber);
                      detectedSims.push({
                        id: simIndex + 1,
                        label: `SIM ${simIndex + 1}`,
                        number: displayNumber,
                      });
                    }
                  }
                }
                simIndex++;
              }
              
              // Also check for direct phoneNumber field (without index)
              if (detectedSims.length === 0) {
                const directPhoneNumber = (simData as any).phoneNumber;
                console.log('Checking direct phoneNumber field:', directPhoneNumber, 'Type:', typeof directPhoneNumber);
                
                if (directPhoneNumber !== null && directPhoneNumber !== undefined && directPhoneNumber !== '') {
                  const phoneStr = String(directPhoneNumber).trim();
                  if (phoneStr !== '' && phoneStr !== 'null' && phoneStr !== 'undefined' && phoneStr.length > 0) {
                    let formattedNumber = phoneStr.replace(/[^\d]/g, '');
                    if (formattedNumber.length > 0) {
                      if (formattedNumber.length === 10 && !formattedNumber.startsWith('91')) {
                        formattedNumber = '91' + formattedNumber;
                      }
                      let displayNumber = '';
                      if (formattedNumber.length > 10) {
                        const countryCode = formattedNumber.slice(0, formattedNumber.length - 10);
                        const number = formattedNumber.slice(formattedNumber.length - 10);
                        displayNumber = `+${countryCode} ${number}`;
                      } else if (formattedNumber.length === 10) {
                        displayNumber = `+91 ${formattedNumber}`;
                      } else {
                        displayNumber = `+91 ${formattedNumber}`;
                      }
                      console.log('Adding SIM from direct phoneNumber:', displayNumber);
                      detectedSims.push({
                        id: 1,
                        label: 'SIM 1',
                        number: displayNumber,
                      });
                    }
                  }
                }
              }
            } else {
              console.log('SIM Data is null or undefined');
            }
          } catch (error) {
            console.log('Error with react-native-sim-data:', error);
            console.log('Error details:', JSON.stringify(error, null, 2));
          }
        }
        
        console.log('=== Final Detected SIMs ===', detectedSims);
        setSimNumbers(detectedSims);
        
        // Always show bottom sheet modal when screen loads
        setShowBottomSheet(true);
      } catch (error) {
        console.log('=== Error detecting SIM cards ===');
        console.log('Error:', error);
        console.log('Error message:', (error as any)?.message);
        console.log('Error stack:', (error as any)?.stack);
        // Still show modal even if error occurs
        setShowBottomSheet(true);
      } finally {
        setIsLoadingSims(false);
      }
    };
    
    // Always try to detect SIMs when screen loads
    detectSimCards();
  }, [route]);

  useEffect(() => {
    if (showBottomSheet) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: hp(50),
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showBottomSheet]);

  const sendOtpAndNavigate = async (
    rawNumber: string,
    displayNumber: string,
  ) => {
    
    try {
      setIsSendingOtp(true);
      // Prepare mobile number for API (remove +91 prefix if present)
      let cleanedNumber = rawNumber.replace(/\+91/g, '').replace(/\s/g, '');
      // Remove leading 91 if present (in case it's 919999999999)
      if (cleanedNumber.startsWith('91') && cleanedNumber.length === 12) {
        cleanedNumber = cleanedNumber.substring(2);
      }
      const payload = {
        mobile: cleanedNumber,
      };
      console.log('payload:::::', payload);
      const result: any = await postData(
        payload, 
        'auth/send-otp-user',
      );
      console.log('result:::::', result);
      if (result?.success) {
        console.log('OTP sent successfully',result);
        navigation.navigate('NewOtpScreen', {
          mobileNumber: cleanedNumber,
          phoneNumber: displayNumber,
        });
      } else {
        const msg =
          result?.message ||
          result?.msg ||
          'Failed to send OTP. Please try again.';
        Alert.alert('Error', msg);
      }
    } catch (error: any) {
      console.log('Error sending OTP:', error);
      Alert.alert(
        'Error',
        error?.message || 'Something went wrong while sending OTP.',
      );
    } finally {
      setIsSendingOtp(false);
    }

    // navigation.navigate('NewOtpScreen', {
    //   // mobileNumber: cleanedNumber,
    //   phoneNumber: displayNumber,
    // });
  };

  const handleContinue = () => {
    // Validate mobile number before sending OTP
    if (mobileNumber && mobileNumber.trim().length === 10) {
      const fullMobileForApi = `${countryCode}${mobileNumber}`; // e.g. +919999999999
      const displayNumber = `${countryCode} ${mobileNumber}`; // e.g. +91 9999999999
      sendOtpAndNavigate(fullMobileForApi, displayNumber);
    } else {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number.');
    }
  };

  const handleSimSelect = (sim: any) => {
    // Extract just the digits from the number
    const fullNumber = sim.number.replace(/[^\d]/g, '');
    const number = fullNumber.slice(-10); // Get last 10 digits
    
    // Extract country code if present
    let finalCountryCode = countryCode;
    if (fullNumber.length > 10) {
      const code = fullNumber.slice(0, fullNumber.length - 10);
      if (code) {
        finalCountryCode = `+${code}`;
        setCountryCode(finalCountryCode);
      }
    }
    
    setMobileNumber(number);
    setShowBottomSheet(false);
    
    // Automatically send OTP and navigate to OTP screen
    if (number && number.trim().length === 10) {
      const displayNumber = `${finalCountryCode} ${number}`;
      const fullMobileForApi = `${number}`;
      sendOtpAndNavigate(fullMobileForApi, displayNumber);
    }
  };

  const handleUseAnotherNumber = () => {
    setShowBottomSheet(false);
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <View style={styles.container}>
        {/* Main Content Area */}
        <View style={styles.contentArea}>
          <Text style={styles.title}>Enter Mobile Number</Text>
          <Text style={styles.description}>
            Please enter the number, we'll send you an OTP code there.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.countryCode}>{countryCode}</Text>
              <TextInput
                style={styles.input}
                value={mobileNumber}
                onChangeText={setMobileNumber}
                keyboardType="phone-pad"
                placeholder="Enter mobile number"
                placeholderTextColor="#BCBCBC"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
            disabled={isSendingOtp}>
            <Text style={styles.continueButtonText}>
              {isSendingOtp ? 'Sending OTP...' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity,
              display: showBottomSheet ? 'flex' : 'none',
            },
          ]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowBottomSheet(false)}
          />
        </Animated.View>

        {/* Bottom Sheet */}
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{translateY: slideAnim}],
            },
          ]}>
          <View style={styles.bottomSheetContent}>
            <Text style={styles.bottomSheetTitle}>Continue with</Text>

            {isLoadingSims ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Detecting SIM cards...</Text>
              </View>
            ) : simNumbers.length > 0 ? (
              <>
                {simNumbers.map(sim => (
                  <TouchableOpacity
                    key={sim.id}
                    style={styles.simOption}
                    onPress={() => handleSimSelect(sim)}
                    activeOpacity={0.7}>
                    <View style={styles.simIconContainer}>
                      <Image 
                        source={Images.phoneIcon} 
                        style={styles.simIcon}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.simInfo}>
                      <Text style={styles.simLabel}>{sim.label}</Text>
                      <Text style={styles.simNumber}>{sim.number}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.anotherNumberLink}
                  onPress={handleUseAnotherNumber}
                  activeOpacity={0.7}>
                  <Text style={styles.anotherNumberText}>
                    Use another mobile number
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.noSimContainer}>
                <Text style={styles.noSimText}>No SIM cards detected</Text>
                <TouchableOpacity
                  style={styles.anotherNumberLink}
                  onPress={handleUseAnotherNumber}
                  activeOpacity={0.7}>
                  <Text style={styles.anotherNumberText}>
                    Enter mobile number manually
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </>
  );
};

export default EnterMobileNumber;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentArea: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: wp(6),
    paddingTop: hp(4),
    paddingBottom: hp(3),
    flex: 1,
  },
  title: {
    fontSize: FSize.fs28,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: hp(1),
  },
  description: {
    fontSize: FSize.fs17,
    color: Colors.gray,
    marginBottom: hp(4),
    lineHeight: hp(2.5),
  },
  inputContainer: {
    marginBottom: hp(3),
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
    borderColor: Colors.sooprsblue,
    borderRadius: wp(2),
    paddingHorizontal: wp(3),
    backgroundColor: Colors.white,
  },
  countryCode: {
    fontSize: FSize.fs25,
    color: Colors.black,
    marginRight: wp(2),
    fontWeight: '500',
  },
  input: {
    flex: 1,
    fontSize: FSize.fs25,
    color: Colors.black,
    fontWeight: '500',
    paddingVertical: hp(1.5),
  },
  continueButton: {
    backgroundColor: Colors.sooprsblue,
    borderRadius: wp(2),
    paddingVertical: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(2),
  },
  continueButtonText: {
    color: Colors.white,
    fontSize: FSize.fs16,
    fontWeight: '600',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: wp(6),
    borderTopRightRadius: wp(6),
    paddingTop: hp(3),
    paddingBottom: hp(4),
    paddingHorizontal: wp(6),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 2,
  },
  bottomSheetContent: {
    width: '100%',
  },
  bottomSheetTitle: {
    fontSize: FSize.fs18,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: hp(3),
  },
  simOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: wp(3),
    padding: wp(4),
    marginBottom: hp(2),
  },
  simIconContainer: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: Colors.sooprsblue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  simIcon: {
    width: wp(6),
    height: wp(6),
    tintColor: Colors.white,
  },
  loadingContainer: {
    paddingVertical: hp(3),
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FSize.fs14,
    color: Colors.gray,
  },
  noSimContainer: {
    paddingVertical: hp(2),
    alignItems: 'center',
  },
  noSimText: {
    fontSize: FSize.fs14,
    color: Colors.gray,
    marginBottom: hp(2),
  },
  simInfo: {
    flex: 1,
  },
  simLabel: {
    fontSize: FSize.fs16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: hp(0.5),
  },
  simNumber: {
    fontSize: FSize.fs14,
    color: Colors.gray,
  },
  anotherNumberLink: {
    marginTop: hp(1),
    alignItems: 'center',
  },
  anotherNumberText: {
    fontSize: FSize.fs14,
    color: Colors.sooprsblue,
    textDecorationLine: 'underline',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
});
