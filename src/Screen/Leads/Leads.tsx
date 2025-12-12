
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from "react-native";
import React, { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { hp, wp } from "../../assets/commonCSS/GlobalCSS";
import Colors from "../../assets/commonCSS/Colors";
import FSize from "../../assets/commonCSS/FSize";
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
      // Always get vendor_id from API to ensure we have the correct ID
      console.log('🔍 Step 1: Fetching vendor ID from API...');
      const res: any = await getDataWithToken({}, mobile_siteConfig.GET_USER_DETAILS);
      const data: any = await res.json();
      console.log('📋 User Details API Response:', JSON.stringify(data, null, 2));
      
      let id = null;
      
      if (data?.success && data?.vendorDetail?.id) {
        id = String(data.vendorDetail.id);
        // Update AsyncStorage with correct ID
        await AsyncStorage.setItem(mobile_siteConfig.UID, id);
        console.log('✅ Vendor ID from API:', id);
        console.log('✅ Vendor ID saved to AsyncStorage:', id);
      } else {
        // Fallback: try AsyncStorage if API fails
        id = await AsyncStorage.getItem(mobile_siteConfig.UID);
        console.log('⚠️ Vendor ID not in API response, using AsyncStorage:', id);
      }
      
      if (id) {
        setVendorId(id);
        console.log('✅ Final Vendor ID:', id);
        return id;
      }
      console.log('❌ No Vendor ID found');
      return null;
    } catch (error) {
      console.log('❌ Error getting vendor ID from API, trying AsyncStorage...');
      // Fallback to AsyncStorage if API call fails
      const id = await AsyncStorage.getItem(mobile_siteConfig.UID);
      if (id) {
        console.log('✅ Using Vendor ID from AsyncStorage (fallback):', id);
        setVendorId(id);
        return id;
      }
      console.log('❌ Error getting vendor ID:', error);
      return null;
    }
  };

  const getContactList = async (page: number = 1, append: boolean = false) => {
    // Always get fresh vendor ID from API to ensure correct ID
    console.log('🔍 Step 2: Fetching vendor ID...');
    const id = await getVendorId();
    
    if (!id) {
      console.log('❌ Vendor ID not found - cannot fetch contacts');
      setLoadingContacts(false);
      setLoadingMore(false);
      return;
    }
    
    const currentVendorId = id;
    console.log('✅ Using Vendor ID:', currentVendorId);

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

      console.log('📤 Step 3: API Request Details:');
      console.log('   - Endpoint:', mobile_siteConfig.BASE_URL2 + mobile_siteConfig.GET_CONTACT_LIST);
      console.log('   - FormData id:', currentVendorId);
      console.log('   - FormData page:', page);
      console.log('   - FormData limit: 20');

      const result: any = await postDataWithTokenBase2(formData, mobile_siteConfig.GET_CONTACT_LIST);
      
      console.log('📥 Step 4: API Response:');
      console.log('   - Full Response:', JSON.stringify(result, null, 2));
      console.log('   - Response Status:', result?.status);
      console.log('   - Response Message:', result?.msg);
      console.log('   - Has result.data:', !!result?.data);
      console.log('   - Has result.data.records:', !!result?.data?.records);
      console.log('   - result.data.records type:', Array.isArray(result?.data?.records) ? 'Array' : typeof result?.data?.records);
      console.log('   - result.data.records length:', result?.data?.records?.length || 0);

      let newContacts: any[] = [];

      // Handle different response formats
      // Check for result.data.records (actual API response structure)
      if (result?.data?.records && Array.isArray(result.data.records)) {
        newContacts = result.data.records;
        console.log('✅ Step 5: Extracted from result.data.records');
      } else if (result?.success !== undefined) {
        // Response has success field
        if (result.success && Array.isArray(result?.data)) {
          newContacts = result.data;
          console.log('✅ Step 5: Extracted from result.data (with success)');
        } else if (result.success && Array.isArray(result?.contacts)) {
          newContacts = result.contacts;
          console.log('✅ Step 5: Extracted from result.contacts');
        } else if (result.success && Array.isArray(result?.list)) {
          newContacts = result.list;
          console.log('✅ Step 5: Extracted from result.list');
        } else if (Array.isArray(result?.data)) {
          newContacts = result.data;
          console.log('✅ Step 5: Extracted from result.data');
        } else {
          console.log('⚠️ Step 5: No array found in success response');
        }
      } else if (Array.isArray(result?.data)) {
        newContacts = result.data;
        console.log('✅ Step 5: Extracted from result.data');
      } else if (Array.isArray(result?.contacts)) {
        newContacts = result.contacts;
        console.log('✅ Step 5: Extracted from result.contacts');
      } else if (Array.isArray(result?.list)) {
        newContacts = result.list;
        console.log('✅ Step 5: Extracted from result.list');
      } else if (Array.isArray(result)) {
        newContacts = result;
        console.log('✅ Step 5: Extracted from result (direct array)');
      } else {
        console.log('❌ Step 5: No valid array found in response');
        console.log('   - Response keys:', Object.keys(result || {}));
      }

      console.log('📊 Step 6: Final Extracted Contacts:');
      console.log('   - Count:', newContacts.length);
      if (newContacts.length > 0) {
        console.log('   - First contact:', JSON.stringify(newContacts[0], null, 2));
      }

      if (append) {
        // Append new contacts to existing ones
        setContacts(prevContacts => {
          const updated = [...prevContacts, ...newContacts];
          console.log('📝 Step 7: Appended contacts. Total:', updated.length);
          return updated;
        });
      } else {
        // Replace contacts for first page
        setContacts(newContacts);
        console.log('📝 Step 7: Set contacts. Total:', newContacts.length);
      }

      // Check if there are more pages
      if (newContacts.length < 20) {
        setHasMore(false);
        console.log('📄 Step 8: No more pages (less than 20 items)');
      } else {
        setHasMore(true);
        console.log('📄 Step 8: More pages available');
      }

    } catch (error: any) {
      console.log('❌ Step ERROR: Error fetching contact list');
      console.log('   - Error:', error);
      console.log('   - Error Message:', error?.message);
      console.log('   - Error Stack:', error?.stack);
      if (!append) {
        setContacts([]);
      }
    } finally {
      setLoadingContacts(false);
      setLoadingMore(false);
      console.log('✅ Step FINAL: Loading states reset');
    }
  };

  const loadMoreContacts = () => {
    if (!loadingMore && hasMore && !loadingContacts) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      getContactList(nextPage, true);
    }
  };

  // Fetch contacts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setCurrentPage(1);
      setHasMore(true);
      // getContactList will fetch vendor ID internally from API
      getContactList(1, false);
    }, [])
  );

  const renderContactCard = ({ item: contact }: { item: any }) => (
    <View style={styles.card}>
      {/* TITLE */}
      <Text style={styles.title}>
        {contact.project_title || contact.pickup_location || contact.pickupLocation || 'Project Title'} 
        {contact.pickup_location || contact.pickupLocation ? ` to ${contact.dropoff_location || contact.dropoffLocation || 'Dropoff'} ${contact.vehicle_type || contact.vehicleType || ''} Cab` : ''}
      </Text>

      {/* DESCRIPTION */}
      <Text style={styles.desc}>
        {contact.description || contact.desc || contact.project_title 
        || 'The customer wants to book a cab trip.'}
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
          <View>
            <Text style={styles.userName}>
              Name: <Text style={styles.userNameValue}>
                {contact.name || contact.user_name || contact.userName || 'Customer'}
              </Text>
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
          <Text style={styles.phoneValue} numberOfLines={1}>
            {contact.phone || contact.phone_number || contact.phoneNumber || contact.encrypted_mobile || 'N/A'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderHeader = () => (
    <>
      <Text style={styles.headerTitle}>My Leads ({contacts.length})</Text>
      <View style={styles.headerDivider} />
    </>
  );

  const renderFooter = () => {
    if (loadingMore && hasMore) {
      return (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator size="small" color={Colors.sooprsblue} />
          <Text style={styles.loadingMoreText}>Loading more...</Text>
        </View>
      );
    }
    return <View style={{ height: hp(5) }} />;
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No contacts available</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loadingContacts ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.sooprsblue} />
          <Text style={styles.loadingText}>Loading contacts...</Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item, index) => item.id?.toString() || item.contact_id?.toString() || index.toString()}
          renderItem={renderContactCard}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          onEndReached={loadMoreContacts}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={contacts.length === 0 ? { flexGrow: 1 } : {}}
        />
      )}
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
    flex: 1,
  },

  userName: {
    fontSize: FSize.fs13,
    fontWeight: "700",
    color: Colors.black,
  },
  userNameValue: {
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
    flexShrink: 0,
    marginLeft: wp(2),
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
    flexShrink: 0,
    maxWidth: wp(45),
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
