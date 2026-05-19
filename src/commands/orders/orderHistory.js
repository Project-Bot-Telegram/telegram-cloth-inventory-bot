const Order = require('../../models/Order');
const User = require('../../models/User');

module.exports = async (ctx) => {
  const user = await User.findOne({ telegram_id: ctx.from.id });
  if (!user) {
    return ctx.reply('Please register first by sending /start.');
  }

  const orders = await Order.find({ user_id: user._id })
    .sort({ created_at: -1 });

  if (orders.length === 0) {
    return ctx.reply('You have no order history yet. Use /order to place your first order.');
  }

  let message = 'Your Order History:\n\n';

  orders.forEach((order, index) => {
    const createdAt = order.created_at
      ? order.created_at.toLocaleString()
      : 'Unknown date';
    const status = order.status === 'pending' && order.expires_at && order.expires_at < new Date()
      ? 'expired'
      : order.status;
    const expiresText = order.status === 'pending' && order.expires_at
      ? ` (expires ${order.expires_at.toLocaleTimeString()})`
      : '';

    message += `Order #${index + 1}\nProduct: ${order.product_name}\nCategory: ${order.product_category}\nQuantity: ${order.quantity}\nPrice: $${order.product_price.toFixed(2)}\nTotal: $${order.total_price.toFixed(2)}\nStatus: ${status}${expiresText}\nDate: ${createdAt}\n\n`;
  });

  return ctx.reply(message);
};
