
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export const isValidPHPhoneNumber = (phoneNumber) => {
  // Accepts: 09xxxxxxxxx (11 digits) or +639xxxxxxxxx (13 digits)
  // Removes spaces, dashes, parentheses
  const cleaned = String(phoneNumber).replace(/[\s\-\(\)]/g, '');
  const re = /^(09|\+639)\d{9}$/;
  return re.test(cleaned);
};
