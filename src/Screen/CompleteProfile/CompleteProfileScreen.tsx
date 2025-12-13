import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    SafeAreaView,
  } from 'react-native';
  import React, {useState} from 'react';
  import {useNavigation} from '@react-navigation/native';
  import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
  import Colors from '../../assets/commonCSS/Colors';
  import FSize from '../../assets/commonCSS/FSize';
  import Images from '../../assets/image';
  import { postDataWithToken } from '../../services/mobile-api';
  import { mobile_siteConfig } from '../../services/mobile-siteConfig';
  import Toast from 'react-native-toast-message';
  import { Alert } from 'react-native';
  
  const CompleteProfileScreen = () => {
    const navigation = useNavigation();
    // State for all form fields
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('IN');
    const [areaCode, setAreaCode] = useState('');
    const [gstNo, setGstNo] = useState('');
    const [pan, setPan] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNo, setAccountNo] = useState('');
    const [ifsc, setIfsc] = useState('');
    const [accountHolderName, setAccountHolderName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const showAlert = (type: string, text1: string, text2: string) => {
      Toast.show({
        type: type,
        text1: text1,
        text2: text2,
        position: 'top',
      });
    };

    const handleCompleteProfile = async () => {
      // Validation
      if (!address.trim()) {
        showAlert('error', 'Error', 'Please enter your address');
        return;
      }

      if (!city.trim()) {
        showAlert('error', 'Error', 'Please enter city');
        return;
      }

      if (!country.trim()) {
        showAlert('error', 'Error', 'Please enter country');
        return;
      }

      if (!areaCode.trim()) {
        showAlert('error', 'Error', 'Please enter area code (pincode)');
        return;
      }

      if (!gstNo.trim()) {
        showAlert('error', 'Error', 'Please enter GST number');
        return;
      }

      if (!pan.trim()) {
        showAlert('error', 'Error', 'Please enter PAN number');
        return;
      }

      if (!bankName.trim()) {
        showAlert('error', 'Error', 'Please enter bank name');
        return;
      }

      if (!accountNo.trim()) {
        showAlert('error', 'Error', 'Please enter account number');
        return;
      }

      if (!ifsc.trim()) {
        showAlert('error', 'Error', 'Please enter IFSC code');
        return;
      }

      if (!accountHolderName.trim()) {
        showAlert('error', 'Error', 'Please enter account holder name');
        return;
      }

      setIsSubmitting(true);

      try {
        // Payload with exact keys as shown in screenshot
        const payload = {
          address: address.trim(),
          city: city.trim(),
          country: country.trim(),
          area_code: areaCode.trim(),
          gst_no: gstNo.trim(),
          pan: pan.trim(),
          bank_name: bankName.trim(),
          account_no: accountNo.trim(),
          ifsc: ifsc.trim(),
          account_holder_name: accountHolderName.trim(),
        };

        console.log('Complete Profile Payload:', payload);
        
        const result: any = await postDataWithToken(payload, mobile_siteConfig.COMPLETE_PROFILE);
        console.log('Complete Profile result:::::', result);

        if (result?.status === 400 || result?.status === 'error' || result?.success === false) {
          showAlert('error', 'Error', result?.msg || result?.message || 'Failed to complete profile. Please try again.');
          setIsSubmitting(false);
          return;
        }

        // Success case
        if (result?.success === true) {
          showAlert('success', 'Success', result?.message || 'Profile completed successfully');
          
          // Navigate to Home screen after successful submission
          setTimeout(() => {
            // Navigate to BottomTab with Home screen, which will trigger refresh via useFocusEffect
            (navigation as any).replace('BottomTab', {
              screen: 'Home',
            });
          }, 1500);
        } else {
          showAlert('error', 'Error', result?.msg || result?.message || 'Failed to complete profile. Please try again.');
        }
      } catch (error: any) {
        console.log('Complete Profile error:::::', error);
        showAlert('error', 'Error', error?.message || 'An error occurred while completing profile. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    };


    return (
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          
          {/* ===== HEADER ===== */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Image source={Images.backArrow} style={styles.backIcon} />
            </TouchableOpacity>
  
            <Text style={styles.headerTitle}>Registration</Text>
          </View>
  
  <View style={styles.sectionDivider} /> 
          {/* ===== REGISTRATION DETAILS ===== */}
          <Text style={styles.sectionTitle}>Registration Details</Text>
          <Text style={styles.sectionSubtitle}>
            Please fill your details for the registration
          </Text>
  
          {/* Address */}
          <Text style={styles.label}>Address</Text>
          <View style={styles.inputBox}>
            <View style={styles.iconInputRow}>
              <Image source={Images.searchIcon} style={styles.inputIcon} />
              <TextInput
                placeholder="Enter your address"
                placeholderTextColor={Colors.lightgrey2}
                style={styles.inputWithIcon}
                value={address}
                onChangeText={setAddress}
              />
            </View>
          </View>

          {/* City */}
          <Text style={styles.label}>City</Text>
          <View style={styles.inputBox}>
            <TextInput
              placeholder="Enter city"
              placeholderTextColor={Colors.lightgrey2}
              style={styles.input}
              value={city}
              onChangeText={setCity}
            />
          </View>

          {/* Country */}
          <Text style={styles.label}>Country</Text>
          <View style={styles.inputBox}>
            <TextInput
              placeholder="Enter country code (e.g., IN)"
              placeholderTextColor={Colors.lightgrey2}
              style={styles.input}
              value={country}
              onChangeText={setCountry}
            />
          </View>

          {/* Area Code (Pincode) */}
          <Text style={styles.label}>Area Code (Pincode)</Text>
          <View style={styles.inputBox}>
            <TextInput
              placeholder="Enter pincode"
              placeholderTextColor={Colors.lightgrey2}
              style={styles.input}
              value={areaCode}
              onChangeText={setAreaCode}
              keyboardType="numeric"
              maxLength={6}
            />
          </View>

          {/* GST Number */}
          <Text style={styles.label}>GST Number</Text>
          <View style={styles.inputBox}>
            <TextInput
              placeholder="Enter GST number"
              placeholderTextColor={Colors.lightgrey2}
              style={styles.input}
              value={gstNo}
              onChangeText={setGstNo}
              maxLength={15}
            />
          </View>
  
          {/* PAN */}
          <Text style={styles.label}>PAN</Text>
          <View style={styles.inputBox}>
            <TextInput
              placeholder="Enter PAN number"
              placeholderTextColor={Colors.lightgrey2}
              style={styles.input}
              value={pan}
              onChangeText={setPan}
              maxLength={10}
            />
          </View>
  
          {/* ===== BANK DETAILS SECTION ===== */}
          <Text style={[styles.sectionTitle, {marginTop: hp(3)}]}>Bank Details</Text>
          <Text style={styles.sectionSubtitle}>
            Please fill your bank details for the registration
          </Text>
  
          {/* Bank Name */}
          <Text style={styles.label}>Bank Name</Text>
          <View style={styles.inputBox}>
            <TextInput
              placeholder="Enter bank name"
              placeholderTextColor={Colors.lightgrey2}
              style={styles.input}
              value={bankName}
              onChangeText={setBankName}
            />
          </View>

          {/* Account Number */}
          <Text style={styles.label}>Account Number</Text>
          <View style={styles.inputBox}>
            <TextInput
              placeholder="Enter account number"
              placeholderTextColor={Colors.lightgrey2}
              style={styles.input}
              value={accountNo}
              onChangeText={setAccountNo}
              keyboardType="numeric"
            />
          </View>
  
          {/* IFSC Code */}
          <Text style={styles.label}>IFSC Code</Text>
          <View style={styles.inputBox}>
            <TextInput
              placeholder="Enter IFSC code"
              placeholderTextColor={Colors.lightgrey2}
              style={styles.input}
              value={ifsc}
              onChangeText={setIfsc}
              maxLength={11}
            />
          </View>

          {/* Account Holder Name */}
          <Text style={styles.label}>Account Holder Name</Text>
          <View style={styles.inputBox}>
            <TextInput
              placeholder="Enter account holder name"
              placeholderTextColor={Colors.lightgrey2}
              style={styles.input}
              value={accountHolderName}
              onChangeText={setAccountHolderName}
            />
          </View>
  
          {/* Continue Button */}
          <TouchableOpacity 
            style={[styles.continueBtn, isSubmitting && styles.continueBtnDisabled]}
            onPress={handleCompleteProfile}
            disabled={isSubmitting}
            activeOpacity={0.8}>
            <Text style={styles.continueText}>
              {isSubmitting ? 'Submitting...' : 'Continue'}
            </Text>
          </TouchableOpacity>
  
        </ScrollView>
      </SafeAreaView>
    );
  };
  
  export default CompleteProfileScreen;
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: hp(2),
      backgroundColor: Colors.white,
      paddingHorizontal: wp(5),
    },
  
    // HEADER
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: hp(2),
      marginBottom: hp(1),
    },
    backIcon: {
      width: wp(5),
      height: wp(5),
      tintColor: Colors.black,
      marginRight: wp(3),
    },
    headerTitle: {
      fontSize: FSize.fs18,
      fontWeight: '700',
      color: Colors.black,
    },
  
    // SECTION TITLES
    sectionTitle: {
      fontSize: FSize.fs18,
      fontWeight: '700',
      color: Colors.black,
      marginTop: hp(1),
    },
    sectionSubtitle: {
      fontSize: FSize.fs12,
      color: Colors.gray,
      marginBottom: hp(2),
    },
  
    // LABEL ABOVE FIELDS
    label: {
      fontSize: FSize.fs13,
      color: Colors.gray,
      fontWeight: '600',
      marginBottom: hp(0.6),
      marginTop: hp(1),
    },
  
    // INPUT BOX
    inputBox: {
      borderWidth: 1,
      borderColor: Colors.lightgrey2,
      borderRadius: wp(2),
      paddingHorizontal: wp(3),
      paddingVertical: hp(1.2),
      marginBottom: hp(1),
    },
    input: {
      fontSize: FSize.fs14,
      color: Colors.black,
    },
  
    // ICON + INPUT (Address)
    iconInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    inputIcon: {
      width: wp(5),
      height: wp(5),
      tintColor: Colors.gray,
      marginRight: wp(3),
    },
    inputWithIcon: {
      flex: 1,
      fontSize: FSize.fs14,
      color: Colors.black,
    },
  
    // CONTINUE BUTTON
    continueBtn: {
      backgroundColor: Colors.sooprsblue,
      paddingVertical: hp(2),
      borderRadius: wp(3),
      alignItems: 'center',
      marginTop: hp(3),
      marginBottom: hp(5),
    },
    continueBtnDisabled: {
      backgroundColor: Colors.gray,
      opacity: 0.6,
    },
    sectionDivider: {
    width: '100%',
    height: hp(0.1),
    backgroundColor: Colors.lightgrey2,
    marginBottom: hp(2),
  },
  
    continueText: {
      color: Colors.white,
      fontSize: FSize.fs15,
      fontWeight: '700',
    },
  });

