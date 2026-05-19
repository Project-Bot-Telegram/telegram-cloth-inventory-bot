const mongoose = require('mongoose');
const Category = require('../../models/Category');
const Product = require('../../models/Product');

module.exports = async (ctx) => {
  const callbackQuery = ctx.callbackQuery;
  if (!callbackQuery || !callbackQuery.data || !callbackQuery.data.startsWith('category_show:')) {
    return;
  }

  const categoryId = callbackQuery.data.split(':')[1];
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    await ctx.answerCbQuery('Invalid category selection.', { show_alert: true });
    return;
  }

  const category = await Category.findById(categoryId);
  if (!category) {
    await ctx.answerCbQuery('Category not found.', { show_alert: true });
    return;
  }

  const products = await Product.find({ category_id: category._id })
    .populate('category_id');

  await ctx.answerCbQuery();

  if (products.length === 0) {
    return ctx.reply(`No products found in ${category.name}.`);
  }

  let message = `Products in ${category.name}:\n\n`;

  products.forEach((product) => {
    const categoryName = product.category_id
      ? product.category_id.name
      : 'Uncategorized';
    const price = typeof product.price === 'number' ? product.price.toFixed(2) : '0.00';
    const quantity = typeof product.quantity === 'number' ? product.quantity : 0;

    let status = 'Out of stock';
    if (quantity > 5) status = 'In stock';
    else if (quantity > 0) status = 'Low stock';

    const displayId = product.product_id || String(product._id);
    message += `ID: ${displayId}\nName: ${product.name}\nCategory: ${categoryName}\nPrice: $${price}\nQuantity: ${quantity}\nStatus: ${status}\n\n`;
  });

  return ctx.reply(message);
};
