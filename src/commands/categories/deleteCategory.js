const Category = require('../../models/Category');
const Product = require('../../models/Product');

module.exports = async (ctx) => {
  const text = (ctx.message && ctx.message.text) ? ctx.message.text.trim() : '';
  const name = text.split(' ').slice(1).join(' ');

  if (!name) {
    return ctx.reply('Usage: /deletecategory categoryName');
  }

  const category = await Category.findOne({ name });
  if (!category) {
    return ctx.reply('Category not found');
  }

  const product = await Product.findOne({ category_id: category._id });
  if (product) {
    return ctx.reply('Cannot delete category while products are assigned to it');
  }

  await category.deleteOne();
  ctx.reply('Category deleted');
};
