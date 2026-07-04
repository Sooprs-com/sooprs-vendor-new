import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {launchImageLibrary, ImagePickerResponse, MediaType} from 'react-native-image-picker';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import FSize from '../../assets/commonCSS/FSize';
import Images from '../../assets/image';
import type {Customer} from './CreateCustomerScreen';
import {BILLING_CUSTOMERS_KEY} from './CreateCustomerScreen';
import type {InvoicePreviewData} from './InvoicePreviewScreen';

type InvoiceItem = {
  id: string;
  itemName: string;
  hsnSac: string;
  gstRate: string;
  quantity: string;
  rate: string;
};

const numberToWords = (n: number): string => {
  if (n === 0) return 'Zero Rupees Only';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const toWords = (num: number): string => {
    if (num === 0) return '';
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + toWords(num % 100) : '');
    if (num < 100000) return toWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + toWords(num % 1000) : '');
    if (num < 10000000) return toWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + toWords(num % 100000) : '');
    return toWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + toWords(num % 10000000) : '');
  };
  const [whole, frac] = n.toFixed(2).split('.');
  const fracNum = parseInt(frac, 10);
  let str = toWords(parseInt(whole, 10)) + (parseInt(whole, 10) === 1 ? ' Rupee' : ' Rupees');
  if (fracNum > 0) str += ' And ' + toWords(fracNum) + (fracNum === 1 ? ' Paise' : ' Paise');
  return str + ' Only';
};

const formatDate = (d: Date) =>
  d.toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'});

const COUNTRIES = ['India', 'United States', 'United Kingdom', 'UAE', 'Singapore', 'Other'];

const CreateInvoiceScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const selectedCustomer = (route.params as {customer?: Customer} | undefined)?.customer;

  const [invoiceTitle, setInvoiceTitle] = useState('Invoice');
  const [invoiceNo, setInvoiceNo] = useState('A00001');
  const [invoiceDate, setInvoiceDate] = useState(formatDate(new Date()));
  const [showDueDate, setShowDueDate] = useState(false);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return formatDate(d);
  });
  const [showCustomFields, setShowCustomFields] = useState(false);
  const [businessLogoUri, setBusinessLogoUri] = useState<string | null>(null);

  const [billedByCountry, setBilledByCountry] = useState('India');
  const [billedByCompany, setBilledByCompany] = useState('');
  const [billedByPhone, setBilledByPhone] = useState('');
  const [billedByGstin, setBilledByGstin] = useState('');
  const [billedByPan, setBilledByPan] = useState('');
  const [billedByAddress, setBilledByAddress] = useState('');
  const [billedByCity, setBilledByCity] = useState('');
  const [billedByPostal, setBilledByPostal] = useState('');

  const [billedToCountry, setBilledToCountry] = useState('India');
  const [billedToCompany, setBilledToCompany] = useState('');
  const [billedToPhone, setBilledToPhone] = useState('');
  const [billedToGstin, setBilledToGstin] = useState('');
  const [billedToPan, setBilledToPan] = useState('');
  const [billedToAddress, setBilledToAddress] = useState('');
  const [billedToCity, setBilledToCity] = useState('');
  const [billedToPostal, setBilledToPostal] = useState('');
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [countryModalFor, setCountryModalFor] = useState<'by' | 'to' | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [stateOptional, setStateOptional] = useState('');
  const [addShippingDetails, setAddShippingDetails] = useState(false);
  const [currency, setCurrency] = useState('Indian Rupee (INR, ₹)');

  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankAccountType, setBankAccountType] = useState('Current');
  const [bankName, setBankName] = useState('');

  const [termsText, setTermsText] = useState('1. Please quote invoice number when remitting funds.');

  const [items, setItems] = useState<InvoiceItem[]>([
    {id: '1', itemName: '', hsnSac: '', gstRate: '18', quantity: '1', rate: '1'},
  ]);

  const [showDiscounts, setShowDiscounts] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('');
  const [showAdditionalCharges, setShowAdditionalCharges] = useState(false);
  const [additionalChargesAmount, setAdditionalChargesAmount] = useState('');
  const [roundMode, setRoundMode] = useState<'none' | 'up' | 'down'>('none');
  const [summariseQuantity, setSummariseQuantity] = useState(false);
  const [showTotalInWords, setShowTotalInWords] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(BILLING_CUSTOMERS_KEY);
        if (raw) setCustomers(JSON.parse(raw));
      } catch (e) {
        console.log('Error loading customers:', e);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      setBilledToCompany(selectedCustomer.businessName);
      setBilledToAddress(selectedCustomer.address || '');
      setBilledToCity(selectedCustomer.city || '');
      setBilledToPostal(selectedCustomer.pincode || '');
      setBilledToGstin(selectedCustomer.gstNumber || '');
      setBilledToPan(selectedCustomer.pan || '');
      setBilledToPhone(selectedCustomer.phone || '');
    }
  }, [selectedCustomer]);

  const addItem = () => {
    setItems(prev => [...prev, {id: Date.now().toString(), itemName: '', hsnSac: '', gstRate: '18', quantity: '1', rate: ''}]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string) => {
    setItems(prev => prev.map(i => (i.id === id ? {...i, [field]: value} : i)));
  };

  const selectCustomer = (c: Customer) => {
    setBilledToCompany(c.businessName);
    setBilledToAddress(c.address || '');
    setBilledToCity(c.city || '');
    setBilledToPostal(c.pincode || '');
    setBilledToGstin(c.gstNumber || '');
    setBilledToPan(c.pan || '');
    setBilledToPhone(c.phone || '');
    setCustomerModalVisible(false);
  };

  const pickLogo = () => {
    launchImageLibrary(
      {mediaType: 'photo' as MediaType, quality: 0.8, maxWidth: 1080, maxHeight: 1080},
      (response: ImagePickerResponse) => {
        if (response.didCancel) return;
        if (response.assets?.[0]?.uri) setBusinessLogoUri(response.assets[0].uri);
      },
    );
  };

  const getItemCalculations = (item: InvoiceItem) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    const gstPct = parseFloat(item.gstRate) || 0;
    const amount = qty * rate;
    const gstAmount = (amount * gstPct) / 100;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;
    const total = amount + gstAmount;
    return {amount, cgst, sgst, total};
  };

  const rawTotals = items.reduce(
    (acc, item) => {
      const {amount, cgst, sgst, total} = getItemCalculations(item);
      return {
        amount: acc.amount + amount,
        cgst: acc.cgst + cgst,
        sgst: acc.sgst + sgst,
        total: acc.total + total,
      };
    },
    {amount: 0, cgst: 0, sgst: 0, total: 0},
  );

  const discount = parseFloat(discountAmount) || 0;
  const additionalCharges = parseFloat(additionalChargesAmount) || 0;
  let finalTotal = rawTotals.total - discount + additionalCharges;
  if (roundMode === 'up') finalTotal = Math.ceil(finalTotal);
  else if (roundMode === 'down') finalTotal = Math.floor(finalTotal);
  finalTotal = Math.round(finalTotal * 100) / 100;

  const totalQuantity = items.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0), 0);

  const buildAddressLines = (addr: string, city: string, state: string, postal: string, country: string) => {
    const line1 = addr?.trim();
    const line2 = [city, state].filter(Boolean).join(', ').trim();
    const line3 = [country, postal].filter(Boolean).join(' - ').trim();
    return [line1, line2, line3].filter(l => l && l.length > 0);
  };

  const handleGenerateInvoice = () => {
    if (!invoiceNo.trim()) {
      Alert.alert('Missing', 'Please enter Invoice No');
      return;
    }
    if (!invoiceDate.trim()) {
      Alert.alert('Missing', 'Please enter Invoice Date');
      return;
    }
    if (!billedByCompany.trim()) {
      Alert.alert('Missing', 'Please enter Billed By (Your Business Name)');
      return;
    }
    if (!billedToCompany.trim()) {
      Alert.alert('Missing', 'Please enter Billed To (Client Business Name)');
      return;
    }
    const validItems = items
      .map(it => {
        const qty = parseFloat(it.quantity) || 0;
        const rate = parseFloat(it.rate) || 0;
        const gstRate = parseFloat(it.gstRate) || 0;
        const amount = qty * rate;
        const igst = (amount * gstRate) / 100;
        const total = amount + igst;
        return {
          itemName: (it.itemName || '').trim(),
          gstRate,
          quantity: qty,
          rate,
          amount,
          igst,
          total,
        };
      })
      .filter(it => it.itemName && it.quantity > 0 && it.rate > 0);

    if (validItems.length === 0) {
      Alert.alert('Missing', 'Please add at least one item with name, quantity and rate.');
      return;
    }

    const igstTotal = rawTotals.cgst + rawTotals.sgst;
    const terms = (termsText || '')
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean)
      .map(t => t.replace(/^\d+\.\s*/, ''));

    const invoice: InvoicePreviewData = {
      invoiceTitle,
      invoiceNo: invoiceNo.trim(),
      invoiceDate: invoiceDate.trim(),
      dueDate: showDueDate ? dueDate.trim() : undefined,
      businessLogoUri,
      billedBy: {
        name: billedByCompany.trim(),
        addressLines: buildAddressLines(billedByAddress, billedByCity, stateOptional, billedByPostal, billedByCountry),
        gstin: billedByGstin.trim() || undefined,
        pan: billedByPan.trim() || undefined,
      },
      billedTo: {
        name: billedToCompany.trim(),
        addressLines: buildAddressLines(billedToAddress, billedToCity, stateOptional, billedToPostal, billedToCountry),
        gstin: billedToGstin.trim() || undefined,
        pan: billedToPan.trim() || undefined,
        phone: billedToPhone.trim() || undefined,
      },
      items: validItems,
      bankDetails: {
        accountName: bankAccountName.trim() || undefined,
        accountNumber: bankAccountNumber.trim() || undefined,
        ifsc: bankIfsc.trim() || undefined,
        accountType: bankAccountType.trim() || undefined,
        bank: bankName.trim() || undefined,
      },
      totals: {
        amount: rawTotals.amount,
        igst: igstTotal,
        total: finalTotal,
        totalInWords: numberToWords(finalTotal),
      },
      terms,
    };

    navigation.navigate('InvoicePreviewScreen', {invoice});
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Image source={Images.backArrow} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Invoice</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Invoice basics - grouped in a card */}
        <View style={styles.topCard}>
        {/* Invoice title row: title + logo */}
        <View style={styles.invoiceTitleRow}>
          <View style={styles.invoiceTitleWrap}>
            <TextInput
              style={styles.invoiceTitleInput}
              value={invoiceTitle}
              onChangeText={setInvoiceTitle}
              placeholder="Invoice"
            />
            <TouchableOpacity hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Image source={Images.editIcon} style={styles.editIcon} resizeMode="contain" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.logoBox} onPress={pickLogo} activeOpacity={0.8}>
            {businessLogoUri ? (
              <Image source={{uri: businessLogoUri}} style={styles.logoPreview} resizeMode="contain" />
            ) : (
              <>
                <Image source={Images.ImageSelectContener} style={styles.logoPlaceholderIcon} resizeMode="contain" />
                <Text style={styles.logoBoxTitle}>Add Business Logo</Text>
                <Text style={styles.logoBoxHint}>Resolution up to 1080x1080px.</Text>
                <Text style={styles.logoBoxHint}>PNG or JPEG file.</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.dashedLine} />

        <Text style={styles.labelRequired}>Invoice No *</Text>
        <TextInput
          style={styles.inputDashed}
          placeholder="A00001"
          placeholderTextColor={Colors.lightgrey2}
          value={invoiceNo}
          onChangeText={setInvoiceNo}
        />

        <Text style={styles.labelRequired}>Invoice Date *</Text>
        <View style={styles.inputWithIcon}>
          <TextInput
            style={[styles.inputDashed, styles.flex1]}
            placeholder="Feb 18, 2026"
            placeholderTextColor={Colors.lightgrey2}
            value={invoiceDate}
            onChangeText={setInvoiceDate}
          />
          <Image source={Images.CalenderIcon} style={styles.calendarIcon} resizeMode="contain" />
        </View>

        <TouchableOpacity style={styles.linkBtn} onPress={() => setShowDueDate(!showDueDate)}>
          <Text style={styles.linkText}>+ Add due date</Text>
        </TouchableOpacity>
        {showDueDate && (
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Due Date</Text>
            <TextInput
              style={styles.input}
              placeholder="Mar 05, 2026"
              placeholderTextColor={Colors.lightgrey2}
              value={dueDate}
              onChangeText={setDueDate}
            />
          </View>
        )}

        <TouchableOpacity style={styles.linkBtn} onPress={() => setShowCustomFields(!showCustomFields)} activeOpacity={0.7}>
          <Text style={styles.linkText}>+ Add Custom Fields</Text>
        </TouchableOpacity>
        </View>

        {/* Billed By (Your Details) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Billed By</Text>
            <Text style={styles.cardSubtitle}>Your Details</Text>
          </View>
          <View style={styles.dashedLineThin} />
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Country</Text>
            <TouchableOpacity style={styles.inputBox} onPress={() => setCountryModalFor('by')}>
              <Text style={[styles.input, styles.flex1]}>{billedByCountry}</Text>
              <Image source={Images.Dropdown} style={styles.dropdownIcon} resizeMode="contain" />
            </TouchableOpacity>
          </View>
          <Text style={styles.labelRequired}>Your Business Name (required)</Text>
          <TextInput
            style={styles.input}
            placeholder="Your business name"
            placeholderTextColor={Colors.lightgrey2}
            value={billedByCompany}
            onChangeText={setBilledByCompany}
          />
          <Text style={styles.label}>Phone Number / Country Code</Text>
          <View style={styles.phoneInput}>
            <Text style={styles.countryCode}>+91</Text>
            <TextInput
              style={[styles.input, styles.flex1]}
              placeholder="Phone number"
              placeholderTextColor={Colors.lightgrey2}
              value={billedByPhone}
              onChangeText={setBilledByPhone}
              keyboardType="phone-pad"
            />
          </View>
          <Text style={styles.labelOptional}>Your GSTIN (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="GSTIN"
            placeholderTextColor={Colors.lightgrey2}
            value={billedByGstin}
            onChangeText={setBilledByGstin}
          />
          <Text style={styles.labelOptional}>Your PAN (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="PAN"
            placeholderTextColor={Colors.lightgrey2}
            value={billedByPan}
            onChangeText={setBilledByPan}
            maxLength={10}
          />
          <Text style={styles.labelOptional}>Address (optional)</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Address"
            placeholderTextColor={Colors.lightgrey2}
            value={billedByAddress}
            onChangeText={setBilledByAddress}
            multiline
          />
          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.labelOptional}>City (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor={Colors.lightgrey2}
                value={billedByCity}
                onChangeText={setBilledByCity}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.labelOptional}>Postal Code / ZIP Code (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Postal / ZIP"
                placeholderTextColor={Colors.lightgrey2}
                value={billedByPostal}
                onChangeText={setBilledByPostal}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Billed To (Client's Details) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Billed To</Text>
            <Text style={styles.cardSubtitle}>Client's Details</Text>
          </View>
          <View style={styles.dashedLineThin} />
          <TouchableOpacity style={styles.selectCustomerBtn} onPress={() => setCustomerModalVisible(true)}>
            <Text style={styles.selectCustomerText}>Select from saved customers</Text>
            <Image source={Images.chevronRight} style={styles.chevron} resizeMode="contain" />
          </TouchableOpacity>
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Country</Text>
            <TouchableOpacity style={styles.inputBox} onPress={() => setCountryModalFor('to')}>
              <Text style={[styles.input, styles.flex1]}>{billedToCountry}</Text>
              <Image source={Images.Dropdown} style={styles.dropdownIcon} resizeMode="contain" />
            </TouchableOpacity>
          </View>
          <Text style={styles.labelRequired}>Client's Business Name (required)</Text>
          <TextInput
            style={styles.input}
            placeholder="Client business name"
            placeholderTextColor={Colors.lightgrey2}
            value={billedToCompany}
            onChangeText={setBilledToCompany}
          />
          <Text style={styles.label}>Phone Number / Country Code</Text>
          <View style={styles.phoneInput}>
            <Text style={styles.countryCode}>+91</Text>
            <TextInput
              style={[styles.input, styles.flex1]}
              placeholder="Phone number"
              placeholderTextColor={Colors.lightgrey2}
              value={billedToPhone}
              onChangeText={setBilledToPhone}
              keyboardType="phone-pad"
            />
          </View>
          <Text style={styles.labelOptional}>Client's GSTIN (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="GSTIN"
            placeholderTextColor={Colors.lightgrey2}
            value={billedToGstin}
            onChangeText={setBilledToGstin}
          />
          <Text style={styles.labelOptional}>Client's PAN (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="PAN"
            placeholderTextColor={Colors.lightgrey2}
            value={billedToPan}
            onChangeText={setBilledToPan}
            maxLength={10}
          />
          <Text style={styles.labelOptional}>Address (optional)</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Address"
            placeholderTextColor={Colors.lightgrey2}
            value={billedToAddress}
            onChangeText={setBilledToAddress}
            multiline
          />
          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.labelOptional}>City (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor={Colors.lightgrey2}
                value={billedToCity}
                onChangeText={setBilledToCity}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.labelOptional}>Postal Code / ZIP Code (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Postal / ZIP"
                placeholderTextColor={Colors.lightgrey2}
                value={billedToPostal}
                onChangeText={setBilledToPostal}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* State, Shipping, Currency - in a small section */}
        <View style={styles.extraSection}>
        <Text style={styles.labelOptional}>State (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="State"
          placeholderTextColor={Colors.lightgrey2}
          value={stateOptional}
          onChangeText={setStateOptional}
        />
        <TouchableOpacity style={styles.checkRow} onPress={() => setAddShippingDetails(!addShippingDetails)} activeOpacity={0.7}>
          <View style={[styles.checkbox, addShippingDetails && styles.checkboxChecked]} />
          <Text style={styles.checkLabel}>Add Shipping Details</Text>
        </TouchableOpacity>

        <Text style={styles.labelRequired}>Currency *</Text>
        <View style={styles.inputBox}>
          <Text style={[styles.input, styles.flex1]}>{currency}</Text>
          <Image source={Images.Dropdown} style={styles.dropdownIcon} resizeMode="contain" />
        </View>
        </View>

        {/* Item Details - Vertical layout (each item as a card with full-width fields) */}
        <Text style={styles.sectionTitle}>Item Details</Text>
        {items.map((item, idx) => {
          const {amount, cgst, sgst, total} = getItemCalculations(item);
          return (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemCardHeader}>
                <Text style={styles.itemCardTitle}>Item {idx + 1}</Text>
                <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.itemDeleteBtn} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <Image source={Images.deleteIcon} style={styles.removeIcon} resizeMode="contain" />
                </TouchableOpacity>
              </View>
              <Text style={styles.itemLabel}>Item Name</Text>
              <TextInput
                style={styles.itemInput}
                placeholder="Enter item name or description"
                placeholderTextColor={Colors.lightgrey2}
                value={item.itemName}
                onChangeText={v => updateItem(item.id, 'itemName', v)}
              />
              <Text style={styles.itemLabel}>HSN/SAC</Text>
              <TextInput
                style={styles.itemInput}
                placeholder="Enter HSN or SAC code"
                placeholderTextColor={Colors.lightgrey2}
                value={item.hsnSac}
                onChangeText={v => updateItem(item.id, 'hsnSac', v)}
              />
              <View style={styles.itemRow}>
                <View style={styles.itemFieldHalf}>
                  <Text style={styles.itemLabel}>GST Rate (%)</Text>
                  <TextInput
                    style={styles.itemInput}
                    placeholder="18"
                    placeholderTextColor={Colors.lightgrey2}
                    value={item.gstRate}
                    onChangeText={v => updateItem(item.id, 'gstRate', v)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.itemFieldHalf}>
                  <Text style={styles.itemLabel}>Quantity</Text>
                  <TextInput
                    style={styles.itemInput}
                    placeholder="1"
                    placeholderTextColor={Colors.lightgrey2}
                    value={item.quantity}
                    onChangeText={v => updateItem(item.id, 'quantity', v)}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <Text style={styles.itemLabel}>Rate (₹)</Text>
              <TextInput
                style={styles.itemInput}
                placeholder="Enter rate per unit"
                placeholderTextColor={Colors.lightgrey2}
                value={item.rate}
                onChangeText={v => updateItem(item.id, 'rate', v)}
                keyboardType="numeric"
              />
              <View style={styles.itemCalcRow}>
                <Text style={styles.itemCalcLabel}>Amount:</Text>
                <Text style={styles.itemCalcValue}>₹{amount.toFixed(2)}</Text>
              </View>
              <View style={styles.itemCalcRow}>
                <Text style={styles.itemCalcLabel}>CGST:</Text>
                <Text style={styles.itemCalcValue}>₹{cgst.toFixed(2)}</Text>
              </View>
              <View style={styles.itemCalcRow}>
                <Text style={styles.itemCalcLabel}>SGST:</Text>
                <Text style={styles.itemCalcValue}>₹{sgst.toFixed(2)}</Text>
              </View>
              <View style={[styles.itemCalcRow, styles.itemTotalRow]}>
                <Text style={styles.itemTotalLabel}>Total:</Text>
                <Text style={styles.itemTotalValue}>₹{total.toFixed(2)}</Text>
              </View>
            </View>
          );
        })}
        <TouchableOpacity style={styles.addLineBtn} onPress={addItem} activeOpacity={0.7}>
          <Image source={Images.addIcon} style={styles.addIcon} resizeMode="contain" />
          <Text style={styles.addLineText}>Add New Line</Text>
        </TouchableOpacity>

        {/* COMMENTED: Previous horizontal table layout - small inputs, long values overflowed
        <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={styles.tableScrollContent}>
          <View>
            <View style={styles.tableHeader}> ... table header and rows ... </View>
          </View>
        </ScrollView>
        */}

        {/* Summary: Amount, CGST, SGST, Discounts, Additional Charges */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardTitle}>Show Total in PDF</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount</Text>
            <Text style={styles.summaryValue}>₹{rawTotals.amount.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>SGST</Text>
            <Text style={styles.summaryValue}>₹{rawTotals.sgst.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>CGST</Text>
            <Text style={styles.summaryValue}>₹{rawTotals.cgst.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.expandRow} onPress={() => setShowDiscounts(!showDiscounts)}>
            <Text style={styles.linkText}>Add Discounts</Text>
            <Image source={Images.chevronRight} style={[styles.chevronSmall, !showDiscounts && styles.chevronDown]} resizeMode="contain" />
          </TouchableOpacity>
          {showDiscounts && (
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Discount Amount (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={Colors.lightgrey2}
                value={discountAmount}
                onChangeText={setDiscountAmount}
                keyboardType="decimal-pad"
              />
            </View>
          )}
          <TouchableOpacity style={styles.expandRow} onPress={() => setShowAdditionalCharges(!showAdditionalCharges)}>
            <Text style={styles.linkText}>Add Additional Charges</Text>
            <Image source={Images.chevronRight} style={[styles.chevronSmall, !showAdditionalCharges && styles.chevronDown]} resizeMode="contain" />
          </TouchableOpacity>
          {showAdditionalCharges && (
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Additional Charges (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={Colors.lightgrey2}
                value={additionalChargesAmount}
                onChangeText={setAdditionalChargesAmount}
                keyboardType="decimal-pad"
              />
            </View>
          )}
        </View>

        {/* Round Up / Round Down, Summarise Quantity */}
        <View style={styles.roundRow}>
          <TouchableOpacity
            style={[styles.roundBtn, roundMode === 'up' && styles.roundBtnActive]}
            onPress={() => setRoundMode(roundMode === 'up' ? 'none' : 'up')}>
            <Text style={[styles.roundBtnText, roundMode === 'up' && styles.roundBtnActiveText]}>Round Up</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roundBtn, roundMode === 'down' && styles.roundBtnActive]}
            onPress={() => setRoundMode(roundMode === 'down' ? 'none' : 'down')}>
            <Text style={[styles.roundBtnText, roundMode === 'down' && styles.roundBtnActiveText]}>Round Down</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.checkRow} onPress={() => setSummariseQuantity(!summariseQuantity)}>
          <View style={[styles.checkbox, summariseQuantity && styles.checkboxChecked]} />
          <Text style={styles.checkLabel}>Summarise Total Quantity</Text>
        </TouchableOpacity>
        {summariseQuantity && (
          <Text style={styles.quantitySummary}>Total Quantity: {totalQuantity}</Text>
        )}

        {/* Total (INR) with dotted underline */}
        <View style={styles.totalInrRow}>
          <Text style={styles.totalInrLabel}>Total (INR)</Text>
          <View style={styles.totalInrDotted}>
            <Text style={styles.totalInrValue}>₹{finalTotal.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.linkBtn}>
          <Text style={styles.linkText}>+ Add Custom Fields</Text>
        </TouchableOpacity>

        {/* Show Total In Words */}
        <View style={styles.totalWordsCard}>
          <View style={styles.totalWordsHeader}>
            <Text style={styles.totalWordsTitle}>Show Total In Words</Text>
            <TouchableOpacity onPress={() => setShowTotalInWords(!showTotalInWords)}>
              <Image source={Images.eye} style={styles.eyeIcon} resizeMode="contain" />
            </TouchableOpacity>
          </View>
          {showTotalInWords && (
            <>
              <Text style={styles.totalWordsLabel}>Total (in words)</Text>
              <Text style={styles.totalWordsValue}>{numberToWords(finalTotal)}</Text>
            </>
          )}
        </View>

        {/* Bank Details */}
        <View style={styles.bankFormCard}>
          <Text style={styles.bankFormTitle}>Bank Details</Text>
          <Text style={styles.label}>Account Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Account Name"
            placeholderTextColor={Colors.lightgrey2}
            value={bankAccountName}
            onChangeText={setBankAccountName}
          />
          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Account Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Account Number"
                placeholderTextColor={Colors.lightgrey2}
                value={bankAccountNumber}
                onChangeText={setBankAccountNumber}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>IFSC</Text>
              <TextInput
                style={styles.input}
                placeholder="IFSC"
                placeholderTextColor={Colors.lightgrey2}
                value={bankIfsc}
                onChangeText={setBankIfsc}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Account Type</Text>
              <TextInput
                style={styles.input}
                placeholder="Current"
                placeholderTextColor={Colors.lightgrey2}
                value={bankAccountType}
                onChangeText={setBankAccountType}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Bank</Text>
              <TextInput
                style={styles.input}
                placeholder="Bank Name"
                placeholderTextColor={Colors.lightgrey2}
                value={bankName}
                onChangeText={setBankName}
              />
            </View>
          </View>
        </View>

        {/* Terms and Conditions */}
        <View style={styles.termsCard}>
          <Text style={styles.termsTitle}>Terms and Conditions</Text>
          <TextInput
            style={[styles.input, styles.termsInput]}
            placeholder="1. Please quote invoice number when remitting funds.\n2.\n3."
            placeholderTextColor={Colors.lightgrey2}
            value={termsText}
            onChangeText={setTermsText}
            multiline
          />
        </View>

        <TouchableOpacity style={styles.submitBtn} activeOpacity={0.85} onPress={handleGenerateInvoice}>
          <Text style={styles.submitText}>Save / Generate Invoice</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={customerModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCustomerModalVisible(false)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Customer</Text>
            {customers.length === 0 ? (
              <Text style={styles.modalEmpty}>No saved customers. Add from Create Customer.</Text>
            ) : (
              <FlatList
                data={customers}
                keyExtractor={item => item.id}
                renderItem={({item}) => (
                  <TouchableOpacity style={styles.modalItem} onPress={() => selectCustomer(item)}>
                    <Text style={styles.modalItemText}>{item.businessName}</Text>
                    {item.gstNumber ? <Text style={styles.modalItemSub}>{item.gstNumber}</Text> : null}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={countryModalFor !== null} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCountryModalFor(null)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <FlatList
              data={COUNTRIES}
              keyExtractor={item => item}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    if (countryModalFor === 'by') setBilledByCountry(item);
                    else if (countryModalFor === 'to') setBilledToCountry(item);
                    setCountryModalFor(null);
                  }}>
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default CreateInvoiceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
    paddingTop: hp(1.5),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backBtn: {
    padding: wp(2),
    marginLeft: -wp(2),
  },
  headerRight: {
    width: wp(12),
  },
  backIcon: {
    width: wp(7),
    height: wp(7),
    tintColor: Colors.black,
  },
  headerTitle: {
    fontSize: FSize.fs18,
    fontWeight: '700',
    color: Colors.black,
  },
  scrollContent: {
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(5),
  },
  topCard: {
    backgroundColor: Colors.white,
    borderRadius: wp(3),
    padding: wp(4),
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  invoiceTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(2),
  },
  invoiceTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  invoiceTitleInput: {
    fontSize: FSize.fs20,
    fontWeight: '700',
    color: Colors.black,
    paddingVertical: hp(0.5),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderStyle: 'dashed',
    minWidth: wp(35),
  },
  editIcon: {
    width: wp(5),
    height: wp(5),
    marginLeft: wp(2),
    // tintColor: Colors.gray,
  },
  logoBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D0D5DD',
    borderRadius: wp(3),
    width: wp(36),
    minHeight: hp(12),
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp(3),
    backgroundColor: '#FAFBFC',
  },
  logoPreview: {
    width: '100%',
    height: hp(10),
    borderRadius: wp(2),
  },
  logoPlaceholderIcon: {
    width: wp(10),
    height: wp(10),
    marginBottom: hp(0.5),
    // tintColor: Colors.sooprsblue,
  },
  logoBoxTitle: {
    fontSize: FSize.fs12,
    fontWeight: '600',
    color: Colors.black,
  },
  logoBoxHint: {
    fontSize: FSize.fs10,
    color: Colors.gray,
    marginTop: hp(0.3),
    textAlign: 'center',
  },
  dashedLine: {
    height: 0,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E0E0E0',
    marginBottom: hp(2),
  },
  dashedLineThin: {
    height: 0,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E0E0E0',
    marginVertical: hp(1.2),
  },
  label: {
    fontSize: FSize.fs13,
    color: '#5F6368',
    fontWeight: '500',
    marginBottom: hp(0.5),
  },
  labelRequired: {
    fontSize: FSize.fs13,
    color: '#5F6368',
    fontWeight: '600',
    marginBottom: hp(0.5),
    marginTop: hp(1.5),
  },
  labelOptional: {
    fontSize: FSize.fs12,
    color: '#80868B',
    marginBottom: hp(0.5),
    marginTop: hp(1.2),
  },
  input: {
    fontSize: FSize.fs14,
    color: Colors.black,
    borderWidth: 1,
    borderColor: '#E8EAED',
    borderRadius: wp(2.5),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.2),
    backgroundColor: Colors.white,
  },
  inputDashed: {
    fontSize: FSize.fs14,
    color: Colors.black,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E0E0E0',
    paddingHorizontal: wp(1),
    paddingVertical: hp(1.2),
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E0E0E0',
  },
  flex1: { flex: 1 },
  calendarIcon: {
    width: wp(5),
    height: wp(5),
    marginLeft: wp(2),
    tintColor: Colors.gray,
  },
  inputMultiline: {
    minHeight: hp(7),
    textAlignVertical: 'top',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EAED',
    borderRadius: wp(2.5),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.2),
    backgroundColor: Colors.white,
  },
  dropdownIcon: {
    width: wp(5),
    height: wp(5),
    marginLeft: wp(2),
    tintColor: Colors.gray,
  },
  linkBtn: {
    marginTop: hp(1.5),
    paddingVertical: hp(0.5),
  },
  linkText: {
    fontSize: FSize.fs14,
    color: Colors.sooprsblue,
    fontWeight: '600',
  },
  fieldWrap: {
    marginBottom: hp(1.2),
    marginTop: hp(0.5),
  },
  row: {
    flexDirection: 'row',
    gap: wp(3),
  },
  half: { flex: 1 },
  extraSection: {
    backgroundColor: Colors.white,
    borderRadius: wp(3),
    padding: wp(4),
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: wp(3),
    padding: wp(4),
    marginBottom: hp(2),
    borderLeftWidth: 4,
    borderLeftColor: Colors.sooprsblue,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: wp(2),
  },
  cardTitle: {
    fontSize: FSize.fs17,
    fontWeight: '700',
    color: Colors.black,
  },
  cardSubtitle: {
    fontSize: FSize.fs13,
    color: '#80868B',
  },
  selectCustomerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(2),
    marginBottom: hp(1),
    backgroundColor: '#F0F7FF',
    borderRadius: wp(2),
    borderWidth: 1,
    borderColor: '#D6E8FF',
  },
  selectCustomerText: {
    fontSize: FSize.fs14,
    color: Colors.sooprsblue,
    fontWeight: '600',
  },
  chevron: {
    width: wp(4),
    height: wp(4),
    tintColor: Colors.sooprsblue,
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EAED',
    borderRadius: wp(2.5),
    paddingHorizontal: wp(3),
    backgroundColor: Colors.white,
  },
  countryCode: {
    fontSize: FSize.fs14,
    color: '#5F6368',
    marginRight: wp(2),
    fontWeight: '500',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(1.5),
    paddingVertical: hp(0.5),
  },
  checkbox: {
    width: wp(5.5),
    height: wp(5.5),
    borderWidth: 1.5,
    borderColor: '#C4C7CC',
    borderRadius: wp(1.5),
    marginRight: wp(2.5),
  },
  checkboxChecked: {
    backgroundColor: Colors.sooprsblue,
    borderColor: Colors.sooprsblue,
  },
  checkLabel: {
    fontSize: FSize.fs14,
    color: Colors.black,
  },
  sectionTitle: {
    fontSize: FSize.fs17,
    fontWeight: '700',
    color: Colors.black,
    marginTop: hp(0.5),
    marginBottom: hp(1.5),
  },
  itemCard: {
    backgroundColor: Colors.white,
    borderRadius: wp(3),
    padding: wp(4),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  itemCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
    paddingBottom: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  itemCardTitle: {
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: Colors.black,
  },
  itemDeleteBtn: {
    padding: wp(1),
  },
  itemLabel: {
    fontSize: FSize.fs13,
    color: '#5F6368',
    fontWeight: '500',
    marginBottom: hp(0.5),
    marginTop: hp(1.2),
  },
  itemInput: {
    fontSize: FSize.fs14,
    color: Colors.black,
    borderWidth: 1,
    borderColor: '#E8EAED',
    borderRadius: wp(2.5),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.2),
    backgroundColor: Colors.white,
  },
  itemRow: {
    flexDirection: 'row',
    gap: wp(3),
  },
  itemFieldHalf: {
    flex: 1,
  },
  itemCalcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(1),
    paddingVertical: hp(0.5),
  },
  itemCalcLabel: {
    fontSize: FSize.fs14,
    color: '#5F6368',
  },
  itemCalcValue: {
    fontSize: FSize.fs14,
    fontWeight: '600',
    color: Colors.black,
  },
  itemTotalRow: {
    marginTop: hp(1),
    paddingTop: hp(1),
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  itemTotalLabel: {
    fontSize: FSize.fs15,
    fontWeight: '700',
    color: Colors.black,
  },
  itemTotalValue: {
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: Colors.sooprsblue,
  },
  tableScrollContent: {
    paddingBottom: hp(1),
    minWidth: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sooprsblue,
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(1),
    borderRadius: wp(2.5),
    marginBottom: hp(0.5),
  },
  tableHeaderText: {
    fontSize: FSize.fs11,
    fontWeight: '700',
    color: Colors.white,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1),
    paddingHorizontal: wp(1),
    marginBottom: hp(0.5),
    backgroundColor: Colors.white,
    borderRadius: wp(1.5),
  },
  tableRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  tableInput: {
    fontSize: FSize.fs12,
    color: Colors.black,
    borderWidth: 1,
    borderColor: '#E8EAED',
    borderRadius: wp(1.5),
    paddingHorizontal: wp(1.5),
    paddingVertical: hp(0.6),
    backgroundColor: Colors.white,
  },
  tableValueWrap: {
    justifyContent: 'center',
    paddingHorizontal: wp(1),
  },
  tableValue: {
    fontSize: FSize.fs12,
    color: Colors.black,
    fontWeight: '500',
  },
  tColItem: { minWidth: wp(22), width: wp(22), marginRight: wp(1) },
  tColHsn: { minWidth: wp(14), width: wp(14), marginRight: wp(1) },
  tColGst: { minWidth: wp(10), width: wp(10), marginRight: wp(1) },
  tColQty: { minWidth: wp(9), width: wp(9), marginRight: wp(1) },
  tColRate: { minWidth: wp(15), width: wp(15), marginRight: wp(1) },
  tColAmt: { minWidth: wp(18), width: wp(18), marginRight: wp(1) },
  tColCgst: { minWidth: wp(15), width: wp(15), marginRight: wp(1) },
  tColSgst: { minWidth: wp(15), width: wp(15), marginRight: wp(1) },
  tColTotal: { minWidth: wp(18), width: wp(18), marginRight: wp(1) },
  tColDelete: { minWidth: wp(10), width: wp(10) },
  removeItemBtn: { padding: wp(1), minWidth: wp(10), width: wp(10), alignItems: 'center', justifyContent: 'center' },
  removeIcon: {
    width: wp(5),
    height: wp(5),
    tintColor: '#9AA0A6',
  },
  addLineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(3),
    marginTop: hp(0.5),
    marginBottom: hp(2),
    gap: wp(2),
    backgroundColor: '#F0F7FF',
    borderRadius: wp(2.5),
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.sooprsblue,
  },
  addIcon: {
    width: wp(5),
    height: wp(5),
    tintColor: Colors.sooprsblue,
  },
  addLineText: {
    fontSize: FSize.fs14,
    color: Colors.sooprsblue,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: wp(3),
    padding: wp(4),
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryCardTitle: {
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: hp(1.5),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1),
    paddingVertical: hp(0.3),
  },
  summaryLabel: {
    fontSize: FSize.fs14,
    color: '#5F6368',
  },
  summaryValue: {
    fontSize: FSize.fs14,
    fontWeight: '600',
    color: Colors.black,
  },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(1),
    paddingVertical: hp(1),
    paddingHorizontal: wp(2),
    backgroundColor: '#F8FAFC',
    borderRadius: wp(2),
  },
  chevronSmall: {
    width: wp(4),
    height: wp(4),
    tintColor: Colors.sooprsblue,
  },
  chevronDown: {
    transform: [{ rotate: '-90deg' }],
  },
  roundRow: {
    flexDirection: 'row',
    gap: wp(2),
    marginTop: hp(1.5),
  },
  roundBtn: {
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    borderWidth: 1,
    borderColor: '#E8EAED',
    borderRadius: wp(2.5),
  },
  roundBtnActive: {
    backgroundColor: Colors.sooprsblue,
    borderColor: Colors.sooprsblue,
  },
  roundBtnText: {
    fontSize: FSize.fs13,
    color: Colors.black,
  },
  roundBtnActiveText: {
    color: Colors.white,
  },
  quantitySummary: {
    fontSize: FSize.fs14,
    color: '#5F6368',
    marginTop: hp(0.5),
    marginLeft: wp(8),
  },
  totalInrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(2),
    marginBottom: hp(0.5),
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3),
    backgroundColor: Colors.white,
    borderRadius: wp(3),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    elevation: 2,
  },
  totalInrLabel: {
    fontSize: FSize.fs17,
    fontWeight: '700',
    color: Colors.black,
  },
  totalInrDotted: {
    borderBottomWidth: 2,
    borderStyle: 'dotted',
    borderColor: Colors.sooprsblue,
    paddingBottom: hp(0.3),
  },
  totalInrValue: {
    fontSize: FSize.fs18,
    fontWeight: '700',
    color: Colors.sooprsblue,
  },
  totalWordsCard: {
    backgroundColor: Colors.white,
    borderRadius: wp(3),
    padding: wp(4),
    marginTop: hp(2),
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  totalWordsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },
  totalWordsTitle: {
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: Colors.black,
  },
  eyeIcon: {
    width: wp(6),
    height: wp(6),
    tintColor: '#5F6368',
  },
  totalWordsLabel: {
    fontSize: FSize.fs12,
    color: '#80868B',
    marginBottom: hp(0.3),
  },
  totalWordsValue: {
    fontSize: FSize.fs14,
    fontWeight: '600',
    color: Colors.black,
    lineHeight: 22,
  },
  bankFormCard: {
    backgroundColor: Colors.white,
    borderRadius: wp(3),
    padding: wp(4),
    marginTop: hp(1),
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  bankFormTitle: {
    fontSize: FSize.fs17,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: hp(1.2),
  },
  termsCard: {
    backgroundColor: Colors.white,
    borderRadius: wp(3),
    padding: wp(4),
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  termsTitle: {
    fontSize: FSize.fs17,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: hp(1.2),
  },
  termsInput: {
    minHeight: hp(12),
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: Colors.sooprsblue,
    paddingVertical: hp(2),
    borderRadius: wp(3),
    alignItems: 'center',
    marginTop: hp(2),
    shadowColor: Colors.sooprsblue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  submitText: {
    color: Colors.white,
    fontSize: FSize.fs16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: wp(5),
  },
  modalBox: {
    backgroundColor: Colors.white,
    borderRadius: wp(4),
    maxHeight: hp(55),
    padding: wp(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: FSize.fs18,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: hp(1.5),
  },
  modalEmpty: {
    fontSize: FSize.fs14,
    color: '#80868B',
    paddingVertical: hp(3),
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemText: {
    fontSize: FSize.fs15,
    color: Colors.black,
    fontWeight: '600',
  },
  modalItemSub: {
    fontSize: FSize.fs12,
    color: '#80868B',
    marginTop: hp(0.3),
  },
});
