const { Markup } = require('telegraf');
const mongoose = require('mongoose');
const Product = require('../../models/Product');
const User = require('../../models/User');
const { safeAnswerCbQuery } = require('../../utils/telegramHelper');

const findProductById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  return Product.findById(id).populate('category_id');
};

module.exports = async (ctx) => {
  const callbackQuery = ctx.callbackQuery;
  if (!callbackQuery || !callbackQuery.data || !callbackQuery.data.startsWith('view_detail:')) {
    return;
  }

  const productId = callbackQuery.data.split(':')[1];
  const product = await findProductById(productId);
  if (!product) {
    await safeAnswerCbQuery(ctx, 'Product not found.', { show_alert: true });
    return;
  }

  await safeAnswerCbQuery(ctx);

  const categoryName = product.category_id
    ? product.category_id.name
    : 'Uncategorized';
  const price = typeof product.price === 'number' ? product.price.toFixed(2) : '0.00';
  const description = product.description || 'No description';
  const quantity = typeof product.quantity === 'number' ? product.quantity : 0;

  let status = 'Out of stock';
  if (quantity === 0) status = 'Out of stock';
  else if (quantity > 5) status = 'In stock';
  else if (quantity > 0 && quantity < 5) status = 'Low stock';

  const displayId = product.product_id || String(product._id);
  const user = await User.findOne({ telegram_id: ctx.from.id });
  const buttons = [
    [Markup.button.callback('add to cart', `add_cart:${product._id}`), Markup.button.callback('Order Now', `order_now:${product._id}`)]
  ];

  if (user && user.role === 'admin') {
    buttons.push([Markup.button.callback('Edit Product', `edit_product:start:${product._id}`)]);
  }

  const keyboard = Markup.inlineKeyboard(buttons);

  const detailText = `\nProduct Detail\n\nID: ${displayId}\nName: ${product.name}\nCategory: ${categoryName}\nPrice: $${price}\nQuantity: ${quantity}\nStatus: ${status}\nDescription: ${description}`;

  if (product.image) {
    try {
      const photoSource = product.image.startsWith('http')
        ? { url: product.image }
        : { source: product.image };
      await ctx.replyWithPhoto(
        photoSource,
        {
          caption: detailText,
          ...keyboard
        }
      );
      return;
    } catch (err) {
      console.error('Failed to send product image:', err);
    }
  }

  await ctx.reply(detailText, keyboard);
};
