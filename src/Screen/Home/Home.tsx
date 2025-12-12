import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import React, {useEffect, useState, useCallback} from 'react';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {hp, wp, GlobalCss} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import Images from '../../assets/image';
import FSize from '../../assets/commonCSS/FSize';
import { getDataWithToken, postDataWithTokenBase2 } from '../../services/mobile-api';
import { mobile_siteConfig } from '../../services/mobile-siteConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Home = () => {
  const navigation = useNavigation();
  const [userName, setUserName] = useState('');
  const [totalEarnings, setTotalEarnings] = useState('10,550');
  const [activeTrips, setActiveTrips] = useState(8);
  const [rating, setRating] = useState(4.9);

  const [leads, setLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [categoryId, setCategoryId] = useState<string>('1');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [status, setStatus] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedLeads, setExpandedLeads] = useState<Set<string | number>>(new Set());
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [contactDetails, setContactDetails] = useState<any>(null);
  const [loadingContact, setLoadingContact] = useState(false);
  const [loadingUserDetails, setLoadingUserDetails] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const getUserDetails = async () => {
    try {
      setLoadingUserDetails(true);
      const res: any = await getDataWithToken({}, mobile_siteConfig.GET_USER_DETAILS);
      const data: any = await res.json();
      console.log('User details data:::::', data);
      
      // Check if profile is completed
      if (data?.success && data?.vendorDetail) {
        const isProfileCompleted = data.vendorDetail.is_profile_completed;
        
        // Set stats data
        if (data.stats) {
          setStatus(data.stats);
        }
        
        // Update user name from API response
        if (data.vendorDetail.name) {
          setUserName(data.vendorDetail.name);
        } else {
          setUserName('User');
        }
        
        // Set profile image from API response
        if (data.vendorDetail.image) {
          setProfileImage(data.vendorDetail.image);
        }
        
        // Get category_id from vendor profile
        if (data.vendorDetail.category_id) {
          setCategoryId(String(data.vendorDetail.category_id));
        }
        
        // If profile is not completed (0), replace with HomeVerification screen
        if (isProfileCompleted === 0) {
          (navigation as any).replace('HomeVerification');
        }
        // If profile is completed (1), stay on Home screen (already here)
      }
    } catch (err: any) {
      console.log('Error fetching user details:::::', err);
      setUserName('User');
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const getLeads = async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoadingLeads(true);
      }
      
      const payload = {
        category: categoryId,
        page: page,
        limit: 20,
        cur: "INR"
      };
      
      const result: any = await postDataWithTokenBase2(payload, mobile_siteConfig.FILTER_LEADS_ALL);
      console.log('Leads API response (page', page, '):::::', result);
      
      let newLeads: any[] = [];
      
      if (result?.success && Array.isArray(result?.data)) {
        newLeads = result.data;
      } else if (result?.data && Array.isArray(result.data)) {
        newLeads = result.data;
      } else if (Array.isArray(result)) {
        newLeads = result;
      } else {
        console.log('Invalid leads response format:', result);
        newLeads = [];
      }
      
      if (append) {
        // Append new leads to existing ones
        setLeads(prevLeads => [...prevLeads, ...newLeads]);
      } else {
        // Replace leads for first page
        setLeads(newLeads);
      }
      
      // Check if there are more pages
      if (newLeads.length < 20) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      
    } catch (error: any) {
      console.log('Error fetching leads:::::', error);
      if (!append) {
        setLeads([]);
      }
    } finally {
      setLoadingLeads(false);
      setLoadingMore(false);
    }
  };

  const loadMoreLeads = () => {
    if (!loadingMore && hasMore && !loadingLeads) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      getLeads(nextPage, true);
    }
  };

  const toggleDescription = (leadId: string | number) => {
    setExpandedLeads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  const openContactModal = (lead: any) => {
    console.log('Opening contact modal for lead:', lead);
    setSelectedLead(lead);
    setContactDetails(null);
    setShowContactModal(true);
    console.log('Modal state set to true');
  };

  const closeContactModal = () => {
    setShowContactModal(false);
    setSelectedLead(null);
    setContactDetails(null);
  };

  const getContactDetails = async () => {
    if (!selectedLead) return;
    
    try {
      setLoadingContact(true);
      const leadId = selectedLead.id || selectedLead.lead_id || selectedLead.leadId;
      
      // Create URL-encoded data
      const formData = `id=${encodeURIComponent(leadId)}`;
      
      const token = await AsyncStorage.getItem(mobile_siteConfig.MOB_ACCESS_TOKEN_KEY);
      
      const response = await fetch(mobile_siteConfig.BASE_URL2 + mobile_siteConfig.SHOW_LEAD_MOBILE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      const result = await response.json();
      console.log('Contact details API response:', result);
      
      // API should return mobile_number directly (decoded)
      // If encrypted_mobile_number exists, use it as mobile_number
      if (result.encrypted_mobile_number && !result.mobile_number && !result.mobile) {
        result.mobile_number = result.encrypted_mobile_number;
      }
      
      setContactDetails(result);
    } catch (error: any) {
      console.log('Error fetching contact details:', error);
      Alert.alert('Error', error?.message || 'Failed to fetch contact details');
    } finally {
      setLoadingContact(false);
    }
  };

  // Check profile status and fetch leads when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        await getUserDetails();
        // Reset pagination when screen comes into focus
        setCurrentPage(1);
        setHasMore(true);
        // Small delay to ensure categoryId state is updated
        setTimeout(() => {
          getLeads(1, false);
        }, 100);
      };
      fetchData();
    }, [])
  );

  // Get image URI helper function
  const getImageUri = (imagePath: string | null): any => {
    if (imagePath) {
      // const baseUrl = mobile_siteConfig.BASE_URL.replace('/api/', '');
      return { uri:  imagePath };
    }
    return Images.profileImage;
  };

  // Show loader while user details are loading
  if (loadingUserDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.userDetailsLoadingContainer}>
          <ActivityIndicator size="large" color={Colors.sooprsblue} />
          <Text style={styles.userDetailsLoadingText}>Loading user details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    
    if (isCloseToBottom && hasMore && !loadingMore && !loadingLeads) {
      loadMoreLeads();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
    <ScrollView 
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={400}
    >
      

      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <Text style={styles.helloText}>Hello {userName || 'User'}</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity>
            <Image source={Images.bellIcon} style={styles.bellIcon} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('ProfileScreen' as never)}>
            <Image source={getImageUri(profileImage)} style={styles.profileImg} />
          </TouchableOpacity>
        </View>
      </View>


      <View style={styles.headerDivider} />


      {/* ================= STATS BOX ================= */}

      <View style={styles.statsRow}>

        {/* Earnings */}
        <View style={styles.statCard}>
          <Image source={Images.walletIcon} style={styles.statIcon} />
          <Text style={styles.statValue}>₹ {status?.wallet_balance || '0'}</Text>
          <Text style={styles.statLabel}>Wallet Balance</Text>
        </View>

        {/* Active Trips */}
        <View style={styles.statCard}>
          <Image source={Images.activeTripIcon} style={styles.statIcon} />
          <Text style={styles.statValue}>{status?.total_orders || '0'}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>

        {/* Rating */}
        <View style={styles.statCard}>
          <Image source={Images.ratingStar} style={styles.statIcon} />
          <Text style={styles.statValue}>{status?.total_leads || '0'}</Text>
          <Text style={styles.statLabel}>Total leads</Text>
        </View>
      </View>


      {/* ================= ADD PACKAGE LISTING ================= */}
      <TouchableOpacity style={styles.addListingBtn}
          onPress={() => (navigation as any).navigate("AddPackagesScreen")}
