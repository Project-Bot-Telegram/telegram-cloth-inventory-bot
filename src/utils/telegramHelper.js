const safeAnswerCbQuery = async (ctx, text = undefined, opts = {}) => {
  try {
    await ctx.answerCbQuery(text, opts);
  } catch (error) {
    const response = error && error.response;
    if (response && response.error_code === 400 && typeof response.description === 'string') {
      const message = response.description.toLowerCase();
      if (message.includes('query is too old') || message.includes('query id is invalid')) {
        return;
      }
    }
    throw error;
  }
};

module.exports = {
  safeAnswerCbQuery,
};
