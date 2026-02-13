import type { IProjectRepository, IProjectMemberRepository } from "../repositories/interfaces";
import type { IStatusRepository } from "../repositories/interfaces";
import type { ProjectSelect } from "../db/schema";
import { generateId, now } from "../utils/id";

export class ProjectService {
    constructor(
        private projectRepo: IProjectRepository,
        private memberRepo: IProjectMemberRepository,
        private statusRepo: IStatusRepository
    ) { }

    async listProjects(userId: string): Promise<ProjectSelect[]> {
        return this.projectRepo.findByUserId(userId);
    }

    async getProject(projectId: string, userId: string): Promise<ProjectSelect> {
        const project = await this.projectRepo.findById(projectId);
        if (!project) throw new Error("Project not found");

        const membership = await this.memberRepo.findByUserAndProject(userId, projectId);
        if (!membership) throw new Error("Not a member of this project");

        return project;
    }

    async createProject(name: string, description: string, ownerId: string): Promise<ProjectSelect> {
        const project = await this.projectRepo.create({
            id: generateId(),
            name,
            description,
            ownerId,
            archived: 0,
            createdAt: now(),
        });

        // Add owner as a member with 'owner' role
        await this.memberRepo.create({
            id: generateId(),
            projectId: project.id,
            userId: ownerId,
            role: "owner",
            createdAt: now(),
        });

        // Create default statuses
        const defaultStatuses = ["To Do", "In Progress", "Done"];
        for (let i = 0; i < defaultStatuses.length; i++) {
            await this.statusRepo.create({
                id: generateId(),
                projectId: project.id,
                name: defaultStatuses[i],
                position: i,
            });
        }

        return project;
    }

    async updateProject(
        projectId: string,
        userId: string,
        data: { name?: string; description?: string; color?: string }
    ): Promise<ProjectSelect> {
        await this.assertMembership(projectId, userId);
        const updated = await this.projectRepo.update(projectId, data);
        if (!updated) throw new Error("Project not found");
        return updated;
    }

    async archiveProject(projectId: string, userId: string): Promise<void> {
        await this.assertOwnership(projectId, userId);
        await this.projectRepo.update(projectId, { archived: 1 });
    }

    async deleteProject(projectId: string, userId: string): Promise<void> {
        await this.assertOwnership(projectId, userId);
        await this.projectRepo.delete(projectId);
    }

    private async assertMembership(projectId: string, userId: string): Promise<void> {
        const membership = await this.memberRepo.findByUserAndProject(userId, projectId);
        if (!membership) throw new Error("Not a member of this project");
    }

    private async assertOwnership(projectId: string, userId: string): Promise<void> {
        const membership = await this.memberRepo.findByUserAndProject(userId, projectId);
        if (!membership || membership.role !== "owner") throw new Error("Only project owner can do this");
    }
}
