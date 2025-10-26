import Paystack from 'react-native-paystack';
import { Alert } from 'react-native';

// Paystack Configuration
const PAYSTACK_PUBLIC_KEY = 'pk_test_xxxxxxxxxxxxx'; // Replace with your actual public key

/**
 * Initialize Paystack with your public key
 */
export const initPaystack = (publicKey: string) => {
  Paystack.setPublicKey(publicKey);
};

/**
 * Charge card with Paystack
 */
export const chargeCard = async (
  email: string,
  amount: number,
  cardDetails: {
    number: string;
    cvc: string;
    expiryMonth: string;
    expiryYear: string;
  }
) => {
  try {
    const charge = await Paystack.chargeCard({
      cardNumber: cardDetails.number,
      expiryMonth: cardDetails.expiryMonth,
      expiryYear: cardDetails.expiryYear,
      cvc: cardDetails.cvc,
      email,
      amountInKobo: amount * 100, // Convert to kobo (pay in cents)
      ref: `COOU_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });

    if (charge.status === 'success') {
      return {
        success: true,
        transactionRef: charge.transactionRef,
        authCode: charge.authCode,
      };
    } else {
      throw new Error(charge.message || 'Payment failed');
    }
  } catch (error: any) {
    console.error('Paystack charge error:', error);
    return {
      success: false,
      error: error.message || 'Payment failed. Please try again.',
    };
  }
};

/**
 * Initialize Paystack on app start
 */
initPaystack(PAYSTACK_PUBLIC_KEY);

export default {
  initPaystack,
  chargeCard,
};
