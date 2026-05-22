# Repository Guidelines

## Project Overview
- Node.js CommonJS Telegram bot for clothing inventory, ordering, and admin workflows.
- Runtime dependencies are `telegraf`, `mongoose`, and `dotenv`.
- Main entry point: `index.js`.
- MongoDB connection helper: `src/database/database.js`.

## Commands
- Install dependencies: `npm install`.
- Start the bot: `npm start`.
- Clear all database data: `npm run clear-db`.
- Promote a Telegram user to admin: `npm run promote-admin <telegram_id>`.
- Tests are not configured yet; `npm test` currently exits with an error placeholder.

## Environment
- Copy `.env.example` to `.env` and set `BOT_TOKEN`, `MONGO_URI`, and `ORDER_CHANNEL_ID`.
- `DNS_SERVERS` is optional and defaults to `1.1.1.1,8.8.8.8` in the database connector.
- Treat `.env` as secret local configuration. Check `.gitignore` before committing because this repo currently has dotenv comments but no explicit `.env` ignore rule.

## Code Map
- `index.js` wires Telegraf middleware, command handlers, text handlers, callback routing, and startup.
- `src/commands/` contains feature handlers grouped by domain:
  - `admin/` for admin menus, order management, user viewing, and promotion.
  - `categories/` for category listing and management.
  - `orders/` for order placement, address choices, confirmation, and history.
  - `products/` for product listing, cart, stock, edit, delete, and search flows.
  - `users/` for registration and profile editing.
  - `support/`, `connect/`, and `startBot/` for support/help, status, and launch.
- `src/models/` contains Mongoose models for users, products, categories, and orders.
- `src/utils/` contains helper functions such as keyboards, roles, orders, and Telegram utilities.
- `scripts/` contains one-off operational scripts.
- `docs/` contains user/admin workflow documentation.

## Implementation Notes
- Session-driven flows are handled early in `bot.on('message')`; preserve that priority when adding new message states.
- Callback routing is centralized in `index.js`; new callback data prefixes should be registered there.
- Some Khmer/emoji text appears mojibaked in the current files. Avoid broad re-encoding or automatic formatting over these strings unless the task is specifically to fix encoding.
- Database scripts can delete production data if `.env` points at production MongoDB. Confirm the target database before running destructive scripts.

## Git Hygiene
- The working tree was clean at initialization.
- Do not commit `node_modules`, local logs, or secret environment files.
