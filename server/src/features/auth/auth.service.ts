import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { and, eq } from 'drizzle-orm';
import { db } from '../../config/db';
import { refreshTokens, users } from '../../db/schema';
import AppError from '../../utils/AppError';
import { generateRandomToken, hashToken } from '../../utils/crypto';

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const hashPassword = (password: string): Promise<string> => bcrypt.hash(password, BCRYPT_ROUNDS);

export const comparePassword = (password: string, hash: string): Promise<boolean> =>
    bcrypt.compare(password, hash);

const signAccessToken = (userId: string, email: string): string => {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
        throw new Error('JWT_ACCESS_SECRET is not configured');
    }
    const expiresIn = (process.env.JWT_ACCESS_EXPIRATION || '15m') as SignOptions['expiresIn'];
    return jwt.sign({ id: userId, email }, secret, { expiresIn });
};

/**
 * Issues an access token plus an opaque refresh token. Only the SHA-256 hash of the
 * refresh token is stored. Tokens issued from the same login share a family id so a
 * replayed token can invalidate the whole chain.
 */
export const createTokenPair = async (userId: string, familyId: string = generateRandomToken()) => {
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) {
        throw new AppError('User not found', 404);
    }

    const refreshToken = generateRandomToken();
    await db.insert(refreshTokens).values({
        userId,
        tokenHash: hashToken(refreshToken),
        familyId,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });

    return {
        accessToken: signAccessToken(user.id, user.email),
        refreshToken,
    };
};

export const rotateRefreshToken = async (token: string) => {
    const stored = await db.query.refreshTokens.findFirst({
        where: eq(refreshTokens.tokenHash, hashToken(token)),
    });

    if (!stored) {
        throw new AppError('Invalid refresh token', 401);
    }

    if (stored.isRevoked) {
        // A token that was already rotated is being replayed: treat the family as stolen.
        await db
            .update(refreshTokens)
            .set({ isRevoked: true })
            .where(eq(refreshTokens.familyId, stored.familyId));
        throw new AppError('Refresh token reuse detected', 401);
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
        throw new AppError('Refresh token expired', 401);
    }

    await db.update(refreshTokens).set({ isRevoked: true }).where(eq(refreshTokens.id, stored.id));

    return createTokenPair(stored.userId, stored.familyId);
};

export const revokeRefreshToken = async (token: string): Promise<void> => {
    await db
        .update(refreshTokens)
        .set({ isRevoked: true })
        .where(eq(refreshTokens.tokenHash, hashToken(token)));
};

export const revokeAllUserTokens = async (userId: string): Promise<void> => {
    await db
        .update(refreshTokens)
        .set({ isRevoked: true })
        .where(and(eq(refreshTokens.userId, userId), eq(refreshTokens.isRevoked, false)));
};
