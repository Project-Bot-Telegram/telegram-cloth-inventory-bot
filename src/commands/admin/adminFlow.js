const { Markup } = require('telegraf');
const fs = require('fs');
const mongoose = require('mongoose');
const Product = require('../../models/Product');
const Category = require('../../models/Category');
const User = require('../../models/User');
const { safeAnswerCbQuery } = require('../../utils/telegramHelper');

const productSteps = [
  { key: 'name', prompt: 'សូមបញ្ចូលឈ្មោះផលិតផលថ្មីរបស់អ្នក:' },
  { key: 'category', prompt: 'សូមបញ្ចូលប្រភេទឲ្យផលិតផល:' },
  { key: 'price', prompt: 'សូមបញ្ចូលតម្លៃឲ្យផលិតផល:' },
  { key: 'quantity', prompt: 'សូមបញ្ចូលចំនួនផលិតផល:' },
  { key: 'image', prompt: 'សូមបញ្ចូលរូបភាពរបស់ផលិតផល:' }
];

const isValidImageText = (text) => {
  if (!text) {
    return false;
  }

  if (/^https?:\/\//i.test(text)) {
    return true;
  }

  if (fs.existsSync(text)) {
    return true;
  }

  return text.length >= 20;
};

const getPhotoSource = (image) => {
  if (!image) {
    return null;
  }

  if (/^https?:\/\//i.test(image)) {
    return { url: image };
  }

  if (fs.existsSync(image)) {
    return { source: image };
  }

  return image;
};

const sendCategorySelection = async (ctx) => {
  const categories = await Category.find().sort({ name: 1 });

  if (categories.length === 0) {
    return ctx.reply(
      'សូមបង្កើតប្រភេទផលិតផលជាមុនសិន។',
      Markup.inlineKeyboard([
        [Markup.button.callback('+ បន្ថែមប្រភេទផលិតផលថ្មី +', 'admin:add_category:continue')]
      ])
    );
  }

  const buttons = categories.map((category) => [
    Markup.button.callback(category.name, `admin:select_category:${category._id}`)
  ]);

  return ctx.reply(
    'សូមបញ្ចូលប្រភេទឲ្យផលិតផល:',
    Markup.inlineKeyboard(buttons)
  );
};

const sendProductStepPrompt = async (ctx, stepIndex) => {
  const step = productSteps[stepIndex];
  if (!step) {
    return false;
  }

  if (step.key === 'category') {
    return sendCategorySelection(ctx);
  }

  return ctx.reply(step.prompt);
};

