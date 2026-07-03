import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-black tracking-tight">VELVET & THREAD</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Curating premium essentials for your modern lifestyle. Crafted with quality, transparency, and style.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/?category=Men" className="hover:text-white transition-colors">Men's Apparel</Link></li>
              <li><Link to="/?category=Women" className="hover:text-white transition-colors">Women's Apparel</Link></li>
              <li><Link to="/?category=Accessories" className="hover:text-white transition-colors">Accessories</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">New Arrivals</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Customer Care</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Shipping & Returns</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Size Guide</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Newsletter Mockup */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Newsletter</h4>
            <p className="text-sm text-slate-400">Join our newsletter to receive styling guides and 15% off your first order.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter email..."
                className="bg-slate-800 text-sm text-slate-200 px-4 py-2 rounded focus:outline-none focus:ring-1 focus:ring-slate-500 w-full"
              />
              <button className="bg-white text-slate-900 text-sm font-semibold px-4 py-2 rounded hover:bg-slate-100 transition-colors">
                Join
              </button>
            </div>
          </div>
        </div>

        <hr className="border-slate-850 my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-slate-550 gap-4">
          <p>&copy; {new Date().getFullYear()} Velvet & Thread Inc. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
            <a href="#" className="hover:text-white">Cookie Preferences</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
