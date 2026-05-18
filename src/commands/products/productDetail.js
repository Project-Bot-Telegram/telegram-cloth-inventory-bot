const Product = require('../../models/Product');

module.exports = async (ctx) => {
  const text = ctx.message.text.split(' ');

  const productName = text[1];

  const product = await Product.findOne({
    name: productName
  }).populate('category_id');

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

  ctx.reply(`\nProduct Detail\n\nID: ${displayId}\nName: ${product.name}\nCategory: ${categoryName}\nPrice: $${price}\nQuantity: ${quantity}\nStatus: ${status}\nDescription: ${description}\n  `);
};