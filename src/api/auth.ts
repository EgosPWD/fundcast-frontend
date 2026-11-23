import { apiRequest } from './client';
import type { TokenResponse, UserResponse } from './types';

export function login(email: string, password: string): Promise<TokenResponse> {
  return apiRequest<TokenResponse>('/auth/login', { method: 'POST', json: { email, password } });
}

export function register(email: string, password: string): Promise<UserResponse> {
  return apiRequest<UserResponse>('/auth/register', { method: 'POST', json: { email, password } });
}
