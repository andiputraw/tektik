import { z } from "@hono/zod-openapi";

export const CreateProjectSchema = z.object({
    name: z.string().min(1).openapi({ example: "My Project" }),
    description: z.string().optional().openapi({ example: "A project description" }),
});

export const UpdateProjectSchema = z.object({
    name: z.string().min(1).optional().openapi({ example: "Updated Name" }),
    description: z.string().optional().openapi({ example: "Updated description" }),
    color: z.string().optional().openapi({ example: "#ff0000" }),
});

export const ProjectResponseSchema = z
    .object({
        id: z.string(),
        name: z.string(),
        description: z.string().nullable(),
        color: z.string().nullable().optional(),
        ownerId: z.string(),
        archived: z.number(),
        createdAt: z.string(),
    })
    .openapi("Project");

export const ProjectListSchema = z.array(ProjectResponseSchema).openapi("ProjectList");

export const InviteMemberSchema = z.object({
    email: z.string().email().openapi({ example: "member@example.com" }),
});

export const MemberResponseSchema = z
    .object({
        id: z.string(),
        projectId: z.string(),
        userId: z.string(),
        role: z.string(),
        createdAt: z.string(),
        userName: z.string(),
        userEmail: z.string(),
    })
    .openapi("Member");

export const MemberListSchema = z.array(MemberResponseSchema).openapi("MemberList");
