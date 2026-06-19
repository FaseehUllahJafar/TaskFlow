import { describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { validateBody } from './validateBody';
import { updateTaskSchema } from '../features/tasks/tasks.schema';
import { updateProfileSchema } from '../features/auth/auth.schema';
import { updateWorkspaceSchema } from '../features/workspaces/workspaces.schema';
import { publicUserColumns } from '../db/publicColumns';

const run = (schema: z.ZodType, body: unknown) => {
    const req = { body } as Request;
    const next = vi.fn();
    validateBody(schema)(req, {} as Response, next);
    return { req, next };
};

describe('validateBody', () => {
    it('replaces the body with the parsed value and drops unknown keys', () => {
        const { req, next } = run(updateProfileSchema, { fullName: 'Ada Lovelace', isVerified: true, passwordHash: 'x' });

        expect(next).toHaveBeenCalledWith();
        expect(req.body).toEqual({ fullName: 'Ada Lovelace' });
    });

    it('cannot be used to move a task to another project or column', () => {
        const { req } = run(updateTaskSchema, {
            title: 'Renamed',
            projectId: '00000000-0000-0000-0000-000000000000',
            columnId: '00000000-0000-0000-0000-000000000001',
            createdBy: '00000000-0000-0000-0000-000000000002',
        });

        expect(req.body).toEqual({ title: 'Renamed' });
    });

    it('cannot be used to change workspace ownership', () => {
        const { req } = run(updateWorkspaceSchema, { name: 'Acme', ownerId: '00000000-0000-0000-0000-000000000003' });

        expect(req.body).toEqual({ name: 'Acme' });
    });

    it('passes a 400 error to next for invalid input', () => {
        const { next } = run(updateTaskSchema, { priority: 'bogus' });

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400 });
    });

    it('accepts ISO timestamps and plain dates for due dates, and null to clear', () => {
        expect(run(updateTaskSchema, { dueDate: '2026-12-24T10:00:00.000Z' }).next).toHaveBeenCalledWith();
        expect(run(updateTaskSchema, { dueDate: '2026-12-24' }).next).toHaveBeenCalledWith();
        expect(run(updateTaskSchema, { dueDate: null }).next).toHaveBeenCalledWith();
        expect(run(updateTaskSchema, { dueDate: 'tomorrow' }).next.mock.calls[0][0]).toMatchObject({ statusCode: 400 });
    });

    it('treats a missing body as an empty object', () => {
        const { next } = run(updateTaskSchema, undefined);

        expect(next).toHaveBeenCalledWith();
    });
});

describe('publicUserColumns', () => {
    it('never includes credentials or tokens', () => {
        const exposed = Object.keys(publicUserColumns);

        expect(exposed.sort()).toEqual(['avatarUrl', 'email', 'fullName', 'id']);
        for (const secret of ['passwordHash', 'verificationToken', 'resetToken', 'resetTokenExpires', 'googleId']) {
            expect(exposed).not.toContain(secret);
        }
    });
});
