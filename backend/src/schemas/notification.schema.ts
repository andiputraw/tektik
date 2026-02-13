import { z } from "@hono/zod-openapi";

export const NotificationResponseSchema = z
    .object({
        id: z.string(),
        userId: z.string(),
        type: z.string(),
        message: z.string(),
        data: z.string().nullable(),
        read: z.number(),
        createdAt: z.string(),
    })
    .openapi("Notification");

export const NotificationListSchema = z.array(NotificationResponseSchema).openapi("NotificationList");
