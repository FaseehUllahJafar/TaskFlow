import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';

const mocks = vi.hoisted(() => ({
    findUser: vi.fn(),
    findToken: vi.fn(),
    insertValues: vi.fn(),
    updateSet: vi.fn(),
    updateWhere: vi.fn(),
}));

vi.mock('../../config/db', () => ({
    db: {
        query: {
            users: { findFirst: mocks.findUser },
            refreshTokens: { findFirst: mocks.findToken },
        },
        insert: () => ({ values: mocks.insertValues }),
        update: () => ({
            set: (values: unknown) => {
                mocks.updateSet(values);
                return { where: mocks.updateWhere };
            },
        }),
    },
}));

import {
    comparePassword,
    createTokenPair,
    hashPassword,
    revokeAllUserTokens,
    rotateRefreshToken,
} from './auth.service';
import { hashToken } from '../../utils/crypto';

const SECRET = 'unit-test-secret-0123456789abcdef';

describe('auth.service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('JWT_ACCESS_SECRET', SECRET);
        mocks.insertValues.mockResolvedValue(undefined);
        mocks.updateWhere.mockResolvedValue(undefined);
        mocks.findUser.mockResolvedValue({ id: 'user-1', email: 'ada@example.com' });
    });

    describe('passwords', () => {
        it('hashes with bcrypt and verifies the right password only', async () => {
            const hash = await hashPassword('correct horse battery');

            expect(hash).not.toContain('correct horse battery');
            await expect(comparePassword('correct horse battery', hash)).resolves.toBe(true);
            await expect(comparePassword('wrong password', hash)).resolves.toBe(false);
        });
    });

    describe('createTokenPair', () => {
        it('signs an access token carrying the user id and email', async () => {
            const { accessToken } = await createTokenPair('user-1');
            const payload = jwt.verify(accessToken, SECRET) as { id: string; email: string };

            expect(payload.id).toBe('user-1');
            expect(payload.email).toBe('ada@example.com');
        });

        it('stores only the hash of the refresh token', async () => {
            const { refreshToken } = await createTokenPair('user-1', 'family-1');
            const stored = mocks.insertValues.mock.calls[0][0];

            expect(stored.tokenHash).toBe(hashToken(refreshToken));
            expect(stored.tokenHash).not.toBe(refreshToken);
            expect(stored.familyId).toBe('family-1');
            expect(stored.userId).toBe('user-1');
            expect(stored.expiresAt.getTime()).toBeGreaterThan(Date.now());
        });

        it('rejects when the user no longer exists', async () => {
            mocks.findUser.mockResolvedValue(undefined);

            await expect(createTokenPair('ghost')).rejects.toMatchObject({ statusCode: 404 });
        });

        it('fails loudly when the signing secret is missing', async () => {
            vi.stubEnv('JWT_ACCESS_SECRET', '');

            await expect(createTokenPair('user-1')).rejects.toThrow('JWT_ACCESS_SECRET');
        });
    });

    describe('rotateRefreshToken', () => {
        const live = {
            id: 'row-1',
            userId: 'user-1',
            familyId: 'family-1',
            isRevoked: false,
            expiresAt: new Date(Date.now() + 60_000),
        };

        it('revokes the used token and issues a new one in the same family', async () => {
            mocks.findToken.mockResolvedValue(live);

            const result = await rotateRefreshToken('presented-token');

            expect(mocks.updateSet).toHaveBeenCalledWith({ isRevoked: true });
            expect(mocks.insertValues.mock.calls[0][0].familyId).toBe('family-1');
            expect(result.accessToken).toBeTruthy();
            expect(result.refreshToken).toBeTruthy();
        });

        it('treats an unknown token as invalid', async () => {
            mocks.findToken.mockResolvedValue(undefined);

            await expect(rotateRefreshToken('nope')).rejects.toMatchObject({ statusCode: 401 });
            expect(mocks.insertValues).not.toHaveBeenCalled();
        });

        it('revokes the whole family when a rotated token is replayed', async () => {
            mocks.findToken.mockResolvedValue({ ...live, isRevoked: true });

            await expect(rotateRefreshToken('replayed')).rejects.toMatchObject({
                statusCode: 401,
                message: 'Refresh token reuse detected',
            });
            expect(mocks.updateSet).toHaveBeenCalledWith({ isRevoked: true });
            expect(mocks.insertValues).not.toHaveBeenCalled();
        });

        it('rejects an expired token without issuing a new one', async () => {
            mocks.findToken.mockResolvedValue({ ...live, expiresAt: new Date(Date.now() - 1) });

            await expect(rotateRefreshToken('old')).rejects.toMatchObject({
                statusCode: 401,
                message: 'Refresh token expired',
            });
            expect(mocks.insertValues).not.toHaveBeenCalled();
        });
    });

    describe('revokeAllUserTokens', () => {
        it('marks every active token for the user as revoked', async () => {
            await revokeAllUserTokens('user-1');

            expect(mocks.updateSet).toHaveBeenCalledWith({ isRevoked: true });
            expect(mocks.updateWhere).toHaveBeenCalledTimes(1);
        });
    });
});
