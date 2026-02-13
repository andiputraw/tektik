import type { IStatusRepository, IProjectMemberRepository } from "../repositories/interfaces";
import type { StatusSelect } from "../db/schema";
import { generateId } from "../utils/id";

export class StatusService {
    constructor(
        private statusRepo: IStatusRepository,
        private memberRepo: IProjectMemberRepository
    ) { }

    async listStatuses(projectId: string, userId: string): Promise<StatusSelect[]> {
        await this.assertMembership(projectId, userId);
        return this.statusRepo.findByProjectId(projectId);
    }

    async createStatus(
        projectId: string,
        userId: string,
        data: { name: string; position?: number }
    ): Promise<StatusSelect> {
        await this.assertMembership(projectId, userId);
        return this.statusRepo.create({
            id: generateId(),
            projectId,
            name: data.name,
            position: data.position ?? 0,
        });
    }

    async updateStatus(
        statusId: string,
        userId: string,
        data: { name?: string; position?: number }
    ): Promise<StatusSelect> {
        const status = await this.statusRepo.findById(statusId);
        if (!status) throw new Error("Status not found");
        await this.assertMembership(status.projectId, userId);

        const updated = await this.statusRepo.update(statusId, data);
        if (!updated) throw new Error("Status not found");
        return updated;
    }

    async deleteStatus(statusId: string, userId: string): Promise<void> {
        const status = await this.statusRepo.findById(statusId);
        if (!status) throw new Error("Status not found");
        await this.assertMembership(status.projectId, userId);
        await this.statusRepo.delete(statusId);
    }

    private async assertMembership(projectId: string, userId: string): Promise<void> {
        const membership = await this.memberRepo.findByUserAndProject(userId, projectId);
        if (!membership) throw new Error("Not a member of this project");
    }
}
