# User Guide

This page explains how a regular user interacts with the Telegram Cloth Inventory Bot.

## 1. Start the bot

- Send `/start` to the bot.
- If you are new, the bot will ask for your full name and save your profile.
- If you are already registered, the bot will greet you and show the main menu.

## 2. Main menu

After login, the bot displays the main menu.

Regular user buttons:

- `📦 បង្ហាញផលិតផល​ 📦` — Browse product categories.
- `ប្រវត្តិនៃការបញ្ជាទិញ` — View order history.
- `support` — Get support information.
- `help` — View help text and supported commands.
- `🕵️‍♀️ profile 🕵️‍♀️` — View or update profile information.

## 3. Browse categories and products

- Press `📦 បង្ហាញផលិតផល​ 📦` to list available categories.
- Tap a category to show products within that category.
- Each product page includes buttons to:
  - `ដាក់ទៅកាស` — Add the product to the cart.
  - `បញ្ជាទិញឥឡូវ` — Order the product immediately.

## 4. Search products

- Use `/search <field> <query>` to search products.
- Search fields include:
  - `id`
  - `name`
  - `category`
  - `price`

Example:

```text
/search name shirt
```

## 5. Cart and checkout

- Add products to the cart using `ដាក់ទៅកាស` on a product page.
- Open the cart with the `/cart` command or the cart button.
- Inside the cart, you can:
  - `បញ្ជាទិញទាំងអស់` — Order all cart items.
  - `បោះបង់ចោល` — Clear the cart.

## 6. Placing an order

- Select `បញ្ជាទិញឥឡូវ` to order a single product.
- Choose your address method:
  - `ប្រើអាសយដ្ឋានក្នុង​​ profile` — Use the address saved in the profile.
  - `ប្រើអាសយដ្ឋានថ្មី` — Enter a new shipping address.
- Confirm the payment request when prompted.

## 7. Order history

- Open `ប្រវត្តិនៃការបញ្ជាទិញ` to view your past orders.
- Order history may include buttons to filter by status and show more results.

## 8. Support and help

- Send `help` to display help text and supported commands.
- Send `support` for support instructions and admin contact guidance.

## 9. Useful commands

- `/start` — Register or open the bot.
- `/status` — Check whether the bot is connected to MongoDB.
- `/search <field> <query>` — Search products.
- `/cart` — View cart contents.

## 10. Tips

- Use the main menu buttons for the fastest workflow.
- The cart and order history screens are the easiest place to review your current and past orders.
- If you need help, send `support` or `help`.
