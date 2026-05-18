const Category = require('../../models/Category');

module.exports = async (ctx) => {
  const text = ctx.message.text.split(' ');

  const name = text[1];

  if (!name) {
    return ctx.reply(
      'Usage: /addcategory category_name'
    );
  }

  const existingCategory =
    await Category.findOne({ name });

  if (existingCategory) {
    return ctx.reply('Category already exists');
  }

  const category = new Category({
    name
  });

  await category.save();

  ctx.reply('Category added');
};