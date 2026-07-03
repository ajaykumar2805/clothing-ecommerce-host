import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { ShoppingBag, ArrowLeft, Truck, CreditCard, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import CheckoutForm from '../components/checkout/CheckoutForm';

// Initialize Stripe Promise
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51MockKeyPublishable2026');

export default function Checkout() {
  const { cart, getCartTotal, trackPageView, apiUrl } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // Step state
  const [step, setStep] = useState(1); // 1: Shipping Info, 2: Payment Gateway

  // Shipping details state
  const [shippingAddress, setShippingAddress] = useState({
    fullName: user ? user.name : '',
    email: user ? user.email : '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  });

  // Stripe Integration states
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [isMock, setIsMock] = useState(true);
  const [intentLoading, setIntentLoading] = useState(false);
  const [intentError, setIntentError] = useState('');

  useEffect(() => {
    trackPageView('/checkout', 'Checkout Form');
    if (cart.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  const handleShippingChange = (e) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value
    });
  };

  const handleShippingSubmit = async (e) => {
    e.preventDefault();
    setStep(2);
    setIntentLoading(true);
    setIntentError('');

    try {
      const res = await fetch(`${apiUrl}/orders/create-payment-intent`, {
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
          }))
        })
      });

      const data = await res.json();

      if (res.ok) {
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.id);
        setIsMock(data.isMock);
      } else {
        setIntentError(data.message || 'Failed to initialize payment gateway.');
        setStep(1); // Go back on error
      }
    } catch (err) {
      setIntentError('Connection error initiating checkout.');
      setStep(1);
    } finally {
      setIntentLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Navigation / Header */}
        <div className="flex justify-between items-center mb-8">
          <Link to="/cart" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-950 uppercase transition-colors">
            <ArrowLeft size={14} />
            <span>Return to Cart</span>
          </Link>
          <span className="text-xl font-black text-slate-900 tracking-tight">SECURE CHECKOUT</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Checkout Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step Indicators */}
            <div className="flex items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm justify-around text-xs font-bold uppercase tracking-wider text-slate-400">
              <span className={`flex items-center gap-2 ${step === 1 ? 'text-slate-950' : 'text-slate-400'}`}>
                <Truck className="w-4 h-4" />
                <span>1. Shipping Address</span>
              </span>
              <span className="text-slate-200">|</span>
              <span className={`flex items-center gap-2 ${step === 2 ? 'text-slate-950' : 'text-slate-400'}`}>
                <CreditCard className="w-4 h-4" />
                <span>2. Secure Payment</span>
              </span>
            </div>

            {/* Step 1: Shipping Address Form */}
            {step === 1 && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-6 flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  <span>Delivery Address</span>
                </h3>

                <form onSubmit={handleShippingSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                      <input
                        type="text"
                        name="fullName"
                        value={shippingAddress.fullName}
                        onChange={handleShippingChange}
                        placeholder="Jane Doe"
                        className="w-full bg-slate-50 border border-slate-200 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={shippingAddress.email}
                        onChange={handleShippingChange}
                        placeholder="jane.doe@example.com"
                        className="w-full bg-slate-50 border border-slate-200 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address Line</label>
                    <input
                      type="text"
                      name="address"
                      value={shippingAddress.address}
                      onChange={handleShippingChange}
                      placeholder="123 Main St"
                      className="w-full bg-slate-50 border border-slate-200 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">City</label>
                      <input
                        type="text"
                        name="city"
                        value={shippingAddress.city}
                        onChange={handleShippingChange}
                        placeholder="San Francisco"
                        className="w-full bg-slate-50 border border-slate-200 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">State</label>
                      <input
                        type="text"
                        name="state"
                        value={shippingAddress.state}
                        onChange={handleShippingChange}
                        placeholder="CA"
                        className="w-full bg-slate-50 border border-slate-200 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Zip Code</label>
                      <input
                        type="text"
                        name="zipCode"
                        value={shippingAddress.zipCode}
                        onChange={handleShippingChange}
                        placeholder="94103"
                        className="w-full bg-slate-50 border border-slate-200 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={shippingAddress.phone}
                      onChange={handleShippingChange}
                      placeholder="(555) 123-4567"
                      className="w-full bg-slate-50 border border-slate-200 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 text-white py-3 px-4 rounded-xl text-sm font-semibold hover:bg-slate-800 shadow-sm transition-colors mt-4"
                  >
                    Proceed to Payment Details
                  </button>
                </form>
              </div>
            )}

            {/* Step 2: Payment Forms wrap */}
            {step === 2 && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Secure Checkout Payment</span>
                  </h3>
                  <button onClick={() => setStep(1)} className="text-xs font-bold text-indigo-650 hover:text-indigo-800 uppercase">
                    Back to Address
                  </button>
                </div>

                {intentLoading ? (
                  <div className="text-center py-10 space-y-3">
                    <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider animate-pulse">Contacting Stripe Payment Gateway...</p>
                  </div>
                ) : intentError ? (
                  <div className="bg-red-50 text-red-700 text-xs p-4 rounded-lg border border-red-100 space-y-3">
                    <p>{intentError}</p>
                    <button onClick={() => setStep(1)} className="bg-red-100 hover:bg-red-200 px-4 py-2 rounded text-xs font-semibold">
                      Adjust Details
                    </button>
                  </div>
                ) : (
                  // Inject Stripe Elements Provider or Mock directly
                  <Elements stripe={stripePromise}>
                    <CheckoutForm
                      clientSecret={clientSecret}
                      paymentIntentId={paymentIntentId}
                      isMock={isMock}
                      shippingAddress={shippingAddress}
                    />
                  </Elements>
                )}
              </div>
            )}
          </div>

          {/* Cart items visual review */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-100">
                Style Summary
              </h3>

              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.variant_id} className="flex gap-3 items-center text-xs">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-10 h-14 object-cover rounded bg-slate-50 border border-slate-150"
                    />
                    <div className="flex-grow min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-light">
                        Qty: {item.quantity} / Size: {item.size} / Color: {item.color}
                      </p>
                    </div>
                    <span className="font-black text-slate-800">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <hr className="border-slate-100" />

              <div className="flex justify-between text-base font-black text-slate-900">
                <span>Grand Total</span>
                <span>${getCartTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
