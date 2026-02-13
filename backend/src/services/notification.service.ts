import type { INotificationRepository } from "../repositories/interfaces";
import type { NotificationSelect } from "../db/schema";

export class NotificationService {
    constructor(private notificationRepo: INotificationRepository) { }

    async listNotifications(userId: string): Promise<NotificationSelect[]> {
        return this.notificationRepo.findByUserId(userId);
    }

    async markAsRead(notificationId: string, userId: string): Promise<void> {
        const notification = await this.notificationRepo.findById(notificationId);
        if (!notification) throw new Error("Notification not found");
        if (notification.userId !== userId) throw new Error("Not your notification");
        await this.notificationRepo.markAsRead(notificationId);
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.notificationRepo.markAllAsRead(userId);
    }
}
