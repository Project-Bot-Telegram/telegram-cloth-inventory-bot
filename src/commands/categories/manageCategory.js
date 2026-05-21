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
    [Markup.button.callback('+ add category +', 'admin:add_category:continue')],
    ...categories.map((category) => [
      Markup.button.callback(category.name, `category_info:${category._id}`)
    ])
  ];

  return ctx.reply(
    'Select a category to manage:',
    Markup.inlineKeyboard(buttons)
  );
};

const handleCallback = async (ctx) => {
  const callbackQuery = ctx.callbackQuery;
  if (!callbackQuery || !callbackQuery.data) {
    return;
  }

  const [action, categoryId] = callbackQuery.data.split(':');
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    await safeAnswerCbQuery(ctx, 'Invalid category selected.', { show_alert: true });
    return;
  }

  const category = await Category.findById(categoryId);
  if (!category) {
    await safeAnswerCbQuery(ctx, 'Category not found.', { show_alert: true });
    return;
  }

  await safeAnswerCbQuery(ctx);

  if (action === 'category_info') {
    const totalProducts = await Product.countDocuments({ category_id: category._id });
    const message = '' +
      '------------------------------\n' +
      'Category Information\n' +
      '------------------------------\n' +
      `Name: ${category.name}\n` +
      `Products: ${totalProducts}\n` +
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
      'Category History\n' +
      '------------------------------\n' +
      `Category: ${category.name}\n` +
      '------------------------------\n';

    if (!category.edit_history || category.edit_history.length === 0) {
      message += 'No category edit history is available yet.\n';
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

    return ctx.reply(`Send the new name for category "${category.name}".`);
  }

  if (action === 'category_delete') {
    const product = await Product.findOne({ category_id: category._id });
    if (product) {
      return ctx.reply('Cannot delete category while products are assigned to it.');
    }

    await category.deleteOne();
    return ctx.reply('Category deleted successfully.');
  }
};

const handleMessage = async (ctx) => {
  if (!ctx.session || !ctx.session.categoryEdit) {
    return false;
  }

  const text = ctx.message && ctx.message.text ? ctx.message.text.trim() : '';
  if (!text) {
    return ctx.reply('Please send the new category name.');
  }

  const { categoryId } = ctx.session.categoryEdit;
  const category = await Category.findById(categoryId);
  if (!category) {
    ctx.session.categoryEdit = null;
    return ctx.reply('Category not found.');
  }

  const existingCategory = await Category.findOne({ name: text });
  if (existingCategory && existingCategory._id.toString() !== categoryId) {
    return ctx.reply('A category with that name already exists.');
  }

  category.name = text;
  if (!category.edit_history) {
    category.edit_history = [];
  }
  category.edit_history.push({
    old_name: ctx.session.categoryEdit.currentName,
    new_name: text,
    edited_at: new Date()
  });
  await category.save();
  ctx.session.categoryEdit = null;
  return ctx.reply('Category updated successfully.');
};

module.exports = {
  listCategories,
  handleCallback,
  handleMessage
};
