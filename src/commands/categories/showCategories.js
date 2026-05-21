const { Markup } = require('telegraf');
const Category = require('../../models/Category');
const Product = require('../../models/Product');
const User = require('../../models/User');

module.exports = async (ctx) => {
  const categories = await Category.find();

  if (categories.length === 0) {
    return ctx.reply('No categories available.');
  }

  const buttons = [];

  // Show add-product button only to admins
  try {
    const user = await User.findOne({ telegram_id: ctx.from.id });
    if (user && user.role === 'admin') {
      buttons.push([Markup.button.callback('+ add product +', 'admin:add_product:continue')]);
    }
  } catch (err) {
    // if any error occurs, don't show the admin button
  }

  for (const category of categories) {
    const count = await Product.countDocuments({ category_id: category._id });
    const label = `${category.name} (${count})`;
    buttons.push([Markup.button.callback(label, `category_show:${category._id}`)]);
  }

  const keyboard = Markup.inlineKeyboard(buttons);
  const message = '' +
    '------------------------------\n' +
    'Please choose a category\n' +
    '------------------------------';

  return ctx.reply(message, keyboard);
};
