import { sqliteTable, text, integer, primaryKey, index } from "drizzle-orm/sqlite-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

// ─── Users ───────────────────────────────────────────────────────────
export const users = sqliteTable("users", {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: text("created_at").notNull(),
});

// ─── Auth Identities (For multiple providers) ────────────────────────
export const authIdentities = sqliteTable("auth_identities", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), // 'google', 'github', etc.
    providerId: text("provider_id").notNull(), // External ID from provider
    createdAt: text("created_at").notNull(),
    lastLoginAt: text("last_login_at"),
});

// ─── Projects ────────────────────────────────────────────────────────
export const projects = sqliteTable("projects", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description").default(""),
    color: text("color").default("#3b82f6"), // Default blue
    ownerId: text("owner_id")
        .notNull()
        .references(() => users.id),
    archived: integer("archived").notNull().default(0),
    createdAt: text("created_at").notNull(),
});

// ─── Project Members ─────────────────────────────────────────────────
export const projectMembers = sqliteTable("project_members", {
    id: text("id").primaryKey(),
    projectId: text("project_id")
        .notNull()
        .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"), // 'owner' | 'member'
    createdAt: text("created_at").notNull(),
});

// ─── Statuses (Kanban Columns) ───────────────────────────────────────
export const statuses = sqliteTable("statuses", {
    id: text("id").primaryKey(),
    projectId: text("project_id")
        .notNull()
        .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
});

// ─── Tasks ───────────────────────────────────────────────────────────
export const tasks = sqliteTable("tasks", {
    id: text("id").primaryKey(),
    projectId: text("project_id")
        .notNull()
        .references(() => projects.id, { onDelete: "cascade" }),
    statusId: text("status_id")
        .notNull()
        .references(() => statuses.id),
    assigneeId: text("assignee_id").references(() => users.id),
    title: text("title").notNull(),
    description: text("description").default(""),
    dueDate: text("due_date"),
    position: integer("position").notNull().default(0),
    createdAt: text("created_at").notNull(),
});

// ─── Comments ────────────────────────────────────────────────────────
export const comments = sqliteTable("comments", {
    id: text("id").primaryKey(),
    taskId: text("task_id")
        .notNull()
        .references(() => tasks.id, { onDelete: "cascade" }),
    authorId: text("author_id")
        .notNull()
        .references(() => users.id),
    content: text("content").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
});

// ─── Notifications ───────────────────────────────────────────────────
export const notifications = sqliteTable("notifications", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // 'project_invite' | 'task_assigned' | etc.
    message: text("message").notNull(),
    data: text("data"), // JSON string for extra context (e.g. projectId)
    read: integer("read").notNull().default(0),
    createdAt: text("created_at").notNull(),
});

// ─── Webhooks ────────────────────────────────────────────────────────
export const webhooks = sqliteTable("webhooks", {
    id: text("id").primaryKey(),
    projectId: text("project_id")
        .notNull()
        .references(() => projects.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    events: text("events").notNull(), // JSON array of event types
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull(),
});

// ─── Type Exports ────────────────────────────────────────────────────
export type UserSelect = InferSelectModel<typeof users>;
export type UserInsert = InferInsertModel<typeof users>;

export type AuthIdentitySelect = InferSelectModel<typeof authIdentities>;
export type AuthIdentityInsert = InferInsertModel<typeof authIdentities>;

export type ProjectSelect = InferSelectModel<typeof projects>;
export type ProjectInsert = InferInsertModel<typeof projects>;

export type ProjectMemberSelect = InferSelectModel<typeof projectMembers>;
export type ProjectMemberInsert = InferInsertModel<typeof projectMembers>;

export type StatusSelect = InferSelectModel<typeof statuses>;
export type StatusInsert = InferInsertModel<typeof statuses>;

export type TaskSelect = InferSelectModel<typeof tasks>;
export type TaskInsert = InferInsertModel<typeof tasks>;

export type CommentSelect = InferSelectModel<typeof comments>;
export type CommentInsert = InferInsertModel<typeof comments>;

export type NotificationSelect = InferSelectModel<typeof notifications>;
export type NotificationInsert = InferInsertModel<typeof notifications>;

export type WebhookSelect = InferSelectModel<typeof webhooks>;
export type WebhookInsert = InferInsertModel<typeof webhooks>;
