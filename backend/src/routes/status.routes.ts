import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppEnv } from "../types";
import {
    CreateStatusSchema,
    UpdateStatusSchema,
    StatusResponseSchema,
    StatusListSchema,
} from "../schemas/status.schema";
import { ErrorSchema, MessageSchema } from "../schemas/auth.schema";

const app = new OpenAPIHono<AppEnv>();

// ─── List Statuses ─────────────────────────────────────────────────
app.openapi(
    createRoute({
        method: "get", path: "/api/projects/{projectId}/statuses", tags: ["Statuses"],
        request: { params: z.object({ projectId: z.string() }) },
        responses: { 200: { content: { "application/json": { schema: StatusListSchema } }, description: "Status list" } },
    }),
    async (c) => {
        try {
            return c.json(await c.get("statusService").listStatuses(c.req.valid("param").projectId, c.get("userId")), 200);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// ─── Create Status ─────────────────────────────────────────────────
app.openapi(
    createRoute({
        method: "post", path: "/api/projects/{projectId}/statuses", tags: ["Statuses"],
        request: {
            params: z.object({ projectId: z.string() }),
            body: { content: { "application/json": { schema: CreateStatusSchema } } },
        },
        responses: {
            201: { content: { "application/json": { schema: StatusResponseSchema } }, description: "Created" },
            400: { content: { "application/json": { schema: ErrorSchema } }, description: "Error" },
        },
    }),
    async (c) => {
        try {
            return c.json(await c.get("statusService").createStatus(c.req.valid("param").projectId, c.get("userId"), c.req.valid("json")), 201);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// ─── Update Status ─────────────────────────────────────────────────
app.openapi(
    createRoute({
        method: "put", path: "/api/statuses/{statusId}", tags: ["Statuses"],
        request: {
            params: z.object({ statusId: z.string() }),
            body: { content: { "application/json": { schema: UpdateStatusSchema } } },
        },
        responses: {
            200: { content: { "application/json": { schema: StatusResponseSchema } }, description: "Updated" },
            400: { content: { "application/json": { schema: ErrorSchema } }, description: "Error" },
        },
    }),
    async (c) => {
        try {
            return c.json(await c.get("statusService").updateStatus(c.req.valid("param").statusId, c.get("userId"), c.req.valid("json")), 200);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// ─── Delete Status ─────────────────────────────────────────────────
app.openapi(
    createRoute({
        method: "delete", path: "/api/statuses/{statusId}", tags: ["Statuses"],
        request: { params: z.object({ statusId: z.string() }) },
        responses: {
            200: { content: { "application/json": { schema: MessageSchema } }, description: "Deleted" },
            400: { content: { "application/json": { schema: ErrorSchema } }, description: "Error" },
        },
    }),
    async (c) => {
        try {
            await c.get("statusService").deleteStatus(c.req.valid("param").statusId, c.get("userId"));
            return c.json({ message: "Status deleted" }, 200);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

export default app;
