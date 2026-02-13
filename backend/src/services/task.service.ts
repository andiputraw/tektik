import type {
    ITaskRepository,
    IProjectMemberRepository,
    INotificationRepository,
    IUserRepository,
} from "../repositories/interfaces";
import type { TaskSelect } from "../db/schema";
import { generateId, now } from "../utils/id";
import type { WebhookService } from "./webhook.service";

export class TaskService {
    constructor(
        private taskRepo: ITaskRepository,
        private memberRepo: IProjectMemberRepository,
        private notificationRepo: INotificationRepository,
        private userRepo: IUserRepository,
        private projectBoard: DurableObjectNamespace,
        private webhookService: WebhookService
    ) { }

    private async notifyProject(projectId: string, type: string, payload: any) {
        try {
            const id = this.projectBoard.idFromName(projectId);
            const stub = this.projectBoard.get(id);
            await stub.fetch("http://internal/broadcast", {
                method: "POST",
                body: JSON.stringify({ type, payload })
            });

            await this.webhookService.trigger(projectId, type, payload);
        } catch (e) {
            console.error("Failed to notify project board", e);
        }
    }

    async listTasks(
        projectId: string,
        userId: string,
        filters?: { statusId?: string; assigneeId?: string }
    ): Promise<TaskSelect[]> {
        await this.assertMembership(projectId, userId);
        return this.taskRepo.findByProjectId(projectId, filters);
    }

    async getUserTasks(userId: string): Promise<(TaskSelect & { projectName: string; statusName: string })[]> {
        return this.taskRepo.findByAssigneeId(userId);
    }

    async getTask(taskId: string, userId: string): Promise<TaskSelect> {
        const task = await this.taskRepo.findById(taskId);
        if (!task) throw new Error("Task not found");
        await this.assertMembership(task.projectId, userId);
        return task;
    }

    async createTask(
        projectId: string,
        userId: string,
        data: { title: string; description?: string; statusId: string; dueDate?: string; assigneeId?: string; position?: number }
    ): Promise<TaskSelect> {
        await this.assertMembership(projectId, userId);
        const task = await this.taskRepo.create({
            id: generateId(),
            projectId,
            statusId: data.statusId,
            assigneeId: data.assigneeId || null,
            title: data.title,
            description: data.description || "",
            dueDate: data.dueDate || null,
            position: data.position ?? 0,
            createdAt: now(),
        });
        await this.notifyProject(projectId, "TASK_CREATED", task);
        return task;
    }

    async updateTask(
        taskId: string,
        userId: string,
        data: { title?: string; description?: string; dueDate?: string | null; position?: number }
    ): Promise<TaskSelect> {
        const task = await this.taskRepo.findById(taskId);
        if (!task) throw new Error("Task not found");
        await this.assertMembership(task.projectId, userId);

        const updated = await this.taskRepo.update(taskId, data);
        if (!updated) throw new Error("Task not found");
        await this.notifyProject(updated.projectId, "TASK_UPDATED", updated);
        return updated;
    }

    async moveTask(taskId: string, userId: string, statusId: string, position?: number): Promise<TaskSelect> {
        const task = await this.taskRepo.findById(taskId);
        if (!task) throw new Error("Task not found");
        await this.assertMembership(task.projectId, userId);

        const updateData: { statusId: string; position?: number } = { statusId };
        if (position !== undefined) updateData.position = position;

        const updated = await this.taskRepo.update(taskId, updateData);
        if (!updated) throw new Error("Task not found");
        await this.notifyProject(updated.projectId, "TASK_MOVED", updated);
        return updated;
    }

    async assignTask(taskId: string, userId: string, assigneeId: string | null): Promise<TaskSelect> {
        const task = await this.taskRepo.findById(taskId);
        if (!task) throw new Error("Task not found");
        await this.assertMembership(task.projectId, userId);

        if (assigneeId) {
            // Verify assignee is a project member
            await this.assertMembership(task.projectId, assigneeId);

            // Create notification for the assignee
            if (assigneeId !== userId) {
                const assigner = await this.userRepo.findById(userId);
                await this.notificationRepo.create({
                    id: generateId(),
                    userId: assigneeId,
                    type: "task_assigned",
                    message: `${assigner?.name || "Someone"} assigned you to task: ${task.title}`,
                    data: JSON.stringify({ taskId, projectId: task.projectId }),
                    read: 0,
                    createdAt: now(),
                });
            }
        }

        const updated = await this.taskRepo.update(taskId, { assigneeId });
        if (!updated) throw new Error("Task not found");
        await this.notifyProject(updated.projectId, "TASK_ASSIGNED", updated);
        return updated;
    }

    async deleteTask(taskId: string, userId: string): Promise<void> {
        const task = await this.taskRepo.findById(taskId);
        if (!task) throw new Error("Task not found");
        await this.assertMembership(task.projectId, userId);
        await this.taskRepo.delete(taskId);
        await this.notifyProject(task.projectId, "TASK_DELETED", { taskId });
    }

    private async assertMembership(projectId: string, userId: string): Promise<void> {
        const membership = await this.memberRepo.findByUserAndProject(userId, projectId);
        if (!membership) throw new Error("Not a member of this project");
    }
}
