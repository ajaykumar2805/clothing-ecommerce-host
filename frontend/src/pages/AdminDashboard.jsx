import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Plus, Package, ListFilter, ClipboardList, PenTool, Check, Loader, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function AdminDashboard() {
  const { user, token, isAdmin, apiUrl } = useAuth();
  const { trackPageView } = useCart();
  const navigate = useNavigate();

  // Active Sub-view: 'orders' or 'inventory'
  const [activeTab, setActiveTab] = useState('orders');

  // Server data states
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New product form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Men',
    image_url: ''
  });
  const [variantsList, setVariantsList] = useState([
    { size: 'S', color: 'Black', stock_quantity: '20' }
  ]);
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  // Stock edit states
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [editedStock, setEditedStock] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    trackPageView('/admin', 'Admin Control Board');
    if (!token) {
      navigate('/login');
      return;
    }
    if (user && user.role !== 'admin') {
      navigate('/profile');
    }
  }, [user, token, navigate]);

  // Fetch admin content
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const authHeader = { 'Authorization': `Bearer ${token}` };
      
      if (activeTab === 'orders') {
        const res = await fetch(`${apiUrl}/admin/orders`, { headers: authHeader });
        if (!res.ok) throw new Error('Could not fetch store orders.');
        const data = await res.json();
        setOrders(data);
      } else {
        const res = await fetch(`${apiUrl}/admin/inventory`, { headers: authHeader });
        if (!res.ok) throw new Error('Could not fetch store inventory.');
        const data = await res.json();
        setInventory(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user && user.role === 'admin') {
      fetchData();
    }
  }, [activeTab, token, user]);

  const handleAddVariantRow = () => {
    setVariantsList([...variantsList, { size: 'M', color: 'White', stock_quantity: '20' }]);
  };

  const handleRemoveVariantRow = (index) => {
    setVariantsList(variantsList.filter((_, i) => i !== index));
  };

  const handleVariantRowChange = (index, field, value) => {
    const updated = [...variantsList];
    updated[index][field] = value;
    setVariantsList(updated);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setError(null);

    const payload = {
      ...newProduct,
      price: parseFloat(newProduct.price),
      variants: variantsList.map(v => ({
        size: v.size,
        color: v.color,
        stock_quantity: parseInt(v.stock_quantity)
      }))
    };

    try {
      const res = await fetch(`${apiUrl}/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setAddSuccess(true);
        setNewProduct({ name: '', description: '', price: '', category: 'Men', image_url: '' });
        setVariantsList([{ size: 'S', color: 'Black', stock_quantity: '20' }]);
        setShowAddForm(false);
        setTimeout(() => setAddSuccess(false), 3000);
        if (activeTab === 'inventory') fetchData();
      } else {
        setError(data.message || 'Failed to create product.');
      }
    } catch (err) {
      setError('Connection error creating product catalog.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleStockUpdateSubmit = async (variantId) => {
    if (editedStock === '' || isNaN(editedStock)) return;
    setUpdateLoading(true);

    try {
      const res = await fetch(`${apiUrl}/admin/variants/${variantId}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stock_quantity: parseInt(editedStock) })
      });

      if (res.ok) {
        setEditingVariantId(null);
        setEditedStock('');
        fetchData(); // Refresh list
      } else {
        const data = await res.json();
        alert(data.message || 'Error updating stock.');
      }
    } catch (err) {
      alert('Connection error adjusting stock.');
    } finally {
      setUpdateLoading(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-indigo-650" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Admin Management Panel</h1>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center justify-center gap-1.5 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider py-2.5 px-5 rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>Add New Clothing Style</span>
          </button>
        </div>

        {/* Add Product Modal Form Drawer */}
        {showAddForm && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-md mb-8 max-w-3xl mx-auto">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-6 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <PenTool size={16} />
              <span>Create New Product Entry</span>
            </h3>

            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Product Name</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Minimalist Wool Sweater"
                    className="w-full bg-slate-50 border border-slate-200 text-sm px-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="69.99"
                    className="w-full bg-slate-50 border border-slate-200 text-sm px-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-sm px-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Image URL</label>
                  <input
                    type="url"
                    value={newProduct.image_url}
                    onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-slate-50 border border-slate-200 text-sm px-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Product Description</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Tell clients about styling fits, materials, wash instructions..."
                  className="w-full bg-slate-50 border border-slate-200 text-sm px-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 h-20 resize-none"
                  required
                />
              </div>

              {/* Variant Rows section */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Product Variants (Sizes/Colors/Stock)</label>
                  <button type="button" onClick={handleAddVariantRow} className="text-[10px] bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded font-bold uppercase">
                    + Add Row
                  </button>
                </div>

                {variantsList.map((v, index) => (
                  <div key={index} className="grid grid-cols-3 sm:grid-cols-4 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Size (e.g. S, M, L)"
                      value={v.size}
                      onChange={(e) => handleVariantRowChange(index, 'size', e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Color (e.g. Black)"
                      value={v.color}
                      onChange={(e) => handleVariantRowChange(index, 'color', e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Stock quantity"
                      value={v.stock_quantity}
                      onChange={(e) => handleVariantRowChange(index, 'stock_quantity', e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1"
                      required
                    />
                    <button
                      type="button"
                      disabled={variantsList.length <= 1}
                      onClick={() => handleRemoveVariantRow(index)}
                      className="text-red-500 hover:text-red-700 text-xs font-bold col-span-3 sm:col-span-1 text-right disabled:opacity-30"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 bg-slate-900 text-white py-2.5 rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  {addLoading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Save Catalog Entry</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {addSuccess && (
          <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-2 max-w-md mx-auto mb-6">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Product catalogs and inventory variant records created successfully!</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 mb-6 text-sm font-bold uppercase tracking-wider text-slate-400">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-4 flex items-center gap-1.5 border-b-2 ${
              activeTab === 'orders' ? 'border-slate-900 text-slate-950' : 'border-transparent hover:text-slate-700'
            }`}
          >
            <ClipboardList size={16} />
            <span>Customer Orders</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 px-4 flex items-center gap-1.5 border-b-2 ${
              activeTab === 'inventory' ? 'border-slate-900 text-slate-950' : 'border-transparent hover:text-slate-700'
            }`}
          >
            <ListFilter size={16} />
            <span>Inventory & Stocks</span>
          </button>
        </div>

        {/* Content list rendering */}
        {error && (
          <div className="bg-red-50 text-red-700 text-xs p-4 rounded-xl border border-red-100 flex items-center gap-2 max-w-lg mb-6">
            <AlertTriangle className="w-5 h-5 text-red-650 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-36 animate-pulse"></div>
            ))}
          </div>
        ) : activeTab === 'orders' ? (
          // Tab 1: Orders List
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="bg-white text-center py-16 rounded-xl border border-slate-100 shadow-sm text-slate-500 font-light">
                No customer transactions found in the database.
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden text-xs">
                  <div className="bg-slate-100 p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 font-medium text-slate-650">
                    <div>
                      <span>Customer: </span>
                      <strong className="text-slate-900 font-bold">{order.customer_name || 'Guest Checkout'}</strong>
                      <span className="opacity-70"> ({order.customer_email || 'No email'})</span>
                    </div>
                    <div>
                      <span>Order ID: </span>
                      <span className="font-mono text-[10px] text-slate-800">{order.id}</span>
                    </div>
                    <div>
                      <span>Date: </span>
                      <span>{new Date(order.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-2.5">
                      <span className="font-bold text-slate-450 uppercase tracking-widest text-[9px] block">Items Ordered</span>
                      {order.items && order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center border-b border-slate-50 pb-2">
                          <span>{item.name} <strong className="text-slate-400 font-normal">({item.size} / {item.color}) x {item.quantity}</strong></span>
                          <span className="font-semibold text-slate-800">${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg flex flex-col justify-between gap-4">
                      <div>
                        <span className="font-bold text-slate-450 uppercase tracking-widest text-[9px] block mb-1">Shipping Target</span>
                        {order.shipping_address ? (
                          <div className="text-slate-600 leading-normal font-light">
                            <p className="font-semibold text-slate-800">{order.shipping_address.fullName}</p>
                            <p>{order.shipping_address.address}</p>
                            <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zipCode}</p>
                          </div>
                        ) : 'No address provided'}
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <span className="font-black text-slate-900 text-sm">Total: ${parseFloat(order.total_amount).toFixed(2)}</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded">
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          // Tab 2: Inventory List
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white uppercase tracking-wider font-semibold text-[10px]">
                  <th className="p-4">Clothing Style</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Size</th>
                  <th className="p-4">Color</th>
                  <th className="p-4 text-center">Available Stock</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-500 font-light">
                      No stock variant items configured in database catalog.
                    </td>
                  </tr>
                ) : (
                  inventory.map((row) => (
                    <tr key={row.variant_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-800">{row.product_name}</td>
                      <td className="p-4 text-slate-500 font-medium">{row.category}</td>
                      <td className="p-4 font-semibold text-slate-700">{row.size}</td>
                      <td className="p-4 text-slate-600">{row.color}</td>
                      <td className="p-4 text-center">
                        {editingVariantId === row.variant_id ? (
                          <input
                            type="number"
                            value={editedStock}
                            onChange={(e) => setEditedStock(e.target.value)}
                            className="w-16 border border-slate-300 rounded px-2 py-1 text-center font-bold text-xs"
                            min="0"
                            required
                          />
                        ) : (
                          <span className={`font-black ${row.stock_quantity === 0 ? 'text-red-500' : row.stock_quantity <= 5 ? 'text-amber-600' : 'text-slate-900'}`}>
                            {row.stock_quantity}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {editingVariantId === row.variant_id ? (
                          <div className="flex gap-2 justify-center">
                            <button
                              disabled={updateLoading}
                              onClick={() => handleStockUpdateSubmit(row.variant_id)}
                              className="bg-slate-900 text-white px-3 py-1 rounded hover:bg-slate-800 font-semibold"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingVariantId(null)}
                              className="border border-slate-200 text-slate-650 px-3 py-1 rounded hover:bg-slate-100 font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingVariantId(row.variant_id);
                              setEditedStock(row.stock_quantity.toString());
                            }}
                            className="bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-200 font-semibold transition-colors"
                          >
                            Update Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
