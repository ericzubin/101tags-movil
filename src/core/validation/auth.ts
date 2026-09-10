/**
 * Pure validation helpers for login + register forms.
 *
 * Source of truth: `.spec/2026-09-09-m1-3-login-register-ux.md §Validation contract`.
 *
 * Design notes:
 * - Pure functions: no I/O, no side effects. Trivially unit-testable.
 * - Errors are **strings** in es-MX (per UX contract); the UI renders them
 *   inline next to each `TextInput`.
 * - No input normalization (no `trim()`): the backend is the authority on
 *   value shape; the client only blocks the obviously broken payloads.
 */

export type AuthFieldName = 'email' | 'password' | 'name' | 'passwordConfirmation';

export type FieldErrors = Partial<Record<AuthFieldName, string>>;

export type ValidationResult =
  | { ok: true }
  | { ok: false; fieldErrors: FieldErrors };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MIN_NAME_LENGTH = 2;

export type LoginInput = {
  email: string;
  password: string;
};

export function validateLogin(input: LoginInput): ValidationResult {
  const fieldErrors: FieldErrors = {};

  if (!input.email || input.email.length === 0) {
    fieldErrors.email = 'El correo es obligatorio';
  } else if (!EMAIL_REGEX.test(input.email)) {
    fieldErrors.email = 'Ingresa un correo válido';
  }

  if (!input.password || input.password.length === 0) {
    fieldErrors.password = 'La contraseña es obligatoria';
  } else if (input.password.length < MIN_PASSWORD_LENGTH) {
    fieldErrors.password = 'La contraseña debe tener al menos 8 caracteres';
  }

  if (Object.keys(fieldErrors).length === 0) {
    return { ok: true };
  }
  return { ok: false, fieldErrors };
}

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
};

export function validateRegister(input: RegisterInput): ValidationResult {
  const fieldErrors: FieldErrors = {};

  if (!input.name || input.name.length === 0) {
    fieldErrors.name = 'El nombre es obligatorio';
  } else if (input.name.length < MIN_NAME_LENGTH) {
    fieldErrors.name = 'El nombre debe tener al menos 2 caracteres';
  }

  if (!input.email || input.email.length === 0) {
    fieldErrors.email = 'El correo es obligatorio';
  } else if (!EMAIL_REGEX.test(input.email)) {
    fieldErrors.email = 'Ingresa un correo válido';
  }

  if (!input.password || input.password.length === 0) {
    fieldErrors.password = 'La contraseña es obligatoria';
  } else if (input.password.length < MIN_PASSWORD_LENGTH) {
    fieldErrors.password = 'La contraseña debe tener al menos 8 caracteres';
  }

  if (input.password !== input.passwordConfirmation) {
    fieldErrors.passwordConfirmation = 'Las contraseñas no coinciden';
  }

  if (Object.keys(fieldErrors).length === 0) {
    return { ok: true };
  }
  return { ok: false, fieldErrors };
}
