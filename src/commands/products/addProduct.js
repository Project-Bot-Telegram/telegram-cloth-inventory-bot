const mongoose = require('mongoose');
const Product = require('../../models/Product');
const Category = require('../../models/Category');

module.exports = async (ctx) => {
  const text = ctx.message.text.split(' ');

  const name = text[1];
  const categoryName = text[2];
  const price = parseFloat(text[3]);

  let quantity = 0;
  let image;
  if (text[4]) {
    const parsedQty = parseInt(text[4], 10);
    if (!isNaN(parsedQty) && String(parsedQty) === text[4]) {
      quantity = parsedQty;
      image = text[5];
    } else {
      image = text[4];
    }
  }

  if (!name || !categoryName || isNaN(price)) {
    return ctx.reply(
      'Usage: /addproduct name category price [quantity] [imageUrl]'
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
    quantity,
    image
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