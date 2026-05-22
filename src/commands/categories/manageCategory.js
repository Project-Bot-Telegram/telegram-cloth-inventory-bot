const { Markup } = require('telegraf');
const mongoose = require('mongoose');
const Category = require('../../models/Category');
const Product = require('../../models/Product');
const { safeAnswerCbQuery } = require('../../utils/telegramHelper');

const listCategories = async (ctx) => {
  const categories = await Category.find();

  if (categories.length === 0) {
    return ctx.reply('No categories available.');
  }

  const buttons = [
    [Markup.button.callback('+ បន្ថែមប្រភេទផលិតផលថ្មី +', 'admin:add_category:continue')],
    ...categories.map((category) => [
      Markup.button.callback(category.name, `category_info:${category._id}`)
    ])
  ];

  return ctx.reply(
    'ជ្រើសរើសប្រភេទដើម្បីគ្រប់គ្រង:',
    Markup.inlineKeyboard(buttons)
  );
};

const handleCallback = async (ctx) => {
  const callbackQuery = ctx.callbackQuery;
  if (!callbackQuery || !callbackQuery.data) {
    return;
  }

  const parts = callbackQuery.data.split(':');
  const action = parts[0];
  const subAction = parts[1];
  const categoryId = parts[2];

  // Handle confirmation callbacks
  if (action === 'category_confirm_edit') {
    if (!ctx.session || !ctx.session.categoryEdit) {
      await safeAnswerCbQuery(ctx, 'Session expired.', { show_alert: true });
      return;
    }

    await safeAnswerCbQuery(ctx);

    if (subAction === 'no') {
      ctx.session.categoryEdit = null;
      return ctx.reply('ការកែប្រែប្រភេទផលិតផលត្រូវបានបោះបង់!!');
    }

    if (subAction === 'yes') {
      const { categoryId: catId, currentName, proposedName } = ctx.session.categoryEdit;
      const category = await Category.findById(catId);
      if (!category) {
        ctx.session.categoryEdit = null;
        return ctx.reply('Category not found.');
      }

      category.name = proposedName;
      if (!category.edit_history) {
        category.edit_history = [];
      }
      category.edit_history.push({
        old_name: currentName,
        new_name: proposedName,
        edited_at: new Date()
      });
      await category.save();
      ctx.session.categoryEdit = null;
      return ctx.reply('ប្រភេទផលិតផលត្រូវបាន​ update បានដោយជោគជ័យ!!');
    }

    return;
  }

  // Handle cancel button
  if (action === 'category_edit' && subAction === 'cancel') {
    await safeAnswerCbQuery(ctx);
    ctx.session.categoryEdit = null;
    return ctx.reply('ការកែប្រែប្រភេទផលិតផលត្រូវបានបោះបង់!!');
  }

  // For other callbacks, subAction should be a valid MongoDB ID
  if (!mongoose.Types.ObjectId.isValid(subAction)) {
    await safeAnswerCbQuery(ctx, 'Invalid category selected.', { show_alert: true });
    return;
  }

  const category = await Category.findById(subAction);
  if (!category) {
    await safeAnswerCbQuery(ctx, 'Category not found.', { show_alert: true });
    return;
  }

  await safeAnswerCbQuery(ctx);

  if (action === 'category_info') {
    const totalProducts = await Product.countDocuments({ category_id: category._id });
    const message = '' +
      '------------------------------\n' +
      'ព័ត៌មានប្រភេទផលិតផល\n' +
      '------------------------------\n' +
      `ឈ្មោះ: ${category.name}\n` +
      `ផលិតផល: ${totalProducts}\n` +
      '------------------------------';

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('History', `category_history_edit:${category._id}`),
        Markup.button.callback('Edit', `category_edit:${category._id}`),
        Markup.button.callback('Delete', `category_delete:${category._id}`)
      ]
    ]);

    return ctx.reply(message, keyboard);
  }

  if (action === 'category_history_edit') {
    let message = '' +
      '------------------------------\n' +
      'ប្រវត្តិប្រភេទផលិតផល\n' +
      '------------------------------\n' +
      `ប្រភេទ: ${category.name}\n` +
      '------------------------------\n';

    if (!category.edit_history || category.edit_history.length === 0) {
      message += 'មិនមានប្រវត្តិការកែប្រែប្រភេទផលិតផលទេ។\n';
    } else {
      const sortedHistory = [...category.edit_history].sort((a, b) => new Date(b.edited_at) - new Date(a.edited_at));
      sortedHistory.forEach((entry, index) => {
        const editDate = new Date(entry.edited_at).toLocaleString();
        message += `${index + 1}. "${entry.old_name}" → "${entry.new_name}" \n    at: ${editDate}\n`;
      });
    }
    message += '------------------------------';

    return ctx.reply(message);
  }

  if (action === 'category_edit') {
    ctx.session = ctx.session || {};
    ctx.session.categoryEdit = {
      categoryId: category._id.toString(),
      currentName: category.name
    };

    return ctx.reply(
      `សូមបញ្ចូលឈ្មោះប្រភេទផលិតផលថ្មីសម្រាប់"${category.name}":`,
      Markup.inlineKeyboard([
        [Markup.button.callback('Cancel សម្រាបលការចាកចេញ', 'category_edit:cancel')]
      ])
    );
  }

  if (action === 'category_delete') {
    const product = await Product.findOne({ category_id: category._id });
    if (product) {
      return ctx.reply('មិនអាចលុបប្រភេទនេះបានទេ ព្រោះមានផលិតផលដែលស្ថិតនៅក្នុងប្រភេទនេះ!! សូមផ្លាស់ប្តូរប្រភេទផលិតផលទាំងអស់ក្នុងប្រភេទនេះទៅប្រភេទផ្សេងមុនពេលលុប។');
    }

    await category.deleteOne();
    return ctx.reply('ប្រភេទផលិតផលត្រូវបានលុបដោយជោគជ័យ!!');
  }
};

const handleMessage = async (ctx) => {
  if (!ctx.session || !ctx.session.categoryEdit) {
    return false;
  }

  const text = ctx.message && ctx.message.text ? ctx.message.text.trim() : '';
  if (!text) {
    return ctx.reply('សូមបញ្ចូលឈ្មោះប្រភេទផលិតផលថ្មី។');
  }

  const { categoryId } = ctx.session.categoryEdit;
  const category = await Category.findById(categoryId);
  if (!category) {
    ctx.session.categoryEdit = null;
    return ctx.reply('Category not found.');
  }

  const existingCategory = await Category.findOne({ name: text });
  if (existingCategory && existingCategory._id.toString() !== categoryId) {
    return ctx.reply('ប្រភេទដែលមានឈ្មោះនេះមានរួចហើយ!! សូមជ្រើសឈ្មោះផ្សេង។');
  }

  // Store the proposed new name and ask for confirmation
  ctx.session.categoryEdit.proposedName = text;

  const confirmMessage = `តើអ្នកបង្ហាញថាចង់ប្តូរឈ្មោះ "${ctx.session.categoryEdit.currentName}" ទៅជា "${text}" ដែររឺទេ?`;

  return ctx.reply(
    confirmMessage,
    Markup.inlineKeyboard([
      [
        Markup.button.callback('No', 'category_confirm_edit:no'),
        Markup.button.callback('Yes', 'category_confirm_edit:yes')
      ]
    ])
  );
};

module.exports = {
  listCategories,
  handleCallback,
  handleMessage
};
