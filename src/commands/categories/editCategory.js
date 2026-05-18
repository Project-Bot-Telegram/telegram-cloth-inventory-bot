const Category = require('../../models/Category');

module.exports = async (ctx) => {
  const text = (ctx.message && ctx.message.text) ? ctx.message.text.trim() : '';
  const parts = text.split(' ').filter(Boolean);

  const existingName = parts[1];
  const newName = parts.slice(2).join(' ');

  if (!existingName || !newName) {
    return ctx.reply('Usage: /editcategory existingName newName');
  }

  const category = await Category.findOne({ name: existingName });
  if (!category) {
    return ctx.reply('Category not found');
  }

  const duplicate = await Category.findOne({ name: newName });
  if (duplicate) {
    return ctx.reply('A category with that name already exists');
  }

  category.name = newName;
  await category.save();

  ctx.reply('Category updated');
};
