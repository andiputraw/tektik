import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppEnv } from "../types";
import {
    CreateProjectSchema,
    UpdateProjectSchema,
    ProjectResponseSchema,
    ProjectListSchema,
    InviteMemberSchema,
    MemberResponseSchema,
    MemberListSchema,
} from "../schemas/project.schema";
import { ErrorSchema, MessageSchema } from "../schemas/auth.schema";

const app = new OpenAPIHono<AppEnv>();

// ─── List Projects ─────────────────────────────────────────────────
app.openapi(
    createRoute({
        method: "get", path: "/api/projects", tags: ["Projects"],
        responses: { 200: { content: { "application/json": { schema: ProjectListSchema } }, description: "List of projects" } },
    }),
    async (c) => c.json(await c.get("projectService").listProjects(c.get("userId")), 200)
);

// ─── Create Project ────────────────────────────────────────────────
app.openapi(
    createRoute({
        method: "post", path: "/api/projects", tags: ["Projects"],
        request: { body: { content: { "application/json": { schema: CreateProjectSchema } } } },
        responses: {
            201: { content: { "application/json": { schema: ProjectResponseSchema } }, description: "Project created" },
            400: { content: { "application/json": { schema: ErrorSchema } }, description: "Error" },
        },
    }),
    async (c) => {
        try {
            const { name, description } = c.req.valid("json");
            return c.json(await c.get("projectService").createProject(name, description || "", c.get("userId")), 201);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// ─── Get Project ───────────────────────────────────────────────────
app.openapi(
    createRoute({
        method: "get", path: "/api/projects/{id}", tags: ["Projects"],
        request: { params: z.object({ id: z.string() }) },
        responses: {
            200: { content: { "application/json": { schema: ProjectResponseSchema } }, description: "Project details" },
            404: { content: { "application/json": { schema: ErrorSchema } }, description: "Not found" },
        },
    }),
    async (c) => {
        try {
            return c.json(await c.get("projectService").getProject(c.req.valid("param").id, c.get("userId")), 200);
        } catch (e: any) {
            return c.json({ error: e.message }, 404);
        }
    }
);

// ─── Update Project ────────────────────────────────────────────────
app.openapi(
    createRoute({
        method: "put", path: "/api/projects/{id}", tags: ["Projects"],
        request: {
            params: z.object({ id: z.string() }),
            body: { content: { "application/json": { schema: UpdateProjectSchema } } },
        },
        responses: {
            200: { content: { "application/json": { schema: ProjectResponseSchema } }, description: "Updated" },
            400: { content: { "application/json": { schema: ErrorSchema } }, description: "Error" },
        },
    }),
    async (c) => {
        try {
            return c.json(await c.get("projectService").updateProject(c.req.valid("param").id, c.get("userId"), c.req.valid("json")), 200);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// ─── Delete Project ────────────────────────────────────────────────
app.openapi(
    createRoute({
        method: "delete", path: "/api/projects/{id}", tags: ["Projects"],
        request: { params: z.object({ id: z.string() }) },
        responses: {
            200: { content: { "application/json": { schema: MessageSchema } }, description: "Deleted" },
            400: { content: { "application/json": { schema: ErrorSchema } }, description: "Error" },
        },
    }),
    async (c) => {
        try {
            await c.get("projectService").deleteProject(c.req.valid("param").id, c.get("userId"));
            return c.json({ message: "Project deleted" }, 200);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// ─── List Members ─────────────────────────────────────────────────
app.openapi(
    createRoute({
        method: "get", path: "/api/projects/{id}/members", tags: ["Members"],
        request: { params: z.object({ id: z.string() }) },
        responses: { 200: { content: { "application/json": { schema: MemberListSchema } }, description: "Members list" } },
    }),
    async (c) => {
        try {
            return c.json(await c.get("memberService").listMembers(c.req.valid("param").id, c.get("userId")), 200);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// ─── Invite Member ─────────────────────────────────────────────────
app.openapi(
    createRoute({
        method: "post", path: "/api/projects/{id}/members", tags: ["Members"],
        request: {
            params: z.object({ id: z.string() }),
            body: { content: { "application/json": { schema: InviteMemberSchema } } },
        },
        responses: {
            201: { content: { "application/json": { schema: MemberResponseSchema } }, description: "Member invited" },
            400: { content: { "application/json": { schema: ErrorSchema } }, description: "Error" },
        },
    }),
    async (c) => {
        try {
            const { id } = c.req.valid("param");
            const { email } = c.req.valid("json");
            return c.json(await c.get("memberService").inviteMember(id, c.get("userId"), email), 201);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// ─── Remove Member ─────────────────────────────────────────────────
app.openapi(
    createRoute({
        method: "delete", path: "/api/projects/{id}/members/{targetUserId}", tags: ["Members"],
        request: { params: z.object({ id: z.string(), targetUserId: z.string() }) },
        responses: {
            200: { content: { "application/json": { schema: MessageSchema } }, description: "Removed" },
            400: { content: { "application/json": { schema: ErrorSchema } }, description: "Error" },
        },
    }),
    async (c) => {
        try {
            const { id, targetUserId } = c.req.valid("param");
            await c.get("memberService").removeMember(id, c.get("userId"), targetUserId);
            return c.json({ message: "Member removed" }, 200);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

export default app;
