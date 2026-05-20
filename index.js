require('dotenv').config();
const { Telegraf, session } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(session());

const registerCommand = require('./src/commands/users/register');
const profileCommand = require('./src/commands/users/profile');
const authMiddleware = require('./src/middleware/auth');
const roleMiddleware = require('./src/middleware/role');
const adminCommand = require('./src/commands/admin/admin');
const totalUserCommand = require('./src/commands/admin/totalUser');
const viewUserCommand = require('./src/commands/admin/viewUser');
const promoteUserCommand = require('./src/commands/admin/promoteUser');
const addCategory = require('./src/commands/categories/addCategory');
const listCategory = require('./src/commands/categories/listCategory');
const editCategory = require('./src/commands/categories/editCategory');
const deleteCategory = require('./src/commands/categories/deleteCategory');
const addProduct = require('./src/commands/products/addProduct');
const listProduct = require('./src/commands/products/listProduct');
const productDetail = require('./src/commands/products/productDetail');
const editProduct = require('./src/commands/products/editProduct');
const deleteProduct = require('./src/commands/products/deleteProduct');
const addStock = require('./src/commands/products/addStock');
const outStock = require('./src/commands/products/outStock');
const clearStock = require('./src/commands/products/clearStock');
const searchProduct = require('./src/commands/products/searchProduct');
const placeOrderCommand = require('./src/commands/orders/placeOrder');
const orderHistoryCommand = require('./src/commands/orders/orderHistory');
const confirmOrderCallback = require('./src/commands/orders/confirmOrder');
const orderNowCallback = require('./src/commands/orders/orderNow');
const orderAddressChoiceCallback = require('./src/commands/orders/orderAddressChoice');
const editProfileCallback = require('./src/commands/users/editProfileCallback');
const editProfileResponse = require('./src/commands/users/editProfileResponse');
const addToCartCallback = require('./src/commands/products/addToCart');
const editProductCallback = require('./src/commands/products/editProductCallback');
const editProductResponse = require('./src/commands/products/editProductResponse');
const viewCartCallback = require('./src/commands/products/viewCart');
const clearCartCallback = require('./src/commands/products/clearCart');
const orderAllCartCallback = require('./src/commands/products/orderAllCart');
const showCategories = require('./src/commands/categories/showCategories');
const showCategoryProductsCallback = require('./src/commands/categories/showCategoryProducts');
const statusCommand = require('./src/commands/connect/testDatabaseConn');
const helpCommand = require('./src/commands/support/help');
const supportCommand = require('./src/commands/support/support');
const handlePendingOrderAddress = require('./src/commands/orders/handlePendingOrderAddress');
const startBot = require('./src/commands/startBot/startBot');


// start and message handler need `registerCommand` to be defined first
bot.start(registerCommand);

bot.on('message', async (ctx, next) => {
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

  if (ctx.session && ctx.session.registration) {
    await registerCommand(ctx);
    return;
  }

  return next();
});



bot.command('profile', authMiddleware, profileCommand);
bot.command('status', statusCommand);
bot.command('admin',roleMiddleware,adminCommand);
bot.command('addcategory', roleMiddleware, addCategory);
bot.command('categories', authMiddleware, listCategory);
bot.command('editcategory', roleMiddleware, editCategory);
bot.command('deletecategory', roleMiddleware, deleteCategory);
bot.command('addproduct', roleMiddleware, addProduct);
bot.command('products', authMiddleware, listProduct);
bot.command('product', authMiddleware, productDetail);
bot.command('editproduct', roleMiddleware, editProduct);
bot.command('deleteproduct', roleMiddleware, deleteProduct);
bot.command('addstock', roleMiddleware, addStock);
bot.command('outstock', roleMiddleware, outStock);
bot.command('clearstock', roleMiddleware, clearStock);
bot.command('search', authMiddleware, searchProduct);
bot.command('order', authMiddleware, placeOrderCommand);
bot.command('orders', authMiddleware, orderHistoryCommand);
bot.command('cart', authMiddleware, viewCartCallback);
bot.command('total-user', roleMiddleware, totalUserCommand);

bot.hears('Show product', authMiddleware, showCategories);
bot.hears('Orders History', authMiddleware, orderHistoryCommand);
bot.hears('View Profile', authMiddleware, profileCommand);
bot.hears('Help', helpCommand);
bot.hears('Support', supportCommand);
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

  if (data.startsWith('category_show:')) {
    return showCategoryProductsCallback(ctx);
  }

  if (data.startsWith('add_cart:')) {
    return addToCartCallback(ctx);
  }

  if (data.startsWith('order_now:')) {
    return orderNowCallback(ctx);
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