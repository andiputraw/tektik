import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppEnv } from "../types";
import {
    CreateCommentSchema,
    UpdateCommentSchema,
    CommentResponseSchema,
    CommentListSchema,
} from "../schemas/comment.schema";
import { ErrorSchema, MessageSchema } from "../schemas/auth.schema";

const app = new OpenAPIHono<AppEnv>();

// ─── List Comments ─────────────────────────────────────────────────
app.openapi(
    createRoute({
        method: "get", path: "/api/tasks/{taskId}/comments", tags: ["Comments"],
        request: { params: z.object({ taskId: z.string() }) },
        responses: { 200: { content: { "application/json": { schema: CommentListSchema } }, description: "Comment list" } },
    }),
    async (c) => {
        try {
            return c.json(await c.get("commentService").listComments(c.req.valid("param").taskId, c.get("userId")), 200);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// ─── Create Comment ────────────────────────────────────────────────
app.openapi(
    createRoute({
        method: "post", path: "/api/tasks/{taskId}/comments", tags: ["Comments"],
        request: {
            params: z.object({ taskId: z.string() }),
            body: { content: { "application/json": { schema: CreateCommentSchema } } },
        },
        responses: {
            201: { content: { "application/json": { schema: CommentResponseSchema } }, description: "Created" },
            400: { content: { "application/json": { schema: ErrorSchema } }, description: "Error" },
        },
    }),
    async (c) => {
        try {
            return c.json(await c.get("commentService").createComment(c.req.valid("param").taskId, c.get("userId"), c.req.valid("json").content), 201);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// ─── Update Comment ────────────────────────────────────────────────
app.openapi(
    createRoute({
        method: "put", path: "/api/comments/{commentId}", tags: ["Comments"],
        request: {
            params: z.object({ commentId: z.string() }),
            body: { content: { "application/json": { schema: UpdateCommentSchema } } },
        },
        responses: {
            200: { content: { "application/json": { schema: CommentResponseSchema } }, description: "Updated" },
            400: { content: { "application/json": { schema: ErrorSchema } }, description: "Error" },
        },
    }),
    async (c) => {
        try {
            return c.json(await c.get("commentService").updateComment(c.req.valid("param").commentId, c.get("userId"), c.req.valid("json").content), 200);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// ─── Delete Comment ────────────────────────────────────────────────
app.openapi(
    createRoute({
        method: "delete", path: "/api/comments/{commentId}", tags: ["Comments"],
        request: { params: z.object({ commentId: z.string() }) },
        responses: {
            200: { content: { "application/json": { schema: MessageSchema } }, description: "Deleted" },
            400: { content: { "application/json": { schema: ErrorSchema } }, description: "Error" },
        },
    }),
    async (c) => {
        try {
            await c.get("commentService").deleteComment(c.req.valid("param").commentId, c.get("userId"));
            return c.json({ message: "Comment deleted" }, 200);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

export default app;
