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
- `/profile` - Display your registered profile information.
- `/status` - Check MongoDB connection status.
- `/admin` - Show the admin panel (admin role only).
- `Add Product` / `Add Category` - Admin-only buttons shown in the main menu for guided creation flows.

## Category & Product Management

- `/addcategory <category_name>` (admin) — Create a new category.
- `/editcategory <category_name> <new_name>` (admin) — Rename a category.
- `/deletecategory <category_name>` (admin) — Delete a category.
- `/addproduct <name> <category> <price> [quantity] [imageUrl]` (admin) — Add a product. Example: `/addproduct Shirt Men 19.99 10 https://example.com/shirt.png`
- `/products` (registered users) — List all products with ID, name, category, price, quantity, and stock status.
- `/product <name|id>` (registered users) — Show product details.
- `/search <field> <query>` (registered users) — Search products by `id`, `name`, `category`, or `price`.
- `/editproduct <productId> <field> <value>` (admin) — Edit a product field.
- `/deleteproduct <productId>` (admin) — Delete a product by ID.

### Admin buttons and detail actions

- `Add Product` — Starts a guided product creation flow, asking for name, category, price, quantity, and image before confirmation.
- `Add Category` — Starts a guided category creation flow with confirmation.
- On product detail screens, admins also see `Stock`, `Edit`, and `Delete` buttons.
- `Stock` opens current stock details, recent changes, and actions for `Add stock`, `Out stock`, and `Clear stock`.
- `History stock` shows paginated stock history entries, 10 items at a time.

## Stock Management

- `/addstock <productId> <amount>` (admin) — Increase stock.
- `/outstock <productId> <amount>` (admin) — Decrease stock without going below zero.
- `/clearstock <productId>` (admin) — Reset stock to zero.

Stock changes are recorded in each product's `stock_history`, including additions, removals, clears, purchases, and restore operations.

## Orders

- `/order <product_id|name> <quantity>` (registered users) — Place an order for a product.
- Order confirmation uses a local QR payment image at `assets/QRpayment/QRpayment.png`.
- Users must confirm payment within 2 minutes or the order expires and reserved stock is restored.
- `/orders` (registered users) — View order history, 4 orders per page with a `See 4 more order history` button.

## User Roles

The bot supports two roles:

### Staff (default)
- Can register with `/start`.
- Can view profile with `/profile`.
- Can browse categories and products.
- Can place orders and view order history.

### Admin
- Has all staff privileges.
- Can use admin-only commands and buttons.
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
