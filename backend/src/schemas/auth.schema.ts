import { z } from "@hono/zod-openapi";

export const RegisterSchema = z.object({
    email: z.string().email().openapi({ example: "user@example.com" }),
    name: z.string().min(1).openapi({ example: "John Doe" }),
    password: z.string().min(6).openapi({ example: "password123" }),
});

export const LoginSchema = z.object({
    email: z.string().email().openapi({ example: "user@example.com" }),
    password: z.string().min(1).openapi({ example: "password123" }),
});

export const UserResponseSchema = z
    .object({
        id: z.string(),
        email: z.string(),
        name: z.string(),
        createdAt: z.string(),
    })
    .openapi("User");

export const AuthResponseSchema = z
    .object({
        user: UserResponseSchema,
        message: z.string(),
    })
    .openapi("AuthResponse");

export const ErrorSchema = z
    .object({
        error: z.string(),
    })
    .openapi("Error");

export const MessageSchema = z
    .object({
        message: z.string(),
    })
    .openapi("Message");
