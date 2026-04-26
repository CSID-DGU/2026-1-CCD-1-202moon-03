export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  birthdate: string;
  gender: 'male' | 'female';
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthSession {
  user: AuthUser;
  tokens?: AuthTokens;
}

export interface LoginResponse extends AuthSession {}

export interface SignupResponse {
  user: AuthUser;
  message: string;
}
