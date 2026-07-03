const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Structured event logger
const eventLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, ...meta }) => {
          // Pretty print on console for developer convenience, while keeping JSON in file
          return `[EVENT] ${level}: ${JSON.stringify(meta)}`;
        })
      )
    }),
    new winston.transports.File({ 
      filename: path.join(logDir, 'events.json'),
      maxsize: 20 * 1024 * 1024, // 20MB
      maxFiles: 5
    })
  ]
});

/**
 * Log customer behavioral events (Page Views, Cart Add/Remove)
 */
const logUserBehavior = (userId, sessionId, eventType, productId, variantId, metadata = {}) => {
  eventLogger.info('User behavior event', {
    event_type: eventType, // 'page_view' | 'add_to_cart' | 'remove_from_cart'
    user_id: userId || 'guest',
    session_id: sessionId || 'anonymous',
    product_id: productId || null,
    variant_id: variantId || null,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

/**
 * Log transaction events (Successful Checkout Purchases)
 */
const logTransaction = (orderId, userId, totalAmount, itemList, stripePaymentIntentId) => {
  eventLogger.info('Transaction event', {
    event_type: 'purchase_success',
    order_id: orderId,
    user_id: userId || 'guest',
    total_amount: parseFloat(totalAmount),
    item_list: itemList.map(item => ({
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: parseInt(item.quantity),
      price: parseFloat(item.price)
    })),
    stripe_payment_intent_id: stripePaymentIntentId,
    timestamp: new Date().toISOString()
  });
};

/**
 * Log inventory adjustments (Checkout or Admin update)
 */
const logInventoryUpdate = (productId, variantId, oldStock, newStock, reason) => {
  eventLogger.info('Inventory update event', {
    event_type: 'inventory_update',
    product_id: productId,
    variant_id: variantId,
    old_stock: parseInt(oldStock),
    new_stock: parseInt(newStock),
    change: parseInt(newStock) - parseInt(oldStock),
    reason: reason, // 'checkout' | 'admin_adjustment'
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  eventLogger,
  logUserBehavior,
  logTransaction,
  logInventoryUpdate
};
