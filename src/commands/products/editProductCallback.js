const { Markup } = require('telegraf');
const { safeAnswerCbQuery } = require('../../utils/telegramHelper');
const User = require('../../models/User');
const Product = require('../../models/Product');
const Category = require('../../models/Category');

module.exports = async (ctx) => {
  const callbackQuery = ctx.callbackQuery;
  if (!callbackQuery || !callbackQuery.data) {
    return;
  }

  const parts = callbackQuery.data.split(':');
  const type = parts[0];
  const action = parts[1];
  const productId = parts[2];

  const user = await User.findOne({ telegram_id: ctx.from.id });
  if (!user) {
    await safeAnswerCbQuery(ctx, 'Please register first by sending /start.', { show_alert: true });
    return;
  }

  if (user.role !== 'admin') {
    await safeAnswerCbQuery(ctx, 'Admin only action.', { show_alert: true });
    return;
  }

  if (type !== 'edit_product' && type !== 'confirm_update') {
    return;
  }

  if (type === 'edit_product' && action === 'start') {
    const product = await Product.findById(productId).populate('category_id');
    if (!product) {
      await safeAnswerCbQuery(ctx, 'Product not found.', { show_alert: true });
      return;
    }

    const categoryName = product.category_id ? product.category_id.name : 'Uncategorized';
    await safeAnswerCbQuery(ctx);
    return ctx.reply(
      `You are about to edit this product:\n\n` +
      `Name: ${product.name}\n` +
      `Category: ${categoryName}\n` +
      `Price: $${product.price?.toFixed(2) ?? '0.00'}\n` +
      `Quantity: ${product.quantity ?? 0}\n` +
      `Image: ${product.image || 'None'}\n\n` +
      `Do you want to continue?`,
      Markup.inlineKeyboard([
        [Markup.button.callback('Cancel', 'edit_product:cancel'), Markup.button.callback('Continue', `edit_product:continue:${product._id}`)]
      ])
    );
  }

  if (type === 'edit_product' && action === 'cancel') {
    await safeAnswerCbQuery(ctx);
    if (ctx.session) {
      ctx.session.editProduct = null;
    }
    return ctx.reply('Product update canceled.');
  }

  if (type === 'edit_product' && action === 'continue') {
    const product = await Product.findById(productId).populate('category_id');
    if (!product) {
      await safeAnswerCbQuery(ctx, 'Product not found.', { show_alert: true });
      return;
    }

    ctx.session = ctx.session || {};
    ctx.session.editProduct = {
      stepIndex: 0,
      productId: product._id.toString(),
      data: {},
      originalData: {
        name: product.name || '',
        category: product.category_id ? product.category_id.name : '',
        price: product.price ?? 0,
        quantity: product.quantity ?? 0,
        image: product.image || ''
      }
    };

    await safeAnswerCbQuery(ctx);
    return ctx.reply('Send the new product name.', Markup.inlineKeyboard([
      [Markup.button.callback('Skip to keep old name', 'edit_product:skip_name')]
    ]));
  }

  if (type === 'edit_product' && action === 'skip_name') {
    if (!ctx.session || !ctx.session.editProduct) {
      await safeAnswerCbQuery(ctx, 'No active edit session found.', { show_alert: true });
      return;
    }

    ctx.session.editProduct.data.name = ctx.session.editProduct.originalData.name;
    ctx.session.editProduct.stepIndex = 1;
    await safeAnswerCbQuery(ctx);
    return ctx.reply('Send the new category name.', Markup.inlineKeyboard([
      [Markup.button.callback('Skip to keep old category', 'edit_product:skip_category')]
    ]));
  }

  if (type === 'edit_product' && action === 'skip_category') {
    if (!ctx.session || !ctx.session.editProduct) {
      await safeAnswerCbQuery(ctx, 'No active edit session found.', { show_alert: true });
      return;
    }

    ctx.session.editProduct.data.category = ctx.session.editProduct.originalData.category;
    ctx.session.editProduct.stepIndex = 2;
    await safeAnswerCbQuery(ctx);
    return ctx.reply('Send the new price.', Markup.inlineKeyboard([
      [Markup.button.callback('Skip to keep old price', 'edit_product:skip_price')]
    ]));
  }

  if (type === 'edit_product' && action === 'skip_price') {
    if (!ctx.session || !ctx.session.editProduct) {
      await safeAnswerCbQuery(ctx, 'No active edit session found.', { show_alert: true });
      return;
    }

    ctx.session.editProduct.data.price = ctx.session.editProduct.originalData.price;
    ctx.session.editProduct.stepIndex = 3;
    await safeAnswerCbQuery(ctx);
    return ctx.reply('Send the new quantity.', Markup.inlineKeyboard([
      [Markup.button.callback('Skip to keep old quantity', 'edit_product:skip_quantity')]
    ]));
  }

  if (type === 'edit_product' && action === 'skip_quantity') {
    if (!ctx.session || !ctx.session.editProduct) {
      await safeAnswerCbQuery(ctx, 'No active edit session found.', { show_alert: true });
      return;
    }

    ctx.session.editProduct.data.quantity = ctx.session.editProduct.originalData.quantity;
    ctx.session.editProduct.stepIndex = 4;
    await safeAnswerCbQuery(ctx);
    return ctx.reply('Send the new image URL or send a photo directly.', Markup.inlineKeyboard([
      [Markup.button.callback('Skip to keep old image', 'edit_product:skip_image')]
    ]));
  }

  if (type === 'edit_product' && action === 'skip_image') {
    if (!ctx.session || !ctx.session.editProduct) {
      await safeAnswerCbQuery(ctx, 'No active edit session found.', { show_alert: true });
      return;
    }

    ctx.session.editProduct.data.image = ctx.session.editProduct.originalData.image;
    ctx.session.editProduct.stepIndex = 5;
    await safeAnswerCbQuery(ctx);

    const message = `Please confirm the updated product information:\n\n` +
      `Name: ${ctx.session.editProduct.data.name}\n` +
      `Category: ${ctx.session.editProduct.data.category}\n` +
      `Price: $${ctx.session.editProduct.data.price}\n` +
      `Quantity: ${ctx.session.editProduct.data.quantity}\n` +
      `Image: ${ctx.session.editProduct.data.image || 'None'}`;

    return ctx.reply(message, Markup.inlineKeyboard([
      [Markup.button.callback('Cancel', 'confirm_update:no'), Markup.button.callback('Update', 'confirm_update:yes')]
    ]));
  }

  if (type === 'confirm_update') {
    const confirmed = action === 'yes';
    await safeAnswerCbQuery(ctx);

    if (!ctx.session || !ctx.session.editProduct) {
      return ctx.reply('No pending product changes were found.');
    }

    if (!confirmed) {
      ctx.session.editProduct = null;
      return ctx.reply('Product update canceled.');
    }

    const editSession = ctx.session.editProduct;
    const category = await Category.findOne({ name: editSession.data.category });
    if (!category) {
      ctx.session.editProduct = null;
      return ctx.reply('Unable to update product: category not found. Please run edit again with a valid category.');
    }

    await Product.updateOne({ _id: editSession.productId }, {
      $set: {
        name: editSession.data.name,
        category_id: category._id,
        price: editSession.data.price,
        quantity: editSession.data.quantity,
        image: editSession.data.image
      }
    });

    ctx.session.editProduct = null;
    return ctx.reply('Product update successful.');
  }

  await safeAnswerCbQuery(ctx, 'Invalid product action.', { show_alert: true });
};