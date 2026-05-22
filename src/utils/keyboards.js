const { Markup } = require('telegraf');

const mainMenuKeyboard = (isAdmin = false) => {
  const rows = [];
  if (isAdmin) {
    rows.push(['📦 គ្រប់គ្រងផលិតផល 📦']);
    rows.push(['គ្រប់គ្រងប្រភេទផលិតផល', 'គ្រប់គ្រងការបញ្ជាទិញ']);
    rows.push(['support', 'help']);
    rows.push(['🕵️‍♀️ profile 🕵️‍♀️']);

    return Markup.keyboard(rows).resize();
  }

  rows.push(['📦 បង្ហាញផលិតផល​ 📦']);
  rows.push(['ប្រវត្តិនៃការបញ្ជាទិញ']);
  rows.push(['support', 'help']);
  rows.push(['🕵️‍♀️ profile 🕵️‍♀️']);

  return Markup.keyboard(rows).resize();
};

module.exports = {
  mainMenuKeyboard
};
