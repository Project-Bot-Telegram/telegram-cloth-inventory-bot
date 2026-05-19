const { Markup } = require('telegraf');
const Category = require('../../models/Category');
const Product = require('../../models/Product');

module.exports = async (ctx) => {
  const categories = await Category.find();

  if (categories.length === 0) {
    return ctx.reply('No categories available.');
  }

  const buttons = [];

  for (const category of categories) {
    const count = await Product.countDocuments({ category_id: category._id });
    const label = `${category.name} (${count})`;
    buttons.push([Markup.button.callback(label, `category_show:${category._id}`)]);
  }

  const keyboard = Markup.inlineKeyboard(buttons);
  return ctx.reply('Please choose a category:', keyboard);
};
