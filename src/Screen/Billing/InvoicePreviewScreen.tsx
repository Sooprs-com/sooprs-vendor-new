import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import FSize from '../../assets/commonCSS/FSize';
import Images from '../../assets/image';

type PreviewItem = {
  itemName: string;
  gstRate: number;
  quantity: number;
  rate: number;
  amount: number;
  igst: number;
  total: number;
};

export type InvoicePreviewData = {
  invoiceTitle: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate?: string;
  businessLogoUri?: string | null;
  billedBy: {
    name: string;
    addressLines: string[];
    gstin?: string;
    pan?: string;
  };
  billedTo: {
    name: string;
    addressLines: string[];
    gstin?: string;
    pan?: string;
    phone?: string;
  };
  items: PreviewItem[];
  bankDetails?: {
    accountName?: string;
    accountNumber?: string;
    ifsc?: string;
    accountType?: string;
    bank?: string;
  };
  totals: {
    amount: number;
    igst: number;
    total: number;
    totalInWords: string;
  };
  terms?: string[];
};

const formatINR = (n: number) =>
  `₹${n.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

const InvoicePreviewScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const invoice = (route.params as {invoice: InvoicePreviewData} | undefined)?.invoice;

  if (!invoice) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Image source={Images.backArrow} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invoice</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No invoice data found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const terms = invoice.terms?.length ? invoice.terms : ['Please quote invoice number when remitting funds.'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Image source={Images.backArrow} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Title + logo */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>{invoice.invoiceTitle || 'Invoice'}</Text>
          {invoice.businessLogoUri ? (
            <Image source={{uri: invoice.businessLogoUri}} style={styles.brandLogo} resizeMode="contain" />
          ) : null}
        </View>

        {/* Invoice meta */}
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Invoice No #</Text>
          <Text style={styles.metaValue}>{invoice.invoiceNo}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Invoice Date</Text>
          <Text style={styles.metaValue}>{invoice.invoiceDate}</Text>
        </View>
        {invoice.dueDate ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Due Date</Text>
            <Text style={styles.metaValue}>{invoice.dueDate}</Text>
          </View>
        ) : null}

        {/* Billed By / To */}
        <View style={styles.billedRow}>
          <View style={styles.billedCard}>
            <Text style={styles.billedTitle}>Billed By</Text>
            <Text style={styles.billedName}>{invoice.billedBy.name}</Text>
            {invoice.billedBy.addressLines.map((l, idx) => (
              <Text key={idx} style={styles.billedLine}>
                {l}
              </Text>
            ))}
            {invoice.billedBy.gstin ? <Text style={styles.billedLine}>GSTIN: {invoice.billedBy.gstin}</Text> : null}
            {invoice.billedBy.pan ? <Text style={styles.billedLine}>PAN: {invoice.billedBy.pan}</Text> : null}
          </View>

          <View style={styles.billedCard}>
            <Text style={styles.billedTitle}>Billed To</Text>
            <Text style={styles.billedName}>{invoice.billedTo.name}</Text>
            {invoice.billedTo.addressLines.map((l, idx) => (
              <Text key={idx} style={styles.billedLine}>
                {l}
              </Text>
            ))}
            {invoice.billedTo.gstin ? <Text style={styles.billedLine}>GSTIN: {invoice.billedTo.gstin}</Text> : null}
            {invoice.billedTo.pan ? <Text style={styles.billedLine}>PAN: {invoice.billedTo.pan}</Text> : null}
            {invoice.billedTo.phone ? <Text style={styles.billedLine}>Phone: {invoice.billedTo.phone}</Text> : null}
          </View>
        </View>

        {/* Items table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.colItem]}>Item</Text>
          <Text style={[styles.th, styles.colGst]}>GST{'\n'}Rate</Text>
          <Text style={[styles.th, styles.colQty]}>Quantity</Text>
          <Text style={[styles.th, styles.colRate]}>Rate</Text>
          <Text style={[styles.th, styles.colAmount]}>Amount</Text>
          <Text style={[styles.th, styles.colIgst]}>IGST</Text>
          <Text style={[styles.th, styles.colTotal]}>Total</Text>
        </View>
        {invoice.items.map((it, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={[styles.td, styles.colItem]} numberOfLines={2}>
              {idx + 1}. {it.itemName}
            </Text>
            <Text style={[styles.td, styles.colGst]}>{it.gstRate}%</Text>
            <Text style={[styles.td, styles.colQty]}>{it.quantity}</Text>
            <Text style={[styles.td, styles.colRate]}>{formatINR(it.rate).replace('.00', '')}</Text>
            <Text style={[styles.td, styles.colAmount]}>{formatINR(it.amount)}</Text>
            <Text style={[styles.td, styles.colIgst]}>{formatINR(it.igst)}</Text>
            <Text style={[styles.td, styles.colTotal]}>{formatINR(it.total)}</Text>
          </View>
        ))}

        {/* Bank + totals */}
        <View style={styles.bottomRow}>
          <View style={styles.bankCard}>
            <Text style={styles.bankTitle}>Bank Details</Text>
            <View style={styles.bankGrid}>
              <Text style={styles.bankLabel}>Account Name</Text>
              <Text style={styles.bankValue}>{invoice.bankDetails?.accountName || '-'}</Text>
              <Text style={styles.bankLabel}>Account Number</Text>
              <Text style={styles.bankValue}>{invoice.bankDetails?.accountNumber || '-'}</Text>
              <Text style={styles.bankLabel}>IFSC</Text>
              <Text style={styles.bankValue}>{invoice.bankDetails?.ifsc || '-'}</Text>
              <Text style={styles.bankLabel}>Account Type</Text>
              <Text style={styles.bankValue}>{invoice.bankDetails?.accountType || '-'}</Text>
              <Text style={styles.bankLabel}>Bank</Text>
              <Text style={styles.bankValue}>{invoice.bankDetails?.bank || '-'}</Text>
            </View>
          </View>

          <View style={styles.totalCard}>
            <View style={styles.totalLine}>
              <Text style={styles.totalSmallLabel}>Amount</Text>
              <Text style={styles.totalSmallValue}>{formatINR(invoice.totals.amount)}</Text>
            </View>
            <View style={styles.totalLine}>
              <Text style={styles.totalSmallLabel}>IGST</Text>
              <Text style={styles.totalSmallValue}>{formatINR(invoice.totals.igst)}</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalBigRow}>
              <Text style={styles.totalBigLabel}>Total (INR)</Text>
              <Text style={styles.totalBigValue}>{formatINR(invoice.totals.total)}</Text>
            </View>
            <Text style={styles.wordsLabel}>
              Total (in words):{' '}
              <Text style={styles.wordsValue}>{invoice.totals.totalInWords.toUpperCase()}</Text>
            </Text>
          </View>
        </View>

        {/* Terms */}
        <Text style={styles.termsTitle}>Terms and Conditions</Text>
        {terms.map((t, idx) => (
          <Text key={idx} style={styles.termLine}>
            {idx + 1}. {t}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default InvoicePreviewScreen;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.white, paddingTop: hp(2)},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: Colors.white,
  },
  backBtn: {padding: wp(2), marginLeft: -wp(2)},
  backIcon: {width: wp(7), height: wp(7), tintColor: Colors.black},
  headerTitle: {fontSize: FSize.fs18, fontWeight: '700', color: Colors.black},
  headerRight: {width: wp(12)},
  scrollContent: {padding: wp(4), paddingBottom: hp(5)},
  emptyWrap: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  emptyText: {fontSize: FSize.fs14, color: Colors.gray},

  titleRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(1)},
  title: {fontSize: FSize.fs28, fontWeight: '400', color: '#6B4E9E'},
  brandLogo: {width: wp(30), height: hp(5)},

  metaRow: {flexDirection: 'row', marginTop: hp(0.8)},
  metaLabel: {width: wp(30), fontSize: FSize.fs13, color: Colors.gray},
  metaValue: {fontSize: FSize.fs13, fontWeight: '700', color: Colors.black},

  billedRow: {flexDirection: 'row', gap: wp(3), marginTop: hp(2)},
  billedCard: {
    flex: 1,
    backgroundColor: '#F2EEF9',
    borderRadius: wp(2),
    padding: wp(3.5),
  },
  billedTitle: {fontSize: FSize.fs18, fontWeight: '400', color: '#6B4E9E', marginBottom: hp(0.5)},
  billedName: {fontSize: FSize.fs14, fontWeight: '700', color: Colors.black, marginBottom: hp(0.5)},
  billedLine: {fontSize: FSize.fs12, color: Colors.black, marginTop: hp(0.2)},

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#6B4E9E',
    borderRadius: wp(2),
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(2),
    marginTop: hp(2),
  },
  th: {fontSize: FSize.fs11, fontWeight: '700', color: Colors.white},
  tableRow: {
    flexDirection: 'row',
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  td: {fontSize: FSize.fs11, color: Colors.black},
  colItem: {flex: 2.2},
  colGst: {flex: 0.8, textAlign: 'center'},
  colQty: {flex: 0.9, textAlign: 'center'},
  colRate: {flex: 1.1, textAlign: 'right'},
  colAmount: {flex: 1.2, textAlign: 'right'},
  colIgst: {flex: 1.1, textAlign: 'right'},
  colTotal: {flex: 1.3, textAlign: 'right'},

  bottomRow: {flexDirection: 'row', gap: wp(3), marginTop: hp(2)},
  bankCard: {flex: 1.1, backgroundColor: '#F2EEF9', borderRadius: wp(2), padding: wp(3.5)},
  bankTitle: {fontSize: FSize.fs16, fontWeight: '400', color: '#6B4E9E', marginBottom: hp(1)},
  bankGrid: {rowGap: hp(0.8)},
  bankLabel: {fontSize: FSize.fs12, fontWeight: '700', color: Colors.black},
  bankValue: {fontSize: FSize.fs12, color: Colors.black, marginBottom: hp(0.3)},

  totalCard: {flex: 1, padding: wp(1), justifyContent: 'flex-start'},
  totalLine: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: hp(0.8)},
  totalSmallLabel: {fontSize: FSize.fs13, color: Colors.black},
  totalSmallValue: {fontSize: FSize.fs13, color: Colors.black},
  totalDivider: {height: 2, backgroundColor: Colors.black, opacity: 0.2, marginVertical: hp(1)},
  totalBigRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline'},
  totalBigLabel: {fontSize: FSize.fs18, fontWeight: '700', color: Colors.black},
  totalBigValue: {fontSize: FSize.fs18, fontWeight: '700', color: Colors.black},
  wordsLabel: {fontSize: FSize.fs11, color: Colors.black, marginTop: hp(1)},
  wordsValue: {fontSize: FSize.fs11, fontWeight: '700', color: Colors.black},

  termsTitle: {fontSize: FSize.fs16, fontWeight: '400', color: '#6B4E9E', marginTop: hp(3)},
  termLine: {fontSize: FSize.fs13, color: Colors.black, marginTop: hp(0.6)},
});

