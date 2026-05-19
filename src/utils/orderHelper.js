const pendingOrderTimers = new Map();

const schedulePendingOrderExpiration = (orderId, expiresAt, onExpire) => {
  const orderKey = orderId.toString();
  if (pendingOrderTimers.has(orderKey)) {
    clearPendingOrderExpiration(orderId);
  }

  const delay = expiresAt - Date.now();
  if (delay <= 0) {
    onExpire();
    return null;
  }

  const timer = setTimeout(async () => {
    pendingOrderTimers.delete(orderKey);
    try {
      await onExpire();
    } catch (error) {
      console.error('Failed to expire pending order', error);
    }
  }, delay);

  pendingOrderTimers.set(orderKey, timer);
  return timer;
};

const clearPendingOrderExpiration = (orderId) => {
  const orderKey = orderId.toString();
  const timer = pendingOrderTimers.get(orderKey);
  if (!timer) {
    return false;
  }

  clearTimeout(timer);
  pendingOrderTimers.delete(orderKey);
  return true;
};

module.exports = {
  schedulePendingOrderExpiration,
  clearPendingOrderExpiration
};
