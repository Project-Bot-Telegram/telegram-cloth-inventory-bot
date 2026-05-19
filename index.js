require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const mongoose = require('mongoose');
const connectDB = require('./src/database/database');

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(session());

// ✅ Try to connect to MongoDB
// ✅ If connection succeeds → Launch the bot
const startBot = async () => {
  const dbConnected = await connectDB();
  if (!dbConnected) {
    console.error('Failed to connect to database');
    process.exit(1);
  }
  await bot.launch();
  console.log('🤖 Bot launched successfully');
};

startBot().catch((err) => {
  console.error('Failed to start bot:', err);
  process.exit(1);
});

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

// start and text handler need `registerCommand` to be defined first
bot.start(registerCommand);

bot.on('text', async (ctx, next) => {
  if (ctx.session && ctx.session.registration) {
    await registerCommand(ctx);
    return;
  }

  return next();
});

// Command to check database connection status
bot.command('status', async (ctx) => {
  const isConnected = mongoose.connection.readyState === 1;
  
  if (isConnected) {
    ctx.reply('✅ Database is connected');
  } else {
    ctx.reply('❌ Database is NOT connected');
  }
});

bot.command('profile', authMiddleware, profileCommand);
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
bot.command('total-user', roleMiddleware, totalUserCommand);

bot.hears(/^\/view-(\d+)(?:@\S+)?$/i, roleMiddleware, viewUserCommand);
bot.hears(/^\/promote-(\d+)(?:@\S+)?$/i, roleMiddleware, promoteUserCommand);




module.exports = { bot };