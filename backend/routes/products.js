const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { logUserBehavior } = require('../config/logger');

// @route   GET api/products
// @desc    Get all products with dynamic filtering (category, size, color, search, price)
// @access  Public
router.get('/', async (req, res) => {
  const { category, size, color, minPrice, maxPrice, search } = req.query;

  let queryText = `
    SELECT DISTINCT p.* 
    FROM products p
    LEFT JOIN product_variants pv ON p.id = pv.product_id
    WHERE 1=1
  `;
  const queryParams = [];
  let paramIndex = 1;

  if (category) {
    queryText += ` AND p.category = $${paramIndex}`;
    queryParams.push(category);
    paramIndex++;
  }

  if (size) {
    queryText += ` AND pv.size = $${paramIndex}`;
    queryParams.push(size);
    paramIndex++;
  }

  if (color) {
    queryText += ` AND pv.color = $${paramIndex}`;
    queryParams.push(color);
    paramIndex++;
  }

  if (minPrice) {
    queryText += ` AND p.price >= $${paramIndex}`;
    queryParams.push(parseFloat(minPrice));
    paramIndex++;
  }

  if (maxPrice) {
    queryText += ` AND p.price <= $${paramIndex}`;
    queryParams.push(parseFloat(maxPrice));
    paramIndex++;
  }

  if (search) {
    queryText += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
    queryParams.push(`%${search}%`);
    paramIndex++;
  }

  queryText += ' ORDER BY p.name ASC';

  try {
    const result = await db.query(queryText, queryParams);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch products error:', err);
    res.status(500).json({ message: 'Server error fetching products.' });
  }
});

// @route   GET api/products/filters
// @desc    Get all unique categories, sizes, and colors for filter selectors
// @access  Public
router.get('/filters', async (req, res) => {
  try {
    const categoriesRes = await db.query('SELECT DISTINCT category FROM products ORDER BY category');
    const sizesRes = await db.query('SELECT DISTINCT size FROM product_variants ORDER BY size');
    const colorsRes = await db.query('SELECT DISTINCT color FROM product_variants ORDER BY color');

    res.json({
      categories: categoriesRes.rows.map(r => r.category),
      sizes: sizesRes.rows.map(r => r.size),
      colors: colorsRes.rows.map(r => r.color)
    });
  } catch (err) {
    console.error('Fetch filters error:', err);
    res.status(500).json({ message: 'Server error fetching filters.' });
  }
});

// @route   GET api/products/:id
// @desc    Get single product details with its variants
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const productResult = await db.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const variantsResult = await db.query(
      'SELECT id, size, color, stock_quantity FROM product_variants WHERE product_id = $1 ORDER BY size, color',
      [req.params.id]
    );

    res.json({
      ...productResult.rows[0],
      variants: variantsResult.rows
    });
  } catch (err) {
    console.error('Fetch product detail error:', err);
    res.status(500).json({ message: 'Server error fetching product details.' });
  }
});

// @route   POST api/products/log-event
// @desc    Client-side behavioral event logger endpoint
// @access  Public
router.post('/log-event', (req, res) => {
  const { userId, sessionId, eventType, productId, variantId, metadata } = req.body;

  if (!eventType) {
    return res.status(400).json({ message: 'eventType field is required.' });
  }

  try {
    logUserBehavior(userId, sessionId, eventType, productId, variantId, metadata);
    res.json({ success: true });
  } catch (err) {
    console.error('Event log endpoint error:', err);
    res.status(500).json({ message: 'Failed to write behavioral log.' });
  }
});

module.exports = router;
