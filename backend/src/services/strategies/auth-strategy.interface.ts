import type { UserSelect } from "../../db/schema";

export interface AuthStrategy {
    name: string;
    authenticate(payload: any): Promise<{ user: UserSelect; isNewUser: boolean }>;
}
