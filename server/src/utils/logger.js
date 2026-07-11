const formatMessage = (level, message) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}`;
};

const logger = {
  info: (message) => {
    console.log(formatMessage('INFO', message));
  },
  warn: (message) => {
    console.warn(formatMessage('WARN', message));
  },
  error: (message, error) => {
    if (error) {
      console.error(formatMessage('ERROR', `${message} - ${error.message}`), error.stack);
    } else {
      console.error(formatMessage('ERROR', message));
    }
  }
};

module.exports = logger;
