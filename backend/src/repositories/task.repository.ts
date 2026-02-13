import { eq, and, asc, getTableColumns } from "drizzle-orm";
import { tasks, projects, statuses } from "../db/schema";
import type { TaskSelect, TaskInsert } from "../db/schema";
import type { Database, ITaskRepository } from "./interfaces";

export class TaskRepository implements ITaskRepository {
    constructor(private db: Database) { }

    async findByProjectId(
        projectId: string,
        filters?: { statusId?: string; assigneeId?: string }
    ): Promise<TaskSelect[]> {
        const conditions = [eq(tasks.projectId, projectId)];
        if (filters?.statusId) conditions.push(eq(tasks.statusId, filters.statusId));
        if (filters?.assigneeId) conditions.push(eq(tasks.assigneeId, filters.assigneeId));

        return this.db
            .select()
            .from(tasks)
            .where(and(...conditions))
            .orderBy(asc(tasks.position));
    }

    async findByAssigneeId(userId: string): Promise<(TaskSelect & { projectName: string; statusName: string })[]> {
        const result = await this.db
            .select({
                ...getTableColumns(tasks),
                projectName: projects.name,
                statusName: statuses.name
            })
            .from(tasks)
            .innerJoin(projects, eq(tasks.projectId, projects.id))
            .innerJoin(statuses, eq(tasks.statusId, statuses.id))
            .where(eq(tasks.assigneeId, userId))
            .orderBy(asc(tasks.dueDate), asc(tasks.position));

        return result;
    }

    async findById(id: string): Promise<TaskSelect | undefined> {
        const result = await this.db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
        return result[0];
    }

    async create(task: TaskInsert): Promise<TaskSelect> {
        const result = await this.db.insert(tasks).values(task).returning();
        return result[0];
    }

    async update(id: string, data: Partial<TaskInsert>): Promise<TaskSelect | undefined> {
        const result = await this.db.update(tasks).set(data).where(eq(tasks.id, id)).returning();
        return result[0];
    }

    async delete(id: string): Promise<void> {
        await this.db.delete(tasks).where(eq(tasks.id, id));
    }
}
