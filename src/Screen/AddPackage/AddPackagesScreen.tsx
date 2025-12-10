// import {
//   StyleSheet,
//   Text,
//   View,
//   TouchableOpacity,
//   TextInput,
//   Image,
//   ScrollView,
//   SafeAreaView,
// } from "react-native";
// import React, { useState } from "react";
// import { hp, wp } from "../../assets/commonCSS/GlobalCSS";
// import Colors from "../../assets/commonCSS/Colors";
// import FSize from "../../assets/commonCSS/FSize";
// import Images from "../../assets/image";

// const AddPackagesScreen = () => {
//   const [selectedInclusions, setSelectedInclusions] = useState({
//     fuel: true,
//     tolls: true,
//     ac: true,
//     water: false,
//     rooftop: false,
//   });

//   const toggleCheckbox = (key) => {
//     setSelectedInclusions({
//       ...selectedInclusions,
//       [key]: !selectedInclusions[key],
//     });
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView showsVerticalScrollIndicator={false}>

//         {/* Header */}
//         <View style={styles.header}>
//           <TouchableOpacity>
//             <Image source={Images.backArrow} style={styles.backIcon} />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>Add Packages</Text>
//         </View>

//         <View style={styles.divider} />

//         {/* Package Name */}
//         <Text style={styles.label}>PACKAGE NAME</Text>
//         <TextInput style={styles.input} placeholder="Delhi" />

//         {/* FROM - TO */}
//         <View style={styles.row}>
//           <View style={styles.col}>
//             <Text style={styles.label}>FROM</Text>
//             <TextInput style={styles.input} placeholder="Delhi" />
//           </View>

//           <View style={styles.col}>
//             <Text style={styles.label}>TO</Text>
//             <TextInput style={styles.input} placeholder="Manali" />
//           </View>
//         </View>

//         {/* Vehicle Type and Fuel Type */}
//         <View style={styles.row}>
//           <View style={styles.col}>
//             <Text style={styles.label}>VEHICLE TYPE 1</Text>
//             <TouchableOpacity style={styles.dropdown}>
//               <Text style={styles.dropdownText}>Sedan</Text>
//               <Image source={Images.downArrow} style={styles.downIcon} />
//             </TouchableOpacity>
//           </View>

//           <View style={styles.col}>
//             <Text style={styles.label}>FUEL TYPE</Text>
//             <TouchableOpacity style={styles.dropdown}>
//               <Text style={styles.dropdownText}>Petrol</Text>
//               <Image source={Images.downArrow} style={styles.downIcon} />
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* SEATS + BAGS */}
//         <View style={styles.row}>
//           <View style={styles.col}>
//             <Text style={styles.label}>
//               TOTAL SEATS <Text style={styles.subLabel}>(Excluding Driver)</Text>
//             </Text>
//             <TextInput style={styles.input} placeholder="5" />
//           </View>

//           <View style={styles.col}>
//             <Text style={styles.label}>TOTAL BAGS</Text>
//             <TextInput style={styles.input} placeholder="4" />
//           </View>
//         </View>

//         {/* Inclusions */}
//         <Text style={[styles.label, { marginTop: hp(1) }]}>INCLUSIONS</Text>

//         <View style={styles.inclusionsRow}>
//           {[
//             { key: "fuel", label: "Fuel" },
//             { key: "tolls", label: "Tolls" },
//             { key: "ac", label: "AC" },
//             { key: "water", label: "Water" },
//             { key: "rooftop", label: "Roof Top" },
//           ].map((item) => (
//             <TouchableOpacity
//               key={item.key}
//               style={[
//                 styles.chip,
//                 selectedInclusions[item.key] && styles.chipSelected,
//               ]}
//               onPress={() => toggleCheckbox(item.key)}
//             >
//               <View
//                 style={[
//                   styles.checkbox,
//                   selectedInclusions[item.key] && styles.checkboxChecked,
//                 ]}
//               />
//               <Text style={styles.chipText}>{item.label}</Text>
//             </TouchableOpacity>
//           ))}
//         </View>

//         {/* Total Price */}
//         <Text style={styles.label}>TOTAL PRICE</Text>
//         <TextInput style={styles.input} placeholder="5,499" />

//         {/* Continue Button */}
//         <TouchableOpacity style={styles.submitBtn}>
//           <Text style={styles.submitText}>Add Package</Text>
//         </TouchableOpacity>

//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// export default AddPackagesScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.white,
//   },

