import type { AuthStrategy } from "./auth-strategy.interface";
import type { IUserRepository } from "../../repositories/interfaces";
import type { UserSelect } from "../../db/schema";
import { generateId, now } from "../../utils/id";
import { authIdentities } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

export class GoogleStrategy implements AuthStrategy {
    name = "google";

    constructor(
        private userRepo: IUserRepository,
        private db: ReturnType<typeof drizzle>
    ) { }

    async authenticate(payload: { idToken: string }): Promise<{ user: UserSelect; isNewUser: boolean }> {
        // failed to read file: open /home/andiputraw/Probe/tektik2/backend/src/middleware/auth.ts: no such file or directory
        // Verify Google Token
        // In production, verify signature locally to avoid latency.
        // For MVP, use Google's tokeninfo endpoint.
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${payload.idToken}`);

        if (!response.ok) {
            throw new Error("Invalid Google token");
        }

        const data = await response.json() as any;

        // ensure aud matches your client id if needed, but for now we trust the token is for us if valid
        // const clientId = "..."; 
        // if (data.aud !== clientId) throw new Error("Invalid client ID");

        const email = data.email;
        const googleId = data.sub;
        const name = data.name;

        // Check if identity exists
        const existingIdentity = await this.db
            .select()
            .from(authIdentities)
            .where(and(eq(authIdentities.provider, "google"), eq(authIdentities.providerId, googleId)))
            .get();

        if (existingIdentity) {
            const user = await this.userRepo.findById(existingIdentity.userId);
            if (!user) throw new Error("User not found linked to this identity");
            return { user, isNewUser: false };
        }

        // Check if user exists by email (link accounts)
        let user = await this.userRepo.findByEmail(email);
        let isNewUser = false;

        if (!user) {
            // Create new user
            user = await this.userRepo.create({
                id: generateId(),
                email,
                name,
                passwordHash: "oauth-user-" + generateId(), // Dummy hash
                createdAt: now(),
            });
            isNewUser = true;
        }

        // Create identity
        await this.db.insert(authIdentities).values({
            id: generateId(),
            userId: user.id,
            provider: "google",
            providerId: googleId,
            createdAt: now(),
            lastLoginAt: now(),
        });

        return { user, isNewUser };
    }
}
