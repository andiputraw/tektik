import { describe, it, expect, vi } from "vitest";
import { AuthService } from "../src/services/auth.service";
import { mockUserRepo, fakeUser } from "./helpers";

const JWT_SECRET = "test-secret-key-for-unit-tests";

describe("AuthService", () => {
    describe("register", () => {
        it("should create a new user when email is not taken", async () => {
            const userRepo = mockUserRepo();
            const service = new AuthService(userRepo, JWT_SECRET);

            const user = await service.register("new@example.com", "New User", "password123");

            expect(userRepo.findByEmail).toHaveBeenCalledWith("new@example.com");
            expect(userRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: "new@example.com",
                    name: "New User",
                })
            );
            expect(user.email).toBe("new@example.com");
        });

        it("should throw when email is already registered", async () => {
            const userRepo = mockUserRepo({
                findByEmail: vi.fn().mockResolvedValue(fakeUser),
            });
            const service = new AuthService(userRepo, JWT_SECRET);

            await expect(service.register("test@example.com", "Name", "pass123"))
                .rejects.toThrow("Email already registered");
            expect(userRepo.create).not.toHaveBeenCalled();
        });

        it("should store a hashed password, not plaintext", async () => {
            const userRepo = mockUserRepo();
            const service = new AuthService(userRepo, JWT_SECRET);

            await service.register("new@example.com", "Name", "mypassword");

            const createCall = (userRepo.create as any).mock.calls[0][0];
            expect(createCall.passwordHash).not.toBe("mypassword");
            expect(createCall.passwordHash).toContain(":"); // salt:hash format
        });
    });

    describe("login", () => {
        it("should throw when email not found", async () => {
            const userRepo = mockUserRepo();
            const service = new AuthService(userRepo, JWT_SECRET);

            await expect(service.login("no@example.com", "pass"))
                .rejects.toThrow("Invalid email or password");
        });

        it("should throw on wrong password", async () => {
            const userRepo = mockUserRepo();
            const service = new AuthService(userRepo, JWT_SECRET);

            // Register first to get a real password hash
            const registeredUser = await service.register("test@example.com", "Test", "correct");
            (userRepo.findByEmail as any).mockResolvedValue(registeredUser);

            await expect(service.login("test@example.com", "wrong"))
                .rejects.toThrow("Invalid email or password");
        });

        it("should return user and token on correct credentials", async () => {
            const userRepo = mockUserRepo();
            const service = new AuthService(userRepo, JWT_SECRET);

            const registeredUser = await service.register("test@example.com", "Test", "correct");
            (userRepo.findByEmail as any).mockResolvedValue(registeredUser);

            const result = await service.login("test@example.com", "correct");
            expect(result.user.email).toBe("test@example.com");
            expect(result.token).toBeTruthy();
            expect(result.token.split(".")).toHaveLength(3); // JWT format
        });
    });

    describe("JWT token lifecycle", () => {
        it("should create and verify a token roundtrip", async () => {
            const userRepo = mockUserRepo();
            const service = new AuthService(userRepo, JWT_SECRET);

            const token = await service.createToken("user-123");
            const userId = await service.verifyToken(token);

            expect(userId).toBe("user-123");
        });

        it("should reject a tampered token", async () => {
            const userRepo = mockUserRepo();
            const service = new AuthService(userRepo, JWT_SECRET);

            const token = await service.createToken("user-123");
            const tampered = token.slice(0, -5) + "XXXXX";

            await expect(service.verifyToken(tampered))
                .rejects.toThrow();
        });

        it("should reject a token signed with a different secret", async () => {
            const userRepo = mockUserRepo();
            const service1 = new AuthService(userRepo, "secret-1");
            const service2 = new AuthService(userRepo, "secret-2");

            const token = await service1.createToken("user-123");

            await expect(service2.verifyToken(token))
                .rejects.toThrow();
        });
    });

    describe("getUser", () => {
        it("should return user when found", async () => {
            const userRepo = mockUserRepo({
                findById: vi.fn().mockResolvedValue(fakeUser),
            });
            const service = new AuthService(userRepo, JWT_SECRET);

            const user = await service.getUser("user-1");
            expect(user).toEqual(fakeUser);
        });

        it("should throw when user not found", async () => {
            const userRepo = mockUserRepo();
            const service = new AuthService(userRepo, JWT_SECRET);

            await expect(service.getUser("nonexistent"))
                .rejects.toThrow("User not found");
        });
    });
});
