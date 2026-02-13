import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import type { UserSelect, UserInsert } from "../db/schema";
import type { Database, IUserRepository } from "./interfaces";

export class UserRepository implements IUserRepository {
    constructor(private db: Database) { }

    async findById(id: string): Promise<UserSelect | undefined> {
        const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
        return result[0];
    }

    async findByEmail(email: string): Promise<UserSelect | undefined> {
        const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
        return result[0];
    }

    async create(user: UserInsert): Promise<UserSelect> {
        const result = await this.db.insert(users).values(user).returning();
        return result[0];
    }
}
