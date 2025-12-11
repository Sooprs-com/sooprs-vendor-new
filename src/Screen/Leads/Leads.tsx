
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { hp, wp } from "../../assets/commonCSS/GlobalCSS";
import Colors from "../../assets/commonCSS/Colors";
import FSize from "../../assets/commonCSS/FSize";
import Images from "../../assets/image";
import { postDataWithTokenBase2, getDataWithToken } from "../../services/mobile-api";
import { mobile_siteConfig } from "../../services/mobile-siteConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MyLeadsScreen = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);

  const getVendorId = async () => {
    try {
      // Try to get vendor_id from AsyncStorage first
      let id = await AsyncStorage.getItem(mobile_siteConfig.UID);
      
      if (!id) {
        // If not in AsyncStorage, get from user details API
        const res: any = await getDataWithToken({}, mobile_siteConfig.GET_USER_DETAILS);
        const data: any = await res.json();
        if (data?.success && data?.vendorDetail?.id) {
          id = String(data.vendorDetail.id);
          await AsyncStorage.setItem(mobile_siteConfig.UID, id);
        }
      }
      
      if (id) {
        setVendorId(id);
        return id;
      }
      return null;
    } catch (error) {
      console.log('Error getting vendor ID:', error);
      return null;
    }
  };

  const getContactList = async (page: number = 1, append: boolean = false) => {
    // Ensure vendor ID is available
    let currentVendorId = vendorId;
    if (!currentVendorId) {
      const id = await getVendorId();
      if (!id) {
        console.log('Vendor ID not found - cannot fetch contacts');
        setLoadingContacts(false);
        setLoadingMore(false);
        return;
      }
      currentVendorId = id;
      setVendorId(id);
    }

    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoadingContacts(true);
      }

      // Create FormData
      const formData = new FormData();
      formData.append('id', currentVendorId);
      formData.append('page', String(page));
      formData.append('limit', '20');

      console.log('Fetching contact list with:', {
        id: currentVendorId,
        page: page,
        limit: 20
      });

      const result: any = await postDataWithTokenBase2(formData, mobile_siteConfig.GET_CONTACT_LIST);
      console.log('Contact list API response (page', page, '):::::', JSON.stringify(result, null, 2));

      let newContacts: any[] = [];

      // Handle different response formats
      // Check for result.data.records (actual API response structure)
      if (result?.data?.records && Array.isArray(result.data.records)) {
        newContacts = result.data.records;
      } else if (result?.success !== undefined) {
        // Response has success field
        if (result.success && Array.isArray(result?.data)) {
          newContacts = result.data;
        } else if (result.success && Array.isArray(result?.contacts)) {
          newContacts = result.contacts;
        } else if (result.success && Array.isArray(result?.list)) {
          newContacts = result.list;
        } else if (Array.isArray(result?.data)) {
          newContacts = result.data;
        }
      } else if (Array.isArray(result?.data)) {
        newContacts = result.data;
      } else if (Array.isArray(result?.contacts)) {
        newContacts = result.contacts;
      } else if (Array.isArray(result?.list)) {
        newContacts = result.list;
      } else if (Array.isArray(result)) {
        newContacts = result;
      }

      console.log('Extracted contacts:', newContacts.length, 'items');

      if (append) {
        // Append new contacts to existing ones
        setContacts(prevContacts => [...prevContacts, ...newContacts]);
      } else {
        // Replace contacts for first page
        setContacts(newContacts);
      }

      // Check if there are more pages
      if (newContacts.length < 20) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

    } catch (error: any) {
      console.log('Error fetching contact list:::::', error);
      console.log('Error details:', error?.message, error?.stack);
      if (!append) {
        setContacts([]);
      }
    } finally {
      setLoadingContacts(false);
      setLoadingMore(false);
    }
  };

  const loadMoreContacts = () => {
    if (!loadingMore && hasMore && !loadingContacts && vendorId) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      getContactList(nextPage, true);
    }
  };

  // Fetch contacts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const id = await getVendorId();
        if (id) {
          setVendorId(id);
          setCurrentPage(1);
          setHasMore(true);
          // Small delay to ensure vendorId state is updated
          setTimeout(() => {
            getContactList(1, false);
          }, 100);
        } else {
          console.log('Failed to get vendor ID on screen focus');
          setLoadingContacts(false);
        }
      };
      fetchData();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <Text style={styles.headerTitle}>My Leads ({contacts.length})</Text>

        <View style={styles.headerDivider} />

        {/* CONTACTS LIST */}
        {loadingContacts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.sooprsblue} />
            <Text style={styles.loadingText}>Loading contacts...</Text>
          </View>
        ) : contacts.length > 0 ? (
          <FlatList
            data={contacts}
            keyExtractor={(item, index) => item.id?.toString() || item.contact_id?.toString() || index.toString()}
            renderItem={({ item: contact }) => (
              <View style={styles.card}>
                {/* TITLE */}
                <Text style={styles.title}>
                  {contact.project_title || contact.pickup_location || contact.pickupLocation || 'Project Title'} 
                  {contact.pickup_location || contact.pickupLocation ? ` to ${contact.dropoff_location || contact.dropoffLocation || 'Dropoff'} ${contact.vehicle_type || contact.vehicleType || ''} Cab` : ''}
                </Text>

                {/* DESCRIPTION */}
                <Text style={styles.desc}>
                  {contact.description || contact.desc || contact.project_title || 'The customer wants to book a cab trip.'}
                </Text>

                {/* BUDGET INFO */}
                {contact.min_budget && contact.max_budget_amount && (
                  <Text style={styles.pickup}>
                    Budget: <Text style={styles.pickupBold}>₹{contact.min_budget} - ₹{contact.max_budget_amount}</Text>
                  </Text>
                )}

                {/* CREATED DATE */}
                {contact.created_at && (
                  <Text style={styles.pickup}>
                    Created: <Text style={styles.pickupBold}>
                      {new Date(contact.created_at).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </Text>
                  </Text>
                )}

                <View style={styles.cardDivider} />
                
                {/* USER ROW */}
                <View style={styles.userRow}>
                  {/* LEFT USER INFO */}
                  <View style={styles.userLeft}>
                    <Image 
                      source={contact.profile_image || contact.profileImage ? { uri: contact.profile_image || contact.profileImage } : Images.profileImage} 
                      style={styles.avatar} 
                    />

                    <View>
                      <Text style={styles.userName}>
                        {contact.name || contact.user_name || contact.userName || 'Customer'}
                      </Text>

                      {contact.city && (
                        <Text style={styles.cityText}>
                          {contact.city}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* RIGHT PHONE NUMBER */}
                  <View style={styles.phoneRight}>
                    <Text style={styles.phoneLabel}>Phone Number</Text>
                    <Text style={styles.phoneValue}>
                      {contact.phone || contact.phone_number || contact.phoneNumber || contact.encrypted_mobile || 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            onEndReached={loadMoreContacts}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => 
              loadingMore ? (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color={Colors.sooprsblue} />
                  <Text style={styles.loadingMoreText}>Loading more...</Text>
                </View>
              ) : null
            }
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No contacts available</Text>
          </View>
        )}

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
    backgroundColor: Colors.lightgrey2,
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
  cityText: {
    fontSize: FSize.fs11,
    color: Colors.grey,
    marginTop: hp(0.3),
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
  loadingContainer: {
    padding: wp(5),
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FSize.fs14,
    color: Colors.grey,
    marginTop: hp(1),
  },
  loadingMoreContainer: {
    padding: wp(5),
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: FSize.fs12,
    color: Colors.grey,
    marginTop: hp(0.5),
  },
  emptyContainer: {
    padding: wp(5),
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FSize.fs14,
    color: Colors.grey,
  },
});
