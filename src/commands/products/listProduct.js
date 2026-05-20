const Product = require('../../models/Product');

module.exports = async (ctx) => {
  const products = await Product.find()
    .populate('category_id');

  if (products.length === 0) {
    return ctx.reply('No products');
  }

  let message = 'Products:\n\n';

  products.forEach((product) => {
    const categoryName = product.category_id
      ? product.category_id.name
      : 'Uncategorized';
    const price = typeof product.price === 'number' ? product.price.toFixed(2) : '0.00';
    const quantity = typeof product.quantity === 'number' ? product.quantity : 0;

    let status = 'Out of stock';
    if (quantity === 0) status = 'Out of stock';
    else if (quantity > 5) status = 'In stock';
    else if (quantity > 0 && quantity < 5) status = 'Low stock';

    const displayId = product.product_id || String(product._id);
    const imageLine = product.image ? `\nImage: ${product.image}` : '';

    message += `\nID: ${displayId}\nName: ${product.name}\nCategory: ${categoryName}\nPrice: $${price}\nQuantity: ${quantity}\nStatus: ${status}${imageLine}\n\n`;
  });

  ctx.reply(message);
};