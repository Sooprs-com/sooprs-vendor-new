
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
} from "react-native";
import React from "react";
import { hp, wp } from "../../assets/commonCSS/GlobalCSS";
import Colors from "../../assets/commonCSS/Colors";
import FSize from "../../assets/commonCSS/FSize";
import Images from "../../assets/image";

const MyLeadsScreen = () => {
  const leads = [1, 2, 3]; // dummy 3 leads

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <Text style={styles.headerTitle}>My Leads (3)</Text>

        <View style={styles.headerDivider} />

        {/* LEADS LIST */}
        {leads.map((_, i) => (
          <View key={i} style={styles.card}>

            {/* TITLE */}
            <Text style={styles.title}>Delhi to Kanpur Sedan Cab</Text>

            {/* DESCRIPTION */}
            <Text style={styles.desc}>
              The customer wants to book an outstation cab for a Delhi to
              Mathura trip and is expecting a smooth ride, punctual driver,
              and a clean vehicle.
            </Text>

            {/* PICKUP DATE */}
            <Text style={styles.pickup}>
              Pickup Date: <Text style={styles.pickupBold}>28 Dec 25</Text>
            </Text>

               <View style={styles.cardDivider} />
            {/* USER ROW */}
            <View style={styles.userRow}>
              
              {/* LEFT USER INFO */}
              <View style={styles.userLeft}>
                <Image source={Images.profileImage} style={styles.avatar} />

                <View>
                  <Text style={styles.userName}>Abhinav Pandey</Text>

                  <View style={styles.ratingRow}>
                    <Image source={Images.starIcon} style={styles.star} />
                    <Text style={styles.ratingText}>4.9</Text>
                  </View>
                </View>
              </View>

              {/* RIGHT PHONE NUMBER */}
              <View style={styles.phoneRight}>
                <Text style={styles.phoneLabel}>Phone Number</Text>
                <Text style={styles.phoneValue}>9777567656</Text>
              </View>

            </View>
          </View>
        ))}

        <View style={{ height: hp(10) }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default MyLeadsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  headerTitle: {
    fontSize: FSize.fs16,
    fontWeight: "700",
    marginLeft: wp(5),
    marginTop: hp(2),
  },

  headerDivider: {
    height: hp(0.12),
    width: "100%",
    backgroundColor: Colors.lightgrey3,
    marginTop: hp(1.2),
    marginBottom: hp(1),
  },

  /* CARD */
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: wp(5),
    marginTop: hp(1.5),
    padding: wp(4),
    borderRadius: wp(3),
    borderWidth: 1,
    borderColor:'#f1f1f1',
    overflow: "hidden",
    // elevation: 3,
  },

  title: {
    fontSize: FSize.fs15,
    fontWeight: "700",
    color: Colors.black,
  },

  desc: {
    fontSize: FSize.fs12,
    marginTop: hp(1),
    lineHeight: hp(2.2),
    color: Colors.grey,
  },

  pickup: {
    marginTop: hp(1.5),
    fontSize: FSize.fs12,
    color: Colors.grey,
  },
  pickupBold: {
    color: Colors.blackgray,
    fontWeight: "600",
  },

  /* Bottom User Row */
  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: hp(2),
    alignItems: "center",
  },

  userLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    marginRight: wp(2),
  },

  userName: {
    fontSize: FSize.fs13,
    fontWeight: "700",
    color: Colors.black,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: hp(0.5),
  },

  star: {
    width: wp(3.5),
    height: wp(3.5),
    tintColor: "#F4C430", // golden star
    marginRight: wp(1),
  },

ratingText: {
    fontSize: FSize.fs12,
    fontWeight: "600",
    color: Colors.gray,
  },

  phoneRight: {
    alignItems: "flex-end",
  },

  phoneLabel: {
    fontSize: FSize.fs11,
    color: Colors.grey,
  },
cardDivider: {

 position: "absolute",
  left: 0,
  right: 0,
  height: hp(0.12),
   marginTop: hp(5.4),
  backgroundColor: "#f1f1f1",
  top: "54%", 
  
},

  phoneValue: {
    fontSize: FSize.fs13,
    fontWeight: "600",
    color: Colors.blackgray,
    marginTop: hp(0.3),
  },
});
