import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, ShieldCheck, AlertCircle, Loader } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function CheckoutForm({ clientSecret, paymentIntentId, isMock, shippingAddress }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { cart, clearCart, getCartTotal, apiUrl } = useCart();
  const { token } = useAuth();
  
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  // Mock Card fields (only used in simulated mock payment mode)
  const [mockCardNumber, setMockCardNumber] = useState('4242 4242 4242 4242');
  const [mockExpiry, setMockExpiry] = useState('12/28');
  const [mockCvv, setMockCvv] = useState('424');

  const handleMockCheckoutSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);

    // Simulate network delay for premium feel
    setTimeout(async () => {
      try {
        const confirmRes = await fetch(`${apiUrl}/orders/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            items: cart.map(item => ({
              product_id: item.product_id,
              variant_id: item.variant_id,
              quantity: item.quantity
            })),
            shipping_address: shippingAddress,
            payment_intent_id: paymentIntentId
          })
        });

        const confirmData = await confirmRes.json();

        if (confirmRes.ok) {
          setSucceeded(true);
          clearCart();
          navigate('/profile', { state: { orderSuccess: true, orderDetails: confirmData.order } });
        } else {
          setError(confirmData.message || 'Verification failed.');
        }
      } catch (err) {
        setError('Connection error confirming order.');
      } finally {
        setProcessing(false);
      }
    }, 1500);
  };

  const handleStripeCheckoutSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return; // Stripe.js has not loaded yet
    }

    setProcessing(true);
    setError(null);

    try {
      const payload = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: shippingAddress.fullName,
            email: shippingAddress.email,
            address: {
              line1: shippingAddress.address,
              city: shippingAddress.city,
              state: shippingAddress.state,
              postal_code: shippingAddress.zipCode,
              country: 'US'
            }
          }
        }
      });

      if (payload.error) {
        setError(`Payment failed: ${payload.error.message}`);
        setProcessing(false);
      } else if (payload.paymentIntent.status === 'succeeded') {
        // Send order validation to backend
        const confirmRes = await fetch(`${apiUrl}/orders/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            items: cart.map(item => ({
              product_id: item.product_id,
              variant_id: item.variant_id,
              quantity: item.quantity
            })),
            shipping_address: shippingAddress,
            payment_intent_id: paymentIntentId
          })
        });

        const confirmData = await confirmRes.json();

        if (confirmRes.ok) {
          setSucceeded(true);
          clearCart();
          navigate('/profile', { state: { orderSuccess: true, orderDetails: confirmData.order } });
        } else {
          setError(confirmData.message || 'Payment accepted but database update failed. Contact support.');
        }
      }
    } catch (err) {
      setError('Checkout connection error.');
    } finally {
      setProcessing(false);
    }
  };

  const cardStyle = {
    style: {
      base: {
        color: '#0f172a',
        fontFamily: 'Inter, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '14px',
        '::placeholder': {
          color: '#94a3b8'
        }
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444'
      }
    }
  };

  return (
    <form onSubmit={isMock ? handleMockCheckoutSubmit : handleStripeCheckoutSubmit} className="space-y-6">
      {isMock ? (
        // Simulated Mock Form
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-250 text-amber-800 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
            <div className="text-xs">
              <span className="font-bold uppercase tracking-wider block mb-1">Payment Simulator Active</span>
              No real bank transaction will occur. Fill in the mock details below to finalize checkout and trigger backend data event logging.
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Card Number</label>
            <div className="relative">
              <input
                type="text"
                value={mockCardNumber}
                onChange={(e) => setMockCardNumber(e.target.value)}
                placeholder="4242 4242 4242 4242"
                className="w-full bg-slate-50 border border-slate-200 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                required
              />
              <CreditCard className="absolute right-3 top-3 text-slate-400 w-4 h-4" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Expiration Date</label>
              <input
                type="text"
                value={mockExpiry}
                onChange={(e) => setMockExpiry(e.target.value)}
                placeholder="MM/YY"
                className="w-full bg-slate-50 border border-slate-200 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">CVV</label>
              <input
                type="text"
                value={mockCvv}
                onChange={(e) => setMockCvv(e.target.value)}
                placeholder="123"
                className="w-full bg-slate-50 border border-slate-200 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                required
              />
            </div>
          </div>
        </div>
      ) : (
        // Genuine Stripe Elements Form
        <div className="space-y-4">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Secure Card Payment</label>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
            <CardElement options={cardStyle} />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2 border border-red-100">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={processing || succeeded || (!isMock && !stripe)}
        className="w-full bg-slate-900 text-white py-3 px-4 rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm transition-all duration-200"
      >
        {processing ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            <span>Processing Securely...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            <span>Pay & Complete Purchase - ${getCartTotal().toFixed(2)}</span>
          </>
        )}
      </button>
    </form>
  );
}
