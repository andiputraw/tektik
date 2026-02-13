import { createMiddleware } from "hono/factory";
import type { AuthService } from "../services/auth.service";
import { getCookie } from "hono/cookie";

type Env = {
    Variables: {
        userId: string;
    };
};

export function authMiddleware(authService: AuthService) {
    return createMiddleware<Env>(async (c, next) => {
        const token = getCookie(c, "token");
        if (!token) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        try {
            const userId = await authService.verifyToken(token);
            c.set("userId", userId);
            await next();
        } catch {
            return c.json({ error: "Invalid or expired token" }, 401);
        }
    });
}
