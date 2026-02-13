import type {
    IUserRepository,
    IProjectRepository,
    IProjectMemberRepository,
    IStatusRepository,
    ITaskRepository,
    ICommentRepository,
    INotificationRepository,
} from "../src/repositories/interfaces";
import { vi } from "vitest";

// ─── Factory helpers ─────────────────────────────────────────────────

export function mockUserRepo(overrides: Partial<IUserRepository> = {}): IUserRepository {
    return {
        findById: vi.fn().mockResolvedValue(undefined),
        findByEmail: vi.fn().mockResolvedValue(undefined),
        create: vi.fn().mockImplementation(async (u) => u),
        ...overrides,
    };
}

export function mockProjectRepo(overrides: Partial<IProjectRepository> = {}): IProjectRepository {
    return {
        findById: vi.fn().mockResolvedValue(undefined),
        findByUserId: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockImplementation(async (p) => p),
        update: vi.fn().mockImplementation(async (_id, data) => data),
        delete: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

export function mockMemberRepo(overrides: Partial<IProjectMemberRepository> = {}): IProjectMemberRepository {
    return {
        findByProjectId: vi.fn().mockResolvedValue([]),
        findByUserAndProject: vi.fn().mockResolvedValue(undefined),
        create: vi.fn().mockImplementation(async (m) => m),
        delete: vi.fn().mockResolvedValue(undefined),
        deleteByUserAndProject: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

export function mockStatusRepo(overrides: Partial<IStatusRepository> = {}): IStatusRepository {
    return {
        findByProjectId: vi.fn().mockResolvedValue([]),
        findById: vi.fn().mockResolvedValue(undefined),
        create: vi.fn().mockImplementation(async (s) => s),
        update: vi.fn().mockImplementation(async (_id, data) => data),
        delete: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

export function mockTaskRepo(overrides: Partial<ITaskRepository> = {}): ITaskRepository {
    return {
        findByProjectId: vi.fn().mockResolvedValue([]),
        findById: vi.fn().mockResolvedValue(undefined),
        create: vi.fn().mockImplementation(async (t) => t),
        update: vi.fn().mockImplementation(async (_id, data) => data),
        delete: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

export function mockCommentRepo(overrides: Partial<ICommentRepository> = {}): ICommentRepository {
    return {
        findByTaskId: vi.fn().mockResolvedValue([]),
        findById: vi.fn().mockResolvedValue(undefined),
        create: vi.fn().mockImplementation(async (c) => c),
        update: vi.fn().mockImplementation(async (_id, data) => data),
        delete: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

export function mockNotificationRepo(overrides: Partial<INotificationRepository> = {}): INotificationRepository {
    return {
        findByUserId: vi.fn().mockResolvedValue([]),
        findById: vi.fn().mockResolvedValue(undefined),
        create: vi.fn().mockImplementation(async (n) => n),
        markAsRead: vi.fn().mockResolvedValue(undefined),
        markAllAsRead: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

// ─── Fixture data ────────────────────────────────────────────────────

export const fakeUser = {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    passwordHash: "fakehash",
    createdAt: "2026-01-01T00:00:00.000Z",
};

export const fakeUser2 = {
    id: "user-2",
    email: "other@example.com",
    name: "Other User",
    passwordHash: "fakehash2",
    createdAt: "2026-01-01T00:00:00.000Z",
};

export const fakeProject = {
    id: "proj-1",
    name: "Test Project",
    description: "desc",
    ownerId: "user-1",
    archived: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
};

export const fakeOwnerMember = {
    id: "member-1",
    projectId: "proj-1",
    userId: "user-1",
    role: "owner",
    createdAt: "2026-01-01T00:00:00.000Z",
};

export const fakeRegularMember = {
    id: "member-2",
    projectId: "proj-1",
    userId: "user-2",
    role: "member",
    createdAt: "2026-01-01T00:00:00.000Z",
};

export const fakeTask = {
    id: "task-1",
    projectId: "proj-1",
    statusId: "status-1",
    assigneeId: null,
    title: "Test Task",
    description: "desc",
    dueDate: null,
    position: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
};

export const fakeComment = {
    id: "comment-1",
    taskId: "task-1",
    authorId: "user-1",
    content: "A comment",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
};
