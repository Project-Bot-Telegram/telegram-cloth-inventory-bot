const { Markup } = require('telegraf');

const mainMenuKeyboard = () => Markup.keyboard([
  ['Show product', 'Orders History'],
  ['View Profile', 'Help'],
  ['Support']
]).resize();

module.exports = {
  mainMenuKeyboard
};
