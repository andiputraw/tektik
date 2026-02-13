import { eq, desc } from "drizzle-orm";
import { comments, users } from "../db/schema";
import type { CommentSelect, CommentInsert } from "../db/schema";
import type { Database, ICommentRepository } from "./interfaces";

export class CommentRepository implements ICommentRepository {
    constructor(private db: Database) { }

    async findByTaskId(taskId: string): Promise<(CommentSelect & { authorName: string })[]> {
        const result = await this.db
            .select({
                id: comments.id,
                taskId: comments.taskId,
                authorId: comments.authorId,
                content: comments.content,
                createdAt: comments.createdAt,
                updatedAt: comments.updatedAt,
                authorName: users.name,
            })
            .from(comments)
            .innerJoin(users, eq(comments.authorId, users.id))
            .where(eq(comments.taskId, taskId))
            .orderBy(desc(comments.createdAt));
        return result;
    }

    async findById(id: string): Promise<CommentSelect | undefined> {
        const result = await this.db.select().from(comments).where(eq(comments.id, id)).limit(1);
        return result[0];
    }

    async create(comment: CommentInsert): Promise<CommentSelect> {
        const result = await this.db.insert(comments).values(comment).returning();
        return result[0];
    }

    async update(id: string, data: Partial<CommentInsert>): Promise<CommentSelect | undefined> {
        const result = await this.db.update(comments).set(data).where(eq(comments.id, id)).returning();
        return result[0];
    }

    async delete(id: string): Promise<void> {
        await this.db.delete(comments).where(eq(comments.id, id));
    }
}
