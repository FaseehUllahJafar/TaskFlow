import { z } from 'zod';

// Accepts a full ISO timestamp or a plain calendar date from an <input type="date">.
const dateInput = z.union([z.iso.datetime(), z.iso.date()]);

export const createTaskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    priority: z.enum(['none', 'low', 'medium', 'high', 'urgent']).optional(),
    dueDate: dateInput.optional(),
    assigneeIds: z.array(z.string().uuid()).optional(),
    labelIds: z.array(z.string().uuid()).optional(),
});

export const updateTaskSchema = z.object({
    title: z.string().min(1, 'Title is required').optional(),
    description: z.string().optional(),
    priority: z.enum(['none', 'low', 'medium', 'high', 'urgent']).optional(),
    dueDate: dateInput.optional().nullable(),
    completedAt: dateInput.optional().nullable(),
    coverImageUrl: z.string().url().optional().nullable(),
});

export const moveTaskSchema = z.object({
    columnId: z.string().uuid(),
    position: z.number().int(),
});

export const reorderTasksSchema = z.object({
    tasks: z.array(
        z.object({
            id: z.string().uuid(),
            position: z.number().int(),
        })
    ),
});

export const addAssigneesSchema = z.object({
    userIds: z.array(z.string().uuid()),
});

export const addLabelsSchema = z.object({
    labelIds: z.array(z.string().uuid()),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;
export type AddAssigneesInput = z.infer<typeof addAssigneesSchema>;
export type AddLabelsInput = z.infer<typeof addLabelsSchema>;
