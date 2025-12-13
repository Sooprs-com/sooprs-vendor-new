
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
    // Return cached vendor ID if available
    if (vendorId) {
      return vendorId;
    }

    try {
      // Try AsyncStorage first (faster)
      const cachedId = await AsyncStorage.getItem(mobile_siteConfig.UID);
      if (cachedId) {
        setVendorId(cachedId);
        return cachedId;
      }

      // Fetch from API if not cached
      const res: any = await getDataWithToken({}, mobile_siteConfig.GET_USER_DETAILS);
      const data: any = await res.json();
      
      if (data?.success && data?.vendorDetail?.id) {
        const id = String(data.vendorDetail.id);
        await AsyncStorage.setItem(mobile_siteConfig.UID, id);
        setVendorId(id);
        return id;
      } else if (cachedId) {
        setVendorId(cachedId);
        return cachedId;
      }
      
      return null;
    } catch (error) {
      // Fallback to AsyncStorage if API call fails
      const cachedId = await AsyncStorage.getItem(mobile_siteConfig.UID);
      if (cachedId) {
        setVendorId(cachedId);
        return cachedId;
      }
      return null;
    }
  };

  const getContactList = async (page: number = 1, append: boolean = false) => {
    const id = await getVendorId();
    
    if (!id) {
      setLoadingContacts(false);
      setLoadingMore(false);
      return;
    }
    
    const currentVendorId = id;

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

      const result: any = await postDataWithTokenBase2(formData, mobile_siteConfig.GET_CONTACT_LIST);
      
      let newContacts: any[] = [];

      // Handle different response formats
      if (result?.data?.records && Array.isArray(result.data.records)) {
        newContacts = result.data.records;
      } else if (result?.success !== undefined) {
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

      if (append) {
        setContacts(prevContacts => [...prevContacts, ...newContacts]);
      } else {
        setContacts(newContacts);
      }

      // Check if there are more pages
      setHasMore(newContacts.length >= 20);

    } catch (error: any) {
      if (!append) {
        setContacts([]);
      }
    } finally {
      setLoadingContacts(false);
      setLoadingMore(false);
    }
  };

  const loadMoreContacts = useCallback(() => {
    if (!loadingMore && hasMore && !loadingContacts) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      getContactList(nextPage, true);
    }
  }, [loadingMore, hasMore, loadingContacts, currentPage]);

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
      {/* <Text style={styles.desc}>
        {contact.description || contact.desc || contact.project_title 
        || 'The customer wants to book a cab trip.'}
      </Text> */}

      {/* BUDGET INFO */}
      {contact.min_budget && contact.max_budget_amount && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Budget:</Text>
          <Text style={styles.infoValue}>${contact.min_budget} - ${contact.max_budget_amount}</Text>
        </View>
      )}

      {/* CREATED DATE */}
      {contact.created_at && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Created:</Text>
          <Text style={styles.infoValue}>
            {new Date(contact.created_at).toLocaleDateString('en-IN', { 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric' 
            })}
          </Text>
        </View>
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
  container: { flex: 1, 
    backgroundColor: Colors.white,
    paddingTop: hp(3),
  },

  headerTitle: {
    fontSize: FSize.fs16,
    fontWeight: "700",
    marginLeft: wp(5),
    marginTop: hp(2),
  },

  headerDivider: {
    height: hp(0.1),
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
    marginBottom: hp(0.5),
    padding: wp(4),
    borderRadius: wp(3),
    borderWidth: 1,
    borderColor: Colors.lightgrey2,
    overflow: "hidden",
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
    marginTop: hp(1.2),
    fontSize: FSize.fs12,
    color: Colors.grey,
  },
  pickupBold: {
    color: Colors.darkblack,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(1.2),
  },
  infoLabel: {
    fontSize: FSize.fs12,
    color: Colors.darkblack,
    fontWeight: "600",
    marginRight: wp(1.5),
  },
  infoValue: {
    fontSize: FSize.fs12,
    color: Colors.darkblack,
    fontWeight: "700",
    flex: 1,
  },

  /* Bottom User Row */
  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: hp(1.5),
    alignItems: "flex-start",
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
    height: hp(0.1),
    width: "100%",
    backgroundColor: Colors.lightgrey2,
    marginTop: hp(1.5),
    marginBottom: hp(0.5),
  },

  phoneValue: {
    fontSize: FSize.fs13,
    fontWeight: "600",
    color: Colors.darkblack,
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
