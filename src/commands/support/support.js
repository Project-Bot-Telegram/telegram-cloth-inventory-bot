// Command to display support information about how to order products
const supportCommand = async (ctx) => {
  return ctx.reply(
    '📦 How to Order Products\n\n' +
    'Step 1: View Products\n' +
    '• Use /products to see all available products\n' +
    '• Or tap "Show product" button to browse by category\n\n' +
    'Step 2: Check Product Details\n' +
    '• Use /product <name|id> to view details\n' +
    '• Example: /product Shirt or /product 0001\n\n' +
    'Step 3: Place Your Order\n' +
    '• Use /order <product_id> <quantity>\n' +
    '• Example: /order 0001 2 (for 2 shirts)\n\n' +
    'Step 4: Complete Payment\n' +
    '• Scan the QR code sent by the bot\n' +
    '• Complete payment within 2 minutes\n' +
    '• Click the Confirm button after payment\n\n' +
    'Step 5: Track Your Order\n' +
    '• Use /orders to view your order history\n' +
    '• Or tap "Orders History" button\n\n' +
    '❓ Need more help? Contact your admin or use /status to check bot status.'
  );
};

module.exports = supportCommand;
