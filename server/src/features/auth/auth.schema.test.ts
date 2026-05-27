import { describe, expect, it } from 'vitest';
import {
    changePasswordSchema,
    loginSchema,
    registerSchema,
    resetPasswordSchema,
    updateProfileSchema,
} from './auth.schema';
import { generateClientToken, generateRandomToken, generateSlug, hashToken } from '../../utils/crypto';

describe('auth schemas', () => {
    it('accepts a valid registration', () => {
        const result = registerSchema.safeParse({
            email: 'ada@example.com',
            password: 'longenough',
            fullName: 'Ada Lovelace',
        });

        expect(result.success).toBe(true);
    });

    it.each([
        ['bad email', { email: 'not-an-email', password: 'longenough', fullName: 'Ada' }],
        ['short password', { email: 'ada@example.com', password: 'short', fullName: 'Ada' }],
        ['short name', { email: 'ada@example.com', password: 'longenough', fullName: 'A' }],
    ])('rejects registration with %s', (_label, input) => {
        expect(registerSchema.safeParse(input).success).toBe(false);
    });

    it('requires a password on login but not a minimum length', () => {
        expect(loginSchema.safeParse({ email: 'ada@example.com', password: 'x' }).success).toBe(true);
        expect(loginSchema.safeParse({ email: 'ada@example.com', password: '' }).success).toBe(false);
    });

    it('enforces the minimum length on new passwords', () => {
        expect(resetPasswordSchema.safeParse({ password: '1234567' }).success).toBe(false);
        expect(changePasswordSchema.safeParse({ currentPassword: 'old', newPassword: '1234567' }).success).toBe(false);
        expect(changePasswordSchema.safeParse({ currentPassword: 'old', newPassword: '12345678' }).success).toBe(true);
    });

    it('only accepts a URL as avatar', () => {
        expect(updateProfileSchema.safeParse({ avatarUrl: 'nope' }).success).toBe(false);
        expect(updateProfileSchema.safeParse({ avatarUrl: 'https://example.com/a.png' }).success).toBe(true);
    });
});

describe('crypto utils', () => {
    it('generates unpredictable, correctly sized tokens', () => {
        const a = generateRandomToken();
        const b = generateRandomToken();

        expect(a).toHaveLength(64);
        expect(a).not.toBe(b);
        expect(generateClientToken()).toHaveLength(32);
    });

    it('hashes deterministically without leaking the input', () => {
        expect(hashToken('abc')).toBe(hashToken('abc'));
        expect(hashToken('abc')).not.toBe('abc');
        expect(hashToken('abc')).toHaveLength(64);
    });

    it('slugifies names', () => {
        expect(generateSlug('  My Team & Co.  ')).toBe('my-team-co');
    });
});
