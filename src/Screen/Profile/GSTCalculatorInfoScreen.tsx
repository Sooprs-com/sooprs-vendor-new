import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import FSize from '../../assets/commonCSS/FSize';
import Images from '../../assets/image';
import Toast from 'react-native-toast-message';

const USERS_API_BASE_URL = 'https://pd3m9rn7-5001.inc1.devtunnels.ms';
const USERS_API_ENDPOINT = '/api/users';

const GSTCalculatorInfoScreen = () => {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleContinue = async () => {
    if (isLoading) {
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter your name',
        position: 'top',
      });
      return;
    }

    if (!trimmedEmail) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter your email',
        position: 'top',
      });
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid email address',
        position: 'top',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${USERS_API_BASE_URL}${USERS_API_ENDPOINT}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: trimmedName,
            email: trimmedEmail,
          }),
        },
      );

      if (!response.ok) {
        let errorMessage = 'Failed to save details. Please try again.';
        try {
          const errorData = await response.json();
          if (errorData?.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // ignore JSON parse errors from error body
        }
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMessage,
          position: 'top',
        });
        return;
      }

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Details saved successfully',
        position: 'top',
      });

      (navigation as any).navigate('GSTCalculatorScreen', {
        name: trimmedName,
        email: trimmedEmail,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Network error. Please check your connection and try again.',
        position: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Image source={Images.backArrow} style={styles.backArrowIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GST Calculator</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Enter your details</Text>
          <Text style={styles.subtitle}>
            Continue to calculate Indian GST instantly
          </Text>
          <View style={styles.divider} />

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#9AA4B2"
            autoCapitalize="words"
            editable={!isLoading}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor="#9AA4B2"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[
              styles.continueButton,
              isLoading && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={isLoading}
            activeOpacity={0.85}>
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.continueButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default GSTCalculatorInfoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: hp(4),
    // backgroundColor: '#F7F9FC',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    // paddingTop: hp(1.5),
    paddingBottom: hp(1),
    // backgroundColor: Colors.white,
  },
  backButton: {
    width: wp(10),
    height: wp(10),
    justifyContent: 'center',
  },
  backArrowIcon: {
    width: wp(8),
    height: wp(8),
    tintColor: Colors.black,
  },
  headerTitle: {
    fontSize: FSize.fs18,
    fontWeight: '700',
    color: '#0D2149',
  },
  headerSpacer: {
    width: wp(10),
  },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(4),
  },
  title: {
    fontSize: FSize.fs22,
    fontWeight: '700',
    color: '#0D2149',
    marginBottom: hp(0.8),
  },
  subtitle: {
    fontSize: FSize.fs14,
    color: '#6B7A90',
    marginBottom: hp(1.5),
  },
  divider: {
    width: wp(12),
    height: 3,
    backgroundColor: '#3A86FF',
    borderRadius: 2,
    marginBottom: hp(3.5),
  },
  label: {
    fontSize: FSize.fs14,
    fontWeight: '600',
    color: '#0D2149',
    marginBottom: hp(1),
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#C8D9F5',
    borderRadius: wp(2.5),
    paddingHorizontal: wp(4),
    paddingVertical: Platform.OS === 'ios' ? hp(1.6) : hp(1.4),
    fontSize: FSize.fs15,
    color: '#0D2149',
    marginBottom: hp(2.5),
  },
  continueButton: {
    backgroundColor: '#3A86FF',
    borderRadius: wp(2.5),
    paddingVertical: hp(1.8),
    alignItems: 'center',
    marginTop: hp(1),
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueButtonText: {
    color: Colors.white,
    fontSize: FSize.fs16,
    fontWeight: '700',
  },
});
