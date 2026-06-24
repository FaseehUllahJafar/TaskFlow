import { and, asc, eq } from 'drizzle-orm';
import { db } from '../../config/db';
import { labels, workspaceMembers } from '../../db/schema';
import AppError from '../../utils/AppError';

const requireMember = async (workspaceId: string, userId: string) => {
    const member = await db.query.workspaceMembers.findFirst({
        where: and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)),
    });
    if (!member) {
        throw new AppError('You are not a member of this workspace', 403);
    }
    return member;
};

export const getWorkspaceLabels = async (workspaceId: string, userId: string) => {
    await requireMember(workspaceId, userId);
    return db.query.labels.findMany({
        where: eq(labels.workspaceId, workspaceId),
        orderBy: [asc(labels.name)],
    });
};

export const createLabel = async (
    workspaceId: string,
    userId: string,
    data: { name: string; color: string }
) => {
    const member = await requireMember(workspaceId, userId);
    if (member.role === 'client') {
        throw new AppError('Clients cannot create labels', 403);
    }

    const [label] = await db
        .insert(labels)
        .values({ workspaceId, name: data.name, color: data.color })
        .returning();
    return label;
};
