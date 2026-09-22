import React, {useMemo, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Platform,
  Modal,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import Images from '../../assets/image';
import FSize from '../../assets/commonCSS/FSize';
import {mobile_siteConfig} from '../../services/mobile-siteConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const decodeHtml = (text: string) =>
  String(text || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

const formatINR = (amount: any) => {
  if (amount === null || amount === undefined || amount === '' || amount === 'N/A') {
    return null;
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
    return {name: 'cellphone', color: '#16A34A', bg: '#E8F8EF'};
  }
  if (/web|website|frontend|backend/.test(haystack)) {
    return {name: 'web', color: '#0284C7', bg: '#E0F2FE'};
  }
  if (/design|ui|ux|graphic/.test(haystack)) {
    return {name: 'palette-outline', color: '#DB2777', bg: '#FDF2F8'};
  }
  if (/market|seo|ads|social/.test(haystack)) {
    return {name: 'bullhorn-outline', color: '#D97706', bg: '#FFF7ED'};
  }
  if (/video|photo|edit/.test(haystack)) {
    return {name: 'video-outline', color: '#DC2626', bg: '#FEF2F2'};
  }
  if (/cab|taxi|ride|travel/.test(haystack)) {
    return {name: 'car', color: '#0077FF', bg: '#EEF4FF'};
  }
  return {name: 'briefcase-outline', color: '#0077FF', bg: '#EEF4FF'};
};

const formatPosted = (dateString?: string) => {
  if (!dateString) {
    return null;
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return String(dateString);
  }
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1) {
    return 'Just now';
  }
  if (mins < 60) {
    return `${mins} min ago`;
  }
  if (hours < 24) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (days === 1) {
    return 'Yesterday';
  }
  if (days < 7) {
    return `${days} days ago`;
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatFullDate = (dateString?: string) => {
  if (!dateString) {
    return null;
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return String(dateString);
  }
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const pickFirst = (...values: any[]) => {
  for (const value of values) {
    if (value !== null && value !== undefined && String(value).trim() !== '' && String(value).toLowerCase() !== 'null') {
      return value;
    }
  }
  return null;
};

const LeadDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params || {}) as {lead?: any; contactLocked?: boolean};
  const lead = params.lead || {};
  const contactLocked = !!params.contactLocked;

  const [showContactModal, setShowContactModal] = useState(false);
  const [contactDetails, setContactDetails] = useState<any>(null);
  const [loadingContact, setLoadingContact] = useState(false);

  const visual = useMemo(() => getLeadVisual(lead), [lead]);
  const postedLabel = useMemo(
    () => formatPosted(pickFirst(lead.created_at, lead.createdAt, lead.posted_at, lead.postedAt)),
    [lead],
  );

  const displayName = decodeHtml(
    pickFirst(
      lead.project_title,
      lead.projectTitle,
      lead.name,
      lead.user_name,
      lead.userName,
      lead.customer_name,
      lead.client_name,
      'Lead request',
    ) || 'Lead request',
  );
  const title = decodeHtml(
    pickFirst(lead.project_title, lead.projectTitle, lead.category_name, lead.category, 'Project Request') ||
      'Project Title',
  );
  const description = decodeHtml(pickFirst(lead.description, lead.desc, '') || '');
  const maxBudget = pickFirst(lead.max_budget_amount, lead.maxBudgetAmount, lead.max_budget);
  const minBudget = pickFirst(lead.min_budget_amount, lead.minBudgetAmount, lead.min_budget);
  const credit = pickFirst(lead.price1, lead.price, lead.credit, lead.credits);
  const category = pickFirst(lead.category_name, lead.category, lead.service_name, lead.service);
  const location = pickFirst(
    lead.city,
    lead.location,
    lead.address,
    lead.pickup_location,
    lead.pickupLocation,
    lead.area,
  );
  const dropoff = pickFirst(lead.dropoff_location, lead.dropoffLocation);
  const vehicle = pickFirst(lead.vehicle_type, lead.vehicleType);
  const createdAt = pickFirst(lead.created_at, lead.createdAt, lead.posted_at, lead.postedAt);
  const leadId = pickFirst(lead.id, lead.lead_id, lead.leadId);

  const closeContactModal = () => {
    setShowContactModal(false);
  };

  const getContactDetails = async () => {
    try {
      setLoadingContact(true);
      const formData = `id=${encodeURIComponent(leadId)}`;
      const token = await AsyncStorage.getItem(mobile_siteConfig.MOB_ACCESS_TOKEN_KEY);

      const response = await fetch(mobile_siteConfig.BASE_URL2 + mobile_siteConfig.SHOW_LEAD_MOBILE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.status === 402 && result.msg === 'Insufficient wallet balance!') {
        Toast.show({
          type: 'error',
          text1: 'Insufficient Balance',
          text2: result.msg || 'Insufficient wallet balance!',
          position: 'top',
          visibilityTime: 3000,
        });
        closeContactModal();
        return;
      }

      if (result.encrypted_mobile_number && !result.mobile_number && !result.mobile) {
        result.mobile_number = result.encrypted_mobile_number;
      }

      setContactDetails(result);
      closeContactModal();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to fetch contact details');
    } finally {
      setLoadingContact(false);
    }
  };

  const phoneNumber = pickFirst(
    contactDetails?.mobile,
    contactDetails?.mobile_number,
    contactDetails?.encrypted_mobile_number,
    contactDetails?.phone,
  );
  const contactName = pickFirst(contactDetails?.name, contactDetails?.user_name, contactDetails?.userName);
  const contactEmail = pickFirst(contactDetails?.email);

  const handleCall = () => {
    if (!phoneNumber) {
      return;
    }
    Linking.openURL(`tel:${String(phoneNumber).replace(/[^0-9+]/g, '')}`);
  };

  const handleWhatsApp = () => {
    if (!phoneNumber) {
      return;
    }
    const cleaned = String(phoneNumber).replace(/[^0-9]/g, '');
    Linking.openURL(`whatsapp://send?phone=${cleaned}`).catch(() => {
      Linking.openURL(`https://wa.me/${cleaned}`);
    });
  };

  const infoRows = [
    {icon: 'map-marker-outline', label: 'Location', value: location},
    {icon: 'map-marker-path', label: 'Drop-off', value: dropoff},
    {icon: 'car-outline', label: 'Vehicle', value: vehicle},
    {icon: 'pound', label: 'Lead ID', value: leadId ? `#${leadId}` : null},
    {icon: 'clock-outline', label: 'Posted', value: formatFullDate(createdAt)},
  ].filter(row => !!row.value);

  const formattedMax = formatINR(maxBudget);
  const formattedMin = formatINR(minBudget);
  const budgetRange =
    formattedMin && formattedMax ? `₹${formattedMin} – ₹${formattedMax}` : formattedMax ? `Up to ₹${formattedMax}` : null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <Image source={Images.backArrow} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lead Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.identityCard}>
          <Text style={styles.identityName}>{displayName}</Text>
          <View style={styles.identityMeta}>
            {category ? (
              <View style={[styles.categoryChip, {backgroundColor: visual.bg}]}>
                <MaterialCommunityIcons name={visual.name} size={wp(3.8)} color={visual.color} />
                <Text style={[styles.categoryChipText, {color: visual.color}]} numberOfLines={1}>
                  {category}
                </Text>
              </View>
            ) : null}
            {postedLabel ? (
              <View style={styles.timeChip}>
                <MaterialCommunityIcons name="clock-outline" size={wp(3.8)} color="#64748B" />
                <Text style={styles.timeChipText}>{postedLabel}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statTile, {backgroundColor: '#ECFDF5'}]}>
            <MaterialCommunityIcons name="currency-inr" size={wp(5.2)} color="#16A34A" />
            <Text style={styles.statLabel}>Max Budget</Text>
            <Text style={[styles.statValue, {color: '#16A34A'}]} numberOfLines={1}>
              {formattedMax ? `₹${formattedMax}` : 'N/A'}
            </Text>
          </View>
          <View style={[styles.statTile, {backgroundColor: '#EEF4FF'}]}>
            <MaterialCommunityIcons name="wallet-outline" size={wp(5.2)} color="#2563EB" />
            <Text style={styles.statLabel}>Credits</Text>
            <Text style={[styles.statValue, {color: '#2563EB'}]} numberOfLines={1}>
              {credit ? `₹${formatINR(credit) || credit}` : '—'}
            </Text>
          </View>
          <View style={[styles.statTile, {backgroundColor: '#FFF7ED'}]}>
            <MaterialCommunityIcons name="map-marker-outline" size={wp(5.2)} color="#D97706" />
            <Text style={styles.statLabel}>Location</Text>
            <Text style={[styles.statValue, {color: '#D97706'}]} numberOfLines={1}>
              {location || '—'}
            </Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <MaterialCommunityIcons name="text-box-outline" size={wp(4.6)} color="#2563EB" />
            </View>
            <Text style={styles.sectionTitle}>About this request</Text>
          </View>
          <Text style={styles.description}>
            {description || 'No description was provided for this request.'}
          </Text>
        </View>

        {budgetRange ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, {backgroundColor: '#ECFDF5'}]}>
                <MaterialCommunityIcons name="cash-multiple" size={wp(4.6)} color="#16A34A" />
              </View>
              <Text style={styles.sectionTitle}>Budget</Text>
            </View>
            <Text style={styles.budgetHighlight}>{budgetRange}</Text>
            <Text style={styles.budgetHint}>Customer’s expected spend for this request</Text>
          </View>
        ) : null}

        {infoRows.length > 0 ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, {backgroundColor: '#F1F5F9'}]}>
                <MaterialCommunityIcons name="information-outline" size={wp(4.6)} color="#475569" />
              </View>
              <Text style={styles.sectionTitle}>Request info</Text>
            </View>
            {infoRows.map((row, index) => (
              <View
                key={row.label}
                style={[styles.infoRow, index === infoRows.length - 1 && styles.infoRowLast]}>
                <View style={styles.infoLeft}>
                  <MaterialCommunityIcons name={row.icon} size={wp(4.6)} color="#64748B" />
                  <Text style={styles.infoLabel}>{row.label}</Text>
                </View>
                <Text style={styles.infoValue} numberOfLines={2}>
                  {String(row.value)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {contactDetails ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, {backgroundColor: '#EEF4FF'}]}>
                <MaterialCommunityIcons name="account-circle-outline" size={wp(4.6)} color="#2563EB" />
              </View>
              <Text style={styles.sectionTitle}>Customer contact</Text>
            </View>
            {contactName ? (
              <View style={styles.contactLine}>
                <Text style={styles.contactLabel}>Name</Text>
                <Text style={styles.contactValue}>{contactName}</Text>
              </View>
            ) : null}
            {phoneNumber ? (
              <View style={styles.contactLine}>
                <Text style={styles.contactLabel}>Mobile</Text>
                <Text style={styles.contactValue}>{phoneNumber}</Text>
              </View>
            ) : null}
            {contactEmail ? (
              <View style={styles.contactLine}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>{contactEmail}</Text>
              </View>
            ) : null}
            <View style={styles.contactActions}>
              {phoneNumber ? (
                <>
                  <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp} activeOpacity={0.8}>
                    <MaterialCommunityIcons name="whatsapp" size={wp(5)} color="#16A34A" />
                    <Text style={styles.whatsappText}>WhatsApp</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.callBtn} onPress={handleCall} activeOpacity={0.8}>
                    <MaterialCommunityIcons name="phone" size={wp(5)} color={Colors.white} />
                    <Text style={styles.callText}>Call</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </View>
        ) : null}

        {contactLocked ? (
          <View style={styles.lockBanner}>
            <MaterialCommunityIcons name="lock-outline" size={wp(5)} color="#D97706" />
            <Text style={styles.lockText}>
              Complete your profile verification to contact this lead.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {!contactLocked && !contactDetails ? (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.ctaButton}
            activeOpacity={0.85}
            onPress={() => setShowContactModal(true)}>
            <MaterialCommunityIcons name="card-account-phone-outline" size={wp(5.2)} color={Colors.white} />
            <Text style={styles.ctaText}>Get Contact Details</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Modal
        visible={showContactModal}
        transparent
        animationType="slide"
        onRequestClose={closeContactModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Unlock contact</Text>
            <Text style={styles.modalSubtitle}>
              Credits will be deducted from your wallet to view this customer’s contact details.
            </Text>

            <View style={styles.modalLeadBox}>
              <Text style={styles.modalLeadTitle} numberOfLines={2}>
                {title}
              </Text>
              {credit ? (
                <View style={styles.creditChip}>
                  <MaterialCommunityIcons name="wallet-outline" size={wp(4)} color="#2563EB" />
                  <Text style={styles.creditChipText}>₹{formatINR(credit) || credit} credits</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeContactModal}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, loadingContact && styles.confirmBtnDisabled]}
                onPress={getContactDetails}
                disabled={loadingContact}>
                {loadingContact ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default LeadDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'ios' ? 0 : hp(2),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.2),
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    padding: wp(2),
  },
  backIcon: {
    width: wp(6.5),
    height: wp(6.5),
    tintColor: '#0F172A',
  },
  headerTitle: {
    fontSize: FSize.fs18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSpacer: {
    width: wp(10),
  },
  scrollContent: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1.8),
    paddingBottom: hp(12),
  },
  identityCard: {
    backgroundColor: Colors.white,
    borderRadius: wp(4),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  identityName: {
    fontSize: FSize.fs20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    lineHeight: hp(3.1),
  },
  identityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: wp(2),
    marginTop: hp(1.1),
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.2),
    paddingHorizontal: wp(2.4),
    paddingVertical: hp(0.45),
    borderRadius: wp(5),
    maxWidth: '68%',
  },
  categoryChipText: {
    fontSize: FSize.fs12,
    fontWeight: '700',
    flexShrink: 1,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  timeChipText: {
    fontSize: FSize.fs12,
    color: '#64748B',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: wp(2.2),
    marginTop: hp(1.6),
  },
  statTile: {
    flex: 1,
    borderRadius: wp(3.5),
    paddingVertical: hp(1.4),
    paddingHorizontal: wp(2.4),
  },
  statLabel: {
    marginTop: hp(0.7),
    fontSize: FSize.fs11,
    color: '#64748B',
    fontWeight: '600',
  },
  statValue: {
    marginTop: hp(0.25),
    fontSize: FSize.fs14,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: wp(4),
    padding: wp(4),
    marginTop: hp(1.6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.1),
  },
  sectionIcon: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(2.2),
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(2.2),
  },
  sectionTitle: {
    fontSize: FSize.fs16,
    fontWeight: '800',
    color: '#0F172A',
  },
  description: {
    fontSize: FSize.fs14,
    color: '#475569',
    lineHeight: hp(2.5),
  },
  budgetHighlight: {
    fontSize: FSize.fs20,
    fontWeight: '800',
    color: '#16A34A',
  },
  budgetHint: {
    marginTop: hp(0.4),
    fontSize: FSize.fs12,
    color: '#94A3B8',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.05),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: wp(3),
  },
  infoRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    flexShrink: 0,
  },
  infoLabel: {
    fontSize: FSize.fs13,
    color: '#64748B',
    fontWeight: '600',
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: FSize.fs13,
    fontWeight: '700',
    color: '#0F172A',
  },
  contactLine: {
    marginBottom: hp(0.9),
  },
  contactLabel: {
    fontSize: FSize.fs12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  contactValue: {
    marginTop: hp(0.15),
    fontSize: FSize.fs15,
    fontWeight: '700',
    color: '#0F172A',
  },
  contactActions: {
    flexDirection: 'row',
    gap: wp(2.4),
    marginTop: hp(0.8),
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1.4),
    borderWidth: 1.2,
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
    borderRadius: wp(3),
    paddingVertical: hp(1.25),
  },
  whatsappText: {
    fontSize: FSize.fs13,
    fontWeight: '800',
    color: '#16A34A',
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1.4),
    backgroundColor: '#2563EB',
    borderRadius: wp(3),
    paddingVertical: hp(1.25),
  },
  callText: {
    fontSize: FSize.fs13,
    fontWeight: '800',
    color: Colors.white,
  },
  lockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2.4),
    marginTop: hp(1.6),
    backgroundColor: '#FFF7ED',
    borderRadius: wp(3.5),
    padding: wp(3.6),
  },
  lockText: {
    flex: 1,
    fontSize: FSize.fs13,
    color: '#B45309',
    fontWeight: '600',
    lineHeight: hp(2.2),
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: wp(4),
    paddingTop: hp(1.2),
    paddingBottom: Platform.OS === 'ios' ? hp(3) : hp(2),
    backgroundColor: 'rgba(248,250,252,0.96)',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    backgroundColor: '#0077FF',
    borderRadius: wp(4),
    paddingVertical: hp(1.7),
    ...Platform.select({
      ios: {
        shadowColor: '#0077FF',
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.28,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
        shadowColor: '#0077FF',
      },
    }),
  },
  ctaText: {
    fontSize: FSize.fs15,
    fontWeight: '800',
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: wp(6),
    borderTopRightRadius: wp(6),
    paddingHorizontal: wp(5),
    paddingTop: hp(1.2),
    paddingBottom: Platform.OS === 'ios' ? hp(4) : hp(3),
  },
  modalHandle: {
    alignSelf: 'center',
    width: wp(12),
    height: hp(0.5),
    borderRadius: wp(1),
    backgroundColor: '#E2E8F0',
    marginBottom: hp(1.6),
  },
  modalTitle: {
    fontSize: FSize.fs20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  modalSubtitle: {
    marginTop: hp(0.7),
    fontSize: FSize.fs13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: hp(2.3),
  },
  modalLeadBox: {
    marginTop: hp(2),
    backgroundColor: '#F8FAFC',
    borderRadius: wp(3.5),
    padding: wp(3.6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalLeadTitle: {
    fontSize: FSize.fs15,
    fontWeight: '800',
    color: '#0F172A',
  },
  creditChip: {
    marginTop: hp(1),
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.2),
    backgroundColor: '#EEF4FF',
    borderRadius: wp(2),
    paddingHorizontal: wp(2.4),
    paddingVertical: hp(0.5),
  },
  creditChipText: {
    fontSize: FSize.fs13,
    fontWeight: '700',
    color: '#2563EB',
  },
  modalButtonRow: {
    flexDirection: 'row',
    marginTop: hp(2.4),
    gap: wp(3),
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: hp(1.5),
    borderRadius: wp(3),
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: FSize.fs14,
    color: '#64748B',
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: hp(1.5),
    borderRadius: wp(3),
    backgroundColor: Colors.sooprsblue,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.65,
  },
  confirmBtnText: {
    fontSize: FSize.fs14,
    color: Colors.white,
    fontWeight: '800',
  },
});
