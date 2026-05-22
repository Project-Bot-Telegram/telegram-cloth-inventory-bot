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
    return ctx.reply('ប្រើ៖ /product <name|id>');
  }

  const product = await findProduct(identifier);
  if (!product) {
    return ctx.reply('មិនឃើញផលិតផល។');
  }

  const categoryName = product.category_id
    ? product.category_id.name
    : 'Uncategorized';
  const price = typeof product.price === 'number' ? product.price.toFixed(2) : '0.00';
  const description = product.description || 'No description';
  const quantity = typeof product.quantity === 'number' ? product.quantity : 0;

  let status = 'អស់ស្តុក';
  if (quantity === 0) status = 'អស់ស្តុក';
  else if (quantity > 5) status = 'នៅស្តុក';
  else if (quantity > 0 && quantity < 5) status = 'ស្តុកតិច';

  const displayId = product.product_id || String(product._id);

  const user = await User.findOne({ telegram_id: ctx.from.id });
  const buttons = [];
  if (user && user.role === 'admin') {
    buttons.push([Markup.button.callback('ស្តុក', `admin_product:stock:${product._id}`), Markup.button.callback('កែប្រែ', `edit_product:start:${product._id}`), Markup.button.callback('លុប', `admin_product:delete:${product._id}`)]);
  } else {
    buttons.push([Markup.button.callback('ដាក់ទៅកាស', `add_cart:${product._id}`), Markup.button.callback('បញ្ជាទិញឥឡូវ', `order_now:${product._id}`)]);
  }

  const keyboard = Markup.inlineKeyboard(buttons);

  const detailText = '' +
    '------------------------------\n' +
    'ព័ត៌មានផលិតផល\n' +
    '------------------------------\n' +
    `ID: ${displayId}\n` +
    `ឈ្មោះ: ${product.name}\n` +
    `ប្រភេទ: ${categoryName}\n` +
    `តម្លៃ: $${price}\n` +
    `ចំនួន: ${quantity}\n` +
    `ស្ថានភាព: ${status}\n` +
    `ការពិពណ៌នា: ${description}\n` +
    '------------------------------';

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