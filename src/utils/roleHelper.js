const User = require('../models/User');

/**
 * Check if user has a specific role
 * @param {number} telegramId - User's Telegram ID
 * @param {string} requiredRole - Required role (e.g., 'admin', 'staff')
 * @returns {Promise<boolean>}
 */
const hasRole = async (telegramId, requiredRole) => {
  const user = await User.findOne({ telegram_id: telegramId });
  return user && user.role === requiredRole;
};

/**
 * Promote a user to admin
 * @param {number} telegramId - User's Telegram ID
 * @returns {Promise<boolean>} - Success status
 */
const promoteToAdmin = async (telegramId) => {
  const user = await User.findOneAndUpdate(
    { telegram_id: telegramId },
    { role: 'admin' },
    { new: true }
  );
  return user ? true : false;
};

/**
 * Demote admin to staff
 * @param {number} telegramId - User's Telegram ID
 * @returns {Promise<boolean>} - Success status
 */
const demoteToStaff = async (telegramId) => {
  const user = await User.findOneAndUpdate(
    { telegram_id: telegramId },
    { role: 'staff' },
    { new: true }
  );
  return user ? true : false;
};

module.exports = {
  hasRole,
  promoteToAdmin,
  demoteToStaff
};
