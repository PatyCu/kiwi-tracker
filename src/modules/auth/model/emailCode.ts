/** Matches otp_length in supabase/config.toml and on the shared project. */
export const EMAIL_CODE_LENGTH = 6;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_PATTERN = new RegExp(`^\\d{${EMAIL_CODE_LENGTH}}$`);

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

/** A light format check so obvious typos fail before an email is sent. The server has the final say. */
export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

/** Keeps only digits, so pasted codes with spaces or dashes still work. */
export function normalizeEmailCode(input: string): string {
  return input.replace(/\D/g, '').slice(0, EMAIL_CODE_LENGTH);
}

export function isValidEmailCode(code: string): boolean {
  return CODE_PATTERN.test(code);
}
