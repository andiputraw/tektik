import { eq, and } from "drizzle-orm";
import { projectMembers, users } from "../db/schema";
import type { ProjectMemberSelect, ProjectMemberInsert } from "../db/schema";
import type { Database, IProjectMemberRepository } from "./interfaces";

export class ProjectMemberRepository implements IProjectMemberRepository {
    constructor(private db: Database) { }

    async findByProjectId(
        projectId: string
    ): Promise<(ProjectMemberSelect & { userName: string; userEmail: string })[]> {
        const result = await this.db
            .select({
                id: projectMembers.id,
                projectId: projectMembers.projectId,
                userId: projectMembers.userId,
                role: projectMembers.role,
                createdAt: projectMembers.createdAt,
                userName: users.name,
                userEmail: users.email,
            })
            .from(projectMembers)
            .innerJoin(users, eq(projectMembers.userId, users.id))
            .where(eq(projectMembers.projectId, projectId));
        return result;
    }

    async findByUserAndProject(
        userId: string,
        projectId: string
    ): Promise<ProjectMemberSelect | undefined> {
        const result = await this.db
            .select()
            .from(projectMembers)
            .where(and(eq(projectMembers.userId, userId), eq(projectMembers.projectId, projectId)))
            .limit(1);
        return result[0];
    }

    async create(member: ProjectMemberInsert): Promise<ProjectMemberSelect> {
        const result = await this.db.insert(projectMembers).values(member).returning();
        return result[0];
    }

    async delete(id: string): Promise<void> {
        await this.db.delete(projectMembers).where(eq(projectMembers.id, id));
    }

    async deleteByUserAndProject(userId: string, projectId: string): Promise<void> {
        await this.db
            .delete(projectMembers)
            .where(and(eq(projectMembers.userId, userId), eq(projectMembers.projectId, projectId)));
    }
}
