import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag, Plus, Minus, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, getCartTotal, trackPageView } = useCart();

  useEffect(() => {
    trackPageView('/cart', 'Shopping Cart Bag');
  }, []);

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto my-24 text-center space-y-6 px-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm inline-block">
          <ShoppingBag className="w-12 h-12 text-slate-350 mx-auto" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Your bag is empty</h2>
          <p className="text-sm text-slate-500 font-light">
            Looks like you haven't added any styles to your cart yet.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center justify-center bg-slate-900 text-white text-xs font-bold uppercase tracking-wider py-3 px-6 rounded-xl hover:bg-slate-800 transition-colors"
        >
          Explore Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase mb-8">
          Shopping Bag ({cart.reduce((acc, item) => acc + item.quantity, 0)})
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div
                key={item.variant_id}
                className="bg-white p-4 sm:p-5 rounded-xl border border-slate-100 shadow-sm flex gap-4 sm:gap-6 items-center"
              >
                {/* Thumb image */}
                <div className="w-20 h-28 flex-shrink-0 bg-slate-50 rounded-lg overflow-hidden border border-slate-150">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Text and interaction details */}
                <div className="flex-grow min-w-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold tracking-widest text-slate-450 uppercase block">Velvet & Thread</span>
                    <Link to={`/product/${item.product_id}`} className="text-sm font-semibold text-slate-800 hover:text-slate-900 line-clamp-1">
                      {item.name}
                    </Link>
                    <div className="flex gap-2.5 text-xs text-slate-500 font-light">
                      <span>Size: <strong className="font-semibold text-slate-700">{item.size}</strong></span>
                      <span className="text-slate-300">|</span>
                      <span>Color: <strong className="font-semibold text-slate-700">{item.color}</strong></span>
                    </div>
                  </div>

                  {/* Quantity selector */}
                  <div className="flex items-center gap-2.5 border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 w-fit">
                    <button
                      onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="text-slate-500 hover:text-slate-900 disabled:text-slate-300"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-xs font-bold text-slate-800 w-6 text-center select-none">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock_quantity}
                      className="text-slate-500 hover:text-slate-900 disabled:text-slate-300"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Price info and delete button */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2.5">
                    <span className="text-sm font-black text-slate-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.variant_id)}
                      className="text-slate-400 hover:text-red-650 transition-colors p-1"
                      title="Remove style"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary Card */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-100">
                Order Summary
              </h3>

              <div className="space-y-3.5 text-sm text-slate-600 font-light">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">${getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-emerald-700 font-semibold uppercase text-xs">Free Shipping</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax estimate</span>
                  <span className="font-semibold text-slate-800">$0.00</span>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="flex justify-between text-base font-black text-slate-900">
                <span>Total Amount</span>
                <span>${getCartTotal().toFixed(2)}</span>
              </div>

              <Link
                to="/checkout"
                className="w-full bg-slate-900 text-white py-3 px-4 rounded-xl text-sm font-semibold hover:bg-slate-800 flex items-center justify-center gap-2 shadow-sm transition-all duration-200"
              >
                <span>Checkout Securely</span>
                <ArrowRight size={16} />
              </Link>

              <div className="text-[10px] text-slate-400 text-center uppercase tracking-widest font-semibold pt-2">
                Secure Checkout Powered by Stripe
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
