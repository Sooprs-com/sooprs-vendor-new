import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import {hp, wp} from '../assets/commonCSS/GlobalCSS';
import Colors from '../assets/commonCSS/Colors';
import FSize from '../assets/commonCSS/FSize';
// import ButtonNew from '../components/ButtonNew';

const EnterMobileNumber = ({navigation}: {navigation: any}) => {
  const [mobileNumber, setMobileNumber] = useState('9990099000');
  const [countryCode, setCountryCode] = useState('+91');
  const [showBottomSheet, setShowBottomSheet] = useState(true);
  const [simNumbers, setSimNumbers] = useState([
    {id: 1, label: 'SIM 1', number: '+91 9999009900'},
    {id: 2, label: 'SIM 2', number: '+91 8888009900'},
  ]);

  const slideAnim = useRef(new Animated.Value(hp(50))).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

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

  // const sendOtpAndNavigate = async (
  //   rawNumber: string,
  //   displayNumber: string,
  // ) => {
  //   try {
  //     setIsSendingOtp(true);

  //     // Prepare mobile number for API (remove spaces, keep + and digits)
  //     const cleanedNumber = displayNumber.replace(/[^\d+]/g, '');

  //     // Use common postDataWithToken1 helper for API call
  //     const payload = {
  //       mobile: cleanedNumber,
  //     };

  //     const result: any = await postDataWithToken1(
  //       payload,
  //       'api/auth/send-otp-user',
  //     );

  //     if (result?.success) {
  //       // OTP sent successfully → navigate to OTP screen
  //       navigation.navigate('NewOtpScreen', {
  //         mobileNumber: cleanedNumber,
  //         phoneNumber: displayNumber,
  //       });
  //     } else {
  //       const msg =
  //         result?.message ||
  //         result?.msg ||
  //         'Failed to send OTP. Please try again.';
  //       Alert.alert('Error', msg);
  //     }
  //   } catch (error: any) {
  //     console.log('Error sending OTP:', error);
  //     Alert.alert(
  //       'Error',
  //       error?.message || 'Something went wrong while sending OTP.',
  //     );
  //   } finally {
  //     setIsSendingOtp(false);
  //   }
  // };

  const sendOtpAndNavigate = async (
    rawNumber: string,
    displayNumber: string,
  ) => {
    navigation.navigate('NewOtpScreen',{
      // mobileNumber: cleanedNumber,
      phoneNumber: displayNumber,
    });
  };

  const handleContinue = () => {
    // Navigate to OTP screen or next step
    // navigation.navigate('OtpScreen', {mobileNumber: `${countryCode} ${mobileNumber}`});
    console.log('Continue with:', `${countryCode} ${mobileNumber}`);
    sendOtpAndNavigate(`${countryCode} ${mobileNumber}`, `${countryCode} ${mobileNumber}`);
  };

  const handleSimSelect = (sim: any) => {
    const number = sim.number.replace(countryCode, '').trim();
    setMobileNumber(number);
    setShowBottomSheet(false);
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
            activeOpacity={0.8}>
            <Text style={styles.continueButtonText}>Continue</Text>
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

            {simNumbers.map(sim => (
              <TouchableOpacity
                key={sim.id}
                style={styles.simOption}
                onPress={() => handleSimSelect(sim)}
                activeOpacity={0.7}>
                <View style={styles.simIconContainer}>
                  <Text style={styles.simIcon}>📞</Text>
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
    backgroundColor: '#2C2C2C',
  },
  contentArea: {
    backgroundColor: '#F5F5F5',
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
    color: Colors.black,
    marginBottom: hp(1),
  },
  description: {
    fontSize: FSize.fs14,
    color: Colors.gray,
    marginBottom: hp(4),
    lineHeight: hp(2.5),
  },
  inputContainer: {
    marginBottom: hp(3),
  },
  label: {
    fontSize: FSize.fs12,
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
    fontSize: FSize.fs16,
    color: Colors.black,
    marginRight: wp(2),
    fontWeight: '500',
  },
  input: {
    flex: 1,
    fontSize: FSize.fs16,
    color: Colors.black,
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
    fontSize: wp(6),
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

