import React, {useState, useRef, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {hp, wp} from '../assets/commonCSS/GlobalCSS';
import Colors from '../assets/commonCSS/Colors';
import FSize from '../assets/commonCSS/FSize';
import Toast from 'react-native-toast-message';
// import {postDataWithToken1} from '../services/mobile-api';
// import { mobile_siteConfig } from '../services/mobile-siteConfig';
// import { storeDataToAsyncStorage } from '../services/CommonFunction';

const NewOtpScreen = () => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(15);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const route = useRoute();
  const navigation = useNavigation();
  const params = route?.params as {mobileNumber?: string; phoneNumber?: string} | undefined;
  const {mobileNumber, phoneNumber} = params || {};

  const displayPhoneNumber = phoneNumber || mobileNumber || '';

  const showAlert = (type: string, text1: string, text2: string) => {
    Toast.show({
      type: type,
      text1: text1,
      text2: text2,
      position: 'top',
    });
  };

  useEffect(() => {
    // Start timer automatically when screen loads
    if (timer === 15) {
      setTimer(15);
      setCanResend(false);
    }
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prevTimer => prevTimer - 1);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // Format timer as MM:SS sec (e.g., "00:15 sec")
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} sec`;
  };

  // Mask phone number for display (e.g., +91 999xxxx000)
  const maskPhoneNumber = (phone: string) => {
    if (!phone) return '';
    // Remove all non-digits except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    // Extract country code and last 3 digits
    const match = cleaned.match(/^(\+\d{2})(\d{3})(\d{3})(\d{3})$/);
    if (match) {
      return `${match[1]} ${match[2]}xxxx${match[4]}`;
    }
    return phone;
  };

  const handleOtpChange = (value: string, index: number) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < otp.length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && index > 0 && !otp[index]) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    // Resend OTP API removed intentionally
    return;
  };

  // const handleVerifyOtp = async () => {
  //   // Check if all OTP fields are filled
  //   if (otp.some(digit => digit === '')) {
  //     showAlert('error', 'Error', 'Please fill all the OTP fields.');
  //     return;
  //   }

  //   // Create OTP string from array
  //   const otpString = otp.join('');
  //   const phone = mobileNumber || phoneNumber;

  //   if (!phone) {
  //     showAlert('error', 'Error', 'Phone number is missing.');
  //     return;
  //   }

  //   setIsVerifying(true);

  //   try {
  //     const payload = {
  //       mobile: phone,
  //       otp: otpString,
  //     };

  //     const result: any = await postDataWithToken1(payload, mobile_siteConfig.VERIFY_OTP_NEW);
  //     console.log('result:::::', result);

  //     if (result?.status === 400 || result?.status === 'error') {
  //       showAlert('error', 'Error', result?.msg || result?.message || 'Invalid OTP. Please try again.');
  //       setIsVerifying(false);
  //       return;
  //     }

  //     // Success case
  //     showAlert('success', 'Success', result?.msg || result?.message || 'OTP verified successfully');

      
      
  //     // Navigate to Email Collection Screen
  //     if(result?.isRegistered===false){
  //     (navigation as any).navigate('EmailCollectionScreen', {
  //       mobileNumber: phone,
  //       phoneNumber: phone,
  //     });
  //   }
  //   else{
  //     await storeDataToAsyncStorage(mobile_siteConfig.TOKEN, result.token);
  //     await storeDataToAsyncStorage(mobile_siteConfig.IS_LOGIN, 'TRUE');
      
  //     // Store additional user data if available
  //     if (result?.user_id) {
  //       await storeDataToAsyncStorage(mobile_siteConfig.UID, result.user_id);
  //     }
  //     if (result?.slug) {
  //       await storeDataToAsyncStorage(mobile_siteConfig.SLUG, result.slug);
  //     }
  //     if (result?.email) {
  //       await storeDataToAsyncStorage(mobile_siteConfig.EMAIL, result?.email);
  //     }
  //     (navigation as any).navigate('ClientBottomTab', { 
  //       email: result?.email, 
  //       ...params 
  //     });
  //   }
  //   } catch (error) {
  //     showAlert('error', 'Error', 'An error occurred while verifying OTP.');
  //     console.error(error);
  //   } finally {
  //     setIsVerifying(false);
  //   }
  // };


  const handleVerifyOtp = async () => {
    // Check if all OTP fields are filled
    if (otp.some(digit => digit === '')) {
      showAlert('error', 'Error', 'Please fill all the OTP fields.');
      return;
    }



   

      
      
      // Navigate to Email Collection Screen
    
      (navigation as any).navigate('EmailCollectionScreen', {
        mobileNumber: "9990099000",
        phoneNumber: "9990099000",
      });
    // }
   
  }
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <View style={styles.contentArea}>
          {/* Title */}
          <Text style={styles.title}>Enter the 4-digit OTP code</Text>

          {/* Description with phone number */}
          {displayPhoneNumber ? (
            <Text style={styles.description}>
              Check your SMS message. We've sent you the{'\n'}
              code at {maskPhoneNumber(displayPhoneNumber)}
            </Text>
          ) : null}

          {/* OTP Input Fields */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => (inputRefs.current[index] = ref)}
                style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                value={digit}
                onChangeText={value => handleOtpChange(value, index)}
                onKeyPress={({nativeEvent}) =>
                  handleKeyPress(nativeEvent.key, index)
                }
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                cursorColor={Colors.sooprsblue}
              />
            ))}
          </View>

          {/* Verify OTP Button */}
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={handleVerifyOtp}
            disabled={isVerifying}
            activeOpacity={0.8}>
            <Text style={styles.verifyButtonText}>Verify OTP</Text>
          </TouchableOpacity>

          {/* Resend Section */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendQuestion}>
              Didn't you receive any code?{' '}
              {!canResend && (
                <Text style={styles.resendTimer}>{formatTimer(timer)}</Text>
              )}
            </Text>
            {canResend && (
              <TouchableOpacity
                onPress={handleResend}
                disabled={isResending}
                activeOpacity={0.7}>
                <Text style={styles.resendLink}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
};

export default NewOtpScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C2C2C',
  },
  contentArea: {
    backgroundColor: Colors.white,
    // borderTopLeftRadius: wp(8),
    // borderTopRightRadius: wp(8),
    paddingHorizontal: wp(6),
    paddingTop: hp(4),
    paddingBottom: hp(3),
    // marginTop: hp(8),
    flex: 1,
  },
  title: {
    fontSize: FSize.fs28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: hp(2),
  },
  description: {
    fontSize: FSize.fs14,
    color: "#6E6B68",
    marginBottom: hp(4),
    lineHeight: hp(2.5),
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(5),
    width: '100%',
    paddingHorizontal: wp(2),
  },
  otpBox: {
    width: wp(16),
    height: wp(16),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: wp(2),
    backgroundColor: Colors.white,
    fontSize: FSize.fs20,
    fontWeight: '600',
    color: Colors.black,
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: Colors.sooprsblue,
  },
  verifyButton: {
    backgroundColor: Colors.sooprsblue,
    borderRadius: wp(2),
    paddingVertical: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(2),
    marginBottom: hp(3),
  },
  verifyButtonText: {
    color: Colors.white,
    fontSize: FSize.fs16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendQuestion: {
    fontSize: FSize.fs14,
    color: '#333333',
    textAlign: 'center',
  },
  resendTimer: {
    fontSize: FSize.fs14,
    color: '#FF0000',
    fontWeight: '500',
  },
  resendLink: {
    fontSize: FSize.fs14,
    color: Colors.sooprsblue,
    textDecorationLine: 'underline',
    fontWeight: '500',
    marginTop: hp(1),
  },
});

