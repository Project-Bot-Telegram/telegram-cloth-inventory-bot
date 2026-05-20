const { Markup } = require('telegraf');
const mongoose = require('mongoose');
const Category = require('../../models/Category');
const Product = require('../../models/Product');
const { safeAnswerCbQuery } = require('../../utils/telegramHelper');

module.exports = async (ctx) => {
  const callbackQuery = ctx.callbackQuery;
  if (!callbackQuery || !callbackQuery.data || !callbackQuery.data.startsWith('category_show:')) {
    return;
  }

  const categoryId = callbackQuery.data.split(':')[1];
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    await safeAnswerCbQuery(ctx, 'Invalid category selection.', { show_alert: true });
    return;
  }

  const category = await Category.findById(categoryId);
  if (!category) {
    await safeAnswerCbQuery(ctx, 'Category not found.', { show_alert: true });
    return;
  }

  const products = await Product.find({ category_id: category._id })
    .populate('category_id');

  await safeAnswerCbQuery(ctx);

  if (products.length === 0) {
    return ctx.reply(`No products found in ${category.name}.`);
  }

  for (const product of products) {
    const categoryName = product.category_id
      ? product.category_id.name
      : 'Uncategorized';
    const price = typeof product.price === 'number' ? product.price.toFixed(2) : '0.00';
    const quantity = typeof product.quantity === 'number' ? product.quantity : 0;

    let status = 'Out of stock';
    if (quantity === 0) status = 'Out of stock';
    else if (quantity > 5) status = 'In stock';
    else if (quantity > 0 && quantity < 5) status = 'Low stock';

    const displayId = product.product_id || String(product._id);
    const message = `ID: ${displayId}\nName: ${product.name}\nCategory: ${categoryName}\nPrice: $${price}\nQuantity: ${quantity}\nStatus: ${status}`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('Order Now', `order_now:${product._id}`)],
      [Markup.button.callback('add to cart', `add_cart:${product._id}`)],
      [Markup.button.callback('view detail', `view_detail:${product._id}`)]
    ]);

    await ctx.reply(message, keyboard);
  }
};
