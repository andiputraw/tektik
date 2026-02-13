import { z } from "@hono/zod-openapi";

export const CreateTaskSchema = z.object({
    title: z.string().min(1).openapi({ example: "Implement login page" }),
    description: z.string().optional().openapi({ example: "Create the login form with validation" }),
    statusId: z.string().openapi({ example: "status_id_here" }),
    dueDate: z.string().optional().openapi({ example: "2026-03-01" }),
    assigneeId: z.string().optional().openapi({ example: "user_id_here" }),
    position: z.number().optional().openapi({ example: 0 }),
});

export const UpdateTaskSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    dueDate: z.string().nullable().optional(),
    position: z.number().optional(),
});

export const MoveTaskSchema = z.object({
    statusId: z.string().openapi({ example: "status_id_here" }),
    position: z.number().optional().openapi({ example: 0 }),
});

export const AssignTaskSchema = z.object({
    assigneeId: z.string().nullable().openapi({ example: "user_id_here" }),
});

export const TaskResponseSchema = z
    .object({
        id: z.string(),
        projectId: z.string(),
        statusId: z.string(),
        assigneeId: z.string().nullable(),
        title: z.string(),
        description: z.string().nullable(),
        dueDate: z.string().nullable(),
        position: z.number(),
        createdAt: z.string(),
    })
    .openapi("Task");

export const TaskListSchema = z.array(TaskResponseSchema).openapi("TaskList");

export const UserTaskResponseSchema = TaskResponseSchema.extend({
    projectName: z.string(),
    statusName: z.string(),
}).openapi("UserTask");

export const UserTaskListSchema = z.array(UserTaskResponseSchema).openapi("UserTaskList");
