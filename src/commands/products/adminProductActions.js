const { Markup } = require('telegraf');
const mongoose = require('mongoose');
const Product = require('../../models/Product');
const User = require('../../models/User');
const { safeAnswerCbQuery } = require('../../utils/telegramHelper');

const getStockStatus = (quantity) => {
  if (quantity === 0) return 'Out of stock';
  if (quantity > 5) return 'In stock';
  return 'Low stock';
};

const findProduct = async (productId) => {
  let product = null;
  if (mongoose.Types.ObjectId.isValid(productId)) {
    product = await Product.findById(productId).populate('category_id');
  }
  if (!product) {
    product = await Product.findOne({ product_id: productId }).populate('category_id');
  }
  return product;
};

const ensureAdmin = async (ctx) => {
  const user = await User.findOne({ telegram_id: ctx.from.id });
  if (!user || user.role !== 'admin') {
    await ctx.reply('Admin only action');
    return null;
  }
  return user;
};

const adminProductKeyboard = (productId) => Markup.inlineKeyboard([
  [
    Markup.button.callback('Stock', `admin_product:stock:${productId}`),
    Markup.button.callback('Edit', `edit_product:start:${productId}`),
    Markup.button.callback('Delete', `admin_product:delete:${productId}`)
  ]
]);

const stockActionKeyboard = (productId) => Markup.inlineKeyboard([
  [
    Markup.button.callback('Add stock', `admin_stock:add:${productId}`),
    Markup.button.callback('Out stock', `admin_stock:out:${productId}`),
    Markup.button.callback('Clear stock', `admin_stock:clear:${productId}`)
  ]
]);

const stockActionWithHistoryKeyboard = (productId) => Markup.inlineKeyboard([
  [
    Markup.button.callback('Add stock', `admin_stock:add:${productId}`),
    Markup.button.callback('Out stock', `admin_stock:out:${productId}`),
    Markup.button.callback('Clear stock', `admin_stock:clear:${productId}`)
  ],
  [
    Markup.button.callback('History stock', `admin_stock:history:${productId}:0`)
  ]
]);

const sendStockInfo = async (ctx, product) => {
  const history = Array.isArray(product.stock_history) ? product.stock_history : [];
  const last = history[history.length - 1];
  const previous = history.length > 1 ? history[history.length - 2] : null;

  const displayId = product.product_id || String(product._id);
  const currentQuantity = typeof product.quantity === 'number' ? product.quantity : 0;
  const currentStatus = getStockStatus(currentQuantity);
  let message = '';
  message += '------------------------------\n';
  message += 'Stock Information\n';
  message += '------------------------------\n';
  message += `Product: ${product.name}\n`;
  message += `ID: ${displayId}\n`;
  message += `Current quantity: ${currentQuantity}\n`;
  message += `Status: ${currentStatus}\n`;

  if (last) {
    const sign = last.change >= 0 ? '+' : '-';
    message += '------------------------------\n';
    message += 'Last change\n';
    message += '------------------------------\n';
    message += `Type: ${last.type || 'unknown'}\n`;
    message += `Change: ${sign}${Math.abs(last.change)}\n`;
    message += `From: ${last.from ?? 'N/A'}\n`;
    message += `To: ${last.to ?? 'N/A'}\n`;
    message += `Date: ${new Date(last.date).toLocaleString()}\n`;
  }

  if (previous) {
    const sign = previous.change >= 0 ? '+' : '-';
    message += '------------------------------\n';
    message += 'Previous change\n';
    message += '------------------------------\n';
    message += `Type: ${previous.type || 'unknown'}\n`;
    message += `Change: ${sign}${Math.abs(previous.change)}\n`;
    message += `From: ${previous.from ?? 'N/A'}\n`;
    message += `To: ${previous.to ?? 'N/A'}\n`;
    message += `Date: ${new Date(previous.date).toLocaleString()}\n`;
    message += '------------------------------\n';
  }

  return ctx.reply(message, stockActionWithHistoryKeyboard(product._id));
};

const sendStockHistory = async (ctx, product, start = 0) => {
  if (!Array.isArray(product.stock_history)) {
    product.stock_history = (product.stock_history && typeof product.stock_history === 'object') ? [product.stock_history] : [];
  }

  const entries = product.stock_history.slice().reverse(); // newest first
  const page = 10;
  const startIndex = Number.isFinite(start) ? parseInt(start, 10) : 0;
  const slice = entries.slice(startIndex, startIndex + page);

  if (slice.length === 0) {
    await ctx.reply('No more history available.');
    return;
  }

  let message = '';
  message += '------------------------------\n';
  message += `Stock History (${startIndex + 1}-${startIndex + slice.length} of ${entries.length})\n`;
  message += '------------------------------\n';
  slice.forEach((h, idx) => {
    const i = startIndex + idx + 1;
    const sign = h.change >= 0 ? '+' : '-';
    const dateStr = h.date ? new Date(h.date).toLocaleString() : 'Unknown date';
    message += `${i}. Type: ${h.type || 'unknown'}\n`;
    message += `   Change: ${sign}${Math.abs(h.change || 0)}\n`;
    message += `   From: ${h.from ?? 'N/A'}\n`;
    message += `   To: ${h.to ?? 'N/A'}\n`;
    message += `   Date: ${dateStr}\n`;
    message += '------------------------------\n';
  });

  const moreStart = startIndex + page;
  const keyboard = [];
  if (moreStart < entries.length) {
    keyboard.push([Markup.button.callback('See 10 history more', `admin_stock:history:${product._id}:${moreStart}`)]);
  }

  return ctx.reply(message, keyboard.length ? Markup.inlineKeyboard(keyboard) : undefined);
};

