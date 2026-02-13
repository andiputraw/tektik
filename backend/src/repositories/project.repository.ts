import { eq, and } from "drizzle-orm";
import { projects, projectMembers } from "../db/schema";
import type { ProjectSelect, ProjectInsert } from "../db/schema";
import type { Database, IProjectRepository } from "./interfaces";

export class ProjectRepository implements IProjectRepository {
    constructor(private db: Database) { }

    async findById(id: string): Promise<ProjectSelect | undefined> {
        const result = await this.db.select().from(projects).where(eq(projects.id, id)).limit(1);
        return result[0];
    }

    async findByUserId(userId: string): Promise<ProjectSelect[]> {
        // Return all projects where the user is a member
        const result = await this.db
            .select({ project: projects })
            .from(projects)
            .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
            .where(and(eq(projectMembers.userId, userId), eq(projects.archived, 0)));
        return result.map((r) => r.project);
    }

    async create(project: ProjectInsert): Promise<ProjectSelect> {
        const result = await this.db.insert(projects).values(project).returning();
        return result[0];
    }

    async update(id: string, data: Partial<ProjectInsert>): Promise<ProjectSelect | undefined> {
        const result = await this.db.update(projects).set(data).where(eq(projects.id, id)).returning();
        return result[0];
    }

    async delete(id: string): Promise<void> {
        await this.db.delete(projects).where(eq(projects.id, id));
    }
}
