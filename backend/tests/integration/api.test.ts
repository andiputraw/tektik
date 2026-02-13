/**
 * Integration tests for the Tektik API.
 *
 * These run against a real wrangler dev server with local D1.
 * The server is started by the Docker entrypoint script.
 *
 * Tests are sequential — later tests depend on state created by earlier ones.
 */
import { describe, it, expect, beforeAll } from "vitest";

const BASE = "http://localhost:8787";

// Shared state across sequential tests
let cookie = "";
let cookie2 = "";
let userId = "";
let userId2 = "";
let projectId = "";
let statusTodoId = "";
let statusDoneId = "";
let taskId = "";
let commentId = "";
let notificationId = "";

// ─── Helper ──────────────────────────────────────────────────────────

async function api(
    method: string,
    path: string,
    body?: object,
    authCookie?: string
): Promise<{ status: number; body: any; headers: Headers }> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (authCookie) headers["Cookie"] = authCookie;

    const res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        redirect: "manual",
    });

    const text = await res.text();
    let parsed: any;
    try { parsed = JSON.parse(text); } catch { parsed = text; }

    // Extract Set-Cookie header for auth
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
        const tokenMatch = setCookie.match(/token=([^;]+)/);
        if (tokenMatch) {
            authCookie = `token=${tokenMatch[1]}`;
        }
    }

    return { status: res.status, body: parsed, headers: res.headers };
}

function extractCookie(headers: Headers): string {
    const setCookie = headers.get("set-cookie");
    if (!setCookie) return "";
    const match = setCookie.match(/token=([^;]+)/);
    return match ? `token=${match[1]}` : "";
}

// ─── Tests ───────────────────────────────────────────────────────────

describe("Health Check", () => {
    it("GET / should return ok", async () => {
        const { status, body } = await api("GET", "/");
        expect(status).toBe(200);
        expect(body.status).toBe("ok");
    });
});

describe("Auth API", () => {
    it("POST /api/auth/register — create user 1", async () => {
        const { status, body, headers } = await api("POST", "/api/auth/register", {
            email: "alice@test.com",
            name: "Alice",
            password: "password123",
        });
        expect(status).toBe(201);
        expect(body.user.email).toBe("alice@test.com");
        expect(body.user.name).toBe("Alice");
        expect(body.message).toBe("Registered successfully");

        cookie = extractCookie(headers);
        userId = body.user.id;
        expect(cookie).toBeTruthy();
    });

    it("POST /api/auth/register — duplicate email should fail", async () => {
        const { status, body } = await api("POST", "/api/auth/register", {
            email: "alice@test.com",
            name: "Alice Clone",
            password: "password123",
        });
        expect(status).toBe(400);
        expect(body.error).toContain("already registered");
    });

    it("POST /api/auth/register — create user 2", async () => {
        const { status, body, headers } = await api("POST", "/api/auth/register", {
            email: "bob@test.com",
            name: "Bob",
            password: "password456",
        });
        expect(status).toBe(201);
        cookie2 = extractCookie(headers);
        userId2 = body.user.id;
    });

    it("POST /api/auth/login — wrong password should fail", async () => {
        const { status } = await api("POST", "/api/auth/login", {
            email: "alice@test.com",
            password: "wrong",
        });
        expect(status).toBe(401);
    });

    it("POST /api/auth/login — correct credentials", async () => {
        const { status, body, headers } = await api("POST", "/api/auth/login", {
            email: "alice@test.com",
            password: "password123",
        });
        expect(status).toBe(200);
        expect(body.message).toBe("Login successful");
        cookie = extractCookie(headers);
    });

    it("GET /api/auth/me — returns current user", async () => {
        const { status, body } = await api("GET", "/api/auth/me", undefined, cookie);
        expect(status).toBe(200);
        expect(body.email).toBe("alice@test.com");
        expect(body.id).toBe(userId);
    });

    it("GET /api/auth/me — without cookie should 401", async () => {
        const { status } = await api("GET", "/api/auth/me");
        expect(status).toBe(401);
    });

    it("POST /api/auth/logout", async () => {
        const { status, body } = await api("POST", "/api/auth/logout", undefined, cookie);
        expect(status).toBe(200);
        expect(body.message).toBe("Logged out");
    });

    it("re-login Alice for subsequent tests", async () => {
        const { headers } = await api("POST", "/api/auth/login", {
            email: "alice@test.com",
            password: "password123",
        });
        cookie = extractCookie(headers);
    });
});

