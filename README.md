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

- `/start` - Register new users or welcome returning users by full name
- `/profile` - Display your registered profile information
- `/admin` - Admin-only panel (requires an admin user role)
- `/status` - Check MongoDB connection status

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