// import {
//     StyleSheet,
//     Text,
//     View,
//     TextInput,
//     TouchableOpacity,
//     ScrollView,
//     Image,
//     SafeAreaView,
//   } from 'react-native';
//   import React from 'react';
//   import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
//   import Colors from '../../assets/commonCSS/Colors';
//   import FSize from '../../assets/commonCSS/FSize';
//   import Images from '../../assets/image';
  
//   const CompleteProfileScreen = ({navigation}) => {
//     return (
//       <SafeAreaView style={styles.container}>
//         <ScrollView showsVerticalScrollIndicator={false}>
          
//           {/* ===== HEADER ===== */}
//           <View style={styles.header}>
//             <TouchableOpacity onPress={() => navigation.goBack()}>
//               <Image source={Images.backArrow} style={styles.backIcon} />
//             </TouchableOpacity>
  
//             <Text style={styles.headerTitle}>Registration</Text>
//           </View>
  
//   <View style={styles.sectionDivider} /> 
//           {/* ===== REGISTRATION DETAILS ===== */}
//           <Text style={styles.sectionTitle}>Registration Details</Text>
//           <Text style={styles.sectionSubtitle}>
//             Please fill your details for the registration
//           </Text>
  
//           {/* GST Number */}
//           <Text style={styles.label}>GST Number</Text>
//           <View style={styles.inputBox}>
//             <TextInput
//               placeholder="eg...."
//               placeholderTextColor={Colors.lightgrey2}
//               style={styles.input}
//             />
//           </View>
  
