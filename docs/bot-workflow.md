# Bot Workflow

This page describes how the Telegram Cloth Inventory Bot processes messages, button actions, and order flows.

## 1. Message flow

The bot handles the following user interactions:

- `/start` — Registers users or opens the main menu.
- Incoming text messages are checked for pending flows:
  - pending order address entry
  - profile edit
  - product edit
  - category edit
  - admin flow actions
  - admin stock actions
  - registration flow

If the user is not in a pending session flow, the bot passes the message to normal handlers or command routes.

## 2. Main command handlers

Registered user commands:

- `/search` — Search products.
- `/cart` — Show the shopping cart.
- `📦 បង្ហាញផលិតផល​ 📦` — Browse categories.
- `ប្រវត្តិនៃការបញ្ជាទិញ` — View order history.
- `🕵️‍♀️ profile 🕵️‍♀️` — Show profile details.

Admin-only commands and buttons:

- `/admin` — Open admin panel.
- `/totaluser` — Count registered users.
- `/view-<user_id>` — View a user profile.
- `/promote-<user_id>` — Promote a user to admin.
- `📦 គ្រប់គ្រងផលិតផល 📦` — Open admin product management.
- `គ្រប់គ្រងប្រភេទផលិតផល` — Manage categories.
- `គ្រប់គ្រងការបញ្ជាទិញ` — Manage orders.

## 3. Callback flows

The bot responds to callback queries with structured callback data.

Common callback types:

- `confirm_order:` — Confirm a generated order.
- `order_address:` — Select profile address or enter a new address.
- `edit_profile:` / `confirm_edit:` — Edit profile flows.
- `edit_product:` / `confirm_update:` — Product edit flows.
- `admin:` — Admin menu and creation flows.
- `admin_order_status:` / `admin_order_status_more:` / `admin_order_change:` — Order management controls.
- `admin_product:` / `admin_stock:` — Product stock and admin product actions.
- `category_info:` / `category_history_edit:` / `category_edit:` / `category_delete:` / `category_confirm_edit:` — Category admin actions.
- `category_show:` — Show products for a category.
- `add_cart:` — Add a product to the cart.
- `order_now:` — Start a product order.
- `order_history_status:` / `order_history_more:` — Paginate and filter order history.
- `view_cart` — Show the cart screen.
- `clear_cart` — Clear the cart.
- `order_all_cart` — Place an order for all cart items.

## 4. Order confirmation and payment

- Orders are created after the user confirms items and selects an address.
- The bot sends an order summary and payment request.
- Payment must be confirmed within the bot interface.
- If the order is not confirmed within the expiration period, the reserved stock is restored.

## 5. Admin notification flow

- When a user confirms a purchase, the bot notifies admins.
- Admin notifications include order details and a button to contact the admin owner if configured.

## 6. Session state

The bot uses session state to manage in-progress flows:

- `pendingOrder` — Waiting for order address or confirmation.
- `editProfile` — Profile editing flow.
- `editProduct` — Editing product details.
- `categoryEdit` — Category management flow.
- `adminFlow` — Admin product/category creation flow.
- `adminStock` — Admin stock actions.
- `registration` — User registration flow.

## 7. Best practices for bot maintenance

- Keep `BOT_TOKEN` and `MONGO_URI` up to date in `.env`.
- Use the admin panel for content changes and inventory updates.
- Monitor order history and pending orders from the admin order manager.
