// Command to display help information about how to use the bot
const helpCommand = async (ctx) => {
  return ctx.reply(
    'ប្រើប៊ូតុងសម្រាប់សកម្មភាពភាគច្រើន និងប្រើពាក្យបញ្ជាដែលចាំបាច់តែប៉ុណ្ណោះ:\n\n' +
    '• បង្ហាញផលិតផល - ស្វែងរកប្រភេទ និងផលិតផល\n' +
    '• មើលប្រវត្តិ - ពិនិត្យព័ត៌មានប្រវត្តិរបស់អ្នក\n' +
    '• ប្រវត្តិបញ្ជាទិញ - មើលប្រវត្តិបញ្ជាទិញរបស់អ្នក\n' +
    '• គាំទ្រ - ទំនាក់ទំនងក្រុមគាំទ្រ\n\n' +
    '/search <field> <query> - ស្វែងរកផលិតផល\n'
  );
};

module.exports = helpCommand;
