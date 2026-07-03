import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Shield, Search, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { getCartCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  const handleCategoryClick = (category) => {
    navigate(`/?category=${category}`);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 glass-nav shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <span className="bg-slate-900 text-white px-2.5 py-1 rounded">V</span>
              <span>VELVET & THREAD</span>
            </Link>
          </div>

          {/* Desktop Categories */}
          <div className="hidden md:flex space-x-8">
            <button onClick={() => handleCategoryClick('Men')} className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              Men
            </button>
            <button onClick={() => handleCategoryClick('Women')} className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              Women
            </button>
            <button onClick={() => handleCategoryClick('Accessories')} className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              Accessories
            </button>
          </div>

          {/* Desktop Search & Actions */}
          <div className="hidden md:flex items-center space-x-6">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search styles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 lg:w-64 bg-slate-100/80 text-sm pl-4 pr-10 py-1.5 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-slate-800"
              />
              <button type="submit" className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                <Search size={16} />
              </button>
            </form>

            <Link to="/cart" className="relative p-1 text-slate-700 hover:text-slate-900 transition-colors">
              <ShoppingBag size={22} />
              {getCartCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-slate-900 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white scale-90">
                  {getCartCount()}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center space-x-4">
                {isAdmin && (
                  <Link to="/admin" className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                    <Shield size={16} />
                    <span>Admin</span>
                  </Link>
                )}
                <Link to="/profile" className="text-sm font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1.5">
                  <User size={18} />
                  <span className="max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                </Link>
                <button onClick={logout} className="text-slate-500 hover:text-red-600 p-1 transition-colors" title="Logout">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
                <User size={18} />
                <span>Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-4">
            <Link to="/cart" className="relative p-1 text-slate-700 hover:text-slate-900">
              <ShoppingBag size={22} />
              {getCartCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-slate-900 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white scale-90">
                  {getCartCount()}
                </span>
              )}
            </Link>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1 text-slate-700 hover:text-slate-900">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 px-4 py-4 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search styles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 text-sm pl-4 pr-10 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <button type="submit" className="absolute right-3 top-3 text-slate-400">
              <Search size={16} />
            </button>
          </form>

          <div className="flex flex-col space-y-3 font-medium text-slate-800">
            <button onClick={() => handleCategoryClick('Men')} className="text-left py-1 hover:text-slate-900">Men</button>
            <button onClick={() => handleCategoryClick('Women')} className="text-left py-1 hover:text-slate-900">Women</button>
            <button onClick={() => handleCategoryClick('Accessories')} className="text-left py-1 hover:text-slate-900">Accessories</button>
          </div>

          <hr className="border-slate-100" />

          {user ? (
            <div className="space-y-3">
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-sm font-semibold text-indigo-600 py-1">
                  <Shield size={18} />
                  <span>Admin Dashboard</span>
                </Link>
              )}
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-sm text-slate-700 py-1">
                <User size={18} />
                <span>{user.name} (Profile)</span>
              </Link>
              <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="flex items-center gap-2 text-sm text-red-600 py-1 w-full text-left">
                <LogOut size={18} />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-sm text-slate-700 font-semibold py-1">
              <User size={18} />
              <span>Login / Register</span>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
