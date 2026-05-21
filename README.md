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

3. Fill in your Telegram bot token and MongoDB connection string in `.env`.

## Run

```bash
npm start
```

## Bot Commands

- `/start` - Register new users or welcome returning users by full name. After registration, the bot shows a bottom menu with buttons like `Show product`, `Orders History`, `View Profile`, `Help`, and `Support`.
- `/status` - Check MongoDB connection status.
- `/admin` - Show the admin panel (admin role only).
- `Add Product` / `Add Category` - Admin-only buttons shown in the main menu for guided creation flows.

## Category & Product Management

Most category and product management actions are handled through buttons in the admin panel rather than slash commands.

- Admins can use `Add Product` and `Add Category` buttons to begin guided creation flows.
- Categories are listed with product counts, and tapping a category shows its products.
- Product detail screens include admin actions for `Stock`, `Edit`, and `Delete`.
- The `Stock` action exposes additional admin controls for `Add stock`, `Out stock`, and `Clear stock`.

### Search and ordering

- `/search <field> <query>` (registered users) — Search products by `id`, `name`, `category`, or `price`.
- `/cart` (registered users) — View cart contents and proceed to order.

### Admin actions

- `/total-user` — Display the total number of registered users.
- `/view-<user_id>` — View a specific user's profile information. Example: `/view-1655512983`
- `/promote-<user_id>` — Promote a user to admin. Example: `/promote-1655512983`

### Admin buttons and detail actions

- `Add Product` — Starts a guided product creation flow, asking for name, category, price, quantity, and image before confirmation.
- `Add Category` — Starts a guided category creation flow with confirmation.
- On product detail screens, admins also see `Stock`, `Edit`, and `Delete` buttons.
- `Stock` opens current stock details, recent changes, and actions for `Add stock`, `Out stock`, and `Clear stock`.
- `History stock` shows paginated stock history entries, 10 items at a time.

## Stock Management

- Stock changes are managed through the admin product detail workflow and `Stock` actions in the UI.

Stock changes are recorded in each product's `stock_history`, including additions, removals, clears, purchases, and restore operations.

## Orders

- Orders are placed through the button-driven workflow on product details and cart screens.
- Order confirmation uses a local QR payment image at `assets/QRpayment/QRpayment.png`.
- Users must confirm payment within 2 minutes or the order expires and reserved stock is restored.
- `Orders History` button shows order history, 4 orders per page with a `See 4 more order history` button.

## User Roles

The bot supports two roles:

### Staff (default)
- Can register with `/start`.
- Can view profile via the `View Profile` button.
- Can browse categories and products.
- Can place orders and view order history via buttons.

### Admin
- Has all staff privileges.
- Can use admin-only buttons and controls.
- Can manage categories, products, and stock.
- Can view admin product actions and stock history.

## Admin Commands

- `/total-user` — Display the total number of registered users.
- `/view-<user_id>` — View a specific user's profile information. Example: `/view-1655512983`
- `/promote-<user_id>` — Promote a user to admin. Example: `/promote-1655512983`

## Scripts

- `npm start` — Start the bot.
- `npm run clear-db` — Reset the database using `scripts/clearDatabase.js`.
- `npm run promote-admin <telegram_id>` — Promote a Telegram user to admin using `scripts/promoteAdmin.js`.

## Notes

- The bot uses MongoDB via `MONGO_URI` and Telegraf via `BOT_TOKEN`.
- Do not commit `.env` to source control.
- Admin users can be created by promoting a registered user in MongoDB or using the provided script.

## Product ID behavior

- New products receive a sequential zero-padded `product_id` (for example `0001`, `0002`).
- Existing legacy products may not have a `product_id` until they are recreated or updated.
- If you want a migration script to assign missing `product_id` values to existing products, that can be added.
