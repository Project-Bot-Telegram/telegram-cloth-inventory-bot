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

## Clearing the database

If you want to reset user data before testing, run:

```bash
npm run clear-db
```

## Notes

- The bot uses MongoDB via `MONGO_URI` and Telegraf via `BOT_TOKEN`.
- Add or promote an admin user by adjusting the `role` field in the MongoDB `users` collection.
- Do not commit `.env` to source control; the repository now ignores it via `.gitignore`.
