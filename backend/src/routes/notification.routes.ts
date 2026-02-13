import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppEnv } from "../types";
import { NotificationListSchema } from "../schemas/notification.schema";
import { ErrorSchema, MessageSchema } from "../schemas/auth.schema";

const app = new OpenAPIHono<AppEnv>();

// ─── List Notifications ────────────────────────────────────────────
app.openapi(
    createRoute({
        method: "get", path: "/api/notifications", tags: ["Notifications"],
        responses: { 200: { content: { "application/json": { schema: NotificationListSchema } }, description: "Notification list" } },
    }),
    async (c) => c.json(await c.get("notificationService").listNotifications(c.get("userId")), 200)
);

// ─── Mark as Read ──────────────────────────────────────────────────
app.openapi(
    createRoute({
        method: "patch", path: "/api/notifications/{notificationId}/read", tags: ["Notifications"],
        request: { params: z.object({ notificationId: z.string() }) },
        responses: {
            200: { content: { "application/json": { schema: MessageSchema } }, description: "Marked as read" },
            400: { content: { "application/json": { schema: ErrorSchema } }, description: "Error" },
        },
    }),
    async (c) => {
        try {
            await c.get("notificationService").markAsRead(c.req.valid("param").notificationId, c.get("userId"));
            return c.json({ message: "Marked as read" }, 200);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// ─── Mark All as Read ──────────────────────────────────────────────
app.openapi(
    createRoute({
        method: "patch", path: "/api/notifications/read-all", tags: ["Notifications"],
        responses: { 200: { content: { "application/json": { schema: MessageSchema } }, description: "All marked as read" } },
    }),
    async (c) => {
        await c.get("notificationService").markAllAsRead(c.get("userId"));
        return c.json({ message: "All notifications marked as read" }, 200);
    }
);

export default app;