//           {/* PAN */}
//           <Text style={styles.label}>PAN</Text>
//           <View style={styles.inputBox}>
//             <TextInput
//               placeholder="eg...."
//               placeholderTextColor={Colors.lightgrey2}
//               style={styles.input}
//             />
//           </View>
  
//           {/* Address */}
//           <Text style={styles.label}>Address</Text>
//           <View style={styles.inputBox}>
//             <View style={styles.iconInputRow}>
//               <Image source={Images.searchIcon} style={styles.inputIcon} />
//               <TextInput
//                 placeholder="Enter your address"
//                 placeholderTextColor={Colors.lightgrey2}
//                 style={styles.inputWithIcon}
//               />
//             </View>
//           </View>
  
//           {/* ===== BANK DETAILS SECTION ===== */}
//           <Text style={[styles.sectionTitle, {marginTop: hp(3)}]}>Bank Details</Text>
//           <Text style={styles.sectionSubtitle}>
//             Please fill your bank details for the registration
//           </Text>
  
//           {/* Account Holder Name */}
//           <Text style={styles.label}>Name of the bank account holder</Text>
//           <View style={styles.inputBox}>
//             <TextInput
//               placeholder="eg...."
//               placeholderTextColor={Colors.lightgrey2}
//               style={styles.input}
//             />
//           </View>
  
