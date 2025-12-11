import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';

import LinearGradient from 'react-native-linear-gradient';

import {hp, wp, GlobalCss} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import Images from '../../assets/image';
import FSize from '../../assets/commonCSS/FSize';

const HomeVerificationScreen = () => {
    const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* ===== HEADER ===== */}
        <View style={styles.header}>
          <Text style={styles.helloText}>Hello Ankur</Text>

          <View style={styles.headerRight}>
            <TouchableOpacity>
              <Image source={Images.bellIcon} style={styles.bellIcon} />
            </TouchableOpacity>

            <Image
              source={Images.profileImage}
              style={styles.profileImg}
            />
          </View>
        </View>
      <View style={styles.headerDivider} />
        {/* ===== BLUE VERIFICATION CARD ===== */}
       

        <LinearGradient
  colors={['#5D8FF3', '#2B67EC']}
  start={{x: 0, y: 0}}
  end={{x: 1, y: 1}}
  style={styles.card}
>
  <View style={styles.cardTop}>
    <View style={styles.shieldBox}>
      <Image source={Images.shieldIcon} style={styles.shieldIcon} />
    </View>

    <View style={styles.actionBadge}>
      <Text style={styles.actionText}>Action Required</Text>
    </View>
  </View>

  <Text style={styles.cardTitle}>Complete Verification</Text>

  <Text style={styles.cardDesc}>
    Upload your vehicle documents and driving license to start uploading your packages.
  </Text>

  {/* <TouchableOpacity style={styles.profileBtn}>
    <View style={styles.profileBtnRow}>
      <Text style={styles.profileBtnText}>Complete Profile</Text>

      <Image
        source={Images.rightArrowBlue}
        style={styles.arrowIcon}
        resizeMode="contain"
      />
    </View>
  </TouchableOpacity> */}

  <TouchableOpacity 
  style={styles.profileBtn}
  onPress={() => navigation.navigate("CompleteProfileScreen")}
>
  <View style={styles.profileBtnRow}>
    <Text style={styles.profileBtnText}>Complete Profile</Text>

    <Image
      source={Images.rightArrowBlue}
      style={styles.arrowIcon}
      resizeMode="contain"
    />
  </View>
</TouchableOpacity>

</LinearGradient>


        {/* ===== CENTER GRAY ILLUSTRATION IMAGE ===== */}
        <View style={styles.centerBox}>
          <Image
            source={Images.grayVerification}
            style={styles.centerImage}
            resizeMode="contain"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeVerificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  // ===== HEADER =====
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(1.5),
    alignItems: 'center',
  },
  helloText: {
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: Colors.black,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellIcon: {
    width: wp(6),
    height: wp(6),
    marginRight: wp(3),
    tintColor: Colors.yellow,
  },
  profileImg: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(5),
  },

  // ===== BLUE CARD =====
  card: {
    marginHorizontal: wp(5),
    marginTop: hp(3),
    backgroundColor: Colors.sooprsblue,
    padding: wp(5),
    borderRadius: wp(4),
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shieldIcon: {
    width: wp(9),
    height: wp(9),
    tintColor: Colors.white,
  },
  actionBadge: {
   
    paddingHorizontal: wp(4),
  paddingVertical: hp(0.7),
  borderRadius: wp(3),
  backgroundColor: 'rgba(255,255,255,0.18)', // हल्का white-transparent
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.32)',    
  },
  actionText: {
    fontSize: FSize.fs11,
    fontWeight: '600',
    color: Colors.white,
  },

  cardTitle: {
    color: Colors.white,
    fontSize: FSize.fs18,
    fontWeight: '700',
    marginTop: hp(1.5),
  },

  cardDesc: {
    color: Colors.white,
    fontSize: FSize.fs12,
    marginTop: hp(1),
    lineHeight: hp(2.2),
    opacity: 0.9,
  },

  profileBtn: {
    backgroundColor: Colors.white,
    paddingVertical: hp(1.5),
    borderRadius: wp(3),
    alignItems: 'center',
    marginTop: hp(2),
  },
  profileBtnRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
},
headerDivider: {
  width: '100%',
  height: hp(0.1),
  backgroundColor: Colors.lightgrey2, 
  marginTop: hp(0.3),
},

arrowIcon: {
  width: wp(5),     // size adjust
  height: wp(5),
  marginLeft: wp(2),
  tintColor: Colors.sooprsblue,   // same color as text
},

  profileBtnText: {
    color: Colors.sooprsblue,
    fontSize: FSize.fs14,
    fontWeight: '700',
  },

  // ===== CENTER IMAGE =====
  centerBox: {
    alignItems: 'center',
    marginTop: hp(14),
  },
  centerImage: {
    
    width: wp(60),
    height: hp(30),
    opacity: 1,
  },
});
