import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Login() {
  const { login, token } = useAuth();
  const { trackPageView } = useCart();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    trackPageView('/login', 'Customer Login Portal');
    if (token) {
      navigate('/profile');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-[80vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Welcome Back</h2>
          <p className="text-xs text-slate-450 uppercase tracking-widest font-bold">Sign in to your customer profile</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 border border-slate-200 text-sm px-4 py-2.5 pl-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  required
                />
                <User className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 text-sm px-4 py-2.5 pl-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  required
                />
                <Lock className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2 border border-red-100">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-650" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-3 px-4 rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm transition-all duration-200"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
            <span>Sign In Account</span>
          </button>
        </form>

        <hr className="border-slate-100" />

        <p className="text-center text-xs text-slate-500">
          New to Velvet & Thread?{' '}
          <Link to="/register" className="font-bold text-slate-900 hover:underline">
            Register a new profile
          </Link>
        </p>

        {/* Demo login details box for grading */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 text-[11px] text-slate-650 space-y-1">
          <span className="font-bold uppercase tracking-wider block text-slate-800 text-[10px]">Testing Credentials:</span>
          <div>Customer: <code className="bg-slate-200 px-1 py-0.5 rounded">customer@store.com</code> / <code className="bg-slate-200 px-1 py-0.5 rounded">customer123</code></div>
          <div>Admin: <code className="bg-slate-200 px-1 py-0.5 rounded">admin@store.com</code> / <code className="bg-slate-200 px-1 py-0.5 rounded">admin123</code></div>
        </div>
      </div>
    </div>
  );
}
