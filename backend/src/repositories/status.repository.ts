import { eq, asc } from "drizzle-orm";
import { statuses } from "../db/schema";
import type { StatusSelect, StatusInsert } from "../db/schema";
import type { Database, IStatusRepository } from "./interfaces";

export class StatusRepository implements IStatusRepository {
    constructor(private db: Database) { }

    async findByProjectId(projectId: string): Promise<StatusSelect[]> {
        return this.db
            .select()
            .from(statuses)
            .where(eq(statuses.projectId, projectId))
            .orderBy(asc(statuses.position));
    }

    async findById(id: string): Promise<StatusSelect | undefined> {
        const result = await this.db.select().from(statuses).where(eq(statuses.id, id)).limit(1);
        return result[0];
    }

    async create(status: StatusInsert): Promise<StatusSelect> {
        const result = await this.db.insert(statuses).values(status).returning();
        return result[0];
    }

    async update(id: string, data: Partial<StatusInsert>): Promise<StatusSelect | undefined> {
        const result = await this.db.update(statuses).set(data).where(eq(statuses.id, id)).returning();
        return result[0];
    }

    async delete(id: string): Promise<void> {
        await this.db.delete(statuses).where(eq(statuses.id, id));
    }
}
