const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { admin } = require('../middleware/auth');
const { logInventoryUpdate } = require('../config/logger');

// All routes here require Administrator credentials

// @route   GET api/admin/orders
// @desc    Get all orders in the system
// @access  Admin
router.get('/orders', admin, async (req, res) => {
  try {
    const ordersRes = await db.query(
      `SELECT o.id, o.status, o.total_amount, o.shipping_address, o.created_at, u.name as customer_name, u.email as customer_email
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );

    const orders = [];

    for (const order of ordersRes.rows) {
      const itemsRes = await db.query(
        `SELECT oi.id, oi.quantity, oi.price, p.name, pv.size, pv.color
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
    console.error('Fetch admin orders error:', err);
    res.status(500).json({ message: 'Server error fetching admin orders.' });
  }
});

// @route   GET api/admin/inventory
// @desc    Get all products and their variants with stock levels
// @access  Admin
router.get('/inventory', admin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.id as product_id, p.name as product_name, p.category, p.price,
              pv.id as variant_id, pv.size, pv.color, pv.stock_quantity
       FROM product_variants pv
       JOIN products p ON pv.product_id = p.id
       ORDER BY p.name ASC, pv.size ASC, pv.color ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch inventory error:', err);
    res.status(500).json({ message: 'Server error fetching inventory list.' });
  }
});

// @route   POST api/admin/products
// @desc    Create a new product with custom variants
// @access  Admin
router.post('/products', admin, async (req, res) => {
  const { name, description, price, category, image_url, variants } = req.body;

  if (!name || !price || !category || !variants || !Array.isArray(variants) || variants.length === 0) {
    return res.status(400).json({ message: 'Please provide name, price, category, and at least one variant.' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert product
    const productInsert = await client.query(
      `INSERT INTO products (name, description, price, category, image_url) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name, description, parseFloat(price), category, image_url || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80']
    );
    const product = productInsert.rows[0];

    // 2. Insert product variants & log their initial stock
    const insertedVariants = [];
    for (const v of variants) {
      if (!v.size || !v.color || v.stock_quantity === undefined || v.stock_quantity < 0) {
        throw new Error('Invalid variant details. Size, Color, and positive stock_quantity are required.');
      }

      const variantInsert = await client.query(
        `INSERT INTO product_variants (product_id, size, color, stock_quantity) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [product.id, v.size, v.color, parseInt(v.stock_quantity)]
      );

      const variant = variantInsert.rows[0];
      insertedVariants.push(variant);

      // Trigger Structured JSON Log for initial inventory creation
      logInventoryUpdate(
        product.id,
        variant.id,
        0, // Old stock was 0
        variant.stock_quantity,
        'admin_adjustment'
      );
    }

    await client.query('COMMIT');
    res.status(201).json({
      ...product,
      variants: insertedVariants
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create product error:', err.message);
    res.status(400).json({ message: err.message || 'Server error creating product.' });
  } finally {
    client.release();
  }
});

// @route   PUT api/admin/variants/:id/stock
// @desc    Update stock quantity for a variant
// @access  Admin
router.put('/variants/:id/stock', admin, async (req, res) => {
  const { stock_quantity } = req.body;

  if (stock_quantity === undefined || stock_quantity < 0) {
    return res.status(400).json({ message: 'Valid non-negative stock quantity required.' });
  }

  try {
    // Get current stock details first for logging changes
    const variantRes = await db.query(
      'SELECT product_id, stock_quantity FROM product_variants WHERE id = $1',
      [req.params.id]
    );

    if (variantRes.rows.length === 0) {
      return res.status(404).json({ message: 'Variant not found.' });
    }

    const oldStock = variantRes.rows[0].stock_quantity;
    const productId = variantRes.rows[0].product_id;

    // Update variant stock
    const updateRes = await db.query(
      `UPDATE product_variants 
       SET stock_quantity = $1 
       WHERE id = $2 
       RETURNING id, product_id, size, color, stock_quantity`,
      [parseInt(stock_quantity), req.params.id]
    );

    const updatedVariant = updateRes.rows[0];

    // Trigger Structured JSON Log for admin inventory adjustment
    logInventoryUpdate(
      productId,
      updatedVariant.id,
      oldStock,
      updatedVariant.stock_quantity,
      'admin_adjustment'
    );

    res.json({
      message: 'Stock updated successfully.',
      variant: updatedVariant
    });
  } catch (err) {
    console.error('Update variant stock error:', err);
    res.status(500).json({ message: 'Server error updating stock.' });
  }
});

module.exports = router;
