import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Heart, Check, HelpCircle, Shield, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, trackPageView } = useCart();
  const { apiUrl } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User selections
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [addedPopup, setAddedPopup] = useState(false);

  // Fetch product detail on mount
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiUrl}/products/${id}`);
        if (!res.ok) {
          throw new Error('Product details could not be retrieved.');
        }
        const data = await res.json();
        setProduct(data);

        // Pre-select first available variant values
        if (data.variants && data.variants.length > 0) {
          setSelectedSize(data.variants[0].size);
          setSelectedColor(data.variants[0].color);
        }

        // Track page view event
        trackPageView(`/product/${id}`, `Product: ${data.name}`);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, apiUrl]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-200 aspect-[3/4] rounded-xl"></div>
        <div className="space-y-6 py-4">
          <div className="h-4 bg-slate-250 w-1/4 rounded"></div>
          <div className="h-8 bg-slate-250 w-3/4 rounded"></div>
          <div className="h-4 bg-slate-200 w-full rounded"></div>
          <div className="h-4 bg-slate-200 w-full rounded"></div>
          <div className="h-10 bg-slate-250 w-1/2 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto my-20 text-center space-y-4">
        <p className="text-sm font-semibold text-slate-800">{error || 'Product not found.'}</p>
        <Link to="/" className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 uppercase">
          <ArrowLeft size={14} />
          <span>Back to Catalog</span>
        </Link>
      </div>
    );
  }

  // Helper arrays for dynamic option lists
  const sizes = [...new Set(product.variants.map((v) => v.size))];
  const colors = [...new Set(product.variants.map((v) => v.color))];

  // Find exact active variant
  const activeVariant = product.variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  );

  const handleAddToCartSubmit = (e) => {
    e.preventDefault();
    if (!activeVariant) return;

    addToCart(product, activeVariant, selectedQuantity);
    setAddedPopup(true);
    setTimeout(() => setAddedPopup(false), 2000);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Back Link */}
        <Link to="/" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-950 uppercase mb-8 transition-colors">
          <ArrowLeft size={14} />
          <span>Back to Catalog</span>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm">
          {/* Visual Column */}
          <div className="overflow-hidden rounded-xl border border-slate-100 aspect-[3/4] relative bg-slate-50">
            <img
              src={product.image_url}
              alt={product.name}
              className="object-cover w-full h-full"
            />
          </div>

          {/* Details & Interactive Selections Column */}
          <div className="flex flex-col space-y-6 justify-between">
            <div className="space-y-4">
              <span className="bg-slate-100 text-slate-800 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full">
                {product.category}
              </span>
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight uppercase">
                {product.name}
              </h1>
              <p className="text-xl font-black text-slate-900">
                ${parseFloat(product.price).toFixed(2)}
              </p>
              <p className="text-sm text-slate-650 leading-relaxed font-light">
                {product.description}
              </p>
            </div>

            <form onSubmit={handleAddToCartSubmit} className="space-y-6 pt-4 border-t border-slate-100">
              {/* Color Options */}
              {colors.length > 0 && colors[0] !== 'One Size' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Color: {selectedColor}</label>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color) => (
                      <button
                        type="button"
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`text-xs px-3.5 py-1.5 rounded-lg border font-medium transition-all ${
                          selectedColor === color
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-slate-450'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Options */}
              {sizes.length > 0 && sizes[0] !== 'One Size' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Size: {selectedSize}</label>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => (
                      <button
                        type="button"
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`text-xs w-10 h-10 rounded-lg border font-semibold flex items-center justify-center transition-all ${
                          selectedSize === size
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-slate-450'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Inventory Notification */}
              {activeVariant && (
                <div className="text-xs font-medium">
                  {activeVariant.stock_quantity === 0 ? (
                    <span className="text-red-650 bg-red-50 px-2.5 py-1 rounded">Out of Stock</span>
                  ) : activeVariant.stock_quantity <= 5 ? (
                    <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded">
                      Only {activeVariant.stock_quantity} left in stock - order soon!
                    </span>
                  ) : (
                    <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">In Stock</span>
                  )}
                </div>
              )}

              {/* Actions Section */}
              <div className="flex gap-4 pt-2">
                {activeVariant && activeVariant.stock_quantity > 0 && (
                  <select
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(parseInt(e.target.value))}
                    className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 font-semibold"
                  >
                    {[...Array(Math.min(10, activeVariant.stock_quantity))].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="submit"
                  disabled={!activeVariant || activeVariant.stock_quantity === 0}
                  className="flex-grow bg-slate-900 text-white py-3 px-6 rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm transition-all duration-200"
                >
                  <ShoppingBag size={18} />
                  <span>Add to Shopping Bag</span>
                </button>
              </div>
            </form>

            {/* Added Popup Alert */}
            {addedPopup && (
              <div className="bg-slate-900 text-white text-xs py-3 px-4 rounded-xl flex items-center gap-2 border border-slate-800 shadow-md">
                <Check className="text-emerald-450 w-4 h-4 flex-shrink-0" />
                <span>Added variant successfully. Check your shopping cart bag.</span>
              </div>
            )}

            {/* Premium assurances */}
            <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 pt-6 border-t border-slate-100 uppercase tracking-widest font-semibold text-center">
              <div className="space-y-1">
                <Truck className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                <span>Free Shipping</span>
              </div>
              <div className="space-y-1">
                <Shield className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                <span>Secure Payments</span>
              </div>
              <div className="space-y-1">
                <HelpCircle className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                <span>Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
