import { eq, desc } from "drizzle-orm";
import { notifications } from "../db/schema";
import type { NotificationSelect, NotificationInsert } from "../db/schema";
import type { Database, INotificationRepository } from "./interfaces";

export class NotificationRepository implements INotificationRepository {
    constructor(private db: Database) { }

    async findByUserId(userId: string): Promise<NotificationSelect[]> {
        return this.db
            .select()
            .from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.createdAt));
    }

    async findById(id: string): Promise<NotificationSelect | undefined> {
        const result = await this.db
            .select()
            .from(notifications)
            .where(eq(notifications.id, id))
            .limit(1);
        return result[0];
    }

    async create(notification: NotificationInsert): Promise<NotificationSelect> {
        const result = await this.db.insert(notifications).values(notification).returning();
        return result[0];
    }

    async markAsRead(id: string): Promise<void> {
        await this.db.update(notifications).set({ read: 1 }).where(eq(notifications.id, id));
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.db
            .update(notifications)
            .set({ read: 1 })
            .where(eq(notifications.userId, userId));
    }
}
