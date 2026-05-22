# Code Summary

## Entry Point
- `index.js` creates the Telegraf bot, registers middleware, routes commands, routes callback queries, and starts the bot.
- Message session flow priority:
  1. pending order address
  2. profile edit
  3. product edit
  4. category edit
  5. admin add product/category flow
  6. admin stock flow
  7. registration

## Active Feature Areas
- `src/commands/users/`
  - registration, profile view, and profile editing.
- `src/commands/categories/`
  - category list display, category management, and category product browsing.
- `src/commands/products/`
  - cart, search, product editing, stock actions, and product admin callbacks.
- `src/commands/orders/`
  - order creation, address choice, confirmation, pending address handling, and order history.
- `src/commands/admin/`
  - admin panel, user management, order management, and add product/category flows.
- `src/commands/support/`
  - help and support responses.

## Data Models
- `User`
  - Telegram identity, profile info, role, and creation date.
- `Category`
  - category name and edit history.
- `Product`
  - category reference, display product id, supplier id, price, description, image, quantity, and stock history.
- `Order`
  - customer/order details, items, status, totals, address, and timestamps.

## Important Utilities
- `src/database/database.js`
  - MongoDB connection with DNS configuration and retry logic.
- `src/utils/keyboards.js`
  - main menu keyboard generation.
- `src/utils/orderHelper.js`
  - pending order expiration scheduling.
- `src/utils/telegramHelper.js`
  - safe callback-query answer helper.

## Maintenance Notes
- `adminFlow.js` owns guided admin creation of products and categories.
- `manageCategory.js` owns category list, details, edit, delete, and history actions.
- `adminProductActions.js` owns product delete and stock actions.
- `editProductCallback.js` and `editProductResponse.js` own product edit sessions.
- Avoid adding new one-off command files unless they are wired in `index.js`; unused handlers become hard to maintain.
