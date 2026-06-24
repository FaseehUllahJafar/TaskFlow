import { and, count, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { db } from '../../config/db';
import { projects, taskAssignees, tasks, workspaceMembers, workspaces } from '../../db/schema';

export const getDashboard = async (userId: string) => {
    const memberships = await db.query.workspaceMembers.findMany({
        where: eq(workspaceMembers.userId, userId),
        columns: { workspaceId: true },
    });
    const workspaceIds = memberships.map((m) => m.workspaceId);

    if (workspaceIds.length === 0) {
        return {
            stats: { workspaces: 0, projects: 0, openTasks: 0, completedTasks: 0, assignedToMe: 0 },
            recentProjects: [],
        };
    }

    const projectRows = await db
        .select({
            id: projects.id,
            name: projects.name,
            color: projects.color,
            workspaceId: projects.workspaceId,
            workspaceName: workspaces.name,
        })
        .from(projects)
        .innerJoin(workspaces, eq(workspaces.id, projects.workspaceId))
        .where(and(inArray(projects.workspaceId, workspaceIds), eq(projects.isArchived, false)))
        .orderBy(desc(projects.createdAt));

    const projectIds = projectRows.map((p) => p.id);

    const taskCounts = projectIds.length
        ? await db
              .select({
                  projectId: tasks.projectId,
                  open: sql<number>`count(*) filter (where ${tasks.completedAt} is null)::int`,
                  done: sql<number>`count(*) filter (where ${tasks.completedAt} is not null)::int`,
              })
              .from(tasks)
              .where(inArray(tasks.projectId, projectIds))
              .groupBy(tasks.projectId)
        : [];
    const countsByProject = new Map(taskCounts.map((c) => [c.projectId, c]));

    const [mine] = projectIds.length
        ? await db
              .select({ value: count() })
              .from(taskAssignees)
              .innerJoin(tasks, eq(tasks.id, taskAssignees.taskId))
              .where(
                  and(
                      eq(taskAssignees.userId, userId),
                      isNull(tasks.completedAt),
                      inArray(tasks.projectId, projectIds)
                  )
              )
        : [{ value: 0 }];

    return {
        stats: {
            workspaces: workspaceIds.length,
            projects: projectRows.length,
            openTasks: taskCounts.reduce((sum, c) => sum + c.open, 0),
            completedTasks: taskCounts.reduce((sum, c) => sum + c.done, 0),
            assignedToMe: mine.value,
        },
        recentProjects: projectRows.slice(0, 6).map((p) => ({
            ...p,
            openTasks: countsByProject.get(p.id)?.open ?? 0,
            completedTasks: countsByProject.get(p.id)?.done ?? 0,
        })),
    };
};
