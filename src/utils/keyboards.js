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

  rows.push(['Show product']);
  rows.push(['Orders History']);
  rows.push(['Support', 'Help']);
  rows.push(['View Profile']);

  return Markup.keyboard(rows).resize();
};

module.exports = {
  mainMenuKeyboard
};
