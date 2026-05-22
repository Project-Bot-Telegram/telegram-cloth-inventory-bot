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
    await safeAnswerCbQuery(ctx, 'សូមធ្វើការចុះឈ្មោះជាមុនដោយប្រើ command /start.', { show_alert: true });
    return;
  }

  if (user.role !== 'admin') {
    await safeAnswerCbQuery(ctx, 'មុខងារនេះសម្រាប់អ្នកគ្រប់គ្រង(admin)ប៉ុណ្ណោះ!!.', { show_alert: true });
    return;
  }

  if (type !== 'edit_product' && type !== 'confirm_update') {
    return;
  }

  if (type === 'edit_product' && action === 'start') {
    const product = await Product.findById(productId).populate('category_id');
    if (!product) {
      await safeAnswerCbQuery(ctx, 'រកមិនឃើញផលិតផល។', { show_alert: true });
      return;
    }

    const categoryName = product.category_id ? product.category_id.name : 'មិនមានប្រភេទ';
    await safeAnswerCbQuery(ctx);
    const caption =
      `នេះគឺជាទិន្នន័យរបស់ផលិតផលដែលអ្នកចង់កែប្រែ:\n\n` +
      `ឈ្មោះផលិតផល : ${product.name}\n` +
      `ប្រភេទផលិតផល : ${categoryName}\n` +
      `តម្លៃ : $${product.price?.toFixed(2) ?? '0.00'}\n` +
      `ចំនួនដាក់លក់​ : ${product.quantity ?? 0}\n` +
      `តើអ្នកចង់បន្តការកែប្រែដែររឺទេ?`;

    const buttons = Markup.inlineKeyboard([
      [Markup.button.callback('cancel', 'edit_product:cancel'), Markup.button.callback('continue', `edit_product:continue:${product._id}`)]
    ]);

    if (product.image) {
      try {
        return ctx.replyWithPhoto(product.image, { caption, reply_markup: buttons.reply_markup });
      } catch (e) {
        // fallback to text reply if photo fails
        return ctx.reply(caption, buttons);
      }
    }

    return ctx.reply(caption, buttons);
  }

  if (type === 'edit_product' && action === 'cancel') {
    await safeAnswerCbQuery(ctx);
    if (ctx.session) {
      ctx.session.editProduct = null;
    }
    return ctx.reply('ការអាប់ដេតផលិតផលត្រូវបានបោះបង់!!');
  }

  if (type === 'edit_product' && action === 'continue') {
    const product = await Product.findById(productId).populate('category_id');
    if (!product) {
      await safeAnswerCbQuery(ctx, 'រកមិនឃើញផលិតផល។', { show_alert: true });
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
    return ctx.reply('សូមបញ្ចូលឈ្មោះថ្មីរបស់ផលិតផល:', Markup.inlineKeyboard([
      [Markup.button.callback('skip ដើម្បីរក្សាការប្រើឈ្មោះចាស់', 'edit_product:skip_name')]
    ]));
  }

  if (type === 'edit_product' && action === 'skip_name') {
    if (!ctx.session || !ctx.session.editProduct) {
      await safeAnswerCbQuery(ctx, 'រកមិនឃើញសម័ព្ន្ធកម្មកែប្រែដែលសកម្ម។', { show_alert: true });
      return;
    }

    ctx.session.editProduct.data.name = ctx.session.editProduct.originalData.name;
    ctx.session.editProduct.stepIndex = 1;
    await safeAnswerCbQuery(ctx);
    return ctx.reply('សូមបញ្ចូលឈ្មោះថ្មីរបស់ប្រភេទផលិតផល:', Markup.inlineKeyboard([
      [Markup.button.callback('skip ដើម្បីរក្សាការប្រើប្រភេទចាស់', 'edit_product:skip_category')]
    ]));
  }

  if (type === 'edit_product' && action === 'skip_category') {
    if (!ctx.session || !ctx.session.editProduct) {
      await safeAnswerCbQuery(ctx, 'រកមិនឃើញសម័ព្ន្ធកម្មកែប្រែដែលសកម្ម។', { show_alert: true });
      return;
    }

    ctx.session.editProduct.data.category = ctx.session.editProduct.originalData.category;
    ctx.session.editProduct.stepIndex = 2;
    await safeAnswerCbQuery(ctx);
    return ctx.reply('សូមបញ្ចូលតម្លៃថ្មីរបស់ផលិតផល:', Markup.inlineKeyboard([
      [Markup.button.callback('skip ដើម្បីរក្សាតម្លៃចាស់', 'edit_product:skip_price')]
    ]));
  }

  if (type === 'edit_product' && action === 'skip_price') {
    if (!ctx.session || !ctx.session.editProduct) {
      await safeAnswerCbQuery(ctx, 'រកមិនឃើញសម័ព្ន្ធកម្មកែប្រែដែលសកម្ម។', { show_alert: true });
      return;
    }

    ctx.session.editProduct.data.price = ctx.session.editProduct.originalData.price;
    ctx.session.editProduct.stepIndex = 3;
    await safeAnswerCbQuery(ctx);
    return ctx.reply('សូមបញ្ចូលបរិមាណថ្មីរបស់ផលិតផល:', Markup.inlineKeyboard([
      [Markup.button.callback('skip ដើម្បីរក្សាបរិមាណចាស់', 'edit_product:skip_quantity')]
    ]));
  }

  if (type === 'edit_product' && action === 'skip_quantity') {
    if (!ctx.session || !ctx.session.editProduct) {
      await safeAnswerCbQuery(ctx, 'មិនមានសម័ព្ន្ធកម្មកែប្រែដែលសកម្ម។', { show_alert: true });
      return;
    }

    ctx.session.editProduct.data.quantity = ctx.session.editProduct.originalData.quantity;
    ctx.session.editProduct.stepIndex = 4;
    await safeAnswerCbQuery(ctx);
    return ctx.reply('សូមបញ្ចូលរូបភាពថ្មីរបស់ផលិតផល:', Markup.inlineKeyboard([
      [Markup.button.callback('skip ដើម្បីរក្សារូបភាពចាស់', 'edit_product:skip_image')]
    ]));
  }

  if (type === 'edit_product' && action === 'skip_image') {
    if (!ctx.session || !ctx.session.editProduct) {
      await safeAnswerCbQuery(ctx, 'មិនមានសម័ព្ន្ធកម្មកែប្រែដែលសកម្ម។', { show_alert: true });
      return;
    }

    ctx.session.editProduct.data.image = ctx.session.editProduct.originalData.image;
    ctx.session.editProduct.stepIndex = 5;
    await safeAnswerCbQuery(ctx);

    const message = `សូមបញ្ជាក់ព័ត៌មានផលិតផលដែលបានកែប្រែ:\n\n` +
      `ឈ្មោះផលិតផល: ${ctx.session.editProduct.data.name}\n` +
      `ប្រភេទផលិតផល: ${ctx.session.editProduct.data.category}\n` +
      `តម្លៃ: $${ctx.session.editProduct.data.price}\n` +
      `ចំនួនដាក់លក់: ${ctx.session.editProduct.data.quantity}\n\n`; +
      `សូមធ្វើការផ្ទៀងផ្ទាត់ព័ត៌មានថ្មីរបស់អ្នក មុនពេលធ្វើការ update ទិន្នន័យផលិតផល។`;

    const buttons = Markup.inlineKeyboard([
      [Markup.button.callback('cancel', 'confirm_update:no'), Markup.button.callback('update', 'confirm_update:yes')]
    ]);

    // Try to send with photo if image exists
    try {
      const fs = require('fs');
      const path = require('path');
      const img = ctx.session.editProduct.data.image;
      if (img) {
        // Check if it's a local file
        const localPath = path.isAbsolute(img) || img.startsWith(process.cwd()) ? img : path.join(process.cwd(), img);
        if (fs.existsSync(img) || fs.existsSync(localPath)) {
          const sourcePath = fs.existsSync(img) ? img : localPath;
          return ctx.replyWithPhoto({ source: sourcePath }, { caption: message, reply_markup: buttons.reply_markup });
        }
        // If image looks like a URL, try sending by URL
        if (typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))) {
          return ctx.replyWithPhoto(img, { caption: message, reply_markup: buttons.reply_markup });
        }
      }
    } catch (err) {
      console.error('Failed to send confirmation photo:', err);
    }

    return ctx.reply(message, buttons);
  }

  if (type === 'confirm_update') {
    const confirmed = action === 'yes';
    await safeAnswerCbQuery(ctx);

    if (!ctx.session || !ctx.session.editProduct) {
      return ctx.reply('មិនមានការផ្លាស់ប្តូរផលិតផលរងចាំទេ។');
    }

    if (!confirmed) {
      ctx.session.editProduct = null;
      return ctx.reply('ការអាប់ដេតផលិតផលត្រូវបានបោះបង់!!');
    }

    const editSession = ctx.session.editProduct;
    const category = await Category.findOne({ name: editSession.data.category });
    if (!category) {
      ctx.session.editProduct = null;
      return ctx.reply('មិនអាចធ្វើការ​ update ផលិតផលបានទេ!! \nព្រោះប្រភេទភលិតផលដែលបានបញ្ចូលមិនត្រឹមត្រូវ!! \nសូមធ្វើការកែប្រែម្ដងទៀតជាមួយប្រភេទផលិតផលដែលត្រឹមត្រូវ!!');
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
    return ctx.reply('ធ្វើបច្ចុប្បន្នភាពផលិតផលបានដោយជោគជ័យ។');
  }
  await safeAnswerCbQuery(ctx, 'សកម្មភាពផលិតផលមិនត្រឹមត្រូវ!!', { show_alert: true });
};