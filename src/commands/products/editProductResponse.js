const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');
const Category = require('../../models/Category');

const downloadTelegramPhoto = async (ctx, fileId, productId) => {
  const assetDir = path.join(process.cwd(), 'assets', 'imageProduct');
  await fs.promises.mkdir(assetDir, { recursive: true });

  const fileLink = await ctx.telegram.getFileLink(fileId);
  const response = await fetch(fileLink.toString());
  if (!response.ok) {
    throw new Error(`Failed to download photo: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  let extension = 'jpg';
  if (contentType.includes('png')) extension = 'png';
  else if (contentType.includes('webp')) extension = 'webp';
  else if (contentType.includes('gif')) extension = 'gif';
  else if (contentType.includes('jpeg')) extension = 'jpg';

  const filename = `product_${productId || 'unknown'}_${Date.now()}.${extension}`;
  const filePath = path.join(assetDir, filename);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.promises.writeFile(filePath, buffer);
  return filePath;
};

module.exports = async (ctx) => {
  if (!ctx.session || !ctx.session.editProduct) {
    return false;
  }

  const editSession = ctx.session.editProduct;
  const hasPhoto = ctx.message && Array.isArray(ctx.message.photo) && ctx.message.photo.length > 0;
  const text = ctx.message && ctx.message.text ? ctx.message.text.trim() : '';

  if (text.startsWith('/')) {
    return ctx.reply('Please use the Cancel button to abort product editing, or continue entering your information.');
  }

  if (editSession.stepIndex === 0) {
    editSession.data.name = text;
    editSession.stepIndex = 1;
    return ctx.reply('Please enter the new category name.', Markup.inlineKeyboard([
      [Markup.button.callback('Skip to keep old category', 'edit_product:skip_category')]
    ]));
  }

  if (editSession.stepIndex === 1) {
    const category = await Category.findOne({ name: text });
    if (!category) {
      return ctx.reply('Category not found. Please enter a valid category name or use Skip.', Markup.inlineKeyboard([
        [Markup.button.callback('Skip to keep old category', 'edit_product:skip_category')]
      ]));
    }

    editSession.data.category = text;
    editSession.stepIndex = 2;
    return ctx.reply('Please enter the new price.', Markup.inlineKeyboard([
      [Markup.button.callback('Skip to keep old price', 'edit_product:skip_price')]
    ]));
  }

  if (editSession.stepIndex === 2) {
    const price = parseFloat(text);
    if (isNaN(price) || price < 0) {
      return ctx.reply('Invalid price. Please enter a valid number.', Markup.inlineKeyboard([
        [Markup.button.callback('Skip to keep old price', 'edit_product:skip_price')]
      ]));
    }

    editSession.data.price = price;
    editSession.stepIndex = 3;
    return ctx.reply('Please enter the new quantity.', Markup.inlineKeyboard([
      [Markup.button.callback('Skip to keep old quantity', 'edit_product:skip_quantity')]
    ]));
  }

  if (editSession.stepIndex === 3) {
    const quantity = parseInt(text, 10);
    if (isNaN(quantity) || quantity < 0) {
      return ctx.reply('Invalid quantity. Please enter a valid number.', Markup.inlineKeyboard([
        [Markup.button.callback('Skip to keep old quantity', 'edit_product:skip_quantity')]
      ]));
    }

    editSession.data.quantity = quantity;
    editSession.stepIndex = 4;
    return ctx.reply('Send the new image URL or send a photo directly.', Markup.inlineKeyboard([
      [Markup.button.callback('Skip to keep old image', 'edit_product:skip_image')]
    ]));
  }

  if (editSession.stepIndex === 4) {
    if (hasPhoto) {
      const photoSizes = ctx.message.photo;
      const largestPhoto = photoSizes[photoSizes.length - 1];
      if (largestPhoto && largestPhoto.file_id) {
        try {
          editSession.data.image = await downloadTelegramPhoto(ctx, largestPhoto.file_id, editSession.productId);
        } catch (error) {
          console.error('Failed to download photo:', error);
          return ctx.reply('Failed to save the photo. Please try again or enter an image URL.', Markup.inlineKeyboard([
            [Markup.button.callback('Skip to keep old image', 'edit_product:skip_image')]
          ]));
        }
      }
    } else if (text) {
      editSession.data.image = text;
    } else {
      return ctx.reply('Please send a photo or enter an image URL, or use Skip to keep the old image.', Markup.inlineKeyboard([
        [Markup.button.callback('Skip to keep old image', 'edit_product:skip_image')]
      ]));
    }

    editSession.stepIndex = 5;

    const message = `Please confirm the updated product information:\n\n` +
      `Name: ${editSession.data.name}\n` +
      `Category: ${editSession.data.category}\n` +
      `Price: $${editSession.data.price}\n` +
      `Quantity: ${editSession.data.quantity}\n` +
      `Image: ${editSession.data.image || 'None'}`;

    return ctx.reply(message, Markup.inlineKeyboard([
      [Markup.button.callback('Cancel', 'confirm_update:no'), Markup.button.callback('Update', 'confirm_update:yes')]
    ]));
  }

  return false;
};