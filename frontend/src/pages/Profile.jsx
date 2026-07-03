import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Package, User, LogOut, CheckCircle, Clock, Truck, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Profile() {
  const { user, token, logout, apiUrl } = useAuth();
  const { trackPageView } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if just redirected from checkout success
  const justCheckedOut = location.state?.orderSuccess;
  const newOrderDetails = location.state?.orderDetails;

  useEffect(() => {
    trackPageView('/profile', 'User Profile & Order History');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch(`${apiUrl}/orders/history`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) {
          throw new Error('Could not retrieve order history.');
        }
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token, navigate, apiUrl]);

  if (!user) return null;

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Checkout Success Popup */}
        {justCheckedOut && (
          <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-6 rounded-2xl mb-8 flex items-start gap-4 shadow-sm animate-bounce">
            <CheckCircle className="w-8 h-8 text-emerald-600 flex-shrink-0" />
            <div className="space-y-1 text-xs sm:text-sm">
              <span className="font-bold text-slate-900 block uppercase tracking-wider text-base">Purchase Completed!</span>
              <p>Thank you for shopping at Velvet & Thread. Your card payment was authorized and registered successfully.</p>
              {newOrderDetails && (
                <div className="bg-white/60 p-2.5 rounded border border-emerald-100 mt-2 font-mono text-[11px] text-slate-800 space-y-0.5">
                  <div>Order ID: {newOrderDetails.id}</div>
                  <div>Amount Billed: ${parseFloat(newOrderDetails.total_amount).toFixed(2)}</div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Details Card */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-fit space-y-6">
            <div className="text-center space-y-2.5">
              <div className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto uppercase">
                {user.name[0]}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{user.name}</h3>
                <p className="text-xs text-slate-400 font-light">{user.email}</p>
              </div>
              <span className="inline-block bg-slate-100 text-slate-650 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full">
                {user.role} Account
              </span>
            </div>

            <hr className="border-slate-100" />

            <button
              onClick={logout}
              className="w-full border border-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut size={14} />
              <span>Log Out Account</span>
            </button>
          </div>

          {/* Historical Orders List */}
          <div className="lg:col-span-3 space-y-6">
            <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-450" />
              <span>Purchase History ({orders.length})</span>
            </h2>

            {loading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-40 animate-pulse"></div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-700 text-xs p-4 rounded-xl border border-red-100 flex items-center gap-2 max-w-lg">
                <ShieldAlert className="w-5 h-5 text-red-650" />
                <span>{error}</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-100 rounded-xl shadow-sm space-y-4">
                <p className="text-sm font-semibold text-slate-800">You haven't placed any orders yet.</p>
                <Link to="/" className="inline-block bg-slate-900 text-white text-xs font-semibold px-5 py-2.5 rounded-lg hover:bg-slate-800 transition-colors uppercase">
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    {/* Header info */}
                    <div className="bg-slate-900/90 text-white p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                      <div>
                        <span className="opacity-60 block uppercase tracking-wider text-[9px]">Order Placed</span>
                        <strong className="font-semibold">{new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</strong>
                      </div>
                      <div>
                        <span className="opacity-60 block uppercase tracking-wider text-[9px]">Order ID</span>
                        <span className="font-mono">{order.id}</span>
                      </div>
                      <div>
                        <span className="opacity-60 block uppercase tracking-wider text-[9px]">Billed Total</span>
                        <strong className="text-sm font-black">${parseFloat(order.total_amount).toFixed(2)}</strong>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[10px]">
                        <Clock size={12} className="text-yellow-400" />
                        <span>{order.status}</span>
                      </div>
                    </div>

                    {/* Order items map */}
                    <div className="p-5 divide-y divide-slate-100">
                      {order.items && order.items.map((item) => (
                        <div key={item.id} className="py-3 flex gap-4 items-center first:pt-0 last:pb-0">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-10 h-14 object-cover rounded bg-slate-50 border border-slate-150"
                          />
                          <div className="flex-grow min-w-0 text-xs">
                            <h4 className="font-semibold text-slate-800 truncate">{item.name}</h4>
                            <p className="text-slate-450 font-light mt-0.5">
                              Size: {item.size} / Color: {item.color} / Qty: {item.quantity}
                            </p>
                          </div>
                          <span className="text-xs font-black text-slate-900">
                            ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Shipping Address Footer Summary */}
                    {order.shipping_address && (
                      <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 text-[11px] text-slate-500 font-light flex items-center gap-1.5">
                        <Truck size={14} className="text-slate-400" />
                        <span>
                          Shipped to: <strong>{order.shipping_address.fullName}</strong> - {order.shipping_address.address}, {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zipCode}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
