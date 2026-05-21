const { Markup } = require('telegraf');

const mainMenuKeyboard = (isAdmin = false) => {
  const rows = [];
  if (isAdmin) {
    rows.push(['Manage Product']);
    rows.push(['Manage Category' , 'Manage Order']);
    rows.push(['Support', 'Help']);
    rows.push(['View Profile']);

    return Markup.keyboard(rows).resize();
  }

  rows.push(['Show product', 'Orders History']);
  rows.push(['View Profile', 'Help']);
  rows.push(['Support']);

  return Markup.keyboard(rows).resize();
};

module.exports = {
  mainMenuKeyboard
};
