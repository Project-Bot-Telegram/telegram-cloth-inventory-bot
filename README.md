# Telegram Cloth Inventory Bot

A Telegram inventory management bot for clothes, built with Telegraf and MongoDB.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment example:

```bash
cp .env.example .env
```

3. Open `.env` and set:

```env
BOT_TOKEN=your-telegram-bot-token
MONGO_URI=your-mongodb-connection-string
ORDER_CHANNEL_ID=@your_channel
```

4. Start the bot:

```bash
npm start
```

---

## Step-by-step bot flow

### 1. Start and register

- Send `/start` to the bot.
- If you are a new user, the bot will ask for your full name and save your profile.
- If you are already registered, the bot will welcome you and show the main menu.

### 2. Use the main menu

After registration, the bot shows a menu with buttons.

For regular users:

- `📦 បង្ហាញផលិតផល​ 📦` — View product categories and product lists.
- `ប្រវត្តិនៃការបញ្ជាទិញ` — See your order history.
- `support` — Open support instructions.
- `help` — View available commands.
- `🕵️‍♀️ profile 🕵️‍♀️` — View or update your profile.

For admins, the menu also includes:

- `📦 គ្រប់គ្រងផលិតផល 📦` — Open admin product management.
- `គ្រប់គ្រងប្រភេទផលិតផល` — Manage product categories.
- `គ្រប់គ្រងការបញ្ជាទិញ` — Manage order status.

### 3. Browse categories and products

- Press `📦 បង្ហាញផលិតផល​ 📦` to list categories.
- Tap a category to see products inside.
- On each product, regular users can:
  - `ដាក់ទៅកាស` — Add the product to the cart.
  - `បញ្ជាទិញឥឡូវ` — Order the product immediately.

Admin users also see product controls:

- `ស្តុក` — View and edit stock.
- `កែប្រែ` — Edit product details.
- `លុប` — Delete the product.

### 4. Place an order

For a single product:

- Choose `បញ្ជាទិញឥឡូវ` on the product detail screen.
- Select an address:
  - `ប្រើអាសយដ្ឋានក្នុង​​ profile` — Use the saved profile address.
  - `ប្រើអាសយដ្ឋានថ្មី` — Enter a new shipping address.
- Confirm payment on the order screen.

For cart-based orders:

- Add products to the cart with `ដាក់ទៅកាស`.
- Open the cart with `/cart` or `view cart` button.
- Tap `បញ្ជាទិញទាំងអស់` to order everything in the cart.
- Confirm the address and payment.

### 5. Check order status

- Use `ប្រវត្តិនៃការបញ្ជាទិញ` to view order history.
- Order history can be filtered by status and paged with `See more` buttons.

### 6. Support and help

- Send `help` to display bot help text and supported commands.
- Send `support` for support information and admin contact guidance.

---

## Commands

- `/start` — Register or log in and show the menu.
- `/status` — Check whether MongoDB is connected.
- `/search <field> <query>` — Search products by `id`, `name`, `category`, or `price`.
- `/cart` — Open the current cart and proceed to checkout.
- `/total-user` — Admin only: show total registered users.
- `/view-<user_id>` — Admin only: view a user profile.
- `/promote-<user_id>` — Admin only: promote a user to admin.

---

## Admin workflows

### Manage categories

- Use `គ្រប់គ្រងប្រភេទផលិតផល` to open category management.
- Add, edit, and delete categories from the admin panel.
- `+ បន្ថែមប្រភេទផលិតផលថ្មី +` begins a new category flow.

### Manage products

- Use `📦 គ្រប់គ្រងផលិតផល 📦` to start admin product workflows.
- Add a product through the guided flow.
- Edit product name, category, price, quantity, and image.
- Manage stock with `ស្តុក` actions:
  - `Add stock`
  - `Out stock`
  - `Clear stock`

### Manage orders

- Use `គ្រប់គ្រងការបញ្ជាទិញ` to manage pending and confirmed orders.
- Admins can change order status and review order details.

---

## Notes

- The bot is built with `telegraf`, `mongoose`, and `dotenv`.
- Store your Telegram bot token and MongoDB URI in `.env`.
- Do not commit `.env`.
- `ORDER_CHANNEL_ID` is used for order-related channel notifications.

## Scripts

- `npm start` — Start the bot.
- `npm run clear-db` — Reset the database.
- `npm run promote-admin <telegram_id>` — Promote a Telegram user to admin.
