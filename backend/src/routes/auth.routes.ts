import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { setCookie, deleteCookie } from "hono/cookie";
import type { AppEnv } from "../types";
import {
    RegisterSchema,
    LoginSchema,
    UserResponseSchema,
    AuthResponseSchema,
    ErrorSchema,
    MessageSchema,
} from "../schemas/auth.schema";
import { z } from "zod";

const app = new OpenAPIHono<AppEnv>();

// ─── Register ──────────────────────────────────────────────────────
app.openapi(
    createRoute({
        method: "post",
        path: "/api/auth/register",
        tags: ["Auth"],
        request: {
            body: { content: { "application/json": { schema: RegisterSchema } } },
        },
        responses: {
            201: { content: { "application/json": { schema: AuthResponseSchema } }, description: "User registered" },
            400: { content: { "application/json": { schema: ErrorSchema } }, description: "Validation error" },
        },
    }),
    async (c) => {
        try {
            const { email, name, password } = c.req.valid("json");
            const authService = c.get("authService");
            const user = await authService.register(email, name, password);
            const token = await authService.createToken(user.id);

            setCookie(c, "token", token, {
                httpOnly: true,
                secure: true,
                sameSite: "None",
                path: "/",
                maxAge: 7 * 24 * 60 * 60,
            });

            return c.json(
                {
                    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
                    message: "Registered successfully",
                },
                201
            );
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// ─── Login ─────────────────────────────────────────────────────────
app.openapi(
    createRoute({
        method: "post",
        path: "/api/auth/login",
        tags: ["Auth"],
        request: {
            body: { content: { "application/json": { schema: LoginSchema } } },
        },
        responses: {
            200: { content: { "application/json": { schema: AuthResponseSchema } }, description: "Login successful" },
            401: { content: { "application/json": { schema: ErrorSchema } }, description: "Invalid credentials" },
        },
    }),
    async (c) => {
        try {
            const { email, password } = c.req.valid("json");
            const { user, token } = await c.get("authService").login(email, password);

            setCookie(c, "token", token, {
                httpOnly: true,
                secure: true,
                sameSite: "None",
                path: "/",
                maxAge: 7 * 24 * 60 * 60,
            });

            return c.json(
                {
                    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
                    message: "Login successful",
                },
                200
            );
        } catch (e: any) {
            return c.json({ error: e.message }, 401);
        }
    }
);

// ─── Logout ────────────────────────────────────────────────────────
app.openapi(
    createRoute({
        method: "post",
        path: "/api/auth/logout",
        tags: ["Auth"],
        responses: {
            200: { content: { "application/json": { schema: MessageSchema } }, description: "Logged out" },
        },
    }),
    async (c) => {
        deleteCookie(c, "token", { path: "/" });
        return c.json({ message: "Logged out" }, 200);
    }
);

// ─── Me (protected — auth middleware applied in index.ts) ────────
app.openapi(
    createRoute({
        method: "get",
        path: "/api/auth/me",
        tags: ["Auth"],
        responses: {
            200: { content: { "application/json": { schema: UserResponseSchema } }, description: "Current user" },
            401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
        },
    }),
    async (c) => {
        try {
            const user = await c.get("authService").getUser(c.get("userId"));
            return c.json({ id: user.id, email: user.email, name: user.name, createdAt: user.createdAt }, 200);
        } catch (e: any) {
            return c.json({ error: e.message }, 401);
        }
    }
);

// ─── Provider Login (Google, etc.) ─────────────────────────────────
app.openapi(
    createRoute({
        method: "post",
        path: "/api/auth/provider/{provider}",
        tags: ["Auth"],
        request: {
            params: z.object({ provider: z.string().openapi({ param: { name: "provider", in: "path" } }) }),
            body: { content: { "application/json": { schema: z.object({}).passthrough() } } },
        },
        responses: {
            200: { content: { "application/json": { schema: AuthResponseSchema } }, description: "Login successful" },
            400: { content: { "application/json": { schema: ErrorSchema } }, description: "Error" },
        },
    }),
    async (c) => {
        try {
            const provider = c.req.param("provider");
            const payload = c.req.valid("json");
            const { user, token } = await c.get("authService").loginWithProvider(provider, payload);

            setCookie(c, "token", token, {
                httpOnly: true,
                secure: true,
                sameSite: "None",
                path: "/",
                maxAge: 7 * 24 * 60 * 60,
            });

            return c.json(
                {
                    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
                    message: "Login successful",
                },
                200
            );
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

export default app;
