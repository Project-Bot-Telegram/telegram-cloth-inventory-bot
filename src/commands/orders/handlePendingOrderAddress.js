const path = require('path');
const mongoose = require('mongoose');
const { Markup } = require('telegraf');
const User = require('../../models/User');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const { schedulePendingOrderExpiration } = require('../../utils/orderHelper');

const buildCartSummary = (cartItems) => {
  return cartItems.map((item) => `- ${item.product_name} x${item.quantity} = $${item.total_price.toFixed(2)}`).join('\n');
};

const scheduleOrderExpiration = async (order, ctx) => {
  schedulePendingOrderExpiration(order._id, order.expires_at, async () => {
    const pendingOrder = await Order.findById(order._id);
    if (!pendingOrder || pendingOrder.status !== 'pending') {
      return;
    }

    pendingOrder.status = 'expired';
    await pendingOrder.save();

    if (pendingOrder.cart_items && pendingOrder.cart_items.length > 0) {
      for (const item of pendingOrder.cart_items) {
        if (!item.product_id) continue;
        const expiredProduct = await Product.findById(item.product_id);
        if (expiredProduct) {
          const oldQ = typeof expiredProduct.quantity === 'number' ? expiredProduct.quantity : 0;
          expiredProduct.quantity += item.quantity;
          if (!Array.isArray(expiredProduct.stock_history)) {
            expiredProduct.stock_history = (expiredProduct.stock_history && typeof expiredProduct.stock_history === 'object') ? [expiredProduct.stock_history] : [];
          }
          expiredProduct.stock_history.push({
            date: new Date(),
            change: item.quantity,
            from: oldQ,
            to: expiredProduct.quantity,
            type: 'restore'
          });
          if (expiredProduct.stock_history.length > 20) {
            expiredProduct.stock_history = expiredProduct.stock_history.slice(-20);
          }
          await expiredProduct.save();
        }
      }
    } else {
      const expiredProduct = await Product.findById(pendingOrder.product_id);
      if (expiredProduct) {
        const oldQ = typeof expiredProduct.quantity === 'number' ? expiredProduct.quantity : 0;
        expiredProduct.quantity += pendingOrder.quantity;
        if (!Array.isArray(expiredProduct.stock_history)) {
          expiredProduct.stock_history = (expiredProduct.stock_history && typeof expiredProduct.stock_history === 'object') ? [expiredProduct.stock_history] : [];
        }
        expiredProduct.stock_history.push({
          date: new Date(),
          change: pendingOrder.quantity,
          from: oldQ,
          to: expiredProduct.quantity,
          type: 'restore'
        });
        if (expiredProduct.stock_history.length > 20) {
          expiredProduct.stock_history = expiredProduct.stock_history.slice(-20);
        }
        await expiredProduct.save();
      }
    }

    await ctx.telegram.sendMessage(ctx.from.id, `⏰ អញ្ជើញជាមួយ​ការបញ្ជាទិញរបស់អ្នកបានផុតកំណត់។ ការបង់ប្រាក់មិនត្រូវបានបញ្ជាក់ក្នុងរយៈពេល 2 នាទី ហើយទំនិញបានត្រូវបានស្ដុកត្រឡប់។`);
  });
};

const sendPaymentRequest = async (ctx, order, address, summaryText) => {
  const qrPath = path.join(__dirname, '../../../assets/QRpayment/QRpayment.png');
  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('បញ្ជាក់ការបង់ប្រាក់', `confirm_order:${order._id}`)]
  ]);

  const expiresText = order.expires_at ? new Date(order.expires_at).toLocaleString() : '';
  const caption = '' +
    '------------------------------\n' +
    'ការស្នើសុំទូទាត់\n' +
    '------------------------------\n' +
    `អាសយដ្ឋានដឹកជញ្ជូន: ${address}\n` +
    `ផុតកំណត់នៅ: ${expiresText}\n` +
    '------------------------------\n' +
    `សង្ខេបការបញ្ជាទិញ:\n${summaryText}\n` +
    '------------------------------\n' +
    `សរុប: $${order.total_price.toFixed(2)}\n` +
    '------------------------------\n' +
    'សូមបង់ប្រាក់ និងចុច បញ្ជាក់ការបង់ប្រាក់ ក្នុងរយៈពេល 2 នាទី។';

  return ctx.replyWithPhoto({ source: qrPath }, {
    caption,
    reply_markup: buttons.reply_markup
  });
};