const getAdminFlowUser = async (ctx) => {
  const user = await User.findOne({ telegram_id: ctx.from.id });
  if (!user || user.role !== 'admin') {
    await ctx.reply('មុខងារនេះសម្រាប់តែអ្នកគ្រប់គ្រង(admin)តែប៉ុណ្ណោះ!!');
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
    'តើអ្នកពិតជាចង់បន្ថែមផលិតផលថ្មីតើមែនទេ?',
    Markup.inlineKeyboard([
      [
        Markup.button.callback('បោះបង់', 'admin:add_product:cancel'),
        Markup.button.callback('បន្តបន្ថែម', 'admin:add_product:continue')
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
    'តើអ្នកពិតជាចង់បន្ថែមប្រភេទផលិតផលថ្មីមែនទេ?',
    Markup.inlineKeyboard([
      [
        Markup.button.callback('បោះបង់', 'admin:add_category:cancel'),
        Markup.button.callback('បន្តបន្ថែម', 'admin:add_category:continue')
      ]
    ])
  );
};

const sendProductConfirmation = async (ctx, data) => {
  const message = `សូមធ្វើការផ្ទៀងផ្ទាត់ព័ត៌មានផលិតផលថ្មីរបស់អ្នក:\n\n` +
    `ឈ្មោះ: ${data.name}\n` +
    `ប្រភេទ: ${data.category}\n` +
    `តម្លៃ: $${data.price.toFixed(2)}\n` +
    `ចំនួន: ${data.quantity}\n`;

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
    const photoSource = getPhotoSource(data.image);

    return await ctx.replyWithPhoto(photoSource, {
      caption: message,
      ...keyboard
    });
  } catch (error) {
    return ctx.reply(message, keyboard);
  }
};

const sendCategoryConfirmation = async (ctx, data) => {
  const message = `សូមធ្វើការផ្ទៀងផ្ទាត់ប្រភេទផលិតផលថ្មីរបស់អ្នក:\n\nឈ្មោះ: ${data.name}`;

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

  await sendProductStepPrompt(ctx, 0);
};

const startAddCategoryFlow = async (ctx) => {
  ctx.session = ctx.session || {};
  ctx.session.adminFlow = {
    type: 'category',
    stepIndex: 0,
    data: {}
  };

  await ctx.reply('សូមបញ្ចូលឈ្មោះប្រភេទផលិតផលថ្មីរបស់អ្នក:');
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
      return ctx.reply('ការបន្ថែមផលិតផលថ្មីរបស់អ្នកត្រូវបានបរាជ័យ!!');
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
      return ctx.reply('ការបន្ថែមប្រភេទផលិតផលថ្មីរបស់អ្នកត្រូវបានបរាជ័យ!!');
    }
  }

  if (target === 'select_category') {
    await safeAnswerCbQuery(ctx);

    if (!ctx.session || !ctx.session.adminFlow || ctx.session.adminFlow.type !== 'product') {
      return ctx.reply('មិនមានការបន្ថែមផលិតផលកំពុងរងចាំ។');
    }

    const flow = ctx.session.adminFlow;
    const step = productSteps[flow.stepIndex];
    if (!step || step.key !== 'category') {
      return ctx.reply('ការជ្រើសប្រភេទផលិតផលមិនត្រឹមត្រូវ។');
    }

    if (!mongoose.Types.ObjectId.isValid(action)) {
      return ctx.reply('ការជ្រើសប្រភេទផលិតផលមិនត្រឹមត្រូវ។');
    }

    const category = await Category.findById(action);
    if (!category) {
      return ctx.reply('រកមិនឃើញប្រភេទផលិតផល។');
    }

    flow.data.category = category.name;
    flow.data.categoryId = category._id.toString();
    flow.stepIndex += 1;
    return sendProductStepPrompt(ctx, flow.stepIndex);
  }

  if (target === 'submit_product') {
    await safeAnswerCbQuery(ctx);
    const confirmed = action === 'yes';

    if (!ctx.session || !ctx.session.adminFlow || ctx.session.adminFlow.type !== 'product') {
      return ctx.reply('មិនមានការបន្ថែមផលិតផលកំពុងរងចាំ។');
    }

    if (!confirmed) {
      ctx.session.adminFlow = null;
      return ctx.reply('ការបន្ថែមផលិតផលថ្មីរបស់អ្នកត្រូវបានបរាជ័យ!!');
    }

    const { name, category, categoryId, price, quantity, image } = ctx.session.adminFlow.data;

    const categoryDoc = categoryId && mongoose.Types.ObjectId.isValid(categoryId)
      ? await Category.findById(categoryId)
      : await Category.findOne({ name: category });
    if (!categoryDoc) {
      ctx.session.adminFlow = null;
      return ctx.reply('យើងរកមិនឃើញប្រភេទផលិតផលដែលអ្នកចង់បន្ថែមនោះទេ!! \nការបន្ថែមផលិតផលថ្មីរបស់អ្នកត្រូវបានបរាជ័យ!! \nសូមបង្កើតប្រភេទផលិតផលដែលអ្នកចង់បន្ថែមជាមិនសិន!!');
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
    return ctx.reply('បានបន្ថែមផលិតផលថ្មីដោយជោគជ័យ!!');
  }

  if (target === 'submit_category') {
    await safeAnswerCbQuery(ctx);
    const confirmed = action === 'yes';

    if (!ctx.session || !ctx.session.adminFlow || ctx.session.adminFlow.type !== 'category') {
      return ctx.reply('មិនមានការបន្ថែមប្រភេទកំពុងរងចាំ!!');
    }

    if (!confirmed) {
      ctx.session.adminFlow = null;
      return ctx.reply('ការបន្ថែមប្រភេទផលិតផលថ្មីរបស់អ្នកត្រូវបានបរាជ័យ!!');
    }

    const { name } = ctx.session.adminFlow.data;
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      ctx.session.adminFlow = null;
      return ctx.reply('ប្រភេទផលិតផលដែលអ្នកចង់បន្ថែមមានរួចហើយ!! \nការបន្ថែមប្រភេទផលិតផលថ្មីរបស់អ្នកត្រូវបានបរាជ័យ!! \nសូមបញ្ចូលឈ្មោះប្រភេទផ្សេងទៀតដែលមិនមាននៅក្នុងប្រព័ន្ធ!!');
    }

    const category = new Category({ name });
    await category.save();
    ctx.session.adminFlow = null;
    return ctx.reply('បានបន្ថែមប្រភេទផលិតផលថ្មីដោយជោគជ័យ!!');
  }

  await safeAnswerCbQuery(ctx, 'សកម្មភាពអ្នកគ្រប់គ្រងមិនត្រឹមត្រូវ!!', { show_alert: true });
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
      } else if (isValidImageText(text)) {
        flow.data.image = text;
      } else if (text) {
        return ctx.reply('សូមផ្ញើរូបថត URL រូបភាព ឬ Telegram file id ត្រឹមត្រូវ។');
      } else {
        return ctx.reply('សូមផ្ញើរូបថតផលិតផលរបស់អ្នក!!');
      }
    } else {
      if (!text) {
        return ctx.reply('សូមផ្ញើព័ត៌មានដែលបានស្នើសុំ!!');
      }

      if (step.key === 'category') {
        const category = await Category.findOne({ name: text });
        if (!category) {
          return sendCategorySelection(ctx);
        }
        flow.data.category = category.name;
        flow.data.categoryId = category._id.toString();
      } else if (step.key === 'price') {
        const parsedPrice = parseFloat(text);
        if (Number.isNaN(parsedPrice)) {
          return ctx.reply('តម្លៃមិនត្រឹមត្រូវ! សូមបញ្ចូលចំនួនលេខត្រឹមត្រូវ!!');
        }
        flow.data.price = parsedPrice;
      } else if (step.key === 'quantity') {
        const parsedQuantity = parseInt(text, 10);
        if (Number.isNaN(parsedQuantity)) {
          return ctx.reply('ចំនួនមិនត្រឹមត្រូវ! សូមបញ្ចូលចំនួនគត់ត្រឹមត្រូវ!!');
        }
        flow.data.quantity = parsedQuantity;
      } else {
        flow.data[step.key] = text;
      }
    }

    flow.stepIndex += 1;
    if (flow.stepIndex < productSteps.length) {
      return sendProductStepPrompt(ctx, flow.stepIndex);
    }

    return sendProductConfirmation(ctx, flow.data);
  }

  if (flow.type === 'category') {
    if (!text) {
      return ctx.reply('សូមផ្ញើឈ្មោះប្រភេទផលិតផល!!');
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
