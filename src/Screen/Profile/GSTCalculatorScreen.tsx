import React, {useMemo, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import FSize from '../../assets/commonCSS/FSize';
import Images from '../../assets/image';

const GST_RATES = [3, 5, 12, 18, 28];

const formatCurrency = (value: number) => {
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatUpdatedDate = () => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const parseAmount = (value: string) => {
  const cleaned = value.replace(/,/g, '').trim();
  if (!cleaned) {
    return 0;
  }
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const GSTCalculatorScreen = () => {
  const navigation = useNavigation();
  const [selectedGstRate, setSelectedGstRate] = useState(5);
  const [amount, setAmount] = useState('1500.00');
  const [showProfitInput, setShowProfitInput] = useState(false);
  const [profit, setProfit] = useState('');
  const [showBreakup, setShowBreakup] = useState(false);

  const amountValue = useMemo(() => parseAmount(amount), [amount]);
  const profitValue = useMemo(
    () => (showProfitInput ? parseAmount(profit) : 0),
    [showProfitInput, profit],
  );

  const gstAmount = useMemo(
    () => (amountValue * selectedGstRate) / 100,
    [amountValue, selectedGstRate],
  );

  const totalSellingPrice = useMemo(
    () => amountValue + gstAmount + profitValue,
    [amountValue, gstAmount, profitValue],
  );

  const handleAmountChange = (text: string) => {
    const sanitized = text.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      return;
    }
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    setAmount(sanitized);
  };

  const handleProfitChange = (text: string) => {
    const sanitized = text.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      return;
    }
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    setProfit(sanitized);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Image source={Images.backArrow} style={styles.backArrowIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GST Calculator</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.mainTitle}>
            GST Calculator: Online Indian GST Calculator
          </Text>
          <Text style={styles.mainSubtitle}>
            Instantly Calculate GST using this Indian GST Calculator
          </Text>
          <View style={styles.titleDivider} />
          <Text style={styles.updatedText}>
            Updated on: {formatUpdatedDate()}
          </Text>

          <Text style={styles.sectionLabel}>Select GST Rates</Text>
          <View style={styles.rateRow}>
            {GST_RATES.map(rate => {
              const isSelected = selectedGstRate === rate;
              return (
                <TouchableOpacity
                  key={rate}
                  style={[
                    styles.rateButton,
                    isSelected && styles.rateButtonSelected,
                  ]}
                  onPress={() => setSelectedGstRate(rate)}
                  activeOpacity={0.85}>
                  <Text
                    style={[
                      styles.rateButtonText,
                      isSelected && styles.rateButtonTextSelected,
                    ]}>
                    {rate}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>
            Cost of Goods / Services(Without GST)
          </Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <View style={styles.amountDivider} />
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              placeholderTextColor="#9AA4B2"
              keyboardType="decimal-pad"
            />
          </View>

          {!showProfitInput ? (
            <TouchableOpacity
              onPress={() => setShowProfitInput(true)}
              activeOpacity={0.7}>
              <Text style={styles.addProfitText}>+ Add Profit Ratio</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.profitSection}>
              <View style={styles.profitHeaderRow}>
                <Text style={styles.sectionLabel}>Total Profit</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowProfitInput(false);
                    setProfit('');
                  }}>
                  <Text style={styles.removeProfitText}>Remove</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <View style={styles.amountDivider} />
                <TextInput
                  style={styles.amountInput}
                  value={profit}
                  onChangeText={handleProfitChange}
                  placeholder="0.00"
                  placeholderTextColor="#9AA4B2"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          )}

          <View style={styles.resultWrapper}>
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultHeaderText}>
                  Total selling price will be
                </Text>
              </View>

              <Text style={styles.totalPriceText}>
                ₹ {formatCurrency(totalSellingPrice)}
              </Text>

              <View style={styles.subResultRow}>
                <View style={styles.subResultCard}>
                  <View style={styles.subResultTopBar} />
                  <Text style={styles.subResultLabel}>Total Profit</Text>
                  <Text style={styles.subResultValue}>
                    ₹ {formatCurrency(profitValue)}
                  </Text>
                </View>
                <View style={styles.subResultCard}>
                  <View style={styles.subResultTopBar} />
                  <Text style={styles.subResultLabel}>Total GST</Text>
                  <Text style={styles.subResultValue}>
                    ₹ {formatCurrency(gstAmount)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.breakupLink}
                onPress={() => setShowBreakup(true)}
                activeOpacity={0.7}>
                <Text style={styles.breakupLinkText}>Check Full Breakup →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showBreakup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBreakup(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Full Breakup</Text>
            <View style={styles.breakupRow}>
              <Text style={styles.breakupLabel}>Cost of Goods</Text>
              <Text style={styles.breakupValue}>
                ₹ {formatCurrency(amountValue)}
              </Text>
            </View>
            <View style={styles.breakupRow}>
              <Text style={styles.breakupLabel}>
                GST ({selectedGstRate}%)
              </Text>
              <Text style={styles.breakupValue}>
                ₹ {formatCurrency(gstAmount)}
              </Text>
            </View>
            <View style={styles.breakupRow}>
              <Text style={styles.breakupLabel}>Total Profit</Text>
              <Text style={styles.breakupValue}>
                ₹ {formatCurrency(profitValue)}
              </Text>
            </View>
            <View style={styles.breakupDivider} />
            <View style={styles.breakupRow}>
              <Text style={styles.breakupTotalLabel}>Total Selling Price</Text>
              <Text style={styles.breakupTotalValue}>
                ₹ {formatCurrency(totalSellingPrice)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowBreakup(false)}
              activeOpacity={0.85}>
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default GSTCalculatorScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: hp(2),
    backgroundColor: '#F7F9FC',
  },
  // flex: {
  //   flex: 1,
  // },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(1),
    // backgroundColor: Colors.white,
  },
  backButton: {
    width: wp(10),
    height: wp(10),
    justifyContent: 'center',
  },
  backArrowIcon: {
    width: wp(8),
    height: wp(8),
    tintColor: Colors.black,
  },
  headerTitle: {
    fontSize: FSize.fs18,
    fontWeight: '700',
    color: '#0D2149',
  },
  headerSpacer: {
    width: wp(10),
  },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2.5),
    paddingBottom: hp(4),
  },
  mainTitle: {
    fontSize: FSize.fs22,
    fontWeight: '700',
    color: '#0D2149',
    lineHeight: FSize.fs22 * 1.35,
    marginBottom: hp(0.8),
  },
  mainSubtitle: {
    fontSize: FSize.fs14,
    color: '#6B7A90',
    lineHeight: FSize.fs14 * 1.4,
    marginBottom: hp(1.2),
  },
  titleDivider: {
    width: wp(12),
    height: 3,
    backgroundColor: '#3A86FF',
    borderRadius: 2,
    marginBottom: hp(1),
  },
  updatedText: {
    fontSize: FSize.fs12,
    color: '#9AA4B2',
    marginBottom: hp(3),
  },
  sectionLabel: {
    fontSize: FSize.fs15,
    fontWeight: '700',
    color: '#0D2149',
    marginBottom: hp(1.5),
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(3),
  },
  rateButton: {
    width: wp(15.5),
    height: wp(14),
    borderRadius: wp(2),
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  rateButtonSelected: {
    borderColor: '#3A86FF',
  },
  rateButtonText: {
    fontSize: FSize.fs14,
    fontWeight: '500',
    color: '#4A5568',
  },
  rateButtonTextSelected: {
    fontWeight: '700',
    color: '#3A86FF',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: '#C8D9F5',
    borderRadius: wp(2.5),
    paddingHorizontal: wp(3.5),
    marginBottom: hp(2.5),
  },
  currencyPrefix: {
    fontSize: FSize.fs16,
    fontWeight: '600',
    color: '#0D2149',
    paddingVertical: Platform.OS === 'ios' ? hp(1.6) : hp(1.4),
  },
  amountDivider: {
    width: 1,
    height: hp(2.8),
    backgroundColor: '#C9D2E0',
    marginHorizontal: wp(3),
  },
  amountInput: {
    flex: 1,
    fontSize: FSize.fs16,
    color: '#0D2149',
    paddingVertical: Platform.OS === 'ios' ? hp(1.6) : hp(1.4),
  },
  addProfitText: {
    fontSize: FSize.fs14,
    fontWeight: '600',
    color: '#3A86FF',
    marginBottom: hp(3),
  },
  profitSection: {
    marginBottom: hp(1),
  },
  profitHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  removeProfitText: {
    fontSize: FSize.fs13,
    color: '#E53935',
    fontWeight: '600',
    marginBottom: hp(1.5),
  },
  resultWrapper: {
    backgroundColor: '#3A86FF',
    borderRadius: wp(4),
    padding: wp(3),
    marginTop: hp(1),
  },
  resultCard: {
    backgroundColor: Colors.white,
    borderRadius: wp(3.5),
    overflow: 'hidden',
    paddingBottom: hp(2),
  },
  resultHeader: {
    backgroundColor: '#3A86FF',
    paddingVertical: hp(1.6),
    alignItems: 'center',
  },
  resultHeaderText: {
    color: Colors.white,
    fontSize: FSize.fs14,
    fontWeight: '500',
  },
  totalPriceText: {
    fontSize: FSize.fs28,
    fontWeight: '700',
    color: '#3A86FF',
    textAlign: 'center',
    marginTop: hp(2.2),
    marginBottom: hp(2),
  },
  subResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(3.5),
    marginBottom: hp(2),
  },
  subResultCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: wp(2),
    borderWidth: 1,
    borderColor: '#EEF1F6',
    paddingBottom: hp(1.5),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  subResultTopBar: {
    height: 4,
    backgroundColor: '#E8ECF2',
    marginBottom: hp(1.2),
  },
  subResultLabel: {
    fontSize: FSize.fs12,
    color: '#6B7A90',
    textAlign: 'center',
    marginBottom: hp(0.6),
  },
  subResultValue: {
    fontSize: FSize.fs15,
    fontWeight: '600',
    color: '#3A86FF',
    textAlign: 'center',
  },
  breakupLink: {
    alignItems: 'center',
  },
  breakupLinkText: {
    fontSize: FSize.fs13,
    color: '#B0B8C4',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: wp(6),
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: wp(3.5),
    paddingHorizontal: wp(5),
    paddingVertical: hp(2.5),
  },
  modalTitle: {
    fontSize: FSize.fs18,
    fontWeight: '700',
    color: '#0D2149',
    marginBottom: hp(2),
    textAlign: 'center',
  },
  breakupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1.2),
  },
  breakupLabel: {
    fontSize: FSize.fs14,
    color: '#6B7A90',
  },
  breakupValue: {
    fontSize: FSize.fs14,
    fontWeight: '600',
    color: '#0D2149',
  },
  breakupDivider: {
    height: 1,
    backgroundColor: '#E8ECF2',
    marginVertical: hp(1),
  },
  breakupTotalLabel: {
    fontSize: FSize.fs15,
    fontWeight: '700',
    color: '#0D2149',
  },
  breakupTotalValue: {
    fontSize: FSize.fs15,
    fontWeight: '700',
    color: '#3A86FF',
  },
  modalCloseButton: {
    backgroundColor: '#3A86FF',
    borderRadius: wp(2.5),
    paddingVertical: hp(1.5),
    alignItems: 'center',
    marginTop: hp(2),
  },
  modalCloseButtonText: {
    color: Colors.white,
    fontSize: FSize.fs15,
    fontWeight: '700',
  },
});