const buildProductAdminButtons = (product) => {
  const productId = product._id;
  return adminProductKeyboard(productId);
};

const addStockHistory = async (product, change, type) => {
  const oldQuantity = typeof product.quantity === 'number' ? product.quantity : 0;
  const newQuantity = Math.max(0, oldQuantity + change);
  product.quantity = newQuantity;
  if (!Array.isArray(product.stock_history)) {
    product.stock_history = (product.stock_history && typeof product.stock_history === 'object') ? [product.stock_history] : [];
  }
  product.stock_history.push({
    date: new Date(),
    change,
    from: oldQuantity,
    to: newQuantity,
    type
  });
  if (product.stock_history.length > 20) {
    product.stock_history = product.stock_history.slice(-20);
  }
  await product.save();
  return product;
};

const handleCallback = async (ctx) => {
  const callbackQuery = ctx.callbackQuery;
  if (!callbackQuery || !callbackQuery.data) return;

  const user = await ensureAdmin(ctx);
  if (!user) return;

  const parts = callbackQuery.data.split(':');
  const key = parts[0];
  const action = parts[1];
  const productId = parts[2];

  if (!productId) {
    await safeAnswerCbQuery(ctx, 'Invalid action.', { show_alert: true });
    return;
  }

  const product = await findProduct(productId);
  if (!product) {
    await safeAnswerCbQuery(ctx, 'Product not found.', { show_alert: true });
    return;
  }

  if (key === 'admin_product') {
    if (action === 'stock') {
      await safeAnswerCbQuery(ctx);
      return sendStockInfo(ctx, product);
    }

    if (action === 'delete') {
      await safeAnswerCbQuery(ctx);
      return ctx.reply(
        `Are you sure you want to delete product ${product.name}?`,
        Markup.inlineKeyboard([
          [
            Markup.button.callback('Cancel', `admin_product:delete_cancel:${productId}`),
            Markup.button.callback('Confirm delete', `admin_product:delete_confirm:${productId}`)
          ]
        ])
      );
    }

    if (action === 'delete_confirm') {
      await safeAnswerCbQuery(ctx);
      await Product.deleteOne({ _id: product._id });
      return ctx.reply('Product deleted successfully.');
    }

    if (action === 'delete_cancel') {
      await safeAnswerCbQuery(ctx);
      return ctx.reply('Delete product canceled.');
    }
  }

  if (key === 'admin_stock') {
    await safeAnswerCbQuery(ctx);
    if (action === 'add') {
      ctx.session = ctx.session || {};
      ctx.session.adminStock = {
        type: 'add',
        productId: product._id.toString(),
        stepIndex: 0
      };
      return ctx.reply(`Send the amount to add to stock for ${product.name}.`);
    }

    if (action === 'out') {
      ctx.session = ctx.session || {};
      ctx.session.adminStock = {
        type: 'out',
        productId: product._id.toString(),
        stepIndex: 0
      };
      return ctx.reply(`Send the amount to remove from stock for ${product.name}.`);
    }

    if (action === 'clear') {
      return ctx.reply(
        `Are you sure you want to clear stock for ${product.name}?`,
        Markup.inlineKeyboard([
          [
            Markup.button.callback('Cancel', `admin_stock:clear_cancel:${productId}`),
            Markup.button.callback('Confirm clear', `admin_stock:clear_confirm:${productId}`)
          ]
        ])
      );
    }

    if (action === 'history') {
      await safeAnswerCbQuery(ctx);
      const start = parts[3] ? parseInt(parts[3], 10) : 0;
      return sendStockHistory(ctx, product, isNaN(start) ? 0 : start);
    }

    if (action === 'clear_confirm') {
      const oldQuantity = typeof product.quantity === 'number' ? product.quantity : 0;
      product.quantity = 0;
      product.stock_history = product.stock_history || [];
      product.stock_history.push({
        date: new Date(),
        change: -oldQuantity,
        from: oldQuantity,
        to: 0,
        type: 'clear'
      });
      if (product.stock_history.length > 20) {
        product.stock_history = product.stock_history.slice(-20);
      }
      await product.save();
      return ctx.reply(`Stock cleared for ${product.name}. Current quantity is 0.`);
    }

    if (action === 'clear_cancel') {
      return ctx.reply('Clear stock canceled.');
    }
  }

  await safeAnswerCbQuery(ctx, 'Invalid admin stock action.', { show_alert: true });
};

const handleMessage = async (ctx) => {
  if (!ctx.session || !ctx.session.adminStock) {
    return false;
  }

  const flow = ctx.session.adminStock;
  const text = (ctx.message && ctx.message.text) ? ctx.message.text.trim() : '';
  const product = await findProduct(flow.productId);
  if (!product) {
    ctx.session.adminStock = null;
    return ctx.reply('Product not found.');
  }

  if (!text) {
    return ctx.reply('Please send a numeric amount.');
  }

  const amount = parseInt(text, 10);
  if (Number.isNaN(amount) || amount <= 0) {
    return ctx.reply('Invalid amount. Please send a positive integer.');
  }

  let change = amount;
  let actionText = 'added to';
  if (flow.type === 'out') {
    change = -amount;
    actionText = 'removed from';
  }

  await addStockHistory(product, change, flow.type === 'add' ? 'add' : 'out');
  const displayId = product.product_id || String(product._id);
  const currentStatus = getStockStatus(product.quantity);
  ctx.session.adminStock = null;
  return ctx.reply(`Stock ${actionText} ${product.name}.\nProduct ID: ${displayId}\nNew quantity: ${product.quantity}\nStatus: ${currentStatus}`);
};

module.exports = {
  buildProductAdminButtons,
  handleCallback,
  handleMessage
};
