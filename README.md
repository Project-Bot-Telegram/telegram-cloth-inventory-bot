# Telegram Cloth Inventory Bot

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
- `/profile` - Display your registered profile information
- `/admin` - Admin-only panel (requires an admin user role)
- `/status` - Check MongoDB connection status

## Category & Product Commands

- `/addcategory <category_name>` (admin) — Create a new category. Example: `/addcategory Men`
- `/editcategory <category_name> <new_name>` (admin) — Rename a category. Example: `/editcategory Men Mens`
- `/deletecategory <category_name>` (admin) — Delete a category by name. Example: `/deletecategory Mens`
- `/addproduct <name> <category> <price> [quantity] [imageUrl]` (admin) — Add a product (category must exist). Example: `/addproduct Shirt Men 19.99 10 https://example.com/shirt.png`
- `/products` (registered users) — List all products. Each product shows an `ID` (human-friendly `product_id` when available), name, category, price, quantity, stock status, and image URL when set.
- `Show product` (bottom keyboard button) — Open a category menu where each button shows one category plus total items in that category, then choose a category to view its products.
- `/product <name|id>` (registered users) — Show product details. Example: `/product Shirt` or `/product 0003` (detail output includes the product `ID`). Admins also see an `Edit Product` button on the product detail screen to modify the product; when editing, admins can send a photo directly or provide an image URL.
- `/search <id|name|category|price> <query>` (registered users) — Search products by the given field.
   - Example: `/search id 0001`
   - Example: `/search name Shirt`
   - Example: `/search category Men`
   - Example: `/search price 19.99`
   - Example: `/editproduct 0001 price 24.99`
   - Example: `/editproduct 0001 image https://example.com/shirt.png`
- `/order <product_id|name> <quantity>` (registered users) — Place an order for a product. Example: `/order 0001 2` or `/order Shirt 2`. After placing an order, the bot sends a local QR payment image from `assets/QRpayment/QRpayment.png` and a Confirm button. Payment must be confirmed within 2 minutes or the order expires and stock is restored.
- `/orders` (registered users) — View your order history. The bot returns up to 4 orders per page and displays a `See 4 more order history` button to load the next page.
- `/deleteproduct <productId>` (admin) — Delete a product by id. Example: `/deleteproduct 0001`
- `/addstock <productId> <amount>` (admin) — Increase a product's stock by `<amount>`.
  - Use the `ID` shown by `/products`. `/addstock` accepts either the human-friendly `product_id` (e.g. `0001`) or the Mongo `_id`.
- `/outstock <productId> <amount>` (admin) — Decrease a product's stock by `<amount>`. Quantity will not go below zero.
- `/clearstock <productId>` (admin) — Set a product's quantity to zero.

Access levels:

- Admin-only commands: `/addcategory`, `/addproduct`, `/editproduct`, `/deleteproduct`, `/addstock`, `/outstock`, `/clearstock` — only users with role `admin` can run these.
- Registered users (staff): `/categories`, `/products`, `/product` — these require the user to be registered via `/start`.

Notes on `ID` and migration:
- New products are assigned a sequential zero-padded `product_id` (e.g. `0001`, `0002`). Existing products created before this change will not have a `product_id` until they are recreated or updated.
- If you want me to assign `product_id` values to existing products automatically, I can add a one-time migration script that enumerates products and assigns IDs; tell me if you want that.

Access levels:

- Admin-only commands: `/addcategory`, `/addproduct`, `/editproduct`, `/deleteproduct` — only users with role `admin` can run these.
- Registered users (staff): `/categories`, `/products`, `/product` — these require the user to be registered via `/start`.

## Admin Commands

- `/total-user` - Display the total number of registered users
- `/view-<user_id>` - View a specific user's profile information
  - Example: `/view-1655512983`
- `/promote-<user_id>` - Promote a user to admin
  - Example: `/promote-1655512983`

## Role-Based Access Control

The bot has two user roles:

### Staff (default)
- Can register and update their profile
- Can view their own profile (`/profile`)
- Can check database status (`/status`)

### Admin
- Has access to all staff commands
- Can access the admin panel (`/admin`)
- Can be promoted/demoted by modifying the `role` field in the MongoDB `users` collection

### Promoting/Demoting Users

To change a user's role, connect to your MongoDB database and update the `users` collection:

```javascript
// Promote user to admin
db.users.updateOne({ telegram_id: <USER_ID> }, { $set: { role: 'admin' } })

// Demote admin to staff
db.users.updateOne({ telegram_id: <USER_ID> }, { $set: { role: 'staff' } })
```

## Clearing the database

If you want to reset user data before testing, run:

```bash
npm run clear-db
```

## Promoting a User to Admin

To promote a registered user to admin, use:

```bash
npm run promote-admin <telegram_id>
```

Example:

```bash
npm run promote-admin 1655512983
```

This is useful for making the first user an admin before any admin commands are available in the bot.

## Notes

- The bot uses MongoDB via `MONGO_URI` and Telegraf via `BOT_TOKEN`.
- Add or promote an admin user by adjusting the `role` field in the MongoDB `users` collection.
- Do not commit `.env` to source control; the repository now ignores it via `.gitignore`.
