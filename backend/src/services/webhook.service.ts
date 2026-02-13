import type { IWebhookRepository } from "../repositories/interfaces";
import { generateId, now } from "../utils/id";
import type { WebhookSelect } from "../db/schema";

export class WebhookService {
    constructor(private webhookRepo: IWebhookRepository) { }

    async listWebhooks(projectId: string): Promise<WebhookSelect[]> {
        return this.webhookRepo.findByProjectId(projectId);
    }

    async createWebhook(projectId: string, url: string, events: string[]): Promise<WebhookSelect> {
        return this.webhookRepo.create({
            id: generateId(),
            projectId,
            url,
            events: JSON.stringify(events),
            active: true,
            createdAt: now(),
        });
    }

    async deleteWebhook(id: string): Promise<void> {
        await this.webhookRepo.delete(id);
    }

    async trigger(projectId: string, event: string, payload: any): Promise<void> {
        const webhooks = await this.webhookRepo.findByProjectId(projectId);

        // Fire and forget
        for (const webhook of webhooks) {
            if (!webhook.active) continue;

            try {
                const events = JSON.parse(webhook.events) as string[];
                if (events.includes("*") || events.includes(event)) {
                    this.sendWebhook(webhook.url, event, payload);
                }
            } catch (e) {
                console.error(`Error processing webhook ${webhook.id}`, e);
            }
        }
    }

    private async sendWebhook(url: string, event: string, payload: any) {
        try {
            await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event,
                    payload,
                    timestamp: new Date().toISOString()
                }),
            });
        } catch (e) {
            console.error(`Failed to send webhook to ${url}`, e);
        }
    }
}
