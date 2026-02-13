import { describe, it, expect, vi } from "vitest";
import { TaskService } from "../src/services/task.service";
import {
    mockTaskRepo, mockMemberRepo, mockNotificationRepo, mockUserRepo,
    fakeTask, fakeOwnerMember, fakeRegularMember, fakeUser,
} from "./helpers";

function makeTaskService(overrides: {
    taskRepo?: ReturnType<typeof mockTaskRepo>;
    memberRepo?: ReturnType<typeof mockMemberRepo>;
    notificationRepo?: ReturnType<typeof mockNotificationRepo>;
    userRepo?: ReturnType<typeof mockUserRepo>;
} = {}) {
    return new TaskService(
        overrides.taskRepo ?? mockTaskRepo(),
        overrides.memberRepo ?? mockMemberRepo(),
        overrides.notificationRepo ?? mockNotificationRepo(),
        overrides.userRepo ?? mockUserRepo(),
    );
}

describe("TaskService", () => {
    describe("createTask", () => {
        it("should create task when user is a member", async () => {
            const taskRepo = mockTaskRepo();
            const memberRepo = mockMemberRepo({
                findByUserAndProject: vi.fn().mockResolvedValue(fakeOwnerMember),
            });
            const service = makeTaskService({ taskRepo, memberRepo });

            await service.createTask("proj-1", "user-1", {
                title: "New Task",
                statusId: "status-1",
            });

            expect(taskRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    projectId: "proj-1",
                    title: "New Task",
                    statusId: "status-1",
                    position: 0,
                })
            );
        });

        it("should reject non-member from creating tasks", async () => {
            const service = makeTaskService();

            await expect(service.createTask("proj-1", "stranger", {
                title: "Task", statusId: "s1",
            })).rejects.toThrow("Not a member of this project");
        });
    });

    describe("getTask", () => {
        it("should return task when user is a member", async () => {
            const taskRepo = mockTaskRepo({
                findById: vi.fn().mockResolvedValue(fakeTask),
            });
            const memberRepo = mockMemberRepo({
                findByUserAndProject: vi.fn().mockResolvedValue(fakeOwnerMember),
            });
            const service = makeTaskService({ taskRepo, memberRepo });

            const result = await service.getTask("task-1", "user-1");
            expect(result).toEqual(fakeTask);
        });

        it("should throw when task does not exist", async () => {
            const service = makeTaskService();

            await expect(service.getTask("nonexistent", "user-1"))
                .rejects.toThrow("Task not found");
        });
    });

    describe("moveTask", () => {
        it("should update status and position", async () => {
            const taskRepo = mockTaskRepo({
                findById: vi.fn().mockResolvedValue(fakeTask),
                update: vi.fn().mockResolvedValue({ ...fakeTask, statusId: "status-2", position: 3 }),
            });
            const memberRepo = mockMemberRepo({
                findByUserAndProject: vi.fn().mockResolvedValue(fakeOwnerMember),
            });
            const service = makeTaskService({ taskRepo, memberRepo });

            const result = await service.moveTask("task-1", "user-1", "status-2", 3);

            expect(taskRepo.update).toHaveBeenCalledWith("task-1", {
                statusId: "status-2",
                position: 3,
            });
            expect(result.statusId).toBe("status-2");
        });
    });

    describe("assignTask", () => {
        it("should assign task and notify assignee", async () => {
            const taskRepo = mockTaskRepo({
                findById: vi.fn().mockResolvedValue(fakeTask),
                update: vi.fn().mockResolvedValue({ ...fakeTask, assigneeId: "user-2" }),
            });
            const memberRepo = mockMemberRepo({
                findByUserAndProject: vi.fn().mockResolvedValue(fakeOwnerMember),
            });
            const userRepo = mockUserRepo({
                findById: vi.fn().mockResolvedValue(fakeUser),
            });
            const notificationRepo = mockNotificationRepo();
            const service = makeTaskService({ taskRepo, memberRepo, userRepo, notificationRepo });

            await service.assignTask("task-1", "user-1", "user-2");

            expect(taskRepo.update).toHaveBeenCalledWith("task-1", { assigneeId: "user-2" });
            expect(notificationRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: "user-2",
                    type: "task_assigned",
                })
            );
        });

        it("should not notify when assigning to yourself", async () => {
            const taskRepo = mockTaskRepo({
                findById: vi.fn().mockResolvedValue(fakeTask),
                update: vi.fn().mockResolvedValue({ ...fakeTask, assigneeId: "user-1" }),
            });
            const memberRepo = mockMemberRepo({
                findByUserAndProject: vi.fn().mockResolvedValue(fakeOwnerMember),
            });
            const notificationRepo = mockNotificationRepo();
            const service = makeTaskService({ taskRepo, memberRepo, notificationRepo });

            await service.assignTask("task-1", "user-1", "user-1");

            expect(notificationRepo.create).not.toHaveBeenCalled();
        });

        it("should allow unassigning (null assignee)", async () => {
            const taskRepo = mockTaskRepo({
                findById: vi.fn().mockResolvedValue({ ...fakeTask, assigneeId: "user-2" }),
                update: vi.fn().mockResolvedValue({ ...fakeTask, assigneeId: null }),
            });
            const memberRepo = mockMemberRepo({
                findByUserAndProject: vi.fn().mockResolvedValue(fakeOwnerMember),
            });
            const notificationRepo = mockNotificationRepo();
            const service = makeTaskService({ taskRepo, memberRepo, notificationRepo });

            await service.assignTask("task-1", "user-1", null);

            expect(taskRepo.update).toHaveBeenCalledWith("task-1", { assigneeId: null });
            expect(notificationRepo.create).not.toHaveBeenCalled();
        });
    });

    describe("deleteTask", () => {
        it("should delete task when user is a member", async () => {
            const taskRepo = mockTaskRepo({
                findById: vi.fn().mockResolvedValue(fakeTask),
            });
            const memberRepo = mockMemberRepo({
                findByUserAndProject: vi.fn().mockResolvedValue(fakeOwnerMember),
            });
            const service = makeTaskService({ taskRepo, memberRepo });

            await service.deleteTask("task-1", "user-1");
            expect(taskRepo.delete).toHaveBeenCalledWith("task-1");
        });

        it("should throw when task does not exist", async () => {
            const service = makeTaskService();
            await expect(service.deleteTask("nonexistent", "user-1"))
                .rejects.toThrow("Task not found");
        });
    });
});
