import { z } from 'zod';

export const createLabelSchema = z.object({
    name: z.string().trim().min(1, 'Label name is required').max(50),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
});
