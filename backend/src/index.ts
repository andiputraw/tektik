import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import { getCookie } from "hono/cookie";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./db/schema";
import type { AppEnv } from "./types";

// Repositories
import { UserRepository } from "./repositories/user.repository";
import { ProjectRepository } from "./repositories/project.repository";
import { ProjectMemberRepository } from "./repositories/project-member.repository";
import { StatusRepository } from "./repositories/status.repository";
import { TaskRepository } from "./repositories/task.repository";
import { CommentRepository } from "./repositories/comment.repository";
import { NotificationRepository } from "./repositories/notification.repository";

// Services
import { AuthService } from "./services/auth.service";
import { ProjectService } from "./services/project.service";
import { MemberService } from "./services/member.service";
import { TaskService } from "./services/task.service";
import { StatusService } from "./services/status.service";
import { CommentService } from "./services/comment.service";
import { NotificationService } from "./services/notification.service";
import { WebhookService } from "./services/webhook.service";
import { GoogleStrategy } from "./services/strategies/google.strategy";
import { LocalStrategy } from "./services/strategies/local.strategy";
import { WebhookRepository } from "./repositories/webhook.repository";

// Routes
import authRoutes from "./routes/auth.routes";
import projectRoutes from "./routes/project.routes";
import taskRoutes from "./routes/task.routes";
import statusRoutes from "./routes/status.routes";
import commentRoutes from "./routes/comment.routes";
import notificationRoutes from "./routes/notification.routes";
import webhookRoutes from "./routes/webhook.routes";

const app = new OpenAPIHono<AppEnv>();

// ─── CORS ────────────────────────────────────────────────────────────
app.use(
  "*",
  cors({
    origin: (origin) => origin || "*",
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

// ─── DI Wiring (per-request) ────────────────────────────────────────
app.use("/api/*", async (c, next) => {
  const db = drizzle(c.env.DB, { schema });

  if (!c.env.PROJECT_BOARD) {
    return c.json({ error: "PROJECT_BOARD not found" }, 500);
  }

  const userRepo = new UserRepository(db);
  const projectRepo = new ProjectRepository(db);
  const memberRepo = new ProjectMemberRepository(db);
  const statusRepo = new StatusRepository(db);
  const taskRepo = new TaskRepository(db);
  const commentRepo = new CommentRepository(db);
  const notificationRepo = new NotificationRepository(db);
  const webhookRepo = new WebhookRepository(db);

  const authService = new AuthService(userRepo, c.env.JWT_SECRET);
  authService.registerStrategy(new LocalStrategy(userRepo));
  authService.registerStrategy(new GoogleStrategy(userRepo, db));
  c.set("authService", authService);

  const webhookService = new WebhookService(webhookRepo);
  const projectService = new ProjectService(projectRepo, memberRepo, statusRepo);
  const memberService = new MemberService(memberRepo, userRepo, notificationRepo); // Update member service?
  const taskService = new TaskService(taskRepo, memberRepo, notificationRepo, userRepo, c.env.PROJECT_BOARD, webhookService);
  const commentService = new CommentService(commentRepo, taskRepo, memberRepo, notificationRepo, c.env.PROJECT_BOARD, webhookService); // Update comment service

  c.set("webhookService", webhookService);
  c.set("projectService", projectService);
  c.set("memberService", memberService);
  c.set("taskService", taskService);
  c.set("statusService", new StatusService(statusRepo, memberRepo));
  c.set("commentService", commentService);
  c.set("notificationService", new NotificationService(notificationRepo));

  await next();
});

// ─── Auth Middleware (for protected routes) ──────────────────────────
async function requireAuth(c: any, next: any) {
  const token = getCookie(c, "token");
  if (!token) return c.json({ error: "Unauthorized" }, 401);
  try {
    const userId = await c.get("authService").verifyToken(token);
    c.set("userId", userId);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
}

// Apply auth middleware to protected routes
app.use("/api/auth/me", requireAuth);
app.use("/api/projects/*", requireAuth);
app.use("/api/projects", requireAuth);
app.use("/api/tasks/*", requireAuth);
app.use("/api/statuses/*", requireAuth);
app.use("/api/comments/*", requireAuth);
app.use("/api/notifications/*", requireAuth);
app.use("/api/notifications", requireAuth);

// WebSocket Route (Upgrade)
app.get("/api/projects/:id/ws", async (c) => {
  const upgradeHeader = c.req.header("Upgrade");
  if (!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket") {
    return c.text("Expected Upgrade: websocket", 426);
  }

  // Auth check: ideally we check cookie or query param token here
  // Since we are inside Hono, we can reuse auth middleware logic if mapped correctly
  // But standard fetch doesn't send cookies for WS easily in all clients.
  // For now, let's assume cookie auth works (browser)

  // Check if user has access to project
  const projectId = c.req.param("id");

  // We can't easily use 'requireAuth' here because it might perform JSON response
  // But let's try manual check if cookie exists
  const token = getCookie(c, "token");
  if (!token) {
    console.log(`WS Connection rejected for project ${projectId}: No token`);
    return c.text("Unauthorized", 401);
  }

  try {
    const userId = await c.get("authService").verifyToken(token);
    // Verify membership
    const member = await c.get("memberService").checkMembership(projectId, userId);
    if (!member) {
      console.log(`WS Connection rejected for project ${projectId}, user ${userId}: Not a member`);
      return c.text("Forbidden", 403);
    }

    // Inspect environment
    console.log("Environment keys:", Object.keys(c.env));
    if (!c.env.PROJECT_BOARD) {
      console.error("CRITICAL: PROJECT_BOARD binding is missing from c.env!");
      return c.text("Internal Server Error: Missing Durable Object binding", 500);
    }

    const id = c.env.PROJECT_BOARD.idFromName(projectId);
    const stub = c.env.PROJECT_BOARD.get(id);
    console.log(`WS Connecting to Durable Object for project ${projectId}`);
    return stub.fetch(c.req.raw);
  } catch (e) {
    console.error(`WS Connection Error for project ${projectId}:`, e);
    return c.text("Unauthorized", 401);
  }
});

// ─── Mount Routes ────────────────────────────────────────────────────
app.route("", authRoutes);
app.route("", projectRoutes);
app.route("", taskRoutes);
app.route("", statusRoutes);
app.route("", commentRoutes);
app.route("", notificationRoutes);
app.use("/api/projects/:projectId/webhooks", requireAuth);
app.use("/api/projects/:projectId/webhooks/*", requireAuth);
app.route("", webhookRoutes);

// ─── OpenAPI Doc & Swagger UI ────────────────────────────────────────
app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Tektik - Project Management API",
    description: "API for the Tektik project management application",
  },
});

app.get("/swagger", swaggerUI({ url: "/doc" }));

// ─── Health Check ────────────────────────────────────────────────────
app.get("/", (c) => c.json({ status: "ok", message: "Tektik API is running" }));

export default app;
export { ProjectBoard } from "./durable-objects/project-board";
