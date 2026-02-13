import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "../db/schema";

export type Database = DrizzleD1Database<typeof schema>;

// ─── User Repository ────────────────────────────────────────────────
export interface IUserRepository {
    findById(id: string): Promise<schema.UserSelect | undefined>;
    findByEmail(email: string): Promise<schema.UserSelect | undefined>;
    create(user: schema.UserInsert): Promise<schema.UserSelect>;
}

// ─── Project Repository ─────────────────────────────────────────────
export interface IProjectRepository {
    findById(id: string): Promise<schema.ProjectSelect | undefined>;
    findByUserId(userId: string): Promise<schema.ProjectSelect[]>;
    create(project: schema.ProjectInsert): Promise<schema.ProjectSelect>;
    update(id: string, data: Partial<schema.ProjectInsert>): Promise<schema.ProjectSelect | undefined>;
    delete(id: string): Promise<void>;
}

// ─── Project Member Repository ──────────────────────────────────────
export interface IProjectMemberRepository {
    findByProjectId(projectId: string): Promise<(schema.ProjectMemberSelect & { userName: string; userEmail: string })[]>;
    findByUserAndProject(userId: string, projectId: string): Promise<schema.ProjectMemberSelect | undefined>;
    create(member: schema.ProjectMemberInsert): Promise<schema.ProjectMemberSelect>;
    delete(id: string): Promise<void>;
    deleteByUserAndProject(userId: string, projectId: string): Promise<void>;
}

// ─── Status Repository ──────────────────────────────────────────────
export interface IStatusRepository {
    findByProjectId(projectId: string): Promise<schema.StatusSelect[]>;
    findById(id: string): Promise<schema.StatusSelect | undefined>;
    create(status: schema.StatusInsert): Promise<schema.StatusSelect>;
    update(id: string, data: Partial<schema.StatusInsert>): Promise<schema.StatusSelect | undefined>;
    delete(id: string): Promise<void>;
}

// ─── Task Repository ────────────────────────────────────────────────
export interface ITaskRepository {
    findByProjectId(projectId: string, filters?: { statusId?: string; assigneeId?: string }): Promise<schema.TaskSelect[]>;
    findByAssigneeId(userId: string): Promise<(schema.TaskSelect & { projectName: string; statusName: string })[]>;
    findById(id: string): Promise<schema.TaskSelect | undefined>;
    create(task: schema.TaskInsert): Promise<schema.TaskSelect>;
    update(id: string, data: Partial<schema.TaskInsert>): Promise<schema.TaskSelect | undefined>;
    delete(id: string): Promise<void>;
}

// ─── Comment Repository ─────────────────────────────────────────────
export interface ICommentRepository {
    findByTaskId(taskId: string): Promise<(schema.CommentSelect & { authorName: string })[]>;
    findById(id: string): Promise<schema.CommentSelect | undefined>;
    create(comment: schema.CommentInsert): Promise<schema.CommentSelect>;
    update(id: string, data: Partial<schema.CommentInsert>): Promise<schema.CommentSelect | undefined>;
    delete(id: string): Promise<void>;
}

// ─── Notification Repository ────────────────────────────────────────
export interface INotificationRepository {
    findByUserId(userId: string): Promise<schema.NotificationSelect[]>;
    findById(id: string): Promise<schema.NotificationSelect | undefined>;
    create(notification: schema.NotificationInsert): Promise<schema.NotificationSelect>;
    markAsRead(id: string): Promise<void>;
    markAllAsRead(userId: string): Promise<void>;
}
// ─── Webhook Repository ─────────────────────────────────────────────
export interface IWebhookRepository {
    findByProjectId(projectId: string): Promise<schema.WebhookSelect[]>;
    create(webhook: schema.WebhookInsert): Promise<schema.WebhookSelect>;
    delete(id: string): Promise<void>;
}
