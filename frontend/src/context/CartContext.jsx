import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

// Generate or retrieve a persistent session tracking ID for data analytics
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

export const CartProvider = ({ children }) => {
  const { user, apiUrl } = useAuth();
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [sessionId] = useState(getSessionId);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Log behavioral events to the backend stdout/file logs
  const logEvent = async (eventType, productId = null, variantId = null, metadata = {}) => {
    try {
      await fetch(`${apiUrl}/products/log-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user ? user.id : 'guest',
          sessionId,
          eventType,
          productId,
          variantId,
          metadata
        })
      });
    } catch (err) {
      // Non-blocking log failure
      console.warn('Analytics event log failed to transmit:', err.message);
    }
  };

  const trackPageView = (path, title) => {
    logEvent('page_view', null, null, { path, title });
  };

  const addToCart = (product, variant, quantity = 1) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.variant_id === variant.id
      );

      if (existingIndex > -1) {
        const updatedCart = [...prevCart];
        const newQty = updatedCart[existingIndex].quantity + quantity;
        
        // Guard against adding beyond variant stock limits
        if (newQty > variant.stock_quantity) {
          updatedCart[existingIndex].quantity = variant.stock_quantity;
        } else {
          updatedCart[existingIndex].quantity = newQty;
        }
        return updatedCart;
      } else {
        return [
          ...prevCart,
          {
            product_id: product.id,
            variant_id: variant.id,
            name: product.name,
            price: parseFloat(product.price),
            image_url: product.image_url,
            size: variant.size,
            color: variant.color,
            quantity: Math.min(quantity, variant.stock_quantity),
            stock_quantity: variant.stock_quantity
          }
        ];
      }
    });

    // Log the "add_to_cart" behavior event
    logEvent('add_to_cart', product.id, variant.id, {
      quantity,
      price: product.price,
      size: variant.size,
      color: variant.color
    });
  };

  const updateQuantity = (variantId, quantity) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.variant_id === variantId) {
          const newQty = Math.max(1, Math.min(quantity, item.stock_quantity));
          return { ...item, quantity: newQty };
        }
        return item;
      });
    });
  };

  const removeFromCart = (variantId) => {
    const itemToRemove = cart.find(item => item.variant_id === variantId);
    
    setCart((prevCart) => prevCart.filter((item) => item.variant_id !== variantId));

    if (itemToRemove) {
      // Log the "remove_from_cart" behavior event
      logEvent('remove_from_cart', itemToRemove.product_id, itemToRemove.variant_id, {
        size: itemToRemove.size,
        color: itemToRemove.color
      });
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  };

  const value = {
    cart,
    sessionId,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
    trackPageView,
    logEvent
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
