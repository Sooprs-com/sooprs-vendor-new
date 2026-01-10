import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import FSize from '../../assets/commonCSS/FSize';
import Images from '../../assets/image';
import {getDataWithToken, PutDataWithToken} from '../../services/mobile-api';
import {mobile_siteConfig} from '../../services/mobile-siteConfig';
import Toast from 'react-native-toast-message';

const PaymentMethodScreen = () => {
  const navigation = useNavigation();
  
  // Bank Details State
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifsc, setIfsc] = useState('');
  
  // UPI State
  const [upiId, setUpiId] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const showAlert = (type: string, text1: string, text2: string) => {
    Toast.show({
      type: type,
      text1: text1,
      text2: text2,
      position: 'top',
    });
  };

  const getPaymentDetails = async () => {
    try {
      setLoading(true);
      const res: any = await getDataWithToken({}, mobile_siteConfig.GET_USER_DETAILS);
      const data: any = await res.json();
      console.log('Payment details data:::::', data);
      
      if (data?.success && data?.vendorDetail) {
        const vendor = data.vendorDetail;
        
        // Fill bank details
        if (vendor.bank_details) {
          if (vendor.bank_details.account_holder_name) {
            setAccountHolderName(vendor.bank_details.account_holder_name);
          }
          if (vendor.bank_details.bank_name) {
            setBankName(vendor.bank_details.bank_name);
          }
          if (vendor.bank_details.account_no) {
            setAccountNo(vendor.bank_details.account_no);
          }
          if (vendor.bank_details.ifsc) {
            setIfsc(vendor.bank_details.ifsc);
          }
          // Fill UPI details from bank_details
          if (vendor.bank_details.upi_id) {
            setUpiId(vendor.bank_details.upi_id);
          }
        }
        
        // Fallback: Fill UPI details from top level (for backward compatibility)
        if (vendor.upi_id && !vendor.bank_details?.upi_id) {
          setUpiId(vendor.upi_id);
        }
      }
    } catch (e) {
      console.log('Error fetching payment details:', e);
      showAlert('error', 'Error', 'Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      getPaymentDetails();
    }, [])
  );

  const handleUpdatePaymentMethod = async () => {
    // Validation
    if (!accountHolderName.trim()) {
      showAlert('error', 'Validation Error', 'Please enter account holder name');
      return;
    }
    if (!bankName.trim()) {
      showAlert('error', 'Validation Error', 'Please enter bank name');
      return;
    }
    if (!accountNo.trim()) {
      showAlert('error', 'Validation Error', 'Please enter account number');
      return;
    }
    if (!ifsc.trim()) {
      showAlert('error', 'Validation Error', 'Please enter IFSC code');
      return;
    }
    if (ifsc.length !== 11) {
      showAlert('error', 'Validation Error', 'IFSC code must be 11 characters');
      return;
    }
    if (upiId.trim() && !upiId.includes('@')) {
      showAlert('error', 'Validation Error', 'Please enter a valid UPI ID (e.g., name@paytm)');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload: any = {
          account_holder_name: accountHolderName.trim(),
          bank_name: bankName.trim(),
          account_no: accountNo.trim(),
          ifsc: ifsc.trim().toUpperCase(),
      };

      // Add UPI if provided
      if (upiId.trim()) {
        payload.upi_id = upiId.trim();
      }

      console.log('Update payment method payload:', payload);

      const data: any = await PutDataWithToken(payload, mobile_siteConfig.UPDATE_PROFILE);
      
      console.log('Update payment method response:', data);
      
      if (data?.success) {
        showAlert('success', 'Success', 'Payment method updated successfully');
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        showAlert('error', 'Error', data?.message || data?.msg || 'Failed to update payment method');
      }
    } catch (e) {
      console.log('Error updating payment method:', e);
      showAlert('error', 'Error', 'Failed to update payment method');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.sooprsblue} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image source={Images.backArrow} 
            style={{
                width:hp(3),
                height:hp(3),
                }} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Method</Text>
          <View style={{width: wp(15)}} />
        </View>

        {/* Bank Details Section */}
        <Text style={styles.sectionTitle}>Bank Details</Text>
        <Text style={styles.sectionSubtitle}>
          Manage your bank account details for payments
        </Text>

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
            onChangeText={(text) => setIfsc(text.toUpperCase())}
            maxLength={11}
            autoCapitalize="characters"
          />
        </View>

        {/* UPI Section */}
        <Text style={[styles.sectionTitle, {marginTop: hp(3)}]}>UPI Details</Text>
        <Text style={styles.sectionSubtitle}>
          Add your UPI ID for quick payments
        </Text>

        {/* UPI ID */}
        <Text style={styles.label}>UPI ID</Text>
        <View style={styles.inputBox}>
          <TextInput
            placeholder="Enter UPI ID (e.g., name@paytm)"
            placeholderTextColor={Colors.lightgrey2}
            style={styles.input}
            value={upiId}
            onChangeText={setUpiId}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Update Button */}
        <TouchableOpacity 
          style={[styles.updateBtn, isSubmitting && styles.updateBtnDisabled]}
          onPress={handleUpdatePaymentMethod}
          disabled={isSubmitting}
          activeOpacity={0.8}>
          <Text style={styles.updateText}>
            {isSubmitting ? 'Updating...' : 'Update Payment Method'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

export default PaymentMethodScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: hp(2),
    paddingBottom: hp(3),
    paddingHorizontal: wp(5),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: hp(50),
  },
  loadingText: {
    marginTop: hp(2),
    fontSize: FSize.fs16,
    color: Colors.grey,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(2),
    marginBottom: hp(2),
  },
  backText: {
    fontSize: FSize.fs16,
    color: Colors.sooprsblue,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: FSize.fs20,
    fontWeight: '700',
    color: Colors.black,
    flex: 1,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: FSize.fs18,
    fontWeight: '700',
    color: Colors.black,
    marginTop: hp(2),
    marginBottom: hp(0.5),
  },
  sectionSubtitle: {
    fontSize: FSize.fs14,
    color: Colors.grey,
    marginBottom: hp(2),
  },
  label: {
    fontSize: FSize.fs15,
    fontWeight: '600',
    color: Colors.black,
    marginTop: hp(1.5),
    marginBottom: hp(0.5),
  },
  inputBox: {
    borderRadius: wp(2),
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    marginBottom: hp(1),
  },
  input: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    fontSize: FSize.fs15,
    color: Colors.black,
  },
  updateBtn: {
    backgroundColor: Colors.sooprsblue,
    borderRadius: wp(3),
    paddingVertical: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(3),
    marginBottom: hp(2),
  },
  updateBtnDisabled: {
    opacity: 0.6,
  },
  updateText: {
    color: Colors.white,
    fontSize: FSize.fs17,
    fontWeight: '700',
  },
});
