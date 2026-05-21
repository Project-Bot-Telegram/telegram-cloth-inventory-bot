const { Markup } = require('telegraf');
const mongoose = require('mongoose');
const Product = require('../../models/Product');
const Category = require('../../models/Category');
const User = require('../../models/User');
const { safeAnswerCbQuery } = require('../../utils/telegramHelper');

const productSteps = [
  { key: 'name', prompt: 'Send the product name.' },
  { key: 'category', prompt: 'Send the product category.' },
  { key: 'price', prompt: 'Send the product price.' },
  { key: 'quantity', prompt: 'Send the product quantity.' },
  { key: 'image', prompt: 'Send the product photo or image URL.' }
];

const getAdminFlowUser = async (ctx) => {
  const user = await User.findOne({ telegram_id: ctx.from.id });
  if (!user || user.role !== 'admin') {
    await ctx.reply('Admin only command');
    return null;
  }
  return user;
};

const startAddProductConfirm = async (ctx) => {
  const user = await getAdminFlowUser(ctx);
  if (!user) return;

  ctx.session = ctx.session || {};
  ctx.session.adminFlow = {
    type: 'product',
    stepIndex: -1,
    data: {}
  };

  return ctx.reply(
    'Do you want to add a new product?',
    Markup.inlineKeyboard([
      [
        Markup.button.callback('Cancel', 'admin:add_product:cancel'),
        Markup.button.callback('Continue add', 'admin:add_product:continue')
      ]
    ])
  );
};

const startAddCategoryConfirm = async (ctx) => {
  const user = await getAdminFlowUser(ctx);
  if (!user) return;

  ctx.session = ctx.session || {};
  ctx.session.adminFlow = {
    type: 'category',
    stepIndex: -1,
    data: {}
  };

  return ctx.reply(
    'Do you want to add a new category?',
    Markup.inlineKeyboard([
      [
        Markup.button.callback('Cancel', 'admin:add_category:cancel'),
        Markup.button.callback('Continue add', 'admin:add_category:continue')
      ]
    ])
  );
};

const sendProductConfirmation = async (ctx, data) => {
  const message = `Please confirm the new product information:\n\n` +
    `Name: ${data.name}\n` +
    `Category: ${data.category}\n` +
    `Price: $${data.price.toFixed(2)}\n` +
    `Quantity: ${data.quantity}\n` +
    `Image: ${data.image || 'None'}`;

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('Cancel', 'admin:submit_product:no'),
      Markup.button.callback('Confirm', 'admin:submit_product:yes')
    ]
  ]);

  if (!data.image) {
    return ctx.reply(message, keyboard);
  }

  try {
    const photoSource = data.image.startsWith('http')
      ? { url: data.image }
      : data.image;

    return ctx.replyWithPhoto(photoSource, {
      caption: message,
      ...keyboard
    });
  } catch (error) {
    return ctx.reply(message, keyboard);
  }
};

const sendCategoryConfirmation = async (ctx, data) => {
  const message = `Please confirm the new category:\n\nName: ${data.name}`;

  return ctx.reply(
    message,
    Markup.inlineKeyboard([
      [
        Markup.button.callback('Cancel', 'admin:submit_category:no'),
        Markup.button.callback('Confirm', 'admin:submit_category:yes')
      ]
    ])
  );
};

const startAddProductFlow = async (ctx) => {
  ctx.session = ctx.session || {};
  ctx.session.adminFlow = {
    type: 'product',
    stepIndex: 0,
    data: {}
  };

  await ctx.reply('Send the product name.');
};

const startAddCategoryFlow = async (ctx) => {
  ctx.session = ctx.session || {};
  ctx.session.adminFlow = {
    type: 'category',
    stepIndex: 0,
    data: {}
  };

  await ctx.reply('Send the category name.');
};

