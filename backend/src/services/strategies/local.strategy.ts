import type { AuthStrategy } from "./auth-strategy.interface";
import type { IUserRepository } from "../../repositories/interfaces";
import type { UserSelect } from "../../db/schema";
import { verifyPassword } from "../../utils/password";

export class LocalStrategy implements AuthStrategy {
    name = "local";

    constructor(
        private userRepo: IUserRepository
    ) { }

    async authenticate(payload: { email: string; password: string }): Promise<{ user: UserSelect; isNewUser: boolean }> {
        const user = await this.userRepo.findByEmail(payload.email);
        if (!user) {
            throw new Error("Invalid email or password");
        }

        const valid = await verifyPassword(payload.password, user.passwordHash);
        if (!valid) {
            throw new Error("Invalid email or password");
        }

        return { user, isNewUser: false };
    }
}