//           {/* Account Number */}
//           <Text style={styles.label}>Account Number</Text>
//           <View style={styles.inputBox}>
//             <TextInput
//               placeholder="eg...."
//               placeholderTextColor={Colors.lightgrey2}
//               style={styles.input}
//             />
//           </View>
  
//           {/* IFSC Code */}
//           <Text style={styles.label}>IFSC Code</Text>
//           <View style={styles.inputBox}>
//             <TextInput
//               placeholder="eg...."
//               placeholderTextColor={Colors.lightgrey2}
//               style={styles.input}
//             />
//           </View>
  
//           {/* CVV */}
//           <Text style={styles.label}>CVV</Text>
//           <View style={styles.inputBox}>
//             <TextInput
//               placeholder="eg...."
//               placeholderTextColor={Colors.lightgrey2}
//               style={styles.input}
//             />
//           </View>
  
//           {/* Continue Button */}
//           <TouchableOpacity style={styles.continueBtn}>
//             <Text style={styles.continueText}>Continue</Text>
//           </TouchableOpacity>
  
//         </ScrollView>
//       </SafeAreaView>
//     );
//   };
  
//   export default CompleteProfileScreen;
  
//   const styles = StyleSheet.create({
//     container: {
//       flex: 1,
//       backgroundColor: Colors.white,
//       paddingHorizontal: wp(5),
//     },
  
//     // HEADER
//     header: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       marginTop: hp(2),
//       marginBottom: hp(1),
//     },
//     backIcon: {
//       width: wp(5),
//       height: wp(5),
//       tintColor: Colors.black,
//       marginRight: wp(3),
//     },
//     headerTitle: {
//       fontSize: FSize.fs18,
//       fontWeight: '700',
//       color: Colors.black,
//     },
  
//     // SECTION TITLES
//     sectionTitle: {
//       fontSize: FSize.fs18,
//       fontWeight: '700',
//       color: Colors.black,
//       marginTop: hp(1),
//     },
//     sectionSubtitle: {
//       fontSize: FSize.fs12,
//       color: Colors.gray,
//       marginBottom: hp(2),
//     },
  
//     // LABEL ABOVE FIELDS
//     label: {
//       fontSize: FSize.fs13,
//       color: Colors.gray,
//       fontWeight: '600',
//       marginBottom: hp(0.6),
//       marginTop: hp(1),
//     },
  
//     // INPUT BOX
//     inputBox: {
//       borderWidth: 1,
//       borderColor: Colors.lightgrey2,
//       borderRadius: wp(2),
//       paddingHorizontal: wp(3),
//       paddingVertical: hp(1.2),
//       marginBottom: hp(1),
//     },
//     input: {
//       fontSize: FSize.fs14,
//       color: Colors.black,
//     },
  
//     // ICON + INPUT (Address)
//     iconInputRow: {
//       flexDirection: 'row',
//       alignItems: 'center',
//     },
//     inputIcon: {
//       width: wp(5),
//       height: wp(5),
//       tintColor: Colors.gray,
//       marginRight: wp(3),
//     },
//     inputWithIcon: {
//       flex: 1,
//       fontSize: FSize.fs14,
//       color: Colors.black,
//     },
  
//     // CONTINUE BUTTON
//     continueBtn: {
//       backgroundColor: Colors.sooprsblue,
//       paddingVertical: hp(2),
//       borderRadius: wp(3),
//       alignItems: 'center',
//       marginTop: hp(3),
//       marginBottom: hp(5),
//     },
//     sectionDivider: {
//     width: '100%',
//     height: hp(0.1),
//     backgroundColor: Colors.lightgrey2,
//     marginBottom: hp(2),
//   },
  
//     continueText: {
//       color: Colors.white,
//       fontSize: FSize.fs15,
//       fontWeight: '700',
//     },
//   });