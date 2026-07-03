import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SlidersHorizontal, ArrowUpDown, Tag, AlertCircle, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const { trackPageView } = useCart();
  const { apiUrl } = useAuth();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ categories: [], sizes: [], colors: [] });
  const [error, setError] = useState(null);

  // Active query parameters (synced from Navbar or clicked categories)
  const queryParams = new URLSearchParams(location.search);
  const selectedCategory = queryParams.get('category') || '';
  const searchWord = queryParams.get('search') || '';

  // Local filter states
  const [sizeFilter, setSizeFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortOrder, setSortOrder] = useState('name-asc');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Track page view event
  useEffect(() => {
    trackPageView('/', 'Home Catalog');
  }, [location.search]);

  // Fetch filter metadata
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await fetch(`${apiUrl}/products/filters`);
        if (res.ok) {
          const data = await res.json();
          setFilters(data);
        }
      } catch (err) {
        console.warn('Could not fetch catalog filter options:', err.message);
      }
    };
    fetchFilters();
  }, [apiUrl]);

  // Fetch products based on active filters
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchWord) params.append('search', searchWord);
      if (sizeFilter) params.append('size', sizeFilter);
      if (colorFilter) params.append('color', colorFilter);
      if (maxPrice) params.append('maxPrice', maxPrice);

      try {
        const res = await fetch(`${apiUrl}/products?${params.toString()}`);
        if (!res.ok) {
          throw new Error('Failed to retrieve items.');
        }
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, searchWord, sizeFilter, colorFilter, maxPrice, apiUrl]);

  // Apply client-side sorting
  const sortedProducts = [...products].sort((a, b) => {
    if (sortOrder === 'price-asc') return parseFloat(a.price) - parseFloat(b.price);
    if (sortOrder === 'price-desc') return parseFloat(b.price) - parseFloat(a.price);
    return a.name.localeCompare(b.name); // name-asc default
  });

  const clearAllFilters = () => {
    setSizeFilter('');
    setColorFilter('');
    setMaxPrice('');
    setSortOrder('name-asc');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Visual Hero Banner */}
      {!searchWord && !selectedCategory && (
        <div className="bg-slate-900 text-white py-16 px-4 relative overflow-hidden mb-8">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15)_0,transparent_100%)]"></div>
          <div className="max-w-7xl mx-auto text-center relative z-10 space-y-4">
            <div className="inline-flex items-center gap-1 bg-white/10 text-xs px-3 py-1 rounded-full uppercase tracking-widest font-semibold border border-white/20">
              <Sparkles size={12} className="text-yellow-400" />
              <span>Premium Collection 2026</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none uppercase">
              REDEFINING EVERYDAY ESSENTIALS
            </h1>
            <p className="text-sm md:text-base text-slate-350 max-w-xl mx-auto font-light leading-relaxed">
              Discover clean fits, organic textiles, and styles that endure. Crafted meticulously for versatility.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Status Indicators */}
        {(selectedCategory || searchWord) && (
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 uppercase font-semibold">Viewing active:</span>
            {selectedCategory && (
              <span className="bg-slate-200 text-slate-800 px-3 py-1 rounded-full font-medium">
                Category: {selectedCategory}
              </span>
            )}
            {searchWord && (
              <span className="bg-slate-200 text-slate-800 px-3 py-1 rounded-full font-medium">
                Search: "{searchWord}"
              </span>
            )}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-xl mb-6 shadow-sm flex-wrap gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors"
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-3">
            <ArrowUpDown size={14} className="text-slate-400" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="name-asc">Alphabetical (A-Z)</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Collapsible Sidebar Filter Menu */}
          <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block lg:col-span-1 space-y-6 bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-fit`}>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Tag size={14} />
                <span>Adjust Filter</span>
              </span>
              {(sizeFilter || colorFilter || maxPrice) && (
                <button onClick={clearAllFilters} className="text-[10px] text-red-500 hover:text-red-700 font-semibold uppercase">
                  Reset
                </button>
              )}
            </div>

            {/* Size Selectors */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase">Size</label>
              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="">All Sizes</option>
                {filters.sizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            {/* Color Selectors */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase">Color</label>
              <select
                value={colorFilter}
                onChange={(e) => setColorFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="">All Colors</option>
                {filters.colors.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>

            {/* Max Price Slider/Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase">Max Price (${maxPrice || '150'})</label>
              <input
                type="range"
                min="10"
                max="150"
                step="5"
                value={maxPrice || 150}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-950"
              />
            </div>
          </div>

          {/* Product Grid Area */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm animate-pulse h-96 flex flex-col">
                    <div className="bg-slate-200 aspect-[3/4] w-full"></div>
                    <div className="p-4 flex-grow space-y-3">
                      <div className="h-3 bg-slate-250 w-1/4 rounded"></div>
                      <div className="h-4 bg-slate-250 w-3/4 rounded"></div>
                      <div className="h-3 bg-slate-200 w-full rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-700 text-xs p-4 rounded-xl flex items-center gap-2 border border-red-100 max-w-lg mx-auto">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-650" />
                <span>{error}</span>
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-slate-100 shadow-sm max-w-lg mx-auto space-y-4">
                <p className="text-sm font-semibold text-slate-800">No products match your active search filters.</p>
                <button onClick={clearAllFilters} className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
