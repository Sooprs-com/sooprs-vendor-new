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
  import React from 'react';
  import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
  import Colors from '../../assets/commonCSS/Colors';
  import FSize from '../../assets/commonCSS/FSize';
  import Images from '../../assets/image';
  
  const CompleteProfileScreen = ({navigation}) => {
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
  
          {/* GST Number */}
          <Text style={styles.label}>GST Number</Text>
          <View style={styles.inputBox}>
            <TextInput
              placeholder="eg...."
              placeholderTextColor={Colors.lightgrey2}
              style={styles.input}
            />
          </View>
  
          {/* PAN */}
          <Text style={styles.label}>PAN</Text>
          <View style={styles.inputBox}>
            <TextInput
              placeholder="eg...."
              placeholderTextColor={Colors.lightgrey2}
              style={styles.input}
            />
          </View>
  
          {/* Address */}
          <Text style={styles.label}>Address</Text>
          <View style={styles.inputBox}>
            <View style={styles.iconInputRow}>
              <Image source={Images.searchIcon} style={styles.inputIcon} />
              <TextInput
                placeholder="Enter your address"
                placeholderTextColor={Colors.lightgrey2}
                style={styles.inputWithIcon}
              />
            </View>
          </View>
  
          {/* ===== BANK DETAILS SECTION ===== */}
          <Text style={[styles.sectionTitle, {marginTop: hp(3)}]}>Bank Details</Text>
          <Text style={styles.sectionSubtitle}>
            Please fill your bank details for the registration
          </Text>
  
          {/* Account Holder Name */}
          <Text style={styles.label}>Name of the bank account holder</Text>
          <View style={styles.inputBox}>
            <TextInput
              placeholder="eg...."
              placeholderTextColor={Colors.lightgrey2}
              style={styles.input}
            />
          </View>
  
          {/* Account Number */}
          <Text style={styles.label}>Account Number</Text>
          <View style={styles.inputBox}>
            <TextInput
              placeholder="eg...."
              placeholderTextColor={Colors.lightgrey2}
              style={styles.input}
            />
          </View>
  
          {/* IFSC Code */}
          <Text style={styles.label}>IFSC Code</Text>
          <View style={styles.inputBox}>
            <TextInput
              placeholder="eg...."
              placeholderTextColor={Colors.lightgrey2}
              style={styles.input}
            />
          </View>
  
          {/* CVV */}
          <Text style={styles.label}>CVV</Text>
          <View style={styles.inputBox}>
            <TextInput
              placeholder="eg...."
              placeholderTextColor={Colors.lightgrey2}
              style={styles.input}
            />
          </View>
  
          {/* Continue Button */}
          <TouchableOpacity style={styles.continueBtn}>
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
  
        </ScrollView>
      </SafeAreaView>
    );
  };
  
  export default CompleteProfileScreen;
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
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