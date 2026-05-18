const Category = require('../../models/Category');

module.exports = async (ctx) => {
  const categories = await Category.find();

  if (categories.length === 0) {
    return ctx.reply('No categories');
  }

  let message = 'Categories:\n\n';

  categories.forEach((category) => {
    message += `- ${category.name}\n`;
  });

  ctx.reply(message);
};