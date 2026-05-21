const { Markup } = require('telegraf');

const mainMenuKeyboard = (isAdmin = false) => {
  const rows = [];
  if (isAdmin) {
    rows.push(['Add Product', 'Add Category']);
  }
  rows.push(['Show product', 'Orders History']);
  rows.push(['View Profile', 'Help']);
  rows.push(['Support']);

  return Markup.keyboard(rows).resize();
};

module.exports = {
  mainMenuKeyboard
};
