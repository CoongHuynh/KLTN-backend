exports.validateLength = (text, min, max) => {
  if (typeof text !== "string") {
    return false;
  }
  if (text.length > max || text.length < min) {
    return false;
  }
  return true;
};

exports.validateEmail = (email) => {
  // Use a regular expression to validate the email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
