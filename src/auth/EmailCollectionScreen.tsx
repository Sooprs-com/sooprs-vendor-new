import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {hp, wp} from '../assets/commonCSS/GlobalCSS';
import Colors from '../assets/commonCSS/Colors';
import FSize from '../assets/commonCSS/FSize';
import Toast from 'react-native-toast-message';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { postDataWithToken1 } from '../services/mobile-api';
import { mobile_siteConfig } from '../services/mobile-siteConfig';
import { storeDataToAsyncStorage } from '../services/CommonFunction';

const EmailCollectionScreen = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigation = useNavigation();
  const route = useRoute();
  const params = route?.params as {mobileNumber?: string; phoneNumber?: string} | undefined;

  // Configure Google Sign-In and open modal on screen mount
  useEffect(() => {
    // Configure Google Sign-In
    GoogleSignin.configure({
      webClientId:
        '5869873554-mcccpm4fu7i3j2tavhkm40rnfee7vdn8.apps.googleusercontent.com',
    });

    // Open Google Sign-In modal automatically when screen loads
    const openGoogleSignInModal = async () => {
      try {
        // Sign out any existing session first
        await GoogleSignin.signOut();
        
        // Check if Play Services are available
        await GoogleSignin.hasPlayServices();
        
        // Open Google Sign-In modal - this will show the email selection modal
        setIsGoogleModalOpen(true);
        const userInfo = await GoogleSignin.signIn();
        console.log('userInfo:::::', userInfo);
        
        // Extract email from user info
        // GoogleSignin.signIn() response structure: { data: { user: { email, name, photo }, idToken } }
        const selectedEmail = (userInfo?.data as any)?.user?.email;
        const selectedName = (userInfo?.data as any)?.user?.name;
        
        if (selectedEmail) {
          setEmail(selectedEmail);
          setName(selectedName);
          // Sign out immediately so actual login doesn't happen
          await GoogleSignin.signOut();
        }
        
        setIsGoogleModalOpen(false);
      } catch (error: any) {
        setIsGoogleModalOpen(false);
        
        // Handle different error cases
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          // User cancelled - this is fine, just close the modal
          console.log('User cancelled Google Sign-In');
        } else if (error.code === statusCodes.IN_PROGRESS) {
          // Operation already in progress
          console.log('Google Sign-In already in progress');
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          Toast.show({
            type: 'error',
            text1: 'Play Services Not Available',
            text2: 'Google Play Services are not available or outdated',
            position: 'top',
          });
        } else {
          console.log('Google Sign-In Error:', error);
          // Don't show error for cancelled sign-in
          if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: 'Unable to load Google accounts',
              position: 'top',
            });
          }
        }
      }
    };

    // Open modal after a short delay to ensure screen is fully loaded
    const timer = setTimeout(() => {
      openGoogleSignInModal();
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, []);


  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleContinue = async () => {
    if (!email.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter your email address',
        position: 'top',
      });
      return;
    }

    if (!validateEmail(email)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid email address',
        position: 'top',
      });
      return;
    }

    const phone = params?.mobileNumber || params?.phoneNumber;
    if (!phone) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Phone number is missing',
        position: 'top',
      });
      return;
    }

    setIsSubmitting(true);

    // try {
    //   const payload = {
    //     email: email.trim(),
    //     name: name.trim() || '',
    //     mobile: phone,
    //   };
    //   console.log('Registration payload:::::', payload);

    //   const result: any = await postDataWithToken1(payload, mobile_siteConfig.REGISTER_USER_NEW);
    //   console.log('response:::::', result);

    //   if (result?.status === 400 || result?.message === 'User already registered with this email') {
    //     Toast.show({
    //       type: 'error',
    //       text1: 'Error',
    //       text2: result?.msg || result?.message || 'Registration failed. Please try again.',
    //       position: 'top',
    //     });
    //     setIsSubmitting(false);
    //     return;
    //   }

    //   // Check if registration was successful
    //   if (result?.success === true && result?.message === 'Registered Successfully' && result?.token) {
    //     // Store token and set login status
    //     await storeDataToAsyncStorage(mobile_siteConfig.TOKEN, result.token);
    //     await storeDataToAsyncStorage(mobile_siteConfig.IS_LOGIN, 'TRUE');
        
    //     // Store additional user data if available
    //     if (result?.user_id) {
    //       await storeDataToAsyncStorage(mobile_siteConfig.UID, result.user_id);
    //     }
    //     if (result?.slug) {
    //       await storeDataToAsyncStorage(mobile_siteConfig.SLUG, result.slug);
    //     }
    //     if (email.trim()) {
    //       await storeDataToAsyncStorage(mobile_siteConfig.EMAIL, email.trim());
    //     }

    //     Toast.show({
    //       type: 'success',
    //       text1: 'Success',
    //       text2: result?.message || 'Registration successful',
    //       position: 'top',
    //     });

    //     // Navigate to ClientBottomTab (which shows PostEmailHomeScreen as home) only on success
    //     (navigation as any).navigate('BottomTab', { 
    //       email: email.trim(), 
    //       ...params 
    //     });
    //   } else {
    //     // Handle case where success is true but message doesn't match
    //     Toast.show({
    //       type: 'error',
    //       text1: 'Error',
    //       text2: 'Registration failed. Please try again.',
    //       position: 'top',
    //     });
    //     setIsSubmitting(false);
    //   }
    // } 
    
    // catch (error) {
    //   console.log('error:::::', error);
    //   Toast.show({
    //     type: 'error',
    //     text1: 'Error',
    //     text2: 'An error occurred during registration. Please try again.',
    //     position: 'top',
    //   });
    // } 
    // finally {
    //   setIsSubmitting(false);
    // }
    (navigation as any).navigate('BottomTab', { 
      email: email.trim(), 
      ...params 
    });


  };


  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="white" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        {/* Main Content Area */}
        <View style={styles.contentArea}>
          {/* Progress Indicator */}
          {/* <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Step 1 of 3</Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarFilled} />
              <View style={styles.progressBarEmpty} />
            </View>
          </View> */}

          {/* Title */}
          <Text style={styles.title}>What's your Email id?</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Help us to send you important notifications
          </Text>

          {/* Email Input Field */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="e.g ankurpandit@gmail.com"
              placeholderTextColor="#BCBCBC"
              cursorColor={Colors.sooprsblue}
            />
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[styles.continueButton, isSubmitting && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={isSubmitting}
            activeOpacity={0.8}>
            {isSubmitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.continueButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Google Sign-In modal will open automatically via GoogleSignin.signIn() */}
        {/* Custom bottom sheet removed - using native Google Sign-In modal instead */}
      </KeyboardAvoidingView>
    </>
  );
};

