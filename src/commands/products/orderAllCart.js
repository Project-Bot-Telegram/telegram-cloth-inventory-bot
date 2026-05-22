const mongoose = require('mongoose');
const { Markup } = require('telegraf');
const User = require('../../models/User');
const Product = require('../../models/Product');
const { safeAnswerCbQuery } = require('../../utils/telegramHelper');

const findProductById = async (productId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) return null;
  return Product.findById(productId).populate('category_id');
};

module.exports = async (ctx) => {
  const callbackQuery = ctx.callbackQuery;
  if (!callbackQuery || !callbackQuery.data || !callbackQuery.data.startsWith('order_all_cart')) {
    return;
  }

  ctx.session = ctx.session || {};
  const cart = ctx.session.cart || [];

  if (cart.length === 0) {
    await safeAnswerCbQuery(ctx, 'Your cart is empty.', { show_alert: true });
    return;
  }

  const user = await User.findOne({ telegram_id: ctx.from.id });
  if (!user) {
    await safeAnswerCbQuery(ctx, 'Please register first by sending /start.', { show_alert: true });
    return;
  }

  const insufficientItems = [];
  const cartItems = [];
  let totalPrice = 0;
  let totalQuantity = 0;
  const productCategories = new Set();

  for (const item of cart) {
    const product = await findProductById(item.productId);
    if (!product) {
      insufficientItems.push(`Product ${item.productName} not found.`);
      continue;
    }

    if (product.quantity < item.quantity) {
      insufficientItems.push(`${product.name} only has ${product.quantity} available.`);
    }

    const productCategory = product.category_id
      ? product.category_id.name
      : 'Uncategorized';

    cartItems.push({
      productId: product._id.toString(),
      productName: product.name,
      productCategory,
      productPrice: product.price || 0,
      quantity: item.quantity,
      total_price: (product.price || 0) * item.quantity
    });

    totalQuantity += item.quantity;
    totalPrice += (product.price || 0) * item.quantity;
    productCategories.add(productCategory);
  }

  if (insufficientItems.length > 0) {
    await safeAnswerCbQuery(ctx);
    return ctx.reply(`Unable to place order for all cart items:\n${insufficientItems.join('\n')}`);
  }

  await safeAnswerCbQuery(ctx);

  ctx.session.pendingOrder = {
    type: 'cart',
    items: cartItems,
    totalPrice,
    totalQuantity,
    productCategory: [...productCategories].join(', ')
  };

  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('ប្រើអាសយដ្ឋានក្នុង​​ profile', 'order_address:profile')],
    [Markup.button.callback('ប្រើអាសយដ្ឋានថ្មី', 'order_address:new')]
  ]);

  return ctx.reply(
    'សូមជ្រើសអាសយដ្ឋានដឹកជញ្ជូនសម្រាប់ការបញ្ជាទិញទាំងអស់ក្នុងកន្ត្រករបស់អ្នក:',
    buttons
  );
};
