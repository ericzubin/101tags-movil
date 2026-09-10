export type CustomerUser = {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly phone?: string | null;
  readonly email_verified_at?: string | null;
  readonly created_at?: string;
  readonly updated_at?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
  device_name?: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
};

export type AuthSession = {
  access_token: string;
  user: CustomerUser;
  expires_at?: string;
};

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'TOKEN_EXPIRED'
  | 'UNKNOWN';

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  readonly status: number;
  readonly details?: Record<string, string[]>;

  constructor(
    code: AuthErrorCode,
    message: string,
    status: number,
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