export default EmailCollectionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C2C2C',
  },
  contentArea: {
    backgroundColor: Colors.white,
    paddingHorizontal: wp(6),
    paddingTop: hp(4),
    paddingBottom: hp(3),
    flex: 1,
  },
  progressContainer: {
    marginBottom: hp(3),
  },
  progressText: {
    fontSize: FSize.fs14,
    color: Colors.black,
    textAlign: 'center',
    marginBottom: hp(1),
  },
  progressBarContainer: {
    flexDirection: 'row',
    height: hp(0.3),
    backgroundColor: '#E0E0E0',
    borderRadius: wp(1),
    overflow: 'hidden',
  },
  progressBarFilled: {
    width: '33.33%',
    backgroundColor: Colors.sooprsblue,
  },
  progressBarEmpty: {
    flex: 1,
    backgroundColor: '#E0E0E0',
  },
  title: {
    fontSize: FSize.fs28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: hp(1.5),
  },
  subtitle: {
    fontSize: FSize.fs14,
    color: '#6E6B68',
    marginBottom: hp(4),
    lineHeight: hp(2.5),
  },
  inputContainer: {
    marginBottom: hp(3),
  },
  input: {
    width: '100%',
    height: hp(6),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: wp(2),
    backgroundColor: '#F5F5F5',
    paddingHorizontal: wp(4),
    fontSize: FSize.fs16,
    color: Colors.black,
  },
  continueButton: {
    backgroundColor: Colors.sooprsblue,
    borderRadius: wp(2),
    paddingVertical: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(2),
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: Colors.white,
    fontSize: FSize.fs16,
    fontWeight: '600',
  },
});

