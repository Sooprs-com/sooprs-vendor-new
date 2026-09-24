import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Alert,
  StatusBar,
  Platform,
  RefreshControl,
} from 'react-native';
import React, {useState, useCallback} from 'react';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import Images from '../../assets/image';
import FSize from '../../assets/commonCSS/FSize';
import { getDataWithToken, postDataWithTokenBase2 } from '../../services/mobile-api';
import { mobile_siteConfig } from '../../services/mobile-siteConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import AnimatedButton from '../../Component/AnimatedButton';
import LinearGradient from 'react-native-linear-gradient';
import ScheduledConsultationStrip, {
  type ScheduledConsultationData,
} from '../../Component/ScheduledConsultationStrip';
import {useVendorCall} from '../../context/VendorCallContext';

const REQUEST_PREVIEW_COUNT = 5;

const decodeHtml = (text: string) =>
  String(text || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

const formatWallet = (amount: any) => {
  const n = parseFloat(String(amount ?? 0).replace(/,/g, ''));
  if (isNaN(n)) {
    return '0';
  }
  if (Math.abs(n - Math.round(n)) < 0.001) {
    return Math.round(n).toLocaleString('en-IN');
  }
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatINR = (amount: any) => {
  if (amount === null || amount === undefined || amount === 'N/A') {
    return 'N/A';
  }
  const n = Number(String(amount).replace(/[^0-9.]/g, ''));
  if (isNaN(n)) {
    return String(amount);
  }
  return n.toLocaleString('en-IN');
};

const getLeadVisual = (lead: any) => {
  const haystack = `${lead?.project_title || ''} ${lead?.projectTitle || ''} ${lead?.category || ''} ${lead?.category_name || ''} ${lead?.service_name || ''}`.toLowerCase();

  if (/health|fitness|gym|yoga|wellness|heal/.test(haystack)) {
    return {name: 'dumbbell', color: '#3B82F6', bg: '#EEF4FF'};
  }
  if (/mobile|app|android|ios/.test(haystack)) {
    return {name: 'cellphone', color: '#22C55E', bg: '#E8F8EF'};
  }
  if (/web|website|frontend|backend/.test(haystack)) {
    return {name: 'web', color: '#0EA5E9', bg: '#E0F2FE'};
  }
  if (/design|ui|ux|graphic/.test(haystack)) {
    return {name: 'palette-outline', color: '#EC4899', bg: '#FDF2F8'};
  }
  if (/market|seo|ads|social/.test(haystack)) {
    return {name: 'bullhorn-outline', color: '#F59E0B', bg: '#FFF7ED'};
  }
  if (/video|photo|edit/.test(haystack)) {
    return {name: 'video-outline', color: '#EF4444', bg: '#FEF2F2'};
  }
  return {name: 'briefcase-outline', color: '#3B82F6', bg: '#EEF4FF'};
};

const isLeadNew = (lead: any, index: number) => {
  if (lead?.is_new === 1 || lead?.is_new === true || lead?.new === 1) {
    return true;
  }
  const created = lead?.created_at || lead?.createdAt || lead?.posted_at;
  if (created) {
    const d = new Date(created);
    if (!isNaN(d.getTime())) {
      const days = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
      return days <= 14;
    }
  }
  return index < 5;
};

const getLeadBadge = (lead: any, index: number): 'new' | 'review' | null => {
  const raw = String(
    lead?.status ||
      lead?.lead_status ||
      lead?.project_status ||
      lead?.review_status ||
      lead?.badge ||
      '',
  ).toLowerCase();
  if (/review|pending|in_review|in review/.test(raw)) {
    return 'review';
  }
  if (/new/.test(raw) || isLeadNew(lead, index)) {
    return 'new';
  }
  return null;
};

const Home = () => {
  const navigation = useNavigation();
  const {joinCall} = useVendorCall();
  const [userName, setUserName] = useState('');
  const [userData,setUserData] = useState<any>(null);
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
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [scheduledConsultation, setScheduledConsultation] =
    useState<ScheduledConsultationData>(null);
  const [joiningConsultation, setJoiningConsultation] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const getUserDetails = async (options?: {silent?: boolean}) => {
    const silent = options?.silent === true;
    try {
      if (!silent) {
        setLoadingUserDetails(true);
      }
      const res: any = await getDataWithToken({}, mobile_siteConfig.GET_USER_DETAILS);
      const data: any = await res.json();
      console.log('User details data:::::', data);
      console.log('User membership data:::::', data?.membership?.plan?.plan_name);

      setUserData(data);
      setScheduledConsultation(data?.scheduledConsultation ?? null);
      if (data?.success && data?.vendorDetail) {
        const isProfileCompleted = data.vendorDetail.is_profile_completed;
        
        if (data.stats) {
          setStatus(data.stats);
        }
        
        if (data.vendorDetail.name) {
          setUserName(data.vendorDetail.name);
        } else {
          setUserName('User');
        }
        
        if (data.vendorDetail.category_id) {
          setCategoryId(String(data.vendorDetail.category_id));
        }
        
        if (isProfileCompleted === 0) {
          (navigation as any).replace('HomeVerification');
        }
      }
    } catch (err: any) {
      console.log('Error fetching user details:::::', err);
      setUserName('User');
      setScheduledConsultation(null);
    } finally {
      if (!silent) {
        setLoadingUserDetails(false);
      }
    }
  };

  const openScheduledConsultationBookings = useCallback(() => {
    (navigation as any).navigate('BookingsScreen');
  }, [navigation]);

  const handleJoinScheduledConsultation = useCallback(async () => {
    const appointmentId = scheduledConsultation?.appointment?.id;
    if (!appointmentId || joiningConsultation) return;
    setJoiningConsultation(true);
    try {
      await joinCall(Number(appointmentId));
    } catch (e) {
      console.log('Join scheduled consultation error:', e);
      openScheduledConsultationBookings();
    } finally {
      setJoiningConsultation(false);
    }
  }, [
    scheduledConsultation?.appointment?.id,
    joiningConsultation,
    joinCall,
    openScheduledConsultationBookings,
  ]);

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
      console.log('Payload Filter lead:::::', payload);
      
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
        setLeads(prevLeads => [...prevLeads, ...newLeads]);
      } else {
        setLeads(newLeads);
      }
      
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
      
      if (result.status === 402 && result.msg === 'Insufficient wallet balance!') {
        Toast.show({
          type: 'error',
          text1: 'Insufficient Balance',
          text2: result.msg || 'Insufficient wallet balance!',
          position: 'top',
          visibilityTime: 3000,
          text1Style: {
            fontSize: 14,
            fontWeight: 'bold',
          },
          text2Style: {
            fontSize: 13,
          },
        });
        closeContactModal();
        return;
      }
      
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

  const refreshHome = useCallback(async () => {
    setCurrentPage(1);
    setHasMore(true);
    setShowAllRequests(false);
    await getUserDetails({silent: true});
    await getLeads(1, false);
  }, [categoryId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshHome();
    } finally {
      setRefreshing(false);
    }
  }, [refreshHome]);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        await getUserDetails();
        setCurrentPage(1);
        setHasMore(true);
        setShowAllRequests(false);
        setTimeout(() => {
          getLeads(1, false);
        }, 100);
      };
      fetchData();
    }, [])
  );

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
    
    if (showAllRequests && isCloseToBottom && hasMore && !loadingMore && !loadingLeads) {
      loadMoreLeads();
    }
  };

  const openDrawer = () => {
    (navigation as any).openDrawer();
  };

  const displayedLeads = showAllRequests ? leads : leads.slice(0, REQUEST_PREVIEW_COUNT);
  const firstName = (userName || 'User').split(' ')[0];
  const planName = userData?.membership?.plan?.plan_name;
  const upgradeIcon =
    planName === 'STANDARD'
      ? Images.standardPlanIcon
      : planName === 'ELITE'
      ? Images.ElitePlanIcon
      : Images.starIcon;

  const avatarLetter = (firstName || 'U').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
    <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
    <ScrollView 
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={400}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[Colors.sooprsblue]}
          tintColor={Colors.sooprsblue}
        />
      }
    >

      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={openDrawer} style={styles.drawerIconContainer}>
            <Image source={Images.drawer} style={styles.drawerIcon} />
          </TouchableOpacity>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{avatarLetter}</Text>
          </View>
          <View style={styles.greetingWrap}>
            <Text style={styles.helloText} numberOfLines={1}>
              Hello {firstName} 👋
            </Text>
            <Text style={styles.welcomeText} numberOfLines={1}>
              Welcome back to Sooprs
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <AnimatedButton
            icon={upgradeIcon}
            title="Upgrade"
            onPress={() => (navigation as any).navigate('SubscriptionScreen')}
            buttonStyle={styles.upgradeButton}
            textStyle={styles.upgradeText}
          />

          <TouchableOpacity 
            style={styles.notificationBadgeContainer}
            onPress={() => (navigation as any).navigate('NotificationScreen')}
          >
            <MaterialCommunityIcons name="bell-outline" size={wp(6)} color="#1F2937" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>
      </View>


      {/* ================= STATS BOX ================= */}
      <View style={styles.statsRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.statCardWrap, styles.statShadowBlue]}
          onPress={() => (navigation as any).navigate('AddCredits')}
        >
          <LinearGradient
            colors={['#E8F3FF', '#F7FBFF']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.statCard}
          >
            <View style={[styles.statDecor, {backgroundColor: '#BFDBFE'}]} />
            <View style={styles.statTopRow}>
              <View style={[styles.statIconWrap, {backgroundColor: '#FFFFFF'}]}>
                <LinearGradient
                  colors={['#0077FF', '#3B9BFF']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.statIconInner}
                >
                  <MaterialCommunityIcons name="wallet-outline" size={wp(4.6)} color={Colors.white} />
                </LinearGradient>
              </View>
              <View style={[styles.statChevronWrap, {backgroundColor: '#D6E8FF'}]}>
                <MaterialCommunityIcons name="chevron-right" size={wp(3.8)} color="#0077FF" />
              </View>
            </View>
            <Text style={styles.statLabel}>Wallet Amount</Text>
            <Text
              style={[styles.statValue, {color: '#0B3A8A'}]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
            >
              ₹{formatWallet(status?.wallet_balance)}
            </Text>
            <View style={[styles.statAccent, {backgroundColor: '#0077FF'}]} />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.statCardWrap, styles.statShadowPurple]}
          onPress={() => (navigation as any).navigate('PackagesScreen')}
        >
          <LinearGradient
            colors={['#F3EEFF', '#FBFAFF']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.statCard}
          >
            <View style={[styles.statDecor, {backgroundColor: '#DDD6FE'}]} />
            <View style={styles.statTopRow}>
              <View style={[styles.statIconWrap, {backgroundColor: '#FFFFFF'}]}>
                <LinearGradient
                  colors={['#7C3AED', '#A78BFA']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.statIconInner}
                >
                  <MaterialCommunityIcons name="package-variant-closed" size={wp(4.6)} color={Colors.white} />
                </LinearGradient>
              </View>
              <View style={[styles.statChevronWrap, {backgroundColor: '#EDE9FE'}]}>
                <MaterialCommunityIcons name="chevron-right" size={wp(3.8)} color="#7C3AED" />
              </View>
            </View>
            <Text style={styles.statLabel}>Total Packages</Text>
            <Text
              style={[styles.statValue, {color: '#5B21B6'}]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
            >
              {status?.total_packages || '0'}
            </Text>
            <View style={[styles.statAccent, {backgroundColor: '#7C3AED'}]} />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.statCardWrap, styles.statShadowAmber]}
          onPress={() => (navigation as any).navigate('BookingsScreen')}
        >
          <LinearGradient
            colors={['#FFF6E8', '#FFFBF4']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.statCard}
          >
            <View style={[styles.statDecor, {backgroundColor: '#FDE68A'}]} />
            <View style={styles.statTopRow}>
              <View style={[styles.statIconWrap, {backgroundColor: '#FFFFFF'}]}>
                <LinearGradient
                  colors={['#D97706', '#FBBF24']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.statIconInner}
                >
                  <MaterialCommunityIcons name="cart-outline" size={wp(4.6)} color={Colors.white} />
                </LinearGradient>
              </View>
              <View style={[styles.statChevronWrap, {backgroundColor: '#FEF3C7'}]}>
                <MaterialCommunityIcons name="chevron-right" size={wp(3.8)} color="#D97706" />
              </View>
            </View>
            <Text style={styles.statLabel}>Total Orders</Text>
            <Text
              style={[styles.statValue, {color: '#92400E'}]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
            >
              {status?.total_orders || '0'}
            </Text>
            <View style={[styles.statAccent, {backgroundColor: '#D97706'}]} />
          </LinearGradient>
        </TouchableOpacity>
      </View>


      {/* ================= START BILLING ================= */}
      {/* <TouchableOpacity
        activeOpacity={0.8}
        style={styles.startBillingCard}
        onPress={() => {
          (navigation as any).navigate('VendorHomeScreen', { screen: 'BillingBottomTab' });
        }}>
        <View style={styles.startBillingInner}>
          <View style={styles.startBillingIconWrap}>
            <MaterialCommunityIcons name="format-list-bulleted" size={wp(5)} color={Colors.white} />
          </View>
          <View style={styles.startBillingTextWrap}>
            <Text style={styles.startBillingTitle}>Start Billing</Text>
            <Text style={styles.startBillingSubtitle}>
              Create customers & invoices
            </Text>
          </View>
          <View style={styles.startBillingArrow}>
            <MaterialCommunityIcons name="chevron-right" size={wp(5.5)} color={Colors.white} />
          </View>
        </View>
      </TouchableOpacity> */}

      {/* ================= UPCOMING / ONGOING CONSULTATION ================= */}
      <ScheduledConsultationStrip
        data={scheduledConsultation}
        onPress={openScheduledConsultationBookings}
        onJoinPress={
          joiningConsultation ? undefined : handleJoinScheduledConsultation
        }
      />

      {/* ================= ADD PACKAGE LISTING ================= */}
      <TouchableOpacity
        style={styles.addListingBtn}
        onPress={() => (navigation as any).navigate('AddPackagesScreen')}
        activeOpacity={0.8}
      >
        <View style={styles.addPlusCircle}>
          <MaterialCommunityIcons name="plus" size={wp(4.4)} color="#2563EB" />
        </View>
        <View style={styles.addListingTextWrap}>
          <Text style={styles.addText}>+ Add New Package Listing</Text>
          <Text style={styles.addSubText}>
            List your service package & reach more customers
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={wp(6)} color="#94A3B8" />
      </TouchableOpacity>


      {/* ================= REQUESTS TITLE ================= */}
      <View style={styles.reqHeaderRow}>
        <Text style={styles.reqTitle}>Requests</Text>
        {/* {!showAllRequests && (
          <TouchableOpacity
            onPress={() => setShowAllRequests(true)}
            activeOpacity={0.7}
            style={styles.viewAllBtn}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )} */}
      </View>

      {/* ================= EACH REQUEST CARD ================= */}
      {loadingLeads ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.sooprsblue} />
          <Text style={styles.loadingText}>Loading leads...</Text>
        </View>
      ) : displayedLeads.length > 0 ? (
        <>
          {displayedLeads.map((lead, index) => {
            const leadId = lead.id || lead.lead_id || lead.leadId;
            const isExpanded = expandedLeads.has(leadId);
            const description = decodeHtml(
              lead.description || lead.desc || '',
            );
            const maxBudget = lead.max_budget_amount || lead.maxBudgetAmount || lead.max_budget || 'N/A';
            const lineCount = description.split('\n').length;
            const shouldTruncate = lineCount > 4 || description.length > 160;
            // const visual = getLeadVisual(lead);
            const title = decodeHtml(
              lead.project_title || lead.projectTitle || lead.category_name || lead.category || 'Project Title',
            );
            const badge = getLeadBadge(lead, index);

            return (
              <View key={leadId?.toString() || index.toString()} style={styles.reqCard}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => (navigation as any).navigate('LeadDetailsScreen', {lead})}
                >
                  <View style={styles.reqCardTop}>
                    {/* <View style={[styles.leadIconBox, {backgroundColor: visual.bg}]}>
                      <MaterialCommunityIcons name={visual.name} size={wp(6.5)} color={visual.color} />
                    </View> */}

                    <View style={styles.reqTitleBlock}>
                      <View style={styles.reqTitleRow}>
                        <Text style={styles.reqTitle2} numberOfLines={1}>
                          {title}
                        </Text>
                        {badge === 'new' && (
                          <View style={styles.newBadge}>
                            <Text style={styles.newBadgeText}>New</Text>
                          </View>
                        )}
                        {badge === 'review' && (
                          <View style={styles.reviewBadge}>
                            <Text style={styles.reviewBadgeText}>In Review</Text>
                          </View>
                        )}
                        <MaterialCommunityIcons name="chevron-right" size={wp(5.2)} color="#94A3B8" />
                      </View>

                      <Text style={styles.reqDesc} numberOfLines={isExpanded ? undefined : 3}>
                        {description || 'No content found in the response.'}
                      </Text>

                      {/* {shouldTruncate && (
                        <TouchableOpacity
                          onPress={() => toggleDescription(leadId)}
                          style={styles.moreButton}
                        >
                          <Text style={styles.moreText}>
                            {isExpanded ? 'Less' : 'More'}
                          </Text>
                        </TouchableOpacity>
                      )} */}
                    </View>
                  </View>
                </TouchableOpacity>

                <View style={styles.leadDivider} />

                <View style={styles.reqCardFooter}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.maxAmountPress}
                    onPress={() => (navigation as any).navigate('LeadDetailsScreen', {lead})}
                  >
                    <Text style={styles.maxAmountLine} numberOfLines={1}>
                      Max Amount:{' '}
                      <Text style={styles.maxAmountValue}>₹{formatINR(maxBudget)}</Text>
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.getContactBtn}
                    onPress={() => {
                      console.log('Button pressed for lead:', lead);
                      openContactModal(lead);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.getContactText}>Get Contact Details</Text>
                    <MaterialCommunityIcons name="chevron-right" size={wp(4)} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
          {showAllRequests && loadingMore && (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color={Colors.sooprsblue} />
              <Text style={styles.loadingMoreText}>Loading more...</Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <MaterialCommunityIcons name="inbox-outline" size={wp(10)} color="#94A3B8" />
          </View>
          <Text style={styles.emptyText}>No leads available</Text>
          <Text style={styles.emptySubText}>New requests will show up here</Text>
        </View>
      )}

    </ScrollView>
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
                      {decodeHtml(selectedLead.project_title || selectedLead.projectTitle || 'N/A')}
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
                  
                  {(contactDetails.mobile || contactDetails.mobile_number || contactDetails.encrypted_mobile_number) && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalLabel}>Mobile Number:</Text>
                      <Text style={styles.modalValue}>
                        {contactDetails.mobile || contactDetails.mobile_number || contactDetails.encrypted_mobile_number}
                      </Text>
                    </View>
                  )}
                  
                  {contactDetails.email && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalLabel}>Email:</Text>
                      <Text style={styles.modalValue}>{contactDetails.email}</Text>
                    </View>
                  )}
                  
                  {contactDetails.name && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalLabel}>Name:</Text>
                      <Text style={styles.modalValue}>{contactDetails.name}</Text>
                    </View>
                  )}
                  
                  {Object.keys(contactDetails).map((key) => {
                    const value = contactDetails[key];
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
    backgroundColor: '#FFFFFF',
    paddingTop: hp(4),
  },
  scrollContent: {
    paddingBottom: hp(4),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: wp(1.5),
  },
  greetingWrap: {
    flex: 1,
    marginLeft: wp(2),
  },
  helloText: {
    fontSize: FSize.fs16,
    fontWeight: '800',
    color: '#0F172A',
  },
  welcomeText: {
    fontSize: FSize.fs11,
    color: '#94A3B8',
    marginTop: hp(0.15),
    fontWeight: '500',
  },
  avatarCircle: {
    width: wp(9.5),
    height: wp(9.5),
    borderRadius: wp(4.75),
    backgroundColor: '#0B1F4D',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: wp(1.5),
  },
  avatarLetter: {
    color: Colors.white,
    fontSize: FSize.fs15,
    fontWeight: '800',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  upgradeButton: {
    backgroundColor: '#0077FF',
    borderRadius: wp(7),
    paddingHorizontal: wp(3.4),
    paddingVertical: hp(0.85),
    marginVertical: 0,
    gap: wp(1.2),
    ...Platform.select({
      ios: {
        shadowColor: '#0077FF',
        shadowOffset: {width: 0, height: 3},
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
        shadowColor: '#0077FF',
      },
    }),
  },
  upgradeText: {
    fontSize: FSize.fs12,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.2,
  },
  notificationBadgeContainer: {
    width: wp(8),
    height: wp(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: hp(0.35),
    right: wp(0.6),
    width: wp(2.1),
    height: wp(2.1),
    borderRadius: wp(1.05),
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  drawerIconContainer: {
    padding: wp(0.4),
  },
  drawerIcon: {
    width: wp(5.6),
    height: wp(5.6),
    tintColor: '#1F2937',
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: wp(4),
    marginTop: hp(0.6),
    gap: wp(2.4),
  },
  statCardWrap: {
    flex: 1,
    borderRadius: wp(4.2),
    backgroundColor: Colors.white,
  },
  statCard: {
    borderRadius: wp(4.2),
    paddingTop: hp(1.35),
    paddingBottom: hp(1.45),
    paddingHorizontal: wp(2.8),
    minHeight: hp(15.4),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  statShadowBlue: {
    ...Platform.select({
      ios: {
        shadowColor: '#0077FF',
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.16,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
        shadowColor: '#0077FF',
      },
    }),
  },
  statShadowPurple: {
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.16,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
        shadowColor: '#7C3AED',
      },
    }),
  },
  statShadowAmber: {
    ...Platform.select({
      ios: {
        shadowColor: '#D97706',
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.16,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
        shadowColor: '#D97706',
      },
    }),
  },
  statDecor: {
    position: 'absolute',
    width: wp(18),
    height: wp(18),
    borderRadius: wp(9),
    top: -wp(7),
    right: -wp(5),
    opacity: 0.45,
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statIconWrap: {
    width: wp(9.2),
    height: wp(9.2),
    borderRadius: wp(2.8),
    padding: wp(0.45),
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statIconInner: {
    flex: 1,
    borderRadius: wp(2.3),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statChevronWrap: {
    width: wp(6),
    height: wp(6),
    borderRadius: wp(3),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: FSize.fs10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: hp(1.35),
    letterSpacing: 0.2,
  },
  statValue: {
    fontSize: FSize.fs16,
    fontWeight: '800',
    marginTop: hp(0.35),
    letterSpacing: -0.3,
  },
  statAccent: {
    height: 3,
    width: wp(8),
    borderRadius: 2,
    marginTop: hp(1.05),
  },

  startBillingCard: {
    marginHorizontal: wp(4),
    marginTop: hp(1.8),
    borderRadius: wp(4),
    backgroundColor: '#E8F8EE',
  },
  startBillingInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.55),
    paddingHorizontal: wp(3.4),
  },
  startBillingIconWrap: {
    width: wp(10.5),
    height: wp(10.5),
    borderRadius: wp(5.25),
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  startBillingTextWrap: {
    flex: 1,
  },
  startBillingTitle: {
    fontSize: FSize.fs16,
    fontWeight: '800',
    color: '#0F172A',
  },
  startBillingSubtitle: {
    fontSize: FSize.fs12,
    color: '#64748B',
    marginTop: hp(0.15),
    fontWeight: '400',
  },
  startBillingArrow: {
    width: wp(8.5),
    height: wp(8.5),
    borderRadius: wp(4.25),
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addListingBtn: {
    marginHorizontal: wp(4),
    marginTop: hp(1.6),
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3.2),
    borderWidth: 1.4,
    borderColor: '#60A5FA',
    borderRadius: wp(5),
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  addPlusCircle: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    borderWidth: 1.4,
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(2.6),
  },
  addListingTextWrap: {
    flex: 1,
  },
  addText: {
    fontSize: FSize.fs14,
    color: '#2563EB',
    fontWeight: '800',
  },
  addSubText: {
    fontSize: FSize.fs11,
    color: '#94A3B8',
    marginTop: hp(0.2),
    fontWeight: '400',
  },

  reqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: wp(4),
    marginTop: hp(2.2),
  },
  reqTitle: {
    fontSize: FSize.fs18,
    fontWeight: '800',
    color: '#0F172A',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: FSize.fs13,
    color: '#2563EB',
    fontWeight: '700',
  },

  reqCard: {
    marginHorizontal: wp(4),
    backgroundColor: Colors.white,
    marginTop: hp(1.5),
    borderRadius: wp(4),
    padding: wp(3.6),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: {
        shadowColor: '#94A3B8',
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  reqCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  leadIconBox: {
    width: wp(12.5),
    height: wp(12.5),
    borderRadius: wp(3.2),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(2.8),
  },
  reqTitleBlock: {
    flex: 1,
  },
  reqTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.4),
  },
  reqTitle2: {
    flex: 1,
    fontSize: FSize.fs20,
    fontWeight: '800',
    color: '#0F172A',
  },
  newBadge: {
    backgroundColor: '#EEF4FF',
    paddingHorizontal: wp(2.4),
    paddingVertical: hp(0.28),
    borderRadius: wp(1.6),
  },
  newBadgeText: {
    fontSize: FSize.fs12,
    color: '#3B82F6',
    fontWeight: '700',
  },
  reviewBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: wp(2.4),
    paddingVertical: hp(0.28),
    borderRadius: wp(1.6),
  },
  reviewBadgeText: {
    fontSize: FSize.fs12,
    color: '#059669',
    fontWeight: '700',
  },
  reqDesc: {
    fontSize: FSize.fs14,
    marginTop: hp(0.55),
    color: '#64748B',
    lineHeight: hp(2.4),
  },
  leadDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginTop: hp(1.2),
    marginBottom: hp(1),
  },
  reqCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: wp(2),
  },
  maxAmountPress: {
    flex: 1,
  },
  maxAmountLine: {
    flex: 1,
    fontSize: FSize.fs14,
    fontWeight: '600',
    color: '#475569',
  },
  maxAmountValue: {
    fontSize: FSize.fs16,
    fontWeight: '800',
    color: '#16A34A',
  },
  loadingContainer: {
    padding: wp(5),
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FSize.fs15,
    color: Colors.grey,
    marginTop: hp(1),
    fontWeight: '600',
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
    padding: wp(6),
    alignItems: 'center',
    marginTop: hp(1),
  },
  emptyIconWrap: {
    width: wp(16),
    height: wp(16),
    borderRadius: wp(8),
    backgroundColor: '#EEF2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1.2),
  },
  emptyText: {
    fontSize: FSize.fs16,
    color: '#374151',
    fontWeight: '700',
  },
  emptySubText: {
    fontSize: FSize.fs13,
    color: '#9CA3AF',
    marginTop: hp(0.4),
  },
  moreButton: {
    marginTop: hp(0.25),
    alignSelf: 'flex-start',
  },
  moreText: {
    fontSize: FSize.fs14,
    color: '#2563EB',
    fontWeight: '700',
  },
  getContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    paddingVertical: hp(0.85),
    paddingHorizontal: wp(3),
    borderRadius: wp(2),
    backgroundColor: '#2563EB',
    flexShrink: 0,
    gap: wp(0.4),
  },
  getContactText: {
    fontSize: FSize.fs13,
    color: Colors.white,
    fontWeight: '800',
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
