import { z } from "@hono/zod-openapi";

export const CreateStatusSchema = z.object({
    name: z.string().min(1).openapi({ example: "In Review" }),
    position: z.number().optional().openapi({ example: 2 }),
});

export const UpdateStatusSchema = z.object({
    name: z.string().min(1).optional(),
    position: z.number().optional(),
});

export const StatusResponseSchema = z
    .object({
        id: z.string(),
        projectId: z.string(),
        name: z.string(),
        position: z.number(),
    })
    .openapi("Status");

export const StatusListSchema = z.array(StatusResponseSchema).openapi("StatusList");