//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: wp(5),
//     paddingVertical: hp(2),
//   },
//   backIcon: {
//     width: wp(5),
//     height: wp(5),
//     tintColor: Colors.black,
//   },
//   headerTitle: {
//     fontSize: FSize.fs16,
//     fontWeight: "600",
//     marginLeft: wp(4),
//   },
//   divider: {
//     width: "100%",
//     height: hp(0.1),
//     backgroundColor: Colors.lightgrey3,
//   },

//   label: {
//     fontSize: FSize.fs13,
//     fontWeight: "600",
//     marginTop: hp(2),
//     marginLeft: wp(5),
//     color: Colors.black,
//   },
//   subLabel: {
//     fontSize: FSize.fs10,
//     color: Colors.grey,
//   },

//   input: {
//     width: "90%",
//     alignSelf: "center",
//     paddingVertical: hp(1.8),
//     paddingHorizontal: wp(3),
//     borderWidth: 1,
//     borderColor: Colors.lightgrey2,
//     borderRadius: wp(2),
//     marginTop: hp(0.8),
//     fontSize: FSize.fs14,
//   },

//   row: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     width: "90%",
//     alignSelf: "center",
//   },

//   col: {
//     width: "47%",
//   },

//   dropdown: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: Colors.lightgrey2,
//     borderRadius: wp(2),
//     paddingVertical: hp(1.6),
//     paddingHorizontal: wp(3),
//     marginTop: hp(0.8),
//   },
//   dropdownText: {
//     fontSize: FSize.fs14,
//     color: Colors.black,
//   },
//   downIcon: {
//     width: wp(4),
//     height: wp(4),
//     tintColor: Colors.black,
//   },

//   inclusionsRow: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     width: "90%",
//     alignSelf: "center",
//     marginTop: hp(1),
//   },

//   chip: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: Colors.lightgrey2,
//     borderRadius: wp(2),
//     paddingVertical: hp(0.8),
//     paddingHorizontal: wp(3),
//     marginRight: wp(2),
//     marginBottom: hp(1),
//   },

//   chipSelected: {
//     backgroundColor: Colors.lightblue,
//     borderColor: Colors.sooprsblue,
//   },

//   checkbox: {
//     width: wp(3.5),
//     height: wp(3.5),
//     borderWidth: 1,
//     borderRadius: wp(1),
//     borderColor: Colors.grey,
//     marginRight: wp(2),
//   },
//   checkboxChecked: {
//     backgroundColor: Colors.sooprsblue,
//     borderColor: Colors.sooprsblue,
//   },

//   chipText: {
//     fontSize: FSize.fs13,
//     fontWeight: "500",
//   },

//   submitBtn: {
//     width: "90%",
//     alignSelf: "center",
//     backgroundColor: Colors.sooprsblue,
//     paddingVertical: hp(2),
//     borderRadius: wp(3),
//     marginTop: hp(3),
//     marginBottom: hp(4),
//   },
//   submitText: {
//     color: Colors.white,
//     textAlign: "center",
//     fontSize: FSize.fs16,
//     fontWeight: "600",
//   },
// });


import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  SafeAreaView,
} from "react-native";
import React, { useState } from "react";
import { hp, wp } from "../../assets/commonCSS/GlobalCSS";
import Colors from "../../assets/commonCSS/Colors";
import FSize from "../../assets/commonCSS/FSize";
import Images from "../../assets/image";

