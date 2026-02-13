import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppEnv } from "../types";
import { ErrorSchema } from "../schemas/auth.schema";

const app = new OpenAPIHono<AppEnv>();

// Schema
const WebhookSchema = z.object({
    id: z.string(),
    projectId: z.string(),
    url: z.string(),
    events: z.string(),
    active: z.boolean(),
    createdAt: z.string(),
}).openapi("Webhook");

const CreateWebhookSchema = z.object({
    url: z.string().url(),
    events: z.array(z.string()),
});

// Routes
app.openapi(
    createRoute({
        method: "get",
        path: "/api/projects/{projectId}/webhooks",
        tags: ["Webhooks"],
        request: {
            params: z.object({ projectId: z.string() }),
        },
        responses: {
            200: { content: { "application/json": { schema: z.array(WebhookSchema) } }, description: "List webhooks" },
            401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
            403: { content: { "application/json": { schema: ErrorSchema } }, description: "Forbidden" },
        },
    }),
    async (c) => {
        const projectId = c.req.param("projectId");
        const userId = c.get("userId");
        // Verify ownership/admin?
        const member = await c.get("memberService").checkMembership(projectId, userId);
        if (!member || member.role !== "owner") return c.json({ error: "Only owners can manage webhooks" }, 403);

        const hooks = await c.get("webhookService").listWebhooks(projectId);
        return c.json(hooks, 200);
    }
);

app.openapi(
    createRoute({
        method: "post",
        path: "/api/projects/{projectId}/webhooks",
        tags: ["Webhooks"],
        request: {
            params: z.object({ projectId: z.string() }),
            body: { content: { "application/json": { schema: CreateWebhookSchema } } },
        },
        responses: {
            201: { content: { "application/json": { schema: WebhookSchema } }, description: "Created" },
            400: { content: { "application/json": { schema: ErrorSchema } }, description: "Error" },
            403: { content: { "application/json": { schema: ErrorSchema } }, description: "Forbidden" },
        },
    }),
    async (c) => {
        const projectId = c.req.param("projectId");
        const userId = c.get("userId");
        const member = await c.get("memberService").checkMembership(projectId, userId);
        if (!member || member.role !== "owner") return c.json({ error: "Only owners can manage webhooks" }, 403);

        const body = c.req.valid("json");
        const hook = await c.get("webhookService").createWebhook(projectId, body.url, body.events);
        return c.json(hook, 201);
    }
);

app.openapi(
    createRoute({
        method: "delete",
        path: "/api/projects/{projectId}/webhooks/{id}",
        tags: ["Webhooks"],
        request: {
            params: z.object({ projectId: z.string(), id: z.string() }),
        },
        responses: {
            200: { content: { "application/json": { schema: z.object({ success: z.boolean() }) } }, description: "Deleted" },
            403: { content: { "application/json": { schema: ErrorSchema } }, description: "Forbidden" },
        },
    }),
    async (c) => {
        const projectId = c.req.param("projectId");
        const id = c.req.param("id");
        const userId = c.get("userId");
        const member = await c.get("memberService").checkMembership(projectId, userId);
        if (!member || member.role !== "owner") return c.json({ error: "Only owners can manage webhooks" }, 403);

        await c.get("webhookService").deleteWebhook(id);
        return c.json({ success: true }, 200);
    }
);

export default app;
