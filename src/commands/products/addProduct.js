const mongoose = require('mongoose');
const Product = require('../../models/Product');
const Category = require('../../models/Category');

module.exports = async (ctx) => {
  const text = ctx.message.text.split(' ');

  const name = text[1];
  const categoryName = text[2];
  const price = parseFloat(text[3]);
  const quantity = text[4] ? parseInt(text[4], 10) : 0;

  if (!name || !categoryName || isNaN(price)) {
    return ctx.reply(
      'Usage: /addproduct name category price'
    );
  }

  const category =
    await Category.findOne({
      name: categoryName
    });

  if (!category) {
    return ctx.reply('Category not found');
  }

  const product = new Product({
    name,
    category_id: category._id,
    price,
    quantity
  });

  // Generate sequential human-friendly product_id like 0001
  const counters = mongoose.connection.collection('counters');

  // Robust approach: increment then read the counter (works across driver versions)
  await counters.updateOne(
    { _id: 'productid' },
    { $inc: { seq: 1 } },
    { upsert: true }
  );

  const seqDoc = await counters.findOne({ _id: 'productid' });
  const seq = seqDoc && typeof seqDoc.seq === 'number' ? seqDoc.seq : 1;
  product.product_id = String(seq).padStart(4, '0');

  await product.save();

  ctx.reply('Product added');
};