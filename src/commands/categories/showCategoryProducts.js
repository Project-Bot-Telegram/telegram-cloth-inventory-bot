const fs = require('fs');
const { Markup } = require('telegraf');
const mongoose = require('mongoose');
const Category = require('../../models/Category');
const Product = require('../../models/Product');
const User = require('../../models/User');
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

  const user = await User.findOne({ telegram_id: ctx.from.id });
  const isAdmin = user && user.role === 'admin';

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
    const message = `------------------------------\nID: ${displayId}\nName: ${product.name}\nPrice: $${price}\nQuantity: ${quantity}\nStatus: ${status}\n------------------------------`;

    const buttons = [];
    if (isAdmin) {
      buttons.push([Markup.button.callback('Stock', `admin_product:stock:${product._id}`), Markup.button.callback('Edit', `edit_product:start:${product._id}`), Markup.button.callback('Delete', `admin_product:delete:${product._id}`)]);
    } else {
      buttons.push([Markup.button.callback('Order Now', `order_now:${product._id}`)]);
      buttons.push([Markup.button.callback('add to cart', `add_cart:${product._id}`)]);
    }
    const keyboard = Markup.inlineKeyboard(buttons);

    if (product.image) {
      let photoSource = product.image;
      if (typeof photoSource === 'string' && photoSource.startsWith('http')) {
        photoSource = { url: photoSource };
      } else if (typeof photoSource === 'string' && fs.existsSync(photoSource)) {
        photoSource = { source: photoSource };
      }

      try {
        await ctx.replyWithPhoto(photoSource, {
          caption: message,
          ...keyboard
        });
        continue;
      } catch (err) {
        console.error('Failed to send product image for showCategoryProducts:', err);
      }
    }

    await ctx.reply(message, keyboard);
  }
};
