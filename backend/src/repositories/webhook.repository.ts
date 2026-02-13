import type { IWebhookRepository, Database } from "./interfaces";
import type { WebhookSelect, WebhookInsert } from "../db/schema";
import { webhooks } from "../db/schema";
import { eq } from "drizzle-orm";

export class WebhookRepository implements IWebhookRepository {
    constructor(private db: Database) { }

    async findByProjectId(projectId: string): Promise<WebhookSelect[]> {
        return this.db.select().from(webhooks).where(eq(webhooks.projectId, projectId)).all();
    }

    async create(webhook: WebhookInsert): Promise<WebhookSelect> {
        const result = await this.db.insert(webhooks).values(webhook).returning().get();
        return result;
    }

    async delete(id: string): Promise<void> {
        await this.db.delete(webhooks).where(eq(webhooks.id, id));
    }
}
