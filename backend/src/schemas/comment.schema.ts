import { z } from "@hono/zod-openapi";

export const CreateCommentSchema = z.object({
    content: z.string().min(1).openapi({ example: "This looks great!" }),
});

export const UpdateCommentSchema = z.object({
    content: z.string().min(1).openapi({ example: "Updated comment content" }),
});

export const CommentResponseSchema = z
    .object({
        id: z.string(),
        taskId: z.string(),
        authorId: z.string(),
        content: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
        authorName: z.string().optional(),
    })
    .openapi("Comment");

export const CommentListSchema = z.array(CommentResponseSchema).openapi("CommentList");