const AddPackagesScreen = () => {
  const [vehicleType, setVehicleType] = useState("Sedan");
  const [fuelType, setFuelType] = useState("Petrol");

  const [openVehicle, setOpenVehicle] = useState(false);
  const [openFuel, setOpenFuel] = useState(false);

  const vehicleOptions = ["Sedan", "SUV", "Hatchback"];
  const fuelOptions = ["Petrol", "Diesel", "CNG"];

  const [inc, setInc] = useState({
    fuel: true,
    tolls: true,
    ac: true,
    water: false,
    rooftop: false,
  });

  const toggleInc = (key) => {
    setInc({ ...inc, [key]: !inc[key] });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
   {/* <TouchableOpacity style={styles.backBtn}>
  <View style={styles.backArrow} />
</TouchableOpacity> */}
 <TouchableOpacity>
            <Image source={Images.backArrow} style={styles.backIcon} />
           </TouchableOpacity>


          <Text style={styles.headerTitle}>Add Packages</Text>
        </View>

        <View style={styles.divider} />

        {/* PACKAGE NAME */}
        <Text style={styles.label}>PACKAGE NAME</Text>
        <TextInput style={styles.input} placeholder="Delhi" />

        {/* FROM / TO */}
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>FROM</Text>
            <TextInput style={styles.input} placeholder="Delhi" />
          </View>

          <View style={styles.col}>
            <Text style={styles.label}>TO</Text>
            <TextInput style={styles.input} placeholder="Manali" />
          </View>
        </View>

        {/* VEHICLE TYPE / FUEL TYPE */}
        <View style={styles.row}>

          {/* VEHICLE TYPE */}
          <View style={styles.col}>
            <Text style={styles.label}>VEHICLE TYPE 1</Text>

            <TouchableOpacity
              style={styles.dropdownBox}
              onPress={() => {
                setOpenVehicle(!openVehicle);
                setOpenFuel(false);
              }}
            >
              <Text style={styles.dropdownText}>{vehicleType}</Text>

              <View style={styles.arrowBox}>
                <View style={styles.arrowDown} />
              </View>
            </TouchableOpacity>

            {openVehicle && (
              <View style={styles.dropdownList}>
                {vehicleOptions.map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setVehicleType(v);
                      setOpenVehicle(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* FUEL TYPE */}
          <View style={styles.col}>
            <Text style={styles.label}>FUEL TYPE</Text>

            <TouchableOpacity
              style={styles.dropdownBox}
              onPress={() => {
                setOpenFuel(!openFuel);
                setOpenVehicle(false);
              }}
            >
              <Text style={styles.dropdownText}>{fuelType}</Text>

              <View style={styles.arrowBox}>
                <View style={styles.arrowDown} />
              </View>
            </TouchableOpacity>

            {openFuel && (
              <View style={styles.dropdownList}>
                {fuelOptions.map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setFuelType(f);
                      setOpenFuel(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* SEATS + BAGS */}
        <View style={styles.row}>
          <View style={styles.col}>
            {/* <Text style={styles.label}>
              TOTAL SEATS <Text style={styles.subLabel}>(Excluding Driver)</Text>
            </Text> */}
            <Text style={styles.label}>
  TOTAL SEATS 
  <Text style={styles.excludingText}> (Excluding Driver)</Text>
</Text>

            <TextInput style={styles.input} placeholder="5" />
          </View>

          <View style={styles.col}>
            <Text style={styles.label}>TOTAL BAGS</Text>
            <TextInput style={styles.input} placeholder="4" />
          </View>
        </View>

        {/* INCLUSIONS */}
        <Text style={[styles.label, { marginTop: hp(1) }]}>INCLUSIONS</Text>

        <View style={styles.inclusionRow}>
          {[
            { key: "fuel", label: "Fuel" },
            { key: "tolls", label: "Tolls" },
            { key: "ac", label: "AC" },
            { key: "water", label: "Water" },
            { key: "rooftop", label: "Roof Top" },
          ].map((item) => {
            const selected = inc[item.key];
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.chip,
                  selected && styles.chipSelected,
                ]}
                onPress={() => toggleInc(item.key)}
              >
                {/* WHITE TICK WITHOUT IMAGE */}
                <View style={[styles.tickBox, selected && styles.tickOn]}>
                  {selected && <View style={styles.tickMark} />}
                </View>

                <Text style={styles.chipText}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* PRICE */}
        <Text style={styles.label}>TOTAL PRICE</Text>
        <TextInput style={styles.input} placeholder="5,499" />

        {/* BUTTON */}
        <TouchableOpacity style={styles.submitBtn}>
          <Text style={styles.submitText}>Add Package</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

export default AddPackagesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  // HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
  },
  backCircle: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    backgroundColor: "#f1f1f1",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowLeft: {
    width: wp(3),
    height: wp(3),
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#000",
    transform: [{ rotate: "45deg" }],
  },
  headerTitle: {
    fontSize: FSize.fs16,
    fontWeight: "600",
    marginLeft: wp(4),
  },
  divider: {
    height: hp(0.1),
    backgroundColor: Colors.lightgrey3,
  },

  // LABELS
  label: {
    fontSize: FSize.fs13,
    fontWeight: "600",
    marginLeft: wp(5),
    marginTop: hp(2),
  },
  subLabel: {
    fontSize: FSize.fs10,
    color: Colors.grey,
  },

  // INPUT
  input: {
    width: "90%",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: Colors.lightgrey2,
    borderRadius: wp(2),
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(3),
    marginTop: hp(0.8),
  },

  // ROW LAYOUT
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    alignSelf: "center",
  },
  col: { width: "47%" },

  // DROPDOWN
  dropdownBox: {
    borderWidth: 1,
    borderColor: Colors.lightgrey2,
    borderRadius: wp(2),
    paddingVertical: hp(1.6),
    paddingHorizontal: wp(3),
    marginTop: hp(0.8),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: { fontSize: FSize.fs14 },

  arrowBox: {
    width: wp(7),
    height: wp(7),
    backgroundColor: "#eee",
    borderRadius: wp(2),
    alignItems: "center",
    justifyContent: "center",
  },
  arrowDown: {
    width: wp(3),
    height: wp(3),
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#333",
    transform: [{ rotate: "45deg" }],
  },
backBtn: {
  paddingHorizontal: wp(2),
  paddingVertical: hp(1),
  justifyContent: "center",
  alignItems: "center",
},

backArrow: {
  width: wp(3.5),
  height: wp(3.5),
  borderLeftWidth: 2,
  borderBottomWidth: 2,
  borderColor: "#000",
  transform: [{ rotate: "45deg" }],
  marginLeft: wp(1),
},

  dropdownList: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightgrey2,
    borderRadius: wp(2),
    marginTop: hp(0.5),
  },
  dropdownItem: {
    paddingVertical: hp(1.3),
    paddingHorizontal: wp(3),
  },
  dropdownItemText: {
    fontSize: FSize.fs14,
  },

  // INCLUSIONS
  inclusionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "90%",
    alignSelf: "center",
    marginTop: hp(1),
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.lightgrey2,
    borderRadius: wp(2),
    paddingVertical: hp(0.7),
    paddingHorizontal: wp(3),
    marginRight: wp(2),
    marginBottom: hp(1),
  },
  chipSelected: {
    backgroundColor: "#DDEAFF",
    borderColor: Colors.sooprsblue,
  },
  tickBox: {
    width: wp(4),
    height: wp(4),
    borderRadius: wp(1),
    borderWidth: 1,
    borderColor: Colors.grey,
    alignItems: "center",
    justifyContent: "center",
    marginRight: wp(1),
  },
  tickOn: {
    backgroundColor: Colors.sooprsblue,
    borderColor: Colors.sooprsblue,
  },
  // LABEL FIX
excludingText: {
  fontSize: FSize.fs11,
  color: Colors.sooprsblue,   // BLUE TEXT
},

// BACK ARROW BUTTON AREA
// backBtn: {
//   width: wp(9),
//   height: wp(9),
//   justifyContent: "center",
// },
backButton: {
  padding: wp(2),
  paddingLeft: 0,
},

// backArrow: {
//   fontSize: FSize.fs22,   // बिल्कुल iOS जैसा बड़ा पतला arrow
//   color: Colors.black,
//   fontWeight: '300',
//   marginTop: hp(0.3),
// },

// LONG STRAIGHT ARROW LIKE FIGMA
backArrow: {
  width: wp(4.5),
  height: wp(4.5),
  borderLeftWidth: 2,
  borderBottomWidth: 2,
  borderColor: Colors.black,
  transform: [{ rotate: "45deg" }],
  marginLeft: wp(1),
},
backBtn: {
  padding: wp(2),
  justifyContent: "center",
  alignItems: "flex-start",
},

iosBackArrow: {
  width: wp(4.5),
  height: wp(4.5),
  borderLeftWidth: 2.3,
  borderBottomWidth: 2.3,
  borderColor: Colors.black,
  transform: [{ rotate: "45deg" }],
  marginLeft: wp(1),
},

  tickMark: {
    width: wp(2),
    height: wp(1),
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: "white",
    transform: [{ rotate: "-45deg" }],
  },
  chipText: {
    fontSize: FSize.fs13,
  },

  // BUTTON
  submitBtn: {
    width: "90%",
    alignSelf: "center",
    backgroundColor: Colors.sooprsblue,
    paddingVertical: hp(2),
    borderRadius: wp(3),
    marginTop: hp(3),
    marginBottom: hp(4),
  },
   backIcon: {
    width: wp(5),
    height: wp(5),
    tintColor: Colors.black,
  },
  submitText: {
    textAlign: "center",
    fontSize: FSize.fs16,
    color: Colors.white,
    fontWeight: "600",
  },
});