>
        <Text style={styles.addText}>+   Add New Package Listing</Text>
      </TouchableOpacity>


      {/* ================= REQUESTS TITLE ================= */}
      <Text style={styles.reqTitle}>Requests</Text>

      {/* ================= EACH REQUEST CARD ================= */}
      {loadingLeads ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.sooprsblue} />
          <Text style={styles.loadingText}>Loading leads...</Text>
        </View>
      ) : leads.length > 0 ? (
        <>
          {leads.map((lead, index) => {
            const leadId = lead.id || lead.lead_id || lead.leadId;
            const isExpanded = expandedLeads.has(leadId);
            const description = lead.description || lead.desc || 'The customer wants to book a cab trip.';
            const maxBudget = lead.max_budget_amount || lead.maxBudgetAmount || lead.max_budget || 'N/A';
            // Check if description needs truncation (more than 4 lines or very long)
            const lineCount = description.split('\n').length;
            const shouldTruncate = lineCount > 4 || description.length > 300;

            return (
              <View key={leadId?.toString() || index.toString()} style={styles.reqCard}>
                <Text style={styles.reqTitle2}>
                  {lead.project_title || lead.projectTitle || 'Project Title'}
                </Text>

                <Text style={styles.reqDesc} numberOfLines={isExpanded ? undefined : 4}>
                  {description}
                </Text>

                {shouldTruncate && (
                  <TouchableOpacity 
                    onPress={() => toggleDescription(leadId)}
                    style={styles.moreButton}
                  >
                    <Text style={styles.moreText}>
                      {isExpanded ? 'Less' : 'More'}
                    </Text>
                  </TouchableOpacity>
                )}
                
                <View style={styles.Desc}>
                  <Text style={[styles.reqDesc, {marginTop: 10, fontWeight: '600', color: Colors.gray}]}>Max Amount: </Text>
                  <Text style={styles.reqDate}>
                    ₹{typeof maxBudget === 'number' ? maxBudget.toLocaleString('en-IN') : maxBudget}
                  </Text>
                </View>
               
                <TouchableOpacity 
                  style={styles.getContactBtn}
                  onPress={() => {
                    console.log('Button pressed for lead:', lead);
                    openContactModal(lead);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.getContactText}>Get Contact Details</Text>
                </TouchableOpacity>
              </View>
            );
          })}
          {loadingMore && (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color={Colors.sooprsblue} />
              <Text style={styles.loadingMoreText}>Loading more...</Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No leads available</Text>
        </View>
      )}

    </ScrollView>

        {/* Contact Details Modal */}
        <Modal
          visible={showContactModal}
          transparent={true}
          animationType="slide"
          onRequestClose={closeContactModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Contact Details</Text>
              
              {selectedLead && (
                <>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalLabel}>Project Title:</Text>
                    <Text style={styles.modalValue}>
                      {selectedLead.project_title || selectedLead.projectTitle || 'N/A'}
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalLabel}>Credit:</Text>
                    <Text style={styles.modalValue}>
                      ₹{selectedLead.price1 || selectedLead.price || 'N/A'}
                    </Text>
                  </View>
                </>
              )}

              {contactDetails && (
                <View style={styles.contactDetailsContainer}>
                  <Text style={styles.contactDetailsTitle}>Contact Information:</Text>
                  
                  {/* Mobile Number - decode encrypted_mobile_number */}
                  {(contactDetails.mobile || contactDetails.mobile_number || contactDetails.encrypted_mobile_number) && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalLabel}>Mobile Number:</Text>
                      <Text style={styles.modalValue}>
                        {contactDetails.mobile || contactDetails.mobile_number || contactDetails.encrypted_mobile_number}
                      </Text>
                    </View>
                  )}
                  
                  {/* Email */}
                  {contactDetails.email && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalLabel}>Email:</Text>
                      <Text style={styles.modalValue}>{contactDetails.email}</Text>
                    </View>
                  )}
                  
                  {/* Name */}
                  {contactDetails.name && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalLabel}>Name:</Text>
                      <Text style={styles.modalValue}>{contactDetails.name}</Text>
                    </View>
                  )}
                  
                  {/* Display other fields except null values and excluded keys */}
                  {Object.keys(contactDetails).map((key) => {
                    const value = contactDetails[key];
                    // Skip if null, undefined, empty string, or excluded keys
                    if (
                      value === null || 
                      value === undefined || 
                      value === '' ||
                      key === 'mobile' || 
                      key === 'mobile_number' ||
                      key === 'encrypted_mobile_number' ||
                      key === 'email' || 
                      key === 'name' || 
                      key === 'success' || 
                      key === 'status' || 
                      key === 'msg' ||
                      key === 'price' ||
                      (typeof value === 'string' && value.toLowerCase() === 'null')
                    ) {
                      return null;
                    }
                    return (
                      <View key={key} style={styles.modalInfoRow}>
                        <Text style={styles.modalLabel}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</Text>
                        <Text style={styles.modalValue}>{String(value)}</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              <View style={styles.modalButtonRow}>
                <TouchableOpacity 
                  style={styles.cancelBtn}
                  onPress={closeContactModal}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.confirmBtn, loadingContact && styles.confirmBtnDisabled]}
                  onPress={contactDetails ? closeContactModal : getContactDetails}
                  disabled={loadingContact}
                >
                  {loadingContact ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.confirmBtnText}>
                      {contactDetails ? 'OK' : 'Confirm'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
  </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: hp(3),
  },
  /* ------------ HEADER ------------ */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    alignItems: 'center',
  },
  helloText: {
    fontSize: FSize.fs18,
    fontWeight: '700',
    color: Colors.black,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellIcon: {
    width: wp(5),
    height: wp(5),
    marginRight: wp(3),
     tintColor: Colors.yellow, 
   
  },
  profileImg: {
    width: wp(6),
    height: wp(6),
    borderRadius: wp(5),
  },
headerDivider: {
  width: '100%',
  height: hp(0.1),
  backgroundColor: Colors.lightgrey2,
  marginTop: hp(0.5),
},

  /* ------------ STATS ------------ */
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: wp(5),
    marginTop: hp(2),
  },

  statCard: {
    width: wp(28),
    backgroundColor: Colors.white,
    elevation: 3,
    borderRadius: wp(3),
    paddingVertical: hp(2),
    alignItems: 'center',
  },
  statIcon: {
    width: wp(8),
    height: wp(8),
    marginBottom: hp(1),
  },
  statValue: {
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: Colors.black,
  },
  statLabel: {
    fontSize: FSize.fs11,
    color: Colors.grey,
    marginTop: hp(0.3),
  },

  /* ------------ Add New Package Button ------------ */
  addListingBtn: {
    marginHorizontal: wp(5),
    marginTop: hp(2),
    paddingVertical: hp(1.8),
    borderWidth: 1.5,
    borderColor: Colors.sooprsblue,
    borderRadius: wp(3),
     borderStyle: 'dashed', 
    alignItems: 'center',
  },
  addText: {
    fontSize: FSize.fs13,
    color: Colors.sooprsblue,
    fontWeight: '600',
  },

  /* ------------ Request Section ------------ */
  reqTitle: {
    marginLeft: wp(5),
    marginTop: hp(2),
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: Colors.black,
  },

  /* ------------ Request Cards ------------ */
  reqCard: {
    marginHorizontal: wp(5),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightgrey2,
    // elevation: 3,
    marginTop: hp(2),
    padding: wp(4),
    borderRadius: wp(3),
  },
  reqTitle2: {
    fontSize: FSize.fs15,
    fontWeight: '700',
    color: Colors.black,
  },
  Desc:{
     flexDirection: 'row',
    alignItems:'center',
    // marginTop: hp(1),
  },
  reqDesc: {
    fontSize: FSize.fs13,
    marginTop: hp(1),
    color: Colors.grey,
    lineHeight: hp(2.2),
  },
  reqDate: {
    marginTop: hp(1.4),
    fontSize: FSize.fs12,
    fontWeight: '700',
    color: Colors.darkGray,
  },

  reqBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(2),
  },
  ignoreBtn: {
    width: '48%',
    paddingVertical: hp(1.4),
    borderRadius: wp(3),
    borderWidth: 1,
    borderColor: Colors.grey,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  acceptBtn: {
    width: '48%',
    paddingVertical: hp(1.4),
    borderRadius: wp(3),
    backgroundColor: Colors.sooprsblue,
    alignItems: 'center',
  },
  ignoreText: {
    fontSize: FSize.fs13,
    color: Colors.grey,
    fontWeight: '600',
  },
  acceptText: {
    fontSize: FSize.fs13,
    color: Colors.white,
    fontWeight: '700',
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
  moreButton: {
    marginTop: hp(0.5),
    alignSelf: 'flex-start',
  },
  moreText: {
    fontSize: FSize.fs12,
    color: Colors.sooprsblue,
    fontWeight: '600',
  },
  getContactBtn: {
    width: '100%',
    paddingVertical: hp(1.4),
    borderRadius: wp(3),
    backgroundColor: Colors.sooprsblue,
    alignItems: 'center',
    marginTop: hp(2),
  },
  getContactText: {
    fontSize: FSize.fs13,
    color: Colors.white,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: wp(4),
    padding: wp(5),
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: FSize.fs18,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: hp(2),
    textAlign: 'center',
  },
  modalInfoRow: {
    flexDirection: 'row',
    marginBottom: hp(1),
    flexWrap: 'wrap',
  },
  modalLabel: {
    fontSize: FSize.fs14,
    fontWeight: '600',
    color: Colors.black,
    marginRight: wp(2),
  },
  modalValue: {
    fontSize: FSize.fs14,
    color: Colors.grey,
    flex: 1,
  },
  contactDetailsContainer: {
    marginTop: hp(2),
    paddingTop: hp(2),
    borderTopWidth: 1,
    borderTopColor: Colors.lightgrey2,
  },
  contactDetailsTitle: {
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: hp(1),
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(3),
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: hp(1.4),
    borderRadius: wp(3),
    borderWidth: 1,
    borderColor: Colors.grey,
    backgroundColor: Colors.white,
    alignItems: 'center',
    marginRight: wp(2),
  },
  cancelBtnText: {
    fontSize: FSize.fs14,
    color: Colors.grey,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: hp(1.4),
    borderRadius: wp(3),
    backgroundColor: Colors.sooprsblue,
    alignItems: 'center',
    marginLeft: wp(2),
  },
  confirmBtnDisabled: {
    backgroundColor: Colors.grey,
    opacity: 0.6,
  },
  confirmBtnText: {
    fontSize: FSize.fs14,
    color: Colors.white,
    fontWeight: '700',
  },
  userDetailsLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: hp(20),
  },
  userDetailsLoadingText: {
    fontSize: FSize.fs14,
    color: Colors.grey,
    marginTop: hp(2),
  },
});