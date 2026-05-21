// Command to display support information about how to order products
const supportCommand = async (ctx) => {
  return ctx.reply(
    '📦 How to Order Products\n\n' +
    'Step 1: View Products\n' +
    '• Tap "Show product" button to browse categories and products\n\n' +
    'Step 2: Check Product Details\n' +
    '• Select a product from the category listing\n\n' +
    'Step 3: Place Your Order\n' +
    '• Tap "Order Now" on the product detail screen\n' +
    '• Then send your delivery address when prompted\n\n' +
    'Step 4: Complete Payment\n' +
    '• Scan the QR code sent by the bot\n' +
    '• Complete payment within 2 minutes\n' +
    '• Click the Confirm button after payment\n\n' +
    'Step 5: Track Your Order\n' +
    '• Tap "Orders History" button\n\n' +
    '❓ Need more help? Contact your admin or use /status to check bot status.'
  );
};

module.exports = supportCommand;