describe("Projects API", () => {
    it("GET /api/projects — initially empty", async () => {
        const { status, body } = await api("GET", "/api/projects", undefined, cookie);
        expect(status).toBe(200);
        expect(body).toEqual([]);
    });

    it("POST /api/projects — create project", async () => {
        const { status, body } = await api("POST", "/api/projects", {
            name: "Test Project",
            description: "Integration test project",
        }, cookie);
        expect(status).toBe(201);
        expect(body.name).toBe("Test Project");
        expect(body.ownerId).toBe(userId);
        projectId = body.id;
    });

    it("GET /api/projects — now returns 1 project", async () => {
        const { status, body } = await api("GET", "/api/projects", undefined, cookie);
        expect(status).toBe(200);
        expect(body).toHaveLength(1);
        expect(body[0].id).toBe(projectId);
    });

    it("GET /api/projects/:id — returns project detail", async () => {
        const { status, body } = await api("GET", `/api/projects/${projectId}`, undefined, cookie);
        expect(status).toBe(200);
        expect(body.name).toBe("Test Project");
    });

    it("GET /api/projects/:id — non-member should fail", async () => {
        const { status } = await api("GET", `/api/projects/${projectId}`, undefined, cookie2);
        expect(status).toBe(404);
    });

    it("PUT /api/projects/:id — update project name", async () => {
        const { status, body } = await api("PUT", `/api/projects/${projectId}`, {
            name: "Updated Project",
        }, cookie);
        expect(status).toBe(200);
        expect(body.name).toBe("Updated Project");
    });

    it("DELETE /api/projects/:id — non-owner should fail", async () => {
        // bob is not even a member yet, should fail
        const { status } = await api("DELETE", `/api/projects/${projectId}`, undefined, cookie2);
        expect(status).toBe(400);
    });
});

describe("Statuses API", () => {
    it("GET /api/projects/:id/statuses — should have 3 default statuses", async () => {
        const { status, body } = await api("GET", `/api/projects/${projectId}/statuses`, undefined, cookie);
        expect(status).toBe(200);
        expect(body).toHaveLength(3);

        const names = body.map((s: any) => s.name);
        expect(names).toContain("To Do");
        expect(names).toContain("In Progress");
        expect(names).toContain("Done");

        statusTodoId = body.find((s: any) => s.name === "To Do").id;
        statusDoneId = body.find((s: any) => s.name === "Done").id;
    });

    it("POST /api/projects/:id/statuses — create custom status", async () => {
        const { status, body } = await api("POST", `/api/projects/${projectId}/statuses`, {
            name: "In Review",
            position: 2,
        }, cookie);
        expect(status).toBe(201);
        expect(body.name).toBe("In Review");
    });

    it("GET /api/projects/:id/statuses — now has 4", async () => {
        const { body } = await api("GET", `/api/projects/${projectId}/statuses`, undefined, cookie);
        expect(body).toHaveLength(4);
    });
});

describe("Members API", () => {
    it("GET /api/projects/:id/members — should have owner", async () => {
        const { status, body } = await api("GET", `/api/projects/${projectId}/members`, undefined, cookie);
        expect(status).toBe(200);
        expect(body).toHaveLength(1);
        expect(body[0].role).toBe("owner");
    });

    it("POST /api/projects/:id/members — invite Bob", async () => {
        const { status, body } = await api("POST", `/api/projects/${projectId}/members`, {
            email: "bob@test.com",
        }, cookie);
        expect(status).toBe(201);
        expect(body.role).toBe("member");
    });

    it("POST /api/projects/:id/members — invite duplicate should fail", async () => {
        const { status, body } = await api("POST", `/api/projects/${projectId}/members`, {
            email: "bob@test.com",
        }, cookie);
        expect(status).toBe(400);
        expect(body.error).toContain("already a member");
    });

    it("POST /api/projects/:id/members — non-owner invite should fail", async () => {
        const { status } = await api("POST", `/api/projects/${projectId}/members`, {
            email: "alice@test.com",
        }, cookie2);
        expect(status).toBe(400);
    });

    it("GET /api/projects/:id/members — now has 2 members", async () => {
        const { status, body } = await api("GET", `/api/projects/${projectId}/members`, undefined, cookie);
        expect(status).toBe(200);
        expect(body).toHaveLength(2);
    });

    it("Bob can now access the project", async () => {
        const { status, body } = await api("GET", `/api/projects/${projectId}`, undefined, cookie2);
        expect(status).toBe(200);
        expect(body.id).toBe(projectId);
    });
});

