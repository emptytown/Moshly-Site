export const MIN_PASSWORD_LENGTH = 12;

export function validatePassword(password) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (!/[^a-zA-Z]/.test(password)) {
    return 'Password must contain at least one non-letter character';
  }
  return null;
}