const createSingleOrder = async (ctx, user, pendingOrder, address) => {
  if (!mongoose.Types.ObjectId.isValid(pendingOrder.productId)) {
    ctx.session.pendingOrder = null;
    return ctx.reply('ការបញ្ជាទិញមិនអាចបញ្ចប់បានទេ។ កូដផលិតផលមិនត្រឹមត្រូវ។');
  }

  const product = await Product.findById(pendingOrder.productId).populate('category_id');
  if (!product) {
    ctx.session.pendingOrder = null;
    return ctx.reply('ការបញ្ជាទិញមិនអាចបញ្ចប់បានទេ។ មិនឃើញផលិតផល។');
  }

  if (product.quantity < pendingOrder.quantity) {
    ctx.session.pendingOrder = null;
    return ctx.reply(`ស្តុកមិនគ្រប់គ្រាន់ដើម្បីបញ្ចប់ការបញ្ជាទិញ។ បរិមាណនៅសល់៖ ${product.quantity}`);
  }

  const oldQty = typeof product.quantity === 'number' ? product.quantity : 0;
  product.quantity -= pendingOrder.quantity;
  if (!Array.isArray(product.stock_history)) {
    product.stock_history = (product.stock_history && typeof product.stock_history === 'object') ? [product.stock_history] : [];
  }
  product.stock_history.push({
    date: new Date(),
    change: -pendingOrder.quantity,
    from: oldQty,
    to: product.quantity,
    type: 'purchase'
  });
  if (product.stock_history.length > 20) {
    product.stock_history = product.stock_history.slice(-20);
  }
  await product.save();

  const productCategory = product.category_id ? product.category_id.name : 'Uncategorized';
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

  const order = new Order({
    telegram_id: user.telegram_id,
    user_id: user._id,
    product_id: product._id,
    product_name: product.name,
    product_category: productCategory,
    product_price: product.price || 0,
    quantity: pendingOrder.quantity,
    total_price: (product.price || 0) * pendingOrder.quantity,
    address,
    expires_at: expiresAt
  });

  await order.save();
  await scheduleOrderExpiration(order, ctx);

  ctx.session.pendingOrder = null;

  return sendPaymentRequest(ctx, order, address, `Product: ${order.product_name}\nCategory: ${order.product_category}\nQuantity: ${order.quantity}\nPrice per item: $${order.product_price.toFixed(2)}`);
};

