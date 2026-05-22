# Admin Guide

This page explains the admin role, admin-only controls, and management workflows.

## 1. Admin role overview

Admins have all regular user permissions plus access to inventory and order management tools.

Admin-specific buttons include:

- `📦 គ្រប់គ្រងផលិតផល 📦` — Open admin product management.
- `គ្រប់គ្រងប្រភេទផលិតផល` — Manage product categories.
- `គ្រប់គ្រងការបញ្ជាទិញ` — Manage order status.

Admin-only commands:

- `/total-user` — Show total number of registered users.
- `/view-<user_id>` — View a user profile.
- `/promote-<user_id>` — Promote a user to admin.

## 2. Product management

### Add new products

- Open the admin product menu.
- Start a guided product creation flow.
- The bot asks for:
  - name
  - category
  - price
  - quantity
  - image
- Confirm the details to create the product.

### Edit products

- Open a category and select a product.
- Use the `កែប្រែ` button to update product details.
- You can edit:
  - name
  - category
  - price
  - quantity
  - image

### Delete products

- Use the `លុប` button from a product detail screen to remove a product.

## 3. Stock management

Admin pages show stock actions for products.

- `ស្តុក` — Open the stock management view.
- Inside stock management, you can:
  - Add stock
  - Remove stock
  - Clear stock
- Stock history is recorded for each product.

## 4. Category management

- Use `គ្រប់គ្រងប្រភេទផលិតផល` to open category admin.
- You can:
  - add new categories
  - edit category names
  - delete categories
  - view category history

## 5. Order management

- Use `គ្រប់គ្រងការបញ្ជាទិញ` to manage orders.
- Admins can review order statuses and update orders.
- Admins receive notifications when orders are confirmed.

## 6. Admin commands in detail

- `/total-user`
  - Returns the total count of registered bot users.

- `/view-<user_id>`
  - Example: `/view-1655512983`
  - Shows profile details for the specified user.

- `/promote-<user_id>`
  - Example: `/promote-1655512983`
  - Promotes the specified user to admin.

## 7. Admin workflow tips

- Use the button-driven admin menus for faster management.
- If a product is missing from a category, verify it exists and has the correct category assignment.
- Use order management to track pending and confirmed orders.

## 8. Help and support

- Admins can still send `help` or `support` for bot guidance.
- Support text includes instructions for both regular users and admins.
