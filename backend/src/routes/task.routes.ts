import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppEnv } from "../types";
import {
    CreateTaskSchema,
    UpdateTaskSchema,
    MoveTaskSchema,
    AssignTaskSchema,
    TaskResponseSchema,
    TaskListSchema,
    UserTaskListSchema,
} from "../schemas/task.schema";
import { ErrorSchema, MessageSchema } from "../schemas/auth.schema";

const app = new OpenAPIHono<AppEnv>();

// ─── List User Tasks (Global) ──────────────────────────────────────
app.openapi(
    createRoute({
        method: "get", path: "/api/tasks", tags: ["Tasks"],
        responses: {
            200: { content: { "application/json": { schema: UserTaskListSchema } }, description: "List user tasks" },
            401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
            400: { content: { "application/json": { schema: ErrorSchema } }, description: "Error" },
        },
    }),
    async (c) => {
        try {
            return c.json(await c.get("taskService").getUserTasks(c.get("userId")), 200);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// ─── List Tasks by Project ─────────────────────────────────────────
app.openapi(
    createRoute({
        method: "get", path: "/api/projects/{projectId}/tasks", tags: ["Tasks"],
        request: {
            params: z.object({ projectId: z.string() }),
            query: z.object({ statusId: z.string().optional(), assigneeId: z.string().optional() }),
        },
        responses: {
            200: { content: { "application/json": { schema: TaskListSchema } }, description: "Task list" },
            400: { content: { "application/json": { schema: ErrorSchema } }, description: "Error" },
        },
    }),
    async (c) => {
        try {
            const { projectId } = c.req.valid("param");
            const { statusId, assigneeId } = c.req.valid("query");
            return c.json(await c.get("taskService").listTasks(projectId, c.get("userId"), { statusId, assigneeId }), 200);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// ─── Create Task ───────────────────────────────────────────────────
app.openapi(
    createRoute({
        method: "post", path: "/api/projects/{projectId}/tasks", tags: ["Tasks"],
        request: {
            params: z.object({ projectId: z.string() }),
            body: { content: { "application/json": { schema: CreateTaskSchema } } },
        },
        responses: {
            201: { content: { "application/json": { schema: TaskResponseSchema } }, description: "Task created" },
            400: { content: { "application/json": { schema: ErrorSchema } }, description: "Error" },
        },
    }),
    async (c) => {
        try {
            return c.json(await c.get("taskService").createTask(c.req.valid("param").projectId, c.get("userId"), c.req.valid("json")), 201);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// ─── Get Task ──────────────────────────────────────────────────────
app.openapi(
    createRoute({
        method: "get", path: "/api/tasks/{taskId}", tags: ["Tasks"],
        request: { params: z.object({ taskId: z.string() }) },
        responses: {
            200: { content: { "application/json": { schema: TaskResponseSchema } }, description: "Task details" },
            404: { content: { "application/json": { schema: ErrorSchema } }, description: "Not found" },
        },
    }),
    async (c) => {
        try {
            return c.json(await c.get("taskService").getTask(c.req.valid("param").taskId, c.get("userId")), 200);
        } catch (e: any) {
            return c.json({ error: e.message }, 404);
        }
    }
);

// ─── Update Task ───────────────────────────────────────────────────
app.openapi(
    createRoute({
        method: "put", path: "/api/tasks/{taskId}", tags: ["Tasks"],
        request: {
            params: z.object({ taskId: z.string() }),
            body: { content: { "application/json": { schema: UpdateTaskSchema } } },
        },
        responses: {
            200: { content: { "application/json": { schema: TaskResponseSchema } }, description: "Updated" },
            400: { content: { "application/json": { schema: ErrorSchema } }, description: "Error" },
        },
    }),
    async (c) => {
        try {
            return c.json(await c.get("taskService").updateTask(c.req.valid("param").taskId, c.get("userId"), c.req.valid("json")), 200);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// ─── Delete Task ───────────────────────────────────────────────────
app.openapi(
    createRoute({
        method: "delete", path: "/api/tasks/{taskId}", tags: ["Tasks"],
        request: { params: z.object({ taskId: z.string() }) },
        responses: {
            200: { content: { "application/json": { schema: MessageSchema } }, description: "Deleted" },
            400: { content: { "application/json": { schema: ErrorSchema } }, description: "Error" },
        },
    }),
    async (c) => {
        try {
            await c.get("taskService").deleteTask(c.req.valid("param").taskId, c.get("userId"));
            return c.json({ message: "Task deleted" }, 200);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// ─── Move Task (Update Status) ────────────────────────────────────
app.openapi(
    createRoute({
        method: "patch", path: "/api/tasks/{taskId}/status", tags: ["Tasks"],
        request: {
            params: z.object({ taskId: z.string() }),
            body: { content: { "application/json": { schema: MoveTaskSchema } } },
        },
        responses: {
            200: { content: { "application/json": { schema: TaskResponseSchema } }, description: "Moved" },
            400: { content: { "application/json": { schema: ErrorSchema } }, description: "Error" },
        },
    }),
    async (c) => {
        try {
            const { statusId, position } = c.req.valid("json");
            return c.json(await c.get("taskService").moveTask(c.req.valid("param").taskId, c.get("userId"), statusId, position), 200);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// ─── Assign Task ───────────────────────────────────────────────────
app.openapi(
    createRoute({
        method: "patch", path: "/api/tasks/{taskId}/assign", tags: ["Tasks"],
        request: {
            params: z.object({ taskId: z.string() }),
            body: { content: { "application/json": { schema: AssignTaskSchema } } },
        },
        responses: {
            200: { content: { "application/json": { schema: TaskResponseSchema } }, description: "Assigned" },
            400: { content: { "application/json": { schema: ErrorSchema } }, description: "Error" },
        },
    }),
    async (c) => {
        try {
            return c.json(await c.get("taskService").assignTask(c.req.valid("param").taskId, c.get("userId"), c.req.valid("json").assigneeId), 200);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

export default app;
