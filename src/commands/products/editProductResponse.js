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
    return ctx.reply('សូមប្រើប៊ូតុង បោះបង់ ដើម្បីបោះបង់ការកែប្រែផលិតផល ឬបន្តបញ្ចូលព័ត៌ព័ត៌មានរបស់អ្នក។');
  }

  if (editSession.stepIndex === 0) {
    editSession.data.name = text;
    editSession.stepIndex = 1;
    return ctx.reply('សូមបញ្ចូលឈ្មោះថ្មីរបស់ប្រភេទផលិតផល:', Markup.inlineKeyboard([
      [Markup.button.callback('skip ដើម្បីរក្សាការប្រើប្រភេទចាស់', 'edit_product:skip_category')]
    ]));
  }

  if (editSession.stepIndex === 1) {
    const category = await Category.findOne({ name: text });
    if (!category) {
      return ctx.reply('ប្រភេទផលិតផលមិនត្រឹមត្រូវ!! សូមបញ្ចូលឈ្មោះប្រភេទត្រឹមត្រូវ ឬប្រើ skip ដើម្បីរក្សាប្រភេទចាស់', Markup.inlineKeyboard([
        [Markup.button.callback('skip ដើម្បីរក្សាការប្រើប្រភេទចាស់', 'edit_product:skip_category')]
      ]));
    }

    editSession.data.category = text;
    editSession.stepIndex = 2;
    return ctx.reply('សូមបញ្ចូលតម្លៃថ្មីរបស់ផលិតផល:', Markup.inlineKeyboard([
      [Markup.button.callback('skip ដើម្បីរក្សាតម្លៃចាស់', 'edit_product:skip_price')]
    ]));
  }

  if (editSession.stepIndex === 2) {
    const price = parseFloat(text);
    if (isNaN(price) || price < 0) {
      return ctx.reply('តម្លៃមិនត្រឹមត្រូវ សូមបញ្ចូលលេខអោយបានត្រឹមត្រូវ!!', Markup.inlineKeyboard([
        [Markup.button.callback('skip ដើម្បីរក្សាតម្លៃចាស់', 'edit_product:skip_price')]
      ]));
    }

    editSession.data.price = price;
    editSession.stepIndex = 3;
    return ctx.reply('សូមបញ្ចូលបរិមាណថ្មីរបស់ផលិតផល:', Markup.inlineKeyboard([
      [Markup.button.callback('skip ដើម្បីរក្សាបរិមាណចាស់', 'edit_product:skip_quantity')]
    ]));
  }

  if (editSession.stepIndex === 3) {
    const quantity = parseInt(text, 10);
    if (isNaN(quantity) || quantity < 0) {
      return ctx.reply('បរិមាណមិនត្រឹមត្រូវ សូមបញ្ចូលលេខអោយបានត្រឹមត្រូវ!!', Markup.inlineKeyboard([
        [Markup.button.callback('skip ដើម្បីរក្សាបរិមាណចាស់', 'edit_product:skip_quantity')]
      ]));
    }

    editSession.data.quantity = quantity;
    editSession.stepIndex = 4;
    return ctx.reply('សូមបញ្ចូលរូបភាពថ្មីរបស់ផលិតផល:', Markup.inlineKeyboard([
      [Markup.button.callback('skip ដើម្បីរក្សារូបភាពចាស់', 'edit_product:skip_image')]
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
          return ctx.reply('បរាជ័យក្នុងការរក្សារូបភាព សូមព្យាយាមម្តងទៀត!!', Markup.inlineKeyboard([
            [Markup.button.callback('skip ដើម្បីរក្សារូបភាពចាស់', 'edit_product:skip_image')]
          ]));
        }
      }
    } else if (text) {
      editSession.data.image = text;
    } else {
      return ctx.reply('សូមបញ្ចូលរូបភាពថ្មីរបស់ផលិតផល:', Markup.inlineKeyboard([
        [Markup.button.callback('skip ដើម្បីរក្សារូបភាពចាស់', 'edit_product:skip_image')]
      ]));
    }

    editSession.stepIndex = 5;

    const message = `សូមបញ្ជាក់ព័ត៌មានផលិតផលដែលបានកែប្រែ:\n\n` +
      `ឈ្មោះផលិតផល: ${editSession.data.name}\n` +
      `ប្រភេទផលិតផល: ${editSession.data.category}\n` +
      `តម្លៃ: $${editSession.data.price}\n` +
      `ចំនួនដាក់លក់: ${editSession.data.quantity}\n` +
      `សូមធ្វើការផ្ទៀងផ្ទាត់ព័ត៌មានថ្មីរបស់អ្នក មុនពេលធ្វើការ update ទិន្នន័យផលិតផល។`;
    const buttons = Markup.inlineKeyboard([
      [Markup.button.callback('cancel', 'confirm_update:no'), Markup.button.callback('update', 'confirm_update:yes')]
    ]);

    // If image is a local file path, send as file; if URL, pass directly to replyWithPhoto
    try {
      if (editSession.data.image) {
        const img = editSession.data.image;
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
      console.error('Failed to send preview photo:', err);
    }

    return ctx.reply(message, buttons);
  }

  return false;
};