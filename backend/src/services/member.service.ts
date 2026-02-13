import type {
    IProjectMemberRepository,
    IUserRepository,
    INotificationRepository,
} from "../repositories/interfaces";
import type { ProjectMemberSelect } from "../db/schema";
import { generateId, now } from "../utils/id";

export class MemberService {
    constructor(
        private memberRepo: IProjectMemberRepository,
        private userRepo: IUserRepository,
        private notificationRepo: INotificationRepository
    ) { }

    async listMembers(
        projectId: string,
        userId: string
    ): Promise<(ProjectMemberSelect & { userName: string; userEmail: string })[]> {
        await this.assertMembership(projectId, userId);
        return this.memberRepo.findByProjectId(projectId);
    }

    async inviteMember(
        projectId: string,
        inviterId: string,
        targetUserEmail: string
    ): Promise<ProjectMemberSelect> {
        await this.assertOwnership(projectId, inviterId);

        const targetUser = await this.userRepo.findByEmail(targetUserEmail);
        if (!targetUser) throw new Error("User not found");

        const existing = await this.memberRepo.findByUserAndProject(targetUser.id, projectId);
        if (existing) throw new Error("User is already a member");

        const member = await this.memberRepo.create({
            id: generateId(),
            projectId,
            userId: targetUser.id,
            role: "member",
            createdAt: now(),
        });

        // Create in-app notification
        const inviter = await this.userRepo.findById(inviterId);
        await this.notificationRepo.create({
            id: generateId(),
            userId: targetUser.id,
            type: "project_invite",
            message: `${inviter?.name || "Someone"} invited you to a project`,
            data: JSON.stringify({ projectId }),
            read: 0,
            createdAt: now(),
        });

        return member;
    }

    async removeMember(projectId: string, removerId: string, targetUserId: string): Promise<void> {
        await this.assertOwnership(projectId, removerId);
        if (removerId === targetUserId) throw new Error("Cannot remove yourself as owner");
        await this.memberRepo.deleteByUserAndProject(targetUserId, projectId);
    }

    async checkMembership(projectId: string, userId: string): Promise<ProjectMemberSelect | undefined> {
        return this.memberRepo.findByUserAndProject(userId, projectId);
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
