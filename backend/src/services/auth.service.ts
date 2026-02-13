import type { IUserRepository } from "../repositories/interfaces";
import type { UserSelect } from "../db/schema";
import type { AuthStrategy } from "./strategies/auth-strategy.interface";
import { generateId, now } from "../utils/id";
import { hashPassword, verifyPassword } from "../utils/password";

export class AuthService {
    private strategies: Record<string, AuthStrategy> = {};

    constructor(
        private userRepo: IUserRepository,
        private jwtSecret: string
    ) { }

    registerStrategy(strategy: AuthStrategy) {
        this.strategies[strategy.name] = strategy;
    }

    async loginWithProvider(provider: string, payload: any): Promise<{ user: UserSelect; token: string }> {
        const strategy = this.strategies[provider];
        if (!strategy) {
            throw new Error(`Strategy ${provider} not found`);
        }

        const { user } = await strategy.authenticate(payload);
        const token = await this.createToken(user.id);
        return { user, token };
    }

    async register(email: string, name: string, password: string): Promise<UserSelect> {
        const existing = await this.userRepo.findByEmail(email);
        if (existing) {
            throw new Error("Email already registered");
        }

        const hashed = await hashPassword(password);
        const user = await this.userRepo.create({
            id: generateId(),
            email,
            name,
            passwordHash: hashed,
            createdAt: now(),
        });
        return user;
    }

    async login(email: string, password: string): Promise<{ user: UserSelect; token: string }> {
        // Legacy/Local login direct call
        const user = await this.userRepo.findByEmail(email);
        if (!user) {
            throw new Error("Invalid email or password");
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
            throw new Error("Invalid email or password");
        }

        const token = await this.createToken(user.id);
        return { user, token };
    }

    async getUser(userId: string): Promise<UserSelect> {
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }

    async createToken(userId: string): Promise<string> {
        // Simple JWT implementation using Web Crypto API (available in CF Workers)
        const header = { alg: "HS256", typ: "JWT" };
        const payload = {
            sub: userId,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
        };

        const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
        const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
        const signingInput = `${encodedHeader}.${encodedPayload}`;

        const key = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(this.jwtSecret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );

        const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput));
        const encodedSignature = this.base64UrlEncode(
            String.fromCharCode(...new Uint8Array(signature))
        );

        return `${signingInput}.${encodedSignature}`;
    }

    async verifyToken(token: string): Promise<string> {
        const parts = token.split(".");
        if (parts.length !== 3) throw new Error("Invalid token");

        const [encodedHeader, encodedPayload, encodedSignature] = parts;
        const signingInput = `${encodedHeader}.${encodedPayload}`;

        const key = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(this.jwtSecret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"]
        );

        const signatureBytes = Uint8Array.from(
            atob(encodedSignature.replace(/-/g, "+").replace(/_/g, "/")),
            (c) => c.charCodeAt(0)
        );

        const valid = await crypto.subtle.verify(
            "HMAC",
            key,
            signatureBytes,
            new TextEncoder().encode(signingInput)
        );

        if (!valid) throw new Error("Invalid token signature");

        const payload = JSON.parse(atob(encodedPayload.replace(/-/g, "+").replace(/_/g, "/")));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            throw new Error("Token expired");
        }

        return payload.sub;
    }

    private base64UrlEncode(str: string): string {
        return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }
}