describe("Tasks API", () => {
    it("POST /api/projects/:id/tasks — create task", async () => {
        const { status, body } = await api("POST", `/api/projects/${projectId}/tasks`, {
            title: "First Task",
            description: "Do something important",
            statusId: statusTodoId,
        }, cookie);
        expect(status).toBe(201);
        expect(body.title).toBe("First Task");
        expect(body.statusId).toBe(statusTodoId);
        taskId = body.id;
    });

    it("GET /api/projects/:id/tasks — list tasks", async () => {
        const { status, body } = await api("GET", `/api/projects/${projectId}/tasks`, undefined, cookie);
        expect(status).toBe(200);
        expect(body).toHaveLength(1);
    });

    it("GET /api/tasks/:id — get task detail", async () => {
        const { status, body } = await api("GET", `/api/tasks/${taskId}`, undefined, cookie);
        expect(status).toBe(200);
        expect(body.title).toBe("First Task");
    });

    it("PUT /api/tasks/:id — update task", async () => {
        const { status, body } = await api("PUT", `/api/tasks/${taskId}`, {
            title: "Updated Task Title",
        }, cookie);
        expect(status).toBe(200);
        expect(body.title).toBe("Updated Task Title");
    });

    it("PATCH /api/tasks/:id/status — move task to Done", async () => {
        const { status, body } = await api("PATCH", `/api/tasks/${taskId}/status`, {
            statusId: statusDoneId,
            position: 0,
        }, cookie);
        expect(status).toBe(200);
        expect(body.statusId).toBe(statusDoneId);
    });

    it("PATCH /api/tasks/:id/assign — assign to Bob", async () => {
        const { status, body } = await api("PATCH", `/api/tasks/${taskId}/assign`, {
            assigneeId: userId2,
        }, cookie);
        expect(status).toBe(200);
        expect(body.assigneeId).toBe(userId2);
    });

    it("PATCH /api/tasks/:id/assign — unassign", async () => {
        const { status, body } = await api("PATCH", `/api/tasks/${taskId}/assign`, {
            assigneeId: null,
        }, cookie);
        expect(status).toBe(200);
        expect(body.assigneeId).toBeNull();
    });

    it("GET /api/projects/:id/tasks?statusId= — filter by status", async () => {
        const { status, body } = await api("GET", `/api/projects/${projectId}/tasks?statusId=${statusDoneId}`, undefined, cookie);
        expect(status).toBe(200);
        expect(body).toHaveLength(1);
    });

    it("GET /api/projects/:id/tasks?statusId= — filter returns empty for Todo (task was moved)", async () => {
        const { status, body } = await api("GET", `/api/projects/${projectId}/tasks?statusId=${statusTodoId}`, undefined, cookie);
        expect(status).toBe(200);
        expect(body).toHaveLength(0);
    });
});

