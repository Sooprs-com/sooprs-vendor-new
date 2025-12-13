import {useState} from 'react';
import Toast from 'react-native-toast-message';
import {useSelector} from 'react-redux';
import RazorpayCheckout from 'react-native-razorpay';
import { getData} from '../../services/mobile-api';
import { mobile_siteConfig } from '../../services/mobile-siteConfig';
import {getDataFromAsyncStorage} from '../../services/CommonFunction';
// import {mobile_siteConfig} from '../services/mobile-siteConfig';
// import {getData, postDataWithToken1} from '../services/mobile-api';

export const useSubscriptionApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const {name, email, mobile} = useSelector(state => state?.getUserDetails);

  // Fetch Membership Plans
  const fetchPlans = async () => {
    setLoading(true);
    try {
      // Use BASE_URL2 for this endpoint
      const url = mobile_siteConfig.BASE_URL2 + mobile_siteConfig.GET_MEMBERSHIP;
      console.log('Fetching plans from URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      console.log('Subscription Plans API Response:', data);
      
      // Handle different response structures
      if (data?.status === 200 && data?.msg) {
        return Array.isArray(data.msg) ? data.msg : [];
      } else if (data?.status && data?.data) {
        return Array.isArray(data.data) ? data.data : [];
      } else if (Array.isArray(data)) {
        return data;
      } else if (data?.data && Array.isArray(data.data)) {
        return data.data;
      }
      
      console.warn('Unexpected API response structure:', data);
      return [];
    } catch (error) {
      console.error('Error fetching plans:', error);
      Toast.show({
        type: 'error',
        text1: 'Error while getting the plans',
        text2: 'Something went wrong',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Create Order
  const createOrder = async (amt, planId, finalAmountInRupees) => {
    setLoading(true);
    const payload = new FormData();
    payload.append('amount', amt);
    try {
      const response = await fetch(mobile_siteConfig.CREATE_RAZORPAY_ORDER, {
        method: 'POST',
        body: payload,
      });

      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const res = await response.json();
      if (res?.order_id) {
        // Get user ID from AsyncStorage
        const userId = await getDataFromAsyncStorage(mobile_siteConfig.UID);
        return await makePurchaseThroughRazorPay(
          res?.order_id,
          name,
          email,
          mobile,
          amt,
          planId,
          userId,
          finalAmountInRupees,
        );
      }
    } catch (error) {
      setError(error);
      setLoading(false);
      throw error;
    }
  };

  // Calling Razorpay for Payment
  const makePurchaseThroughRazorPay = async (
    orderId,
    name,
    email,
    mobile,
    amount,
    planId,
    userId,
    finalAmountInRupees,
  ) => {
    const options = {
      description: 'Sooprs',
      image: 'https://sooprs.com/assets/images/sooprs_logo.png',
      currency: 'INR',
      key: 'rzp_live_0dVc0pFpUWFAqu',
      amount: amount,
      name: 'Sooprs.com',
      order_id: orderId,
      prefill: {
        email: email,
        contact: mobile,
        name: name,
      },
      theme: {
        color: '#0077FF',
      },
    };

    try {
      const res = await RazorpayCheckout.open(options);
      if (res?.razorpay_payment_id) {
        return await verifyOrder(
          userId,
          res?.razorpay_order_id,
          res?.razorpay_payment_id,
          res?.razorpay_signature,
          amount,
          planId,
          finalAmountInRupees,
        );
      }
    } catch (error) {
      console.error('Razorpay Payment Error:', error);
      setLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Payment Error',
        text2: 'Payment has been cancelled',
      });
      throw error;
    }
  };

  // Verify Order Payment
  const verifyOrder = async (
    userId,
    orderId,
    paymentId,
    sign,
    amount,
    planId,
    finalAmountInRupees,
  ) => {
    const payload = new FormData();
    const finalAmount = amount / 100;
    payload.append('user_id', userId);
    payload.append('amount', finalAmountInRupees);
    payload.append('plan_id', planId);
    payload.append('payment_method', 'razorpay');
    payload.append('payment_id', paymentId);
    payload.append('order_id', orderId);
    payload.append('signature', sign);

    try {
      const response = await fetch(
        'https://sooprs.com/api2/public/index.php/buy-membership',
        {
          method: 'POST',
          body: payload,
          headers: {
            'Content-type': 'multipart/form-data',
          },
        },
      );
      const res = await response.json();
      setLoading(false);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Your plan has been purchased successfully.',
      });
      console.log('res', res, payload, amount);
      if (res?.status === 200) {
        return res;
      } else {
        throw new Error('Order verification failed');
      }
    } catch (error) {
      console.error('Order Verification Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Payment verification failed',
        text2: 'If any amount has been debited , please contact us.',
      });
      setLoading(false);
      throw error;
    }
  };

  return {createOrder, loading, error, fetchPlans};
};
