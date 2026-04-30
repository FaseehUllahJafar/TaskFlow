import { and, eq } from 'drizzle-orm';
import { db } from '../config/db';
import { projects, workspaceMembers } from '../db/schema';

/** Returns the user's workspace membership for the workspace that owns the project, if any. */
export const getProjectMembership = async (projectId: string, userId: string) => {
    const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
        columns: { workspaceId: true },
    });

    if (!project) {
        return undefined;
    }

    return db.query.workspaceMembers.findFirst({
        where: and(
            eq(workspaceMembers.workspaceId, project.workspaceId),
            eq(workspaceMembers.userId, userId)
        ),
    });
};
