import React, {useState} from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {CommonActions} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Colors from '../assets/commonCSS/Colors';
import FSize from '../assets/commonCSS/FSize';
import {hp, wp} from '../assets/commonCSS/GlobalCSS';
import Images from '../assets/image';
import {persistVendorSession} from '../services/CommonFunction';
import {postData} from '../services/mobile-api';
import {mobile_siteConfig} from '../services/mobile-siteConfig';

const validateEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const VendorEmailLoginScreen = ({navigation}: {navigation: any}) => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const showAlert = (type: string, text1: string, text2: string) => {
    Toast.show({
      type,
      text1,
      text2,
      position: 'top',
    });
  };

  const handleLogin = async () => {
    if (!validateEmail(email)) {
      showAlert('error', 'Error', 'Please enter a valid email address.');
      return;
    }
    if (!password.trim()) {
      showAlert('error', 'Error', 'Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const result: any = await postData(
        {
          email: email.trim(),
          password,
        },
        mobile_siteConfig.LOGIN_VENDOR,
      );

      const failed =
        result?.success === false ||
        result?.status === 400 ||
        result?.status === 401 ||
        result?.status === 'error';

      const saved = failed ? false : await persistVendorSession(result, email.trim());
      if (!saved) {
        showAlert(
          'error',
          'Login failed',
          result?.msg || result?.message || 'Invalid email or password.',
        );
        return;
      }

      showAlert('success', 'Success', result?.message || result?.msg || 'Logged in successfully');
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'VendorDrawer',
              params: {email: email.trim()},
            },
          ],
        }),
      );
    } catch (error: any) {
      showAlert(
        'error',
        'Error',
        error?.message || 'Something went wrong while logging in.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F6FB" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={[styles.header, {paddingTop: insets.top + hp(3)}]}>
            <Text style={styles.brandTitle}>Sooprs Partner</Text>
            <Text style={styles.headerSubtitle}>
              Manage leads, orders and your business
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.description}>
              Sign in with the email and password for your vendor account.
            </Text>

            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Image source={Images.emailIcon} style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="vendor@email.com"
                placeholderTextColor="#9AA6B5"
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Image source={Images.lockIcon} style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholder="Enter your password"
                placeholderTextColor="#9AA6B5"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(prev => !prev)}
                activeOpacity={0.7}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Image
                  source={showPassword ? Images.eyec : Images.eye}
                  style={styles.eyeIcon}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>New to Sooprs Partner?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('VendorSignup')}
                activeOpacity={0.7}>
                <Text style={styles.footerLink}>Create an account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default VendorEmailLoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F6FB',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: hp(4),
  },
  header: {
    paddingHorizontal: wp(6),
    paddingBottom: hp(2.4),
  },
  brandTitle: {
    color: '#102033',
    fontSize: FSize.fs28,
    fontWeight: '700',
    marginBottom: hp(0.8),
  },
  headerSubtitle: {
    color: '#6B7788',
    fontSize: FSize.fs15,
    lineHeight: hp(2.6),
    maxWidth: wp(78),
  },
  card: {
    marginHorizontal: wp(5),
    backgroundColor: Colors.white,
    borderRadius: wp(5),
    paddingHorizontal: wp(5),
    paddingTop: hp(3),
    paddingBottom: hp(2.5),
    borderWidth: 1,
    borderColor: '#E8EEF5',
    shadowColor: '#102033',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    fontSize: FSize.fs24,
    fontWeight: '700',
    color: '#102033',
  },
  description: {
    fontSize: FSize.fs14,
    color: '#6B7788',
    lineHeight: hp(2.4),
    marginTop: hp(0.8),
    marginBottom: hp(2.6),
  },
  label: {
    fontSize: FSize.fs13,
    color: '#334155',
    fontWeight: '600',
    marginBottom: hp(0.8),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: '#E3E9F2',
    borderRadius: wp(3),
    paddingHorizontal: wp(3.2),
    marginBottom: hp(2),
    minHeight: hp(6.4),
  },
  fieldIcon: {
    width: wp(4.6),
    height: wp(4.6),
    resizeMode: 'contain',
    tintColor: '#7B8798',
    marginRight: wp(2),
  },
  input: {
    flex: 1,
    fontSize: FSize.fs15,
    color: '#102033',
    paddingVertical: hp(1.4),
  },
  eyeIcon: {
    width: wp(5),
    height: wp(5),
    resizeMode: 'contain',
    tintColor: '#607089',
    marginLeft: wp(2),
  },
  primaryButton: {
    backgroundColor: Colors.sooprsblue,
    borderRadius: wp(3),
    minHeight: hp(6.4),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(0.5),
  },
  buttonDisabled: {
    opacity: 0.8,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: FSize.fs16,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: hp(2.4),
    paddingTop: hp(2),
    borderTopWidth: 1,
    borderTopColor: '#EEF2F7',
  },
  footerText: {
    fontSize: FSize.fs13,
    color: '#6B7788',
    marginBottom: hp(0.4),
  },
  footerLink: {
    fontSize: FSize.fs15,
    color: Colors.sooprsblue,
    fontWeight: '700',
  },
});
