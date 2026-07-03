const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth } = require('../middleware/auth');
const { logTransaction, logInventoryUpdate } = require('../config/logger');

// Initialize Stripe if key is available
const stripeKey = process.env.STRIPE_SECRET_KEY;
let stripe = null;
if (stripeKey && stripeKey !== 'your_stripe_secret_key_here') {
  stripe = require('stripe')(stripeKey);
}

// Helper to authenticate JWT optionally (for guest vs logged-in checkouts)
const optionalAuth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    req.user = null;
    return next();
  }
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trimLeft() : authHeader;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clothing_ecommerce_secret_key_2026');
    req.user = decoded;
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};

// @route   POST api/orders/create-payment-intent
// @desc    Create Stripe Payment Intent, calculating total price securely server-side
// @access  Public (Optional JWT)
router.post('/create-payment-intent', optionalAuth, async (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Cart items are required.' });
  }

  try {
    let totalAmountCents = 0;

    // Server-side calculation & stock check
    for (const item of items) {
      const productRes = await db.query('SELECT price FROM products WHERE id = $1', [item.product_id]);
      const variantRes = await db.query(
        'SELECT stock_quantity FROM product_variants WHERE id = $1 AND product_id = $2',
        [item.variant_id, item.product_id]
      );

      if (productRes.rows.length === 0 || variantRes.rows.length === 0) {
        return res.status(404).json({ message: `Product or variant not found for item: ${item.product_id}` });
      }

      if (variantRes.rows[0].stock_quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for variant ${item.variant_id}. Available: ${variantRes.rows[0].stock_quantity}` 
        });
      }

      const price = parseFloat(productRes.rows[0].price);
      totalAmountCents += Math.round(price * 100) * item.quantity;
    }

    if (stripe) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmountCents,
        currency: 'usd',
        metadata: {
          userId: req.user ? req.user.id : 'guest',
        }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id,
        amount: (totalAmountCents / 100).toFixed(2),
        isMock: false
      });
    } else {
      // Return Simulated Mock Payment Intent when Stripe is not configured
      const mockIntentId = `pi_mock_${Math.random().toString(36).substr(2, 9)}`;
      res.json({
        clientSecret: `${mockIntentId}_secret_${Math.random().toString(36).substr(2, 9)}`,
        id: mockIntentId,
        amount: (totalAmountCents / 100).toFixed(2),
        isMock: true
      });
    }
  } catch (err) {
    console.error('Create payment intent error:', err);
    res.status(500).json({ message: 'Server error generating payment intent.' });
  }
});

// @route   POST api/orders/confirm
// @desc    Confirm payment completion, execute DB transactions to create order and reduce stock, log events
// @access  Public (Optional JWT)
router.post('/confirm', optionalAuth, async (req, res) => {
  const { items, shipping_address, payment_intent_id } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0 || !shipping_address || !payment_intent_id) {
    return res.status(400).json({ message: 'Missing order parameters.' });
  }

  // Prevent duplicate order processing if already saved
  try {
    const existingOrder = await db.query('SELECT * FROM orders WHERE stripe_payment_intent_id = $1', [payment_intent_id]);
    if (existingOrder.rows.length > 0) {
      return res.status(200).json({ 
        message: 'Order already processed.', 
        order: existingOrder.rows[0] 
      });
    }
  } catch (err) {
    console.error('Check duplicate order error:', err);
  }

  const client = await db.pool.connect();

  try {
    // Start transactional block
    await client.query('BEGIN');

    let totalAmount = 0;
    const itemsDetailsToLog = [];

    // 1. Verify and adjust inventory
    for (const item of items) {
      const productRes = await client.query(
        'SELECT name, price FROM products WHERE id = $1 FOR UPDATE', 
        [item.product_id]
      );
      const variantRes = await client.query(
        'SELECT stock_quantity FROM product_variants WHERE id = $1 AND product_id = $2 FOR UPDATE',
        [item.variant_id, item.product_id]
      );

      if (productRes.rows.length === 0 || variantRes.rows.length === 0) {
        throw new Error(`Product or variant not found: ${item.product_id}`);
      }

      const currentStock = variantRes.rows[0].stock_quantity;
      if (currentStock < item.quantity) {
        throw new Error(`Out of stock during purchase for: ${productRes.rows[0].name}`);
      }

      const itemPrice = parseFloat(productRes.rows[0].price);
      totalAmount += itemPrice * item.quantity;

      const newStock = currentStock - item.quantity;

      // Update variant stock in database
      await client.query(
        'UPDATE product_variants SET stock_quantity = $1 WHERE id = $2',
        [newStock, item.variant_id]
      );

      // Record detailed info for logs and item insertion
      itemsDetailsToLog.push({
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price: itemPrice,
        old_stock: currentStock,
        new_stock: newStock
      });
    }

    // 2. Insert Order record
    const userId = req.user ? req.user.id : null;
    const orderInsertRes = await client.query(
      `INSERT INTO orders (user_id, status, total_amount, stripe_payment_intent_id, shipping_address) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, user_id, status, total_amount, created_at`,
      [userId, 'paid', totalAmount, payment_intent_id, JSON.stringify(shipping_address)]
    );

    const orderId = orderInsertRes.rows[0].id;

    // 3. Insert Order Items & trigger inventory logging hook
    for (const itemDetail of itemsDetailsToLog) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, variant_id, quantity, price) 
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, itemDetail.product_id, itemDetail.variant_id, itemDetail.quantity, itemDetail.price]
      );

      // Trigger Structured JSON Log for Inventory Updates
      logInventoryUpdate(
        itemDetail.product_id,
        itemDetail.variant_id,
        itemDetail.old_stock,
        itemDetail.new_stock,
        'checkout'
      );
    }

    // Commit SQL transaction
    await client.query('COMMIT');

    // 4. Trigger Structured JSON Log for Transactions
    logTransaction(
      orderId,
      userId,
      totalAmount,
      itemsDetailsToLog,
      payment_intent_id
    );

    res.status(201).json({
      success: true,
      message: 'Checkout completed successfully.',
      order: {
        id: orderId,
        total_amount: totalAmount,
        created_at: orderInsertRes.rows[0].created_at,
        items: itemsDetailsToLog.map(d => ({
          product_id: d.product_id,
          variant_id: d.variant_id,
          quantity: d.quantity,
          price: d.price
        }))
      }
    });

  } catch (err) {
    // Rollback SQL transaction
    await client.query('ROLLBACK');
    console.error('Checkout execution error:', err.message);
    res.status(400).json({ message: err.message || 'Checkout failed during transaction.' });
  } finally {
    client.release();
  }
});

// @route   GET api/orders/history
// @desc    Get order history for authenticated customer
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const ordersRes = await db.query(
      `SELECT id, status, total_amount, shipping_address, created_at 
       FROM orders 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    const orders = [];

    for (const order of ordersRes.rows) {
      const itemsRes = await db.query(
        `SELECT oi.id, oi.quantity, oi.price, p.name, p.image_url, pv.size, pv.color
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         JOIN product_variants pv ON oi.variant_id = pv.id
         WHERE oi.order_id = $1`,
        [order.id]
      );

      orders.push({
        ...order,
        items: itemsRes.rows
      });
    }

    res.json(orders);
  } catch (err) {
    console.error('Fetch order history error:', err);
    res.status(500).json({ message: 'Server error fetching order history.' });
  }
});

module.exports = router;
