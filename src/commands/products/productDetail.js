const { Markup } = require('telegraf');
const mongoose = require('mongoose');
const Product = require('../../models/Product');
const User = require('../../models/User');

const findProduct = async (identifier) => {
  let product = await Product.findOne({ name: identifier }).populate('category_id');
  if (product) return product;

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    product = await Product.findById(identifier).populate('category_id');
    if (product) return product;
  }

  product = await Product.findOne({ product_id: identifier }).populate('category_id');
  return product;
};

module.exports = async (ctx) => {
  const text = ctx.message.text.split(' ');
  const identifier = text[1];

  if (!identifier) {
    return ctx.reply('Usage: /product <name|id>');
  }

  const product = await findProduct(identifier);
  if (!product) {
    return ctx.reply('Product not found');
  }

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
  const buttons = [];
  if (user && user.role === 'admin') {
    buttons.push([Markup.button.callback('Stock', `admin_product:stock:${product._id}`), Markup.button.callback('Edit', `edit_product:start:${product._id}`), Markup.button.callback('Delete', `admin_product:delete:${product._id}`)]);
  } else {
    buttons.push([Markup.button.callback('add to cart', `add_cart:${product._id}`), Markup.button.callback('Order Now', `order_now:${product._id}`)]);
  }

  const keyboard = Markup.inlineKeyboard(buttons);

  const detailText = `\nProduct Detail\n\nID: ${displayId}\nName: ${product.name}\nCategory: ${categoryName}\nPrice: $${price}\nQuantity: ${quantity}\nStatus: ${status}\nDescription: ${description}`;

  if (product.image) {
    try {
      const photoSource = product.image.startsWith('http')
        ? { url: product.image }
        : product.image;
      return ctx.replyWithPhoto(
        photoSource,
        {
          caption: detailText,
          ...keyboard
        }
      );
    } catch (err) {
      console.error('Failed to send product image:', err);
    }
  }

  return ctx.reply(detailText, keyboard);
};