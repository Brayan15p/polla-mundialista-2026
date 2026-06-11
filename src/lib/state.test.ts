import { describe, it, expect } from 'vitest';
import { isAdmin, ADMIN_EMAILS, defaultState } from './state';

describe('isAdmin — super user gating', () => {
  it('recognises a configured admin email (case-insensitive, trimmed)', () => {
    expect(isAdmin({ email: 'apedrazacespedes@gmail.com' })).toBe(true);
    expect(isAdmin({ email: '  APEDRAZACESPEDES@GMAIL.COM ' })).toBe(true);
  });
  it('treats normal players as non-admin', () => {
    expect(isAdmin({ email: 'demo@polla.com' })).toBe(false);
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
    expect(isAdmin({ email: '' })).toBe(false);
  });
  it('ships a super user whose email is in the admin allow-list', () => {
    const su = defaultState().users.find(u => isAdmin(u));
    expect(su).toBeDefined();
    expect(ADMIN_EMAILS).toContain(su!.email.toLowerCase());
  });
});
