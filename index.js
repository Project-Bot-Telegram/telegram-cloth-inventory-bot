require('dotenv').config();
const { Telegraf, session } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(session());

const registerCommand = require('./src/commands/users/register');
const profileCommand = require('./src/commands/users/profile');
const authMiddleware = require('./src/middleware/auth');
const roleMiddleware = require('./src/middleware/role');
const adminCommand = require('./src/commands/admin/admin');
const statusCommand = require('./src/commands/connect/testDatabaseConn');
const totalUserCommand = require('./src/commands/admin/totalUser');
const viewUserCommand = require('./src/commands/admin/viewUser');
const promoteUserCommand = require('./src/commands/admin/promoteUser');
const adminFlow = require('./src/commands/admin/adminFlow');
const searchProduct = require('./src/commands/products/searchProduct');
const orderHistoryCommand = require('./src/commands/orders/orderHistory');
const confirmOrderCallback = require('./src/commands/orders/confirmOrder');
const orderNowCallback = require('./src/commands/orders/orderNow');
const orderAddressChoiceCallback = require('./src/commands/orders/orderAddressChoice');
const editProfileCallback = require('./src/commands/users/editProfileCallback');
const editProfileResponse = require('./src/commands/users/editProfileResponse');
const addToCartCallback = require('./src/commands/products/addToCart');
const editProductCallback = require('./src/commands/products/editProductCallback');
const editProductResponse = require('./src/commands/products/editProductResponse');
const adminProductActions = require('./src/commands/products/adminProductActions');
const manageOrder = require('./src/commands/admin/manageOrder');
const viewCartCallback = require('./src/commands/products/viewCart');
const clearCartCallback = require('./src/commands/products/clearCart');
const orderAllCartCallback = require('./src/commands/products/orderAllCart');
const showCategories = require('./src/commands/categories/showCategories');
const manageCategory = require('./src/commands/categories/manageCategory');
const showCategoryProductsCallback = require('./src/commands/categories/showCategoryProducts');
const helpCommand = require('./src/commands/support/help');
const supportCommand = require('./src/commands/support/support');
const handlePendingOrderAddress = require('./src/commands/orders/handlePendingOrderAddress');
const startBot = require('./src/commands/startBot/startBot');


// start and message handler need `registerCommand` to be defined first
bot.start(registerCommand);

bot.on('message', async (ctx, next) => {
  // Handle explicit /start messages (including deep links) before session intercepts
  const incomingText = ctx.message && ctx.message.text ? ctx.message.text.trim() : '';
  if (incomingText.startsWith('/start')) {
    await registerCommand(ctx);
    return;
  }

  if (ctx.session && ctx.session.pendingOrder) {
    await handlePendingOrderAddress(ctx);
    return;
  }

  if (ctx.session && ctx.session.editProfile) {
    await editProfileResponse(ctx);
    return;
  }

  if (ctx.session && ctx.session.editProduct) {
    const handled = await editProductResponse(ctx);
    if (handled !== false) {
      return;
    }
  }

  if (ctx.session && ctx.session.categoryEdit) {
    const handled = await manageCategory.handleMessage(ctx);
    if (handled !== false) {
      return;
    }
  }

  if (ctx.session && ctx.session.adminFlow) {
    const handled = await adminFlow.handleMessage(ctx);
    if (handled !== false) {
      return;
    }
  }

  if (ctx.session && ctx.session.adminStock) {
    const handled = await adminProductActions.handleMessage(ctx);
    if (handled !== false) {
      return;
    }
  }

  if (ctx.session && ctx.session.registration) {
    await registerCommand(ctx);
    return;
  }

  return next();
});



bot.command('status', statusCommand);
bot.command('admin', roleMiddleware, adminCommand);
bot.command('search', authMiddleware, searchProduct);
bot.command('cart', authMiddleware, viewCartCallback);
bot.command('total-user', roleMiddleware, totalUserCommand);

bot.hears('📦 បង្ហាញផលិតផល​ 📦', authMiddleware, showCategories);
bot.hears('📦 គ្រប់គ្រងផលិតផល 📦', roleMiddleware, showCategories);
bot.hears('គ្រប់គ្រងប្រភេទផលិតផល', roleMiddleware, manageCategory.listCategories);
bot.hears('គ្រប់គ្រងការបញ្ជាទិញ', roleMiddleware, manageOrder.showStatusMenu);
bot.hears('ប្រវត្តិនៃការបញ្ជាទិញ', authMiddleware, orderHistoryCommand);
bot.hears('🕵️‍♀️ profile 🕵️‍♀️', authMiddleware, profileCommand);
bot.hears('បន្ថែមផលិតផល', roleMiddleware, adminFlow.startAddProductConfirm);
bot.hears('បន្ថែមប្រភេទ', roleMiddleware, adminFlow.startAddCategoryConfirm);
bot.hears('help', helpCommand);
bot.hears('support', supportCommand);
bot.hears(/^\/view-(\d+)(?:@\S+)?$/i, roleMiddleware, viewUserCommand);
bot.hears(/^\/promote-(\d+)(?:@\S+)?$/i, roleMiddleware, promoteUserCommand);

bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery && ctx.callbackQuery.data;
  if (!data) {
    return;
  }

  if (data.startsWith('confirm_order:')) {
    return confirmOrderCallback(ctx);
  }

  if (data.startsWith('order_address:')) {
    return orderAddressChoiceCallback(ctx);
  }

  if (data === 'help') {
    await ctx.answerCbQuery();
    return helpCommand(ctx);
  }

  if (data === 'support') {
    await ctx.answerCbQuery();
    return supportCommand(ctx);
  }

  if (data.startsWith('edit_profile:')) {
    return editProfileCallback(ctx);
  }

  if (data.startsWith('confirm_edit:')) {
    return editProfileCallback(ctx);
  }

  if (data.startsWith('edit_product:')) {
    return editProductCallback(ctx);
  }

  if (data.startsWith('confirm_update:')) {
    return editProductCallback(ctx);
  }

  if (data.startsWith('admin:')) {
    return adminFlow.handleCallback(ctx);
  }

  if (data.startsWith('admin_order_status:') || data.startsWith('admin_order_status_more:') || data.startsWith('admin_order_change')) {
    return manageOrder.handleCallback(ctx);
  }

  if (data.startsWith('admin_product:') || data.startsWith('admin_stock:')) {
    return adminProductActions.handleCallback(ctx);
  }

  if (data.startsWith('category_info:') || data.startsWith('category_history_edit:') || data.startsWith('category_edit:') || data.startsWith('category_delete:') || data.startsWith('category_confirm_edit:')) {
    return manageCategory.handleCallback(ctx);
  }

  if (data.startsWith('category_show:')) {
    return showCategoryProductsCallback(ctx);
  }

  if (data.startsWith('add_cart:')) {
    return addToCartCallback(ctx);
  }

  if (data.startsWith('order_now:')) {
    return orderNowCallback(ctx);
  }

  if (data.startsWith('order_history_status:')) {
    return orderHistoryCommand.handleStatus(ctx);
  }

  if (data.startsWith('order_history_more:')) {
    return orderHistoryCommand.handleMore(ctx);
  }

  if (data.startsWith('view_cart')) {
    return viewCartCallback(ctx);
  }

  if (data.startsWith('clear_cart')) {
    return clearCartCallback(ctx);
  }

  if (data.startsWith('order_all_cart')) {
    return orderAllCartCallback(ctx);
  }
});

// Start the bot
startBot(bot).catch((err) => {
  console.error('Failed to start bot:', err);
  process.exit(1);
});

module.exports = { bot };
