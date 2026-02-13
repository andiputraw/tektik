import type { ICommentRepository, IProjectMemberRepository, ITaskRepository, INotificationRepository } from "../repositories/interfaces";
import type { CommentSelect } from "../db/schema";
import { generateId, now } from "../utils/id";
import type { WebhookService } from "./webhook.service";

export class CommentService {
    constructor(
        private commentRepo: ICommentRepository,
        private taskRepo: ITaskRepository,
        private memberRepo: IProjectMemberRepository,
        private notificationRepo: INotificationRepository,
        private projectBoard: DurableObjectNamespace,
        private webhookService: WebhookService
    ) { }

    async listComments(
        taskId: string,
        userId: string
    ): Promise<(CommentSelect & { authorName: string })[]> {
        const task = await this.taskRepo.findById(taskId);
        if (!task) throw new Error("Task not found");
        await this.assertMembership(task.projectId, userId);
        return this.commentRepo.findByTaskId(taskId);
    }

    async createComment(taskId: string, userId: string, content: string): Promise<CommentSelect> {
        const task = await this.taskRepo.findById(taskId);
        if (!task) throw new Error("Task not found");
        await this.assertMembership(task.projectId, userId);

        const comment = await this.commentRepo.create({
            id: generateId(),
            taskId,
            authorId: userId,
            content,
            createdAt: now(),
            updatedAt: now(),
        });

        // Notify Assignee
        if (task.assigneeId && task.assigneeId !== userId) {
            // We need author name for message, fetch user?
            // Or just say "Someone".
            // For now, simple message.
            await this.notificationRepo.create({
                id: generateId(),
                userId: task.assigneeId,
                type: "comment_created",
                message: `New comment on task: ${task.title}`,
                data: JSON.stringify({ taskId, projectId: task.projectId }),
                read: 0,
                createdAt: now(),
            });
        }

        // Broadcast
        try {
            const id = this.projectBoard.idFromName(task.projectId);
            const stub = this.projectBoard.get(id);
            await stub.fetch("http://internal/broadcast", {
                method: "POST",
                body: JSON.stringify({ type: "COMMENT_CREATED", payload: comment })
            });
        } catch (e) {
            console.error("Broadcast failed", e);
        }

        await this.webhookService.trigger(task.projectId, "COMMENT_CREATED", comment);

        return comment;
    }

    async updateComment(commentId: string, userId: string, content: string): Promise<CommentSelect> {
        const comment = await this.commentRepo.findById(commentId);
        if (!comment) throw new Error("Comment not found");
        if (comment.authorId !== userId) throw new Error("Can only edit your own comments");

        const updated = await this.commentRepo.update(commentId, { content, updatedAt: now() });
        if (!updated) throw new Error("Comment not found");
        return updated;
    }

    async deleteComment(commentId: string, userId: string): Promise<void> {
        const comment = await this.commentRepo.findById(commentId);
        if (!comment) throw new Error("Comment not found");
        if (comment.authorId !== userId) throw new Error("Can only delete your own comments");
        await this.commentRepo.delete(commentId);
    }

    private async assertMembership(projectId: string, userId: string): Promise<void> {
        const membership = await this.memberRepo.findByUserAndProject(userId, projectId);
        if (!membership) throw new Error("Not a member of this project");
    }
}