const createCartOrder = async (ctx, user, pendingOrder, address) => {
  const cartItems = pendingOrder.items || [];
  if (cartItems.length === 0) {
    ctx.session.pendingOrder = null;
    return ctx.reply('ការបញ្ជាទិញក្នុងរទេះទំនិញរបស់អ្នកទទេ។');
  }

  const productsToSave = [];
  const cartItemsWithMeta = [];

  for (const item of cartItems) {
    if (!mongoose.Types.ObjectId.isValid(item.productId)) {
      continue;
    }

    const product = await Product.findById(item.productId).populate('category_id');
    if (!product) {
      ctx.session.pendingOrder = null;
      return ctx.reply(`ការបញ្ជាទិញមិនអាចបញ្ចប់បានទេ។ មិនឃើញផលិតផល ${item.productName}។`);
    }

    if (product.quantity < item.quantity) {
      ctx.session.pendingOrder = null;
      return ctx.reply(`ស្តុកមិនគ្រប់គ្រាន់សម្រាប់ ${product.name}។ បរិមាណនៅសល់៖ ${product.quantity}`);
    }

    productsToSave.push({ product, quantity: item.quantity });
    const productCategory = product.category_id ? product.category_id.name : 'Uncategorized';
    cartItemsWithMeta.push({
      product_id: product._id,
      product_name: product.name,
      product_category: productCategory,
      product_price: product.price || 0,
      quantity: item.quantity,
      total_price: (product.price || 0) * item.quantity
    });
  }

  if (cartItemsWithMeta.length === 0) {
    ctx.session.pendingOrder = null;
    return ctx.reply('ការបញ្ជាទិញក្នុងរទេះមិនអាចបញ្ចប់បានទេ។ ទំនិញក្នុងរទេះមិនត្រឹមត្រូវ។');
  }

  for (const { product, quantity } of productsToSave) {
    const oldQ = typeof product.quantity === 'number' ? product.quantity : 0;
    product.quantity -= quantity;
    if (!Array.isArray(product.stock_history)) {
      product.stock_history = (product.stock_history && typeof product.stock_history === 'object') ? [product.stock_history] : [];
    }
    product.stock_history.push({
      date: new Date(),
      change: -quantity,
      from: oldQ,
      to: product.quantity,
      type: 'purchase'
    });
    if (product.stock_history.length > 20) {
      product.stock_history = product.stock_history.slice(-20);
    }
    await product.save();
  }

  const totalPrice = cartItemsWithMeta.reduce((sum, item) => sum + item.total_price, 0);
  const totalQuantity = cartItemsWithMeta.reduce((sum, item) => sum + item.quantity, 0);
  const productCategory = [...new Set(cartItemsWithMeta.map((item) => item.product_category))].join(', ');
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

  const order = new Order({
    telegram_id: user.telegram_id,
    user_id: user._id,
    product_name: 'Cart order',
    product_category: productCategory,
    product_price: totalPrice,
    quantity: totalQuantity,
    total_price: totalPrice,
    cart_items: cartItemsWithMeta,
    address,
    expires_at: expiresAt
  });

  await order.save();
  await scheduleOrderExpiration(order, ctx);

  ctx.session.pendingOrder = null;
  ctx.session.cart = [];

  return sendPaymentRequest(ctx, order, address, buildCartSummary(cartItemsWithMeta));
};

const finalizePendingOrder = async (ctx, user, address) => {
  const pendingOrder = ctx.session.pendingOrder;
  if (!pendingOrder) {
    return ctx.reply('មិនមានការបញ្ជាទិញនៅខាងមុខទេ។');
  }

  if (pendingOrder.type === 'single') {
    return createSingleOrder(ctx, user, pendingOrder, address);
  }

  if (pendingOrder.type === 'cart') {
    return createCartOrder(ctx, user, pendingOrder, address);
  }

  ctx.session.pendingOrder = null;
  return ctx.reply('មិនអាចដំណើរការសំណើរបញ្ជាទិញរបស់អ្នកបានទេ។ សូមព្យាយាមម្តងទៀត។');
};

const handlePendingOrderAddress = async (ctx) => {
  if (!ctx.message || !ctx.message.text) {
    return false;
  }

  const text = ctx.message.text.trim();
  if (!ctx.session || !ctx.session.pendingOrder) {
    return false;
  }

  if (text.startsWith('/')) {
    return ctx.reply('មានការបញ្ជាទិញមួយនៅរងចាំអាសយដ្ឋានដឹកជញ្ជូនរបស់អ្នក។ សូមផ្ញើអាសយដ្ឋានរបស់អ្នកដើម្បីបន្ត។');
  }

  const user = await User.findOne({ telegram_id: ctx.from.id });
  if (!user) {
    ctx.session.pendingOrder = null;
    return ctx.reply('សូមចុះឈ្មោះជាមុនដោយផ្ញើ /start។');
  }

  const address = text;
  if (!address) {
    return ctx.reply('សូមបញ្ចូលអាសយដ្ឋានដឹកជញ្ជូនដែលត្រឹមត្រូវ។');
  }

  return finalizePendingOrder(ctx, user, address);
};

handlePendingOrderAddress.finalizePendingOrder = finalizePendingOrder;
module.exports = handlePendingOrderAddress;