describe("Comments API", () => {
    it("POST /api/tasks/:id/comments — add comment", async () => {
        const { status, body } = await api("POST", `/api/tasks/${taskId}/comments`, {
            content: "Looks good to me!",
        }, cookie);
        expect(status).toBe(201);
        expect(body.content).toBe("Looks good to me!");
        commentId = body.id;
    });

    it("GET /api/tasks/:id/comments — list comments", async () => {
        const { status, body } = await api("GET", `/api/tasks/${taskId}/comments`, undefined, cookie);
        expect(status).toBe(200);
        expect(body).toHaveLength(1);
        expect(body[0].content).toBe("Looks good to me!");
    });

    it("PUT /api/comments/:id — update own comment", async () => {
        const { status, body } = await api("PUT", `/api/comments/${commentId}`, {
            content: "Actually, needs work",
        }, cookie);
        expect(status).toBe(200);
        expect(body.content).toBe("Actually, needs work");
    });

    it("PUT /api/comments/:id — cannot edit others comment", async () => {
        const { status } = await api("PUT", `/api/comments/${commentId}`, {
            content: "Hijack",
        }, cookie2);
        expect(status).toBe(400);
    });

    it("DELETE /api/comments/:id — cannot delete others comment", async () => {
        const { status } = await api("DELETE", `/api/comments/${commentId}`, undefined, cookie2);
        expect(status).toBe(400);
    });

    it("DELETE /api/comments/:id — delete own comment", async () => {
        const { status } = await api("DELETE", `/api/comments/${commentId}`, undefined, cookie);
        expect(status).toBe(200);
    });

    it("GET /api/tasks/:id/comments — now empty", async () => {
        const { body } = await api("GET", `/api/tasks/${taskId}/comments`, undefined, cookie);
        expect(body).toHaveLength(0);
    });
});

describe("Notifications API", () => {
    it("GET /api/notifications — Bob should have invite notification", async () => {
        const { status, body } = await api("GET", "/api/notifications", undefined, cookie2);
        expect(status).toBe(200);
        expect(body.length).toBeGreaterThanOrEqual(1);

        const invite = body.find((n: any) => n.type === "project_invite");
        expect(invite).toBeTruthy();
        expect(invite.read).toBe(0);
        notificationId = invite.id;
    });

    it("PATCH /api/notifications/:id/read — mark as read", async () => {
        const { status } = await api("PATCH", `/api/notifications/${notificationId}/read`, undefined, cookie2);
        expect(status).toBe(200);
    });

    it("GET /api/notifications — notification is now read", async () => {
        const { body } = await api("GET", "/api/notifications", undefined, cookie2);
        const n = body.find((x: any) => x.id === notificationId);
        expect(n.read).toBe(1);
    });

    it("PATCH /api/notifications/read-all", async () => {
        const { status } = await api("PATCH", "/api/notifications/read-all", undefined, cookie2);
        expect(status).toBe(200);
    });

    it("Alice has no notifications (she is the actor, not the receiver)", async () => {
        const { status, body } = await api("GET", "/api/notifications", undefined, cookie);
        expect(status).toBe(200);
        // Alice invited Bob and assigned to Bob — she shouldn't get notifications for her own actions
        const inviteNotifs = body.filter((n: any) => n.type === "project_invite");
        expect(inviteNotifs).toHaveLength(0);
    });
});

describe("Members — Removal", () => {
    it("DELETE /api/projects/:id/members/:userId — remove Bob", async () => {
        const { status } = await api("DELETE", `/api/projects/${projectId}/members/${userId2}`, undefined, cookie);
        expect(status).toBe(200);
    });

    it("Bob can no longer access the project", async () => {
        const { status } = await api("GET", `/api/projects/${projectId}`, undefined, cookie2);
        expect(status).toBe(404);
    });
});

describe("Tasks — Deletion", () => {
    it("DELETE /api/tasks/:id — delete the task", async () => {
        const { status } = await api("DELETE", `/api/tasks/${taskId}`, undefined, cookie);
        expect(status).toBe(200);
    });

    it("GET /api/tasks/:id — deleted task returns 404", async () => {
        const { status } = await api("GET", `/api/tasks/${taskId}`, undefined, cookie);
        expect(status).toBe(404);
    });
});

describe("Projects — Deletion", () => {
    it("DELETE /api/projects/:id — owner deletes project", async () => {
        const { status } = await api("DELETE", `/api/projects/${projectId}`, undefined, cookie);
        expect(status).toBe(200);
    });

    it("GET /api/projects — now empty", async () => {
        const { body } = await api("GET", "/api/projects", undefined, cookie);
        expect(body).toHaveLength(0);
    });
});

describe("OpenAPI Documentation", () => {
    it("GET /doc — returns OpenAPI spec", async () => {
        const { status, body } = await api("GET", "/doc");
        expect(status).toBe(200);
        expect(body.openapi).toBe("3.0.0");
        expect(body.info.title).toContain("Tektik");
        expect(Object.keys(body.paths).length).toBeGreaterThan(10);
    });
});