const handleCallback = async (ctx) => {
  const callbackQuery = ctx.callbackQuery;
  if (!callbackQuery || !callbackQuery.data) return;

  const user = await getAdminFlowUser(ctx);
  if (!user) return;

  const parts = callbackQuery.data.split(':');
  const target = parts[1];
  const action = parts[2];

  if (target === 'add_product') {
    await safeAnswerCbQuery(ctx);
    if (action === 'continue') {
      return startAddProductFlow(ctx);
    }

    if (action === 'cancel') {
      ctx.session = ctx.session || {};
      ctx.session.adminFlow = null;
      return ctx.reply('Add product canceled.');
    }
  }

  if (target === 'add_category') {
    await safeAnswerCbQuery(ctx);
    if (action === 'continue') {
      return startAddCategoryFlow(ctx);
    }

    if (action === 'cancel') {
      ctx.session = ctx.session || {};
      ctx.session.adminFlow = null;
      return ctx.reply('Add category canceled.');
    }
  }

  if (target === 'submit_product') {
    await safeAnswerCbQuery(ctx);
    const confirmed = action === 'yes';

    if (!ctx.session || !ctx.session.adminFlow || ctx.session.adminFlow.type !== 'product') {
      return ctx.reply('No pending product addition was found.');
    }

    if (!confirmed) {
      ctx.session.adminFlow = null;
      return ctx.reply('Add product canceled.');
    }

    const { name, category, price, quantity, image } = ctx.session.adminFlow.data;

    const categoryDoc = await Category.findOne({ name: category });
    if (!categoryDoc) {
      ctx.session.adminFlow = null;
      return ctx.reply('Category not found. Product was not added. Please create the category first.');
    }

    const product = new Product({
      name,
      category_id: categoryDoc._id,
      price,
      quantity,
      image
    });

    const counters = mongoose.connection.collection('counters');
    await counters.updateOne(
      { _id: 'productid' },
      { $inc: { seq: 1 } },
      { upsert: true }
    );

    const seqDoc = await counters.findOne({ _id: 'productid' });
    const seq = seqDoc && typeof seqDoc.seq === 'number' ? seqDoc.seq : 1;
    product.product_id = String(seq).padStart(4, '0');

    await product.save();
    ctx.session.adminFlow = null;
    return ctx.reply('Product added successfully.');
  }

  if (target === 'submit_category') {
    await safeAnswerCbQuery(ctx);
    const confirmed = action === 'yes';

    if (!ctx.session || !ctx.session.adminFlow || ctx.session.adminFlow.type !== 'category') {
      return ctx.reply('No pending category addition was found.');
    }

    if (!confirmed) {
      ctx.session.adminFlow = null;
      return ctx.reply('Add category canceled.');
    }

    const { name } = ctx.session.adminFlow.data;
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      ctx.session.adminFlow = null;
      return ctx.reply('Category already exists.');
    }

    const category = new Category({ name });
    await category.save();
    ctx.session.adminFlow = null;
    return ctx.reply('Category added successfully.');
  }

  await safeAnswerCbQuery(ctx, 'Invalid admin action.', { show_alert: true });
};

const handleMessage = async (ctx) => {
  if (!ctx.session || !ctx.session.adminFlow) {
    return false;
  }

  const flow = ctx.session.adminFlow;
  const text = ctx.message && ctx.message.text ? ctx.message.text.trim() : '';

  if (flow.type === 'product') {
    const step = productSteps[flow.stepIndex];
    if (!step) {
      ctx.session.adminFlow = null;
      return false;
    }

    if (step.key === 'image') {
      if (ctx.message.photo && ctx.message.photo.length > 0) {
        flow.data.image = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      } else if (text) {
        flow.data.image = text;
      } else {
        return ctx.reply('Please send a photo or enter an image URL.');
      }
    } else {
      if (!text) {
        return ctx.reply('Please send the requested information.');
      }

      if (step.key === 'price') {
        const parsedPrice = parseFloat(text);
        if (Number.isNaN(parsedPrice)) {
          return ctx.reply('Invalid price. Please send a valid number.');
        }
        flow.data.price = parsedPrice;
      } else if (step.key === 'quantity') {
        const parsedQuantity = parseInt(text, 10);
        if (Number.isNaN(parsedQuantity)) {
          return ctx.reply('Invalid quantity. Please send a valid integer.');
        }
        flow.data.quantity = parsedQuantity;
      } else {
        flow.data[step.key] = text;
      }
    }

    flow.stepIndex += 1;
    if (flow.stepIndex < productSteps.length) {
      return ctx.reply(productSteps[flow.stepIndex].prompt);
    }

    return sendProductConfirmation(ctx, flow.data);
  }

  if (flow.type === 'category') {
    if (!text) {
      return ctx.reply('Please send the category name.');
    }

    flow.data.name = text;
    return sendCategoryConfirmation(ctx, flow.data);
  }

  return false;
};

module.exports = {
  startAddProductConfirm,
  startAddCategoryConfirm,
  handleCallback,
  handleMessage
};
