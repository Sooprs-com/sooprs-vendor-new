
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Linking,
} from "react-native";
import React, { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { hp, wp } from "../../assets/commonCSS/GlobalCSS";
import Colors from "../../assets/commonCSS/Colors";
import FSize from "../../assets/commonCSS/FSize";
import { postDataWithTokenBase2, getDataWithToken } from "../../services/mobile-api";
import { mobile_siteConfig } from "../../services/mobile-siteConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Images from "../../assets/image";

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

  const handleWhatsApp = (phone: string) => {
    const phoneNumber = phone.replace(/[^0-9]/g, ''); // Remove non-numeric characters
    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}`;
    Linking.openURL(whatsappUrl).catch(() => {
      // If WhatsApp is not installed, try web version
      const webUrl = `https://wa.me/${phoneNumber}`;
      Linking.openURL(webUrl);
    });
  };

  const handleCall = (phone: string) => {
    const phoneNumber = phone.replace(/[^0-9]/g, ''); // Remove non-numeric characters
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-IN', { month: 'long' });
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `Posted on ${day} ${month}, ${year} at ${displayHours}:${displayMinutes}${ampm}`;
  };

  const renderContactCard = ({ item: contact }: { item: any }) => {
    const phone = contact.phone || contact.phone_number || contact.phoneNumber || contact.encrypted_mobile || '';
    const name = contact.name || contact.user_name || contact.userName || 'Customer';
    const location = contact.city || contact.pickup_location || contact.pickupLocation || contact.location || '';
    const minBudget = contact.min_budget || contact.min_budget_amount || '';
    const maxBudget = contact.max_budget_amount || contact.max_budget || '';
    const title = contact.project_title || contact.pickup_location || contact.pickupLocation || 'Project Title';
    const fullTitle = contact.pickup_location || contact.pickupLocation 
      ? `${title} to ${contact.dropoff_location || contact.dropoffLocation || 'Dropoff'} ${contact.vehicle_type || contact.vehicleType || ''} Cab`
      : title;

    return (
      <View style={styles.card}>
        {/* TITLE */}
        <Text style={styles.title}>
          {fullTitle}
        </Text>

        {/* BUDGET INFO */}
        {minBudget && maxBudget && (
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Budget range: </Text>
            <Text style={styles.budgetValue}>
              ₹{typeof minBudget === 'number' ? minBudget.toLocaleString('en-IN') : minBudget} - ₹{typeof maxBudget === 'number' ? maxBudget.toLocaleString('en-IN') : maxBudget}
            </Text>
          </View>
        )}

        {/* CREATED DATE */}
        {contact.created_at && (
          <Text style={styles.dateText}>
            {formatDate(contact.created_at)}
          </Text>
        )}

        {/* USER NAME */}
        <View style={styles.nameRow}>
          <Text style={styles.nameLabel}>Name: </Text>
          <Text style={styles.nameValue}>{name}</Text>
        </View>

        {/* LOCATION */}
        {location && (
          <View style={styles.locationRow}>
            <Image source={Images.locatioPinIcon} style={styles.locationIcon} />
            <Text style={styles.locationText}>{location}</Text>
          </View>
        )}

        {/* ACTION BUTTONS */}
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.whatsappButton}
            onPress={() => phone && handleWhatsApp(phone)}
            activeOpacity={0.7}
          >
            <Image source={Images.whatsAppIcon} style={styles.whatsappIcon} />
            <Text style={styles.whatsappText}>Whatsapp</Text>
            
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => phone && handleCall(phone)}
            activeOpacity={0.7}
          >
            <Image source={Images.phoneIcon} style={styles.contactIcon} />
            <Text style={styles.contactText}>Contact</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
    marginTop: hp(2),
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
    marginBottom: hp(1),
  },

  budgetRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: hp(0.5),
    marginBottom: hp(0.5),
    flexWrap: "wrap",
  },

  budgetLabel: {
    fontSize: FSize.fs14,
    fontWeight: "400",
    color: Colors.grey,
  },

  budgetValue: {
    fontSize: FSize.fs14,
    fontWeight: "700",
    color: Colors.black,
  },

  dateText: {
    fontSize: FSize.fs12,
    color: Colors.grey,
    marginTop: hp(0.5),
    marginBottom: hp(1),
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: hp(0.5),
    marginBottom: hp(0.5),
    flexWrap: "wrap",
  },

  nameLabel: {
    fontSize: FSize.fs14,
    fontWeight: "400",
    color: Colors.grey,
  },

  nameValue: {
    fontSize: FSize.fs14,
    fontWeight: "700",
    color: Colors.black,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: hp(0.3),
    marginBottom: hp(1.5),
  },

  locationIcon: {
    width: wp(4),
    height: wp(4),
    marginRight: wp(2),
  },

  locationText: {
    fontSize: FSize.fs12,
    color: Colors.grey,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: hp(1),
  },

  whatsappButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightgrey2,
    borderRadius: wp(3),
    paddingVertical: hp(1.4),
    paddingHorizontal: wp(3),
    marginRight: wp(1.5),
  },

  whatsappIcon: {
    width: wp(5),
    height: wp(5),
    marginRight: wp(2),
  },

  whatsappText: {
    fontSize: FSize.fs13,
    fontWeight: "600",
    color: Colors.black,
  },

  contactButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.sooprsblue,
    borderRadius: wp(3),
    paddingVertical: hp(1.4),
    paddingHorizontal: wp(3),
    marginLeft: wp(1.5),
  },

  contactIcon: {
    width: wp(5),
    height: wp(5),
    marginRight: wp(2),
    tintColor: Colors.white,
  },

  contactText: {
    fontSize: FSize.fs13,
    fontWeight: "700",
    color: Colors.white,
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
